import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PLATFORM_META,
  ServiceType,
  VehicleType,
  formatPrice,
  type PlatformPrice,
} from '@rideai/shared';
import { useAuth } from '../contexts/AuthProvider';
import { comparePrices } from '../services/api';
import { mockRidePrices } from '../services/mock';
import { session } from '../services/session';

type RideFilter = 'ALL' | 'BIKE' | 'AUTO' | 'CAB';
const RIDE_FILTERS: RideFilter[] = ['ALL', 'BIKE', 'AUTO', 'CAB'];

function matchesFilter(p: PlatformPrice, filter: RideFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'BIKE') return p.vehicleType === VehicleType.BIKE;
  if (filter === 'AUTO') return p.vehicleType === VehicleType.AUTO;
  return (
    p.vehicleType === VehicleType.MINI ||
    p.vehicleType === VehicleType.SEDAN ||
    p.vehicleType === VehicleType.SUV
  );
}

function fareOf(p: PlatformPrice): number {
  return p.finalFare ?? p.fare;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const hrs = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}hr${hrs === 1 ? '' : 's'} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Counts up from 0 to `value` over `duration` ms.
function AnimatedCounter({
  value,
  prefix = '',
  duration = 700,
  className,
}: {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const listener = anim.addListener((v) => setDisplay(Math.round(v.value)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [anim, value, duration]);
  return <Text className={className}>{prefix}{display}</Text>;
}

// Shimmering skeleton card shown while prices load.
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer, delay]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });
  return (
    <Animated.View
      className="mb-3 rounded-2xl border border-hairline bg-card p-4"
      style={{ opacity }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full bg-card-strong" />
          <View>
            <View className="mb-2 h-3 w-28 rounded bg-card-strong" />
            <View className="h-2.5 w-20 rounded bg-card-strong" />
          </View>
        </View>
        <View className="items-end">
          <View className="mb-2 h-5 w-16 rounded bg-card-strong" />
          <View className="h-2 w-12 rounded bg-card-strong" />
        </View>
      </View>
    </Animated.View>
  );
}

// One result card — staggered entrance, press scale, halo on best, layered tint.
function ResultCard({
  price,
  isBest,
  isSelected,
  index,
  onPress,
}: {
  price: PlatformPrice;
  isBest: boolean;
  isSelected: boolean;
  index: number;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  useEffect(() => {
    if (!isBest) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [halo, isBest]);

  const enterStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: press },
    ],
  };

  const haloStyle = {
    opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] }),
    transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.03] }) }],
  };

  const meta = PLATFORM_META[price.platform];
  const fare = fareOf(price);
  const savings = price.couponApplied?.savings ?? 0;

  return (
    <Animated.View style={enterStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(press, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start()
        }
      >
        <View
          className={`relative mb-3 overflow-hidden rounded-2xl border p-4 ${
            isBest
              ? 'border-best/60 bg-best-soft'
              : isSelected
              ? 'border-primary/60 bg-card-strong'
              : 'border-hairline bg-card'
          }`}
          style={
            isBest
              ? {
                  shadowColor: '#22C55E',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.25,
                  shadowRadius: 18,
                }
              : undefined
          }
        >
          {/* Diagonal tint overlay for BEST */}
          {isBest && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                height: 140,
                width: 140,
                borderRadius: 140,
                backgroundColor: 'rgba(34,197,94,0.18)',
              }}
            />
          )}

          {/* Pulsing halo border on BEST */}
          {isBest && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: '#22C55E',
                },
                haloStyle,
              ]}
            />
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{
                  backgroundColor: meta.color,
                  shadowColor: meta.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.45,
                  shadowRadius: 8,
                }}
              >
                <Text className="text-sm font-bold text-black">
                  {meta.label.slice(0, 1)}
                </Text>
              </View>
              <View>
                <Text className="text-[15px] font-semibold text-white">{meta.label}</Text>
                <Text className="text-[12px] text-muted">{price.label}</Text>
                {price.etaMinutes != null && (
                  <View className="mt-1 flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                    <Text className="text-[11px] text-muted">
                      {price.etaMinutes} min away
                    </Text>
                    {price.surgeMultiplier ? (
                      <Text className="ml-1 text-[11px] font-semibold text-accent">
                        · {price.surgeMultiplier}× surge
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
            <View className="items-end">
              {savings > 0 ? (
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-[11px] text-muted-2 line-through">
                    {formatPrice(price.fare)}
                  </Text>
                  <Text className="text-2xl font-bold tracking-tight text-white">
                    {formatPrice(fare)}
                  </Text>
                </View>
              ) : (
                <Text className="text-2xl font-bold tracking-tight text-white">
                  {formatPrice(fare)}
                </Text>
              )}
            </View>
          </View>

          {/* Bottom row: BEST badge + savings pill */}
          {(isBest || savings > 0) && (
            <View className="mt-3.5 flex-row items-center justify-between">
              {isBest ? (
                <View
                  className="flex-row items-center gap-1 rounded-full bg-best px-2.5 py-1"
                  style={{
                    shadowColor: '#22C55E',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                  }}
                >
                  <Ionicons name="sparkles" size={10} color="#000" />
                  <Text className="text-[11px] font-bold tracking-wide text-black">
                    BEST DEAL
                  </Text>
                </View>
              ) : (
                <View />
              )}
              {savings > 0 && price.couponApplied && (
                <View className="flex-row items-center gap-1.5 rounded-full border border-best/40 bg-best-soft px-2.5 py-1">
                  <Ionicons name="pricetag" size={10} color="#22C55E" />
                  <Text className="text-[11px] font-bold tracking-wide text-best">
                    SAVE {formatPrice(savings)} · {price.couponApplied.code}
                  </Text>
                  {price.couponApplied.verifiedAt && (
                    <Text className="text-[10px] text-muted-2">
                      ✓ {timeAgo(price.couponApplied.verifiedAt)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const intent = session.intent;
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<PlatformPrice[]>([]);
  const [filter, setFilter] = useState<RideFilter>('ALL');
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!intent) {
        setResults(mockRidePrices());
        setUsedFallback(true);
        setLoading(false);
        return;
      }
      try {
        const res = await comparePrices(intent, userId);
        if (!active) return;
        if (res.results.length > 0) {
          setResults(res.results);
          setRecommendation(res.ranked?.recommendation ?? res.note ?? null);
        } else {
          setResults(mockRidePrices());
          setUsedFallback(true);
          setRecommendation(res.note ?? null);
        }
      } catch {
        if (!active) return;
        setResults(mockRidePrices());
        setUsedFallback(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [intent, userId]);

  const isRide = !intent || intent.serviceType === ServiceType.RIDE;

  const visible = useMemo(() => {
    const list = isRide ? results.filter((p) => matchesFilter(p, filter)) : results;
    return [...list].sort((a, b) => fareOf(a) - fareOf(b));
  }, [results, filter, isRide]);

  const bestFare = visible.length ? fareOf(visible[0]!) : null;
  const totalSavings = visible.reduce(
    (sum, p) => sum + (p.couponApplied?.savings ?? 0),
    0,
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const keyOf = (p: PlatformPrice) => `${p.platform}:${p.label}`;
  const selected =
    visible.find((p) => keyOf(p) === selectedKey) ?? visible[0] ?? null;

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="mb-5 flex-row items-center gap-2">
            <Text className="text-base text-primary">✦</Text>
            <Text className="text-[13px] font-medium text-muted">
              Comparing platforms…
            </Text>
          </View>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} delay={i * 120} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Summary header */}
        <View className="mb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
              Results
            </Text>
            <Text className="mt-1 text-[18px] font-semibold text-white">
              {visible.length} option{visible.length === 1 ? '' : 's'} found
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
              <Text className="text-[12px] font-bold text-best">Up to </Text>
              <AnimatedCounter
                value={totalSavings}
                prefix="₹"
                className="text-[12px] font-bold text-best"
              />
              <Text className="text-[12px] font-bold text-best"> saved</Text>
            </View>
          )}
        </View>

        {/* AI recommendation banner */}
        {recommendation && (
          <View
            className="mb-4 flex-row items-start gap-2.5 rounded-2xl border border-primary/40 bg-card-strong p-3.5"
            style={{
              shadowColor: '#7C7BFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
            }}
          >
            <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/20">
              <Text className="text-[12px] text-primary">✦</Text>
            </View>
            <Text className="flex-1 text-[13px] leading-5 text-white">
              {recommendation}
            </Text>
          </View>
        )}

        {usedFallback && (
          <View className="mb-3 flex-row items-center gap-1.5">
            <Ionicons name="information-circle-outline" size={12} color="#6B7280" />
            <Text className="text-[11px] text-muted-2">
              Showing sample data (backend offline).
            </Text>
          </View>
        )}

        {/* Filter pills */}
        {isRide && (
          <View className="mb-4 flex-row gap-2">
            {RIDE_FILTERS.map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 active:opacity-80 ${
                    active ? 'bg-primary' : 'border border-hairline bg-card'
                  }`}
                  style={
                    active
                      ? {
                          shadowColor: '#7C7BFF',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-[13px] ${
                      active ? 'font-semibold text-white' : 'font-medium text-muted'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f === 'CAB' ? 'Cab' : f[0] + f.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {visible.map((p, i) => {
          const fare = fareOf(p);
          const isBest = bestFare != null && fare === bestFare;
          const isSelected = selected != null && keyOf(selected) === keyOf(p);
          return (
            <ResultCard
              key={keyOf(p)}
              price={p}
              index={i}
              isBest={isBest}
              isSelected={isSelected}
              onPress={() => setSelectedKey(keyOf(p))}
            />
          );
        })}

        {visible.length === 0 && (
          <View className="mt-12 items-center">
            <Ionicons name="search" size={32} color="#6B7280" />
            <Text className="mt-3 text-center text-[13px] text-muted">
              No options for this filter.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom bar */}
      {selected && (
        <SafeAreaView
          edges={['bottom']}
          className="absolute bottom-0 left-0 right-0 border-t border-hairline bg-surface"
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <View>
              <Text className="text-[11px] text-muted-2">
                {PLATFORM_META[selected.platform].label} · {selected.label}
              </Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="text-xl font-bold text-white">
                  {formatPrice(fareOf(selected))}
                </Text>
                {selected.couponApplied ? (
                  <Text className="text-[11px] text-best">
                    -{formatPrice(selected.couponApplied.savings)}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={() => {
                session.selected = selected;
                router.push('/booking');
              }}
              className="flex-row items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 active:opacity-80"
              style={{
                shadowColor: '#7C7BFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
              }}
            >
              <Text className="text-[14px] font-semibold tracking-wide text-white">
                Book Now
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
