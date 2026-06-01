/**
 * GET /api/places/autocomplete?q=...&session=...
 * Typeahead for address fields. Returns [] when GOOGLE_MAPS_API_KEY is not
 * configured (caller falls back to free-text).
 */
import { Hono } from 'hono';
import { autocompletePlace } from '../lib/maps';

export const placesRoute = new Hono();

placesRoute.get('/autocomplete', async (c) => {
  const q = c.req.query('q')?.trim() ?? '';
  const session = c.req.query('session') ?? undefined;
  if (!q) return c.json({ suggestions: [] });

  const suggestions = await autocompletePlace(q, { sessionToken: session });
  return c.json({ suggestions });
});
