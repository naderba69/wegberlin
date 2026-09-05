import type { LessonStageKey } from "./lesson-content";

export type GermanGender = "masculine" | "feminine" | "neuter";
export type GermanCase = "nominative" | "accusative" | "dative" | "genitive";
/** الحالة التي يفرضها الفعل أو حرف الجر. Genitiv مضاف لحروف الجر الرسمية في B2؛ صيغة Genitiv الاسمية نفسها محفوظة في caseForms.genitive. */
export type GovernedCase = Exclude<GermanCase, "nominative"> | "genitive";

export type LexicalSourceVersion =
  | "a1-lexical-grammar-v1"
  | "a2-lexical-grammar-v1"
  | "b1-lexical-grammar-v1"
  | "b2-lexical-grammar-v1";

export type NounGrammarEntry = {
  id: string;
  lessonId: string;
  lemma: string;
  article: "der" | "die" | "das";
  gender: GermanGender;
  meaningAr: string;
  plural: {
    form: string | null;
    noteAr: string;
  };
  caseForms: Record<GermanCase, string>;
  /** جمع المجرور بعد den: الشكل الذي يحتاجه المتعلم فعليًا مع حروف الجر وأفعال الجر في الجمع. */
  dativePlural: {
    form: string | null;
    noteAr: string;
  };
  firstStructuredStage: Extract<LessonStageKey, "vocabulary">;
  sourceVersion: LexicalSourceVersion;
};

/** authored: إطار مؤلف خصيصًا للدرس. derived: إطار مشتق من قاموس التكافؤ بعد أن قاس الجرد وقوعه في نص الدرس. */
export type FrameOrigin = "authored" | "derived";

export type VerbPrepositionFrame = {
  id: string;
  lessonId: string;
  origin: FrameOrigin;
  infinitive: string;
  preposition: string;
  governedCase: GovernedCase;
  chunkDe: string;
  meaningAr: string;
  exampleDe: string;
  contrastAr: string;
  firstStructuredStage: Extract<LessonStageKey, "vocabulary">;
  sourceVersion: LexicalSourceVersion;
};
