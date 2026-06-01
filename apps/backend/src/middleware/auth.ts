/**
 * Auth middleware — verifies the Bearer token via Supabase and decorates the
 * Hono context with `userId`. Two behaviours:
 *
 * - **Permissive** (default): no token → request proceeds with userId = null.
 *   Used by routes that work for guests (intent parsing, price comparison).
 * - **Required** (via `requireAuth`): no token (or invalid) → 401. Used by
 *   per-user routes (bookings, user profile mutations).
 *
 * When `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing, both
 * middlewares are no-ops and the route falls back to the client-provided
 * `userId` (dev mode).
 */
import type { Context, MiddlewareHandler } from 'hono';
import { getSupabaseServer } from '../lib/supabaseServer';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string | null;
  }
}

function extractBearer(c: Context): string | null {
  const header = c.req.header('Authorization') ?? c.req.header('authorization');
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? (m[1] ?? null) : null;
}

/**
 * Permissive auth: best-effort. Sets c.var.userId from a valid JWT, or null.
 */
export const attachAuth: MiddlewareHandler = async (c, next) => {
  const supabase = getSupabaseServer();
  const token = extractBearer(c);
  let userId: string | null = null;
  if (supabase && token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) userId = data.user.id;
    } catch {
      // ignore — userId stays null
    }
  }
  c.set('userId', userId);
  await next();
};

/**
 * Strict auth: 401s when a valid JWT isn't present AND Supabase is configured.
 * In dev (no Supabase) it's a no-op.
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const supabase = getSupabaseServer();
  if (!supabase) {
    // Dev mode — let it pass; route reads userId from body or path param.
    await next();
    return;
  }
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Authentication required.' }, 401);
  }
  await next();
};
