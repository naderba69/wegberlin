import { normalizeGermanText } from "@/core/lesson/evaluate";
import { classifyErrorPattern } from "@/core/errors/pattern";
import type { ErrorRecord } from "@/types/learning";
import type { LessonSrsCard } from "./lesson-cards";

export const PERSONAL_ERROR_SRS_POLICY = "confirmed-error-srs-v1" as const;

function deduplicationKey(error: ErrorRecord) {
  return `${normalizeGermanText(error.wrong)}→${normalizeGermanText(error.correct)}`;
}

function levelFromLessonId(lessonId?: string) {
  const level = lessonId?.match(/^([ab][12])-/i)?.[1]?.toUpperCase();
  return level ?? "A1";
}

export function confirmedErrorSrsCards(errors: ErrorRecord[]): LessonSrsCard[] {
  const eligible = errors
    .filter((error) => error.resolved === true && Boolean(error.confirmedAt) && Boolean(normalizeGermanText(error.correct)))
    .sort((left, right) => left.id.localeCompare(right.id));
  const unique = new Map<string, ErrorRecord>();
  for (const error of eligible) {
    const key = deduplicationKey(error);
    if (!unique.has(key)) unique.set(key, error);
  }
  return [...unique.values()].map((error) => {
    const classification = error.patternClassification ?? classifyErrorPattern(error.occurrences, error.highConfidenceWrongCount ?? 0, error.failedRepairCount ?? 0);
    const lessonId = error.sourceLessonId ?? "personal-errors";
    return {
      id: `personal-error-card:${error.id}`,
      front: `Korrigieren Sie: ${error.wrong}`,
      back: error.correct,
      hint: `${error.explanationAr} · بطاقة علاج شخصية؛ لا ترفع الإتقان عند المراجعة.`,
      tags: [levelFromLessonId(error.sourceLessonId), lessonId, "personal-error", classification, PERSONAL_ERROR_SRS_POLICY],
    };
  });
}
