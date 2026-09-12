import type { LessonStageKey } from "./lesson-content";

export type GermanGender = "masculine" | "feminine" | "neuter";
export type GermanNounClass = GermanGender | "plural-only";
export type GermanCase = "nominative" | "accusative" | "dative";

export type NounGrammarEntry = {
  id: string;
  lessonId: string;
  lemma: string;
  article: "der" | "die" | "das";
  gender: GermanNounClass;
  meaningAr: string;
  plural: {
    form: string | null;
    noteAr: string;
    dativeForm?: string;
  };
  caseForms: Record<GermanCase, string> & { genitive?: string };
  firstStructuredStage: Extract<LessonStageKey, "vocabulary">;
  sourceVersion: "a1-lexical-grammar-v1" | "a2-lexical-grammar-v1" | "b1-lexical-grammar-v1" | "b2-lexical-grammar-v1";
};

export type VerbPrepositionFrame = {
  id: string;
  lessonId: string;
  infinitive: string;
  preposition: string;
  governedCase: Exclude<GermanCase, "nominative">;
  chunkDe: string;
  meaningAr: string;
  exampleDe: string;
  contrastAr: string;
  firstStructuredStage: Extract<LessonStageKey, "vocabulary">;
  sourceVersion: "a1-lexical-grammar-v1" | "a2-lexical-grammar-v1" | "b1-lexical-grammar-v1" | "b2-lexical-grammar-v1";
};
