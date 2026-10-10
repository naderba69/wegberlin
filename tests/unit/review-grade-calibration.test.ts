// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REVIEW_GRADE_BOUNDARY, REVIEW_GRADE_DESCRIPTORS, REVIEW_GRADE_POLICY, gradeDescriptor, selfRatingBias } from "@/core/srs/grade-descriptors";
import type { ReviewEvent } from "@/types/learning";

function event(grade: number, id: string): ReviewEvent {
  return {
    id,
    cardId: `c-${id}`,
    lessonId: "a1-01",
    grade,
    evidenceKind: "delayed",
    evidenceScope: "lesson-card",
    scheduledFor: "2026-09-01T00:00:00.000Z",
    reviewedAt: "2026-09-05T00:00:00.000Z",
    masteryDelta: 0,
    calendarPolicyVersion: "review-calendar-v1",
    calendarTimeZone: "UTC",
  };
}

describe("calibrated self-rating", () => {
  it("describes every usable grade by behaviour, not by a bare word", () => {
    for (const value of [1, 3, 4, 5] as const) {
      const descriptor = gradeDescriptor(value);
      expect(descriptor, String(value)).not.toBeNull();
      expect(descriptor!.labelAr.length).toBeGreaterThan(2);
      expect(descriptor!.behaviourAr.length).toBeGreaterThan(10);
      expect(descriptor!.exampleAr).toContain("مثال");
      expect(descriptor!.avoidAr.length).toBeGreaterThan(10);
    }
    expect(gradeDescriptor(2)).toBeNull();
    expect(Object.keys(REVIEW_GRADE_DESCRIPTORS)).toHaveLength(4);
    expect(REVIEW_GRADE_POLICY).toBe("calibrated-self-rating-v1");
    expect(REVIEW_GRADE_BOUNDARY).toContain("not-an-assessment-score");
  });

  it("flags a self-rating bias without touching scheduling", () => {
    const easy = selfRatingBias([event(5, "a"), event(5, "b"), event(5, "c"), event(4, "d")]);
    expect(easy.easySharePct).toBe(75);
    expect(easy.noteAr).toContain("بمزاج");
    const balanced = selfRatingBias([event(1, "a"), event(3, "b"), event(4, "c"), event(5, "d")]);
    expect(balanced.easySharePct).toBe(25);
    expect(balanced.noteAr).toContain("لا يُظهر انحيازًا");
    expect(selfRatingBias([]).noteAr).toContain("لا مراجعات مسجّلة");
  });

  it("shows the descriptors and the boundary on the review page", () => {
    const page = readFileSync("src/app/review/page.tsx", "utf8");
    expect(page).toContain("data-review-grade-policy={REVIEW_GRADE_POLICY}");
    expect(page).toContain('data-grade-descriptor="1"');
    expect(page).toContain("كيف تقدّر بسلوك لا بمزاج؟");
    expect(page).toContain("التقدير الذاتي يعاير الجدولة فقط؛ ليس نتيجة تقييم ولا دليل إتقان.");
  });
});
