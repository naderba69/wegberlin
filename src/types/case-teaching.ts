import type { GermanCase } from "./lexical-grammar";

export type ExtendedGermanCase = GermanCase | "genitive";
export type CaseMeaningStep = "meaning" | "role" | "form";

export type MeaningFirstCaseContract = {
  id: string;
  lessonId: string;
  titleDe: string;
  titleAr: string;
  semanticQuestionAr: string;
  roleChoicesAr: [string, string, ...string[]];
  governedCases: ExtendedGermanCase[];
  formRuleAr: string;
  theoryIds: string[];
  controlledExerciseIds: string[];
  assessmentIds: string[];
  sequence: ["meaning", "role", "form"];
  sourceVersion: "meaning-first-case-v1";
};
