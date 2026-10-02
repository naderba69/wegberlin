import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { applyReviewGrade } from "@/core/srs/review-session";
import { calculateSM2, calendarPartsAt, newReviewItem, scheduledReviewDate } from "@/core/srs/sm2";

function expectLocal(date: Date, timeZone: string, year: number, month: number, day: number, hour = 0) {
  expect(calendarPartsAt(date, timeZone)).toMatchObject({ year, month, day, hour, minute: 0, second: 0 });
}

describe("P0 timezone and DST review calendar", () => {
  it("preserves the existing UTC calendar-day boundary by default", () => {
    const result = calculateSM2(newReviewItem("utc"), 4, new Date("2026-08-26T18:00:00Z"));
    expect(result.nextReviewDate).toBe("2026-08-27T00:00:00.000Z");
    expect(result).toMatchObject({ algorithmVersion: "sm2-v2-calendar", calendarPolicyVersion: "review-calendar-v1", calendarTimeZone: "UTC", reviewHourLocal: 0 });
  });

  it("schedules the next local calendar day across four IANA zones and DST seasons", () => {
    const matrix = [
      { zone: "Africa/Tunis", now: "2026-03-28T23:30:00Z", expected: [2026, 3, 30] },
      { zone: "Europe/Berlin", now: "2026-03-28T12:00:00Z", expected: [2026, 3, 29] },
      { zone: "America/New_York", now: "2026-03-07T12:00:00Z", expected: [2026, 3, 8] },
      { zone: "Australia/Sydney", now: "2026-10-03T12:00:00Z", expected: [2026, 10, 4] },
    ] as const;
    for (const item of matrix) {
      const due = scheduledReviewDate(new Date(item.now), 1, { timeZone: item.zone });
      expectLocal(due, item.zone, item.expected[0], item.expected[1], item.expected[2]);
    }
  });

  it("keeps local midnight stable when a six-day interval crosses a DST change", () => {
    const base = { ...newReviewItem("berlin"), repetitions: 1, interval: 1 };
    const result = calculateSM2(base, 4, new Date("2026-03-27T12:00:00Z"), { timeZone: "Europe/Berlin" });
    expect(result.interval).toBe(6);
    expectLocal(new Date(result.nextReviewDate), "Europe/Berlin", 2026, 4, 2);
    expect(result.nextReviewDate).toBe("2026-04-01T22:00:00.000Z");
  });

  it("records the calendar policy with the auditable review event", () => {
    const lesson = academicLessons["a1-01"];
    const card = buildLessonSrsCards(lesson)[0];
    const now = new Date("2026-09-03T12:00:00Z");
    const outcome = applyReviewGrade(
      { ...defaultState, completedLessonIds: [lesson.id] },
      { card, review: undefined, dueAt: now.toISOString(), isNew: true },
      4,
      now,
      "timezone-event",
      { timeZone: "Africa/Tunis" },
    );
    expect(outcome.event).toMatchObject({ id: "timezone-event", calendarPolicyVersion: "review-calendar-v1", calendarTimeZone: "Africa/Tunis" });
    expect(outcome.nextReview).toMatchObject({ calendarPolicyVersion: "review-calendar-v1", calendarTimeZone: "Africa/Tunis" });
    expectLocal(new Date(outcome.nextReview.nextReviewDate), "Africa/Tunis", 2026, 9, 4);
  });

  it("fails closed for invalid calendar policy inputs", () => {
    expect(() => scheduledReviewDate(new Date(), 1, { timeZone: "Not/A_Zone" })).toThrow("invalid IANA timezone");
    expect(() => scheduledReviewDate(new Date(), 1, { timeZone: "UTC", reviewHourLocal: 24 })).toThrow("reviewHourLocal");
    expect(() => scheduledReviewDate(new Date(), 0, { timeZone: "UTC" })).toThrow("intervalDays");
  });
});
