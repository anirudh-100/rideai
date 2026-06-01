/**
 * Small, dependency-free helpers shared across RideAI.
 */
import type { Coordinates } from './types';

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Format a rupee amount for display, e.g. `formatPrice(1234.5)` → "₹1,235".
 * Pass `fractionDigits` to keep paise.
 */
export function formatPrice(amount: number, fractionDigits = 0): string {
  if (!Number.isFinite(amount)) return '₹0';
  if (fractionDigits === 0) return INR_FORMATTER.format(Math.round(amount));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle (haversine) distance in kilometres between two coordinates,
 * rounded to 2 decimals.
 */
export function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Whole days elapsed since `date` (Date or ISO string). Returns 0 for future
 * or invalid dates.
 */
export function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const then = typeof date === 'string' ? new Date(date) : date;
  const ms = then.getTime();
  if (Number.isNaN(ms)) return 0;
  const diff = Date.now() - ms;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86_400_000);
}

/**
 * URL/file-safe slug: lowercase, ASCII-ish, hyphen-separated.
 * `slugify("Rajiv Chowk → India Gate!")` → "rajiv-chowk-india-gate".
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
