/**
 * AI coupon picker: given a cart and a set of (already eligibility-filtered)
 * coupons, ask Claude to choose the best one and explain why. Savings are
 * computed deterministically; if the AI call fails we fall back to the
 * highest-saving coupon so the request path never breaks.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  formatPrice,
  type CouponData,
  type CouponPickResult,
  type Platform,
  type ServiceType,
} from '@rideai/shared';
import { CLAUDE_MODEL, getAnthropicClient } from './client';
import { computeSavings } from './savings';

export interface CouponPickerInput {
  platform: Platform;
  serviceType: ServiceType;
  /** Cart/fare value in rupees the coupon would apply to. */
  fare: number;
  city?: string | null;
  /** Candidate coupons (should already be eligibility-filtered). */
  coupons: CouponData[];
}

const chooseTool: Anthropic.Tool = {
  name: 'choose_coupon',
  description: 'Select the single best coupon for this cart, or none.',
  input_schema: {
    type: 'object',
    properties: {
      chosen_code: {
        type: 'string',
        description: 'Code of the best coupon, or empty string if none is worth applying.',
      },
      reason: {
        type: 'string',
        description: 'One short sentence explaining the choice for the user.',
      },
    },
    required: ['chosen_code', 'reason'],
  },
};

const ChooseZ = z.object({
  chosen_code: z.string(),
  reason: z.string(),
});

/** Highest-saving coupon, deterministic fallback. */
function bestBySavings(
  coupons: CouponData[],
  fare: number,
): { coupon: CouponData; savings: number } | null {
  let best: { coupon: CouponData; savings: number } | null = null;
  for (const c of coupons) {
    const savings = computeSavings(c, fare);
    if (savings > 0 && (!best || savings > best.savings)) {
      best = { coupon: c, savings };
    }
  }
  return best;
}

/**
 * Pick the best coupon for a cart. Returns `{ coupon: null }` when no coupon
 * yields a saving.
 */
export async function pickBestCoupon(
  input: CouponPickerInput,
): Promise<CouponPickResult> {
  const { coupons, fare } = input;
  if (!coupons.length) {
    return { coupon: null, savings: 0, reason: 'No coupons available for this platform.' };
  }

  const fallback = bestBySavings(coupons, fare);
  if (!fallback) {
    return {
      coupon: null,
      savings: 0,
      reason: 'No coupon applies to this cart value.',
    };
  }

  // Give Claude the candidates with their pre-computed savings.
  const candidates = coupons.map((c) => ({
    code: c.code,
    type: c.type,
    discount: c.discountType === 'PERCENT' ? `${c.discountValue}%` : formatPrice(c.discountValue),
    max_discount: c.maxDiscount,
    min_fare: c.minFare,
    success_rate: c.successRate,
    expires_at: c.expiresAt,
    savings_on_this_cart: computeSavings(c, fare),
  }));

  const userMessage = [
    `Platform: ${input.platform}`,
    `Service: ${input.serviceType}`,
    `Cart value: ${formatPrice(fare)}`,
    input.city ? `City: ${input.city}` : null,
    'Choose the best coupon. Prefer higher savings, but weight reliability (success_rate) and avoid soon-to-expire codes when savings are close.',
    `Candidates: ${JSON.stringify(candidates)}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      tools: [chooseTool],
      tool_choice: { type: 'tool', name: chooseTool.name },
      messages: [{ role: 'user', content: userMessage }],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    const parsed = toolUse ? ChooseZ.safeParse(toolUse.input) : null;

    if (parsed?.success && parsed.data.chosen_code) {
      const chosen = coupons.find((c) => c.code === parsed.data.chosen_code);
      if (chosen) {
        return {
          coupon: chosen,
          savings: computeSavings(chosen, fare),
          reason: parsed.data.reason,
        };
      }
    }
  } catch (err) {
    // Fall through to the deterministic fallback.
    console.warn(
      `pickBestCoupon: AI selection failed, using best-savings fallback — ${(err as Error).message}`,
    );
  }

  return {
    coupon: fallback.coupon,
    savings: fallback.savings,
    reason: `Best available saving of ${formatPrice(fallback.savings)} with ${fallback.coupon.code}.`,
  };
}
