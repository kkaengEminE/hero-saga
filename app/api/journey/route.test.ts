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

const stateAfterStage1: JourneyState = {
  category: 'loss',
  allegory: { world: 'w', protagonist: 'p', shadow: 's', questObject: 'q' },
  history: [],
  currentStage: {
    number: 1, name: '각성', narrative: 'n',
    choices: [
      { id: 'a', text: 'A choice' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' },
    ],
  },
  legacyCard: null,
};

const validStage2Response = {
  stage: {
    number: 2, name: '균열', narrative: '균열이 일어났다.',
    choices: [
      { id: 'a', text: '돌아선다' }, { id: 'b', text: '잠긴다' }, { id: 'c', text: '듣는다' },
    ],
  },
};

describe('POST /api/journey — advance (stages 2-4)', () => {
  beforeEach(() => mockClaude.mockReset());

  it('returns stage 2 when current stage is 1', async () => {
    mockClaude.mockResolvedValue(validStage2Response);
    const res = await POST(makeReq({ type: 'advance', state: stateAfterStage1, choiceId: 'a' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(validStage2Response);
  });

  it('builds advance prompt with target stage 2', async () => {
    mockClaude.mockResolvedValue(validStage2Response);
    await POST(makeReq({ type: 'advance', state: stateAfterStage1, choiceId: 'a' }));
    const userPrompt = mockClaude.mock.calls[0][0].userPrompt as string;
    expect(userPrompt).toContain('Stage 2');
    expect(userPrompt).toContain('균열');
    expect(userPrompt).toContain('A choice');
  });
});

const stage4Stage: Stage = {
  number: 4, name: '승화', narrative: 'n',
  choices: [
    { id: 'a', text: '통합한다' }, { id: 'b', text: '받아들인다' }, { id: 'c', text: '품는다' },
  ],
};

const stateAfterStage4: JourneyState = {
  ...stateAfterStage1,
  history: [
    { stage: 1, chosenId: 'a', chosenText: 'A choice' },
    { stage: 2, chosenId: 'b', chosenText: '잠긴다' },
    { stage: 3, chosenId: 'a', chosenText: '단련의 길' },
  ],
  currentStage: stage4Stage,
};

const validFinalResponse = {
  legacyCard: {
    title: '침묵의 항해를 마친 자',
    chronicleSummary: '한 잠수부가 살았다. 침묵의 해류가 그를 삼켰다. 그는 침묵을 자기 진주로 삼았다.',
    heroMonologue: '"가장 깊은 곳에서 나는 듣는 법을 배웠다."',
    visualPrompt: 'Art Nouveau ornamental frame, 2D illustrative texture, a diver with a luminous pearl',
  },
};

describe('POST /api/journey — final (stage 5)', () => {
  beforeEach(() => mockClaude.mockReset());

  it('returns legacy card when current stage is 4', async () => {
    mockClaude.mockResolvedValue(validFinalResponse);
    const res = await POST(makeReq({ type: 'advance', state: stateAfterStage4, choiceId: 'a' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(validFinalResponse);
  });

  it('builds final prompt with allegory and history', async () => {
    mockClaude.mockResolvedValue(validFinalResponse);
    await POST(makeReq({ type: 'advance', state: stateAfterStage4, choiceId: 'a' }));
    const userPrompt = mockClaude.mock.calls[0][0].userPrompt as string;
    expect(userPrompt).toContain('LegacyCard');
    expect(userPrompt).toContain('Art Nouveau');
    expect(userPrompt).toContain('A choice');
  });
});
