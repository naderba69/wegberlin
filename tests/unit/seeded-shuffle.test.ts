import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { LESSON_SHUFFLE_VERSION, seededPermutation, shuffledExerciseOptions, shuffledQuestionOptions } from "@/core/lesson/shuffle";

describe("seeded lesson option shuffle", () => {
  it("is deterministic, versioned, non-mutating, and never leaves a four-option identity order", () => {
    const first = seededPermutation(4, "a1-01:q1");
    const second = seededPermutation(4, "a1-01:q1");
    expect(LESSON_SHUFFLE_VERSION).toBe("lesson-shuffle-v1");
    expect(first).toEqual(second);
    expect([...first].sort()).toEqual([0, 1, 2, 3]);
    expect(first).not.toEqual([0, 1, 2, 3]);
  });

  it("changes order with context seeds while keeping each result a permutation", () => {
    const variants = new Set(["reading", "listening", "mini-test", "retry"].map((seed) => seededPermutation(4, seed).join(",")));
    expect(variants.size).toBeGreaterThan(1);
    for (const value of variants) expect(value.split(",").map(Number).sort()).toEqual([0, 1, 2, 3]);
  });

  it("preserves the original correct index for every published lesson question", () => {
    const questions = academicLessonList.flatMap((lesson) => [...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest]);
    for (const question of questions) {
      const shuffled = shuffledQuestionOptions(question, `audit:${question.id}`);
      expect(shuffled.options).toHaveLength(4);
      expect(shuffled.options[shuffled.correctPosition].originalIndex).toBe(question.correctIndex);
      expect(shuffled.options[shuffled.correctPosition].label).toBe(question.options[question.correctIndex]);
    }
  });

  it("preserves correct mapping for every controlled multiple-choice exercise", () => {
    const exercises = academicLessonList.flatMap((lesson) => lesson.exercises.filter((exercise) => exercise.type === "multiple-choice"));
    expect(exercises.length).toBeGreaterThan(80);
    for (const exercise of exercises) {
      const original = [...exercise.options];
      const shuffled = shuffledExerciseOptions(exercise, `audit:${exercise.id}`);
      expect(shuffled.options[shuffled.correctPosition].originalIndex).toBe(exercise.correctIndex);
      expect(shuffled.options[shuffled.correctPosition].label).toBe(exercise.options[exercise.correctIndex]);
      expect(exercise.options).toEqual(original);
    }
  });
});
