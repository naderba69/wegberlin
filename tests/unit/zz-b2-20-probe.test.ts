import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { lessonInteractiveItemCount, buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { fullLessonSchema } from "@/core/content-validation/schemas";

const lesson = academicLessonList.find((l) => l.id === "b2-20")!;

describe("b2-20 authored lesson probe", () => {
  it("is registered exactly once, published, and holds its batch position", () => {
    const published = curriculum.filter((l) => l.status === "published");
    expect(academicLessonList).toHaveLength(96);
    expect(published).toHaveLength(96);
    expect(published.map((l) => l.id)).toEqual(academicLessonList.map((l) => l.id));
    expect(academicLessonList[91]!.id).toBe("b2-20");
  });
  it("passes the content schema", () => {
    const parsed = fullLessonSchema.safeParse(lesson);
    expect(parsed.success, JSON.stringify(parsed.success ? {} : (parsed as { error?: unknown }).error).slice(0, 1200)).toBe(true);
  });
  it("satisfies the per-lesson quantitative gates", () => {
    expect(lesson.objectives.length).toBeGreaterThanOrEqual(4);
    expect(lesson.phrases.length).toBeGreaterThanOrEqual(12);
    expect(lesson.exercises.length).toBeGreaterThanOrEqual(7);
    expect(new Set(lesson.exercises.map((x) => x.type)).size).toBeGreaterThanOrEqual(5);
    expect(lesson.mistakes.length).toBeGreaterThanOrEqual(4);
    expect(lesson.miniTest.length).toBeGreaterThanOrEqual(5);
    expect(lesson.flashcards.length).toBeGreaterThanOrEqual(10);
    expect(lessonInteractiveItemCount(lesson)).toBeGreaterThanOrEqual(18);
    const cards = buildLessonSrsCards(lesson);
    expect(cards.length).toBeGreaterThanOrEqual(16);
    expect(cards.length).toBeLessThanOrEqual(24);
  });
  it("keeps glossary surface forms inside the reading text", () => {
    for (const item of lesson.reading.glossary) {
      expect(lesson.reading.textDe.toLocaleLowerCase("de-DE")).toContain(item.surfaceForm.toLocaleLowerCase("de-DE"));
    }
  });
  it("has valid MCQ shapes everywhere", () => {
    const questions = [...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest];
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
  it("tricks are present on every rule, pronunciation focus, and error", () => {
    for (const block of lesson.theory) expect(block.trickAr.trim().length).toBeGreaterThanOrEqual(12);
    expect(lesson.pronunciation.trickAr.trim().length).toBeGreaterThanOrEqual(12);
    for (const m of lesson.mistakes) expect(m.trickAr.trim().length).toBeGreaterThanOrEqual(5);
  });
  it("listening transcript is exam-length (1,100-1,600 chars) and Arabic is not empty", () => {
    expect(lesson.listening.transcriptDe.length).toBeGreaterThan(1100);
    expect(lesson.listening.transcriptDe.length).toBeLessThan(1600);
    expect(lesson.listening.transcriptAr.length).toBeGreaterThan(300);
    expect(lesson.reading.textDe.split(/\s+/).length).toBeGreaterThan(150);
  });
});
