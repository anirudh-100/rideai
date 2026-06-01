import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseIntent } from '../../services/api';
import { addRecentSearch, localIntentFallback, session } from '../../services/session';

const SUGGESTIONS = [
  'Cheapest auto to the airport',
  'Pizza under ₹300 nearby',
  'Order milk and bread now',
  'Bike to Cyber Hub',
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  async function run(text: string) {
    const t = text.trim();
    if (!t) return;
    addRecentSearch(t);
    setLoading(true);
    try {
      session.intent = await parseIntent(t, session.userId);
    } catch {
      session.intent = localIntentFallback(t);
    } finally {
      setLoading(false);
    }
    router.push('/results');
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-card px-4 py-3">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search anything…"
            placeholderTextColor="#6B7280"
            className="flex-1 text-base text-white"
            returnKeyType="search"
            onSubmitEditing={() => run(query)}
            autoFocus
          />
          {loading && <ActivityIndicator color="#6366F1" />}
        </View>

        {session.recentSearches.length > 0 && (
          <View className="mt-6">
            <Text className="mb-2 text-sm font-semibold text-muted">Recent</Text>
            {session.recentSearches.map((q) => (
              <Pressable
                key={q}
                onPress={() => run(q)}
                className="mb-2 flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3"
              >
                <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                <Text className="flex-1 text-white" numberOfLines={1}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="mt-6">
          <Text className="mb-2 text-sm font-semibold text-muted">Try</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => run(s)}
                className="rounded-full border border-white/10 bg-card px-3 py-2"
              >
                <Text className="text-sm text-white">{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
