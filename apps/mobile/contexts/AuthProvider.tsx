/**
 * Auth state for the whole mobile app.
 *
 * Two modes:
 * - **Configured** (Supabase env vars present): real phone-OTP auth. `userId`
 *   is the authenticated Supabase user's UUID; `isAuthed` is true after sign-in.
 * - **Demo mode** (Supabase env vars missing): no login required. `userId`
 *   is always `'demo-user'`; `isAuthed` is true automatically. Used for local
 *   dev so the app keeps working without a Supabase project.
 *
 * The exposed `useAuth()` hook is what every screen calls — it never has to
 * know which mode is active.
 */
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setAuthToken, upsertUser } from '../services/api';
import { getSupabase, isAuthConfigured } from '../services/supabase';

const DEMO_USER_ID = 'demo-user';

export interface AuthContextValue {
  /** True once we've checked initial session (avoid flicker on boot). */
  ready: boolean;
  /** True when the user can use the app (either signed in or in demo mode). */
  isAuthed: boolean;
  /** True if real Supabase auth is configured (and therefore enforced). */
  authConfigured: boolean;
  /** Stable user identifier (Supabase UUID, or 'demo-user' in demo mode). */
  userId: string;
  /** Raw Supabase user object, or null in demo mode / not signed in. */
  user: User | null;
  /** Active Supabase JWT, or null. Mobile API client attaches this as Bearer token. */
  accessToken: string | null;
  /** Send a 6-digit code to the given phone (E.164, e.g. "+919000000001"). */
  sendOtp: (phone: string) => Promise<void>;
  /** Verify the code and complete sign-in. */
  verifyOtp: (phone: string, token: string) => Promise<void>;
  /**
   * Single email entry point: tries sign-in first, falls back to sign-up.
   * Resolves with `{ confirmationRequired: true }` if Supabase requires email
   * verification before the new account can sign in (the user must click a
   * link in their inbox to complete signup).
   */
  signInOrSignUpEmail: (
    email: string,
    password: string,
  ) => Promise<{ confirmationRequired: boolean }>;
  /** Sign out and return the app to the login screen. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() called outside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const authConfigured = isAuthConfigured();

  const [ready, setReady] = useState(!authConfigured); // demo mode is immediately ready
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return; // demo mode: nothing to load

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Mirror the session's access token into the axios API client so every
  // subsequent request carries a Bearer header the backend can verify.
  useEffect(() => {
    setAuthToken(session?.access_token ?? null);
  }, [session?.access_token]);

  // On first sign-in, upsert a User row keyed by the Supabase UUID so the rest
  // of the app (bookings, coupons, profile) can foreign-key off it.
  useEffect(() => {
    if (!session?.user) return;
    const u = session.user;
    upsertUser({
      id: u.id,
      phone: u.phone ?? u.email ?? u.id,
      email: u.email ?? null,
    }).catch((err) => {
      console.warn(`AuthProvider: user upsert failed — ${(err as Error).message}`);
    });
  }, [session?.user]);

  const sendOtp = useCallback(
    async (phone: string) => {
      if (!supabase) throw new Error('Auth not configured.');
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw new Error(error.message);
    },
    [supabase],
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      if (!supabase) throw new Error('Auth not configured.');
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw new Error(error.message);
    },
    [supabase],
  );

  const signInOrSignUpEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error('Auth not configured.');

      // 1. Try to sign in as an existing user.
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (!signIn.error) return { confirmationRequired: false };

      // 2. If the error is "invalid credentials", attempt sign-up.
      const isInvalidCreds = /invalid login|invalid credentials/i.test(
        signIn.error.message,
      );
      if (!isInvalidCreds) throw new Error(signIn.error.message);

      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) throw new Error(signUp.error.message);

      // If Supabase emitted a session, we're signed in immediately. Otherwise
      // email confirmation is enabled and the user must click a link.
      return { confirmationRequired: !signUp.data.session };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => {
    if (!authConfigured) {
      return {
        ready: true,
        isAuthed: true,
        authConfigured: false,
        userId: DEMO_USER_ID,
        user: null,
        accessToken: null,
        sendOtp,
        verifyOtp,
        signInOrSignUpEmail,
        signOut,
      };
    }
    return {
      ready,
      isAuthed: !!session,
      authConfigured: true,
      userId: session?.user.id ?? DEMO_USER_ID,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      sendOtp,
      verifyOtp,
      signInOrSignUpEmail,
      signOut,
    };
  }, [authConfigured, ready, session, sendOtp, verifyOtp, signInOrSignUpEmail, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
