/**
 * AI result ranker: orders platform price quotes and writes a short
 * recommendation. Falls back to a deterministic price sort if the AI call
 * fails, so results are always returned.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  formatPrice,
  type PlatformPrice,
  type Platform,
  type Priority,
  type RankedPlatformResult,
  type RankedResults,
} from '@rideai/shared';
import { CLAUDE_MODEL, getAnthropicClient } from './client';

export interface RankInput {
  results: PlatformPrice[];
  priority?: Priority;
}

const rankTool: Anthropic.Tool = {
  name: 'rank_results',
  description: 'Rank the platform options best-first and recommend one.',
  input_schema: {
    type: 'object',
    properties: {
      order: {
        type: 'array',
        description: 'Result keys ("PLATFORM|label") from best to worst.',
        items: { type: 'string' },
      },
      best_key: {
        type: 'string',
        description: 'The single best result key.',
      },
      recommendation: {
        type: 'string',
        description: 'One or two sentences telling the user which to pick and why.',
      },
    },
    required: ['order', 'best_key', 'recommendation'],
  },
};

const RankZ = z.object({
  order: z.array(z.string()),
  best_key: z.string(),
  recommendation: z.string(),
});

function keyOf(p: PlatformPrice): string {
  return `${p.platform}|${p.label}`;
}

function effectiveFare(p: PlatformPrice): number {
  return p.finalFare ?? p.fare;
}

/** Deterministic ranking: available first, then cheapest effective fare. */
function sortByPrice(results: PlatformPrice[]): PlatformPrice[] {
  return [...results].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return effectiveFare(a) - effectiveFare(b);
  });
}

function toRanked(
  ordered: PlatformPrice[],
  bestKey: string | null,
): RankedPlatformResult[] {
  return ordered.map((p, i) => ({
    ...p,
    rank: i + 1,
    isBest: bestKey != null ? keyOf(p) === bestKey : i === 0,
  }));
}

/**
 * Rank platform price results and produce a recommendation.
 * @throws if `results` is empty.
 */
export async function rankResults(input: RankInput): Promise<RankedResults> {
  const { results } = input;
  if (!results.length) {
    throw new Error('rankResults: no results to rank.');
  }

  const priceSorted = sortByPrice(results);
  const cheapest = priceSorted[0]!;

  const compact = results.map((p) => ({
    key: keyOf(p),
    platform: p.platform,
    label: p.label,
    fare: effectiveFare(p),
    eta_min: p.etaMinutes,
    coupon: p.couponApplied?.code ?? null,
    savings: p.couponApplied?.savings ?? 0,
    available: p.available,
  }));

  const userMessage = [
    `User priority: ${input.priority ?? 'BALANCED'}.`,
    'Rank these options. For CHEAPEST favour lowest fare; for FASTEST favour lowest ETA; for BALANCED trade off fare and ETA. Ignore unavailable options for "best".',
    `Options: ${JSON.stringify(compact)}`,
  ].join('\n');

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      tools: [rankTool],
      tool_choice: { type: 'tool', name: rankTool.name },
      messages: [{ role: 'user', content: userMessage }],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    const parsed = toolUse ? RankZ.safeParse(toolUse.input) : null;

    if (parsed?.success) {
      const byKey = new Map(results.map((p) => [keyOf(p), p]));
      const ordered: PlatformPrice[] = [];
      for (const k of parsed.data.order) {
        const p = byKey.get(k);
        if (p && !ordered.includes(p)) ordered.push(p);
      }
      // Append any the model omitted, cheapest-first.
      for (const p of priceSorted) if (!ordered.includes(p)) ordered.push(p);

      const ranked = toRanked(ordered, parsed.data.best_key);
      const best = ranked.find((r) => r.isBest) ?? ranked[0]!;
      return {
        results: ranked,
        recommendation: parsed.data.recommendation,
        bestPlatform: best.platform as Platform,
      };
    }
  } catch (err) {
    console.warn(
      `rankResults: AI ranking failed, using price sort — ${(err as Error).message}`,
    );
  }

  // Deterministic fallback.
  const ranked = toRanked(priceSorted, keyOf(cheapest));
  return {
    results: ranked,
    recommendation: `${cheapest.label} on ${cheapest.platform} is the cheapest at ${formatPrice(effectiveFare(cheapest))}.`,
    bestPlatform: cheapest.platform,
  };
}
