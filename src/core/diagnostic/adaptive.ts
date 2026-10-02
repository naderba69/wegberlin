import type { CEFRLevel } from "@/types/learning";
import { diagnosticForms, diagnosticLevels, type DiagnosticFormId, type DiagnosticQuestion } from "@/data/diagnostic";

export const DIAGNOSTIC_QUESTIONS_PER_LEVEL = 4;
export const DIAGNOSTIC_LEVEL_PASS_SCORE = 3;

export function questionsForDiagnosticLevel(formId: DiagnosticFormId, level: CEFRLevel): DiagnosticQuestion[] {
  return diagnosticForms[formId].filter((question) => question.level === level);
}

export function scoreDiagnosticLevel(questions: DiagnosticQuestion[], answers: Record<string, number>): number {
  return questions.filter((question) => answers[question.id] === question.correctIndex).length;
}

export function nextDiagnosticLevel(level: CEFRLevel, correct: number): CEFRLevel | null {
  if (correct < DIAGNOSTIC_LEVEL_PASS_SCORE) return null;
  const index = diagnosticLevels.indexOf(level);
  return diagnosticLevels[index + 1] ?? null;
}

export function alternateDiagnosticForm(previous?: "A" | "B"): DiagnosticFormId {
  return previous === "A" ? "B" : "A";
}
