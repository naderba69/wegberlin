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

  it("applies the same contract to every published lesson", () => {
    for (const item of academicLessonList) {
      const gate = lessonStageGate(item, [], 0);
      expect(gate.policyVersion, item.id).toBe("lesson-stage-work-gate-v1");
      expect(gate.advanceBlocked, `${item.id} opens on objectives`).toBe(false);
      const testIndex = LESSON_STAGE_KEYS.indexOf("test");
      expect(lessonStageGate(item, [], testIndex).reachLimit, `${item.id} hides the mini-test`).toBe(testIndex - 1);
    }
  });
});
