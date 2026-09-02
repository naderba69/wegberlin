import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { lessonEvidenceGate } from "@/core/lessons/evidence-gate";
import type { ExerciseAttempt, LearningState } from "@/types/learning";

const lesson = academicLessons["a1-01"];
const attempt = (exerciseId: string, correct = true, index = 0): ExerciseAttempt => ({
  id: `attempt-${exerciseId}-${index}`,
  lessonId: lesson.id,
  exerciseId,
  answer: correct ? "correct" : "wrong",
  correct,
  createdAt: new Date(2026, 7, 30, 10, 0, index).toISOString(),
});
const withAttempts = (exerciseAttempts: ExerciseAttempt[]): LearningState => ({ ...defaultState, exerciseAttempts });

describe("lesson evidence gate", () => {
  it("keeps completion locked when the learner only browses the 14 stages", () => {
    const gate = lessonEvidenceGate(lesson, defaultState);
    expect(gate.passed).toBe(false);
    expect(gate.criteria.map((criterion) => criterion.achieved)).toEqual([0, 0, 0, 0]);
    expect(gate.criteria.find((criterion) => criterion.id === "controlled")?.required).toBe(Math.ceil(lesson.exercises.length * 0.7));
    expect(gate.criteria.find((criterion) => criterion.id === "mini-test")?.required).toBe(Math.ceil(lesson.miniTest.length * 0.8));
  });

  it("does not count repeated answers to one item as separate evidence", () => {
    const repeated = Array.from({ length: 8 }, (_, index) => attempt(lesson.exercises[0].id, true, index));
    const gate = lessonEvidenceGate(lesson, withAttempts(repeated));
    expect(gate.criteria.find((criterion) => criterion.id === "controlled")?.achieved).toBe(1);
    expect(gate.passed).toBe(false);
  });

  it("unlocks only after controlled, reading, listening, and mini-test thresholds all pass", () => {
    const controlledRequired = Math.ceil(lesson.exercises.length * 0.7);
    const testRequired = Math.ceil(lesson.miniTest.length * 0.8);
    const ids = [
      ...lesson.exercises.slice(0, controlledRequired).map((exercise) => exercise.id),
      lesson.reading.questions[0].id,
      lesson.listening.questions[0].id,
      ...lesson.miniTest.slice(0, testRequired).map((question) => question.id),
    ];
    const gate = lessonEvidenceGate(lesson, withAttempts(ids.map((id, index) => attempt(id, true, index))));
    expect(gate.passed).toBe(true);
    expect(gate.criteria.every((criterion) => criterion.passed)).toBe(true);
  });

  it("applies the same four-criterion contract to all 84 lessons", () => {
    const lessons = Object.values(academicLessons);
    expect(lessons).toHaveLength(84);
    for (const item of lessons) {
      const gate = lessonEvidenceGate(item, defaultState);
      expect(gate.criteria.map((criterion) => criterion.id)).toEqual(["controlled", "reading", "listening", "mini-test"]);
      expect(gate.criteria.find((criterion) => criterion.id === "controlled")?.required).toBe(Math.ceil(item.exercises.length * 0.7));
      expect(gate.criteria.find((criterion) => criterion.id === "mini-test")?.required).toBe(Math.ceil(item.miniTest.length * 0.8));
    }
  });
});
