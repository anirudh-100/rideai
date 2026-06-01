/**
 * RideAI backend — Hono API server.
 *
 * Routes:
 *   POST /api/intent                 parse a prompt → IntentParseResult
 *   POST /api/prices                 compare platform prices (Redis-cached)
 *   POST /api/coupons                rank coupons the user is eligible for
 *   POST /api/bookings               persist a booking + coupon usage
 *   GET  /api/users/:id/profile      profile + history + eligibility
 *   POST /api/users/:id/onboarding   save self-reported platforms
 *
 * Background jobs run in a separate process — see `npm run worker`.
 */
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prisma } from '@rideai/db';
import { env } from './env';
import { bookingsRoute } from './routes/bookings';
import { couponsRoute } from './routes/coupons';
import { intentRoute } from './routes/intent';
import { pricesRoute } from './routes/prices';
import { usersRoute } from './routes/users';

const app = new Hono();

const isProd = env.NODE_ENV === 'production';

// CORS: in dev we accept any origin; in prod we accept only the comma-separated
// ALLOWED_ORIGINS list (so the public API can't be called from arbitrary sites).
const allowedOrigins = (env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!isProd) return origin ?? '*';
      if (!origin) return ''; // non-browser callers (curl) get no CORS header but still work
      return allowedOrigins.includes(origin) ? origin : '';
    },
    credentials: true,
  }),
);

app.get('/', (c) => c.json({ service: 'rideai-backend', status: 'ok', env: env.NODE_ENV }));

// Liveness — process is up.
app.get('/health', (c) => c.json({ ok: true }));

// Readiness — process can serve traffic (DB reachable). Used by load balancers.
app.get('/ready', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ok: true, db: 'up' });
  } catch (err) {
    return c.json({ ok: false, db: 'down', error: (err as Error).message }, 503);
  }
});

app.route('/api/intent', intentRoute);
app.route('/api/prices', pricesRoute);
app.route('/api/coupons', couponsRoute);
app.route('/api/bookings', bookingsRoute);
app.route('/api/users', usersRoute);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: err.message }, 500);
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 RideAI backend listening on http://localhost:${info.port}`);
});

export { app };
