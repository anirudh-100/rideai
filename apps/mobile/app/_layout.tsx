import '../global.css';
// Add the `dark` class to the HTML root on web so NativeWind's class-based
// dark mode (set via --css-interop-darkMode in global.css) actually applies.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

// Sentry init runs at module load so it can capture errors from anywhere in
// the app. No-op on web; no-op on native when EXPO_PUBLIC_SENTRY_DSN missing.
import { Sentry, initSentry } from '../services/sentry';
const sentryEnabled = initSentry();

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthProvider';
import { getInitError } from '../services/supabase';

const BG = '#0A0A14';

/** Animated brand splash overlay shown while auth state loads. */
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
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: BG,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <Animated.Text style={[{ fontSize: 48, color: '#7C7BFF' }, style]}>✦</Animated.Text>
      <Text style={{ marginTop: 8, fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 }}>
        Ride<Text style={{ color: '#7C7BFF' }}>AI</Text>
      </Text>
    </View>
  );
}

/**
 * Auth-aware app shell.
 *
 * The Stack MUST always render on first paint so expo-router's navigator
 * initializes — otherwise router.replace() throws "Attempted to navigate
 * before mounting the Root Layout component". So instead of short-circuiting
 * with <Redirect>, we always render the Stack and:
 *   1. fire router.replace() from useEffect once the navigator is ready
 *   2. overlay an animated Splash while auth state loads (covers the brief
 *      flash of "wrong" content before the redirect lands)
 */
function AppShell() {
  const { ready, isAuthed, authConfigured } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready || !authConfigured) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthed && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthed && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [ready, isAuthed, authConfigured, segments, router]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
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
      {!ready ? <Splash /> : null}
    </View>
  );
}

function RootLayout() {
  // Surface Supabase init errors explicitly (otherwise app silently falls back
  // to demo mode and hides the real problem from anyone debugging).
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
            <AppShell />
          </AuthProvider>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
