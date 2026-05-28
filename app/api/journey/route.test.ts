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

const validBootstrapResponse = {
  allegory: { world: 'w', protagonist: 'p', shadow: 's', questObject: 'q' },
  stage: {
    number: 1, name: '각성', narrative: 'n',
    choices: [
      { id: 'a', text: 'x' }, { id: 'b', text: 'y' }, { id: 'c', text: 'z' },
    ],
  },
};

describe('POST /api/journey — bootstrap', () => {
  beforeEach(() => mockClaude.mockReset());

  it('returns allegory + stage on success', async () => {
    mockClaude.mockResolvedValue(validBootstrapResponse);
    const res = await POST(makeReq({ type: 'bootstrap', category: 'loss', rawInput: 'hi' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(validBootstrapResponse);
  });

  it('returns safetyEscalation when Claude returns it', async () => {
    mockClaude.mockResolvedValue({ safetyEscalation: true });
    const res = await POST(makeReq({ type: 'bootstrap', category: 'loss', rawInput: 'i want to die' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ safetyEscalation: true });
  });

  it('passes system prompt and bootstrap user prompt to Claude', async () => {
    mockClaude.mockResolvedValue(validBootstrapResponse);
    await POST(makeReq({ type: 'bootstrap', category: 'fear', rawInput: '깊은 물이 무섭다.' }));
    const callArg = mockClaude.mock.calls[0][0];
    expect(callArg.systemPrompt).toContain('Trauma-to-Epic');
    expect(callArg.userPrompt).toContain('fear');
    expect(callArg.userPrompt).toContain('깊은 물이 무섭다.');
  });
});
