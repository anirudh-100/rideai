/**
 * Geocoding + places helpers. Uses the Google Maps APIs when
 * GOOGLE_MAPS_API_KEY is set; otherwise resolves a handful of well-known
 * landmarks and falls back to a deterministic pseudo-geocode around Delhi so
 * the dev flow still works without a key.
 */
import { Client, type PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import type { Coordinates, LocationRef } from '@rideai/shared';
import { env } from '../env';

const LANDMARKS: Record<string, Coordinates> = {
  'rajiv chowk': { lat: 28.6328, lng: 77.2197 },
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'india gate': { lat: 28.6129, lng: 77.2295 },
  'cyber hub': { lat: 28.4949, lng: 77.089 },
  'hauz khas': { lat: 28.5494, lng: 77.2001 },
  'igi airport': { lat: 28.5562, lng: 77.1 },
  'new delhi railway station': { lat: 28.6431, lng: 77.2197 },
};

let client: Client | null = null;
function getClient(): Client {
  if (!client) client = new Client({});
  return client;
}

function pseudoGeocode(address: string): Coordinates {
  let h = 0;
  for (let i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) | 0;
  const abs = Math.abs(h);
  return {
    lat: 28.5 + (abs % 200) / 1000,
    lng: 77.1 + ((abs >> 5) % 200) / 1000,
  };
}

/** Resolve an address to coordinates. Never throws — falls back if needed. */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const key = address.trim().toLowerCase();
  const landmark = LANDMARKS[key];
  if (landmark) return landmark;

  if (env.GOOGLE_MAPS_API_KEY) {
    try {
      const res = await getClient().geocode({
        params: { address, region: 'in', key: env.GOOGLE_MAPS_API_KEY },
      });
      const loc = res.data.results[0]?.geometry.location;
      if (loc) return { lat: loc.lat, lng: loc.lng };
    } catch (err) {
      console.warn(`geocodeAddress: Google geocode failed — ${(err as Error).message}`);
    }
  }
  return pseudoGeocode(key);
}

/** Resolve a LocationRef to coordinates, preferring any provided lat/lng. */
export async function resolveLocation(ref: LocationRef): Promise<Coordinates> {
  if (ref.lat != null && ref.lng != null) {
    return { lat: ref.lat, lng: ref.lng };
  }
  if (!ref.address) {
    throw new Error('resolveLocation: location has neither coordinates nor address.');
  }
  return geocodeAddress(ref.address);
}

/** Whether real Google Maps APIs are configured (vs landmark/pseudo fallback). */
export function isMapsEnabled(): boolean {
  return !!env.GOOGLE_MAPS_API_KEY;
}

export interface PlaceSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText?: string;
}

/**
 * Places Autocomplete — typeahead for address fields. Requires
 * GOOGLE_MAPS_API_KEY; returns [] when the key is missing so callers can
 * gracefully fall back to free-text.
 */
export async function autocompletePlace(
  input: string,
  opts: { sessionToken?: string; lang?: string } = {},
): Promise<PlaceSuggestion[]> {
  if (!env.GOOGLE_MAPS_API_KEY) return [];
  if (!input.trim()) return [];

  try {
    const res = await getClient().placeAutocomplete({
      params: {
        input,
        key: env.GOOGLE_MAPS_API_KEY,
        components: ['country:in'],
        language: opts.lang ?? 'en',
        sessiontoken: opts.sessionToken,
      },
    });
    return (res.data.predictions ?? []).map((p: PlaceAutocompleteResult) => ({
      description: p.description,
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? undefined,
    }));
  } catch (err) {
    console.warn(`autocompletePlace: Google call failed — ${(err as Error).message}`);
    return [];
  }
}
