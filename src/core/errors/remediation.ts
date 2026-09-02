import { normalizeGermanText } from "@/core/lesson/evaluate";
import type { ErrorRecord } from "@/types/learning";

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

export function errorRepairState(error: ErrorRecord, now = new Date()): ErrorRepairState {
  if (error.resolved) return "confirmed";
  if ((error.repairCount ?? 0) === 0 || !error.nextReviewAt) return "untreated";
  return Date.parse(error.nextReviewAt) <= now.getTime() ? "due" : "waiting";
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
