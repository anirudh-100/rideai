import '../global.css';
// Sentry init runs at module load so it can capture errors from anywhere in
// the app. No-op when EXPO_PUBLIC_SENTRY_DSN is missing (dev mode).
import { Sentry, initSentry } from '../services/sentry';
const sentryEnabled = initSentry();

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/AuthProvider';

const BG = '#0A0A14';

// Route gate — kicks signed-out users to /(auth)/login when auth is enforced.
function AuthGate({ children }: { children: React.ReactNode }) {
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

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7C7BFF" size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />
      <AuthProvider>
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: BG },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: BG },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen name="results" options={{ title: 'Compare' }} />
            <Stack.Screen name="booking" options={{ title: 'Confirm booking' }} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Wrap with Sentry's error boundary when enabled so JS crashes are captured
// AND a fallback UI renders instead of a blank screen. When Sentry isn't
// configured (dev), export the bare component.
export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
