/**
 * POST /api/coupons — given { userId, platform, serviceType, fare }, fetch the
 * platform's coupons, filter to those the user is eligible for, compute savings
 * and let the AI picker recommend the best one.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import {
  CouponType,
  DiscountType,
  Platform,
  ServiceType,
  type CouponData,
} from '@rideai/shared';
import {
  assessEligibility,
  computeSavings,
  filterEligibleCoupons,
  pickBestCoupon,
} from '@rideai/ai-core';
import {
  Platform as DbPlatform,
  prisma,
  type Coupon as PrismaCoupon,
} from '@rideai/db';

const BodySchema = z.object({
  userId: z.string(),
  platform: z.nativeEnum(Platform),
  serviceType: z.nativeEnum(ServiceType),
  fare: z.number().positive(),
});

// Prisma enums are value-identical to the @rideai/shared enums; the casts below
// only reconcile their (nominally distinct) TypeScript types.
function toCouponData(c: PrismaCoupon): CouponData {
  return {
    code: c.code,
    platform: c.platform as unknown as Platform,
    type: c.type as unknown as CouponType,
    discountType: c.discountType as unknown as DiscountType,
    discountValue: c.discountValue,
    maxDiscount: c.maxDiscount,
    minFare: c.minFare,
    validFor: (c.validFor ?? null) as unknown as ServiceType | null,
    validForCity: c.validForCity,
    firstOrderOnly: c.firstOrderOnly,
    accountSpecific: c.accountSpecific,
    successRate: c.successRate,
    lastVerified: c.lastVerified ? c.lastVerified.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    source: c.source,
  };
}

export const couponsRoute = new Hono();

couponsRoute.post('/', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body.' }, 400);
  }
  const { userId, platform, serviceType, fare } = parsed.data;

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { platformHistory: true },
    });
  } catch (err) {
    return c.json({ error: `Database error: ${(err as Error).message}` }, 500);
  }
  if (!user) {
    return c.json({ error: `User ${userId} not found.` }, 404);
  }

  const platformHistory = user.platformHistory.find(
    (h) => (h.platform as unknown as Platform) === platform,
  );
  const eligibility = assessEligibility({
    platform,
    totalBookings: user.totalBookings,
    lastBookingDate: user.lastBookingDate ? user.lastBookingDate.toISOString() : null,
    platformBookingsCount: platformHistory?.bookingsCount ?? 0,
  });

  let dbCoupons: PrismaCoupon[];
  try {
    dbCoupons = await prisma.coupon.findMany({
      where: {
        platform: platform as unknown as DbPlatform,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  } catch (err) {
    return c.json({ error: `Database error: ${(err as Error).message}` }, 500);
  }

  const coupons = dbCoupons.map(toCouponData);
  const eligible = filterEligibleCoupons(coupons, eligibility, { city: user.city });

  const ranked = eligible
    .map((coupon) => ({ coupon, savings: computeSavings(coupon, fare) }))
    .filter((x) => x.savings > 0)
    .sort((a, b) => b.savings - a.savings);

  const best = await pickBestCoupon({
    platform,
    serviceType,
    fare,
    city: user.city,
    coupons: eligible,
  });

  return c.json({ eligibility, eligible: ranked, best });
});
