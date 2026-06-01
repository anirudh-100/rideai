/**
 * Mock data for the admin dashboard, typed with @rideai/shared so it mirrors
 * the real API shapes. Swap for live API calls when wiring the backend.
 */
import {
  BookingStatus,
  CouponType,
  DiscountType,
  Platform,
  ServiceType,
  type CouponData,
} from '@rideai/shared';

function iso(daysOffset: number): string {
  return new Date(Date.now() + daysOffset * 86_400_000).toISOString();
}

export const MOCK_COUPONS: CouponData[] = [
  {
    code: 'FIRSTUBER',
    platform: Platform.UBER,
    type: CouponType.NEW_USER,
    discountType: DiscountType.PERCENT,
    discountValue: 50,
    maxDiscount: 100,
    minFare: 0,
    validFor: ServiceType.RIDE,
    validForCity: null,
    firstOrderOnly: true,
    accountSpecific: false,
    successRate: 0.92,
    lastVerified: iso(-1),
    expiresAt: iso(30),
    source: 'couponDunia',
  },
  {
    code: 'OLAGO75',
    platform: Platform.OLA,
    type: CouponType.PUBLIC,
    discountType: DiscountType.FLAT,
    discountValue: 75,
    maxDiscount: null,
    minFare: 150,
    validFor: ServiceType.RIDE,
    validForCity: null,
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.68,
    lastVerified: iso(-2),
    expiresAt: iso(15),
    source: 'grabOn',
  },
  {
    code: 'WELCOME60',
    platform: Platform.ZOMATO,
    type: CouponType.NEW_USER,
    discountType: DiscountType.PERCENT,
    discountValue: 60,
    maxDiscount: 120,
    minFare: 149,
    validFor: ServiceType.FOOD,
    validForCity: null,
    firstOrderOnly: true,
    accountSpecific: false,
    successRate: 0.9,
    lastVerified: iso(-1),
    expiresAt: iso(30),
    source: 'grabOn',
  },
  {
    code: 'SWIGGYIT100',
    platform: Platform.SWIGGY,
    type: CouponType.SEGMENT,
    discountType: DiscountType.FLAT,
    discountValue: 100,
    maxDiscount: null,
    minFare: 199,
    validFor: ServiceType.FOOD,
    validForCity: 'Mumbai',
    firstOrderOnly: false,
    accountSpecific: false,
    successRate: 0.7,
    lastVerified: iso(-3),
    expiresAt: iso(10),
    source: 'couponDunia',
  },
];

export interface AdminBooking {
  id: string;
  user: string;
  platform: Platform;
  serviceType: ServiceType;
  fare: number;
  savings: number;
  status: BookingStatus;
  createdAt: string;
}

export const MOCK_BOOKINGS: AdminBooking[] = [
  { id: 'bk_1', user: 'Aarav Sharma', platform: Platform.UBER, serviceType: ServiceType.RIDE, fare: 142, savings: 28, status: BookingStatus.COMPLETED, createdAt: iso(-2) },
  { id: 'bk_2', user: 'Rohan Mehta', platform: Platform.SWIGGY, serviceType: ServiceType.FOOD, fare: 320, savings: 100, status: BookingStatus.COMPLETED, createdAt: iso(-5) },
  { id: 'bk_3', user: 'Priya Nair', platform: Platform.RAPIDO, serviceType: ServiceType.RIDE, fare: 54, savings: 18, status: BookingStatus.CONFIRMED, createdAt: iso(0) },
  { id: 'bk_4', user: 'Aarav Sharma', platform: Platform.BLINKIT, serviceType: ServiceType.QUICK_COMMERCE, fare: 240, savings: 50, status: BookingStatus.PENDING, createdAt: iso(0) },
];

export interface AdminUser {
  id: string;
  name: string;
  city: string;
  totalBookings: number;
  platforms: Platform[];
}

export const MOCK_USERS: AdminUser[] = [
  { id: 'u_1', name: 'Aarav Sharma', city: 'Delhi', totalBookings: 12, platforms: [Platform.UBER, Platform.OLA, Platform.ZOMATO] },
  { id: 'u_2', name: 'Priya Nair', city: 'Bengaluru', totalBookings: 0, platforms: [] },
  { id: 'u_3', name: 'Rohan Mehta', city: 'Mumbai', totalBookings: 5, platforms: [Platform.RAPIDO, Platform.SWIGGY, Platform.BLINKIT] },
];

export const STATS = {
  totalUsers: 1284,
  bookingsToday: 76,
  activeCoupons: MOCK_COUPONS.length,
  avgSavings: 64,
};
