export type Category =
  | 'loss'
  | 'betrayal'
  | 'failure'
  | 'fear'
  | 'shame'
  | 'isolation'
  | 'unnamed';

export const CATEGORIES: ReadonlyArray<Category> = [
  'loss', 'betrayal', 'failure', 'fear', 'shame', 'isolation', 'unnamed',
] as const;

export const CATEGORY_LABEL_KO: Record<Category, string> = {
  loss: '상실',
  betrayal: '배신',
  failure: '실패',
  fear: '공포',
  shame: '수치심',
  isolation: '관계 단절',
  unnamed: '이름 없는 것',
};

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export const STAGE_NAME_KO: Record<StageNumber, string> = {
  1: '각성',
  2: '균열',
  3: '연마',
  4: '승화',
  5: '공향',
};

export type ChoiceId = 'a' | 'b' | 'c';

export interface Choice {
  id: ChoiceId;
  text: string;
}

export interface Stage {
  number: StageNumber;
  name: string;
  narrative: string;
  choices: Choice[];
}

export interface AllegoryFrame {
  world: string;
  protagonist: string;
  shadow: string;
  questObject: string;
}

export interface JourneyHistoryItem {
  stage: StageNumber;
  chosenId: ChoiceId;
  chosenText: string;
}

export interface LegacyCard {
  title: string;
  chronicleSummary: string;
  heroMonologue: string;
  visualPrompt: string;
}

export interface JourneyState {
  category: Category;
  allegory: AllegoryFrame;
  history: JourneyHistoryItem[];
  currentStage: Stage | null;
  legacyCard: LegacyCard | null;
}

export interface BootstrapRequest {
  type: 'bootstrap';
  category: Category;
  rawInput: string;
}

export interface AdvanceRequest {
  type: 'advance';
  state: JourneyState;
  choiceId: ChoiceId;
}

export type JourneyRequest = BootstrapRequest | AdvanceRequest;

export interface BootstrapSuccessResponse {
  allegory: AllegoryFrame;
  stage: Stage;
}

export interface SafetyEscalationResponse {
  safetyEscalation: true;
}

export type BootstrapResponse = BootstrapSuccessResponse | SafetyEscalationResponse;

export interface AdvanceStageResponse {
  stage: Stage;
}

export interface AdvanceFinalResponse {
  legacyCard: LegacyCard;
}

export type AdvanceResponse = AdvanceStageResponse | AdvanceFinalResponse;
