// Note: imports Anthropic SDK which requires server runtime (process.env.ANTHROPIC_API_KEY).
// Only imported from app/api/journey/route.ts and scripts/eval.ts — never from client code.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment');
  }
  client = new Anthropic({ apiKey });
  return client;
}

export interface ClaudeCallParams {
  systemPrompt: string;
  userPrompt: string;
}

export async function callClaudeJson(params: ClaudeCallParams): Promise<unknown> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: params.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: params.userPrompt },
    ],
  });

  const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text block');
  }
  const raw = (textBlock as { text: string }).text.trim();
  const stripped = stripCodeFences(raw);
  try {
    return JSON.parse(stripped);
  } catch {
    throw new Error(`Claude returned malformed JSON: ${stripped.slice(0, 200)}`);
  }
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : text;
}
