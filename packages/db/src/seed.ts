/**
 * Database seed: a few sample users (new / active / inactive) and a spread of
 * coupons across platforms and coupon types. Idempotent — safe to re-run.
 *
 * Imports only from `@prisma/client` (not @rideai/shared) so it runs cleanly
 * under both `tsx` and `ts-node`.
 *
 * Run: `npm run db:seed` (root) or `npm run db:seed` inside packages/db.
 */
import 'dotenv/config';
import {
  BookingStatus,
  CouponType,
  DiscountType,
  Platform,
  PrismaClient,
  ServiceType,
  VehicleType,
} from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

async function seedUsers() {
  // Fixed-id "demo-user" so the mobile session (session.userId = 'demo-user')
  // can book + fetch coupons out of the box. Modelled as an inactive user
  // (returned after >INACTIVE_USER_DAYS) so INACTIVE_USER coupons fire in the demo.
  const demo = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {
      totalBookings: 3,
      lastBookingDate: daysAgo(100),
      city: 'Delhi',
      selfReportedPlatforms: [Platform.UBER, Platform.OLA, Platform.RAPIDO],
    },
    create: {
      id: 'demo-user',
      phone: '+919999900000',
      email: 'demo@rideai.local',
      name: 'Demo User',
      city: 'Delhi',
      selfReportedPlatforms: [Platform.UBER, Platform.OLA, Platform.RAPIDO],
      totalBookings: 3,
      lastBookingDate: daysAgo(100),
    },
  });

  const aarav = await prisma.user.upsert({
    where: { phone: '+919000000001' },
    update: {},
    create: {
      phone: '+919000000001',
      email: 'aarav@example.com',
      name: 'Aarav Sharma',
      city: 'Delhi',
      selfReportedPlatforms: [Platform.UBER, Platform.OLA, Platform.ZOMATO],
      totalBookings: 12,
      lastBookingDate: daysAgo(2),
    },
  });

  const priya = await prisma.user.upsert({
    where: { phone: '+919000000002' },
    update: {},
    create: {
      phone: '+919000000002',
      email: 'priya@example.com',
      name: 'Priya Nair',
      city: 'Bengaluru',
      selfReportedPlatforms: [],
      totalBookings: 0,
      lastBookingDate: null,
    },
  });

  const rohan = await prisma.user.upsert({
    where: { phone: '+919000000003' },
    update: {},
    create: {
      phone: '+919000000003',
      email: 'rohan@example.com',
      name: 'Rohan Mehta',
      city: 'Mumbai',
      selfReportedPlatforms: [Platform.RAPIDO, Platform.SWIGGY, Platform.BLINKIT],
      totalBookings: 5,
      lastBookingDate: daysAgo(45),
    },
  });

  // Platform usage history for the active user.
  for (const [platform, count, firstUsed] of [
    [Platform.UBER, 7, daysAgo(220)],
    [Platform.OLA, 4, daysAgo(90)],
    [Platform.ZOMATO, 1, daysAgo(14)],
  ] as const) {
    await prisma.platformHistory.upsert({
      where: { userId_platform: { userId: aarav.id, platform } },
      update: { bookingsCount: count },
      create: {
        userId: aarav.id,
        platform,
        bookingsCount: count,
        firstUsedAt: firstUsed,
      },
    });
  }

  // A sample completed booking for the active user.
  await prisma.booking.create({
    data: {
      userId: aarav.id,
      platform: Platform.UBER,
      serviceType: ServiceType.RIDE,
      vehicleType: VehicleType.AUTO,
      fromLocation: 'Rajiv Chowk, New Delhi',
      toLocation: 'India Gate, New Delhi',
      fare: 142,
      couponApplied: 'UBERAUTO20',
      savings: 28,
      status: BookingStatus.COMPLETED,
    },
  });

  return { demo, aarav, priya, rohan };
}

interface SeedCoupon {
  code: string;
  platform: Platform;
  type: CouponType;
  validFor: ServiceType | null;
  firstOrderOnly: boolean;
  accountSpecific: boolean;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minFare: number | null;
  validForCity: string | null;
  successRate: number;
  source: string;
}

const COUPONS: SeedCoupon[] = [
  {
    code: 'FIRSTUBER',
    platform: Platform.UBER,
    type: CouponType.NEW_USER,
    validFor: ServiceType.RIDE,
    firstOrderOnly: true,
    accountSpecific: false,
    discountType: DiscountType.PERCENT,
    discountValue: 50,
    maxDiscount: 100,
    minFare: 0,
    validForCity: null,
    successRate: 0.92,
    source: 'couponDunia',
  },
  {
    code: 'UBERAUTO20',
    platform: Platform.UBER,
    type: CouponType.PUBLIC,
    validFor: ServiceType.RIDE,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    maxDiscount: 40,
    minFare: 60,
    validForCity: 'Delhi',
    successRate: 0.81,
    source: 'grabOn',
  },
  {
    code: 'COMEBACK40',
    platform: Platform.UBER,
    type: CouponType.INACTIVE_USER,
    validFor: ServiceType.RIDE,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.PERCENT,
    discountValue: 40,
    maxDiscount: 80,
    minFare: 0,
    validForCity: null,
    successRate: 0.74,
    source: 'couponDunia',
  },
  {
    code: 'OLAGO75',
    platform: Platform.OLA,
    type: CouponType.PUBLIC,
    validFor: ServiceType.RIDE,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.FLAT,
    discountValue: 75,
    maxDiscount: null,
    minFare: 150,
    validForCity: null,
    successRate: 0.68,
    source: 'grabOn',
  },
  {
    code: 'RAPIDO25',
    platform: Platform.RAPIDO,
    type: CouponType.PUBLIC,
    validFor: ServiceType.RIDE,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.PERCENT,
    discountValue: 25,
    maxDiscount: 40,
    minFare: 40,
    validForCity: null,
    successRate: 0.88,
    source: 'couponDunia',
  },
  {
    code: 'WELCOME60',
    platform: Platform.ZOMATO,
    type: CouponType.NEW_USER,
    validFor: ServiceType.FOOD,
    firstOrderOnly: true,
    accountSpecific: false,
    discountType: DiscountType.PERCENT,
    discountValue: 60,
    maxDiscount: 120,
    minFare: 149,
    validForCity: null,
    successRate: 0.9,
    source: 'grabOn',
  },
  {
    code: 'SWIGGYIT100',
    platform: Platform.SWIGGY,
    type: CouponType.SEGMENT,
    validFor: ServiceType.FOOD,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.FLAT,
    discountValue: 100,
    maxDiscount: null,
    minFare: 199,
    validForCity: 'Mumbai',
    successRate: 0.7,
    source: 'couponDunia',
  },
  {
    code: 'ZEPTONEW75',
    platform: Platform.ZEPTO,
    type: CouponType.NEW_USER,
    validFor: ServiceType.QUICK_COMMERCE,
    firstOrderOnly: true,
    accountSpecific: false,
    discountType: DiscountType.FLAT,
    discountValue: 75,
    maxDiscount: null,
    minFare: 99,
    validForCity: null,
    successRate: 0.85,
    source: 'grabOn',
  },
  {
    code: 'BLINKIT50',
    platform: Platform.BLINKIT,
    type: CouponType.PUBLIC,
    validFor: ServiceType.QUICK_COMMERCE,
    firstOrderOnly: false,
    accountSpecific: false,
    discountType: DiscountType.FLAT,
    discountValue: 50,
    maxDiscount: null,
    minFare: 99,
    validForCity: null,
    successRate: 0.79,
    source: 'couponDunia',
  },
];

async function seedCoupons() {
  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code_platform: { code: c.code, platform: c.platform } },
      update: {
        successRate: c.successRate,
        lastVerified: daysAgo(1),
        expiresAt: daysFromNow(30),
      },
      create: {
        code: c.code,
        platform: c.platform,
        type: c.type,
        validFor: c.validFor,
        firstOrderOnly: c.firstOrderOnly,
        accountSpecific: c.accountSpecific,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxDiscount: c.maxDiscount,
        minFare: c.minFare,
        validForCity: c.validForCity,
        successRate: c.successRate,
        lastVerified: daysAgo(1),
        expiresAt: daysFromNow(30),
        source: c.source,
      },
    });
  }
}

async function main() {
  console.log('🌱 Seeding RideAI database…');
  const { demo, aarav, priya, rohan } = await seedUsers();
  await seedCoupons();
  console.log(
    `✅ Seeded users: ${[demo, aarav, priya, rohan].map((u) => u.name).join(', ')}`,
  );
  console.log(`✅ Seeded ${COUPONS.length} coupons.`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
