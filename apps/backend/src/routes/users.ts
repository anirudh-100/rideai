/**
 * GET  /api/users/:id/profile     — profile + platform history + eligibility flags
 * POST /api/users/:id/onboarding  — save self-reported platforms
 */
import { Hono } from 'hono';
import { z } from 'zod';
import {
  Platform,
  type CouponEligibility,
  type PlatformHistoryEntry,
  type UserProfile,
} from '@rideai/shared';
import { assessEligibility } from '@rideai/ai-core';
import { Prisma, prisma } from '@rideai/db';

/** Parse the User.selfReportedPlatforms JSON column into a typed Platform[]. */
function parsePlatforms(value: unknown): Platform[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set<string>(Object.values(Platform));
  return value.filter((v): v is Platform => typeof v === 'string' && valid.has(v));
}

export const usersRoute = new Hono();

usersRoute.get('/:id/profile', async (c) => {
  const id = c.req.param('id');

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: { platformHistory: true },
    });
  } catch (err) {
    return c.json({ error: `Database error: ${(err as Error).message}` }, 500);
  }
  if (!user) {
    return c.json({ error: `User ${id} not found.` }, 404);
  }

  const lastBookingDate = user.lastBookingDate
    ? user.lastBookingDate.toISOString()
    : null;

  const profile: UserProfile = {
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    city: user.city,
    selfReportedPlatforms: parsePlatforms(user.selfReportedPlatforms),
    totalBookings: user.totalBookings,
    lastBookingDate,
    createdAt: user.createdAt.toISOString(),
  };

  const history: PlatformHistoryEntry[] = user.platformHistory.map((h) => ({
    platform: h.platform as unknown as Platform,
    bookingsCount: h.bookingsCount,
    firstUsedAt: h.firstUsedAt ? h.firstUsedAt.toISOString() : null,
  }));

  const countByPlatform = new Map<Platform, number>(
    history.map((h) => [h.platform, h.bookingsCount]),
  );

  const eligibility: CouponEligibility[] = Object.values(Platform).map((platform) =>
    assessEligibility({
      platform,
      totalBookings: user!.totalBookings,
      lastBookingDate,
      platformBookingsCount: countByPlatform.get(platform) ?? 0,
    }),
  );

  return c.json({ profile, history, eligibility });
});

const OnboardingSchema = z.object({
  platforms: z.array(z.nativeEnum(Platform)),
});

usersRoute.post('/:id/onboarding', async (c) => {
  const id = c.req.param('id');

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body.' }, 400);
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        selfReportedPlatforms: parsed.data.platforms as unknown as Prisma.InputJsonValue,
      },
    });
    return c.json({
      ok: true,
      userId: updated.id,
      selfReportedPlatforms: parsed.data.platforms,
    });
  } catch (err) {
    // Prisma throws P2025 when the record doesn't exist.
    return c.json(
      { error: `Could not update user ${id}: ${(err as Error).message}` },
      404,
    );
  }
});
