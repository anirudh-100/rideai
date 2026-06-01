/**
 * Worker entrypoint: starts the BullMQ workers and registers the repeatable
 * schedules. Run with `npm run worker` (requires Redis).
 */
import { scheduleJobs, startWorkers } from './queues';

async function main(): Promise<void> {
  console.log('👷 Starting RideAI workers…');
  const workers = startWorkers();
  await scheduleJobs();

  const shutdown = async (): Promise<void> => {
    console.log('\nShutting down workers…');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  console.log('✅ Workers running. Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
