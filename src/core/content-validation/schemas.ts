import { z } from "zod";

const text = z.string().trim().min(1);
const id = z.string().trim().min(2);
const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().nonnegative();
const cefrLevel = z.enum(["A1", "A2", "B1", "B2"]);
const examProvider = z.enum(["goethe-b2", "telc-deutsch-b2"]);
const fourOptions = z.tuple([text, text, text, text]);
const fourIndex = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const academicQuestionSchema = z.object({
  id,
  promptDe: text,
  promptAr: text,
  options: fourOptions,
  correctIndex: fourIndex,
  explanationAr: text,
}).strict();

const multipleChoiceExerciseSchema = z.object({
  id,
  type: z.literal("multiple-choice"),
  promptAr: text,
  promptDe: text.optional(),
  options: fourOptions,
  correctIndex: fourIndex,
  explanationAr: text,
}).strict();

const fillBlankExerciseSchema = z.object({
  id,
  type: z.literal("fill-blank"),
  promptAr: text,
  template: text,
  acceptedAnswers: z.array(text).min(1),
  explanationAr: text,
}).strict();

const wordOrderingExerciseSchema = z.object({
  id,
  type: z.literal("word-ordering"),
  promptAr: text,
  words: z.array(text).min(2),
  acceptedAnswers: z.array(text).min(1),
  explanationAr: text,
}).strict();

const errorCorrectionExerciseSchema = z.object({
  id,
  type: z.literal("error-correction"),
  promptAr: text,
  sentence: text,
  acceptedAnswers: z.array(text).min(1),
  explanationAr: text,
}).strict();

const matchingExerciseSchema = z.object({
  id,
  type: z.literal("matching"),
  promptAr: text,
  pairs: z.array(z.object({ left: text, right: text }).strict()).min(2),
  explanationAr: text,
}).strict();

export const practiceExerciseSchema = z.discriminatedUnion("type", [
  multipleChoiceExerciseSchema,
  fillBlankExerciseSchema,
  wordOrderingExerciseSchema,
  errorCorrectionExerciseSchema,
  matchingExerciseSchema,
]);

const theoryBlockSchema = z.object({
  id,
  titleDe: text,
  titleAr: text,
  explanationAr: text,
  contrastAr: text,
  formula: text.optional(),
  examples: z.array(z.object({ de: text, ar: text }).strict()).min(1),
  trickAr: text,
}).strict();

export const fullLessonSchema = z.object({
  id,
  level: cefrLevel,
  module: positiveInt.max(8),
  titleDe: text,
  titleAr: text,
  descriptionAr: text,
  estimatedMinutes: positiveInt,
  objectives: z.array(z.object({ de: text, ar: text }).strict()).min(1),
  entry: z.object({
    titleAr: text,
    sceneAr: text,
    dialogue: z.array(z.object({ speaker: text, de: text, ar: text }).strict()).min(1),
  }).strict(),
  phrases: z.array(z.object({ de: text, ar: text, noteAr: text.optional() }).strict()).min(1),
  discovery: z.object({ instructionAr: text, examples: z.array(text).min(1), questionsAr: z.array(text).min(1) }).strict(),
  theory: z.array(theoryBlockSchema).min(1),
  exercises: z.array(practiceExerciseSchema).min(1),
  reading: z.object({
    titleDe: text,
    titleAr: text,
    textDe: text,
    textAr: text,
    glossary: z.array(z.object({ lemma: text, surfaceForm: text, ar: text }).strict()).min(1),
    questions: z.array(academicQuestionSchema).min(1),
  }).strict(),
  listening: z.object({
    titleDe: text,
    titleAr: text,
    transcriptDe: text,
    transcriptAr: text,
    strategyAr: text,
    questions: z.array(academicQuestionSchema).min(1),
  }).strict(),
  pronunciation: z.object({
    titleAr: text,
    focus: text,
    explanationAr: text,
    items: z.array(z.object({ de: text, ipa: text, ar: text }).strict()).min(1),
    trickAr: text,
  }).strict(),
  writing: z.object({ titleAr: text, promptDe: text, promptAr: text, checklistAr: z.array(text).min(1), modelDe: text }).strict(),
  speaking: z.object({ titleAr: text, promptDe: text, promptAr: text, usefulPhrases: z.array(text).min(1), successCriteriaAr: z.array(text).min(1) }).strict(),
  mediation: z.object({ scenarioAr: text, sourceDe: text, taskAr: text, suggestedAr: text }).strict(),
  mistakes: z.array(z.object({ wrong: text, correct: text, whyAr: text, trickAr: text }).strict()).min(1),
  miniTest: z.array(academicQuestionSchema).min(1),
  flashcards: z.array(z.object({ id, frontDe: text, backAr: text, exampleDe: text }).strict()).min(1),
}).strict();

export const lessonMetaSchema = z.object({
  id,
  level: cefrLevel,
  module: positiveInt.max(8),
  order: positiveInt,
  titleDe: text,
  titleAr: text,
  objectiveAr: text,
  estimatedMinutes: positiveInt,
  status: z.enum(["published", "planned"]),
}).strict();

const libraryBaseShape = {
  id,
  level: cefrLevel,
  titleDe: text,
  titleAr: text,
  categoryAr: text,
  estimatedMinutes: positiveInt,
  questions: z.array(academicQuestionSchema).min(1),
  originalContent: z.literal(true),
  contentStatus: z.literal("published"),
};

export const readingLibraryItemSchema = z.object({
  ...libraryBaseShape,
  kind: z.literal("reading"),
  textDe: text,
  summaryAr: text,
}).strict();

export const listeningLibraryItemSchema = z.object({
  ...libraryBaseShape,
  kind: z.literal("listening"),
  transcriptDe: text,
  summaryAr: text,
  strategyAr: text,
  audioStatus: z.enum(["browser-tts-only", "generated-file-with-browser-tts-fallback"]),
}).strict();

const diagnosticErrorSchema = z.object({
  type: z.enum(["article", "case", "word-order", "vocabulary", "spelling", "tense", "grammar"]),
  wrong: text,
  correct: text,
  explanationAr: text,
  resolved: z.boolean().optional(),
  repairCount: nonNegativeInt.optional(),
  lastRepairedAt: text.optional(),
  nextReviewAt: text.optional(),
  confirmedAt: text.optional(),
}).strict();

export const diagnosticQuestionSchema = z.object({
  id,
  formId: z.enum(["A", "B"]),
  level: cefrLevel,
  skill: z.enum(["grammar", "vocabulary", "reading", "listening"]),
  prompt: text,
  contextDe: text.optional(),
  audioItemId: id.optional(),
  options: fourOptions,
  correctIndex: fourIndex,
  explanation: text,
  error: diagnosticErrorSchema.optional(),
}).strict();

const examBaseShape = {
  id,
  provider: examProvider,
  skill: z.enum(["reading", "listening", "writing", "speaking", "language-elements"]),
  officialPartLabel: text,
  titleDe: text,
  titleAr: text,
  descriptionAr: text,
  practiceMinutes: positiveInt,
  timingNoteAr: text,
  instructionsDe: text,
  instructionsAr: text,
  sourceRefs: z.array(id).min(1),
  contentStatus: z.literal("published"),
  originalContent: z.literal(true),
  countTowardTargeted: z.boolean().optional(),
};

const examTextSchema = z.object({ id, labelDe: text, textDe: text }).strict();
const examOptionSchema = z.object({ id, labelDe: text }).strict();
const examMatchingItemSchema = z.object({ id, promptDe: text, promptAr: text, correctOptionId: id, explanationAr: text }).strict();

const examMatchingSchema = z.object({
  ...examBaseShape,
  kind: z.literal("matching"),
  skill: z.enum(["reading", "language-elements"]),
  texts: z.array(examTextSchema).min(1),
  options: z.array(examOptionSchema).min(2),
  allowOptionReuse: z.boolean(),
  items: z.array(examMatchingItemSchema).min(1),
}).strict();

const examListeningSchema = z.object({
  ...examBaseShape,
  kind: z.literal("listening"),
  skill: z.literal("listening"),
  clips: z.array(z.object({ id, labelDe: text, transcriptDe: text, playLimit: z.union([z.literal(1), z.literal(2)]) }).strict()).min(1),
  items: z.array(z.object({
    id,
    clipId: id,
    promptDe: text,
    promptAr: text,
    options: z.array(text).min(2),
    correctIndex: nonNegativeInt,
    explanationAr: text,
  }).strict()).min(1),
  audioStatus: z.enum(["browser-tts-only", "generated-file-with-browser-tts-fallback"]),
}).strict();

const examWritingSchema = z.object({
  ...examBaseShape,
  kind: z.literal("writing"),
  skill: z.literal("writing"),
  choices: z.array(z.object({
    id,
    titleDe: text,
    situationDe: text,
    situationAr: text,
    guidingPointsDe: z.array(text).min(1),
    checklistAr: z.array(text).min(1),
  }).strict()).min(1),
  minimumWordsForPractice: positiveInt,
  wordTargetNoteAr: text,
  deterministicOnly: z.literal(true),
}).strict();

const examChoiceSchema = z.object({
  ...examBaseShape,
  kind: z.literal("choice"),
  skill: z.enum(["reading", "language-elements"]),
  textDe: text,
  items: z.array(z.object({
    id,
    promptDe: text,
    promptAr: text,
    options: z.array(text).min(2),
    correctIndex: nonNegativeInt,
    explanationAr: text,
  }).strict()).min(1),
}).strict();

const examSpeakingSchema = z.object({
  ...examBaseShape,
  kind: z.literal("speaking"),
  skill: z.literal("speaking"),
  preparationMinutes: nonNegativeInt,
  responseSeconds: positiveInt,
  choices: z.array(z.object({ id, titleDe: text, situationDe: text, bulletPointsDe: z.array(text).min(1) }).strict()).min(1),
  followUpPromptsDe: z.array(text).min(1),
  selfCriteriaAr: z.array(text).min(1),
  recordingRequired: z.literal(true),
}).strict();

export const publishedExamTaskSchema = z.discriminatedUnion("kind", [
  examMatchingSchema,
  examListeningSchema,
  examWritingSchema,
  examChoiceSchema,
  examSpeakingSchema,
]);

export const examSourceSchema = z.object({
  id,
  organization: z.enum(["Goethe-Institut", "telc gGmbH"]),
  title: text,
  url: z.string().url().startsWith("https://"),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  publishedOrUpdatedAt: text.optional(),
  usageNoteAr: text,
}).strict();

const examModuleProfileSchema = z.object({
  id,
  titleDe: text,
  titleAr: text,
  parts: positiveInt,
  minutes: positiveInt,
  maxPoints: positiveInt.optional(),
  noteAr: text,
}).strict();

export const examProfileSchema = z.object({
  id: examProvider,
  displayName: text,
  specificationVersion: text,
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["verified", "outdated"]),
  modules: z.array(examModuleProfileSchema).min(1),
  structureAr: text,
  passingRuleAr: text,
  separationWarningAr: text,
  sourceRefs: z.array(id).min(1),
}).strict();

export const fullExamSimulationSchema = z.object({
  id,
  provider: examProvider,
  titleDe: text,
  titleAr: text,
  descriptionAr: text,
  modules: z.array(z.object({
    id,
    titleDe: text,
    titleAr: text,
    officialMinutes: positiveInt,
    taskIds: z.array(id).min(1),
    resultRuleAr: text,
  }).strict()).min(1),
  sourceRefs: z.array(id).min(1),
  contentStatus: z.literal("published"),
  originalContent: z.literal(true),
  sessionMode: z.literal("guided-module-timers"),
  limitationsAr: z.array(text).min(1),
}).strict();

export const reviewCardSchema = z.object({
  id,
  front: text,
  back: text,
  hint: text,
  tags: z.array(text).min(1),
}).strict();

export const nounGrammarEntrySchema = z.object({
  id,
  lessonId: id,
  origin: z.enum(["anchor", "inventory"]),
  lemma: text,
  article: z.enum(["der", "die", "das"]),
  gender: z.enum(["masculine", "feminine", "neuter"]),
  meaningAr: text,
  plural: z.object({ form: text.nullable(), noteAr: text }).strict(),
  caseForms: z
    .object({ nominative: text, accusative: text, dative: text, genitive: text })
    .strict()
    .refine((forms) => /^(des|der) \S/.test(forms.genitive), "genitive form must carry des/der"),
  dativePlural: z
    .object({ form: text.nullable(), noteAr: text })
    .strict()
    .refine((entry) => entry.form === null || /^den \S+(n|s)$/.test(entry.form), "dative plural must be den + plural ending in n or s"),
  firstStructuredStage: z.literal("vocabulary"),
  sourceVersion: z.enum(["a1-lexical-grammar-v1", "a2-lexical-grammar-v1", "b1-lexical-grammar-v1", "b2-lexical-grammar-v1"]),
}).strict();

export const verbPrepositionFrameSchema = z.object({
  id,
  lessonId: id,
  origin: z.enum(["authored", "derived"]),
  infinitive: text,
  preposition: text,
  governedCase: z.enum(["accusative", "dative", "genitive"]),
  chunkDe: text,
  meaningAr: text,
  exampleDe: text,
  contrastAr: text,
  firstStructuredStage: z.literal("vocabulary"),
  sourceVersion: z.enum(["a1-lexical-grammar-v1", "a2-lexical-grammar-v1", "b1-lexical-grammar-v1", "b2-lexical-grammar-v1"]),
}).strict();
