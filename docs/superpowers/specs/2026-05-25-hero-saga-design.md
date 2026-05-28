# Hero Saga — Design Spec

**Date:** 2026-05-25
**Status:** Approved (brainstorming phase complete)
**Project root:** `/Users/cclss/Desktop/git24/other/hero-saga`

---

## 1. 개요

Hero Saga는 유저의 실세계 부정 감정·트라우마·불쾌한 경험을 5단계 영웅 서사("Path of the Modern Hero")로 변환하는 인터랙티브 내러티브 게임이다. 결과물은 알레고리화된 여정과 시적 Legacy Card 한 장. 유저는 자신의 고통을 성장의 시련으로 재구성하는 경험을 갖는다. 본 디자인은 개인용 데모/포트폴리오 수준의 단일 세션 웹앱을 다룬다.

핵심 가치는 **트라우마 → 알레고리 변환의 품질**이며, 모든 기술 선택은 이 가치를 보호하는 방향으로 정렬한다.

---

## 2. 결정 로그

### Q1. 결과물 형태 → **A. Next.js 풀 인터랙티브 웹앱**
형제 프로젝트(`cognitive-ui-game`, `ai-psychology-test`)의 스택을 재사용. 이미지 생성은 첫 버전에 넣지 않음(비용·지연 변수 큼).

### Q2. 타깃과 배포 → **A. 본인용 데모 / 포트폴리오**
인증·DB·영속화 없음. 트라우마 도메인 특성상 공개 제품(C)은 별도 설계 사이클이 필요하므로 의도적으로 제외.

### Q3. 인터랙션 모델 → **B. 각 단계 정확히 3개 선택지 (총 5번 LLM 호출: bootstrap + 4 advance)**
명세의 "short, interactive choices"에 충실. 유저 선택이 실제로 다음 단계 톤에 반영되는 인터랙티브.

### Visual Direction → **B. Minimal Now → Ornate Reveal**
Stage 1~4는 깨끗한 한국어 친화 UI. Stage 5(공향)에서 Legacy Card가 Art Nouveau로 펼쳐지면서 "여정의 보상"으로 작용. 한국어 본문에 Art Nouveau 세리프를 강요하지 않음.

### Q4. LLM 제공자 → **B. Anthropic Claude Sonnet 4.6**
문학적 한국어 + 은유 변환에 일관되게 강함. 형제 프로젝트(OpenAI)와의 패턴 일치보다 결과물 품질을 우선.

### Q5. 트라우마 입력 UX → **C. 카테고리 선택 → 자유 입력**
6-7개 카테고리(상실/배신/실패/공포/수치심/관계 단절/이름 없는 것)에서 먼저 선택 → textarea. "감정을 명명하는" 행위 자체가 Hero's Journey의 "Call to Adventure" 모먼트.

### Q6. LLM 호출 구조 → **B. Bootstrap + 4 stages**
Stage 1 호출에서 AllegoryFrame과 Stage 1 내용을 함께 확립. 이후 Stage 2~5는 그 알레고리를 일관되게 따라감. "메타포가 단계마다 흔들리는" 위험 차단.

### 결정 ① rawInput 보유 → **A. 조기 삭제**
Stage 1 부트스트랩이 성공하면 즉시 sessionStorage/메모리에서 제거. 이후 단계는 알레고리·history만으로 충분. 데이터 최소화 원칙.

### 결정 ② Claude 응답 검증 → **A. Zod 검증 + 1회 재시도**
Claude의 JSON 안정성이 ~99%지만 데모 도중 1% 실패가 더 치명적. 어긋난 응답은 재시도 후 그래도 실패하면 "다시 시도" 버튼.

### 결정 ③ 위기 escalation → **A. 첫 버전부터 포함**
시스템 프롬프트가 자살·자해·즉각적 위기 신호 감지 시 `{ safetyEscalation: true }` 반환 → UI는 상담전화 카드로 전환. 트라우마를 다루는 도구가 이 가드 없이 출시되는 건 부적절.

### 결정 ④ Prompt caching → **A. 적용**
System prompt(~1,500 tokens)는 한 세션 5번 호출에 동일하게 들어감. `cache_control: { type: 'ephemeral' }` 적용으로 2번째 호출부터 입력 토큰 ~90% 절감. 코드 한 줄.

---

## 3. 아키텍처

### 스택
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first, `tailwind.config` 없음)
- **LLM:** Anthropic Claude Sonnet 4.6 via `@anthropic-ai/sdk`
- **Validation:** Zod
- **Test:** Vitest

### 런타임 구조
- **클라이언트:** 5단계 상태를 React state로 메모리 보유. 새로고침 = 처음부터. 영속화 없음.
- **서버:** 단 하나의 라우트 핸들러 `POST /api/journey`. 무상태(stateless) — 매 호출마다 클라이언트가 전체 상태와 새 선택을 함께 보냄.
- **시크릿:** `ANTHROPIC_API_KEY`는 서버 환경에서만 접근. `.env.local`에 두고 `.gitignore`로 가림.

### 왜 무상태 서버
DB·세션·인증 없음(Q2=A). 클라이언트가 진실의 원천. 배포 환경 의존성 0.

### 왜 한 라우트
5단계가 같은 형태(상태 → Claude → 다음 단계 내용 + 선택지). 라우트 분할은 중복. `type` 필드로 분기.

### 모듈 경계
- `core/` — 프롬프트, 타입, Claude 클라이언트 (서버 전용)
- `app/api/` — 라우트 핸들러
- `app/` — 페이지·UI
- `components/` — 재사용 UI

---

## 4. 파일 구조

```
hero-saga/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (한국어 폰트, 배경)
│   ├── page.tsx                # 시작 화면: CategoryPicker + TraumaInput
│   ├── journey/page.tsx        # 5단계 인터랙티브 플레이 (client component)
│   ├── globals.css             # Tailwind + Art Nouveau 폰트 + 사용자 토큰
│   └── api/
│       └── journey/route.ts    # POST 핸들러 — 무상태, Claude 호출
├── core/
│   ├── claude.ts               # Anthropic SDK 클라이언트 (server-only)
│   ├── prompts.ts              # system prompt + 단계별 instruction 빌더
│   ├── schema.ts               # Zod 스키마 — Claude 응답 검증
│   └── types.ts                # 도메인 타입
├── components/
│   ├── CategoryPicker.tsx
│   ├── TraumaInput.tsx
│   ├── StageView.tsx           # Stage 1~4 공통: 내러티브 + 선택지
│   ├── LegacyCard.tsx          # Stage 5 — Art Nouveau 프레임
│   ├── SafetyEscalationCard.tsx # 위기 감지 시 상담전화 카드
│   └── ProgressIndicator.tsx   # 5단계 진행 표시
├── public/
│   └── (Art Nouveau 프레임 SVG)
├── scripts/
│   └── eval.ts                 # 프롬프트 품질 수동 검수 스크립트
├── docs/superpowers/specs/     # 이 문서 위치
├── package.json
├── tsconfig.json
└── .env.local                  # ANTHROPIC_API_KEY (gitignore)
```

### 컴포넌트 책임 경계
- `CategoryPicker`: 카테고리 목록 표시 + 선택 콜백. 자체 상태 없음.
- `TraumaInput`: textarea + 제출 버튼. 입력값 콜백.
- `StageView`: Stage 객체 받아 내러티브 + 3개 선택지 렌더. 선택 시 콜백.
- `LegacyCard`: LegacyCard 데이터만 받아 렌더. 인터랙션 없음.
- `SafetyEscalationCard`: 정적 컨텐츠 + 상담전화 링크.
- `journey/page.tsx`: 클라이언트 상태 머신. 무엇을 보여줄지 결정.

### 파일 크기 가드레일
**어떤 파일도 200줄을 넘기지 않는다.** 넘으면 책임이 둘 이상이라는 신호 → 분할.

---

## 5. 데이터 타입과 흐름

### 5-1. 도메인 타입 (`core/types.ts`)

```typescript
export type Category =
  | 'loss' | 'betrayal' | 'failure' | 'fear'
  | 'shame' | 'isolation' | 'unnamed';

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export interface Choice {
  id: 'a' | 'b' | 'c';
  text: string;
}

export interface Stage {
  number: StageNumber;
  name: '각성' | '균열' | '연마' | '승화' | '공향';
  narrative: string;       // 3-5문장
  choices: Choice[];       // 정확히 3개
}

export interface AllegoryFrame {
  world: string;
  protagonist: string;
  shadow: string;
  questObject: string;
}

export interface JourneyHistoryItem {
  stage: StageNumber;
  chosenId: 'a' | 'b' | 'c';
  chosenText: string;
}

export interface JourneyState {
  category: Category;
  allegory: AllegoryFrame;
  history: JourneyHistoryItem[];
  currentStage: Stage | null;
  legacyCard: LegacyCard | null;
}

export interface LegacyCard {
  title: string;
  chronicleSummary: string;  // 정확히 3문장
  heroMonologue: string;     // 1-2줄 시적 인용구
  visualPrompt: string;      // 영문 image gen prompt
}
```

### 5-2. API 계약 (`POST /api/journey`)

```typescript
// Request — bootstrap (Stage 1 시작)
{ type: 'bootstrap', category: Category, rawInput: string }
// Response (정상)
{ allegory: AllegoryFrame, stage: Stage /* number=1 */ }
// Response (위기 감지)
{ safetyEscalation: true }

// Request — advance (Stage 2~5)
{ type: 'advance', state: JourneyState, choiceId: 'a'|'b'|'c' }
// Response (Stage 2~4)
{ stage: Stage }
// Response (Stage 5)
{ legacyCard: LegacyCard }
```

### 5-3. 흐름 시퀀스

```
1. `/`         마운트 → CategoryPicker 표시
2.             카테고리 선택 → 같은 페이지에 TraumaInput 표출
3.             제출 → sessionStorage에 {category, rawInput} 저장
                    → router.push('/journey')
4. `/journey`  마운트 → sessionStorage 읽음 (비어있으면 `/`로 리다이렉트)
5.             bootstrap API 호출 → allegory + Stage 1 받음
6.             ★ sessionStorage에서 rawInput 즉시 삭제 (결정 ①)
7.             StageView 렌더
8.             선택 클릭 → advance API → 다음 단계 받음
                    → history에 push → StageView 갱신
9.             Stage 5 응답 = LegacyCard → LegacyCard 컴포넌트로 전환
10.            "↺ 처음부터" 버튼 → router.push('/'), sessionStorage 클리어
```

### 5-4. 위기 감지 분기
bootstrap 응답이 `{ safetyEscalation: true }`이면 일반 흐름 중단, `SafetyEscalationCard`로 전환. sessionStorage의 rawInput도 즉시 삭제.

**위기 감지는 bootstrap 단계에서만 작동한다.** advance 단계(Stage 2~5)는 유저가 시스템이 생성한 a/b/c 선택지에서만 고르므로 새 자유 텍스트 입력이 없다. 따라서 escalation 트리거가 발생할 수 없고, advance 응답 스키마에도 `safetyEscalation` 필드가 없다. (만약 Claude가 advance 응답에 임의로 이 필드를 포함시키면 Zod 검증 실패 → 재시도 흐름으로 처리.)

---

## 6. 프롬프트 설계 + 안전 장치

### 6-1. System Prompt (모든 호출 공유)

```
역할: 당신은 "Trauma-to-Epic Narrative Engine"입니다.
유저의 불쾌한 경험·트라우마·감정을 5단계 영웅 서사로 변환합니다.

원칙:
1. 변환의 법칙 (Rule of Metaphor)
   유저의 원본 입력을 절대 문자 그대로 재현하지 않는다.
   반드시 판타지/모험 알레고리로 추상화한다.

2. 톤
   - 시적이고 절제된 한국어. 3~5문장의 짧은 단락.
   - 위로의 상투구 금지: "괜찮아요", "이겨낼 수 있어요" 같은 말 사용하지 않음.
   - 가해자에 대한 분노를 부추기지 않음. 외부의 적이 아니라 내적 변형이 핵심.
   - 트라우마를 축소·미화·교훈화하지 않음.

3. 출력 형식
   반드시 JSON. 추가 설명 텍스트나 코드 펜스 금지.

4. 안전
   유저 입력에 자살·자해·즉각적 위기 신호가 보이면:
   - 알레고리 생성을 중단하고
   - 응답을 { "safetyEscalation": true } 로만 반환한다.
```

### 6-2. Bootstrap 호출 (Stage 1)

```
[입력]
카테고리: {category}
원본 입력: {rawInput}

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

[출력 JSON]
{
  "allegory": { "world": ..., "protagonist": ..., "shadow": ..., "questObject": ... },
  "stage": { "number": 1, "name": "각성", "narrative": ..., "choices": [...] }
}
```

### 6-3. Advance 호출 — 단계별 instruction

전송 컨텍스트: `allegory` + `history` + 방금 선택한 `choice` + 다음 단계 번호.

- **Stage 2 (균열):** shadow가 평온을 깨고 침투. 정체성이 흔들림. choices = 그림자 앞에서 어떻게 자기를 지킬 것인가.
- **Stage 3 (연마):** 시련의 시간. 조력자·내적 자원·기술 습득. choices = 어떤 단련의 길을 갈 것인가.
- **Stage 4 (승화):** 클라이맥스. 그림자와의 최종 대면. 폭력이 아닌 **수용·이해·내적 변형**. choices = 어떻게 그림자를 자기 일부로 통합할 것인가.

각 호출 출력: `{ stage: Stage }`.

### 6-4. Final 호출 (Stage 5 = 공향)

```
[과제] 다음 단계가 아니라 LegacyCard 생성.

- title: 시적·우아한 1줄 한국어 (예: "침묵의 항해를 마친 자")
- chronicleSummary: 정확히 3문장. 각성 → 균열/연마 → 승화의 흐름.
- heroMonologue: 1~2줄. 따옴표로 감쌌을 때 카드에 새겨질 시구.
                  트라우마의 변형된 의미를 응축.
- visualPrompt: 영문. "Art Nouveau ornamental frame, 2D illustrative texture, ..."
                  알레고리 상징(world/shadow/questObject)을 풍부하게 시각화.

[출력 JSON]
{ "legacyCard": { "title": ..., "chronicleSummary": ..., "heroMonologue": ..., "visualPrompt": ... } }
```

### 6-5. 안전 장치 4겹

| 층 | 내용 |
|----|----|
| 1. 랜딩 디스클레이머 | 하단 작은 글씨: "이 도구는 치료를 대체하지 않습니다. 도움이 필요하시면 자살예방상담전화 ☎ 1577-0199" |
| 2. 프롬프트 톤 가드 | System prompt의 "톤" 섹션 — 위로 상투구·분노 선동·교훈화 금지 |
| 3. 위기 escalation | Claude가 자살·자해·즉각적 위기 감지 시 `{ safetyEscalation: true }` 반환 → `SafetyEscalationCard`로 전환 |
| 4. 데이터 최소 보유 | rawInput Stage 1 끝나면 즉시 제거 (결정 ①) |

### 6-6. Prompt Caching

`messages.create` 호출 시 system block에 `cache_control: { type: 'ephemeral' }` 추가. 5분 TTL. 2번째 호출부터 입력 토큰 ~90% 절감.

---

## 7. 테스트 방침

### 7-1. 자동 테스트 (Vitest)

| 대상 | 종류 | 이유 |
|----|----|----|
| `core/schema.ts` | 단위 | LLM-UI 계약. 깨지면 모든 게 폭발. 결정적이라 비용 낮음. |
| `core/prompts.ts` | 단위 | "advance 호출 프롬프트에 history가 올바른 순서로 포함되는가" 같은 문자열 조립만 검증. LLM 응답 품질은 검증 안 함. |
| `app/api/journey/route.ts` | 통합 (Anthropic 모킹) | bootstrap/advance 분기, Zod 실패 시 재시도, 위기 escalation 분기. |

### 7-2. 테스트하지 않는 것
- 컴포넌트 렌더링 (브라우저로 직접 검증)
- E2E (Playwright 없음)
- LLM 응답 품질 (비결정적, 수동 eval로 대체)

### 7-3. 수동 eval 스크립트 (`scripts/eval.ts`)

카테고리별 픽스처 5~7개로 5단계 전체 실행, stdout에 출력. 사람이 읽고 톤·은유 일관성·안전성 판단. CI 미포함.

### 7-4. TDD 적용 범위

[`superpowers:test-driven-development`] 스킬은 자동 테스트 대상(스키마·프롬프트 빌더·라우트 핸들러)에 적용. 컴포넌트는 TDD 없음(시각 검증).

### 7-5. 수동 검증 체크리스트 (구현 끝나고 1회)

| 항목 | 어떻게 확인 |
|----|----|
| 5단계 정상 플레이 | 카테고리 → 입력 → 끝까지 클릭, Legacy Card 출력 |
| 알레고리 일관성 | Stage 1 알레고리 단어가 Stage 2~5에 재등장하는가 |
| rawInput 조기 삭제 | dev tools → sessionStorage에 원본 없음 |
| Art Nouveau 카드 | Legacy Card가 본문 단계와 시각적 대비를 가짐 |
| 위기 escalation | 위기 표현 입력 → SafetyEscalationCard 전환 |
| Zod 재시도 | 모킹으로 잘못된 JSON → 재시도 후 정상 흐름 |
| Prompt caching | 2번째 호출부터 `usage.cache_read_input_tokens > 0` 로그 |

---

## 8. Out of Scope

이 디자인이 다루지 않는 것 (의도적 제외):

- **이미지 생성** — visualPrompt는 문자열로만 출력. DALL-E/Imagen 호출 없음.
- **인증·다중 유저** — 본인용 데모. 공개 제품화 시 별도 설계 사이클 필요.
- **영속화** — DB 없음. 새로고침 = 처음부터.
- **Legacy Card 저장·공유** — 스크린샷에 의존. 다운로드 버튼 첫 버전에 없음.
- **다국어** — 한국어 본문 + 영문 visualPrompt. i18n 인프라 없음.
- **고급 컨텐츠 모더레이션** — 위기 escalation 외 추가 필터링 없음.

---

## 9. 다음 단계

본 디자인이 사용자 승인 후, [`superpowers:writing-plans`] 스킬로 구현 계획을 작성한다. 구현은 별도 세션에서 [`superpowers:executing-plans`] 또는 [`superpowers:subagent-driven-development`]로 진행 가능.

구현 순서 예상:
1. 프로젝트 부트스트랩 (`create-next-app` + 의존성)
2. 도메인 타입 + Zod 스키마 (TDD)
3. 프롬프트 빌더 (TDD)
4. Claude 클라이언트 + 라우트 핸들러 (TDD, 모킹)
5. UI 컴포넌트 (시각 검증)
6. 페이지 조립 + 상태 머신
7. 수동 eval 실행 + 프롬프트 튜닝
8. 안전 장치 검증
