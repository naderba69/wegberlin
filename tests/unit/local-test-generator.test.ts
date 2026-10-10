// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { localTestTemplateBankA1 } from "@/data/local-test-templates/a1";
import { localTestTemplateBankA2 } from "@/data/local-test-templates/a2";
import { localTestTemplateBankB1 } from "@/data/local-test-templates/b1";
import { localTestTemplateBankB2 } from "@/data/local-test-templates/b2";
import { buildLocalPracticeTest, buildLocalTestCatalog, LOCAL_TEST_GENERATOR_BOUNDARY, LOCAL_TEST_GENERATOR_POLICY, type LocalTestSourceLesson } from "@/core/training/local-test-generator";
import { loadLocalTestTemplateBank } from "@/core/training/local-test-template-loader";

const catalog = buildLocalTestCatalog(academicLessonList, curriculum);
function syntheticLesson(id: string, options = ["richtig", "falsch 1", "falsch 2", "falsch 3"] as [string, string, string, string]): LocalTestSourceLesson {
  return {
    id,
    level: "A1",
    module: 1,
    titleDe: `Lektion ${id}`,
    titleAr: `درس ${id}`,
    miniTest: [{
      id: `${id}-m1`,
      promptDe: "Welche Form ist richtig?",
      promptAr: "أي صيغة صحيحة؟",
      options,
      correctIndex: 0,
      explanationAr: "قارن وظيفة الصيغة بالسياق.",
    }],
  };
}

describe("P2-355 local test generator from published lesson templates", () => {
  it("audits 480 structurally sound mini-test templates across the 96 published lessons", () => {
    expect(LOCAL_TEST_GENERATOR_POLICY).toBe("local-test-generator-v1");
    expect(catalog.ok, catalog.issues.join("\n")).toBe(true);
    expect(catalog).toMatchObject({
      policyVersion: LOCAL_TEST_GENERATOR_POLICY,
      publishedLessonCount: 96,
      totalQuestionTemplates: 480,
      byLevel: {
        A1: { publishedLessons: 24, questionTemplates: 120 },
        A2: { publishedLessons: 24, questionTemplates: 120 },
        B1: { publishedLessons: 24, questionTemplates: 120 },
        B2: { publishedLessons: 24, questionTemplates: 120 },
      },
      boundary: "compiled-published-lesson-data-no-external-or-ai-content",
    });
  });

  it("keeps generated level banks byte-for-byte aligned with the published authored source", () => {
    expect(catalog.banks.A1).toEqual(localTestTemplateBankA1);
    expect(catalog.banks.A2).toEqual(localTestTemplateBankA2);
    expect(catalog.banks.B1).toEqual(localTestTemplateBankB1);
    expect(catalog.banks.B2).toEqual(localTestTemplateBankB2);
  });

  it("does not include planned lesson content in the published question pool", () => {
    const planned = syntheticLesson("a1-planned");
    const extended = buildLocalTestCatalog(
      [...academicLessonList, planned],
      [...curriculum, { id: planned.id, level: planned.level, status: "planned" }],
    );
    expect(extended.ok, extended.issues.join("\n")).toBe(true);
    expect(extended.publishedLessonCount).toBe(96);
    expect(extended.banks.A1.some((lesson) => lesson.id === planned.id)).toBe(false);
  });

  it("fails closed on duplicate choices instead of producing an ambiguous test item", () => {
    const duplicate = syntheticLesson("a1-duplicate", ["Kann ich ihnen helfen?", "Kann Ihnen ich helfen?", "Kann ich Sie helfen?", "Kann ich Ihnen helfen?"]);
    const result = buildLocalTestCatalog(
      [...academicLessonList, duplicate],
      [...curriculum, { id: duplicate.id, level: duplicate.level, status: "published" }],
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toContain("a1-duplicate:a1-duplicate-m1: options are duplicates after Unicode, whitespace, and case normalization");
  });

  it("creates a fresh exact-size sample from one distinct lesson per item at the chosen level", () => {
    const test = buildLocalPracticeTest("B1", 15, "coverage-seed-2026", catalog.banks.B1);
    expect(test).toMatchObject({ policyVersion: LOCAL_TEST_GENERATOR_POLICY, boundary: LOCAL_TEST_GENERATOR_BOUNDARY, level: "B1", itemCount: 15 });
    expect(test.items).toHaveLength(15);
    expect(new Set(test.items.map((item) => item.sourceLessonId)).size).toBe(15);
    expect(test.items.every((item) => catalog.banks.B1.some((lesson) => lesson.id === item.sourceLessonId))).toBe(true);
    expect(test.items.some((item) => catalog.banks.A1.some((lesson) => lesson.id === item.sourceLessonId))).toBe(false);
  });

  it("is reproducible for a local seed and preserves the correct choice after shuffling", () => {
    const first = buildLocalPracticeTest("A2", 10, "fixed-seed-for-test", catalog.banks.A2);
    const repeated = buildLocalPracticeTest("A2", 10, "fixed-seed-for-test", catalog.banks.A2);
    const changed = buildLocalPracticeTest("A2", 10, "another-fixed-seed", catalog.banks.A2);
    expect(repeated).toEqual(first);
    expect(changed.items.map((item) => item.templateId)).not.toEqual(first.items.map((item) => item.templateId));
    for (const item of first.items) {
      const originalLesson = academicLessonList.find((lesson) => lesson.id === item.sourceLessonId)!;
      const originalQuestion = originalLesson.miniTest.find((question) => `${originalLesson.id}:${question.id}` === item.templateId)!;
      expect(item.options[item.correctIndex]).toBe(originalQuestion.options[originalQuestion.correctIndex]);
      expect(new Set(item.options.map((option) => option.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("de-DE"))).size).toBe(4);
    }
  });

  it("rejects unsupported lengths, unbounded seeds, and level-bank mismatches", () => {
    expect(() => buildLocalPracticeTest("A1", 6 as 5, "seed", catalog.banks.A1)).toThrow("Unsupported local test length");
    expect(() => buildLocalPracticeTest("A1", 5, "   ", catalog.banks.A1)).toThrow("non-empty bounded local seed");
    expect(() => buildLocalPracticeTest("A1", 5, "x".repeat(129), catalog.banks.A1)).toThrow("non-empty bounded local seed");
    expect(() => buildLocalPracticeTest("A2", 15, "seed", catalog.banks.A1)).toThrow("not enough distinct published lesson templates");
  });

  it("rejects duplicate source lesson ids instead of risking two items from one lesson", () => {
    const duplicateBank = [...catalog.banks.A1, catalog.banks.A1[0]!];
    expect(() => buildLocalPracticeTest("A1", 5, "duplicate-source", duplicateBank)).toThrow("duplicate source lesson ids");
  });

  it("statically bundles every level bank so the practice route works after an Offline pack install", () => {
    const loader = readFileSync("src/core/training/local-test-template-loader.ts", "utf8");
    for (const level of ["A1", "A2", "B1", "B2"] as const) {
      expect(loader).toContain(`import { localTestTemplateBank${level} } from "@/data/local-test-templates/${level.toLowerCase()}"`);
    }
    expect(loader).not.toContain("await import(");
  });

  it("loads the learner-selected level bank", async () => {
    const bank = await loadLocalTestTemplateBank("A2");
    expect(bank).toHaveLength(24);
    expect(bank.every((lesson) => lesson.level === "A2")).toBe(true);
    expect(bank.reduce((sum, lesson) => sum + lesson.questions.length, 0)).toBe(120);
  });
});
