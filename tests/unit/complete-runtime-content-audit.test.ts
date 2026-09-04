import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles, examSources } from "@/data/exam-profiles";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { diagnosticForms } from "@/data/diagnostic";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";
import { reviewCards } from "@/data/review-cards";
import { exerciseInstructionsDe } from "@/components/exercise-card";

function deepIssues(value: unknown, path: string, issues: string[]) {
  if (typeof value === "string") {
    if (!value.trim()) issues.push(`${path}: empty string`);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) issues.push(`${path}: non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => deepIssues(item, `${path}[${index}]`, issues));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) deepIssues(item, `${path}.${key}`, issues);
  }
}

const roots = {
  academicLessonList,
  readingLibrary,
  listeningLibrary,
  allPublishedExamTasks,
  fullExamSimulations,
  examProfiles,
  examSources,
  diagnosticForms,
  reviewCards,
};

describe("complete runtime content audit", () => {
  it("contains no empty string or invalid number in any published runtime content tree", () => {
    const issues: string[] = [];
    deepIssues(roots, "content", issues);
    expect(issues).toEqual([]);
  });

  it("gives every learner question a German prompt and every answer bank real unique choices", () => {
    const lessonQuestions = academicLessonList.flatMap((lesson) => [...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest]);
    const libraryQuestions = [...readingLibrary, ...listeningLibrary].flatMap((item) => item.questions);
    expect(lessonQuestions).toHaveLength(924);
    expect(libraryQuestions).toHaveLength(320);
    for (const question of [...lessonQuestions, ...libraryQuestions]) {
      expect(question.promptDe.trim().length, question.id).toBeGreaterThan(0);
      expect(question.promptAr.trim().length, question.id).toBeGreaterThan(0);
      expect(question.options.every((option) => option.trim().length > 0), question.id).toBe(true);
      expect(new Set(question.options).size, question.id).toBe(question.options.length);
      expect(question.explanationAr.trim().length, question.id).toBeGreaterThan(0);
    }
  });

  it("finds no release placeholder markers in published content", () => {
    const serialized = JSON.stringify(roots);
    for (const marker of ["TODO", "FIXME", "TBD", "Lorem ipsum", "audioKey-placeholder", "example.invalid"]) {
      expect(serialized).not.toContain(marker);
    }
    const exercises = academicLessonList.flatMap((lesson) => lesson.exercises);
    expect(exercises).toHaveLength(588);
    for (const exercise of exercises) expect(exerciseInstructionsDe[exercise.type].trim().length, exercise.id).toBeGreaterThan(0);
    expect(allPublishedExamTasks).toHaveLength(150);
    expect(fullExamSimulations).toHaveLength(12);
  });
});
