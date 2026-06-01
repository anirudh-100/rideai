/**
 * @rideai/scrapers — Playwright (stealth) bots that return typed
 * `PlatformPrice[]` / `CouponData[]`. Scrapers never touch the DB directly;
 * the backend persists their output.
 *
 * Default `SCRAPER_MODE=mock` returns realistic estimates with no network /
 * ToS exposure. Set `SCRAPER_MODE=live` only against platforms you're
 * authorised to access; live flows are TODO stubs until you wire them.
 */
export { scrapeRapidoPrices } from './platforms/rapido';
export { scrapeOlaPrices } from './platforms/ola';
export { scrapeUberPrices } from './platforms/uber';

export {
  validateCoupon,
  type CouponValidationResult,
  type TestCoords,
} from './couponValidator';
export { scrapeCoupons, COUPON_SOURCES } from './couponScraper';

export {
  scraperMode,
  humanDelay,
  getTestAccount,
  getProxy,
  launchStealthBrowser,
  closeSession,
  type ScraperMode,
  type TestAccount,
  type ProxyConfig,
  type StealthSession,
} from './browser';
