/**
 * Deterministic-ish fare estimator used in mock mode so the whole RideAI flow
 * works end-to-end without hitting any real platform. Rates are illustrative
 * (rough Indian metro pricing), with small per-quote jitter and occasional
 * surge so platforms differ and "best deal" is meaningful.
 */
import {
  Platform,
  ServiceType,
  VehicleType,
  type PlatformPrice,
} from '@rideai/shared';

interface Rate {
  base: number;
  perKm: number;
  perMin: number;
  minFare: number;
}

const RATES: Record<VehicleType, Rate> = {
  [VehicleType.BIKE]: { base: 15, perKm: 6, perMin: 1, minFare: 25 },
  [VehicleType.AUTO]: { base: 30, perKm: 11, perMin: 1.2, minFare: 35 },
  [VehicleType.MINI]: { base: 50, perKm: 14, perMin: 1.5, minFare: 70 },
  [VehicleType.SEDAN]: { base: 70, perKm: 17, perMin: 2, minFare: 100 },
  [VehicleType.SUV]: { base: 100, perKm: 22, perMin: 2.5, minFare: 150 },
};

/** Relative price positioning per platform. */
const PLATFORM_FACTOR: Partial<Record<Platform, number>> = {
  [Platform.UBER]: 1.05,
  [Platform.OLA]: 1.0,
  [Platform.RAPIDO]: 0.9,
};

/** Which vehicle classes each ride platform offers. */
const PLATFORM_VEHICLES: Partial<Record<Platform, VehicleType[]>> = {
  [Platform.UBER]: [
    VehicleType.BIKE,
    VehicleType.AUTO,
    VehicleType.MINI,
    VehicleType.SEDAN,
    VehicleType.SUV,
  ],
  [Platform.OLA]: [
    VehicleType.BIKE,
    VehicleType.AUTO,
    VehicleType.MINI,
    VehicleType.SEDAN,
    VehicleType.SUV,
  ],
  [Platform.RAPIDO]: [VehicleType.BIKE, VehicleType.AUTO, VehicleType.MINI],
};

/** Platform-specific display labels for each vehicle class. */
const VEHICLE_LABELS: Partial<Record<Platform, Partial<Record<VehicleType, string>>>> = {
  [Platform.UBER]: {
    [VehicleType.BIKE]: 'Uber Moto',
    [VehicleType.AUTO]: 'Uber Auto',
    [VehicleType.MINI]: 'UberGo',
    [VehicleType.SEDAN]: 'Premier',
    [VehicleType.SUV]: 'Uber XL',
  },
  [Platform.OLA]: {
    [VehicleType.BIKE]: 'Ola Bike',
    [VehicleType.AUTO]: 'Ola Auto',
    [VehicleType.MINI]: 'Mini',
    [VehicleType.SEDAN]: 'Prime Sedan',
    [VehicleType.SUV]: 'Prime SUV',
  },
  [Platform.RAPIDO]: {
    [VehicleType.BIKE]: 'Bike',
    [VehicleType.AUTO]: 'Auto',
    [VehicleType.MINI]: 'Cab Economy',
  },
};

function jitter(pct = 0.05): number {
  return 1 + (Math.random() * 2 - 1) * pct;
}

function estimateOne(
  platform: Platform,
  vehicle: VehicleType,
  distanceKm: number,
): PlatformPrice {
  const rate = RATES[vehicle];
  const durationMin = Math.max(1, Math.round(distanceKm * 2.4));
  const raw = rate.base + rate.perKm * distanceKm + rate.perMin * durationMin;
  const surge = Math.random() < 0.2 ? 1.2 : 1.0;
  const factor = PLATFORM_FACTOR[platform] ?? 1.0;
  const fare = Math.max(rate.minFare, Math.round(raw * factor * surge * jitter()));
  const label = VEHICLE_LABELS[platform]?.[vehicle] ?? vehicle;

  return {
    platform,
    serviceType: ServiceType.RIDE,
    vehicleType: vehicle,
    label,
    fare,
    currency: 'INR',
    etaMinutes: 2 + Math.floor(Math.random() * 7),
    surgeMultiplier: surge === 1.0 ? null : surge,
    distanceKm,
    durationMin,
    deepLink: null,
    couponApplied: null,
    finalFare: fare,
    available: true,
    fetchedAt: new Date().toISOString(),
  };
}

/** Estimated ride prices for every vehicle class a platform offers. */
export function estimateRidePrices(
  platform: Platform,
  distanceKm: number,
): PlatformPrice[] {
  const vehicles = PLATFORM_VEHICLES[platform] ?? [VehicleType.AUTO];
  return vehicles.map((v) => estimateOne(platform, v, distanceKm));
}
