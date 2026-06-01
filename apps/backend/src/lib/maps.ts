/**
 * Geocoding helper. Uses the Google Maps API when GOOGLE_MAPS_API_KEY is set;
 * otherwise resolves a handful of well-known landmarks and falls back to a
 * deterministic pseudo-geocode around Delhi so the dev flow still works.
 */
import { Client } from '@googlemaps/google-maps-services-js';
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
