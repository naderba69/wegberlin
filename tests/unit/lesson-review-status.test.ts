import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { humanReviewLedger, HUMAN_REVIEW_CHECKLIST, HUMAN_REVIEW_POLICY, type HumanReviewEntry } from "@/data/human-review-ledger";
import { lessonHumanReviewStatus } from "@/core/content-validation/lesson-review-status";

const allChecked = Object.fromEntries(HUMAN_REVIEW_CHECKLIST.map((item) => [item.id, true])) as HumanReviewEntry["checklist"];
const lessonId = academicLessonList[0].id;

function entry(overrides: Partial<HumanReviewEntry>): HumanReviewEntry {
  return {
    policyVersion: HUMAN_REVIEW_POLICY,
    lessonId,
    reviewerLabel: "مراجعة تجريبية",
    reviewedAt: "2026-10-10",
    checklist: allChecked,
    verdict: "accept",
    ...overrides,
  };
}

describe("lesson human-review status", () => {
  it("reports every lesson as pending while the ledger is empty", () => {
    expect(humanReviewLedger).toHaveLength(0);
    for (const lesson of academicLessonList) {
      expect(lessonHumanReviewStatus(lesson.id).status).toBe("pending");
    }
  });

  it("marks a lesson reviewed only with a valid accepting entry", () => {
    const status = lessonHumanReviewStatus(lessonId, [entry({})]);
    expect(status).toEqual({ status: "reviewed", reviewedAt: "2026-10-10", reviewerLabel: "مراجعة تجريبية" });
  });

  it("keeps a lesson pending when the entry is incomplete", () => {
    const incomplete = entry({ checklist: { ...allChecked, "german-correct": false } });
    expect(lessonHumanReviewStatus(lessonId, [incomplete]).status).toBe("pending");
  });

  it("keeps a lesson pending when the latest review blocks it", () => {
    const blocked = entry({ verdict: "block", fixesAr: ["تصحيح الجواب"] });
    const status = lessonHumanReviewStatus(lessonId, [blocked]);
    expect(status.status).toBe("pending");
    expect(status.status === "pending" && status.reasonAr).toContain("أوقفت");
  });

  it("ignores entries for other lessons", () => {
    expect(lessonHumanReviewStatus(lessonId, [entry({ lessonId: "other-lesson" })]).status).toBe("pending");
  });
});
