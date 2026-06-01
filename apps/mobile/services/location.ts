/**
 * Location services: current GPS position (expo-location), Google Places
 * autocomplete search and address geocoding.
 */
import * as Location from 'expo-location';
import type { Coordinates } from '@rideai/shared';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

/** Request permission and return the device's current coordinates. */
export async function getCurrentLocation(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied.');
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

/** Autocomplete a place query via Google Places (biased to India). */
export async function searchLocation(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  if (!MAPS_KEY) {
    // Without a key we can't autocomplete; return the raw query as one option.
    return [{ placeId: '', description: q }];
  }
  try {
    const url =
      'https://maps.googleapis.com/maps/api/place/autocomplete/json' +
      `?input=${encodeURIComponent(q)}&components=country:in&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      predictions?: Array<{ place_id: string; description: string }>;
    };
    return (json.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch (err) {
    throw new Error(`searchLocation failed: ${(err as Error).message}`);
  }
}

/** Geocode an address (or place_id) to coordinates via Google Geocoding. */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const a = address.trim();
  if (!a) throw new Error('geocodeAddress: address is empty.');
  if (!MAPS_KEY) {
    throw new Error('geocodeAddress: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
  }
  try {
    const url =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(a)}&region=in&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };
    const loc = json.results?.[0]?.geometry.location;
    if (!loc) throw new Error(`No geocoding result for "${a}".`);
    return { lat: loc.lat, lng: loc.lng };
  } catch (err) {
    throw new Error(`geocodeAddress failed: ${(err as Error).message}`);
  }
}
