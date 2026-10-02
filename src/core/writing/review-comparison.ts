import type { WritingAIReviewEvidence } from "@/types/learning";

export const REVIEW_COMPARISON_POLICY = "review-disagreement-comparison-v1" as const;
export const REVIEW_COMPARISON_BOUNDARY =
  "side-by-side-only-no-merge-no-score-no-majority-vote-no-auto-pick" as const;

/** Angles the learner may request for the optional second pass. Both are advisory only. */
export const REVIEW_SECOND_ANGLES = [
  { id: "coverage", labelAr: "تغطية أوسع للنقاط", instructionEn: "Look for additional genuine issues the first pass may have missed; do not repeat it in different words." },
  { id: "style", labelAr: "تركيز على الأسلوب والصياغة", instructionEn: "Focus on register, naturalness and word choice; keep grammar findings only when they are clear errors." },
] as const;

export type ReviewSecondAngleId = (typeof REVIEW_SECOND_ANGLES)[number]["id"];

type ComparableIssue = { category: string; excerpt: string; suggestionDe: string; confidence: "medium" | "high" };
type ComparableReview = Pick<WritingAIReviewEvidence, "id" | "sourceSubmissionId" | "sourceTextSha256" | "model"> & {
  issues: ComparableIssue[];
};

export type ReviewAgreement = { category: string; sampleExcerpt: string };
export type ReviewDivergence = {
  kind: "suggestion-differs" | "confidence-differs";
  excerpt: string;
  first: string;
  second: string;
};

export type ReviewComparison = {
  policyVersion: typeof REVIEW_COMPARISON_POLICY;
  boundary: typeof REVIEW_COMPARISON_BOUNDARY;
  firstReviewId: string;
  secondReviewId: string;
  sameModel: boolean;
  models: { first: string; second: string };
  agreed: ReviewAgreement[];
  onlyFirst: ReviewAgreement[];
  onlySecond: ReviewAgreement[];
  divergences: ReviewDivergence[];
  agreementCount: number;
  divergenceCount: number;
  /** True only when the two reviews actually conflict; unique-to-one findings are listed, not judged. */
  needsHumanReview: boolean;
  noScore: true;
  noMajorityVote: true;
  noAutoPick: true;
  noThirdRequest: true;
};

function normalized(value: string) {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("de");
}

function categoriesByReview(review: ComparableReview) {
  const map = new Map<string, ComparableIssue>();
  for (const issue of review.issues) if (!map.has(issue.category)) map.set(issue.category, issue);
  return map;
}

export function compareWritingReviews(first: ComparableReview, second: ComparableReview): ReviewComparison {
  if (!first || !second) throw new Error("تحتاج المقارنة إلى مراجعتين محفوظتين على الأقل.");
  if (first.id === second.id) throw new Error("لا تُقارَن مراجعةٌ بنفسها: يجب أن تكون المراجعتان مستقلتين.");
  if (first.sourceSubmissionId !== second.sourceSubmissionId)
    throw new Error("المراجعتان لا تنتميان إلى النسخة نفسها، فلا تجوز المقارنة.");
  if (normalized(first.sourceTextSha256) !== normalized(second.sourceTextSha256))
    throw new Error("المقارنة لا تعمل إلا على النص نفسه: بصمتا النصين مختلفتان.");

  const firstByCategory = categoriesByReview(first);
  const secondByCategory = categoriesByReview(second);
  const agreed: ReviewAgreement[] = [];
  const onlyFirst: ReviewAgreement[] = [];
  const onlySecond: ReviewAgreement[] = [];
  for (const [category, issue] of firstByCategory) {
    const counterpart = secondByCategory.get(category);
    if (counterpart) agreed.push({ category, sampleExcerpt: issue.excerpt });
    else onlyFirst.push({ category, sampleExcerpt: issue.excerpt });
  }
  for (const [category, issue] of secondByCategory) {
    if (!firstByCategory.has(category)) onlySecond.push({ category, sampleExcerpt: issue.excerpt });
  }

  const divergences: ReviewDivergence[] = [];
  const seen = new Set<string>();
  for (const firstIssue of first.issues) {
    const key = normalized(firstIssue.excerpt);
    if (seen.has(key)) continue;
    const secondIssue = second.issues.find((candidate) => normalized(candidate.excerpt) === key);
    if (!secondIssue) continue;
    seen.add(key);
    if (normalized(firstIssue.suggestionDe) !== normalized(secondIssue.suggestionDe)) {
      divergences.push({ kind: "suggestion-differs", excerpt: firstIssue.excerpt, first: firstIssue.suggestionDe, second: secondIssue.suggestionDe });
    } else if (firstIssue.confidence !== secondIssue.confidence) {
      divergences.push({ kind: "confidence-differs", excerpt: firstIssue.excerpt, first: firstIssue.confidence, second: secondIssue.confidence });
    }
  }

  const result: ReviewComparison = {
    policyVersion: REVIEW_COMPARISON_POLICY,
    boundary: REVIEW_COMPARISON_BOUNDARY,
    firstReviewId: first.id,
    secondReviewId: second.id,
    sameModel: first.model === second.model,
    models: { first: first.model, second: second.model },
    agreed,
    onlyFirst,
    onlySecond,
    divergences,
    agreementCount: agreed.length,
    divergenceCount: divergences.length,
    needsHumanReview: divergences.length > 0,
    noScore: true,
    noMajorityVote: true,
    noAutoPick: true,
    noThirdRequest: true,
  };
  assertReviewComparisonIntegrity(result);
  return result;
}

/** Re-checks the invariants on any stored or rendered comparison; never resolves the disagreement. */
export function assertReviewComparisonIntegrity(result: ReviewComparison) {
  if (result.policyVersion !== REVIEW_COMPARISON_POLICY) throw new Error("نسخة سياسة المقارنة غير معروفة.");
  if (result.boundary !== REVIEW_COMPARISON_BOUNDARY) throw new Error("حدّ المقارنة تغيّر: لا دمج ولا أصوات ولا اختيار آلي.");
  if (result.agreementCount !== result.agreed.length) throw new Error("عدّ المتفق عليه لا يطابق القائمة.");
  if (result.divergenceCount !== result.divergences.length) throw new Error("عدّ الخلاف لا يطابق القائمة.");
  if (result.needsHumanReview !== (result.divergenceCount > 0)) throw new Error("وسم المراجعة البشرية لا يطابق وجود خلاف فعلي.");
  if (!result.noScore || !result.noMajorityVote || !result.noAutoPick || !result.noThirdRequest)
    throw new Error("أحد حدود المقارنة مفقود: لا درجة ولا تصويت ولا اختيار آلي ولا إرسال ثالث.");
  return result;
}

export function reviewComparisonCountsAr(result: ReviewComparison) {
  return {
    agreedAr: `${result.agreementCount} نقطة اتفقت عليها المراجعتان`,
    divergedAr: `${result.divergenceCount} نقطة اختلفت فيها المراجعتان`,
    uniqueAr: `نقطتان ظهرتا في مراجعة واحدة فقط (${result.onlyFirst.length} + ${result.onlySecond.length})`,
    resolutionAr: "الخلاف يُعرض ولا يُحسم هنا: لا تصويت ولا متوسط ولا اختيار آلي.",
  };
}
