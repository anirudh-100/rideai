/**
 * Lazy ioredis client for caching. Returns null (rather than throwing) when
 * Redis is unreachable, so the request path degrades gracefully.
 */
import Redis from 'ioredis';
import { env } from '../env';

let client: Redis | null = null;
let warned = false;

export function getRedis(): Redis | null {
  if (client) return client;
  try {
    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 2 ? null : 200),
      enableOfflineQueue: false,
    });
    client.on('error', (err) => {
      if (!warned) {
        warned = true;
        console.warn(`⚠️  Redis unavailable (${err.message}); caching disabled.`);
      }
    });
    return client;
  } catch (err) {
    console.warn(`⚠️  Could not create Redis client: ${(err as Error).message}`);
    return null;
  }
}

/** Connection options for BullMQ (separate client; needs maxRetriesPerRequest: null). */
export function bullConnection(): { url: string } {
  return { url: env.REDIS_URL };
}
