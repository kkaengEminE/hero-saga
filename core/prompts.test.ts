import { describe, it, expect } from 'vitest';
import { buildBootstrapPrompt, buildAdvancePrompt } from './prompts';
import type { JourneyState } from './types';

const sampleState: JourneyState = {
  category: 'loss',
  allegory: {
    world: '침묵의 바다',
    protagonist: '진주를 찾는 잠수부',
    shadow: '심해의 해류',
    questObject: '호흡의 진주',
  },
  history: [],
  currentStage: {
    number: 1,
    name: '각성',
    narrative: '...',
    choices: [
      { id: 'a', text: '바다의 침묵을 사랑하는 마음' },
      { id: 'b', text: '진주의 무게에 대한 갈망' },
      { id: 'c', text: '심해를 두려워하지 않는 자유' },
    ],
  },
  legacyCard: null,
};

describe('buildBootstrapPrompt', () => {
  it('includes category and rawInput', () => {
    const prompt = buildBootstrapPrompt('loss', '어머니가 떠나셨다.');
    expect(prompt).toContain('loss');
    expect(prompt).toContain('어머니가 떠나셨다.');
  });

  it('requests AllegoryFrame fields', () => {
    const prompt = buildBootstrapPrompt('fear', 'x');
    expect(prompt).toContain('world');
    expect(prompt).toContain('protagonist');
    expect(prompt).toContain('shadow');
    expect(prompt).toContain('questObject');
  });

  it('requests exactly 3 choices for Stage 1', () => {
    const prompt = buildBootstrapPrompt('fear', 'x');
    expect(prompt).toMatch(/정확히 3개/);
  });

  it('specifies output JSON shape', () => {
    const prompt = buildBootstrapPrompt('fear', 'x');
    expect(prompt).toContain('allegory');
    expect(prompt).toContain('stage');
  });
});

describe('buildAdvancePrompt (Stage 2)', () => {
  it('includes allegory frame fields', () => {
    const prompt = buildAdvancePrompt(sampleState, 'b', 2);
    expect(prompt).toContain('침묵의 바다');
    expect(prompt).toContain('진주를 찾는 잠수부');
    expect(prompt).toContain('심해의 해류');
    expect(prompt).toContain('호흡의 진주');
  });

  it('includes just-chosen choice text', () => {
    const prompt = buildAdvancePrompt(sampleState, 'a', 2);
    expect(prompt).toContain('바다의 침묵을 사랑하는 마음');
  });

  it('uses Stage 2 (균열) instruction', () => {
    const prompt = buildAdvancePrompt(sampleState, 'b', 2);
    expect(prompt).toContain('균열');
    expect(prompt).toMatch(/shadow.+침투/);
  });

  it('targets stage number 2', () => {
    const prompt = buildAdvancePrompt(sampleState, 'b', 2);
    expect(prompt).toMatch(/"number":\s*2/);
  });

  it('requests exactly 3 choices', () => {
    const prompt = buildAdvancePrompt(sampleState, 'b', 2);
    expect(prompt).toMatch(/정확히 3개/);
  });
});

describe('buildAdvancePrompt (Stage 3 — 연마)', () => {
  it('uses tempering instruction with allies/skills theme', () => {
    const prompt = buildAdvancePrompt(sampleState, 'a', 3);
    expect(prompt).toContain('연마');
    expect(prompt).toMatch(/조력자|단련|시련/);
  });
});

describe('buildAdvancePrompt (Stage 4 — 승화)', () => {
  it('uses sublimation instruction with integration theme', () => {
    const prompt = buildAdvancePrompt(sampleState, 'c', 4);
    expect(prompt).toContain('승화');
    expect(prompt).toMatch(/수용|통합|내적 변형/);
  });
});

describe('buildAdvancePrompt — invalid stage', () => {
  it('throws on stage 1 or 5', () => {
    expect(() => buildAdvancePrompt(sampleState, 'a', 1 as never)).toThrow();
    expect(() => buildAdvancePrompt(sampleState, 'a', 5 as never)).toThrow();
  });
});
