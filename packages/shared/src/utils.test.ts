import { describe, expect, it } from 'vitest';
import { daysSince, formatPrice, getDistanceKm, slugify } from './utils';

describe('formatPrice', () => {
  it('formats rupees with the ₹ symbol and Indian grouping', () => {
    expect(formatPrice(1234.5)).toBe('₹1,235');
    expect(formatPrice(100000)).toBe('₹1,00,000');
  });

  it('falls back to ₹0 for non-finite input', () => {
    expect(formatPrice(Number.NaN)).toBe('₹0');
  });
});

describe('getDistanceKm', () => {
  it('computes Rajiv Chowk → India Gate at roughly 2.5 km', () => {
    const rajivChowk = { lat: 28.6328, lng: 77.2197 };
    const indiaGate = { lat: 28.6129, lng: 77.2295 };
    const km = getDistanceKm(rajivChowk, indiaGate);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(3.5);
  });
});

describe('daysSince', () => {
  it('returns 0 for null / future dates', () => {
    expect(daysSince(null)).toBe(0);
    expect(daysSince(new Date(Date.now() + 86_400_000))).toBe(0);
  });

  it('counts whole elapsed days', () => {
    expect(daysSince(new Date(Date.now() - 3 * 86_400_000))).toBe(3);
  });
});

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify('Rajiv Chowk → India Gate!')).toBe('rajiv-chowk-india-gate');
  });
});
