import { Stack } from 'expo-router';

const BG = '#0A0A14';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        animation: 'fade',
      }}
    />
  );
}
