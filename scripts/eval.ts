import { config } from 'dotenv';
config({ path: '.env.local' });

import { callClaudeJson } from '../core/claude';
import {
  SYSTEM_PROMPT,
  buildBootstrapPrompt,
  buildAdvancePrompt,
  buildFinalPrompt,
} from '../core/prompts';
import {
  BootstrapResponseSchema,
  AdvanceStageResponseSchema,
  AdvanceFinalResponseSchema,
} from '../core/schema';
import type { Category, ChoiceId, JourneyState } from '../core/types';

const FIXTURES: Array<{ category: Category; rawInput: string }> = [
  { category: 'loss', rawInput: '어렸을 때 부모님이 이혼하고 한쪽이 사라졌다.' },
  { category: 'betrayal', rawInput: '가까운 친구가 내 프로젝트 크레딧을 가로챘다.' },
  { category: 'failure', rawInput: '오랫동안 준비한 시험에 두 번 떨어졌다.' },
  { category: 'fear', rawInput: '어릴 때 물에 빠진 뒤로 깊은 물이 무섭다.' },
  { category: 'shame', rawInput: '많은 사람 앞에서 큰 실수를 했고 한참 잊지 못했다.' },
  { category: 'isolation', rawInput: '오래 사귄 사람과 멀어졌고 나는 혼자 남았다.' },
  { category: 'unnamed', rawInput: '딱히 뭐라 부를 수 없는 답답함이 오래 따라다닌다.' },
];

async function runOne(category: Category, rawInput: string) {
  console.log('\n========================================');
  console.log(`[${category}] ${rawInput}`);
  console.log('========================================');

  const bsRaw = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildBootstrapPrompt(category, rawInput),
  });
  const bs = BootstrapResponseSchema.parse(bsRaw);
  if ('safetyEscalation' in bs) {
    console.log('⚠ Safety escalation triggered');
    return;
  }
  console.log('\n--- AllegoryFrame ---');
  console.log(bs.allegory);
  console.log('\n--- Stage 1 (각성) ---');
  console.log(bs.stage.narrative);
  bs.stage.choices.forEach((c) => console.log(`  (${c.id}) ${c.text}`));

  let state: JourneyState = {
    category,
    allegory: bs.allegory,
    history: [],
    currentStage: bs.stage,
    legacyCard: null,
  };
  const chosen: ChoiceId = 'a';

  for (const target of [2, 3, 4] as const) {
    const advRaw = await callClaudeJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildAdvancePrompt(state, chosen, target),
    });
    const adv = AdvanceStageResponseSchema.parse(advRaw);
    console.log(`\n--- Stage ${adv.stage.number} (${adv.stage.name}) ---`);
    console.log(adv.stage.narrative);
    adv.stage.choices.forEach((c) => console.log(`  (${c.id}) ${c.text}`));

    state = {
      ...state,
      history: [
        ...state.history,
        {
          stage: state.currentStage!.number,
          chosenId: chosen,
          chosenText:
            state.currentStage!.choices.find((c) => c.id === chosen)?.text ?? '',
        },
      ],
      currentStage: adv.stage,
    };
  }

  const finRaw = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildFinalPrompt(state, 'a'),
  });
  const fin = AdvanceFinalResponseSchema.parse(finRaw);
  console.log('\n--- Legacy Card ---');
  console.log('title:', fin.legacyCard.title);
  console.log('chronicleSummary:', fin.legacyCard.chronicleSummary);
  console.log('heroMonologue:', fin.legacyCard.heroMonologue);
  console.log('visualPrompt:', fin.legacyCard.visualPrompt);
}

async function main() {
  for (const fx of FIXTURES) {
    try {
      await runOne(fx.category, fx.rawInput);
    } catch (err) {
      console.error(`[${fx.category}] ERROR:`, err);
    }
  }
}

main();
