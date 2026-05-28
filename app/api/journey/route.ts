import { NextResponse } from 'next/server';
import {
  JourneyRequestSchema,
  BootstrapResponseSchema,
  AdvanceStageResponseSchema,
  AdvanceFinalResponseSchema,
} from '@/core/schema';
import { callClaudeJson } from '@/core/claude';
import {
  SYSTEM_PROMPT,
  buildBootstrapPrompt,
  buildAdvancePrompt,
  buildFinalPrompt,
} from '@/core/prompts';
import type { BootstrapRequest, AdvanceRequest } from '@/core/types';
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

async function handleAdvance(req: AdvanceRequest) {
  const current = req.state.currentStage;
  if (!current) {
    return NextResponse.json(
      { error: 'advance requires currentStage in state' },
      { status: 400 },
    );
  }
  const nextStageNum = current.number + 1;

  if (nextStageNum === 2 || nextStageNum === 3 || nextStageNum === 4) {
    const userPrompt = buildAdvancePrompt(req.state, req.choiceId, nextStageNum);
    const result = await callAndValidate(AdvanceStageResponseSchema, SYSTEM_PROMPT, userPrompt);
    return NextResponse.json(result, { status: 200 });
  }

  if (nextStageNum === 5) {
    const userPrompt = buildFinalPrompt(req.state, req.choiceId);
    const result = await callAndValidate(AdvanceFinalResponseSchema, SYSTEM_PROMPT, userPrompt);
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(
    { error: `unexpected next stage: ${nextStageNum}` },
    { status: 400 },
  );
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
    return await handleAdvance(parsed.data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
