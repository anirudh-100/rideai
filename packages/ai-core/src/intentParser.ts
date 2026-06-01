/**
 * Natural-language → structured intent, via Claude `tool_use`.
 *
 * Handles all three service types (rides, food, quick commerce) and returns a
 * fully-typed {@link IntentParseResult}. Output is validated with Zod so a
 * malformed model response surfaces a clear error instead of leaking through.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  ServiceType,
  VehicleType,
  type IntentParseResult,
  type LocationRef,
  type Priority,
} from '@rideai/shared';
import { CLAUDE_MODEL, getAnthropicClient } from './client';

const PRIORITIES = ['CHEAPEST', 'FASTEST', 'BALANCED'] as const;

const SYSTEM_PROMPT = `You are RideAI's intent parser for India. Convert a user's free-text request into structured fields and register it via the "register_intent" tool.

Rules:
- Classify service_type as RIDE (going somewhere / cab / auto / bike), FOOD (a dish or restaurant order), or QUICK_COMMERCE (groceries / essentials delivered fast).
- For RIDE: fill "from" and "to" with the place names exactly as said (e.g. "Rajiv Chowk", "India Gate"). Do not invent coordinates; leave lat/lng unset unless explicitly given.
- For RIDE: map any vehicle hint to BIKE, AUTO, MINI, SEDAN or SUV; otherwise leave null.
- For FOOD: put the dish/restaurant text in "food_query".
- For QUICK_COMMERCE: list each item in "items" (e.g. ["milk","eggs","bread"]).
- Extract "max_price" in rupees if the user gives a budget ("under ₹200").
- Set "scheduled_time" only if the user asks for a later/specific time (ISO 8601); otherwise null (means now).
- Choose "priority": CHEAPEST if they emphasise price, FASTEST if they emphasise speed/urgency ("fast", "now"), else BALANCED.
- "confidence" is your 0..1 certainty in the classification.
Always call the tool exactly once.`;

const intentTool: Anthropic.Tool = {
  name: 'register_intent',
  description:
    'Record the structured ride/food/quick-commerce intent parsed from the user prompt.',
  input_schema: {
    type: 'object',
    properties: {
      service_type: {
        type: 'string',
        enum: [ServiceType.RIDE, ServiceType.FOOD, ServiceType.QUICK_COMMERCE],
        description: 'The category of the request.',
      },
      confidence: {
        type: 'number',
        description: 'Confidence 0..1 in the classification.',
      },
      from: {
        type: 'object',
        description: 'Ride origin (place name). Omit for food/quick-commerce.',
        properties: {
          address: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
        required: ['address'],
      },
      to: {
        type: 'object',
        description: 'Ride destination (place name). Omit for food/quick-commerce.',
        properties: {
          address: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
        required: ['address'],
      },
      vehicle_preference: {
        type: 'string',
        enum: Object.values(VehicleType),
        description: 'Preferred ride vehicle, if stated.',
      },
      scheduled_time: {
        type: 'string',
        description: 'ISO 8601 time for a scheduled request; omit for "now".',
      },
      food_query: {
        type: 'string',
        description: 'Dish or restaurant query for FOOD requests.',
      },
      items: {
        type: 'array',
        items: { type: 'string' },
        description: 'Items for QUICK_COMMERCE requests.',
      },
      max_price: {
        type: 'number',
        description: 'Budget ceiling in rupees, if stated.',
      },
      priority: {
        type: 'string',
        enum: [...PRIORITIES],
        description: 'What to optimise for.',
      },
      notes: {
        type: 'string',
        description: 'Anything relevant that does not fit another field.',
      },
    },
    required: ['service_type'],
  },
};

const LocationZ = z.object({
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const ToolInputZ = z.object({
  service_type: z.nativeEnum(ServiceType),
  confidence: z.number().min(0).max(1).optional().default(0.6),
  from: LocationZ.nullish(),
  to: LocationZ.nullish(),
  vehicle_preference: z.nativeEnum(VehicleType).nullish(),
  scheduled_time: z.string().nullish(),
  food_query: z.string().nullish(),
  items: z.array(z.string()).optional().default([]),
  max_price: z.number().nullish(),
  priority: z.enum(PRIORITIES).optional().default('BALANCED'),
  notes: z.string().nullish(),
});

function toLocationRef(
  loc: z.infer<typeof LocationZ> | null | undefined,
): LocationRef | null {
  if (!loc) return null;
  return { address: loc.address, lat: loc.lat, lng: loc.lng };
}

/**
 * Parse a raw user prompt into a typed {@link IntentParseResult}.
 * @throws if the prompt is empty, the Claude call fails, or the response is malformed.
 */
export async function parseIntent(rawPrompt: string): Promise<IntentParseResult> {
  const prompt = rawPrompt?.trim();
  if (!prompt) {
    throw new Error('parseIntent: prompt must be a non-empty string.');
  }

  const client = getAnthropicClient();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [intentTool],
      tool_choice: { type: 'tool', name: intentTool.name },
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    throw new Error(
      `parseIntent: Claude request failed — ${(err as Error).message}`,
    );
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('parseIntent: model returned no structured intent.');
  }

  const parsed = ToolInputZ.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `parseIntent: model output failed validation — ${parsed.error.message}`,
    );
  }

  const d = parsed.data;
  return {
    serviceType: d.service_type,
    confidence: d.confidence,
    rawPrompt: prompt,
    from: toLocationRef(d.from),
    to: toLocationRef(d.to),
    vehiclePreference: d.vehicle_preference ?? null,
    scheduledTime: d.scheduled_time ?? null,
    foodQuery: d.food_query ?? null,
    items: d.items,
    maxPrice: d.max_price ?? null,
    priority: d.priority as Priority,
    notes: d.notes ?? null,
  };
}
