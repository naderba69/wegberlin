import { describe, expect, it } from "vitest";
import { academicLessonList as lessons } from "@/data/academic-lessons";
import type { PracticeExercise } from "@/types/lesson-content";

type ScoredItem = { id: string; options: readonly string[]; correctIndex: number; explanationAr: string };

/**
 * Option-parallelism guard for the lessons whose multiple-choice items were parallelised in the
 * cue-cleanup arc (phase 3). `reports/lesson-quality-audit.json` measures one asymmetric property
 * globally — "the correct option is the unique longest" (20.8% after ADR-138, ratchet 21%; the
 * gate counts every lesson, this test only the converted ones). What it locks down is the *design rule*
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

// ADR-137 (v245): reading and listening questions test comprehension of a text, so no key may be
// recognisable by length alone — unique longest by >=5 characters AND >=15%. Measured 115 reading and
// 96 listening items before the review, 0 after. Mini-test/exercise items are ratcheted in the
// lesson-quality audit until their own review.
describe("comprehension questions carry no visible length cue (ADR-137)", () => {
  it("keeps every reading and listening key within 5 characters or 15% of the next option", () => {
    const offenders: string[] = [];
    for (const lesson of lessons) {
      for (const item of [...lesson.reading.questions, ...lesson.listening.questions]) {
        const lengths = item.options.map((option) => strip(String(option)).length);
        const key = lengths[item.correctIndex];
        const next = Math.max(...lengths.filter((_, index) => index !== item.correctIndex));
        if (key - next >= 5 && key >= 1.15 * next) offenders.push(`${item.id} ${key}/${next}`);
        expect(new Set(item.options.map((option) => fold(String(option)))).size, `${item.id} has duplicate options`).toBe(item.options.length);
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ADR-138 (v246): the same rule now covers mini-test and multiple-choice exercise items (88 and 55
// visible cues before, 0 after). Distractors became same-length near-misses of the key — a word-order
// or morphology slip of the same sentence, or a well-formed sentence that does the wrong job — so the
// learner has to apply the rule instead of spotting the only complete sentence.
describe("mini-test and exercise items carry no visible length cue (ADR-138)", () => {
  it("keeps every mini-test and exercise key within 5 characters or 15% of the next option", () => {
    const offenders: string[] = [];
    for (const lesson of lessons) {
      const scored = [
        ...lesson.exercises.filter((exercise): exercise is Extract<PracticeExercise, { type: "multiple-choice" }> => exercise.type === "multiple-choice"),
        ...lesson.miniTest,
      ];
      for (const item of scored) {
        const lengths = item.options.map((option) => strip(String(option)).length);
        const key = lengths[item.correctIndex];
        const next = Math.max(...lengths.filter((_, index) => index !== item.correctIndex));
        if (key - next >= 5 && key >= 1.15 * next) offenders.push(`${lesson.id}:${item.id} ${key}/${next}`);
        expect(new Set(item.options.map((option) => fold(String(option)))).size, `${item.id} has duplicate options`).toBe(item.options.length);
        const keyHasArabic = arabic.test(String(item.options[item.correctIndex]));
        for (const option of item.options) expect(arabic.test(String(option)), `${item.id} mixes Arabic and German options: ${option}`).toBe(keyHasArabic);
      }
    }
    expect(offenders).toEqual([]);
  });
});
