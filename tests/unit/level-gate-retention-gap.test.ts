// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEVEL_GATE_POLICY, buildLevelEvidenceGate } from "@/core/assessment/level-evidence";
import { RETENTION_GAP_POLICY, RETENTION_MIN_GAP_HOURS } from "@/core/srs/retention-gaps";
import { defaultState } from "@/core/portability/db";
import { academicLessonList } from "@/data/academic-lessons";
import type { LearningState, ReviewEvent } from "@/types/learning";

/**
 * P0-2 مكتمل: قاعدة الـ72 ساعة لم تبقَ في واجهة الدرس وحدها — صارت شرطًا في بوابة المستوى
 * وفي مفاتيح الإتقان. الاختبار يثبت الحالتين: أربع بطاقات ناجحة بفواصل قصيرة **لا** تفتح
 * البوابة، وبفاصل ≥ 72 ساعة تفتحها.
 */

const levelA1Lessons = academicLessonList.filter((lesson) => lesson.level === "A1");
const lessonIds = levelA1Lessons.slice(0, 3).map((lesson) => lesson.id);

function reviewEvent(lessonId: string, cardId: string, reviewedAt: string, kind: "initial" | "delayed", grade = 5): ReviewEvent {
  return {
    id: `${lessonId}:${cardId}:${reviewedAt}`,
    cardId,
    lessonId,
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

/** ثلاثة دروس A1 بأربع بطاقات كل واحد، بفاصل زمني محدَّد بالساعات. */
function stateWithGap(gapHours: number): LearningState {
  const events: ReviewEvent[] = [];
  lessonIds.forEach((lessonId, lessonIndex) => {
    for (let card = 1; card <= 4; card += 1) {
      const start = new Date(Date.UTC(2026, 6, 1 + lessonIndex, 8, 0, 0));
      const end = new Date(start.getTime() + gapHours * 3600 * 1000);
      events.push(reviewEvent(lessonId, `${lessonId}-c${card}`, start.toISOString(), "initial", 4));
      events.push(reviewEvent(lessonId, `${lessonId}-c${card}`, end.toISOString(), "delayed", 5));
    }
  });
  return { ...defaultState, completedLessonIds: lessonIds, reviewEvents: events };
}

describe("level gate requires a measured 72-hour retention gap (P0-2)", () => {
  it("counts only lessons whose delayed success was measured across at least 72 hours", () => {
    const short = buildLevelEvidenceGate(stateWithGap(20), "A1", new Date("2026-08-01T00:00:00.000Z"));
    expect(short.spacedLessons).toBe(0);
    expect(short.unverifiedGapLessons).toBe(3);
    expect(short.criteria.retention).toBe(false);
    expect(short.retentionMinGapHours).toBe(RETENTION_MIN_GAP_HOURS);
    expect(short.retentionGapPolicyVersion).toBe(RETENTION_GAP_POLICY);
    expect(short.boundaryAr).toContain(String(RETENTION_MIN_GAP_HOURS));

    const spaced = buildLevelEvidenceGate(stateWithGap(96), "A1", new Date("2026-08-01T00:00:00.000Z"));
    expect(spaced.spacedLessons).toBe(3);
    expect(spaced.unverifiedGapLessons).toBe(0);
    expect(spaced.criteria.retention).toBe(true);
  });

  it("still accepts two independent knowledge forms three days apart as the alternative", () => {
    const state = stateWithGap(20);
    const otherForm = state.exerciseAttempts;
    expect(otherForm.length).toBe(0);
    const gate = buildLevelEvidenceGate(state, "A1", new Date("2026-08-01T00:00:00.000Z"));
    expect(gate.criteria.retention).toBe(false);
    expect(gate.retentionGapPolicyVersion).toBe(RETENTION_GAP_POLICY);
  });

  it("keeps the policy version, the gate attribute and the mastery write in step", () => {
    expect(LEVEL_GATE_POLICY).toBe("independent-level-transition-v3");
    const page = readFileSync("src/components/level-assessment.tsx", "utf8");
    expect(page).toContain("data-level-assessment-policy={LEVEL_GATE_POLICY}");
    expect(page).toContain("[`level-${level.toLowerCase()}-retention-verified`]: evaluated.criteria.retention ? 100 : 0");
    expect(page).toContain("احتفاظ مثبَّت بفاصل مقيس");
    const e2e = readFileSync("tests/e2e/learning-integrity.spec.ts", "utf8");
    expect(e2e).toContain("data-level-assessment-policy=");
  });
});
