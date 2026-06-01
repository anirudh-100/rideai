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
// Sentry must be imported first so it can instrument Node internals.
import { Sentry, initSentry } from './lib/sentry';
initSentry();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prisma } from '@rideai/db';
import { env } from './env';
import { isMapsEnabled } from './lib/maps';
import { isAuthEnabled } from './lib/supabaseServer';
import { attachAuth } from './middleware/auth';
import { bookingsRoute } from './routes/bookings';
import { couponsRoute } from './routes/coupons';
import { intentRoute } from './routes/intent';
import { placesRoute } from './routes/places';
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
// Attach userId from Bearer JWT to every request (best-effort). Routes that
// need it strict should apply `requireAuth` from middleware/auth.ts.
app.use('*', attachAuth);
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
app.route('/api/places', placesRoute);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  // Forward to Sentry (no-op when DSN missing).
  try {
    Sentry.captureException(err, {
      tags: { route: c.req.path, method: c.req.method },
      extra: { userId: c.var.userId ?? null },
    });
  } catch {
    /* don't let Sentry itself break the error response */
  }
  return c.json({ error: err.message }, 500);
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 RideAI backend listening on http://localhost:${info.port}`);
  // Integration status banner — see at a glance which env vars are wired.
  console.log('  Integrations:');
  console.log(`    Claude AI:    ${env.ANTHROPIC_API_KEY ? '✓ enabled' : '✗ disabled (intent parsing will 502)'}`);
  console.log(`    Google Maps:  ${isMapsEnabled() ? '✓ enabled' : '✗ disabled (using landmark/pseudo-geocode fallback)'}`);
  console.log(`    Supabase:     ${isAuthEnabled() ? '✓ enabled (auth enforced)' : '✗ disabled (demo-user fallback)'}`);
  console.log(`    Sentry:       ${env.SENTRY_DSN ? '✓ enabled' : '✗ disabled'}`);
  console.log(`    CORS allow:   ${isProd ? (allowedOrigins.length ? allowedOrigins.join(', ') : '(NONE — set ALLOWED_ORIGINS!)') : 'any (dev)'}`);
});

export { app };
