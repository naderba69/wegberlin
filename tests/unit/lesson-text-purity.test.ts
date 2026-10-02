import { describe, expect, it } from "vitest";
import { academicLessonList as lessons } from "@/data/academic-lessons";

/**
 * Script-purity guard over every authored string in the published curriculum.
 *
 * `mcq-option-parallelism.test.ts` already rejects non-Arabic/Latin scripts inside option sets,
 * because a stray script there leaks the answer. The 2026-09-20 batch found the same class of defect
 * somewhere else entirely: `b2-13.exercises[4].explanationAr` carried two CJK characters inside an
 * Arabic sentence (two Han characters where a German-derived verb belonged) that no option-level scan could reach. Learners read explanations,
 * prompts and contrast notes too, so this test walks the whole registry.
 *
 * It proves only that no learner-facing string contains Hebrew, CJK or Cyrillic. It does not certify
 * Arabic quality, and it must not be relabelled as a human review.
 */
const strayScript = /[\u0590-\u05ff\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0400-\u04ff]/;

const collect = (node: unknown, path: string, out: string[]): void => {
  if (typeof node === "string") {
    if (strayScript.test(node)) out.push(`${path}: ${node.slice(0, 60)}`);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((value, index) => collect(value, `${path}[${index}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) collect(value, `${path}.${key}`, out);
  }
};

describe("authored curriculum strings", () => {
  const offenders: string[] = [];
  let strings = 0;
  const countStrings = (node: unknown): void => {
    if (typeof node === "string") {
      strings += 1;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(countStrings);
      return;
    }
    if (node && typeof node === "object") Object.values(node).forEach(countStrings);
  };
  lessons.forEach((lesson) => {
    collect(lesson, lesson.id, offenders);
    countStrings(lesson);
  });

  it("scans every lesson in the registry", () => {
    expect(lessons.length).toBe(96);
    expect(strings).toBeGreaterThan(39000);
  });

  it("contains no Hebrew, CJK or Cyrillic characters in any authored string", () => {
    expect(offenders).toEqual([]);
  });
});
