/**
 * Uber ride scraper. See `_ride.ts` for the shared pipeline and mode switch.
 */
import { Platform, type PlatformPrice } from '@rideai/shared';
import { scrapeRidePlatform } from './_ride';

/** Compare Uber ride prices between a pickup and drop coordinate. */
export function scrapeUberPrices(
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number,
): Promise<PlatformPrice[]> {
  return scrapeRidePlatform(Platform.UBER, pickupLat, pickupLng, dropLat, dropLng);
}
