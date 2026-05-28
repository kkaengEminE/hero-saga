import { describe, it, expect } from 'vitest';
import {
  BootstrapResponseSchema,
  AdvanceStageResponseSchema,
  AdvanceFinalResponseSchema,
  JourneyRequestSchema,
} from './schema';

describe('BootstrapResponseSchema', () => {
  it('accepts a valid success response', () => {
    const valid = {
      allegory: {
        world: '침묵의 바다',
        protagonist: '진주를 찾는 잠수부',
        shadow: '심해의 해류',
        questObject: '호흡의 진주',
      },
      stage: {
        number: 1,
        name: '각성',
        narrative: '바다 마을의 평온한 새벽이었다. 잠수부는 매일 같은 시간에 진주를 찾았다.',
        choices: [
          { id: 'a', text: '바다의 침묵을 사랑하는 마음' },
          { id: 'b', text: '진주의 무게에 대한 갈망' },
          { id: 'c', text: '심해를 두려워하지 않는 자유' },
        ],
      },
    };
    expect(BootstrapResponseSchema.parse(valid)).toEqual(valid);
  });

  it('accepts a safety escalation response', () => {
    const valid = { safetyEscalation: true };
    expect(BootstrapResponseSchema.parse(valid)).toEqual(valid);
  });

  it('rejects when stage.choices has fewer than 3 items', () => {
    const invalid = {
      allegory: { world: 'w', protagonist: 'p', shadow: 's', questObject: 'q' },
      stage: {
        number: 1, name: '각성', narrative: 'n',
        choices: [{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }],
      },
    };
    expect(() => BootstrapResponseSchema.parse(invalid)).toThrow();
  });

  it('rejects unknown stage.number', () => {
    const invalid = {
      allegory: { world: 'w', protagonist: 'p', shadow: 's', questObject: 'q' },
      stage: {
        number: 9, name: '각성', narrative: 'n',
        choices: [
          { id: 'a', text: 'x' }, { id: 'b', text: 'y' }, { id: 'c', text: 'z' },
        ],
      },
    };
    expect(() => BootstrapResponseSchema.parse(invalid)).toThrow();
  });
});

describe('AdvanceStageResponseSchema', () => {
  it('accepts a stage response', () => {
    const valid = {
      stage: {
        number: 2, name: '균열', narrative: '바다가 처음으로 침묵했다.',
        choices: [
          { id: 'a', text: '돌아선다' }, { id: 'b', text: '잠긴다' }, { id: 'c', text: '듣는다' },
        ],
      },
    };
    expect(AdvanceStageResponseSchema.parse(valid)).toEqual(valid);
  });
});

describe('AdvanceFinalResponseSchema', () => {
  it('accepts a legacy card response', () => {
    const valid = {
      legacyCard: {
        title: '침묵의 항해를 마친 자',
        chronicleSummary: '한 잠수부가 살았다. 침묵의 해류가 그의 호흡을 빼앗았다. 그는 침묵을 자기 진주로 삼았다.',
        heroMonologue: '"가장 깊은 곳에서 나는 듣는 법을 배웠다."',
        visualPrompt: 'Art Nouveau ornamental frame, 2D illustrative texture, a diver holding a luminous pearl in deep silent currents, swirling kelp motifs',
      },
    };
    expect(AdvanceFinalResponseSchema.parse(valid)).toEqual(valid);
  });
});

describe('JourneyRequestSchema', () => {
  it('accepts a bootstrap request', () => {
    const valid = { type: 'bootstrap', category: 'loss', rawInput: 'something' };
    expect(JourneyRequestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects bootstrap with unknown category', () => {
    const invalid = { type: 'bootstrap', category: 'xyz', rawInput: 'something' };
    expect(() => JourneyRequestSchema.parse(invalid)).toThrow();
  });

  it('rejects bootstrap with empty rawInput', () => {
    const invalid = { type: 'bootstrap', category: 'loss', rawInput: '' };
    expect(() => JourneyRequestSchema.parse(invalid)).toThrow();
  });
});
