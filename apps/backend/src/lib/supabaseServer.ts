/**
 * Lazy server-side Supabase client used for JWT verification.
 * Returns null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing — the
 * auth middleware then becomes a no-op (dev mode without Supabase).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

let cached: SupabaseClient | null | undefined;

interface ServerEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

function readServerEnv(): ServerEnv {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getSupabaseServer(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = readServerEnv();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    cached = null;
    return null;
  }

  cached = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** True when the backend can verify Supabase JWTs. */
export function isAuthEnabled(): boolean {
  // Keep env.NODE_ENV reference so this re-reads the live env in tests.
  void env.NODE_ENV;
  return getSupabaseServer() !== null;
}
