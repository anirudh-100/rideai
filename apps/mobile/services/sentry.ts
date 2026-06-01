/**
 * Sentry init for mobile — env-gated. No-op when EXPO_PUBLIC_SENTRY_DSN is missing
 * (so local dev without a Sentry project works fine).
 *
 * Imported once from app/_layout.tsx. Tracks JS errors, unhandled promise
 * rejections and native crashes. Source-map upload requires the Expo config
 * plugin + a Sentry auth token at build time — wire that in EAS later when
 * we're ready to ship production builds.
 */
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): boolean {
  if (initialized) return true;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // 10% perf sampling in prod, full in dev.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Tag the release with the version from app.json so we can filter by build.
    enableAutoSessionTracking: true,
  });
  initialized = true;
  return true;
}

export { Sentry };
