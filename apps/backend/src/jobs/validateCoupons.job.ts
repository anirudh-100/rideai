/**
 * validateCoupons job — re-checks every active coupon via the coupon validator,
 * updates each coupon's lastVerified + a moving-average successRate in the DB,
 * and caches the latest validity in Redis. Scheduled every 6 hours.
 */
import { Platform } from '@rideai/shared';
import { prisma } from '@rideai/db';
import { validateCoupon } from '@rideai/scrapers';
import { getRedis } from '../lib/redis';

const TEST_PICKUP = { lat: 28.6328, lng: 77.2197 }; // Rajiv Chowk

export async function runValidateCoupons(): Promise<{ checked: number; valid: number }> {
  const coupons = await prisma.coupon.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });

  const redis = getRedis();
  let valid = 0;

  for (const coupon of coupons) {
    try {
      const result = await validateCoupon(
        coupon.code,
        coupon.platform as unknown as Platform,
        { pickup: TEST_PICKUP },
      );

      const prevRate = coupon.successRate ?? 0.5;
      const newRate =
        Math.round((0.7 * prevRate + 0.3 * (result.valid ? 1 : 0)) * 100) / 100;

      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { lastVerified: result.checkedAt, successRate: newRate },
      });

      if (redis) {
        try {
          await redis.set(
            `coupon:valid:${coupon.platform}:${coupon.code}`,
            result.valid ? '1' : '0',
            'EX',
            6 * 3600,
          );
        } catch {
          /* cache write is best-effort */
        }
      }

      if (result.valid) valid++;
    } catch (err) {
      console.warn(
        `validateCoupons: ${coupon.code} (${coupon.platform}) failed — ${(err as Error).message}`,
      );
    }
  }

  console.log(`✓ validateCoupons: checked ${coupons.length}, valid ${valid}`);
  return { checked: coupons.length, valid };
}
