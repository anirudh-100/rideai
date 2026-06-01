/**
 * Builds platform deep links and opens them.
 *
 * Native (iOS/Android): the platform's own app-scheme URL (uber://, olacabs://,
 *   rapido://) — these honour pickup/drop coordinates and open the real app.
 *
 * Web: the platform's web booking flow is locked down for most rides (Uber
 *   requires a registered developer client_id to honour `m.uber.com/ul/`, and
 *   Rapido has no public web booking at all). To keep the demo coherent and
 *   guarantee pickup + drop are visible to the user, ride platforms fall back
 *   to a public Google Maps directions URL on web — no API key required, route
 *   shows pre-filled from→to. Food / quick-commerce platforms still go to their
 *   own homepage on web (search params for items would require per-platform work).
 */
import { Linking, Platform as RNPlatform } from 'react-native';
import { Platform } from '@rideai/shared';

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Build a public Google Maps directions URL with pickup + drop pre-filled.
 * Uses address when present (Maps shows the place names), falls back to lat,lng.
 * No API key needed — `?api=1` is the public consumer URL spec.
 */
export function googleMapsDirectionsUrl(pickup: GeoPoint, drop: GeoPoint): string {
  const origin = pickup.address
    ? encodeURIComponent(pickup.address)
    : `${pickup.lat},${pickup.lng}`;
  const destination = drop.address
    ? encodeURIComponent(drop.address)
    : `${drop.lat},${drop.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

interface PlatformLinks {
  /** Native app-scheme deep link (iOS/Android only). */
  app: (pickup: GeoPoint, drop: GeoPoint, coupon?: string) => string;
  /** Web fallback URL — opened in a new tab on web. */
  web: (pickup: GeoPoint, drop: GeoPoint) => string;
  androidStore: string;
  iosStore: string;
}

const LINKS: Record<Platform, PlatformLinks> = {
  [Platform.UBER]: {
    app: (p, d) =>
      `uber://?action=setPickup&pickup[latitude]=${p.lat}&pickup[longitude]=${p.lng}&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}`,
    // Universal link — opens Uber app on mobile (pre-fills pickup/drop), shows
    // Uber's landing page on desktop (params ignored without a registered client_id).
    web: (p, d) =>
      `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${p.lat}&pickup[longitude]=${p.lng}&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}`,
    androidStore: 'https://play.google.com/store/apps/details?id=com.ubercab',
    iosStore: 'https://apps.apple.com/app/uber/id368677368',
  },
  [Platform.OLA]: {
    app: (p, d) =>
      `olacabs://app/launch?lat=${p.lat}&lng=${p.lng}&drop_lat=${d.lat}&drop_lng=${d.lng}`,
    // Ola affiliate-widget URL — pre-fills drop on web when honoured by their site.
    web: (_p, d) => {
      const dropName = d.address ? encodeURIComponent(d.address) : '';
      return `https://book.olacabs.com/?serviceType=p2p&utm_source=widget_on_olacabs&drop_lat=${d.lat}&drop_lng=${d.lng}&drop_name=${dropName}`;
    },
    androidStore: 'https://play.google.com/store/apps/details?id=com.olacabs.customer',
    iosStore: 'https://apps.apple.com/app/ola-cabs/id539179365',
  },
  [Platform.RAPIDO]: {
    app: (p, d) =>
      `rapido://book?pickupLat=${p.lat}&pickupLng=${p.lng}&dropLat=${d.lat}&dropLng=${d.lng}`,
    // Rapido has no public web booking flow — open their homepage / install page.
    web: () => 'https://www.rapido.bike',
    androidStore: 'https://play.google.com/store/apps/details?id=com.rapido.passenger',
    iosStore: 'https://apps.apple.com/app/rapido/id1198698422',
  },
  [Platform.ZOMATO]: {
    app: () => 'zomato://',
    web: () => 'https://www.zomato.com',
    androidStore: 'https://play.google.com/store/apps/details?id=com.application.zomato',
    iosStore: 'https://apps.apple.com/app/zomato/id434613896',
  },
  [Platform.SWIGGY]: {
    app: () => 'swiggy://',
    web: () => 'https://www.swiggy.com',
    androidStore: 'https://play.google.com/store/apps/details?id=in.swiggy.android',
    iosStore: 'https://apps.apple.com/app/swiggy/id989540920',
  },
  [Platform.ZEPTO]: {
    app: () => 'zepto://',
    web: () => 'https://www.zeptonow.com',
    androidStore: 'https://play.google.com/store/apps/details?id=com.zeptoconsumerapp',
    iosStore: 'https://apps.apple.com/app/zepto/id1609097755',
  },
  [Platform.BLINKIT]: {
    app: () => 'blinkit://',
    web: () => 'https://blinkit.com',
    androidStore: 'https://play.google.com/store/apps/details?id=com.grofers.customer',
    iosStore: 'https://apps.apple.com/app/blinkit/id1056885819',
  },
};

/** Build the best deep link for a platform given pickup/drop and an optional coupon. */
export function buildDeepLink(
  platform: Platform,
  pickup: GeoPoint,
  drop: GeoPoint,
  coupon?: string,
): string {
  return LINKS[platform].app(pickup, drop, coupon);
}

function storeUrl(platform: Platform): string {
  const links = LINKS[platform];
  return RNPlatform.OS === 'ios' ? links.iosStore : links.androidStore;
}

/**
 * Open the platform's app via deep link; if it can't be opened, fall back to
 * the web URL and finally the app store. Returns the URL that was opened.
 *
 * On web, always opens in a NEW TAB so the RideAI confirmation screen stays
 * visible in the current tab — otherwise `Linking.openURL` would navigate the
 * whole browser away from our app.
 */
export async function openDeepLink(
  platform: Platform,
  pickup: GeoPoint,
  drop: GeoPoint,
  coupon?: string,
): Promise<string> {
  const webUrl = LINKS[platform].web(pickup, drop);

  if (RNPlatform.OS === 'web') {
    // App-scheme URLs (uber://, olacabs://) don't resolve in browsers, so go
    // straight to the platform's web URL. _blank keeps RideAI in the foreground.
    if (typeof window !== 'undefined') {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
    return webUrl;
  }

  const appUrl = buildDeepLink(platform, pickup, drop, coupon);
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return appUrl;
    }
  } catch {
    /* fall through to web/store */
  }

  try {
    const canOpenWeb = await Linking.canOpenURL(webUrl);
    if (canOpenWeb) {
      await Linking.openURL(webUrl);
      return webUrl;
    }
  } catch {
    /* fall through to store */
  }

  const store = storeUrl(platform);
  await Linking.openURL(store);
  return store;
}
