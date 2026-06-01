import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  PLATFORM_META,
  Platform,
  formatPrice,
  type UserProfile,
} from '@rideai/shared';
import { getProfile } from '../../services/api';
import { mockBookings } from '../../services/mock';
import { session } from '../../services/session';

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user',
  phone: '+91 90000 00000',
  email: 'you@example.com',
  name: 'Guest',
  city: 'Delhi',
  selfReportedPlatforms: [],
  totalBookings: 2,
  lastBookingDate: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  createdAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEMO_PROFILE);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { profile: p } = await getProfile(session.userId);
        if (active) setProfile(p);
      } catch {
        // keep demo profile when backend is unavailable
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const platforms =
    session.selfReportedPlatforms.length > 0
      ? session.selfReportedPlatforms
      : profile.selfReportedPlatforms;
  const bookings = mockBookings();
  const totalSaved = bookings.reduce((sum, b) => sum + b.savings, 0);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <Ionicons name="person" size={30} color="#6366F1" />
        </View>
        <View>
          <Text className="text-xl font-bold text-white">{profile.name ?? 'Guest'}</Text>
          <Text className="text-muted">{profile.city ?? '—'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-white/10 bg-card p-4">
          <Text className="text-2xl font-bold text-white">{profile.totalBookings}</Text>
          <Text className="text-xs text-muted">Bookings</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-white/10 bg-card p-4">
          <Text className="text-2xl font-bold text-best">{formatPrice(totalSaved)}</Text>
          <Text className="text-xs text-muted">Saved with coupons</Text>
        </View>
      </View>

      {/* Platform preferences */}
      <View className="mt-6 flex-row items-center justify-between">
        <Text className="font-semibold text-white">Platforms you use</Text>
        <Pressable onPress={() => router.push('/onboarding')} className="flex-row items-center gap-1">
          <Ionicons name="create-outline" size={16} color="#6366F1" />
          <Text className="text-sm text-primary">Edit</Text>
        </Pressable>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {platforms.length === 0 ? (
          <Text className="text-muted">None selected yet.</Text>
        ) : (
          platforms.map((p: Platform) => (
            <View
              key={p}
              className="flex-row items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-2"
            >
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: PLATFORM_META[p].color }} />
              <Text className="text-xs text-white">{PLATFORM_META[p].label}</Text>
            </View>
          ))
        )}
      </View>

      {/* Booking history */}
      <Text className="mb-3 mt-8 font-semibold text-white">Recent bookings</Text>
      {bookings.map((b) => (
        <View key={b.bookingId} className="mb-2 flex-row items-center justify-between rounded-2xl bg-card px-4 py-3">
          <View>
            <Text className="text-white">{PLATFORM_META[b.platform].label}</Text>
            <Text className="text-xs text-muted">
              {b.fromLocation} → {b.toLocation ?? '—'}
            </Text>
          </View>
          <Text className="font-semibold text-white">{formatPrice(b.fare)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
