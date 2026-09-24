import { NURSING_LAYER_DISCLAIMER_AR, nursingLayerUnitsForLesson, nursingReviewWordsTsv } from "@/data/nursing-layer-registry";
import type { CEFRLevel } from "@/types/learning";
import type { NursingChoiceOutcome, NursingLayerUnit } from "@/types/nursing-layer";

/**
 * Deterministic local evaluator for the nursing layer.
 *
 * ADR-080 requirement: safety habits are trained by making the *environment* fail guessing and succeed
 * confirmation — not by writing a rule list to memorise. So there is no scoring model here and no
 * clinical judgement: the evaluator only knows which option is the authored language act, and it always
 * reports `masteryEffect: none`, `evidenceEffect: none`, `gateEffect: none`.
 */
export const NURSING_PRACTICE_POLICY = "nursing-language-practice-v1" as const;
export const NURSING_PRACTICE_BOUNDARY =
  "تقييم محلي حتمي لفعلٍ لغوي: لا يقيس معرفة سريرية، ولا يمنح إتقانًا ولا دليلًا ولا يفتح بوابة مستوى، والصياغات لا تُعدّ إرشادًا سريريًا." as const;

const REJECTION_KINDS = ["guess", "act-now", "silent-agreement"] as const;

export function nursingUnitsForLesson(lessonId: string): NursingLayerUnit[] {
  return nursingLayerUnitsForLesson(lessonId);
}

export function evaluateNursingChoice(unit: NursingLayerUnit, optionIndex: number): NursingChoiceOutcome {
  const option = unit.safetyTask.options[optionIndex];
  if (!option) throw new Error("Nursing choice must be one of the authored options.");
  const rejected = (REJECTION_KINDS as readonly string[]).includes(option.kind);
  return {
    status: rejected ? "rejected" : "accepted",
    kind: option.kind,
    reasonAr: option.reasonAr,
    confirmationRequired: !rejected,
    masteryEffect: "none",
    evidenceEffect: "none",
    gateEffect: "none",
  };
}

export interface NursingPracticeSummary {
  policyVersion: typeof NURSING_PRACTICE_POLICY;
  unitId: string;
  answered: number;
  acceptedCount: number;
  rejectedCount: number;
  /** Every rejection that came from guessing, i.e. the environment refusing an unfounded assumption. */
  guessRejectedCount: number;
  confirmationSeen: boolean;
  masteryEffect: "none";
  evidenceEffect: "none";
  gateEffect: "none";
  disclaimerAr: string;
}

export function summarizeNursingPractice(unit: NursingLayerUnit, outcomes: NursingChoiceOutcome[]): NursingPracticeSummary {
  if (outcomes.length > unit.safetyTask.options.length) throw new Error("More outcomes than authored options.");
  return {
    policyVersion: NURSING_PRACTICE_POLICY,
    unitId: unit.id,
    answered: outcomes.length,
    acceptedCount: outcomes.filter((outcome) => outcome.status === "accepted").length,
    rejectedCount: outcomes.filter((outcome) => outcome.status === "rejected").length,
    guessRejectedCount: outcomes.filter((outcome) => outcome.kind === "guess").length,
    confirmationSeen: outcomes.some((outcome) => outcome.confirmationRequired),
    masteryEffect: "none",
    evidenceEffect: "none",
    gateEffect: "none",
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
  };
}

/**
 * B1+ professional words become reviewable through the *existing* personal-vocabulary import:
 * the layer only produces the documented TSV header, it never writes to storage itself.
 */
export function nursingReviewTsvForLesson(lessonId: string): string | null {
  const units = nursingLayerUnitsForLesson(lessonId);
  const withWords = units.filter((unit) => unit.reviewWords.length > 0);
  if (!withWords.length) return null;
  return nursingReviewWordsTsv(withWords);
}

export function nursingLayerTrackLabel(level: CEFRLevel): "gewuerz" | "zweiter-teller" {
  return level === "A1" || level === "A2" ? "gewuerz" : "zweiter-teller";
}
