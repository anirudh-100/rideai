/**
 * Static lookup tables and tunables shared across RideAI.
 */
import { Platform, ServiceType } from './enums';
import type { Coordinates } from './types';

/** Which platforms participate in each service category. */
export const PLATFORMS_BY_SERVICE: Record<ServiceType, Platform[]> = {
  [ServiceType.RIDE]: [Platform.UBER, Platform.OLA, Platform.RAPIDO],
  [ServiceType.FOOD]: [Platform.ZOMATO, Platform.SWIGGY],
  [ServiceType.QUICK_COMMERCE]: [Platform.ZEPTO, Platform.BLINKIT],
};

export interface PlatformMeta {
  label: string;
  service: ServiceType;
  /** Brand colour for chips/badges. */
  color: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  [Platform.UBER]: { label: 'Uber', service: ServiceType.RIDE, color: '#000000' },
  [Platform.OLA]: { label: 'Ola', service: ServiceType.RIDE, color: '#C7F464' },
  [Platform.RAPIDO]: { label: 'Rapido', service: ServiceType.RIDE, color: '#FFD200' },
  [Platform.ZOMATO]: { label: 'Zomato', service: ServiceType.FOOD, color: '#CB202D' },
  [Platform.SWIGGY]: { label: 'Swiggy', service: ServiceType.FOOD, color: '#FC8019' },
  [Platform.ZEPTO]: { label: 'Zepto', service: ServiceType.QUICK_COMMERCE, color: '#5B2EFF' },
  [Platform.BLINKIT]: { label: 'Blinkit', service: ServiceType.QUICK_COMMERCE, color: '#F8CB46' },
};

/** UI theme tokens (dark) shared with the mobile app's NativeWind config. */
export const THEME = {
  background: '#0F0F1A',
  primary: '#6366F1',
  card: 'rgba(255,255,255,0.05)',
  best: '#22C55E',
  textMuted: '#9CA3AF',
} as const;

/** Redis price-cache TTL in seconds. */
export const PRICE_CACHE_TTL_SECONDS = 180;

/** A user with no booking in this many days is treated as "inactive". */
export const INACTIVE_USER_DAYS = 30;

/**
 * Build the Redis key for a cached price comparison.
 * Format: `prices:{platform}:{from_lat},{from_lng}:{to_lat},{to_lng}`.
 */
export function priceCacheKey(
  platform: Platform,
  from: Coordinates,
  to: Coordinates,
): string {
  const f = `${from.lat},${from.lng}`;
  const t = `${to.lat},${to.lng}`;
  return `prices:${platform}:${f}:${t}`;
}
