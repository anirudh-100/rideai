/**
 * Thin JSON cache over Redis for platform price quotes. No-ops gracefully when
 * Redis is unavailable.
 */
import type { PlatformPrice } from '@rideai/shared';
import { getRedis } from './redis';

export async function getCachedPrices(key: string): Promise<PlatformPrice[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as PlatformPrice[]) : null;
  } catch {
    return null;
  }
}

export async function setCachedPrices(
  key: string,
  prices: PlatformPrice[],
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(prices), 'EX', ttlSeconds);
  } catch {
    /* caching is best-effort */
  }
}
