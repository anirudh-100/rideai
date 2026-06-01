/**
 * Deterministic coupon-savings math, shared by the coupon picker and backend.
 */
import { DiscountType, type CouponData } from '@rideai/shared';

/**
 * Compute the rupee saving a coupon yields on a given fare. Returns 0 if the
 * minimum-fare threshold isn't met. The saving never exceeds the fare itself,
 * and PERCENT discounts are capped at `maxDiscount` when present. Rounded to
 * the nearest rupee.
 */
export function computeSavings(coupon: CouponData, fare: number): number {
  if (!Number.isFinite(fare) || fare <= 0) return 0;
  if (coupon.minFare != null && fare < coupon.minFare) return 0;

  let saving =
    coupon.discountType === DiscountType.PERCENT
      ? (fare * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount != null) {
    saving = Math.min(saving, coupon.maxDiscount);
  }
  saving = Math.min(saving, fare);
  return Math.max(0, Math.round(saving));
}
