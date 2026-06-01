import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const BG = '#0A0A14';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BG },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: BG },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen name="results" options={{ title: 'Compare' }} />
        <Stack.Screen name="booking" options={{ title: 'Confirm booking' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
