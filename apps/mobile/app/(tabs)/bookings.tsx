import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import {
  BookingStatus,
  PLATFORM_META,
  formatPrice,
  type BookingResult,
} from '@rideai/shared';
import { mockBookings } from '../../services/mock';

function statusColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.COMPLETED:
      return '#22C55E';
    case BookingStatus.CANCELLED:
    case BookingStatus.FAILED:
      return '#EF4444';
    default:
      return '#9CA3AF';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function BookingsScreen() {
  const bookings: BookingResult[] = mockBookings();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      {bookings.length === 0 && (
        <Text className="mt-10 text-center text-muted">No bookings yet.</Text>
      )}
      {bookings.map((b) => {
        const meta = PLATFORM_META[b.platform];
        return (
          <View key={b.bookingId} className="mb-3 rounded-2xl border border-white/10 bg-card p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: meta.color }}
                >
                  <Text className="text-xs font-bold text-black">{meta.label.slice(0, 1)}</Text>
                </View>
                <View>
                  <Text className="font-semibold text-white">{meta.label}</Text>
                  <Text className="text-xs text-muted">
                    {b.fromLocation} → {b.toLocation ?? '—'}
                  </Text>
                </View>
              </View>
              <Text className="font-bold text-white">{formatPrice(b.fare)}</Text>
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs" style={{ color: statusColor(b.status) }}>
                ● {b.status}
              </Text>
              {b.savings > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="pricetag" size={12} color="#22C55E" />
                  <Text className="text-xs text-best">saved {formatPrice(b.savings)}</Text>
                </View>
              )}
              <Text className="text-xs text-muted">{formatDate(b.createdAt)}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
