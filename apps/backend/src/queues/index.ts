/**
 * BullMQ queues, schedules and workers for RideAI background jobs.
 *
 * - validateCoupons: every 6 hours
 * - scrapeCoupons:   daily at 02:00
 *
 * The API server and the worker process share these definitions; run the
 * workers with `npm run worker`.
 */
import { Queue, Worker, type ConnectionOptions, type Job } from 'bullmq';
import { URL } from 'node:url';
import { env } from '../env';
import { runScrapeCoupons } from '../jobs/scrapeCoupons.job';
import { runValidateCoupons } from '../jobs/validateCoupons.job';

export const VALIDATE_COUPONS_QUEUE = 'validateCoupons';
export const SCRAPE_COUPONS_QUEUE = 'scrapeCoupons';

let cached: ConnectionOptions | null = null;

/**
 * Parsed Redis options for BullMQ. We pass an options object rather than an
 * ioredis instance so BullMQ constructs its own client (avoids cross-package
 * ioredis type-identity issues when BullMQ ships a nested ioredis).
 * BullMQ requires `maxRetriesPerRequest: null` on its connection.
 */
function bullConnection(): ConnectionOptions {
  if (cached) return cached;
  const url = new URL(env.REDIS_URL);
  cached = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
  return cached;
}

export interface RideaiQueues {
  validateCoupons: Queue;
  scrapeCoupons: Queue;
}

export function getQueues(): RideaiQueues {
  const connection = bullConnection();
  return {
    validateCoupons: new Queue(VALIDATE_COUPONS_QUEUE, { connection }),
    scrapeCoupons: new Queue(SCRAPE_COUPONS_QUEUE, { connection }),
  };
}

/** Register the repeatable schedules (idempotent). */
export async function scheduleJobs(): Promise<void> {
  const { validateCoupons, scrapeCoupons } = getQueues();

  await validateCoupons.add(
    'validateCoupons',
    {},
    { repeat: { pattern: '0 */6 * * *' }, removeOnComplete: true, removeOnFail: 100 },
  );

  await scrapeCoupons.add(
    'scrapeCoupons',
    {},
    { repeat: { pattern: '0 2 * * *' }, removeOnComplete: true, removeOnFail: 100 },
  );

  console.log('🗓️  Scheduled: validateCoupons (every 6h), scrapeCoupons (daily 02:00).');
}

/** Start the workers that process both queues. */
export function startWorkers(): Worker[] {
  const connection = bullConnection();

  const validateWorker = new Worker(
    VALIDATE_COUPONS_QUEUE,
    async (_job: Job) => runValidateCoupons(),
    { connection },
  );
  const scrapeWorker = new Worker(
    SCRAPE_COUPONS_QUEUE,
    async (_job: Job) => runScrapeCoupons(),
    { connection },
  );

  for (const worker of [validateWorker, scrapeWorker]) {
    worker.on('failed', (job, err) =>
      console.error(`Job ${job?.name ?? '?'} failed: ${err.message}`),
    );
  }

  return [validateWorker, scrapeWorker];
}
