/**
 * Axios client for the RideAI backend, with auth-header injection and a shared
 * error interceptor, plus typed wrappers for each endpoint.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios';
import type {
  BookingResult,
  CouponData,
  CouponPickResult,
  IntentParseResult,
  Platform,
  PlatformPrice,
  RankedResults,
  ServiceType,
  UserProfile,
} from '@rideai/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message =
      error.response?.data?.error ??
      error.message ??
      'Network request failed';
    return Promise.reject(new Error(message));
  },
);

// --- Typed endpoint wrappers -------------------------------------------------

export async function parseIntent(
  prompt: string,
  userId?: string,
): Promise<IntentParseResult> {
  const { data } = await api.post<IntentParseResult>('/api/intent', { prompt, userId });
  return data;
}

export interface PricesResponse {
  results: PlatformPrice[];
  ranked: RankedResults | null;
  note?: string;
  errors?: Array<{ platform: Platform; error: string }>;
}

export async function comparePrices(
  intent: IntentParseResult,
  userId?: string,
): Promise<PricesResponse> {
  const { data } = await api.post<PricesResponse>('/api/prices', {
    ...intent,
    userId,
  });
  return data;
}

export interface CouponsResponse {
  eligible: Array<{ coupon: CouponData; savings: number }>;
  best: CouponPickResult;
}

export async function getCoupons(params: {
  userId: string;
  platform: Platform;
  serviceType: ServiceType;
  fare: number;
}): Promise<CouponsResponse> {
  const { data } = await api.post<CouponsResponse>('/api/coupons', params);
  return data;
}

export interface CreateBookingInput {
  userId: string;
  platform: Platform;
  serviceType: ServiceType;
  vehicleType?: string | null;
  fromLocation: string;
  toLocation?: string | null;
  fare: number;
  couponApplied?: string | null;
  savings?: number;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<{ booking: BookingResult; payment: { id: string } | null }> {
  const { data } = await api.post('/api/bookings', input);
  return data;
}

export async function getProfile(userId: string): Promise<{
  profile: UserProfile;
  history: unknown[];
  eligibility: unknown[];
}> {
  const { data } = await api.get(`/api/users/${userId}/profile`);
  return data;
}

export async function listBookings(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ bookings: BookingResult[]; limit: number; offset: number }> {
  const { data } = await api.get(`/api/users/${userId}/bookings`, {
    params: opts,
  });
  return data;
}

export async function updateProfile(
  userId: string,
  patch: { name?: string; city?: string; email?: string },
): Promise<{ ok: true; profile: Partial<UserProfile> }> {
  const { data } = await api.patch(`/api/users/${userId}`, patch);
  return data;
}

export async function upsertUser(input: {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  city?: string | null;
}): Promise<{ ok: true; userId: string }> {
  const { data } = await api.post('/api/users', input);
  return data;
}

export async function saveOnboarding(
  userId: string,
  platforms: Platform[],
): Promise<void> {
  await api.post(`/api/users/${userId}/onboarding`, { platforms });
}
