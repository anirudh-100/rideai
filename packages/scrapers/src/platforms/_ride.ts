/**
 * Shared ride-scrape pipeline. Each platform file (rapido/ola/uber) is a thin
 * wrapper over this so they expose an identical interface.
 *
 * mock mode → distance-based fare estimates (no network, no ToS risk).
 * live mode → stealth Playwright flow (selectors are TODO; throws until wired).
 */
import {
  Platform,
  getDistanceKm,
  type PlatformPrice,
} from '@rideai/shared';
import { humanDelay, scraperMode } from '../browser';
import { estimateRidePrices } from '../fareModel';

function assertCoord(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`scrapeRidePlatform: ${name} must be a finite number.`);
  }
}

/**
 * Scrape (mock-estimate) ride prices for `platform` between two coordinates.
 * @throws on invalid coordinates, or in live mode until the flow is implemented.
 */
export async function scrapeRidePlatform(
  platform: Platform,
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number,
): Promise<PlatformPrice[]> {
  assertCoord('pickupLat', pickupLat);
  assertCoord('pickupLng', pickupLng);
  assertCoord('dropLat', dropLat);
  assertCoord('dropLng', dropLng);

  const distanceKm = getDistanceKm(
    { lat: pickupLat, lng: pickupLng },
    { lat: dropLat, lng: dropLng },
  );

  // Human-like pacing on every run (mimics network/interaction latency).
  await humanDelay();

  if (scraperMode() === 'live') {
    return liveScrapeRide(platform, { pickupLat, pickupLng, dropLat, dropLng });
  }
  return estimateRidePrices(platform, distanceKm);
}

interface RideCoords {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

/**
 * Real stealth flow — intentionally a stub. Implement the per-platform steps,
 * then remove the throw. The harness pieces you'll need are imported above.
 */
async function liveScrapeRide(
  platform: Platform,
  _coords: RideCoords,
): Promise<PlatformPrice[]> {
  // Fail fast before launching a browser so live mode is opt-in and obvious.
  throw new Error(
    `Live scraping for ${platform} is not implemented. Wire up the flow in ` +
      `liveScrapeRide() (auth via getTestAccount, navigate, set pickup/drop, ` +
      `read fares with humanDelay between actions, close with closeSession), ` +
      `and only against platforms you are authorised to access. ` +
      `Use SCRAPER_MODE=mock for development.`,
  );

  // Intended shape once implemented (kept for reference; unreachable):
  // const account = getTestAccount(platform);
  // const session = await launchStealthBrowser();
  // try {
  //   /* navigate, authenticate with account, enter pickup/drop, scrape fares */
  //   await humanDelay();
  //   return parsedPrices;
  // } finally {
  //   await closeSession(session);
  // }
}
