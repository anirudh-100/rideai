/**
 * Lazy Supabase client for mobile. Returns `null` (rather than throwing) when
 * EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY are missing — the
 * AuthProvider then falls back to "demo mode" (no login, hardcoded demo-user)
 * so local dev keeps working without a Supabase project.
 *
 * In production the env vars are always set (baked into the Expo bundle at
 * build time), so this returns a real client and auth is enforced.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cached = null;
    return null;
  }

  cached = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // we're not using magic-link redirects
    },
  });
  return cached;
}

/** True when the app is configured with Supabase (i.e. real auth is enforced). */
export function isAuthConfigured(): boolean {
  return getSupabase() !== null;
}
