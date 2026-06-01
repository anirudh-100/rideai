/**
 * Deterministic user→coupon eligibility checks. No AI call needed — these are
 * the hard rules the backend applies before (and the AI picker reasons over).
 */
import {
  CouponType,
  INACTIVE_USER_DAYS,
  daysSince,
  type CouponData,
  type CouponEligibility,
  type Platform,
} from '@rideai/shared';

export interface EligibilityInput {
  platform: Platform;
  /** Total bookings the user has made across all platforms. */
  totalBookings: number;
  /** ISO timestamp of the user's last booking (any platform), or null. */
  lastBookingDate: string | null;
  /** Bookings the user has made specifically on `platform`. */
  platformBookingsCount: number;
}

/** Derive eligibility flags for a user on a specific platform. */
export function assessEligibility(input: EligibilityInput): CouponEligibility {
  const days =
    input.lastBookingDate != null ? daysSince(input.lastBookingDate) : null;
  return {
    platform: input.platform,
    isNewUser: input.platformBookingsCount <= 0,
    isInactiveUser: days != null && days >= INACTIVE_USER_DAYS,
    daysSinceLastBooking: days,
    bookingsCount: input.platformBookingsCount,
  };
}

/** True if `coupon` can be applied for a user with these eligibility flags. */
export function isCouponEligible(
  coupon: CouponData,
  eligibility: CouponEligibility,
  ctx?: { city?: string | null },
): boolean {
  // Hard filters first.
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return false;
  }
  if (
    coupon.validForCity &&
    ctx?.city &&
    coupon.validForCity.toLowerCase() !== ctx.city.toLowerCase()
  ) {
    return false;
  }
  // Account-specific coupons can't be applied to an arbitrary user.
  if (coupon.accountSpecific) return false;
  if (coupon.firstOrderOnly && !eligibility.isNewUser) return false;

  switch (coupon.type) {
    case CouponType.NEW_USER:
      return eligibility.isNewUser;
    case CouponType.INACTIVE_USER:
      return eligibility.isInactiveUser;
    case CouponType.ACCOUNT_SPECIFIC:
      return false;
    case CouponType.SEGMENT:
      // Segment membership is decided upstream; allow here.
      return true;
    case CouponType.PUBLIC:
    default:
      return true;
  }
}

/** Filter a list of coupons down to those a user is eligible for. */
export function filterEligibleCoupons(
  coupons: CouponData[],
  eligibility: CouponEligibility,
  ctx?: { city?: string | null },
): CouponData[] {
  return coupons.filter((c) => isCouponEligible(c, eligibility, ctx));
}
