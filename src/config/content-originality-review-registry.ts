export const CONTENT_SIMILARITY_POLICY = "content-near-duplicate-v1" as const;
export const CONTENT_REVIEW_STATE_POLICY = "content-review-state-v1" as const;

export type SimilarityExemption = {
  leftId: string;
  rightId: string;
  reason: string;
  reviewedBy: string;
  reviewedAt: string;
};

export type ReviewDimension = "german" | "arabic" | "cefr" | "copyright";
export type ReviewStatus = "automated-pass-human-pending" | "independently-reviewed";
export type ContentReviewOverride = {
  contentId: string;
  dimension: ReviewDimension;
  status: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  evidence: string;
};

// Only reviewed, named exceptions belong here. Empty is valid and preferable to broad pattern suppression.
export const similarityExemptions: SimilarityExemption[] = [];
export const contentReviewOverrides: ContentReviewOverride[] = [];

// No copyrighted Menschen/Hueber/Goethe/telc source text is stored or fetched by this audit.
// P1-92 and copyright clearance remain partial until an authorized comparison corpus and independent reviewer exist.
export const authorizedExternalReferenceCorpora: Array<{ id:string; owner:string; authorizationEvidence:string; reviewedAt:string }> = [];
