/**
 * POST /api/prices — accepts an IntentParseResult, geocodes the route, runs the
 * three ride scrapers in parallel (Redis-cached per platform, 180s TTL), attaches
 * the best eligible coupon per variant (when userId is given), sorts by final
 * fare and adds an AI ranking.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import {
  PLATFORMS_BY_SERVICE,
  PRICE_CACHE_TTL_SECONDS,
  CouponType,
  DiscountType,
  Platform,
  ServiceType,
  priceCacheKey,
  type AppliedCoupon,
  type CouponData,
  type LocationRef,
  type PlatformPrice,
} from '@rideai/shared';
import {
  assessEligibility,
  computeSavings,
  filterEligibleCoupons,
  rankResults,
} from '@rideai/ai-core';
import {
  scrapeOlaPrices,
  scrapeRapidoPrices,
  scrapeUberPrices,
} from '@rideai/scrapers';
import {
  Platform as DbPlatform,
  prisma,
  type Coupon as PrismaCoupon,
} from '@rideai/db';
import { getCachedPrices, setCachedPrices } from '../lib/cache';
import { resolveLocation } from '../lib/maps';

const LocationSchema = z.object({
  address: z.string(),
  lat: z.number().nullish(),
  lng: z.number().nullish(),
  placeId: z.string().nullish(),
});

const IntentSchema = z
  .object({
    serviceType: z.nativeEnum(ServiceType),
    from: LocationSchema.nullish(),
    to: LocationSchema.nullish(),
    priority: z.enum(['CHEAPEST', 'FASTEST', 'BALANCED']).optional(),
    /** Optional userId — when given we attach the best eligible coupon per variant. */
    userId: z.string().optional(),
  })
  .passthrough();

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

/** Pick the highest-saving eligible coupon for `fare`. */
function bestCouponFor(
  fare: number,
  eligible: CouponData[],
): { coupon: CouponData; savings: number } | null {
  let best: { coupon: CouponData; savings: number } | null = null;
  for (const coupon of eligible) {
    const savings = computeSavings(coupon, fare);
    if (savings > 0 && (!best || savings > best.savings)) {
      best = { coupon, savings };
    }
  }
  return best;
}

/**
 * Build a per-platform map of coupons the user is eligible for. Returns an
 * empty map (and is silent) when the user can't be looked up — caller treats
 * "no eligible coupons" as a normal, non-fatal outcome.
 */
async function buildEligibleCouponMap(
  userId: string,
  platforms: Platform[],
): Promise<Map<Platform, CouponData[]>> {
  const map = new Map<Platform, CouponData[]>();

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { platformHistory: true },
    });
  } catch (err) {
    console.warn(`prices: user lookup failed — ${(err as Error).message}`);
    return map;
  }
  if (!user) return map;

  let dbCoupons: PrismaCoupon[];
  try {
    dbCoupons = await prisma.coupon.findMany({
      where: {
        platform: { in: platforms as unknown as DbPlatform[] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  } catch (err) {
    console.warn(`prices: coupon lookup failed — ${(err as Error).message}`);
    return map;
  }

  for (const platform of platforms) {
    const platformCoupons = dbCoupons
      .filter((c) => (c.platform as unknown as Platform) === platform)
      .map(toCouponData);
    const platformHistory = user.platformHistory.find(
      (h) => (h.platform as unknown as Platform) === platform,
    );
    const eligibility = assessEligibility({
      platform,
      totalBookings: user.totalBookings,
      lastBookingDate: user.lastBookingDate
        ? user.lastBookingDate.toISOString()
        : null,
      platformBookingsCount: platformHistory?.bookingsCount ?? 0,
    });
    map.set(
      platform,
      filterEligibleCoupons(platformCoupons, eligibility, { city: user.city }),
    );
  }

  return map;
}

/** Apply the best eligible coupon to a price variant, returning a new copy. */
function applyBestCoupon(
  price: PlatformPrice,
  eligible: CouponData[],
): PlatformPrice {
  const best = bestCouponFor(price.fare, eligible);
  if (!best) return price;
  const applied: AppliedCoupon = {
    code: best.coupon.code,
    savings: best.savings,
    verifiedAt: best.coupon.lastVerified ?? null,
  };
  return {
    ...price,
    couponApplied: applied,
    finalFare: Math.max(0, price.fare - best.savings),
  };
}

type RideScraper = (
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number,
) => Promise<PlatformPrice[]>;

const RIDE_SCRAPERS: Partial<Record<Platform, RideScraper>> = {
  [Platform.UBER]: scrapeUberPrices,
  [Platform.OLA]: scrapeOlaPrices,
  [Platform.RAPIDO]: scrapeRapidoPrices,
};

function toRef(loc: z.infer<typeof LocationSchema>): LocationRef {
  return {
    address: loc.address,
    lat: loc.lat ?? undefined,
    lng: loc.lng ?? undefined,
    placeId: loc.placeId ?? undefined,
  };
}

export const pricesRoute = new Hono();

pricesRoute.post('/', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = IntentSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid intent.' }, 400);
  }
  const intent = parsed.data;

  if (intent.serviceType !== ServiceType.RIDE) {
    return c.json({
      results: [],
      ranked: null,
      note: `Price comparison currently supports rides; ${intent.serviceType} support is coming soon.`,
    });
  }
  if (!intent.from || !intent.to) {
    return c.json(
      { error: 'Ride price comparison requires both "from" and "to" locations.' },
      400,
    );
  }

  let fromCoord;
  let toCoord;
  try {
    fromCoord = await resolveLocation(toRef(intent.from));
    toCoord = await resolveLocation(toRef(intent.to));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  const platforms = PLATFORMS_BY_SERVICE[ServiceType.RIDE];
  const settled = await Promise.allSettled(
    platforms.map(async (platform): Promise<PlatformPrice[]> => {
      const scraper = RIDE_SCRAPERS[platform];
      if (!scraper) return [];
      const key = priceCacheKey(platform, fromCoord, toCoord);
      const cached = await getCachedPrices(key);
      if (cached) return cached;
      const prices = await scraper(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);
      await setCachedPrices(key, prices, PRICE_CACHE_TTL_SECONDS);
      return prices;
    }),
  );

  const rawResults: PlatformPrice[] = [];
  const errors: Array<{ platform: Platform; error: string }> = [];
  settled.forEach((outcome, i) => {
    const platform = platforms[i]!;
    if (outcome.status === 'fulfilled') {
      rawResults.push(...outcome.value);
    } else {
      errors.push({ platform, error: (outcome.reason as Error).message });
    }
  });

  // Attach the best eligible coupon per variant when a user is supplied.
  let results: PlatformPrice[] = rawResults;
  if (intent.userId && rawResults.length > 0) {
    const couponMap = await buildEligibleCouponMap(intent.userId, [...platforms]);
    results = rawResults.map((p) => {
      const eligible = couponMap.get(p.platform) ?? [];
      return eligible.length ? applyBestCoupon(p, eligible) : p;
    });
  }

  results.sort((a, b) => (a.finalFare ?? a.fare) - (b.finalFare ?? b.fare));

  let ranked = null;
  if (results.length > 0) {
    try {
      ranked = await rankResults({ results, priority: intent.priority });
    } catch (err) {
      console.warn(`prices: AI ranking skipped — ${(err as Error).message}`);
    }
  }

  return c.json({
    results,
    ranked,
    errors: errors.length ? errors : undefined,
  });
});
