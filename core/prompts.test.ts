import { describe, it, expect } from 'vitest';
import { buildBootstrapPrompt } from './prompts';

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
