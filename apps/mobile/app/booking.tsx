import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  PLATFORM_META,
  formatPrice,
  type Platform,
} from '@rideai/shared';
import { useAuth } from '../contexts/AuthProvider';
import { createBooking } from '../services/api';
import { googleMapsDirectionsUrl, openDeepLink, type GeoPoint } from '../services/deepLinks';
import { session } from '../services/session';

type PaymentMethod = 'GPay' | 'Paytm' | 'Cash';
const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}> = [
  { id: 'GPay', icon: 'logo-google', tint: '#7C7BFF' },
  { id: 'Paytm', icon: 'wallet', tint: '#E0B66B' },
  { id: 'Cash', icon: 'cash', tint: '#22C55E' },
];

const DEFAULT_PICKUP: GeoPoint = { lat: 28.6328, lng: 77.2197 };
const DEFAULT_DROP: GeoPoint = { lat: 28.6129, lng: 77.2295 };

export default function BookingScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const selected = session.selected;
  const intent = session.intent;
  const [payment, setPayment] = useState<PaymentMethod>('GPay');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!selected) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Ionicons name="alert-circle-outline" size={36} color="#6B7280" />
        <Text className="mt-3 text-center text-muted">
          No option selected. Go back and pick a platform.
        </Text>
      </View>
    );
  }

  const chosen = selected;
  const base = selected.fare;
  const discount = selected.couponApplied?.savings ?? 0;
  const total = selected.finalFare ?? base - discount;
  const fromLabel = intent?.from?.address ?? 'Current location';
  const toLabel = intent?.to?.address ?? selected.label;

  async function handleConfirm() {
    setBusy(true);
    try {
      await createBooking({
        userId,
        platform: chosen.platform,
        serviceType: chosen.serviceType,
        vehicleType: chosen.vehicleType ?? null,
        fromLocation: fromLabel,
        toLocation: toLabel,
        fare: total,
        couponApplied: chosen.couponApplied?.code ?? null,
        savings: discount,
      });
    } catch {
      /* best-effort */
    }

    const pickup: GeoPoint = {
      lat: intent?.from?.lat ?? DEFAULT_PICKUP.lat,
      lng: intent?.from?.lng ?? DEFAULT_PICKUP.lng,
      address: intent?.from?.address ?? undefined,
    };
    const drop: GeoPoint = {
      lat: intent?.to?.lat ?? DEFAULT_DROP.lat,
      lng: intent?.to?.lng ?? DEFAULT_DROP.lng,
      address: intent?.to?.address ?? undefined,
    };

    try {
      await openDeepLink(
        chosen.platform as Platform,
        pickup,
        drop,
        chosen.couponApplied?.code,
      );
    } catch {
      /* best-effort */
    }
    setBusy(false);
    setDone(true);
  }

  if (done) {
    const mapsUrl = googleMapsDirectionsUrl(
      {
        lat: intent?.from?.lat ?? DEFAULT_PICKUP.lat,
        lng: intent?.from?.lng ?? DEFAULT_PICKUP.lng,
        address: intent?.from?.address ?? undefined,
      },
      {
        lat: intent?.to?.lat ?? DEFAULT_DROP.lat,
        lng: intent?.to?.lng ?? DEFAULT_DROP.lng,
        address: intent?.to?.address ?? undefined,
      },
    );
    return (
      <ConfirmationView
        platformLabel={PLATFORM_META[selected.platform].label}
        savings={discount}
        mapsUrl={mapsUrl}
        onDone={() => router.replace('/(tabs)')}
      />
    );
  }

  const meta = PLATFORM_META[selected.platform];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Route summary */}
      <View className="rounded-2xl border border-hairline bg-card p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
          <Text className="flex-1 text-[14px] text-white" numberOfLines={1}>{fromLabel}</Text>
        </View>
        <View className="my-1 ml-[5px] h-5 w-[1.5px] bg-hairline-strong" />
        <View className="flex-row items-center gap-3">
          <Ionicons name="location" size={14} color="#22C55E" />
          <Text className="flex-1 text-[14px] text-white" numberOfLines={1}>{toLabel}</Text>
        </View>
      </View>

      {/* Platform card */}
      <View
        className="mt-4 flex-row items-center gap-3 rounded-2xl border border-hairline bg-card p-4"
      >
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: meta.color,
            shadowColor: meta.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.45,
            shadowRadius: 8,
          }}
        >
          <Text className="text-base font-bold text-black">
            {meta.label.slice(0, 1)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-white">
            {meta.label}
          </Text>
          <Text className="text-[12px] text-muted">{selected.label}</Text>
        </View>
        {selected.etaMinutes != null && (
          <View className="items-end">
            <Text className="text-[14px] font-semibold text-white">
              {selected.etaMinutes} min
            </Text>
            <Text className="text-[11px] text-muted-2">ETA</Text>
          </View>
        )}
      </View>

      {/* Price breakdown */}
      <View className="mt-4 rounded-2xl border border-hairline bg-card p-4">
        <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
          Price breakdown
        </Text>
        <Row label="Base fare" value={formatPrice(base)} />
        {discount > 0 && (
          <Row
            label={`Coupon ${selected.couponApplied?.code ?? ''}`}
            value={`– ${formatPrice(discount)}`}
            valueClass="text-best"
          />
        )}
        <View className="my-3 h-[1px] bg-hairline" />
        <Row label="Total" value={formatPrice(total)} bold />
      </View>

      {/* Payment method */}
      <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
        Payment method
      </Text>
      <View className="flex-row gap-2.5">
        {PAYMENT_METHODS.map((m) => {
          const active = payment === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setPayment(m.id)}
              className={`flex-1 items-center rounded-2xl border py-3 active:opacity-80 ${
                active ? 'border-primary bg-primary/10' : 'border-hairline bg-card'
              }`}
            >
              <Ionicons
                name={m.icon}
                size={18}
                color={active ? m.tint : '#6B7280'}
              />
              <Text
                className={`mt-1 text-[12px] ${
                  active ? 'font-semibold text-white' : 'text-muted'
                }`}
              >
                {m.id}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Confirm CTA with shadow lift */}
      <Pressable
        onPress={handleConfirm}
        disabled={busy}
        className="mt-8 flex-row items-center justify-center rounded-2xl bg-primary py-4 active:opacity-80"
        style={{
          shadowColor: '#7C7BFF',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text className="ml-2 text-[15px] font-semibold tracking-wide text-white">
              Confirm & Book · {formatPrice(total)}
            </Text>
          </>
        )}
      </Pressable>

      {/* Trust strip */}
      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        <Ionicons name="lock-closed" size={11} color="#6B7280" />
        <Text className="text-[11px] text-muted-2">
          Secure · No platform login required
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// ConfirmationView — premium success screen with particle burst.
// ============================================================================

const PARTICLE_COLORS = ['#22C55E', '#7C7BFF', '#E0B66B', '#22C55E', '#7C7BFF'];
const PARTICLE_COUNT = 14;

function ConfirmationView({
  platformLabel,
  savings,
  mapsUrl,
  onDone,
}: {
  platformLabel: string;
  savings: number;
  mapsUrl: string;
  onDone: () => void;
}) {
  const checkScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const sparklePulse = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  // Stable particle config across renders.
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const angle = (i / PARTICLE_COUNT) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const distance = 90 + Math.random() * 50;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]!,
        size: 5 + Math.random() * 4,
        delay: Math.random() * 100,
        rotate: Math.random() * 360,
      };
    }),
  ).current;

  useEffect(() => {
    // Sequence: outer ring → inner ring → check pop → burst → text → CTA
    Animated.sequence([
      Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      Animated.parallel([
        Animated.spring(ring2Scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 14 }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 16 }),
        Animated.timing(burst, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparklePulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ringScale, ring2Scale, checkScale, textOpacity, ctaOpacity, burst, sparklePulse]);

  const sparkleStyle = {
    opacity: sparklePulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: sparklePulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
  };

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      {/* Particle burst stage */}
      <View
        style={{
          height: 220,
          width: 220,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Particles */}
        {particles.map((p, i) => {
          const opacity = burst.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 1, 1, 0] });
          const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] });
          const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.y] });
          const scale = burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0.8] });
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                height: p.size,
                width: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity,
                transform: [
                  { translateX: tx },
                  { translateY: ty },
                  { scale },
                  { rotate: `${p.rotate}deg` },
                ],
              }}
            />
          );
        })}

        {/* Idling sparkles around the check */}
        <Animated.Text style={[{ position: 'absolute', top: 18, left: 38, fontSize: 14, color: '#22C55E' }, sparkleStyle]}>✦</Animated.Text>
        <Animated.Text style={[{ position: 'absolute', top: 28, right: 32, fontSize: 11, color: '#7C7BFF' }, sparkleStyle]}>✧</Animated.Text>
        <Animated.Text style={[{ position: 'absolute', bottom: 30, left: 30, fontSize: 13, color: '#7C7BFF' }, sparkleStyle]}>✧</Animated.Text>
        <Animated.Text style={[{ position: 'absolute', bottom: 20, right: 40, fontSize: 15, color: '#E0B66B' }, sparkleStyle]}>✦</Animated.Text>

        {/* Outer ring */}
        <Animated.View
          style={{
            position: 'absolute',
            height: 120,
            width: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(34,197,94,0.10)',
            transform: [{ scale: ringScale }],
          }}
        />
        {/* Inner ring */}
        <Animated.View
          style={{
            position: 'absolute',
            height: 88,
            width: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(34,197,94,0.22)',
            transform: [{ scale: ring2Scale }],
          }}
        />
        {/* Checkmark */}
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Ionicons name="checkmark-circle" size={76} color="#22C55E" />
        </Animated.View>
      </View>

      {/* Text block */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 8 }}>
        <Text className="text-[26px] font-bold tracking-tight text-white">
          Booking confirmed
        </Text>
        {savings > 0 ? (
          <View
            className="mt-3 flex-row items-center gap-1.5 rounded-full border border-best/40 bg-best-soft px-3.5 py-1.5"
            style={{
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="trending-down" size={13} color="#22C55E" />
            <Text className="text-[13px] font-bold text-best">
              You saved {formatPrice(savings)}
            </Text>
          </View>
        ) : null}
        <Text className="mt-3 max-w-xs text-center text-[13px] leading-5 text-muted">
          {RNPlatform.OS === 'web'
            ? `${platformLabel} opened in a new tab. On your phone, ${platformLabel} opens with pickup & drop pre-filled.`
            : `Opening ${platformLabel} to finish your booking.`}
        </Text>
      </Animated.View>

      {/* CTAs */}
      <Animated.View style={{ opacity: ctaOpacity, width: '100%', maxWidth: 320, marginTop: 36, gap: 12 }}>
        <Pressable
          onPress={onDone}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-10 py-3.5 active:opacity-80"
          style={{
            shadowColor: '#7C7BFF',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 14,
          }}
        >
          <Ionicons name="home" size={15} color="#fff" />
          <Text className="text-[14px] font-semibold tracking-wide text-white">
            Back to home
          </Text>
        </Pressable>
        {RNPlatform.OS === 'web' && (
          <Pressable
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open(mapsUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-hairline-strong bg-card px-10 py-3 active:opacity-70"
          >
            <Ionicons name="map" size={15} color="#9CA3AF" />
            <Text className="text-[13px] font-semibold text-muted">
              View route on Maps
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`${bold ? 'text-[15px] font-semibold text-white' : 'text-[13px] text-muted'}`}>
        {label}
      </Text>
      <Text
        className={`${
          bold ? 'text-[18px] font-bold text-white' : 'text-[13px] text-white'
        } ${valueClass ?? ''}`}
      >
        {value}
      </Text>
    </View>
  );
}
