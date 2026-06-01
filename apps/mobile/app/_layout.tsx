import '../global.css';
// Add the `dark` class to the HTML root on web so NativeWind's class-based
// dark mode (set via --css-interop-darkMode in global.css) actually applies.
// Without this, the app renders unstyled on first paint.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

// Sentry init runs at module load so it can capture errors from anywhere in
// the app. No-op on web; no-op on native when EXPO_PUBLIC_SENTRY_DSN missing.
import { Sentry, initSentry } from '../services/sentry';
const sentryEnabled = initSentry();

import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthProvider';
import { getInitError } from '../services/supabase';

const BG = '#0A0A14';

/**
 * Brand splash shown while auth state is still loading.
 * Animated ✦ pulse so cold starts don't feel like a frozen screen.
 */
function Splash() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const style = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
  };
  return (
    <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text style={[{ fontSize: 48, color: '#7C7BFF' }, style]}>✦</Animated.Text>
      <Text style={{ marginTop: 8, fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 }}>
        Ride<Text style={{ color: '#7C7BFF' }}>AI</Text>
      </Text>
    </View>
  );
}

/**
 * Synchronous auth-aware redirect.
 *
 * We render <Redirect /> based on the current segment vs auth state, which
 * happens DURING render (not in a useEffect). This eliminates the flash-of-
 * wrong-route on cold start.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, isAuthed, authConfigured } = useAuth();
  const segments = useSegments();

  // 1. While the initial session check is still running → show splash.
  if (!ready) return <Splash />;

  // 2. Demo mode (no Supabase env) → auth is permissive, render the app.
  if (!authConfigured) return <>{children}</>;

  const inAuthGroup = segments[0] === '(auth)';

  // 3. Signed-out user trying to access a non-auth route → bounce to /login.
  if (!isAuthed && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // 4. Signed-in user sitting on the auth stack → bounce home.
  if (isAuthed && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

function RootLayout() {
  // If Supabase client init failed, surface the error explicitly instead of
  // letting the AuthProvider silently fall back to demo-mode (which would hide
  // the real problem from anyone debugging).
  const supabaseInitError = getInitError();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" />
        {supabaseInitError ? (
          <View style={{ flex: 1, padding: 24, paddingTop: 64, backgroundColor: BG }}>
            <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700' }}>
              Supabase init failed
            </Text>
            <Text style={{ color: '#FCA5A5', fontSize: 13, marginTop: 8 }}>
              {supabaseInitError}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 16 }}>
              Check EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env, then restart Expo.
            </Text>
          </View>
        ) : (
          <AuthProvider>
            <AuthGate>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: BG },
                  headerTintColor: '#FFFFFF',
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: BG },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="welcome"
                  options={{ headerShown: false, presentation: 'modal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen name="results" options={{ title: 'Compare' }} />
                <Stack.Screen name="booking" options={{ title: 'Confirm booking' }} />
              </Stack>
            </AuthGate>
          </AuthProvider>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry's error boundary on native when enabled.
export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
