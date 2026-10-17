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

// No copyrighted Menschen/Hueber/Goethe/telc source text is stored in the repository or fetched by this audit.
// P1-92 is closed by ADR-119: scripts/compare-external-reference-corpus.ts compares every German string in src/data with an
// external corpus held outside the repo (§ 44b UrhG text and data mining of lawfully accessible works; copies deleted after the run).
// Only hashes, indices, and scores are committed. Copyright clearance stays pending: it needs the full books and an independent rights review.
export type ExternalReferenceCorpusRecord = {
  id:string; owner:string; authorizationEvidence:string; reviewedAt:string;
  reportPath:string; coverage:string; matchCount:number;
};
export const authorizedExternalReferenceCorpora: ExternalReferenceCorpusRecord[] = [{
  id:"menschen-public-samples-2026-10-17",
  owner:"Hueber Verlag — official public Leseproben (Menschen A1.1 KB lesson 1, Menschen A1 KB Leseprobe 2 lesson 9, Menschen B1 KB Leseprobe 1 lesson 1)",
  authorizationEvidence:"Statutory basis, not a licence: § 44b UrhG permits copies of lawfully accessible works for text and data mining; hueber.de/robots.txt carried no machine-readable reservation on 2026-10-17. Sample PDFs are published by the publisher on shop.hueber.de; temporary transcriptions lived in /tmp and were deleted after the run.",
  reviewedAt:"2026-10-17",
  reportPath:"reports/external-reference-comparison/menschen-public-samples-2026-10-17.json",
  coverage:"3 sample lessons (~12 book pages) out of the Menschen A1–B1 course books; pirated full copies were deliberately not used",
  matchCount:0,
}];
