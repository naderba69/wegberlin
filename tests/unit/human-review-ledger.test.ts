// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HUMAN_REVIEW_BOUNDARY,
  HUMAN_REVIEW_CHECKLIST,
  HUMAN_REVIEW_LESSON_TOTAL,
  HUMAN_REVIEW_MONTHLY_TARGET,
  HUMAN_REVIEW_POLICY,
  humanReviewLedger,
  summarizeHumanReviewLedger,
  summarizeP099ExclusionSlotsForHumanReview,
  validateHumanReviewEntry,
  type HumanReviewChecklistId,
  type HumanReviewEntry,
} from "@/data/human-review-ledger";

const structuralExclusionsCsv = readFileSync("reports/lexical-review-packet/structural-exclusions.csv", "utf8");
const exclusionDecisionIds = ["a1-21-umsteigen-in-frame-exclusion", "b1-15-liegen-vor-frame-exclusion", "b1-22-nachsteuern-bei-frame-exclusion", "b1-23-liegen-vor-frame-exclusion", "b2-01-reichen-aus-frame-exclusion", "b2-01-reichen-um-frame-exclusion", "b2-18-ziehen-in-frame-exclusion", "b2-18-kommen-in-frame-exclusion", "b2-24-bitten-zu-frame-exclusion", "b2-24-einreichen-zu-frame-exclusion", "b2-24-konnten-zu-frame-exclusion"];

function fullChecklist(value = true): Record<HumanReviewChecklistId, boolean> {
  return Object.fromEntries(HUMAN_REVIEW_CHECKLIST.map((item) => [item.id, value])) as Record<HumanReviewChecklistId, boolean>;
}

function entry(patch: Partial<HumanReviewEntry> = {}): HumanReviewEntry {
  return {
    policyVersion: HUMAN_REVIEW_POLICY,
    lessonId: "a1-01",
    reviewerLabel: "مراجع مستقل",
    reviewedAt: "2026-10-03",
    checklist: fullChecklist(),
    verdict: "accept",
    ...patch,
  };
}

describe("human review ledger", () => {
  it("ships ten checklist items and refuses an entry that skips any of them", () => {
    expect(HUMAN_REVIEW_CHECKLIST).toHaveLength(10);
    expect(new Set(HUMAN_REVIEW_CHECKLIST.map((item) => item.id)).size).toBe(10);
    expect(validateHumanReviewEntry(entry()).ok).toBe(true);
    const partial = { ...fullChecklist(), "audio-usable": undefined } as unknown as Record<HumanReviewChecklistId, boolean>;
    delete (partial as Record<string, unknown>)["audio-usable"];
    const result = validateHumanReviewEntry(entry({ checklist: partial }));
    expect(result.ok).toBe(false);
    expect(result.issuesAr.join(" ")).toContain("بنود لم تُفحص");
  });

  it("blocks anonymous reviews, self-review and a fixes verdict without a description", () => {
    expect(validateHumanReviewEntry(entry({ reviewerLabel: "   " })).issuesAr.join(" ")).toContain("لا اسم مراجع");
    expect(validateHumanReviewEntry(entry({ reviewerLabel: "سامي" }), "سامي").issuesAr.join(" ")).toContain("المراجع هو المتعلّم نفسه");
    expect(validateHumanReviewEntry(entry({ verdict: "accept-with-fixes" })).issuesAr.join(" ")).toContain("بلا وصف ما تغيّر");
    expect(validateHumanReviewEntry(entry({ reviewedAt: "2026/10/03" })).issuesAr.join(" ")).toContain("تاريخ المراجعة غير صالح");
    expect(validateHumanReviewEntry(entry({ lessonId: "a1-1" })).issuesAr.join(" ")).toContain("معرّف درس غير صالح");
    expect(validateHumanReviewEntry(entry({ verdict: "accept", checklist: { ...fullChecklist(), "no-copyright-risk": false } })).issuesAr.join(" ")).toContain("بنود غير محقّقة");
  });

  it("reports the honest zero and never rounds it up", () => {
    expect(humanReviewLedger).toHaveLength(0);
    const summary = summarizeHumanReviewLedger(humanReviewLedger, new Date("2026-10-04T00:00:00.000Z"));
    expect(summary.reviewedLessons).toBe(0);
    expect(summary.coveragePct).toBe(0);
    expect(summary.targetMetLastMonth).toBe(false);
    expect(summary.lessonTotal).toBe(HUMAN_REVIEW_LESSON_TOTAL);
    expect(summary.months).toEqual([]);
    expect(summary.boundary).toBe(HUMAN_REVIEW_BOUNDARY);
    expect(summary.boundaryAr).toContain("لا يستطيع التحقق من هوية المراجع");
  });

  it("counts distinct lessons per month and flags a month below the eight-lesson rhythm", () => {
    const entries = [
      entry({ lessonId: "a1-01", reviewedAt: "2026-09-02" }),
      entry({ lessonId: "a1-02", reviewedAt: "2026-09-11" }),
      entry({ lessonId: "a1-01", reviewedAt: "2026-09-20" }),
      entry({ lessonId: "a1-03", reviewedAt: "2026-10-01" }),
    ];
    const summary = summarizeHumanReviewLedger(entries, new Date("2026-10-04T00:00:00.000Z"));
    expect(summary.totalEntries).toBe(4);
    expect(summary.reviewedLessons).toBe(3);
    expect(summary.duplicateReviews).toEqual(["a1-01"]);
    const september = summary.months.find((row) => row.month === "2026-09");
    expect(september).toMatchObject({ reviewedLessons: 2, meetsTarget: false });
    expect(summary.lastMonthReviewed).toBe(1);
    expect(summary.monthlyTarget).toBe(HUMAN_REVIEW_MONTHLY_TARGET);
    const full = summarizeHumanReviewLedger(
      Array.from({ length: HUMAN_REVIEW_MONTHLY_TARGET }, (_unused, index) => entry({ lessonId: `a1-${String(index + 1).padStart(2, "0")}`, reviewedAt: "2026-10-02" })),
      new Date("2026-10-04T00:00:00.000Z"),
    );
    expect(full.targetMetLastMonth).toBe(true);
  });

  it("keeps an invalid entry out of the counters and names what is missing", () => {
    const summary = summarizeHumanReviewLedger([entry({ lessonId: "b1-05" }), entry({ lessonId: "b1-06", reviewerLabel: "" })], new Date("2026-10-04T00:00:00.000Z"));
    expect(summary.reviewedLessons).toBe(1);
    expect(summary.invalidEntries).toHaveLength(1);
    expect(summary.invalidEntries[0].lessonId).toBe("b1-06");
  });

  it("reports the eleven P0-99 exclusion slots as presence only and refuses to read them as review", () => {
    const summary = summarizeP099ExclusionSlotsForHumanReview(structuralExclusionsCsv, exclusionDecisionIds);
    expect(summary.exclusionCount).toBe(11);
    expect(summary.namedReferenceCount).toBe(0);
    expect(summary.missingReferenceCount).toBe(11);
    expect(summary.placeholderReferenceCount).toBe(0);
    expect(summary.signatureCellsFilled).toBe(0);
    expect(summary.signatureCellsExpected).toBe(55);
    expect(summary.readyForIndependentReviewCount).toBe(0);
    expect(summary.pendingDecisionIds).toEqual(exclusionDecisionIds);
    expect(summary.evidenceContentsInspected).toBe(false);
    expect(summary.reviewDecisionContentsInterpreted).toBe(false);
    expect(summary.p099ClosureAsserted).toBe(false);
    expect(summary.boundaryAr).toContain("لا يحكم على كفاية الدليل");
    expect(() => summarizeP099ExclusionSlotsForHumanReview(structuralExclusionsCsv, exclusionDecisionIds.slice(1)))
      .toThrow("requires exactly 11 authored exclusion IDs");
  });

  it("is recorded in a committed audit and reachable from the settings page", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.prebuild).toContain("human:review");
    expect(pkg.scripts["human:review"]).toBe("tsx scripts/audit-human-review.ts");
    const audit = JSON.parse(readFileSync("reports/human-review-audit.json", "utf8")) as { independentReviewStatus: string; reviewedLessons: number };
    expect(audit.reviewedLessons).toBe(0);
    expect(audit.independentReviewStatus).toBe("pending-zero-recorded-reviews");
    const settings = readFileSync("src/components/settings-view.tsx", "utf8");
    const panel = readFileSync("src/components/human-review-ledger-panel.tsx", "utf8");
    expect(settings).toContain("<HumanReviewLedgerPanel />");
    expect(panel).toContain("data-human-review-ledger={HUMAN_REVIEW_POLICY}");
    expect(panel).toContain("انسخ JSON");
  });
});
