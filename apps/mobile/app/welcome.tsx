/**
 * Welcome screen — shown after a user completes their first OTP signin and
 * the User row in our DB is brand new (no name set). Captures name + city
 * so the rest of the app has something to greet them with.
 *
 * Routing:
 *   /(auth)/login  → verify OTP → router.replace('/welcome')
 *   /welcome       → save name → router.replace('/onboarding')  (platforms)
 *   /onboarding    → Continue → router.replace('/(tabs)')
 *
 * Existing users with a name already set skip this screen entirely (login
 * routes them directly to /(tabs)).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthProvider';
import { getProfile, updateProfile } from '../services/api';

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

export default function WelcomeScreen() {
  const router = useRouter();
  const { userId, user } = useAuth();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enter = useRef(new Animated.Value(0)).current;

  // Returning users with a name already set skip this screen entirely.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { profile } = await getProfile(userId);
        if (!active) return;
        if (profile.name && profile.name.trim().length > 0) {
          router.replace('/(tabs)');
          return;
        }
        // Pre-fill city if backend already has one
        if (profile.city) setCity(profile.city);
      } catch {
        // First-ever signin race — backend might not have the upsert yet.
        // That's fine, show the form.
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, router]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  async function handleContinue() {
    setError(null);
    if (!name.trim()) {
      setError('Tell us what to call you.');
      return;
    }
    setBusy(true);
    try {
      await updateProfile(userId, {
        name: name.trim(),
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      router.replace('/onboarding');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7C7BFF" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={enterStyle}>
            {/* Brand mark */}
            <Text className="text-3xl text-primary">✦</Text>
            <Text className="mt-3 text-3xl font-bold tracking-tight text-white">
              Welcome to Ride<Text className="text-primary">AI</Text>
            </Text>
            <Text className="mt-2 text-[14px] leading-5 text-muted">
              {user?.phone
                ? `Signed in as ${user.phone}. Just a couple of quick details.`
                : 'Just a couple of quick details to set up your profile.'}
            </Text>

            {/* Name input */}
            <View
              className="mt-8 rounded-3xl border border-hairline bg-card p-5"
              style={{
                shadowColor: '#7C7BFF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 24,
              }}
            >
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                Your name
              </Text>
              <View className="flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                <Ionicons name="person" size={16} color="#7C7BFF" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Anirudh"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  autoComplete="name"
                  autoFocus
                  returnKeyType="next"
                  className="h-14 flex-1 text-[16px] text-white"
                />
              </View>

              {/* City input */}
              <Text className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                Your city <Text className="text-muted-2">(optional)</Text>
              </Text>
              <View className="flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                <Ionicons name="location" size={16} color="#22C55E" />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Delhi"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  autoComplete="postal-address-locality"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  className="h-14 flex-1 text-[16px] text-white"
                />
              </View>

              {/* Popular city chips */}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {POPULAR_CITIES.map((c) => {
                  const active = city.toLowerCase() === c.toLowerCase();
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCity(c)}
                      className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
                        active ? 'border-primary bg-primary/15' : 'border-hairline bg-card'
                      }`}
                    >
                      <Text
                        className={`text-[12px] ${
                          active ? 'font-semibold text-white' : 'text-muted'
                        }`}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* CTAs */}
              <Pressable
                onPress={handleContinue}
                disabled={busy || !name.trim()}
                className={`mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80 ${
                  name.trim() ? 'bg-primary' : 'bg-card-strong'
                }`}
                style={
                  name.trim()
                    ? {
                        shadowColor: '#7C7BFF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                      }
                    : undefined
                }
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-[15px] font-semibold tracking-wide text-white">
                      Continue
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </Pressable>

              {error && (
                <View className="mt-3 flex-row items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text className="flex-1 text-[12px] text-red-400">{error}</Text>
                </View>
              )}
            </View>

            {/* Skip option */}
            <Pressable onPress={handleSkip} className="mt-4 self-center active:opacity-70">
              <Text className="text-[12px] font-medium text-muted">
                Skip for now
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
