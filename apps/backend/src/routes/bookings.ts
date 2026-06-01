/**
 * POST /api/bookings — persist a booking, bump user totals + platform history,
 * record coupon usage, and (optionally) create a Razorpay order.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import {
  BookingStatus,
  Platform,
  ServiceType,
  VehicleType,
  type BookingResult,
} from '@rideai/shared';
import {
  BookingStatus as DbBookingStatus,
  Platform as DbPlatform,
  ServiceType as DbServiceType,
  VehicleType as DbVehicleType,
  prisma,
} from '@rideai/db';
import { createPaymentOrder } from '../lib/payments';

const BodySchema = z.object({
  userId: z.string(),
  platform: z.nativeEnum(Platform),
  serviceType: z.nativeEnum(ServiceType),
  vehicleType: z.nativeEnum(VehicleType).nullish(),
  fromLocation: z.string().min(1),
  toLocation: z.string().nullish(),
  fare: z.number().positive(),
  couponApplied: z.string().nullish(),
  savings: z.number().min(0).optional().default(0),
});

export const bookingsRoute = new Hono();

bookingsRoute.post('/', async (c) => {
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
  const data = parsed.data;

  try {
    // Prisma enums are value-identical to @rideai/shared enums (casts reconcile types).
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        platform: data.platform as unknown as DbPlatform,
        serviceType: data.serviceType as unknown as DbServiceType,
        vehicleType: data.vehicleType
          ? (data.vehicleType as unknown as DbVehicleType)
          : null,
        fromLocation: data.fromLocation,
        toLocation: data.toLocation ?? null,
        fare: data.fare,
        couponApplied: data.couponApplied ?? null,
        savings: data.savings,
        status: BookingStatus.CONFIRMED as unknown as DbBookingStatus,
      },
    });

    await prisma.user.update({
      where: { id: data.userId },
      data: { totalBookings: { increment: 1 }, lastBookingDate: new Date() },
    });

    await prisma.platformHistory.upsert({
      where: {
        userId_platform: {
          userId: data.userId,
          platform: data.platform as unknown as DbPlatform,
        },
      },
      update: { bookingsCount: { increment: 1 } },
      create: {
        userId: data.userId,
        platform: data.platform as unknown as DbPlatform,
        bookingsCount: 1,
        firstUsedAt: new Date(),
      },
    });

    if (data.couponApplied) {
      try {
        await prisma.userCouponUsage.create({
          data: {
            userId: data.userId,
            couponCode: data.couponApplied,
            platform: data.platform as unknown as DbPlatform,
            bookingId: booking.id,
          },
        });
      } catch (usageErr) {
        // Coupon may not exist in the catalogue; log and continue.
        console.warn(
          `bookings: coupon usage not recorded — ${(usageErr as Error).message}`,
        );
      }
    }

    const payment = await createPaymentOrder(data.fare - data.savings);

    const result: BookingResult = {
      bookingId: booking.id,
      userId: booking.userId,
      platform: data.platform,
      serviceType: data.serviceType,
      vehicleType: data.vehicleType ?? null,
      fromLocation: booking.fromLocation,
      toLocation: booking.toLocation,
      fare: booking.fare,
      couponApplied: booking.couponApplied,
      savings: booking.savings,
      status: BookingStatus.CONFIRMED,
      createdAt: booking.createdAt.toISOString(),
    };

    return c.json({ booking: result, payment }, 201);
  } catch (err) {
    return c.json({ error: `Failed to create booking: ${(err as Error).message}` }, 500);
  }
});
