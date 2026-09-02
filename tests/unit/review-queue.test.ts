import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { buildDueReviewQueue, eligibleReviewCards, nextScheduledReviewDate } from "@/core/srs/review-queue";
import { calculateSM2, newReviewItem } from "@/core/srs/sm2";

const now = new Date("2026-08-30T12:00:00.000Z");
const lesson = academicLessons["a1-01"];

describe("evidence-scoped SRS review queue", () => {
  it("does not expose cards from lessons the learner has not completed", () => {
    expect(eligibleReviewCards(defaultState)).toEqual([]);
    expect(buildDueReviewQueue(defaultState, now)).toEqual([]);
  });

  it("adds exactly the deduplicated cards of a completed lesson", () => {
    const state = { ...defaultState, completedLessonIds: [lesson.id] };
    const expected = buildLessonSrsCards(lesson);
    const eligible = eligibleReviewCards(state);
    const due = buildDueReviewQueue(state, now);
    expect(eligible.map((card) => card.id)).toEqual(expected.map((card) => card.id));
    expect(due).toHaveLength(expected.length);
    expect(due.every((item) => item.card.tags.includes(lesson.id))).toBe(true);
  });

  it("removes graded future cards from today's queue and reports the next date", () => {
    const state = { ...defaultState, completedLessonIds: [lesson.id] };
    const card = buildLessonSrsCards(lesson)[0];
    const scheduled = calculateSM2(newReviewItem(card.id, now), 5, now);
    const withReview = { ...state, reviewItems: [scheduled] };
    expect(buildDueReviewQueue(withReview, now).some((item) => item.card.id === card.id)).toBe(false);
    expect(nextScheduledReviewDate(withReview, now)).toBe(scheduled.nextReviewDate);
  });
});
