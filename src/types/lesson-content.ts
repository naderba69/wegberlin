import type { CEFRLevel } from "./learning";

export type LessonStageKey =
  | "objectives" | "entry" | "vocabulary" | "discover" | "rule" | "controlled"
  | "reading" | "listening" | "pronunciation" | "writing" | "speaking" | "mediation"
  | "errors" | "test";

export type Question = {
  id: string;
  promptDe: string;
  promptAr: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationAr: string;
};

export type PracticeExercise =
  | { id: string; type: "multiple-choice"; promptAr: string; promptDe?: string; options: [string,string,string,string]; correctIndex: 0|1|2|3; explanationAr: string }
  | { id: string; type: "fill-blank"; promptAr: string; template: string; acceptedAnswers: string[]; explanationAr: string }
  | { id: string; type: "word-ordering"; promptAr: string; words: string[]; acceptedAnswers: string[]; explanationAr: string }
  | { id: string; type: "error-correction"; promptAr: string; sentence: string; acceptedAnswers: string[]; explanationAr: string }
  | { id: string; type: "matching"; promptAr: string; pairs: Array<{ left: string; right: string }>; explanationAr: string };

export interface TheoryBlock {
  id: string;
  titleDe: string;
  titleAr: string;
  explanationAr: string;
  contrastAr: string;
  formula?: string;
  examples: Array<{ de: string; ar: string }>;
  trickAr: string;
}

export interface FullLesson {
  id: string;
  level: CEFRLevel;
  module: number;
  titleDe: string;
  titleAr: string;
  descriptionAr: string;
  estimatedMinutes: number;
  objectives: Array<{ de: string; ar: string }>;
  entry: { titleAr: string; sceneAr: string; dialogue: Array<{ speaker: string; de: string; ar: string }> };
  phrases: Array<{ de: string; ar: string; noteAr?: string }>;
  discovery: { instructionAr: string; examples: string[]; questionsAr: string[] };
  theory: TheoryBlock[];
  exercises: PracticeExercise[];
  reading: {
    titleDe: string; titleAr: string; textDe: string; textAr: string;
    glossary: Array<{ lemma: string; surfaceForm: string; ar: string }>;
    questions: Question[];
  };
  listening: {
    titleDe: string; titleAr: string; transcriptDe: string; transcriptAr: string;
    strategyAr: string; questions: Question[];
  };
  pronunciation: {
    titleAr: string; focus: string; explanationAr: string;
    items: Array<{ de: string; ipa: string; ar: string }>;
    trickAr: string;
  };
  writing: { titleAr: string; promptDe: string; promptAr: string; checklistAr: string[]; modelDe: string };
  speaking: { titleAr: string; promptDe: string; promptAr: string; usefulPhrases: string[]; successCriteriaAr: string[] };
  mediation: { scenarioAr: string; sourceDe: string; taskAr: string; suggestedAr: string };
  mistakes: Array<{ wrong: string; correct: string; whyAr: string; trickAr: string }>;
  miniTest: Question[];
  flashcards: Array<{ id: string; frontDe: string; backAr: string; exampleDe: string }>;
}

export const LESSON_STAGE_KEYS: LessonStageKey[] = [
  "objectives", "entry", "vocabulary", "discover", "rule", "controlled", "reading",
  "listening", "pronunciation", "writing", "speaking", "mediation", "errors", "test",
];
