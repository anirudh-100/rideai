import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  PLATFORM_META,
  Platform,
  formatPrice,
  type UserProfile,
} from '@rideai/shared';
import { useAuth } from '../../contexts/AuthProvider';
import { getProfile, updateProfile } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, user, authConfigured, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { profile: p } = await getProfile(userId);
      setProfile(p);
    } catch {
      // No profile row yet — happens for first-time sign-in before upsert lands
      setProfile(null);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile().finally(() => setLoading(false));
    }, [fetchProfile]),
  );

  function confirmLogout() {
    const doLogout = async () => {
      await signOut();
    };
    if (RNPlatform.OS === 'web') {
      // Alert.alert doesn't work on web; use confirm.
      if (typeof window !== 'undefined' && window.confirm('Log out of RideAI?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log out', 'Log out of RideAI?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: doLogout },
      ]);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7C7BFF" size="large" />
      </View>
    );
  }

  const displayName = profile?.name ?? user?.phone ?? 'Guest';
  const displayPhone = profile?.phone ?? user?.phone ?? '—';
  const displayCity = profile?.city ?? '—';
  const totalBookings = profile?.totalBookings ?? 0;
  const platforms = profile?.selfReportedPlatforms ?? [];

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header card */}
        <View
          className="rounded-3xl border border-hairline bg-card p-5"
          style={{
            shadowColor: '#7C7BFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 14,
          }}
        >
          <View className="flex-row items-center gap-4">
            <View
              className="h-16 w-16 items-center justify-center rounded-full bg-primary/20"
              style={{
                shadowColor: '#7C7BFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
              }}
            >
              <Ionicons name="person" size={28} color="#7C7BFF" />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-bold text-white" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-[12px] text-muted" numberOfLines={1}>
                {displayPhone}
              </Text>
              <Text className="text-[11px] text-muted-2" numberOfLines={1}>
                {displayCity}
              </Text>
            </View>
            <Pressable
              onPress={() => setEditing(true)}
              className="h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-2 active:opacity-70"
            >
              <Ionicons name="create-outline" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-hairline bg-card p-4">
            <Text className="text-[24px] font-bold text-white">{totalBookings}</Text>
            <Text className="text-[11px] uppercase tracking-wider text-muted-2">
              Bookings
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-hairline bg-card p-4">
            <Text className="text-[24px] font-bold text-best">
              {formatPrice(0)}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-muted-2">
              Saved with coupons
            </Text>
          </View>
        </View>

        {/* Platform preferences */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Platforms you use
          </Text>
          <Pressable
            onPress={() => router.push('/onboarding')}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Ionicons name="create-outline" size={14} color="#7C7BFF" />
            <Text className="text-[12px] font-medium text-primary">Edit</Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {platforms.length === 0 ? (
            <Text className="text-[13px] text-muted">None selected yet.</Text>
          ) : (
            platforms.map((p: Platform) => (
              <View
                key={p}
                className="flex-row items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1.5"
              >
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PLATFORM_META[p].color }}
                />
                <Text className="text-[12px] font-medium text-white">
                  {PLATFORM_META[p].label}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Menu */}
        <Text className="mt-8 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
          Account
        </Text>
        <View className="mt-2 overflow-hidden rounded-2xl border border-hairline bg-card">
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            subtitle="Trip updates & coupon alerts"
            onPress={() => {}}
          />
          <View className="h-[1px] bg-hairline" />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy"
            subtitle="Data & permissions"
            onPress={() => {}}
          />
          <View className="h-[1px] bg-hairline" />
          <MenuRow
            icon="help-circle-outline"
            label="Help & support"
            subtitle="FAQ, contact us"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        {authConfigured && (
          <Pressable
            onPress={confirmLogout}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 active:opacity-70"
          >
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text className="text-[14px] font-semibold text-red-400">Log out</Text>
          </Pressable>
        )}

        <Text className="mt-6 text-center text-[10px] text-muted-2">
          RideAI · v0.1.0
        </Text>
      </ScrollView>

      <EditProfileModal
        visible={editing}
        initialName={profile?.name ?? ''}
        initialCity={profile?.city ?? ''}
        onClose={() => setEditing(false)}
        onSave={async (patch) => {
          try {
            await updateProfile(userId, patch);
            await fetchProfile();
            setEditing(false);
          } catch (err) {
            if (RNPlatform.OS === 'web') {
              window.alert((err as Error).message);
            } else {
              Alert.alert('Update failed', (err as Error).message);
            }
          }
        }}
      />
    </>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-card-strong"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
        <Ionicons name={icon} size={16} color="#9CA3AF" />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-medium text-white">{label}</Text>
        <Text className="text-[11px] text-muted-2">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#6B7280" />
    </Pressable>
  );
}

function EditProfileModal({
  visible,
  initialName,
  initialCity,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialName: string;
  initialCity: string;
  onClose: () => void;
  onSave: (patch: { name?: string; city?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-sm rounded-3xl border border-hairline bg-surface p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-white">Edit profile</Text>
            <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full active:bg-card">
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <Text className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#6B7280"
            className="h-12 rounded-2xl border border-hairline-strong bg-surface-2 px-4 text-[15px] text-white"
          />

          <Text className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            City
          </Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Delhi"
            placeholderTextColor="#6B7280"
            className="h-12 rounded-2xl border border-hairline-strong bg-surface-2 px-4 text-[15px] text-white"
          />

          <Pressable
            onPress={async () => {
              setBusy(true);
              const patch: { name?: string; city?: string } = {};
              if (name.trim() && name !== initialName) patch.name = name.trim();
              if (city.trim() && city !== initialCity) patch.city = city.trim();
              if (Object.keys(patch).length === 0) {
                onClose();
                setBusy(false);
                return;
              }
              await onSave(patch);
              setBusy(false);
            }}
            disabled={busy}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 active:opacity-80"
            style={{
              shadowColor: '#7C7BFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[14px] font-semibold tracking-wide text-white">
                Save changes
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
