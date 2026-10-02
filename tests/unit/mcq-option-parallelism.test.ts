import { describe, expect, it } from "vitest";
import { academicLessonList as lessons } from "@/data/academic-lessons";
import type { PracticeExercise } from "@/types/lesson-content";

type ScoredItem = { id: string; options: readonly string[]; correctIndex: number; explanationAr: string };

/**
 * Option-parallelism guard for the lessons whose multiple-choice items were parallelised in the
 * cue-cleanup arc (phase 3). `reports/lesson-quality-audit.json` measures one asymmetric property
 * globally — "the correct option is the unique longest" — and that figure is still above its 40%
 * ceiling, so this test does NOT claim the gate is green. What it locks down is the *design rule*
 * applied to the lessons already converted, so a later edit cannot quietly reintroduce a cue:
 *
 *  1. the key must never be the unique longest option (the measured cue);
 *  2. the key must not be the unique shortest either — over-correcting just mirrors the cue;
 *  3. all four options stay within 25 characters of each other, so no option is a stub;
 *  4. one option set speaks one language: Arabic-annotated keys keep Arabic distractors, German
 *     keys keep German distractors (a mixed set gives away the answer without testing anything);
 *  5. no two options may be identical after folding case, umlauts and trailing punctuation.
 */

const PARALLELISED = ["b1-05", "b1-07", "b2-05", "b2-13", "b2-17", "b1-12", "b1-15", "b1-20", "b2-01", "b2-02", "b2-07", "b2-08", "b2-11", "b2-12", "b2-19"];

const strip = (value: string) => value.trim().replace(/[.!?]+$/, "");
const fold = (value: string) => strip(value).normalize("NFC").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
const arabic = /[\u0600-\u06ff]/;
const latin = /[A-Za-zÄÖÜäöüß]/;

const itemsOf = (lesson: (typeof lessons)[number]): ScoredItem[] => [
  ...lesson.exercises.filter((exercise): exercise is Extract<PracticeExercise, { type: "multiple-choice" }> => exercise.type === "multiple-choice"),
  ...lesson.reading.questions,
  ...lesson.listening.questions,
  ...lesson.miniTest,
];

describe("parallelised option sets stay cue-free", () => {
  it.each(PARALLELISED)("%s holds the design rule on every scored item", (lessonId) => {
    const lesson = lessons.find((item) => item.id === lessonId);
    expect(lesson, `lesson ${lessonId} must exist`).toBeDefined();
    const items = itemsOf(lesson!);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const lengths = item.options.map((option) => strip(String(option)).length);
      const longest = Math.max(...lengths);
      const shortest = Math.min(...lengths);
      const keyLength = lengths[item.correctIndex];
      expect(new Set(item.options.map((option) => fold(String(option)))).size, `${lessonId}:${item.id} has duplicate options`)
        .toBe(item.options.length);
      expect(keyLength === longest && lengths.filter((length) => length === longest).length === 1, `${lessonId}:${item.id} key is the unique longest (${lengths.join("/")})`)
        .toBe(false);
      expect(keyLength === shortest && lengths.filter((length) => length === shortest).length === 1, `${lessonId}:${item.id} key is the unique shortest (${lengths.join("/")})`)
        .toBe(false);
      expect(longest - shortest, `${lessonId}:${item.id} option length spread`).toBeLessThanOrEqual(25);
      const keyHasArabic = arabic.test(String(item.options[item.correctIndex]));
      for (const option of item.options) {
        const text = String(option);
        expect(arabic.test(text), `${lessonId}:${item.id} Arabic in an option set whose key is German: ${text}`).toBe(keyHasArabic);
        if (keyHasArabic) continue;
        expect(latin.test(text), `${lessonId}:${item.id} non-German option beside German key: ${text}`).toBe(true);
      }
    }
  });

  it("keeps every option set free of stray non-Arabic, non-German scripts", () => {
    const stray = /[\u0590-\u05ff\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0400-\u04ff]/;
    const offenders: string[] = [];
    for (const lesson of lessons) {
      for (const item of itemsOf(lesson)) {
        for (const option of item.options) {
          if (stray.test(String(option))) offenders.push(`${lesson.id}:${item.id}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
