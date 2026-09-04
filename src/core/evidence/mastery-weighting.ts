import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt } from "@/types/learning";

export const MASTERY_WEIGHTING_VERSION = "novelty-weighting-v1" as const;
export const NOVEL_PRACTICE_WEIGHT = 1;
export const NOVEL_TRANSFER_WEIGHT = 1.5;
export const SAME_ITEM_RETRY_WEIGHT = 0.25;

export type WeightedEvidenceSignal = {
  version: typeof MASTERY_WEIGHTING_VERSION;
  novelItemCount: number;
  novelTransferCount: number;
  retryAttemptCount: number;
  countedRetryCount: number;
  weightedCorrect: number;
  weightedPossible: number;
  weightedAccuracyPercent: number | null;
};

export function buildNoveltyWeightedEvidence(attempts: readonly ExerciseAttempt[], transferItemIds: ReadonlySet<string> = new Set()): WeightedEvidenceSignal {
  const byItem = new Map<string, ExerciseAttempt[]>();
  for (const attempt of [...attempts].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))) {
    byItem.set(attempt.exerciseId, [...(byItem.get(attempt.exerciseId) ?? []), attempt]);
  }

  let novelTransferCount = 0;
  let retryAttemptCount = 0;
  let countedRetryCount = 0;
  let weightedCorrect = 0;
  let weightedPossible = 0;
  for (const [itemId, itemAttempts] of byItem) {
    const first = itemAttempts[0];
    const novelWeight = transferItemIds.has(itemId) ? NOVEL_TRANSFER_WEIGHT : NOVEL_PRACTICE_WEIGHT;
    if (transferItemIds.has(itemId)) novelTransferCount += 1;
    weightedPossible += novelWeight;
    if (first.correct) weightedCorrect += novelWeight;

    retryAttemptCount += Math.max(0, itemAttempts.length - 1);
    if (itemAttempts.length > 1) {
      const latestRetry = itemAttempts.at(-1)!;
      countedRetryCount += 1;
      weightedPossible += SAME_ITEM_RETRY_WEIGHT;
      if (latestRetry.correct) weightedCorrect += SAME_ITEM_RETRY_WEIGHT;
    }
  }

  return {
    version: MASTERY_WEIGHTING_VERSION,
    novelItemCount: byItem.size,
    novelTransferCount,
    retryAttemptCount,
    countedRetryCount,
    weightedCorrect,
    weightedPossible,
    weightedAccuracyPercent: weightedPossible ? Math.round((weightedCorrect / weightedPossible) * 100) : null,
  };
}

export function lessonMasteryFromAttempts(lesson: FullLesson, attempts: readonly ExerciseAttempt[]) {
  const acceptedIds = new Set([
    ...lesson.exercises.map((exercise) => exercise.id),
    ...lesson.reading.questions.map((question) => question.id),
    ...lesson.listening.questions.map((question) => question.id),
    ...lesson.miniTest.map((question) => question.id),
  ]);
  const transferIds = new Set([
    ...lesson.reading.questions.map((question) => question.id),
    ...lesson.listening.questions.map((question) => question.id),
    ...lesson.miniTest.map((question) => question.id),
  ]);
  const lessonAttempts = attempts.filter((attempt) => attempt.lessonId === lesson.id && acceptedIds.has(attempt.exerciseId));
  const evidence = buildNoveltyWeightedEvidence(lessonAttempts, transferIds);
  const coverage = evidence.novelItemCount / Math.max(acceptedIds.size, 1);
  const accuracy = (evidence.weightedAccuracyPercent ?? 0) / 100;
  const score = Math.min(65, Math.round(20 + coverage * 25 + accuracy * 20));
  return { score, coveragePercent: Math.round(coverage * 100), evidence };
}
