/**
 * Domain enums shared across every RideAI package and app.
 * String values are the single source of truth and MUST match the
 * Prisma enums declared in `packages/db/prisma/schema.prisma`.
 */

/** Top-level category a user request falls into. */
export enum ServiceType {
  RIDE = 'RIDE',
  FOOD = 'FOOD',
  QUICK_COMMERCE = 'QUICK_COMMERCE',
}

/** Third-party platforms RideAI aggregates. */
export enum Platform {
  UBER = 'UBER',
  OLA = 'OLA',
  RAPIDO = 'RAPIDO',
  ZOMATO = 'ZOMATO',
  SWIGGY = 'SWIGGY',
  ZEPTO = 'ZEPTO',
  BLINKIT = 'BLINKIT',
}

/** Ride vehicle categories (rough cross-platform normalisation). */
export enum VehicleType {
  BIKE = 'BIKE',
  AUTO = 'AUTO',
  MINI = 'MINI',
  SEDAN = 'SEDAN',
  SUV = 'SUV',
}

/** How a coupon is targeted / who is eligible for it. */
export enum CouponType {
  /** Anyone can use it. */
  PUBLIC = 'PUBLIC',
  /** First-time users of that platform only. */
  NEW_USER = 'NEW_USER',
  /** Users who have been inactive for a while (win-back). */
  INACTIVE_USER = 'INACTIVE_USER',
  /** Targeted at a behavioural / city segment. */
  SEGMENT = 'SEGMENT',
  /** Tied to a specific account (non-transferable). */
  ACCOUNT_SPECIFIC = 'ACCOUNT_SPECIFIC',
}

/** How a coupon discount is computed. */
export enum DiscountType {
  PERCENT = 'PERCENT',
  FLAT = 'FLAT',
}

/** Lifecycle of a booking RideAI brokered. */
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}
