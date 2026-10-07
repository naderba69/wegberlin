// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETENTION_GAP_POLICY, RETENTION_MIN_GAP_HOURS, retentionGapSummary } from "@/core/srs/retention-gaps";
import { defaultState } from "@/core/portability/db";
import { academicLessons } from "@/data/academic-lessons";
import type { LearningState, ReviewEvent } from "@/types/learning";

const lesson = Object.values(academicLessons)[0] as { id: string };

function event(id: string, cardId: string, reviewedAt: string, kind: "initial" | "delayed", grade = 5): ReviewEvent {
  return {
    id,
    cardId,
    lessonId: lesson.id,
    grade,
    evidenceKind: kind,
    evidenceScope: "lesson-card",
    scheduledFor: reviewedAt,
    reviewedAt,
    masteryDelta: 0,
    calendarPolicyVersion: "review-calendar-v1",
    calendarTimeZone: "UTC",
  };
}

function stateWith(events: ReviewEvent[]): LearningState {
  return { ...defaultState, completedLessonIds: [lesson.id], reviewEvents: events };
}

describe("spaced retention gap", () => {
  it("does not claim retention before a measured 72-hour gap", () => {
    const events = [
      event("e1", "c1", "2026-09-01T09:00:00.000Z", "initial"),
      event("e2", "c1", "2026-09-02T09:00:00.000Z", "delayed"),
      event("e3", "c2", "2026-09-01T09:00:00.000Z", "initial"),
      event("e4", "c2", "2026-09-02T10:00:00.000Z", "delayed"),
      event("e5", "c3", "2026-09-01T09:00:00.000Z", "initial"),
      event("e6", "c3", "2026-09-02T11:00:00.000Z", "delayed"),
      event("e7", "c4", "2026-09-01T09:00:00.000Z", "initial"),
      event("e8", "c4", "2026-09-02T12:00:00.000Z", "delayed"),
    ];
    const summary = retentionGapSummary(stateWith(events), lesson.id);
    expect(summary.delayedCards).toBe(4);
    expect(summary.meetsMinimumGap).toBe(false);
    expect(summary.status).toBe("unverified-gap");
    expect(summary.minimumGapHours).toBeLessThan(RETENTION_MIN_GAP_HOURS);
  });

  it("confirms retention when four cards succeeded after a measured gap of at least 72 hours", () => {
    const events = [
      event("e1", "c1", "2026-09-01T09:00:00.000Z", "initial"),
      event("e2", "c1", "2026-09-05T09:00:00.000Z", "delayed"),
      event("e3", "c2", "2026-09-01T09:00:00.000Z", "initial"),
      event("e4", "c2", "2026-09-05T10:00:00.000Z", "delayed"),
      event("e5", "c3", "2026-09-01T09:00:00.000Z", "initial"),
      event("e6", "c3", "2026-09-05T11:00:00.000Z", "delayed"),
      event("e7", "c4", "2026-09-01T09:00:00.000Z", "initial"),
      event("e8", "c4", "2026-09-05T12:00:00.000Z", "delayed"),
    ];
    const summary = retentionGapSummary(stateWith(events), lesson.id);
    expect(summary.status).toBe("spaced-confirmed");
    expect(summary.meetsMinimumGap).toBe(true);
    expect(summary.minimumGapHours).toBe(96);
    expect(summary.detailAr).toContain("مثبَّت باسترجاع مؤجَّل");
  });

  it("never counts a failed delayed attempt as retention evidence", () => {
    const events = [
      event("e1", "c1", "2026-09-01T09:00:00.000Z", "initial"),
      event("e2", "c1", "2026-09-05T09:00:00.000Z", "delayed", 2),
      event("e3", "c2", "2026-09-01T09:00:00.000Z", "initial"),
      event("e4", "c2", "2026-09-05T09:00:00.000Z", "delayed", 2),
      event("e5", "c3", "2026-09-01T09:00:00.000Z", "initial"),
      event("e6", "c3", "2026-09-05T09:00:00.000Z", "delayed", 2),
      event("e7", "c4", "2026-09-01T09:00:00.000Z", "initial"),
      event("e8", "c4", "2026-09-05T09:00:00.000Z", "delayed", 2),
    ];
    const summary = retentionGapSummary(stateWith(events), lesson.id);
    expect(summary.successfulDelayEvents).toBe(0);
    expect(summary.status).toBe("in-progress");
  });

  it("shows the standing gap policy on the lesson page", () => {
    const chip = readFileSync("src/components/lesson-retention-chip.tsx", "utf8");
    const runner = readFileSync("src/components/lesson-runner.tsx", "utf8");
    expect(chip).toContain("data-retention-gap={RETENTION_GAP_POLICY}");
    expect(chip).toContain("retentionGapSummary(state, lessonId)");
    expect(runner).toContain("<LessonRetentionChip lessonId={lesson.id} />");
    expect(RETENTION_GAP_POLICY).toBe("retention-gap-72h-v1");
    expect(RETENTION_MIN_GAP_HOURS).toBe(72);
  });
});
