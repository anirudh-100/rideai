/**
 * Ola ride scraper. See `_ride.ts` for the shared pipeline and mode switch.
 */
import { Platform, type PlatformPrice } from '@rideai/shared';
import { scrapeRidePlatform } from './_ride';

/** Compare Ola ride prices between a pickup and drop coordinate. */
export function scrapeOlaPrices(
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number,
): Promise<PlatformPrice[]> {
  return scrapeRidePlatform(Platform.OLA, pickupLat, pickupLng, dropLat, dropLng);
}
