/**
 * Stealth browser harness shared by every scraper: playwright-extra + the
 * puppeteer stealth plugin, Bright Data proxy support, human-like delays and
 * 3-account-per-platform rotation. All driven by env vars (see .env.example).
 *
 * ⚠️ Live scraping of third-party platforms may breach their ToS / local law.
 * `SCRAPER_MODE` defaults to "mock"; only set "live" against targets you are
 * authorised to access.
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, BrowserContext, Page } from 'playwright';
import { Platform } from '@rideai/shared';

export type ScraperMode = 'mock' | 'live';

/** Resolve the scraper mode. Defaults to "mock" unless SCRAPER_MODE=live. */
export function scraperMode(): ScraperMode {
  return process.env.SCRAPER_MODE === 'live' ? 'live' : 'mock';
}

let stealthApplied = false;
function ensureStealth(): void {
  if (!stealthApplied) {
    chromium.use(StealthPlugin());
    stealthApplied = true;
  }
}

/** Resolve after a random human-like pause (default 2000–4000 ms). */
export function humanDelay(minMs = 2000, maxMs = 4000): Promise<void> {
  const span = Math.max(0, maxMs - minMs);
  const ms = Math.floor(minMs + Math.random() * span);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TestAccount {
  phone: string;
  otp: string;
  /** 1-based slot the account came from. */
  index: number;
}

/**
 * Read the configured test accounts for a platform from env and pick one,
 * rotating randomly (or honouring `preferredIndex`).
 * @throws if no accounts are configured for the platform.
 */
export function getTestAccount(
  platform: Platform,
  preferredIndex?: number,
): TestAccount {
  const prefix = platform.toUpperCase();
  const accounts: TestAccount[] = [];
  for (let i = 1; i <= 3; i++) {
    const phone = process.env[`${prefix}_TEST_ACCOUNT_${i}_PHONE`];
    const otp = process.env[`${prefix}_TEST_ACCOUNT_${i}_OTP`];
    if (phone && otp) accounts.push({ phone, otp, index: i });
  }
  if (accounts.length === 0) {
    throw new Error(
      `No ${prefix} test accounts configured. Set ${prefix}_TEST_ACCOUNT_1_PHONE / _OTP in .env.`,
    );
  }
  if (preferredIndex != null) {
    const match = accounts.find((a) => a.index === preferredIndex);
    if (match) return match;
  }
  const picked = accounts[Math.floor(Math.random() * accounts.length)];
  return picked!;
}

export interface ProxyConfig {
  server: string;
  username: string;
  password: string;
}

/** Bright Data residential proxy config, or undefined if not configured. */
export function getProxy(): ProxyConfig | undefined {
  const username = process.env.BRIGHT_DATA_USERNAME;
  const password = process.env.BRIGHT_DATA_PASSWORD;
  if (!username || !password) return undefined;
  const host = process.env.BRIGHT_DATA_HOST ?? 'brd.superproxy.io';
  const port = process.env.BRIGHT_DATA_PORT ?? '22225';
  return { server: `http://${host}:${port}`, username, password };
}

export interface StealthSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Launch a stealth Chromium session (mobile UA + viewport, proxy if set).
 * Remember to call {@link closeSession} when done.
 */
export async function launchStealthBrowser(opts?: {
  headless?: boolean;
}): Promise<StealthSession> {
  ensureStealth();
  const proxy = getProxy();
  const browser = await chromium.launch({
    headless: opts?.headless ?? true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    ...(proxy
      ? { proxy: { server: proxy.server, username: proxy.username, password: proxy.password } }
      : {}),
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 393, height: 851 },
    locale: 'en-IN',
  });
  const page = await context.newPage();
  return { browser, context, page };
}

/** Best-effort teardown of a stealth session. */
export async function closeSession(session: StealthSession): Promise<void> {
  try {
    await session.context.close();
  } catch {
    /* already closed */
  }
  try {
    await session.browser.close();
  } catch {
    /* already closed */
  }
}
