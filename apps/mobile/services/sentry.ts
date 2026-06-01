/**
 * Sentry init for mobile — env-gated AND platform-gated.
 *
 * - **Native (iOS/Android):** initializes @sentry/react-native when
 *   EXPO_PUBLIC_SENTRY_DSN is set. Captures JS errors, unhandled rejections,
 *   and native crashes.
 * - **Web:** completely skipped. @sentry/react-native pulls in @sentry/browser
 *   which has a class-inheritance bug under Metro on Expo SDK 51 web target.
 *   Browsers already have console + devtools; we don't need a web Sentry for
 *   this app. If/when we deploy the web bundle to a real domain, swap in
 *   @sentry/browser directly via a web-only build.
 *
 * The import is lazy (require) so the @sentry/react-native module is never
 * loaded on web — avoiding the bundle-time crash.
 */
import { Platform } from 'react-native';

let initialized = false;
type SentryNs = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (err: unknown, ctx?: unknown) => void;
  wrap: <T>(c: T) => T;
};
let cachedSentry: SentryNs | null = null;

function loadSentry(): SentryNs | null {
  if (cachedSentry) return cachedSentry;
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedSentry = require('@sentry/react-native') as SentryNs;
    return cachedSentry;
  } catch {
    return null;
  }
}

export function initSentry(): boolean {
  if (initialized) return true;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;

  const sentry = loadSentry();
  if (!sentry) return false;

  sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enableAutoSessionTracking: true,
  });
  initialized = true;
  return true;
}

/** Lazy proxy — only resolves to the real namespace on native. */
export const Sentry = {
  wrap<T>(component: T): T {
    const s = loadSentry();
    return s ? s.wrap(component) : component;
  },
  captureException(err: unknown, ctx?: unknown): void {
    const s = loadSentry();
    if (s) s.captureException(err, ctx);
  },
};
