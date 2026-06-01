/**
 * scrapeCoupons job — discovers coupons via the coupon scraper and upserts them
 * into the catalogue. Scheduled daily at 02:00.
 */
import { scrapeCoupons } from '@rideai/scrapers';
import {
  CouponType as DbCouponType,
  DiscountType as DbDiscountType,
  Platform as DbPlatform,
  ServiceType as DbServiceType,
  prisma,
} from '@rideai/db';

export async function runScrapeCoupons(): Promise<{ scraped: number }> {
  const coupons = await scrapeCoupons();

  for (const c of coupons) {
    // shared enums are value-identical to Prisma enums; casts reconcile types.
    const common = {
      type: c.type as unknown as DbCouponType,
      validFor: (c.validFor ?? null) as unknown as DbServiceType | null,
      firstOrderOnly: c.firstOrderOnly,
      accountSpecific: c.accountSpecific,
      discountType: c.discountType as unknown as DbDiscountType,
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount ?? null,
      minFare: c.minFare ?? null,
      validForCity: c.validForCity ?? null,
      successRate: c.successRate ?? null,
      lastVerified: c.lastVerified ? new Date(c.lastVerified) : null,
      expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
      source: c.source ?? null,
    };

    try {
      await prisma.coupon.upsert({
        where: {
          code_platform: {
            code: c.code,
            platform: c.platform as unknown as DbPlatform,
          },
        },
        update: common,
        create: {
          code: c.code,
          platform: c.platform as unknown as DbPlatform,
          ...common,
        },
      });
    } catch (err) {
      console.warn(`scrapeCoupons: upsert ${c.code} failed — ${(err as Error).message}`);
    }
  }

  console.log(`✓ scrapeCoupons: upserted ${coupons.length} coupons`);
  return { scraped: coupons.length };
}
