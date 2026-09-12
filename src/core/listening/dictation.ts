import type { DictationItem } from "@/data/dictation-bank";
import { DICTATION_EVIDENCE_BOUNDARY, DICTATION_POLICY } from "@/data/dictation-bank";
import type { DictationAttempt } from "@/types/learning";

export type DictationMismatch = {
  kind: "missing" | "extra" | "substitution";
  expected?: string;
  actual?: string;
};

export type DictationEvaluation = {
  exact: boolean;
  wordAccuracyPercent: number;
  errorCount: number;
  mismatchCount: number;
  mismatches: DictationMismatch[];
  surfaceOnlyDifference: boolean;
  feedbackAr: string;
};

function normalizeSurface(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function tokenizeDictation(value: string) {
  return normalizeSurface(value).match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [];
}

function comparisonToken(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE");
}

function editMatrix(expected: string[], actual: string[]) {
  const matrix = Array.from({ length: expected.length + 1 }, () => Array<number>(actual.length + 1).fill(0));
  for (let row = 0; row <= expected.length; row += 1) matrix[row][0] = row;
  for (let column = 0; column <= actual.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= expected.length; row += 1) {
    for (let column = 1; column <= actual.length; column += 1) {
      const substitutionCost = comparisonToken(expected[row - 1]) === comparisonToken(actual[column - 1]) ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      );
    }
  }
  return matrix;
}

function deriveMismatches(expected: string[], actual: string[], matrix: number[][]) {
  const mismatches: DictationMismatch[] = [];
  let row = expected.length;
  let column = actual.length;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && comparisonToken(expected[row - 1]) === comparisonToken(actual[column - 1])) {
      row -= 1;
      column -= 1;
      continue;
    }
    const current = matrix[row][column];
    if (row > 0 && column > 0 && matrix[row - 1][column - 1] + 1 === current) {
      mismatches.push({ kind: "substitution", expected: expected[row - 1], actual: actual[column - 1] });
      row -= 1;
      column -= 1;
      continue;
    }
    if (row > 0 && matrix[row - 1][column] + 1 === current) {
      mismatches.push({ kind: "missing", expected: expected[row - 1] });
      row -= 1;
      continue;
    }
    if (column > 0) {
      mismatches.push({ kind: "extra", actual: actual[column - 1] });
      column -= 1;
      continue;
    }
    break;
  }
  return mismatches.reverse();
}

export function evaluateFullDictation(actualText: string, canonicalText: string): DictationEvaluation {
  const expected = tokenizeDictation(canonicalText);
  const actual = tokenizeDictation(actualText);
  const matrix = editMatrix(expected, actual);
  const distance = matrix[expected.length][actual.length];
  const wordAccuracyPercent = expected.length ? Math.max(0, Math.round((1 - distance / expected.length) * 100)) : 0;
  const exact = normalizeSurface(actualText) === normalizeSurface(canonicalText);
  const surfaceOnlyDifference = !exact && distance === 0;
  const mismatches = deriveMismatches(expected, actual, matrix);
  return {
    exact,
    wordAccuracyPercent,
    errorCount: exact ? 0 : Math.max(1, distance),
    mismatchCount: distance,
    mismatches,
    surfaceOnlyDifference,
    feedbackAr: exact
      ? "طابقت الجملة كلمةً وشكلًا. أعد سماعها مرة أخيرة لترسيخ الإيقاع."
      : surfaceOnlyDifference
        ? "الكلمات موجودة، لكن الشكل ليس مطابقًا بعد. راجع الحروف الكبيرة والفواصل والنقطة أو علامة السؤال."
        : "قارن مواضع الاختلاف واحدًا واحدًا، ثم أخفِ النموذج وأعد الكتابة بعد سماع جديد.",
  };
}

export function evaluatePartialDictation(item: DictationItem, answers: Record<number, string>): DictationEvaluation {
  if (item.mode !== "partial" || !item.slots?.length) throw new Error("Partial evaluation requires authored slots.");
  const mismatches: DictationMismatch[] = [];
  for (const slot of item.slots) {
    const actual = normalizeSurface(answers[slot.index] ?? "");
    if (actual !== normalizeSurface(slot.answer)) mismatches.push({ kind: actual ? "substitution" : "missing", expected: slot.answer, actual: actual || undefined });
  }
  const errorCount = mismatches.length;
  const exact = errorCount === 0;
  return {
    exact,
    wordAccuracyPercent: Math.round(((item.slots.length - errorCount) / item.slots.length) * 100),
    errorCount,
    mismatchCount: errorCount,
    mismatches,
    surfaceOnlyDifference: false,
    feedbackAr: exact
      ? "أكملت كل الفراغات بالشكل الصحيح. استمع الآن إلى الجملة كاملة واربط الكلمات بإيقاعها."
      : "راجع الفراغات المحددة فقط، ثم أخفِ التصحيح وأعد المحاولة بعد سماع جديد.",
  };
}

export function createDictationAttempt(input: {
  item: DictationItem;
  evaluation: DictationEvaluation;
  playbackCount: number;
  retryOf?: string;
  now?: Date;
  id?: string;
}): DictationAttempt {
  if (!Number.isInteger(input.playbackCount) || input.playbackCount < 1) throw new Error("A dictation attempt requires at least one playback request.");
  if (input.evaluation.exact !== (input.evaluation.errorCount === 0 && input.evaluation.wordAccuracyPercent === 100)) throw new Error("Dictation summary is internally inconsistent.");
  return {
    id: input.id ?? `dictation-attempt-${crypto.randomUUID()}`,
    policyVersion: DICTATION_POLICY,
    itemId: input.item.id,
    level: input.item.level,
    mode: input.item.mode,
    exact: input.evaluation.exact,
    wordAccuracyPercent: input.evaluation.wordAccuracyPercent,
    errorCount: input.evaluation.errorCount,
    playbackCount: input.playbackCount,
    retryOf: input.retryOf,
    evidenceBoundary: DICTATION_EVIDENCE_BOUNDARY,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}
