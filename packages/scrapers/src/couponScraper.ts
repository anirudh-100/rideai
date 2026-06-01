/**
 * Coupon scraper: discovers coupons for Ola, Uber, Rapido, Zomato and Swiggy
 * from aggregators (CouponDunia, GrabOn).
 *
 * mock mode → a curated, typed list (no network) so the pipeline + DB persist work.
 * live mode → stealth fetch + parse of the aggregators (selectors TODO; throws).
 */
import {
  CouponType,
  DiscountType,
  Platform,
  ServiceType,
  type CouponData,
} from '@rideai/shared';
import { humanDelay, scraperMode } from './browser';

/** Aggregator sources we (would) scrape. */
export const COUPON_SOURCES = {
  couponDunia: 'https://www.coupondunia.in',
  grabOn: 'https://www.grabon.in',
} as const;

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
}

const MOCK_COUPONS: CouponData[] = [
  {
    code: 'FIRSTUBER',
    platform: Platform.UBER,
    type: CouponType.NEW_USER,
    title: '50% off your first Uber',
    description: 'New users only, up to ₹100 off.',
    discountType: DiscountType.PERCENT,
    discountValue: 50,
    maxDiscount: 100,
    minFare: 0,
    validFor: ServiceType.RIDE,
    validForCity: null,
    firstOrderOnly: true,
    accountSpecific: false,
    successRate: 0.92,
    lastVerified: iso(-1),
    expiresAt: iso(30),
    source: 'couponDunia',
  },
  {
    code: 'UBERAUTO20',
    platform: Platform.UBER,
    type: CouponType.PUBLIC,
    title: '20% off Uber Auto',
    description: 'Up to ₹40 off on autos in Delhi.',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    maxDiscount: 40,
    minFare: 60,
    validFor: ServiceType.RIDE,
    validForCity: 'Delhi',
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.81,
    lastVerified: iso(-1),
    expiresAt: iso(20),
    source: 'grabOn',
  },
  {
    code: 'OLAGO75',
    platform: Platform.OLA,
    type: CouponType.PUBLIC,
    title: '₹75 off Ola rides',
    description: 'Flat ₹75 off on rides above ₹150.',
    discountType: DiscountType.FLAT,
    discountValue: 75,
    maxDiscount: null,
    minFare: 150,
    validFor: ServiceType.RIDE,
    validForCity: null,
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.68,
    lastVerified: iso(-2),
    expiresAt: iso(15),
    source: 'grabOn',
  },
  {
    code: 'RAPIDO25',
    platform: Platform.RAPIDO,
    type: CouponType.PUBLIC,
    title: '25% off Rapido',
    description: 'Up to ₹40 off on bikes and autos.',
    discountType: DiscountType.PERCENT,
    discountValue: 25,
    maxDiscount: 40,
    minFare: 40,
    validFor: ServiceType.RIDE,
    validForCity: null,
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.88,
    lastVerified: iso(-1),
    expiresAt: iso(25),
    source: 'couponDunia',
  },
  {
    code: 'WELCOME60',
    platform: Platform.ZOMATO,
    type: CouponType.NEW_USER,
    title: '60% off first Zomato order',
    description: 'New users, up to ₹120 off above ₹149.',
    discountType: DiscountType.PERCENT,
    discountValue: 60,
    maxDiscount: 120,
    minFare: 149,
    validFor: ServiceType.FOOD,
    validForCity: null,
    firstOrderOnly: true,
    accountSpecific: false,
    successRate: 0.9,
    lastVerified: iso(-1),
    expiresAt: iso(30),
    source: 'grabOn',
  },
  {
    code: 'SWIGGYIT100',
    platform: Platform.SWIGGY,
    type: CouponType.SEGMENT,
    title: '₹100 off Swiggy',
    description: 'Flat ₹100 off above ₹199 in Mumbai.',
    discountType: DiscountType.FLAT,
    discountValue: 100,
    maxDiscount: null,
    minFare: 199,
    validFor: ServiceType.FOOD,
    validForCity: 'Mumbai',
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.7,
    lastVerified: iso(-3),
    expiresAt: iso(10),
    source: 'couponDunia',
  },
];

/**
 * Discover coupons across the configured platforms.
 * @throws in live mode until the aggregator parse flow is implemented.
 */
export async function scrapeCoupons(): Promise<CouponData[]> {
  await humanDelay();

  if (scraperMode() === 'live') {
    throw new Error(
      'Live coupon scraping is not implemented. Implement the CouponDunia / ' +
        'GrabOn fetch + parse (per platform page, extract code/discount/terms) ' +
        'using the stealth browser, only where you are authorised to. ' +
        'Use SCRAPER_MODE=mock for development.',
    );
  }

  return MOCK_COUPONS.map((c) => ({ ...c }));
}
