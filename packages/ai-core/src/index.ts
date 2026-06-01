/**
 * @rideai/ai-core — Claude-powered intent parsing, coupon picking and result
 * ranking, plus deterministic eligibility/savings helpers.
 *
 * Apps must go through this package for AI; never call the Anthropic SDK directly.
 */
export { CLAUDE_MODEL, getAnthropicClient } from './client';
export { parseIntent } from './intentParser';
export { pickBestCoupon, type CouponPickerInput } from './couponPicker';
export { rankResults, type RankInput } from './resultRanker';
export { computeSavings } from './savings';
export {
  assessEligibility,
  isCouponEligible,
  filterEligibleCoupons,
  type EligibilityInput,
} from './eligibility';
