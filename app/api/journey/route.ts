import { NextResponse } from 'next/server';
import { JourneyRequestSchema } from '@/core/schema';

export const runtime = 'nodejs';

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

  return NextResponse.json({ error: 'not implemented' }, { status: 501 });
}
