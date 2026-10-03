import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { applyReviewGrade } from "@/core/srs/review-session";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { confirmedErrorSrsCards } from "@/core/srs/error-cards";
import { buildDueReviewQueue, eligibleReviewCards } from "@/core/srs/review-queue";
import { dailyReviewQuota } from "@/core/review/daily-quota";
import {
  REMEDIATION_TAG,
  REVIEW_SESSION_DOSE_BOUNDARY,
  REVIEW_SESSION_DOSE_POLICY,
  isRemediationCard,
  reviewHourFromLocalClock,
  reviewSessionDose,
} from "@/core/review/session-dose";
import type { QueuedReviewCard } from "@/core/srs/review-queue";
import type { ErrorRecord, ReviewEvent } from "@/types/learning";

/** بطاقة طابور بلا سجل SRS: تبقى مرئية كل الجلسة بدل أن تغادر فور النظر فيها. */
function synthetic(id: string, front: string, tags: string[]): QueuedReviewCard {
  return { card: { id, front, back: `خلف ${id}`, hint: "تلميح", tags }, review: undefined, isNew: true, dueAt: "2026-08-30" };
}

function remediationCard(id: string): QueuedReviewCard {
  return synthetic(id, `Korrigieren Sie: ${id}`, ["A1", "a1-01", REMEDIATION_TAG, "vocabulary"]);
}

function lessonCards(count: number): QueuedReviewCard[] {
  return buildLessonSrsCards(academicLessons["a1-01"])
    .slice(0, count)
    .map((card) => ({ card, review: undefined, isNew: true, dueAt: "2026-08-30" }));
}

function queueWith(scheduled: number, remediation: number): QueuedReviewCard[] {
  return [...lessonCards(scheduled), ...Array.from({ length: remediation }, (_, index) => remediationCard(`rem-${index + 1}`))];
}

const hourIn = (iso: string, timeZone: string) => Number(new Intl.DateTimeFormat("en-GB", {
  timeZone,
  hour: "2-digit",
  hour12: false,
}).formatToParts(new Date(iso)).find((part) => part.type === "hour")?.value);

describe("review session dose (م21)", () => {
  it("pins the policy version and states its limit in the learner's language", () => {
    expect(REVIEW_SESSION_DOSE_POLICY).toBe("review-session-dose-v1");
    expect(REVIEW_SESSION_DOSE_BOUNDARY).toContain("السقف على بطاقة العلاج");
    expect(REVIEW_SESSION_DOSE_BOUNDARY).toContain("لا هدف سرعة");
    expect(reviewSessionDose({ queue: queueWith(2, 4), quotaRequired: 3 }).boundary).toBe(REVIEW_SESSION_DOSE_BOUNDARY);
  });

  it("recognises a remediation card by its tag alone, including a real confirmed error", () => {
    expect(isRemediationCard({ tags: [REMEDIATION_TAG, "a1-01", "vocabulary"] })).toBe(true);
    expect(isRemediationCard({ tags: ["a1-01", "vocabulary"] })).toBe(false);
    expect(isRemediationCard({})).toBe(false);

    const error: ErrorRecord = {
      id: "error-1",
      type: "word-order",
      wrong: "Ich gehe in die Schule am Montag",
      correct: "Am Montag gehe ich in die Schule",
      explanationAr: "ظرف الزمان يسبق الفعل في الجملة الألمانية.",
      occurrences: 3,
      lastSeenAt: "2026-08-29",
      sourceLessonId: "a1-01",
      resolved: true,
      confirmedAt: "2026-08-29",
    };
    const [card] = confirmedErrorSrsCards([error]);
    expect(card).toBeDefined();
    expect(isRemediationCard(card)).toBe(true);
  });

  it("caps the remediation share at half of the daily quota without dropping scheduled cards", () => {
    const dose = reviewSessionDose({ queue: queueWith(10, 6), quotaRequired: 5 });

    expect(dose.scheduledCount).toBe(10);
    expect(dose.remediationCount).toBe(6);
    expect(dose.remediationCap).toBe(3);
    expect(dose.remediationShown).toBe(3);
    expect(dose.hiddenRemediationCount).toBe(3);
    expect(dose.capped).toBe(true);
    expect(dose.visible).toHaveLength(13);
    // القياس على كامل الطابور: لا بطاقة مجدولة تُخفى وراء السقف.
    expect(dose.visible.filter((item) => !isRemediationCard(item.card))).toHaveLength(10);
  });

  it("always leaves at least one remediation card and never caps an empty tail", () => {
    expect(reviewSessionDose({ queue: queueWith(2, 4), quotaRequired: 1 }).remediationCap).toBe(1);
    expect(reviewSessionDose({ queue: queueWith(2, 4), quotaRequired: 0 }).remediationCap).toBe(1);
    expect(reviewSessionDose({ queue: queueWith(4, 0), quotaRequired: 3 }).remediationCap).toBe(0);
    expect(reviewSessionDose({ queue: queueWith(4, 0), quotaRequired: 3 }).capped).toBe(false);
  });

  it("keeps the order of the queue instead of promoting a card from the tail", () => {
    const cards = lessonCards(3);
    const queue: QueuedReviewCard[] = [remediationCard("rem-a"), cards[0], cards[1], remediationCard("rem-b"), remediationCard("rem-c")];
    const dose = reviewSessionDose({ queue, quotaRequired: 3 });

    expect(dose.visible.map((item) => item.card.id)).toEqual(["rem-a", cards[0].card.id, cards[1].card.id, "rem-b"]);
    expect(dose.hiddenRemediationCount).toBe(1);
  });

  it("lifts the cap for this sitting only, on the learner's explicit request", () => {
    const queue = queueWith(2, 5);
    const capped = reviewSessionDose({ queue, quotaRequired: 3 });
    const extended = reviewSessionDose({ queue, quotaRequired: 3, extended: true });

    expect(capped.hiddenRemediationCount).toBe(3);
    // السقف السياسي يبقى كما هو؛ الرفع قرار للمتعلَّم تُظهره rest of the sitting.
    expect(extended.remediationCap).toBe(2);
    expect(extended.remediationShown).toBe(5);
    expect(extended.visible).toHaveLength(queue.length);
    expect(extended.hiddenRemediationCount).toBe(0);
    expect(extended.capped).toBe(false);
    expect(extended.extended).toBe(true);
  });

  it("bounds a whole sitting at the cap: graded remediation cards do not summon fresh ones", () => {
    const queue = queueWith(2, 5);
    const atStart = reviewSessionDose({ queue, quotaRequired: 3 });
    expect(atStart.remediationCap).toBe(2);
    expect(atStart.remediationShown).toBe(2);

    // بطاقة واحدة نوقشت فغادرت الطابور: يبقى لها بديل واحد فقط، لا بطاقة ثالثة.
    const afterOne = reviewSessionDose({ queue: queue.slice(3), quotaRequired: 3, remediationDone: 1 });
    expect(afterOne.visible.map((item) => item.card.id)).toEqual(["rem-2"]);

    // بعد بلوغ السقف لا تُستدعى بطاقة علاج جديدة، ولا يُنكر أن الباقي مستحق.
    const afterCap = reviewSessionDose({ queue: queue.slice(4), quotaRequired: 3, remediationDone: 2 });
    expect(afterCap.visible.some((item) => isRemediationCard(item.card))).toBe(false);
    expect(afterCap.hiddenRemediationCount).toBe(3);
    expect(afterCap.capped).toBe(true);
  });

  it("leaves the daily quota arithmetic untouched: remediation stays outside the required count", () => {
    const now = new Date("2026-08-30T12:00:00.000Z");
    const reviewedAt = new Date(now.getTime() - 3_600_000).toISOString();
    const event = (id: string, scope: ReviewEvent["evidenceScope"]): ReviewEvent => ({
      id,
      cardId: `card-${id}`,
      lessonId: "a1-01",
      grade: 4,
      evidenceKind: "initial",
      evidenceScope: scope,
      scheduledFor: "2026-08-30",
      reviewedAt,
      masteryDelta: 0,
      calendarPolicyVersion: "review-calendar-v1",
      calendarTimeZone: "UTC",
    });
    const state = { ...defaultState, reviewEvents: [event("a", "lesson-card"), event("b", "personal-error-remediation")] };
    const quota = dailyReviewQuota(state, now);
    const dose = reviewSessionDose({ queue: queueWith(2, 6), quotaRequired: quota.required });

    expect([3, 4, 5, 6, 10, 12]).toContain(quota.required);
    expect(quota.reviewed).toBe(1);
    expect(dose.remediationCap).toBe(Math.ceil(quota.required / 2));
  });

  it("does not truncate the queue the coach and the report read", () => {
    const state = { ...defaultState, completedLessonIds: ["a1-01"] };
    const scheduled = buildDueReviewQueue(state, new Date("2026-08-30T12:00:00.000Z"));
    const queue = [...scheduled, ...[1, 2, 3, 4, 5, 6, 7].map((index) => remediationCard(`rem-${index}`))];
    const dose = reviewSessionDose({ queue, quotaRequired: 3 });

    expect(scheduled.length).toBeGreaterThan(0);
    expect(dose.scheduledCount).toBe(scheduled.length);
    expect(eligibleReviewCards(state)).toHaveLength(scheduled.length);
    expect(queue.filter((item) => isRemediationCard(item.card))).toHaveLength(7);
    expect(queue.length - dose.hiddenRemediationCount).toBe(dose.visible.length);
    // كل بطاقة مجدولة المستحقة تُرى كما هي، بلا إعادة ترتيب ولا حذف.
    expect(dose.visible.filter((item) => !isRemediationCard(item.card)).map((item) => item.card.id))
      .toEqual(scheduled.map((item) => item.card.id));
  });

  it("anchors the next review on the learner's review hour, not on midnight UTC", () => {
    const now = new Date("2026-08-30T09:00:00.000Z");
    const card = buildLessonSrsCards(academicLessons["a1-01"])[0];
    const queued: QueuedReviewCard = { card, review: undefined, isNew: false, dueAt: "2026-08-30" };
    const state = { ...defaultState, completedLessonIds: ["a1-01"], reviewEvents: [], reviewItems: [] };

    const midnight = applyReviewGrade(state, queued, 5, now);
    const evening = applyReviewGrade(state, queued, 5, now, { timeZone: "Europe/Berlin", reviewHourLocal: 18 });

    expect(hourIn(midnight.nextReview.nextReviewDate, "UTC")).toBe(0);
    expect(hourIn(evening.nextReview.nextReviewDate, "Europe/Berlin")).toBe(18);
    expect(hourIn(evening.nextReview.nextReviewDate, "UTC")).not.toBe(0);
    expect(evening.nextReview.calendarTimeZone).toBe("Europe/Berlin");
    expect(evening.nextReview.reviewHourLocal).toBe(18);
    expect(Date.parse(evening.nextReview.nextReviewDate)).toBeGreaterThan(now.getTime());
  });

  it("reads the review hour from the reminder's local clock string", () => {
    expect(reviewHourFromLocalClock("18:00")).toBe(18);
    expect(reviewHourFromLocalClock("07:05")).toBe(7);
    expect(reviewHourFromLocalClock("7:05")).toBe(7);
    expect(reviewHourFromLocalClock("23:59")).toBe(23);
    expect(reviewHourFromLocalClock("24:00")).toBe(0);
    expect(reviewHourFromLocalClock(undefined)).toBe(0);
    expect(reviewHourFromLocalClock("")).toBe(0);
    expect(reviewHourFromLocalClock("18.00")).toBe(0);
  });
});
