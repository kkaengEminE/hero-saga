import { z } from 'zod';

export const CategorySchema = z.enum([
  'loss', 'betrayal', 'failure', 'fear', 'shame', 'isolation', 'unnamed',
]);

export const ChoiceIdSchema = z.enum(['a', 'b', 'c']);

export const StageNumberSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
]);

export const ChoiceSchema = z.object({
  id: ChoiceIdSchema,
  text: z.string().min(1),
});

export const StageSchema = z.object({
  number: StageNumberSchema,
  name: z.string().min(1),
  narrative: z.string().min(1),
  choices: z.array(ChoiceSchema).length(3),
});

export const AllegoryFrameSchema = z.object({
  world: z.string().min(1),
  protagonist: z.string().min(1),
  shadow: z.string().min(1),
  questObject: z.string().min(1),
});

export const JourneyHistoryItemSchema = z.object({
  stage: StageNumberSchema,
  chosenId: ChoiceIdSchema,
  chosenText: z.string().min(1),
});

export const LegacyCardSchema = z.object({
  title: z.string().min(1),
  chronicleSummary: z.string().min(1),
  heroMonologue: z.string().min(1),
  visualPrompt: z.string().min(1),
});

export const JourneyStateSchema = z.object({
  category: CategorySchema,
  allegory: AllegoryFrameSchema,
  history: z.array(JourneyHistoryItemSchema),
  currentStage: StageSchema.nullable(),
  legacyCard: LegacyCardSchema.nullable(),
});

const BootstrapSuccessResponseSchema = z.object({
  allegory: AllegoryFrameSchema,
  stage: StageSchema,
});

const SafetyEscalationResponseSchema = z.object({
  safetyEscalation: z.literal(true),
});

export const BootstrapResponseSchema = z.union([
  BootstrapSuccessResponseSchema,
  SafetyEscalationResponseSchema,
]);

export const AdvanceStageResponseSchema = z.object({
  stage: StageSchema,
});

export const AdvanceFinalResponseSchema = z.object({
  legacyCard: LegacyCardSchema,
});

const BootstrapRequestSchema = z.object({
  type: z.literal('bootstrap'),
  category: CategorySchema,
  rawInput: z.string().min(1).max(5000),
});

const AdvanceRequestSchema = z.object({
  type: z.literal('advance'),
  state: JourneyStateSchema,
  choiceId: ChoiceIdSchema,
});

export const JourneyRequestSchema = z.discriminatedUnion('type', [
  BootstrapRequestSchema,
  AdvanceRequestSchema,
]);
