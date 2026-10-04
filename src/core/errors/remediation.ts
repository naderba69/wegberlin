import { normalizeGermanText } from "@/core/lesson/evaluate";
import type { ErrorRecord } from "@/types/learning";
import { relearnStepAt } from "./feedback-guidance";
import { classifyErrorRecord } from "./pattern";

export function errorCorrectionVariants(expected: string) {
  return expected
    .split(/\s+\/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function matchesErrorCorrection(answer: string, expected: string) {
  const normalizedAnswer = normalizeGermanText(answer.replaceAll("→", " ").replaceAll(";", " "));
  if (!normalizedAnswer) return false;
  return errorCorrectionVariants(expected).some((variant) =>
    normalizeGermanText(variant.replaceAll("→", " ").replaceAll(";", " ")) === normalizedAnswer,
  );
}

export type ErrorRepairState = "untreated" | "waiting" | "due" | "confirmed";

/** المرحلة الفعلية للعلاج: الرجوع القريب بعد فشل يختلف عن الانتظار بعد نجاح. */
export type ErrorRepairPhase = ErrorRepairState | "retry-soon" | "untreated-after-failure";

export function errorRepairPhase(error: ErrorRecord, now = new Date()): ErrorRepairPhase {
  const state = errorRepairState(error, now);
  const failedAt = error.lastFailedRepairAt ? Date.parse(error.lastFailedRepairAt) : Number.NEGATIVE_INFINITY;
  const repairedAt = error.lastRepairedAt ? Date.parse(error.lastRepairedAt) : Number.NEGATIVE_INFINITY;
  const failedLast = failedAt > repairedAt;
  if (!failedLast) return state;
  if (!error.nextReviewAt) return "untreated-after-failure";
  return Date.parse(error.nextReviewAt) <= now.getTime() ? "due" : "retry-soon";
}

/**
 * جدولة الرجوع القصير بعد فشل العلاج (سلّم إعادة التعلّم: 10 دقائق ثم يوم ثم 3 أيام).
 * إضافية على العقد القديم: لا تغيّر `recordFailedErrorRepair` ولا تعيد تعريف «الانتظار بعد نجاح».
 */
export function scheduleRetryAfterFailure(error: ErrorRecord, now = new Date()): ErrorRecord {
  const failureCount = Math.max(1, error.failedRepairCount ?? 1);
  return { ...error, nextReviewAt: relearnStepAt(failureCount, now).at };
}

export function errorRepairState(error: ErrorRecord, now = new Date()): ErrorRepairState {
  if (error.resolved) return "confirmed";
  if ((error.repairCount ?? 0) === 0 || !error.nextReviewAt) return "untreated";
  return Date.parse(error.nextReviewAt) <= now.getTime() ? "due" : "waiting";
}

export function recordFailedErrorRepair(error: ErrorRecord, now = new Date()): ErrorRecord {
  return classifyErrorRecord({
    ...error,
    resolved: false,
    failedRepairCount: (error.failedRepairCount ?? 0) + 1,
    lastFailedRepairAt: now.toISOString(),
  });
}

export function applySuccessfulErrorRepair(error: ErrorRecord, now = new Date()): ErrorRecord {
  const state = errorRepairState(error, now);
  if (state === "confirmed" || state === "waiting") return error;
  if (state === "due") {
    return {
      ...error,
      resolved: true,
      repairCount: (error.repairCount ?? 1) + 1,
      lastRepairedAt: now.toISOString(),
      nextReviewAt: undefined,
      confirmedAt: now.toISOString(),
    };
  }
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return {
    ...error,
    resolved: false,
    repairCount: 1,
    lastRepairedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
    confirmedAt: undefined,
  };
}
