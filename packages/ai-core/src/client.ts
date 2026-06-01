/**
 * Shared Anthropic client + model constant for all AI-core functions.
 */
import Anthropic from '@anthropic-ai/sdk';

/** Pinned Claude model for RideAI. */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

let cached: Anthropic | null = null;

/**
 * Lazily construct (and cache) the Anthropic client. Throws a clear error if
 * the API key is missing so callers can surface a useful message.
 */
export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set — required by @rideai/ai-core. ' +
        'Add it to your .env file.',
    );
  }
  cached = new Anthropic({ apiKey });
  return cached;
}
