import type { ErrorPatternClassification, ErrorRecord } from "@/types/learning";

export const ERROR_PATTERN_CLASSIFICATION_POLICY = "error-pattern-classification-v1" as const;
export const FAILED_REPAIR_PREREQUISITE_THRESHOLD = 2;

const rank: Record<ErrorPatternClassification, number> = {
  "possible-slip": 0,
  "emerging-pattern": 1,
  "misconception-risk": 2,
};

export function classifyErrorPattern(occurrences: number, highConfidenceWrongCount = 0, failedRepairCount = 0): ErrorPatternClassification {
  if (highConfidenceWrongCount > 0 || occurrences >= 3 || failedRepairCount >= FAILED_REPAIR_PREREQUISITE_THRESHOLD) return "misconception-risk";
  if (occurrences >= 2 || failedRepairCount > 0) return "emerging-pattern";
  return "possible-slip";
}

export function classifyErrorRecord(error: ErrorRecord): ErrorRecord {
  return {
    ...error,
    patternClassification: classifyErrorPattern(error.occurrences, error.highConfidenceWrongCount ?? 0, error.failedRepairCount ?? 0),
    classificationPolicyVersion: ERROR_PATTERN_CLASSIFICATION_POLICY,
  };
}

export function strongestErrorClassification(left?: ErrorPatternClassification, right?: ErrorPatternClassification): ErrorPatternClassification | undefined {
  if (!left) return right;
  if (!right) return left;
  return rank[right] > rank[left] ? right : left;
}

export function errorInterventionPriority(error: ErrorRecord): number {
  const classification = error.patternClassification ?? classifyErrorPattern(error.occurrences, error.highConfidenceWrongCount ?? 0, error.failedRepairCount ?? 0);
  return (error.highConfidenceWrongCount ?? 0) * 100
    + rank[classification] * 20
    + Math.min(error.occurrences, 10)
    + Math.min(error.failedRepairCount ?? 0, 10) * 5;
}

export function errorPrerequisite(error: ErrorRecord) {
  if (!error.sourceLessonId || (error.failedRepairCount ?? 0) < FAILED_REPAIR_PREREQUISITE_THRESHOLD) return null;
  return {
    lessonId: error.sourceLessonId,
    stageIndex: 4,
    href: `/lernen/${error.sourceLessonId}`,
    reasonAr: `فشل العلاج ${(error.failedRepairCount ?? 0)} مرات؛ ارجع إلى شرح القاعدة في الدرس قبل محاولة نقل جديدة.`,
  };
}
