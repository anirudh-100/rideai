import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  BookingStatus,
  PLATFORM_META,
  formatPrice,
  type BookingResult,
} from '@rideai/shared';
import { useAuth } from '../../contexts/AuthProvider';
import { listBookings } from '../../services/api';

function statusColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.COMPLETED:
    case BookingStatus.CONFIRMED:
      return '#22C55E';
    case BookingStatus.CANCELLED:
    case BookingStatus.FAILED:
      return '#EF4444';
    default:
      return '#9CA3AF';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingsScreen() {
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const { bookings: list } = await listBookings(userId, { limit: 50 });
      setBookings(list);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [userId]);

  // Refetch every time tab regains focus so a new booking shows up immediately.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings().finally(() => setLoading(false));
    }, [fetchBookings]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const totalSavings = bookings.reduce((sum, b) => sum + b.savings, 0);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7C7BFF" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#7C7BFF"
          colors={['#7C7BFF']}
        />
      }
    >
      {/* Summary header */}
      <View className="mb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Your trips
          </Text>
          <Text className="mt-1 text-[18px] font-semibold text-white">
            {bookings.length} booking{bookings.length === 1 ? '' : 's'}
          </Text>
        </View>
        {totalSavings > 0 && (
          <View
            className="flex-row items-center gap-1.5 rounded-full border border-best/40 bg-best-soft px-3 py-1.5"
            style={{
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="trending-down" size={12} color="#22C55E" />
            <Text className="text-[12px] font-bold text-best">
              Saved {formatPrice(totalSavings)} lifetime
            </Text>
          </View>
        )}
      </View>

      {error && (
        <View className="mb-3 flex-row items-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="flex-1 text-[12px] text-red-400">{error}</Text>
        </View>
      )}

      {bookings.length === 0 ? (
        <View className="mt-16 items-center px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-card">
            <Ionicons name="receipt-outline" size={28} color="#6B7280" />
          </View>
          <Text className="mt-4 text-center text-[16px] font-semibold text-white">
            No bookings yet
          </Text>
          <Text className="mt-1 text-center text-[13px] text-muted">
            Your booking history will appear here once you book your first ride.
          </Text>
        </View>
      ) : (
        bookings.map((b) => {
          const meta = PLATFORM_META[b.platform];
          return (
            <View
              key={b.bookingId}
              className="mb-3 rounded-2xl border border-hairline bg-card p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: meta.color,
                      shadowColor: meta.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 6,
                    }}
                  >
                    <Text className="text-sm font-bold text-black">
                      {meta.label.slice(0, 1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-white">
                      {meta.label}
                    </Text>
                    <Text className="text-[11px] text-muted" numberOfLines={1}>
                      {b.fromLocation} → {b.toLocation ?? '—'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[16px] font-bold text-white">
                    {formatPrice(b.fare)}
                  </Text>
                  {b.savings > 0 && (
                    <Text className="text-[10px] text-best">
                      -{formatPrice(b.savings)}
                    </Text>
                  )}
                </View>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusColor(b.status) }}
                  />
                  <Text
                    className="text-[11px] font-semibold tracking-wide"
                    style={{ color: statusColor(b.status) }}
                  >
                    {b.status}
                  </Text>
                </View>
                {b.couponApplied && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="pricetag" size={10} color="#22C55E" />
                    <Text className="text-[10px] font-semibold text-best">
                      {b.couponApplied}
                    </Text>
                  </View>
                )}
                <Text className="text-[11px] text-muted-2">
                  {formatDate(b.createdAt)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
