import { describe, expect, it } from "vitest";
import {
  buildDiagnosticProductiveSample,
  buildProductiveSampleComparison,
  isProductiveSampleFollowUpAvailable,
  PRODUCTIVE_SAMPLE_COMPARISON_BOUNDARY,
  PRODUCTIVE_SAMPLE_COMPARISON_POLICY,
  PRODUCTIVE_SAMPLE_FOLLOW_UP_DAYS,
  productiveSampleComparisonFor,
  recordProductiveSampleFollowUp,
  mergeProductiveSampleComparisons,
} from "@/core/diagnostic/productive-sample";
import { learningStateSchema } from "@/core/portability/schema";
import { defaultState } from "@/core/portability/db";
import { mergeLearningStates } from "@/core/portability/merge";

describe("P1-19 four-week productive-sample comparison", () => {
  const baseline = buildDiagnosticProductiveSample({
    writingText: "Ich heiße Sara. Ich lerne Deutsch.",
    selfAssessment: "with-help",
    submittedAt: "2026-09-01T09:00:00.000Z",
  });
  const dueAt = "2026-09-29T09:00:00.000Z";

  it("accepts an absolute-beginner not-yet baseline without any writing or recording", () => {
    const beginnerBaseline = buildDiagnosticProductiveSample({ writingText: "", selfAssessment: "not-yet", submittedAt: "2026-09-01T09:00:00.000Z" });
    expect(beginnerBaseline).toMatchObject({ mode:"not-yet", writingWordCount:0, selfAssessment:"not-yet" });
    expect(beginnerBaseline).not.toHaveProperty("writingText");
    expect(beginnerBaseline).not.toHaveProperty("speakingMediaId");
    expect(learningStateSchema.safeParse({ ...defaultState, productiveSampleComparison: buildProductiveSampleComparison(beginnerBaseline) }).success).toBe(true);
  });

  it("keeps the original self-evidence and opens exactly 28 days after it", () => {
    const comparison = buildProductiveSampleComparison(baseline);
    expect(comparison).toMatchObject({
      policyVersion: PRODUCTIVE_SAMPLE_COMPARISON_POLICY,
      baseline,
      followUpDueAt: dueAt,
      evidenceBoundary: PRODUCTIVE_SAMPLE_COMPARISON_BOUNDARY,
    });
    expect(PRODUCTIVE_SAMPLE_FOLLOW_UP_DAYS).toBe(28);
    expect(isProductiveSampleFollowUpAvailable(comparison, "2026-09-29T08:59:59.999Z")).toBe(false);
    expect(isProductiveSampleFollowUpAvailable(comparison, dueAt)).toBe(true);
    expect(isProductiveSampleFollowUpAvailable({ ...comparison, followUp: baseline }, "2026-10-01T00:00:00Z")).toBe(false);
    expect(comparison.baseline).not.toHaveProperty("score");
    expect(comparison.baseline).not.toHaveProperty("estimatedLevel");
  });

  it("accepts the same prompt after four weeks without requiring a better or different answer", () => {
    const comparison = buildProductiveSampleComparison(baseline);
    const sameAnswer = buildDiagnosticProductiveSample({
      writingText: baseline.writingText!,
      selfAssessment: "with-help",
      submittedAt: dueAt,
    });
    expect(recordProductiveSampleFollowUp(comparison, sameAnswer)).toMatchObject({
      baseline,
      followUp: sameAnswer,
      followUpDueAt: dueAt,
    });
    expect(() => recordProductiveSampleFollowUp(comparison, buildDiagnosticProductiveSample({
      writingText: "Ich lerne Deutsch.", selfAssessment: "independent", submittedAt: "2026-09-29T08:59:59.999Z",
    }))).toThrow(/أربعة أسابيع كاملة/);
  });

  it("rejects a duplicate follow-up and merges backups without replacing the earliest baseline", () => {
    const comparison = buildProductiveSampleComparison(baseline);
    const followUp = buildDiagnosticProductiveSample({
      writingText: "Ich heiße Sara. Jetzt übe ich regelmäßig Deutsch.",
      selfAssessment: "independent",
      submittedAt: "2026-10-01T09:00:00.000Z",
    });
    const completed = recordProductiveSampleFollowUp(comparison, followUp);
    expect(() => recordProductiveSampleFollowUp(completed, followUp)).toThrow(/مسبقًا/);

    const laterBaseline = buildDiagnosticProductiveSample({
      writingText: "Ich lerne Deutsch.", selfAssessment: "independent", submittedAt: "2026-09-10T09:00:00.000Z",
    });
    const merged = mergeProductiveSampleComparisons(comparison, buildProductiveSampleComparison(laterBaseline));
    expect(merged).toMatchObject({ baseline, followUpDueAt: dueAt });
    expect(mergeProductiveSampleComparisons(merged, completed)).toMatchObject({ baseline, followUp });
  });

  it("preserves a completed comparison when a newer diagnostic result is merged", () => {
    const comparison = buildProductiveSampleComparison(baseline);
    const followUp = buildDiagnosticProductiveSample({
      writingText: "Ich heiße Sara. Jetzt spreche ich täglich Deutsch.", selfAssessment: "independent", submittedAt: "2026-10-01T09:00:00.000Z",
    });
    const completedComparison = recordProductiveSampleFollowUp(comparison, followUp);
    const current = {
      ...defaultState,
      updatedAt: "2026-10-02T00:00:00.000Z",
      diagnosticResult: { estimatedLevel: "A1" as const, score: 3, maxScore: 4, levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 }, productiveSample: baseline, completedAt: baseline.submittedAt },
      productiveSampleComparison: completedComparison,
    };
    const newerSample = buildDiagnosticProductiveSample({ writingText: "Ich lerne Deutsch.", selfAssessment: "independent", submittedAt: "2026-10-03T09:00:00.000Z" });
    const incoming = {
      ...defaultState,
      updatedAt: "2026-10-04T00:00:00.000Z",
      diagnosticResult: { estimatedLevel: "A2" as const, score: 4, maxScore: 4, levelScores: { A1: 4, A2: 0, B1: 0, B2: 0 }, productiveSample: newerSample, completedAt: newerSample.submittedAt },
    };
    const merged = mergeLearningStates(current, incoming);
    expect(merged.diagnosticResult).toMatchObject({ estimatedLevel: "A2" });
    expect(merged.productiveSampleComparison).toMatchObject({ baseline, followUp });
  });

  it("uses an older diagnostic sample as the baseline instead of inventing an intake date", () => {
    expect(productiveSampleComparisonFor({ productiveSample: baseline })).toMatchObject({ baseline, followUpDueAt: dueAt });
    expect(productiveSampleComparisonFor(null)).toBeNull();
  });

  it("validates the timeline in portable schema-v3 data", () => {
    const comparison = buildProductiveSampleComparison(baseline);
    const state = {
      ...defaultState,
      diagnosticResult: {
        estimatedLevel: "A1" as const,
        score: 3,
        maxScore: 4,
        levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 },
        productiveSample: baseline,
        completedAt: baseline.submittedAt,
      },
      productiveSampleComparison: comparison,
    };
    expect(learningStateSchema.safeParse(state).success).toBe(true);
    expect(learningStateSchema.safeParse({
      ...state,
      productiveSampleComparison: { ...comparison, followUpDueAt: "2026-09-28T09:00:00.000Z" },
    }).success).toBe(false);
    const early = buildDiagnosticProductiveSample({ writingText: "Ich lerne Deutsch.", selfAssessment: "independent", submittedAt: "2026-09-29T08:00:00.000Z" });
    expect(learningStateSchema.safeParse({
      ...state,
      productiveSampleComparison: { ...comparison, followUp: early },
    }).success).toBe(false);
  });
});
