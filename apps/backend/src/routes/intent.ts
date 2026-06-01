/**
 * POST /api/intent — parse a raw prompt into a typed IntentParseResult and log
 * the search (best-effort).
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { parseIntent } from '@rideai/ai-core';
import { Prisma, prisma } from '@rideai/db';

const BodySchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  userId: z.string().optional(),
});

export const intentRoute = new Hono();

intentRoute.post('/', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body.' }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body.' }, 400);
  }

  try {
    const result = await parseIntent(parsed.data.prompt);

    try {
      await prisma.searchLog.create({
        data: {
          userId: parsed.data.userId ?? null,
          rawPrompt: parsed.data.prompt,
          parsedIntent: result as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (logErr) {
      console.warn(`intent: searchLog write failed — ${(logErr as Error).message}`);
    }

    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 502);
  }
});
