import { describe, expect, it } from "vitest";
import { REVIEW_COMPARISON_BOUNDARY, REVIEW_COMPARISON_POLICY, REVIEW_SECOND_ANGLES, assertReviewComparisonIntegrity, compareWritingReviews, reviewComparisonCountsAr } from "@/core/writing/review-comparison";

const sha = "a".repeat(64);

function issue(category: string, excerpt: string, suggestionDe: string, confidence: "medium" | "high" = "high") {
  return { category, excerpt, suggestionDe, confidence };
}

function review(id: string, issues: ReturnType<typeof issue>[], model = "gemini-2.5-flash") {
  return { id, sourceSubmissionId: "sub-1", sourceTextSha256: sha, model, issues };
}

const first = review("r1", [
  issue("grammar", "Ich heiße Nadia und ich kommen aus Tunesien.", "Ich heiße Nadia und ich komme aus Tunesien."),
  issue("coherence", "Am Abend lerne ich mit meiner Freundin.", "Am Abend lerne ich mit meiner Freundin Deutsch.", "medium"),
]);
const second = review("r2", [
  issue("grammar", "Ich heiße Nadia und ich kommen aus Tunesien.", "Ich heiße Nadia und komme aus Tunesien."),
  issue("vocabulary", "arbeite heute im Büro", "arbeite derzeit im Büro", "medium"),
]);

describe("review disagreement comparison (P2-215)", () => {
  it("lists agreement, one-sided findings, and the real disagreement without resolving it", () => {
    const result = compareWritingReviews(first, second);
    expect(result.policyVersion).toBe(REVIEW_COMPARISON_POLICY);
    expect(result.boundary).toBe(REVIEW_COMPARISON_BOUNDARY);
    expect(result.agreed.map((item) => item.category)).toEqual(["grammar"]);
    expect(result.onlyFirst.map((item) => item.category)).toEqual(["coherence"]);
    expect(result.onlySecond.map((item) => item.category)).toEqual(["vocabulary"]);
    expect(result.divergences).toEqual([
      { kind: "suggestion-differs", excerpt: "Ich heiße Nadia und ich kommen aus Tunesien.", first: "Ich heiße Nadia und ich komme aus Tunesien.", second: "Ich heiße Nadia und komme aus Tunesien." },
    ]);
    expect(result.agreementCount).toBe(1);
    expect(result.divergenceCount).toBe(1);
    expect(result.needsHumanReview).toBe(true);
  });

  it("sends a disagreement to human review, never to a vote, an average or an automatic pick", () => {
    const result = compareWritingReviews(first, second);
    expect(result.noScore).toBe(true);
    expect(result.noMajorityVote).toBe(true);
    expect(result.noAutoPick).toBe(true);
    expect(result.noThirdRequest).toBe(true);
    const counts = reviewComparisonCountsAr(result);
    expect(counts.divergedAr).toContain("1");
    expect(counts.resolutionAr).toContain("لا تصويت");
  });

  it("reports confidence disagreement when both excerpts carry the same suggestion", () => {
    const result = compareWritingReviews(
      review("r1", [issue("grammar", "Ich kommen aus Tunesien.", "Ich komme aus Tunesien.", "high")]),
      review("r2", [issue("grammar", "Ich kommen aus Tunesien.", "Ich komme aus Tunesien.", "medium")]),
    );
    expect(result.divergences).toEqual([
      { kind: "confidence-differs", excerpt: "Ich kommen aus Tunesien.", first: "high", second: "medium" },
    ]);
    expect(result.needsHumanReview).toBe(true);
  });

  it("keeps a clean agreement free of a human-review flag", () => {
    const twin = review("r3", [issue("grammar", "Ich kommen aus Tunesien.", "Ich komme aus Tunesien.")]);
    const result = compareWritingReviews(review("r4", [issue("grammar", "Ich kommen aus Tunesien.", "Ich komme aus Tunesien.")]), twin);
    expect(result.divergenceCount).toBe(0);
    expect(result.needsHumanReview).toBe(false);
    expect(result.agreementCount).toBe(1);
  });

  it("flags two models honestly instead of hiding them behind one number", () => {
    const result = compareWritingReviews(first, review("r5", first.issues, "gemini-2.5-flash-lite"));
    expect(result.sameModel).toBe(false);
    expect(result.models).toEqual({ first: "gemini-2.5-flash", second: "gemini-2.5-flash-lite" });
  });

  it("refuses to compare a review with itself", () => {
    expect(() => compareWritingReviews(first, first)).toThrow(/نفسها/);
  });

  it("refuses to compare two different submissions", () => {
    expect(() => compareWritingReviews(first, { ...second, sourceSubmissionId: "sub-2" })).toThrow(/النسخة نفسها/);
  });

  it("refuses to compare reviews of two different texts", () => {
    expect(() => compareWritingReviews(first, { ...second, sourceTextSha256: "b".repeat(64) })).toThrow(/النص نفسه/);
  });

  it("re-checks every stored comparison and rejects a tampered one", () => {
    const result = compareWritingReviews(first, second);
    expect(assertReviewComparisonIntegrity(result)).toBe(result);
    expect(() => assertReviewComparisonIntegrity({ ...result, divergenceCount: 0 })).toThrow(/لا يطابق/);
    expect(() => assertReviewComparisonIntegrity({ ...result, needsHumanReview: false })).toThrow(/المراجعة البشرية/);
    expect(() => assertReviewComparisonIntegrity({ ...result, noMajorityVote: false } as unknown as typeof result)).toThrow(/حدود المقارنة/);
  });

  it("offers exactly two announced second-pass angles, both advisory", () => {
    expect(REVIEW_SECOND_ANGLES.map((entry) => entry.id)).toEqual(["coverage", "style"]);
    for (const entry of REVIEW_SECOND_ANGLES) {
      expect(entry.labelAr.length).toBeGreaterThan(3);
      expect(entry.instructionEn).toMatch(/do not|keep|focus|look/i);
    }
  });
});
