import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLATFORM_META, Platform } from '@rideai/shared';
import { saveOnboarding } from '../services/api';
import { session } from '../services/session';

const ALL_PLATFORMS = Object.values(Platform);

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<Platform>>(
    new Set(session.selfReportedPlatforms),
  );
  const [none, setNone] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggle(p: Platform) {
    setNone(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function chooseNone() {
    setSelected(new Set());
    setNone(true);
  }

  function finish() {
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }

  async function handleContinue() {
    const platforms = none ? [] : Array.from(selected);
    session.selfReportedPlatforms = platforms;
    setSaving(true);
    try {
      await saveOnboarding(session.userId, platforms);
    } catch {
      // best-effort; the selection is kept locally in the session
    } finally {
      setSaving(false);
    }
    finish();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text className="text-primary text-2xl">✦</Text>
        <Pressable onPress={finish}>
          <Text className="text-muted">Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-white">
          Which apps have you used before?
        </Text>
        <Text className="mt-2 text-muted">
          We use this to match you with the right coupons (new-user, win-back & more).
        </Text>

        <View className="mt-6 flex-row flex-wrap gap-3">
          {ALL_PLATFORMS.map((p) => {
            const active = selected.has(p);
            const meta = PLATFORM_META[p];
            return (
              <Pressable
                key={p}
                onPress={() => toggle(p)}
                className={`flex-row items-center gap-2 rounded-full border px-4 py-3 ${
                  active ? 'border-primary bg-primary/15' : 'border-white/10 bg-card'
                }`}
              >
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                <Text className={active ? 'text-white' : 'text-muted'}>{meta.label}</Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={chooseNone}
            className={`rounded-full border px-4 py-3 ${
              none ? 'border-primary bg-primary/15' : 'border-white/10 bg-card'
            }`}
          >
            <Text className={none ? 'text-white' : 'text-muted'}>None of these</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-5 pb-2">
        <Pressable
          onPress={handleContinue}
          disabled={saving}
          className="items-center rounded-2xl bg-primary py-4"
        >
          <Text className="text-base font-semibold text-white">
            {saving ? 'Saving…' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
