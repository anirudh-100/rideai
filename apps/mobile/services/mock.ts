/**
 * Mock data used as a graceful fallback when the backend is unreachable, so the
 * UI is always demoable. Real data comes from the API in services/api.ts.
 */
import {
  Platform,
  ServiceType,
  VehicleType,
  type AppliedCoupon,
  type BookingResult,
  type PlatformPrice,
  BookingStatus,
} from '@rideai/shared';

const now = new Date().toISOString();

export function mockRidePrices(): PlatformPrice[] {
  const bestCoupon: AppliedCoupon = {
    code: 'RAPIDO25',
    savings: 18,
    reason: '25% off Rapido autos',
    verifiedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  };

  const base: Array<Omit<PlatformPrice, 'fetchedAt' | 'currency' | 'available'>> = [
    { platform: Platform.RAPIDO, serviceType: ServiceType.RIDE, vehicleType: VehicleType.AUTO, label: 'Auto', fare: 72, etaMinutes: 3, couponApplied: bestCoupon, finalFare: 54 },
    { platform: Platform.UBER, serviceType: ServiceType.RIDE, vehicleType: VehicleType.AUTO, label: 'Uber Auto', fare: 86, etaMinutes: 5, couponApplied: null, finalFare: 86 },
    { platform: Platform.OLA, serviceType: ServiceType.RIDE, vehicleType: VehicleType.AUTO, label: 'Ola Auto', fare: 79, etaMinutes: 4, couponApplied: null, finalFare: 79 },
    { platform: Platform.RAPIDO, serviceType: ServiceType.RIDE, vehicleType: VehicleType.BIKE, label: 'Bike', fare: 45, etaMinutes: 2, couponApplied: null, finalFare: 45 },
    { platform: Platform.UBER, serviceType: ServiceType.RIDE, vehicleType: VehicleType.MINI, label: 'UberGo', fare: 142, etaMinutes: 6, couponApplied: null, finalFare: 142 },
    { platform: Platform.OLA, serviceType: ServiceType.RIDE, vehicleType: VehicleType.MINI, label: 'Mini', fare: 138, etaMinutes: 7, couponApplied: null, finalFare: 138 },
  ];

  return base.map((p) => ({
    ...p,
    currency: 'INR',
    available: true,
    fetchedAt: now,
  }));
}

export function mockBookings(): BookingResult[] {
  return [
    {
      bookingId: 'bk_1',
      userId: 'demo-user',
      platform: Platform.UBER,
      serviceType: ServiceType.RIDE,
      vehicleType: VehicleType.AUTO,
      fromLocation: 'Rajiv Chowk',
      toLocation: 'India Gate',
      fare: 142,
      couponApplied: 'UBERAUTO20',
      savings: 28,
      status: BookingStatus.COMPLETED,
      createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
    {
      bookingId: 'bk_2',
      userId: 'demo-user',
      platform: Platform.SWIGGY,
      serviceType: ServiceType.FOOD,
      vehicleType: null,
      fromLocation: 'Swiggy',
      toLocation: 'Home',
      fare: 320,
      couponApplied: 'SWIGGYIT100',
      savings: 100,
      status: BookingStatus.COMPLETED,
      createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    },
  ];
}
