import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/core/claude', () => ({
  callClaudeJson: vi.fn(),
}));

import { POST } from './route';
import { callClaudeJson } from '@/core/claude';
import type { JourneyState, Stage } from '@/core/types';

const mockClaude = callClaudeJson as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/journey', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/journey — request validation', () => {
  beforeEach(() => mockClaude.mockReset());

  it('returns 400 on invalid body', async () => {
    const res = await POST(makeReq({ type: 'unknown' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing rawInput', async () => {
    const res = await POST(makeReq({ type: 'bootstrap', category: 'loss' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on unknown category', async () => {
    const res = await POST(makeReq({ type: 'bootstrap', category: 'xyz', rawInput: 'hi' }));
    expect(res.status).toBe(400);
  });
});
