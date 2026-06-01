/**
 * Lazy Supabase client for mobile. Returns `null` (rather than throwing) when
 * EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY are missing — the
 * AuthProvider then falls back to "demo mode" (no login, hardcoded demo-user)
 * so local dev keeps working without a Supabase project.
 *
 * Defensive: createClient is wrapped in try/catch so a misconfigured key
 * (e.g. the new `sb_publishable_*` format being passed to an older SDK that
 * doesn't understand it) doesn't crash the entire React tree with a white
 * screen. We log the error and fall back to demo mode.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;
let lastInitError: string | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cached = null;
    return null;
  }

  try {
    cached = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return cached;
  } catch (err) {
    lastInitError = (err as Error).message;
    console.error(
      `[supabase] createClient failed (will fall back to demo mode): ${lastInitError}`,
    );
    cached = null;
    return null;
  }
}

/** True when the app is configured with Supabase (i.e. real auth is enforced). */
export function isAuthConfigured(): boolean {
  return getSupabase() !== null;
}

/** For diagnostics — surfaces the createClient error to the UI when it failed. */
export function getInitError(): string | null {
  return lastInitError;
}
