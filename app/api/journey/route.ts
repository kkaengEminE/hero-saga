import { NextResponse } from 'next/server';
import {
  JourneyRequestSchema,
  BootstrapResponseSchema,
} from '@/core/schema';
import { callClaudeJson } from '@/core/claude';
import { SYSTEM_PROMPT, buildBootstrapPrompt } from '@/core/prompts';
import type { BootstrapRequest } from '@/core/types';
import type { ZodSchema } from 'zod';

export const runtime = 'nodejs';

const MAX_RETRIES = 1;

async function callAndValidate<T>(
  schema: ZodSchema<T>,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const raw = await callClaudeJson({ systemPrompt, userPrompt });
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    lastError = parsed.error;
  }
  throw new Error(
    `Claude response failed schema validation after ${MAX_RETRIES + 1} attempts: ${String(lastError)}`,
  );
}

async function handleBootstrap(req: BootstrapRequest) {
  const userPrompt = buildBootstrapPrompt(req.category, req.rawInput);
  const result = await callAndValidate(BootstrapResponseSchema, SYSTEM_PROMPT, userPrompt);
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const parsed = JourneyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.type === 'bootstrap') {
      return await handleBootstrap(parsed.data);
    }
    return NextResponse.json({ error: 'advance not implemented' }, { status: 501 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
