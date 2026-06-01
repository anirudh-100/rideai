/**
 * Sentry init — env-gated. When SENTRY_DSN is missing this is a no-op so the
 * dev server starts without any Sentry config. In prod, set SENTRY_DSN in
 * Render's env vars to start receiving errors.
 *
 * Must be imported BEFORE any other module that might throw (i.e. very early
 * in index.ts) so Sentry's instrumentation can hook into Node internals.
 */
import * as Sentry from '@sentry/node';
import { env } from '../env';

let initialized = false;

export function initSentry(): boolean {
  if (initialized) return true;
  if (!env.SENTRY_DSN) return false;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Performance tracing — 10% sample in prod, full in dev.
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Tag releases so you can filter Sentry errors by deploy.
    release: process.env.RENDER_GIT_COMMIT ?? undefined,
  });
  initialized = true;
  console.log(`✦ Sentry enabled (environment: ${env.NODE_ENV})`);
  return true;
}

/** Re-export the namespace so callers can capture exceptions / set context. */
export { Sentry };
