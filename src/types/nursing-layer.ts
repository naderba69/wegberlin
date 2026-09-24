import type { CEFRLevel } from "./learning";

/**
 * Nursing layer ("توابل" at A1/A2, "طبق ثانٍ" at B1+) — owner contract v152 / ADR-080.
 *
 * Three strict rules this type system encodes:
 *  (a) the layer introduces no new grammar: every unit reuses level material and names the block it reuses;
 *  (b) no language task may need clinical knowledge to be answered: the accepted action is always a
 *      language act (recognise / confirm / ask / document) and is never an action on a body or a dose;
 *  (c) the layer is parasitic: deleting this registry must leave the general B2 path intact, so the
 *      data is imported by exactly one panel and one audit (asserted by tests) and never by gates,
 *      exams, evidence or SRS code.
 */

export type NursingLayerTrack = "gewuerz" | "zweiter-teller";

export type NursingSafetyCluster = "recognition" | "confirmation" | "questioning" | "documentation";

/** The only kinds of learner action the layer may accept. All four are language acts, not clinical ones. */
export type NursingActionKind = "recognize" | "confirm" | "ask" | "document";

/** Rejected kinds exist so that guessing is failed *by the environment*, not by a written rule. */
export type NursingRejectionKind = "guess" | "act-now" | "silent-agreement";

export interface NursingTaskOption {
  textDe: string;
  kind: NursingActionKind | NursingRejectionKind;
  reasonAr: string;
}

export interface NursingSafetyTask {
  /** What the learner sees/hears before choosing. Authored German, level-appropriate. */
  stimulusDe: string;
  promptAr: string;
  /** Exactly one accepted option; at least one `guess` option must be present. */
  options: [NursingTaskOption, NursingTaskOption, NursingTaskOption, NursingTaskOption];
}

export interface NursingReviewWord {
  de: string;
  ar: string;
  /** Short authored example that stays inside the unit's own situation. */
  exampleDe: string;
}

export interface NursingLayerUnit {
  id: string;
  lessonId: string;
  level: CEFRLevel;
  track: NursingLayerTrack;
  cluster: NursingSafetyCluster;
  titleDe: string;
  titleAr: string;
  /** Arabic situation note. Deliberately describes the *language* setting, never a procedure. */
  situationAr: string;
  /** Level material reused by this unit (theory block ids of the lesson it is woven into). */
  reusedTheoryIds: [string, ...string[]];
  /** German the learner repeats/reads back. Never a clinical instruction to be executed. */
  targetDe: string;
  safetyTask: NursingSafetyTask;
  /** Non-empty only for B1+ (track "zweiter-teller"). A1/A2 must be exactly empty. */
  reviewWords: NursingReviewWord[];
  /** Present on every unit; equals NURSING_LAYER_DISCLAIMER_AR. Removal is an audit failure. */
  disclaimerAr: string;
  reviewStatus: "authored-review-pending";
  /** The layer increases professional-review debt; this must stay pending until a named nurse reviews. */
  professionalReview: "pending-nursing-professional";
  reviewerId: string;
  ownerId: string;
  sourceVersion: "nursing-layer-v1";
}

export interface NursingChoiceOutcome {
  status: "accepted" | "rejected";
  kind: NursingActionKind | NursingRejectionKind;
  /** Language reason in Arabic; never a clinical statement. */
  reasonAr: string;
  /** True only for the accepted option — the environment never confirms a guess. */
  confirmationRequired: boolean;
  masteryEffect: "none";
  evidenceEffect: "none";
  gateEffect: "none";
}
