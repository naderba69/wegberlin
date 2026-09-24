import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { applyReviewGrade, lessonRetentionStatus, retentionEvidence } from "@/core/srs/review-session";
import { newReviewItem } from "@/core/srs/sm2";

const lesson = academicLessons["a1-01"];
const cards = buildLessonSrsCards(lesson);
const now = new Date("2026-09-01T12:00:00.000Z");

function queued(cardIndex: number, isNew: boolean, dueAt = "2026-09-01T00:00:00.000Z") {
  const card = cards[cardIndex];
  return { card, review: isNew ? undefined : newReviewItem(card.id, new Date(dueAt)), dueAt, isNew };
}

describe("delayed retention evidence", () => {
  it("records a first reveal but gives it zero mastery weight", () => {
    const state = { ...defaultState, completedLessonIds: [lesson.id], mastery: { [lesson.id]: 65 } };
    const result = applyReviewGrade(state, queued(0, true), 5, now, "event-initial");
    expect(result.event).toMatchObject({ evidenceKind: "initial", masteryDelta: 0, lessonId: lesson.id });
    expect(result.state.mastery[lesson.id]).toBe(65);
    expect(result.state.reviewEvents).toHaveLength(1);
  });

  it("raises mastery only after a due delayed retrieval succeeds", () => {
    const state = { ...defaultState, completedLessonIds: [lesson.id], mastery: { [lesson.id]: 65 } };
    const result = applyReviewGrade(state, queued(0, false), 4, now, "event-delayed");
    expect(result.event).toMatchObject({ evidenceKind: "delayed", masteryDelta: 4 });
    expect(result.state.mastery[lesson.id]).toBe(69);
  });

  it("uses the latest delayed result per card so a later failure removes confirmation", () => {
    const base = { id:"e1",cardId:cards[0].id,lessonId:lesson.id,grade:5,evidenceKind:"delayed" as const,scheduledFor:"2026-08-31T00:00:00Z",reviewedAt:"2026-09-01T09:00:00Z",masteryDelta:4 };
    const state = { ...defaultState, reviewEvents: [base, { ...base, id:"e2",grade:1,reviewedAt:"2026-09-01T10:00:00Z",masteryDelta:0 }] };
    expect(retentionEvidence(state).successfulDelayedCards).toBe(0);
  });

  it("requires four distinct delayed-success cards before reporting a lesson sample", () => {
    const reviewEvents = cards.slice(0, 4).map((card, index) => ({ id:`e${index}`,cardId:card.id,lessonId:lesson.id,grade:4,evidenceKind:"delayed" as const,scheduledFor:"2026-08-31T00:00:00Z",reviewedAt:`2026-09-01T10:0${index}:00Z`,masteryDelta:4 }));
    const state = { ...defaultState, completedLessonIds: [lesson.id], reviewEvents };
    expect(retentionEvidence(state).confirmedLessonIds).toEqual([lesson.id]);
    expect(lessonRetentionStatus(state, lesson.id)).toMatchObject({ status: "delayed-confirmed", delayedCards: 4, required: 4 });
  });
});
