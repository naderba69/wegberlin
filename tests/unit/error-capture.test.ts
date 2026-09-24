import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { captureLessonError } from "@/core/errors/capture";

const lesson = academicLessons["a1-01"];

describe("automatic lesson error capture", () => {
  it("stores a readable correction and increments one stable error record", () => {
    const exercise = lesson.exercises.find((item) => item.type === "word-ordering")!;
    const first = captureLessonError([], lesson, exercise.id, "du wie heißt", new Date("2026-08-30T10:00:00Z"));
    expect(first).toHaveLength(1);
    expect(first[0].type).toBe("word-order");
    expect(first[0].wrong).toBe("du wie heißt");
    expect(first[0].correct).toBe(exercise.acceptedAnswers[0]);
    expect(first[0].occurrences).toBe(1);
    const repeated = captureLessonError(first, lesson, exercise.id, "wie du heißt", new Date("2026-08-30T11:00:00Z"));
    expect(repeated).toHaveLength(1);
    expect(repeated[0].occurrences).toBe(2);
    expect(repeated[0].wrong).toBe("wie du heißt");
    expect(repeated[0].lastSeenAt).toBe("2026-08-30T11:00:00.000Z");
  });

  it("captures the selected and expected option for receptive questions", () => {
    const question = lesson.reading.questions[0];
    const wrongIndex = question.correctIndex === 0 ? 1 : 0;
    const errors = captureLessonError([], lesson, question.id, question.options[wrongIndex]);
    expect(errors[0].wrong).toBe(question.options[wrongIndex]);
    expect(errors[0].correct).toBe(question.options[question.correctIndex]);
    expect(errors[0].explanationAr).toBe(question.explanationAr);
  });

  it("ignores recall self-grades that are not curriculum correction items", () => {
    const errors = captureLessonError([], lesson, "phrase-recall-1", "retry");
    expect(errors).toEqual([]);
  });
});
