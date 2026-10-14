// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRONUNCIATION_TEST_BOUNDARY, PRONUNCIATION_TEST_POLICY, derivePronunciationTestCase, pronunciationTestCoverage } from "@/core/lessons/pronunciation-test";
import { lessonMasteryFromAttempts } from "@/core/evidence/mastery-weighting";
import { academicLessonList } from "@/data/academic-lessons";

/**
 * حارس عنصر النطق (P1-22): الاشتقاق لا التأليف — الرموز الصوتية كلها من الدرس نفسه، والخيار
 * الصحيح يدور ببذرة ثابتة، والعنصر مشمول في تغطية إتقان الدرس.
 */
describe("mandatory pronunciation item in every lesson test", () => {
  it("derives an item for every lesson from that lesson's own authored IPA", () => {
    const coverage = pronunciationTestCoverage(academicLessonList);
    expect(coverage.lessons).toBe(96);
    expect(coverage.withDerivedItem).toBe(96);
    expect(coverage.missing).toEqual([]);
    expect(coverage.all_distinct_options).toBe(true);
    expect(coverage.policyVersion).toBe(PRONUNCIATION_TEST_POLICY);
  });

  it("never borrows an IPA symbol from another lesson and keeps four distinct options", () => {
    for (const lesson of academicLessonList) {
      const item = derivePronunciationTestCase(lesson)!;
      const authored = new Set((lesson.pronunciation.items ?? []).map((entry) => entry.ipa));
      expect(item.options.length).toBe(4);
      expect(new Set(item.options).size).toBe(4);
      for (const option of item.options) expect(authored.has(option), `${lesson.id}: ${option} is not authored in this lesson`).toBe(true);
      expect(item.options[item.correctIndex]).toBe(authored.has(item.options[item.correctIndex]) ? item.options[item.correctIndex] : "");
      expect(item.boundary).toBe(PRONUNCIATION_TEST_BOUNDARY);
      expect(item.explanationAr).toContain("لا يعني أن التطبيق قاس نطقك");
    }
  });

  it("rotates the correct option by a stable seed so it is not always first", () => {
    const firstPositions = academicLessonList.filter((lesson) => derivePronunciationTestCase(lesson)!.correctIndex === 0).length;
    expect(firstPositions).toBeGreaterThan(0);
    expect(firstPositions).toBeLessThan(academicLessonList.length);
    const again = derivePronunciationTestCase(academicLessonList[0])!;
    expect(again.correctIndex).toBe(derivePronunciationTestCase(academicLessonList[0])!.correctIndex);
  });

  it("counts the derived item inside the lesson mastery coverage", () => {
    const lesson = academicLessonList[0];
    const item = derivePronunciationTestCase(lesson)!;
    const withPronunciation = lessonMasteryFromAttempts(lesson, [
      { id: "x1", lessonId: lesson.id, exerciseId: item.id, answer: item.options[item.correctIndex], correct: true, createdAt: "2026-10-01T09:00:00.000Z" },
    ]);
    const without = lessonMasteryFromAttempts(lesson, []);
    expect(withPronunciation.evidence.novelItemCount).toBeGreaterThan(without.evidence.novelItemCount);
    expect(withPronunciation.coveragePercent).toBeGreaterThan(0);
    expect(without.coveragePercent).toBe(0);
  });

  it("is mounted in the lesson test stage and gated at build time", () => {
    const runner = readFileSync("src/components/lesson-runner.tsx", "utf8");
    expect(runner).toContain("<LessonPronunciationTest lesson={lesson}");
    const component = readFileSync("src/components/lesson-pronunciation-test.tsx", "utf8");
    expect(component).toContain("data-pronunciation-test={item.policyVersion}");
    expect(component).toContain("لا رمز صوتي مختلق ولا مستعار من درس آخر");
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.prebuild).toContain("pronunciation:test");
    const report = JSON.parse(readFileSync("reports/pronunciation-test-audit.json", "utf8")) as { ok: boolean; withDerivedItem: number; lessons: number };
    expect(report.ok).toBe(true);
    expect(report.withDerivedItem).toBe(report.lessons);
  });
});
