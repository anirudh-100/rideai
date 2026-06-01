/**
 * Loads environment variables (from the monorepo-root .env, then any local
 * .env) and validates the ones the backend depends on. Most are optional so
 * the server still boots in dev without every integration configured.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// apps/backend/src → repo root (.env lives at the monorepo root)
config({ path: resolve(__dirname, '../../../.env') });
// Allow a local override if present.
config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  /**
   * Comma-separated origin allowlist for production CORS. In development we
   * allow any origin; in production this MUST be set or we lock CORS off.
   * Example: "https://rideai.vercel.app,https://admin.rideai.in"
   */
  ALLOWED_ORIGINS: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
