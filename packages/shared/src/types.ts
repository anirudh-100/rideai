/**
 * Core domain types shared across RideAI. These are the contract between the
 * AI layer, scrapers, backend and clients. Keep them framework-agnostic.
 */
import type {
  BookingStatus,
  CouponType,
  DiscountType,
  Platform,
  ServiceType,
  VehicleType,
} from './enums';

/** A geographic point. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** A referenced location — may be only an address until geocoded. */
export interface LocationRef {
  address: string;
  lat?: number;
  lng?: number;
  /** Google Places place_id when available. */
  placeId?: string;
}

/** What the user optimises for. */
export type Priority = 'CHEAPEST' | 'FASTEST' | 'BALANCED';

// ----------------------------------------------------------------------------
// User
// ----------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  city: string | null;
  /** Platforms the user told us they've used before (onboarding). */
  selfReportedPlatforms: Platform[];
  totalBookings: number;
  /** ISO timestamp of the last booking, or null if none. */
  lastBookingDate: string | null;
  createdAt: string;
}

/** Per-platform usage history used for coupon eligibility decisions. */
export interface PlatformHistoryEntry {
  platform: Platform;
  bookingsCount: number;
  /** ISO timestamp the user first used this platform (via RideAI). */
  firstUsedAt: string | null;
}

/** Derived eligibility flags surfaced to the coupon picker. */
export interface CouponEligibility {
  platform: Platform;
  isNewUser: boolean;
  isInactiveUser: boolean;
  daysSinceLastBooking: number | null;
  bookingsCount: number;
}

// ----------------------------------------------------------------------------
// Requests (normalised intents per service type)
// ----------------------------------------------------------------------------

export interface RideRequest {
  serviceType: ServiceType.RIDE;
  from: LocationRef;
  to: LocationRef;
  vehiclePreference?: VehicleType | null;
  /** ISO timestamp for a scheduled ride, or null for "now". */
  scheduledTime?: string | null;
  maxPrice?: number | null;
  priority?: Priority;
}

export interface FoodRequest {
  serviceType: ServiceType.FOOD;
  /** Free-text dish / restaurant query, e.g. "biryani". */
  query: string;
  deliverTo?: LocationRef;
  maxPrice?: number | null;
  priority?: Priority;
}

export interface QuickCommerceRequest {
  serviceType: ServiceType.QUICK_COMMERCE;
  /** Grocery / essentials items, e.g. ["milk", "eggs", "bread"]. */
  items: string[];
  deliverTo?: LocationRef;
  maxPrice?: number | null;
  priority?: Priority;
}

export type ServiceRequest = RideRequest | FoodRequest | QuickCommerceRequest;

// ----------------------------------------------------------------------------
// AI: intent parse result (single shape covering all three service types)
// ----------------------------------------------------------------------------

export interface IntentParseResult {
  serviceType: ServiceType;
  /** Model confidence 0..1 in the classification. */
  confidence: number;
  /** The original prompt the user typed. */
  rawPrompt: string;
  /** Rides only — origin. */
  from: LocationRef | null;
  /** Rides only — destination. */
  to: LocationRef | null;
  vehiclePreference: VehicleType | null;
  /** ISO timestamp if the user asked to schedule, else null. */
  scheduledTime: string | null;
  /** Food only — dish/restaurant query. */
  foodQuery: string | null;
  /** Quick commerce only — list of items. */
  items: string[];
  maxPrice: number | null;
  priority: Priority;
  /** Anything the model couldn't slot but thought worth keeping. */
  notes?: string | null;
}

// ----------------------------------------------------------------------------
// Coupons
// ----------------------------------------------------------------------------

export interface CouponData {
  code: string;
  platform: Platform;
  type: CouponType;
  title?: string | null;
  description?: string | null;
  discountType: DiscountType;
  /** Percent (0..100) when PERCENT, rupees when FLAT. */
  discountValue: number;
  /** Cap on a PERCENT discount, in rupees. */
  maxDiscount?: number | null;
  /** Minimum order/fare in rupees for the coupon to apply. */
  minFare?: number | null;
  /** Service type the coupon is valid for, or null for any. */
  validFor?: ServiceType | null;
  validForCity?: string | null;
  firstOrderOnly: boolean;
  accountSpecific: boolean;
  /** 0..1 historical apply-success rate from validation runs. */
  successRate?: number | null;
  /** ISO timestamp the coupon was last verified working. */
  lastVerified?: string | null;
  /** ISO timestamp the coupon expires, or null if unknown. */
  expiresAt?: string | null;
  /** Where it was scraped from, e.g. "couponDunia". */
  source?: string | null;
}

/** A coupon actually applied to a quote, with the resolved saving. */
export interface AppliedCoupon {
  code: string;
  /** Rupees saved on this fare. */
  savings: number;
  /** Human-readable explanation (from the AI coupon picker). */
  reason?: string;
  /** ISO timestamp the coupon was last verified. */
  verifiedAt?: string | null;
}

// ----------------------------------------------------------------------------
// Prices
// ----------------------------------------------------------------------------

export interface PlatformPrice {
  platform: Platform;
  serviceType: ServiceType;
  vehicleType?: VehicleType | null;
  /** Display label, e.g. "Auto", "Bike", "Sedan", or a dish name. */
  label: string;
  /** Quoted base fare in rupees, before any coupon. */
  fare: number;
  currency: 'INR';
  /** Pickup ETA in minutes (rides) or delivery ETA (food/qc). */
  etaMinutes?: number | null;
  surgeMultiplier?: number | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  deepLink?: string | null;
  couponApplied?: AppliedCoupon | null;
  /** Fare after the applied coupon, in rupees. */
  finalFare?: number | null;
  available: boolean;
  /** ISO timestamp the quote was fetched. */
  fetchedAt: string;
}

/** A platform price after AI ranking. */
export interface RankedPlatformResult extends PlatformPrice {
  rank: number;
  isBest: boolean;
}

export interface RankedResults {
  results: RankedPlatformResult[];
  /** Natural-language recommendation shown to the user. */
  recommendation: string;
  bestPlatform: Platform | null;
}

/** Output of the AI coupon picker. */
export interface CouponPickResult {
  coupon: CouponData | null;
  savings: number;
  reason: string;
}

// ----------------------------------------------------------------------------
// Bookings
// ----------------------------------------------------------------------------

export interface BookingResult {
  bookingId: string;
  userId: string;
  platform: Platform;
  serviceType: ServiceType;
  vehicleType?: VehicleType | null;
  fromLocation: string;
  toLocation: string | null;
  fare: number;
  couponApplied: string | null;
  savings: number;
  status: BookingStatus;
  deepLink?: string | null;
  createdAt: string;
}
