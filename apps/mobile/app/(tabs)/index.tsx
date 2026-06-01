import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLATFORM_META, Platform } from '@rideai/shared';
import { useAuth } from '../../contexts/AuthProvider';
import { parseIntent } from '../../services/api';
import { addRecentSearch, localIntentFallback, session } from '../../services/session';

const PLACEHOLDERS = [
  'I want to go from Rajiv Chowk to India Gate',
  'Biryani under ₹200 delivered fast',
  'Milk eggs bread delivered now',
];

const QUICK_ACTIONS: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  seed: string;
  tint: string;
  bg: string;
}> = [
  { label: 'Ride', icon: 'car-sport', seed: 'Ride from ', tint: '#7C7BFF', bg: 'rgba(124,123,255,0.12)' },
  { label: 'Food', icon: 'fast-food', seed: 'Order ', tint: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  { label: 'Groceries', icon: 'cart', seed: 'Buy ', tint: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Subtle breathing accent for the sparkle marks.
  const pulse = useRef(new Animated.Value(0)).current;
  // Animated focus glow ring around the input.
  const glow = useRef(new Animated.Value(0)).current;
  // Slow ambient gradient drift behind the hero.
  const ambient = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    Animated.timing(glow, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating border + shadow, not transform
    }).start();
  }, [focused, glow]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambient, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ambient, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ambient]);

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
  };

  const ambientStyle = {
    opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }),
    transform: [
      { translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] }) },
      { scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  };

  async function handleSubmit() {
    const text = prompt.trim();
    if (!text) return;
    addRecentSearch(text);
    setLoading(true);
    try {
      session.intent = await parseIntent(text, userId);
    } catch {
      session.intent = localIntentFallback(text);
    } finally {
      setLoading(false);
    }
    router.push('/results');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient gradient glow behind the hero */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -40, left: -40, right: -40, height: 280 }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: '20%',
                height: 240,
                width: 240,
                borderRadius: 240,
                backgroundColor: '#7C7BFF',
              },
              ambientStyle,
              { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] }) },
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 40,
                right: '5%',
                height: 200,
                width: 200,
                borderRadius: 200,
                backgroundColor: '#E0B66B',
              },
              ambientStyle,
              { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.16] }) },
            ]}
          />
        </View>

        {/* Hero — brand mark */}
        <View className="mt-4 flex-row items-center gap-2">
          <Animated.Text style={pulseStyle} className="text-3xl text-primary">
            ✦
          </Animated.Text>
          <Text className="text-3xl font-bold tracking-tight text-white">
            Ride<Text className="text-primary">AI</Text>
          </Text>
        </View>
        <Text className="mt-2 text-[15px] leading-5 text-muted">
          One prompt. Every ride, meal & grocery —{' '}
          <Text className="font-semibold text-white">compared instantly</Text>.
        </Text>

        {/* Prompt input with focus glow ring */}
        <Animated.View
          style={{
            marginTop: 28,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: glow.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255,255,255,0.08)', 'rgba(124,123,255,0.55)'],
            }) as unknown as string,
            shadowColor: '#7C7BFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) as unknown as number,
            shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) as unknown as number,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <View className="rounded-3xl p-4">
            <View className="flex-row items-start gap-2">
              <Animated.Text style={pulseStyle} className="mt-1.5 text-lg text-primary">
                ✦
              </Animated.Text>
              <TextInput
                ref={inputRef}
                value={prompt}
                onChangeText={setPrompt}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={PLACEHOLDERS[placeholderIndex] ?? ''}
                placeholderTextColor="#6B7280"
                multiline
                className="min-h-[60px] flex-1 text-[15px] leading-6 text-white"
                onSubmitEditing={handleSubmit}
                returnKeyType="search"
              />
            </View>
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !prompt.trim()}
              className={`mt-3 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
                prompt.trim() ? 'bg-primary' : 'bg-card-strong'
              }`}
              style={
                prompt.trim()
                  ? {
                      shadowColor: '#7C7BFF',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                    }
                  : undefined
              }
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text className="ml-2 text-[15px] font-semibold tracking-wide text-white">
                    Compare now
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Quick action cards */}
        <View className="mt-7 flex-row gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                setPrompt(action.seed);
                inputRef.current?.focus();
              }}
              className="flex-1 items-start rounded-2xl border border-hairline bg-card p-3.5 active:opacity-70"
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: action.bg }}
              >
                <Ionicons name={action.icon} size={18} color={action.tint} />
              </View>
              <Text className="mt-3 text-[13px] font-semibold text-white">
                {action.label}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted-2">Tap to start</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent searches */}
        {session.recentSearches.length > 0 && (
          <View className="mt-8">
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
              Recent
            </Text>
            {session.recentSearches.map((q) => (
              <Pressable
                key={q}
                onPress={() => setPrompt(q)}
                className="mb-2 flex-row items-center gap-3 rounded-2xl border border-hairline bg-card px-4 py-3 active:opacity-70"
              >
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text className="flex-1 text-[14px] text-white" numberOfLines={1}>
                  {q}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#6B7280" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Platform chips */}
        <View className="mt-10">
          <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Comparing across
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(Platform).map((p) => {
              const meta = PLATFORM_META[p];
              return (
                <View
                  key={p}
                  className="flex-row items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1.5"
                >
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <Text className="text-[12px] font-medium text-white">{meta.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subtle footer mark */}
        <View className="mt-12 flex-row items-center justify-center gap-1.5">
          <Ionicons name="shield-checkmark" size={12} color="#6B7280" />
          <Text className="text-[11px] text-muted-2">
            Coupons auto-applied · No platform signup
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
