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
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthProvider';

type Stage = 'phone' | 'code';

function normalisePhone(input: string): string {
  // Strip spaces/dashes, add +91 if user typed a 10-digit Indian number.
  const cleaned = input.replace(/[\s-]/g, '');
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isAuthed } = useAuth();
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  // Redirect away if already signed in (e.g. after deep link)
  useEffect(() => {
    if (isAuthed && stage === 'phone' && !phone) {
      router.replace('/(tabs)');
    }
  }, [isAuthed, stage, phone, router]);

  // Brand pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) }],
  };

  async function handleSendOtp() {
    setError(null);
    const e164 = normalisePhone(phone);
    if (!/^\+\d{10,15}$/.test(e164)) {
      setError('Enter a valid phone number (10-digit Indian or full international with +).');
      return;
    }
    setBusy(true);
    try {
      await sendOtp(e164);
      setPhone(e164); // commit normalised version
      setStage('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    if (!/^\d{4,8}$/.test(code)) {
      setError('Enter the code we sent you.');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      router.replace('/(tabs)');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Brand */}
          <View className="mb-10 items-center">
            <Animated.Text style={pulseStyle} className="text-4xl text-primary">
              ✦
            </Animated.Text>
            <Text className="mt-2 text-3xl font-bold tracking-tight text-white">
              Ride<Text className="text-primary">AI</Text>
            </Text>
            <Text className="mt-2 text-center text-[13px] text-muted">
              {stage === 'phone'
                ? 'Sign in with your phone to start comparing rides, food & groceries.'
                : `We sent a 6-digit code to ${phone}`}
            </Text>
          </View>

          {/* Form card */}
          <View
            className="rounded-3xl border border-hairline bg-card p-5"
            style={{
              shadowColor: '#7C7BFF',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
            }}
          >
            {stage === 'phone' ? (
              <>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Phone number
                </Text>
                <View className="flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                  <Ionicons name="call" size={16} color="#7C7BFF" />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 90000 00000"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    autoFocus
                    autoComplete="tel"
                    returnKeyType="next"
                    onSubmitEditing={handleSendOtp}
                    className="h-14 flex-1 text-[16px] text-white"
                  />
                </View>
                <Pressable
                  onPress={handleSendOtp}
                  disabled={busy || !phone.trim()}
                  className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80 ${
                    phone.trim() ? 'bg-primary' : 'bg-card-strong'
                  }`}
                  style={
                    phone.trim()
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
                        Send code
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Verification code
                </Text>
                <View className="flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                  <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    autoComplete="sms-otp"
                    maxLength={8}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                    className="h-14 flex-1 text-[18px] tracking-[6px] text-white"
                  />
                </View>
                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={busy || !code.trim()}
                  className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80 ${
                    code.trim() ? 'bg-primary' : 'bg-card-strong'
                  }`}
                  style={
                    code.trim()
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
                    <Text className="text-[15px] font-semibold tracking-wide text-white">
                      Verify & continue
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => {
                    setStage('phone');
                    setCode('');
                    setError(null);
                  }}
                  className="mt-3 active:opacity-70"
                >
                  <Text className="text-center text-[12px] font-medium text-muted">
                    ← Use a different number
                  </Text>
                </Pressable>
              </>
            )}

            {error && (
              <View className="mt-3 flex-row items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text className="flex-1 text-[12px] text-red-400">{error}</Text>
              </View>
            )}
          </View>

          {/* Footer trust strip */}
          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Ionicons name="lock-closed" size={11} color="#6B7280" />
            <Text className="text-[11px] text-muted-2">
              We never share your number · Used only for booking confirmations
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
