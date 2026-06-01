/**
 * Tiny in-memory session store shared across screens (intent → results →
 * booking). A real app would use a proper state manager / persistence; this
 * keeps the scaffold simple.
 */
import {
  Platform,
  ServiceType,
  type IntentParseResult,
  type PlatformPrice,
} from '@rideai/shared';

export const DEMO_USER_ID = 'demo-user';

interface SessionState {
  userId: string;
  selfReportedPlatforms: Platform[];
  intent: IntentParseResult | null;
  results: PlatformPrice[];
  selected: PlatformPrice | null;
  recentSearches: string[];
}

export const session: SessionState = {
  userId: DEMO_USER_ID,
  selfReportedPlatforms: [],
  intent: null,
  results: [],
  selected: null,
  recentSearches: [],
};

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  session.recentSearches = [
    trimmed,
    ...session.recentSearches.filter((s) => s !== trimmed),
  ].slice(0, 6);
}

const GROCERY_HINTS = ['milk', 'eggs', 'bread', 'grocer', 'vegetable', 'butter', 'rice'];
const FOOD_HINTS = ['biryani', 'pizza', 'burger', 'food', 'eat', 'meal', 'dinner', 'lunch'];

/**
 * Naive on-device intent guess, used as a fallback when the backend / Claude
 * API is unavailable so the demo flow keeps working offline.
 */
export function localIntentFallback(prompt: string): IntentParseResult {
  const text = prompt.toLowerCase();
  const base: IntentParseResult = {
    serviceType: ServiceType.RIDE,
    confidence: 0.4,
    rawPrompt: prompt,
    from: null,
    to: null,
    vehiclePreference: null,
    scheduledTime: null,
    foodQuery: null,
    items: [],
    maxPrice: null,
    priority: 'BALANCED',
    notes: 'Parsed on-device (offline fallback).',
  };

  if (GROCERY_HINTS.some((h) => text.includes(h))) {
    return {
      ...base,
      serviceType: ServiceType.QUICK_COMMERCE,
      items: prompt
        .split(/[,\s]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2)
        .slice(0, 6),
    };
  }
  if (FOOD_HINTS.some((h) => text.includes(h))) {
    return { ...base, serviceType: ServiceType.FOOD, foodQuery: prompt };
  }

  // Ride: try to split "from X to Y".
  const match = /(?:from\s+)?(.+?)\s+to\s+(.+)/i.exec(prompt);
  if (match) {
    return {
      ...base,
      from: { address: match[1]!.trim() },
      to: { address: match[2]!.trim() },
    };
  }
  return base;
}
