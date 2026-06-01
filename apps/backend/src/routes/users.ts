/**
 * GET  /api/users/:id/profile     — profile + platform history + eligibility flags
 * POST /api/users/:id/onboarding  — save self-reported platforms
 */
import { Hono } from 'hono';
import { z } from 'zod';
import {
  BookingStatus,
  Platform,
  ServiceType,
  VehicleType,
  type BookingResult,
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

// GET /api/users/:id/bookings — paginated booking history (most recent first).
usersRoute.get('/:id/bookings', async (c) => {
  const id = c.req.param('id');
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)));
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0));

  let bookings;
  try {
    bookings = await prisma.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  } catch (err) {
    return c.json({ error: `Database error: ${(err as Error).message}` }, 500);
  }

  const results: BookingResult[] = bookings.map((b) => ({
    bookingId: b.id,
    userId: b.userId,
    platform: b.platform as unknown as Platform,
    serviceType: b.serviceType as unknown as ServiceType,
    vehicleType: b.vehicleType ? (b.vehicleType as unknown as VehicleType) : null,
    fromLocation: b.fromLocation,
    toLocation: b.toLocation,
    fare: b.fare,
    couponApplied: b.couponApplied,
    savings: b.savings,
    status: b.status as unknown as BookingStatus,
    createdAt: b.createdAt.toISOString(),
  }));

  return c.json({ bookings: results, limit, offset });
});

// PATCH /api/users/:id — update mutable profile fields (name, city, email).
const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  city: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
});

usersRoute.patch('/:id', async (c) => {
  const id = c.req.param('id');

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body.' }, 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'Provide at least one field to update.' }, 400);
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    return c.json({
      ok: true,
      profile: {
        id: updated.id,
        phone: updated.phone,
        email: updated.email,
        name: updated.name,
        city: updated.city,
        totalBookings: updated.totalBookings,
      },
    });
  } catch (err) {
    return c.json(
      { error: `Could not update user ${id}: ${(err as Error).message}` },
      404,
    );
  }
});

// POST /api/users — upsert user (used by Supabase Auth sign-in to create a
// User row keyed by the Supabase UUID when they sign in for the first time).
const UpsertSchema = z.object({
  id: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email().nullish(),
  name: z.string().nullish(),
  city: z.string().nullish(),
});

usersRoute.post('/', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = UpsertSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body.' }, 400);
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: parsed.data.id },
      update: {
        phone: parsed.data.phone,
        // Only overwrite name/city/email if explicitly provided.
        ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
      },
      create: {
        id: parsed.data.id,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        name: parsed.data.name ?? null,
        city: parsed.data.city ?? null,
      },
    });
    return c.json({ ok: true, userId: user.id });
  } catch (err) {
    return c.json(
      { error: `Could not upsert user: ${(err as Error).message}` },
      500,
    );
  }
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
