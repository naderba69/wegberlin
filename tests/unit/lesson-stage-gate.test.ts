import { describe, expect, it } from "vitest";
import { academicLessonList, academicLessons } from "@/data/academic-lessons";
import { LESSON_STAGE_KEYS } from "@/types/lesson-content";
import { lessonStageGate, stageActivityRequirement } from "@/core/lesson/stage-gating";
import type { ExerciseAttempt } from "@/types/learning";

const lesson = academicLessons["a1-01"];

function attempt(exerciseId: string): ExerciseAttempt {
  return { id: `attempt-${exerciseId}`, lessonId: lesson.id, exerciseId, answer: "x", correct: true, createdAt: "2026-10-02T08:00:00.000Z" } as ExerciseAttempt;
}

describe("lesson stage work gate", () => {
  it("leaves explanatory stages open and closes only stages that ask for work", () => {
    for (const stage of ["objectives", "entry", "vocabulary", "discover", "rule", "pronunciation", "errors"] as const) {
      expect(stageActivityRequirement(lesson, stage)).toBeNull();
    }
    for (const stage of ["controlled", "reading", "listening", "test"] as const) {
      expect(stageActivityRequirement(lesson, stage)?.ids.length).toBeGreaterThan(0);
    }
  });

  it("blocks the forward button on a practice stage until one attempt is recorded", () => {
    const controlledIndex = LESSON_STAGE_KEYS.indexOf("controlled");
    const readingIndex = LESSON_STAGE_KEYS.indexOf("reading");
    expect(lessonStageGate(lesson, [], controlledIndex).advanceBlocked).toBe(true);
    expect(lessonStageGate(lesson, [], controlledIndex).reasonAr).toContain("تمرينًا موجّهًا");
    const afterAttempt = lessonStageGate(lesson, [attempt(lesson.exercises[0].id)], controlledIndex);
    expect(afterAttempt.advanceBlocked).toBe(false);
    expect(afterAttempt.reasonAr).toBe("");
    // The next stage keeps its own requirement: passing one stage never unlocks the whole lesson.
    expect(lessonStageGate(lesson, [attempt(lesson.exercises[0].id)], readingIndex).advanceBlocked).toBe(true);
  });

  it("keeps the mini-test behind the three training stages and never rewrites completion", () => {
    const testIndex = LESSON_STAGE_KEYS.indexOf("test");
    const attempts = [attempt(lesson.exercises[0].id), attempt(lesson.reading.questions[0].id)];
    const gate = lessonStageGate(lesson, attempts, testIndex - 1);
    expect(gate.missingTrainingAr).toEqual(["الاستماع"]);
    expect(gate.reachLimit).toBe(testIndex - 1);
    const ready = lessonStageGate(lesson, [...attempts, attempt(lesson.listening.questions[0].id)], testIndex - 1);
    expect(ready.reachLimit).toBe(LESSON_STAGE_KEYS.length - 1);
    expect(ready.missingTrainingAr).toEqual([]);
    expect(ready.boundary).toBe("stage-navigation-gate-only-no-mastery-no-completion-change");
  });

  it("locks only what lies beyond the assessment and never freezes the learner in place", () => {
    const testIndex = LESSON_STAGE_KEYS.indexOf("test");
    // No attempts at all: stage 0 must still walk forward, and every explanatory stage stays reachable.
    expect(lessonStageGate(lesson, [], 0).reachLimit, "objectives can advance").toBe(testIndex - 1);
    expect(lessonStageGate(lesson, [], 0).advanceBlocked, "objectives need no work").toBe(false);
    expect(lessonStageGate(lesson, [], 4).reachLimit, "rule stage can advance to controlled").toBe(testIndex - 1);
    // A learner restored deep in the lesson keeps that position and can move back or stay; only the
    // un-practiced mini-test stays out of reach.
    expect(lessonStageGate(lesson, [], 9).reachLimit, "restored at writing keeps its place and may keep practising").toBe(testIndex - 1);
    expect(lessonStageGate(lesson, [], 12).reachLimit, "one step before the test stays").toBe(12);
    expect(testIndex, "the assessment sits one step past the frozen limit").toBeGreaterThan(lessonStageGate(lesson, [], testIndex - 1).reachLimit);
  });

  it("applies the same contract to every published lesson", () => {
    for (const item of academicLessonList) {
      const gate = lessonStageGate(item, [], 0);
      expect(gate.policyVersion, item.id).toBe("lesson-stage-work-gate-v1");
      expect(gate.advanceBlocked, `${item.id} opens on objectives`).toBe(false);
      const testIndex = LESSON_STAGE_KEYS.indexOf("test");
      expect(lessonStageGate(item, [], testIndex - 1).reachLimit, `${item.id} hides the mini-test`).toBe(testIndex - 1);
    }
  });
});
