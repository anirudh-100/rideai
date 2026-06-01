/**
 * Coupon validator: checks whether a coupon still applies and how much it
 * saves, by simulating an apply on a test route/cart.
 *
 * mock mode → deterministic pseudo-validation (no network).
 * live mode → stealth apply flow (TODO; throws until wired).
 */
import type { Coordinates, Platform } from '@rideai/shared';
import { humanDelay, scraperMode } from './browser';

export interface TestCoords {
  pickup: Coordinates;
  drop?: Coordinates;
}

export interface CouponValidationResult {
  code: string;
  platform: Platform;
  valid: boolean;
  /** Rupees saved when applied, 0 when invalid. */
  savings: number;
  checkedAt: Date;
}

/** Stable small hash for deterministic mock results. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Validate a coupon for a platform at a test location.
 * @throws in live mode until the apply flow is implemented.
 */
export async function validateCoupon(
  code: string,
  platform: Platform,
  testCoords: TestCoords,
): Promise<CouponValidationResult> {
  if (!code.trim()) {
    throw new Error('validateCoupon: code must be a non-empty string.');
  }
  void testCoords; // used by the live flow once implemented

  await humanDelay();

  if (scraperMode() === 'live') {
    throw new Error(
      `Live coupon validation for ${platform} is not implemented. ` +
        `Implement the stealth apply-and-read flow (authenticate, enter the ` +
        `code, read the discount, capture the result), only against platforms ` +
        `you are authorised to access. Use SCRAPER_MODE=mock for development.`,
    );
  }

  // Mock: ~90% of codes "valid", with a stable savings figure per code.
  const h = hash(`${code}:${platform}`);
  const valid = h % 10 !== 0;
  const savings = valid ? 20 + (h % 80) : 0;
  return { code, platform, valid, savings, checkedAt: new Date() };
}
