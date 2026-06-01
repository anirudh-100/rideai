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

type Method = 'email' | 'phone';
type PhoneStage = 'enter' | 'code';

function normalisePhone(input: string): string {
  const cleaned = input.replace(/[\s-]/g, '');
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, signInOrSignUpEmail, isAuthed } = useAuth();

  const [method, setMethod] = useState<Method>('email');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);

  // Phone state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneStage, setPhoneStage] = useState<PhoneStage>('enter');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthed) router.replace('/(tabs)');
  }, [isAuthed, router]);

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

  function switchMethod(next: Method) {
    setMethod(next);
    setError(null);
    setConfirmationMsg(null);
    setPhoneStage('enter');
  }

  // ---------- Email handler ----------
  async function handleEmail() {
    setError(null);
    setConfirmationMsg(null);
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const { confirmationRequired } = await signInOrSignUpEmail(e, password);
      if (confirmationRequired) {
        setConfirmationMsg(
          `We sent a confirmation link to ${e}. Click it, then come back here and sign in.`,
        );
      } else {
        router.replace('/welcome');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Phone handlers ----------
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
      setPhone(e164);
      setPhoneStage('code');
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
      router.replace('/welcome');
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
          <View className="mb-8 items-center">
            <Animated.Text style={pulseStyle} className="text-4xl text-primary">
              ✦
            </Animated.Text>
            <Text className="mt-2 text-3xl font-bold tracking-tight text-white">
              Ride<Text className="text-primary">AI</Text>
            </Text>
            <Text className="mt-2 px-6 text-center text-[13px] text-muted">
              Sign in to start comparing rides, food & groceries across every platform.
            </Text>
          </View>

          {/* Method toggle */}
          <View className="mb-4 flex-row gap-2 self-center rounded-full border border-hairline bg-card p-1">
            <Pressable
              onPress={() => switchMethod('email')}
              className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                method === 'email' ? 'bg-primary' : ''
              }`}
            >
              <Ionicons name="mail" size={13} color={method === 'email' ? '#fff' : '#9CA3AF'} />
              <Text className={`text-[12px] font-semibold ${method === 'email' ? 'text-white' : 'text-muted'}`}>
                Email
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMethod('phone')}
              className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                method === 'phone' ? 'bg-primary' : ''
              }`}
            >
              <Ionicons name="call" size={13} color={method === 'phone' ? '#fff' : '#9CA3AF'} />
              <Text className={`text-[12px] font-semibold ${method === 'phone' ? 'text-white' : 'text-muted'}`}>
                Phone
              </Text>
            </Pressable>
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
            {method === 'email' ? (
              <>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Email
                </Text>
                <View className="mb-4 flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                  <Ionicons name="mail" size={16} color="#7C7BFF" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="next"
                    className="h-14 flex-1 text-[15px] text-white"
                  />
                </View>

                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Password
                </Text>
                <View className="flex-row items-center gap-2 rounded-2xl border border-hairline-strong bg-surface-2 px-4">
                  <Ionicons name="lock-closed" size={16} color="#7C7BFF" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    autoComplete="password"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleEmail}
                    className="h-14 flex-1 text-[15px] text-white"
                  />
                </View>

                <Pressable
                  onPress={handleEmail}
                  disabled={busy || !email.trim() || !password}
                  className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80 ${
                    email.trim() && password ? 'bg-primary' : 'bg-card-strong'
                  }`}
                  style={
                    email.trim() && password
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

                <Text className="mt-3 text-center text-[11px] text-muted-2">
                  New here? We&apos;ll create your account automatically.
                </Text>
              </>
            ) : phoneStage === 'enter' ? (
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
                    className="h-14 flex-1 text-[15px] text-white"
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
                <Text className="mt-3 text-center text-[11px] text-muted-2">
                  Requires Twilio / MSG91 setup in Supabase. Use Email for now.
                </Text>
              </>
            ) : (
              <>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Verification code · sent to {phone}
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
                    setPhoneStage('enter');
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

            {confirmationMsg && (
              <View className="mt-3 flex-row items-start gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
                <Ionicons name="mail-unread" size={14} color="#7C7BFF" />
                <Text className="flex-1 text-[12px] text-primary">{confirmationMsg}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Ionicons name="lock-closed" size={11} color="#6B7280" />
            <Text className="text-[11px] text-muted-2">
              Secure · No platform login needed
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
