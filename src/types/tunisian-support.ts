import type { ArabicSupportMode, CEFRLevel } from "./learning";

export type TunisianSupportCategory =
  | "question-order"
  | "origin-location"
  | "possessive-gender"
  | "verb-second"
  | "case-role"
  | "perfect-bracket"
  | "temporal-connector"
  | "modal-negation"
  | "subordinate-clause"
  | "relative-pronoun"
  | "passive-focus"
  | "reported-distance"
  | "prepositional-pronoun"
  | "quantitative-precision"
  | "formal-preposition";

/** source-verified-agent (ADR-116/ADR-117): checked against dated published sources by the agent; not an independent human review. */
export type TunisianReviewStatus = "authored-review-pending" | "source-verified-agent" | "independently-reviewed";

export interface TunisianSupportNote {
  id: string;
  lessonId: string;
  level: CEFRLevel;
  theoryIds: [string, ...string[]];
  category: TunisianSupportCategory;
  titleDe: string;
  titleAr: string;
  msaBridgeAr: string;
  tunisianNoteAr: string;
  differenceImpactAr: string;
  germanAnchorDe: string;
  visibleFor: readonly ["tunisian-supported"];
  reviewStatus: TunisianReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  sourceVerifiedAt?: string;
  sourceRefs?: readonly string[];
  sourceVersion: "tunisian-support-v1";
}

export interface TunisianSupportCoverage {
  noteCount: number;
  lessonCount: number;
  pendingReview: number;
  sourceVerified: number;
  independentlyReviewed: number;
  byLevel: Record<CEFRLevel, number>;
  categories: number;
}

export function supportsTunisianNotes(mode: ArabicSupportMode | undefined): mode is "tunisian-supported" {
  return mode === "tunisian-supported";
}
