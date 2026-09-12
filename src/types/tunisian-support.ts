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

export type TunisianReviewStatus = "authored-review-pending" | "independently-reviewed";

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
  sourceVersion: "tunisian-support-v1";
}

export interface TunisianSupportCoverage {
  noteCount: number;
  lessonCount: number;
  pendingReview: number;
  independentlyReviewed: number;
  byLevel: Record<CEFRLevel, number>;
  categories: number;
}

export function supportsTunisianNotes(mode: ArabicSupportMode | undefined): mode is "tunisian-supported" {
  return mode === "tunisian-supported";
}
