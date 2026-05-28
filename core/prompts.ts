import type { Category, ChoiceId, JourneyState } from './types';

export const SYSTEM_PROMPT = `당신은 "Trauma-to-Epic Narrative Engine"입니다.
유저의 불쾌한 경험·트라우마·감정을 5단계 영웅 서사로 변환합니다.

[원칙]
1. 변환의 법칙 (Rule of Metaphor)
   유저의 원본 입력을 절대 문자 그대로 재현하지 않는다.
   반드시 판타지/모험 알레고리로 추상화한다.

2. 톤
   - 시적이고 절제된 한국어. 3~5문장의 짧은 단락.
   - 위로의 상투구 금지: "괜찮아요", "이겨낼 수 있어요" 같은 말을 사용하지 않는다.
   - 가해자에 대한 분노를 부추기지 않는다. 외부의 적이 아니라 내적 변형이 핵심이다.
   - 트라우마를 축소·미화·교훈화하지 않는다.

3. 출력 형식
   반드시 JSON. 추가 설명 텍스트, 코드 펜스, 주석 사용 금지.

4. 안전
   유저 입력에 자살·자해·즉각적 위기 신호가 보이면:
   - 알레고리 생성을 중단하고
   - 응답을 { "safetyEscalation": true } 로만 반환한다.
   - 이 경우 다른 필드는 절대 포함하지 않는다.

[5단계 정의]
- Stage 1 (각성): 평범한 일상, 정체성, 가장 깊은 가치/욕망. 트라우마 미등장.
- Stage 2 (균열): shadow가 평온을 깨고 침투. 정체성이 흔들림.
- Stage 3 (연마): 시련의 시간. 조력자·내적 자원·기술 습득.
- Stage 4 (승화): 클라이맥스. 그림자와의 최종 대면. 폭력이 아닌 수용·이해·내적 변형.
- Stage 5 (공향): 귀환. LegacyCard 생성 (다음 단계가 아니라 회고적 카드).`;

export function buildBootstrapPrompt(category: Category, rawInput: string): string {
  return `[입력]
카테고리: ${category}
원본 입력: ${rawInput}

[과제]
(1) AllegoryFrame 확립 — 이후 모든 단계의 세계관
  - world: 한 줄. 트라우마 정서를 담은 판타지 세계
  - protagonist: 한 줄. 유저 가치/욕망에서 추출한 정체성
  - shadow: 한 줄. 트라우마의 알레고리적 형태
  - questObject: 한 줄. 추구할 상징물

(2) Stage 1 (각성)
  - narrative: 3~5문장. 주인공의 평범한 일상, 정체성, 가치/욕망.
                트라우마는 아직 등장 안 함 — 평온의 순간.
  - choices: 정확히 3개. "주인공이 가장 중요하게 여기는 것"을 드러냄.
                각 choice.text는 1줄, 추상명사·시각적 이미지.

[출력 JSON 스키마]
{
  "allegory": { "world": string, "protagonist": string, "shadow": string, "questObject": string },
  "stage": {
    "number": 1,
    "name": "각성",
    "narrative": string,
    "choices": [
      { "id": "a", "text": string },
      { "id": "b", "text": string },
      { "id": "c", "text": string }
    ]
  }
}

위 JSON 외의 어떤 텍스트도 출력하지 마십시오.`;
}

type AdvanceStageTarget = 2 | 3 | 4;

const STAGE_INSTRUCTIONS: Record<AdvanceStageTarget, { name: string; body: string }> = {
  2: {
    name: '균열',
    body: `shadow가 평온을 깨고 침투한다. 주인공의 정체성이 흔들린다.
choices: 그림자 앞에서 어떻게 자기를 지킬 것인가, 3개의 길.`,
  },
  3: {
    name: '연마',
    body: `시련의 시간. 주인공은 조력자를 만나거나, 내적 자원을 발견하거나, 새로운 기술을 단련한다.
choices: 어떤 단련의 길을 갈 것인가, 3개의 길.`,
  },
  4: {
    name: '승화',
    body: `클라이맥스. 그림자와의 최종 대면. 폭력이 아닌 수용·이해·내적 변형으로 그림자를 자기 일부로 통합한다.
choices: 어떻게 그림자를 자기 일부로 통합할 것인가, 3개의 길.`,
  },
};

function formatHistory(state: JourneyState): string {
  if (state.history.length === 0) return '(없음)';
  return state.history
    .map((h) => `- Stage ${h.stage}에서 "${h.chosenText}" 선택`)
    .join('\n');
}

export function buildAdvancePrompt(
  state: JourneyState,
  choiceId: ChoiceId,
  targetStage: 2 | 3 | 4,
): string {
  if (targetStage !== 2 && targetStage !== 3 && targetStage !== 4) {
    throw new Error(`buildAdvancePrompt only handles stages 2-4, got ${targetStage}`);
  }
  const instr = STAGE_INSTRUCTIONS[targetStage];
  const justChosenText =
    state.currentStage?.choices.find((c) => c.id === choiceId)?.text ?? '(미상)';

  return `[알레고리 (불변)]
world: ${state.allegory.world}
protagonist: ${state.allegory.protagonist}
shadow: ${state.allegory.shadow}
questObject: ${state.allegory.questObject}

[지금까지의 선택]
${formatHistory(state)}
- (직전) Stage ${state.currentStage?.number}에서 "${justChosenText}" 선택

[과제] Stage ${targetStage} (${instr.name}) 생성
${instr.body}

- narrative: 3~5문장. 위 알레고리 단어를 자연스럽게 재등장시켜 연속성 유지.
- choices: 정확히 3개. 각 1줄, 추상명사·시각적 이미지.

[출력 JSON 스키마]
{
  "stage": {
    "number": ${targetStage},
    "name": "${instr.name}",
    "narrative": string,
    "choices": [
      { "id": "a", "text": string },
      { "id": "b", "text": string },
      { "id": "c", "text": string }
    ]
  }
}

위 JSON 외의 어떤 텍스트도 출력하지 마십시오.`;
}

export function buildFinalPrompt(state: JourneyState, choiceId: ChoiceId): string {
  const justChosenText =
    state.currentStage?.choices.find((c) => c.id === choiceId)?.text ?? '(미상)';

  return `[알레고리 (불변)]
world: ${state.allegory.world}
protagonist: ${state.allegory.protagonist}
shadow: ${state.allegory.shadow}
questObject: ${state.allegory.questObject}

[지금까지의 선택]
${formatHistory(state)}
- (직전) Stage ${state.currentStage?.number}에서 "${justChosenText}" 선택

[과제] Stage 5 (공향) — 다음 단계가 아니라 LegacyCard를 생성한다.

- title: 시적·우아한 1줄 한국어. 예: "침묵의 항해를 마친 자"
- chronicleSummary: 정확히 3문장. 각성 → 균열/연마 → 승화의 흐름.
- heroMonologue: 1~2줄. 따옴표로 감쌌을 때 카드에 새겨질 시구.
                  트라우마의 변형된 의미를 응축한다.
- visualPrompt: 영문(English). "Art Nouveau ornamental frame, 2D illustrative texture, ..." 형태.
                  알레고리 상징(world/shadow/questObject)을 풍부하게 시각화.

[출력 JSON 스키마]
{
  "legacyCard": {
    "title": string,
    "chronicleSummary": string,
    "heroMonologue": string,
    "visualPrompt": string
  }
}

위 JSON 외의 어떤 텍스트도 출력하지 마십시오.`;
}
