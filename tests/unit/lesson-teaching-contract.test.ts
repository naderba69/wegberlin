import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessons, academicLessonList } from "@/data/academic-lessons";
import {
  CONTRACT_QUESTIONS,
  CONTRACT_THRESHOLDS,
  LESSON_TEACHING_CONTRACT_BOUNDARY,
  LESSON_TEACHING_CONTRACT_POLICY,
  allLessonsTeachingContract,
  lessonTeachingContract,
} from "@/core/lesson/teaching-contract";
import { LEARNING_STATE_INDEPENDENCE_NOTE, LEARNING_STATE_LABELS } from "@/core/lessons/learning-state";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { reviewCards } from "@/data/review-cards";
import { independentProductionTasks } from "@/data/independent-production-tasks";

const report = JSON.parse(readFileSync("reports/lesson-teaching-contract-audit.json", "utf8")) as {
  policyVersion: string;
  measured: Record<string, number>;
  limits: Record<string, number>;
  status: string;
  lessons: Array<{ id: string; hardFailures: string[]; gaps: string[]; deferredTransferTask: string | null; authoredPrerequisiteNodes: number }>;
};

const results = allLessonsTeachingContract(academicLessonList);

describe("one-lesson teaching contract (8 questions, measured)", () => {
  it("asks exactly the eight questions and marks seven of them non-negotiable", () => {
    expect(LESSON_TEACHING_CONTRACT_POLICY).toBe("lesson-teaching-contract-v1");
    expect(LESSON_TEACHING_CONTRACT_BOUNDARY).toContain("no-mastery");
    expect(CONTRACT_QUESTIONS.map((question) => question.id)).toEqual([
      "goal", "prerequisites", "explanation-model", "graded-practice", "transfer", "feedback", "evidence-split", "review-later",
    ]);
    expect(CONTRACT_QUESTIONS.filter((question) => question.hard)).toHaveLength(7);
    expect(CONTRACT_QUESTIONS.filter((question) => !question.hard).map((question) => question.id)).toEqual(["prerequisites"]);
    expect(CONTRACT_QUESTIONS.every((question) => question.ar.trim().length > 8)).toBe(true);
  });

  it("answers all eight for the pilot lesson of A1 with no gap left open", () => {
    const contract = lessonTeachingContract(academicLessons["a1-01"]);
    expect(contract.hardFailures).toEqual([]);
    expect(contract.gaps).toEqual([]);
    expect(contract.answers["review-later"].valueAr).toContain("24 بطاقة");
    expect(contract.answers["transfer"].valueAr).toContain("مهمة نقل مؤجلة: موجودة");
    expect(contract.answers.prerequisites.ok).toBe(true);
  });

  it("names the two known gaps on a B2 pilot instead of hiding them", () => {
    const contract = lessonTeachingContract(academicLessons["b2-14"]);
    expect(contract.hardFailures).toEqual([]);
    expect(contract.gaps.join(" ")).toContain("لا مهمة نقل مؤجلة");
    expect(contract.answers.prerequisites.valueAr).toContain("ترتيب المنهج");
    expect(contract.answers["explanation-model"].ok).toBe(true);
  });

  it("keeps the structural spine of every lesson intact", () => {
    expect(results).toHaveLength(96);
    for (const result of results) {
      expect(result.hardFailures, result.lessonId).toEqual([]);
      expect(result.answers["graded-practice"].ok, result.lessonId).toBe(true);
      expect(result.answers["explanation-model"].ok, result.lessonId).toBe(true);
      expect(result.answers.transfer.ok, result.lessonId).toBe(true);
      expect(result.answers.goal.ok, result.lessonId).toBe(true);
      expect(result.answers["review-later"].ok, result.lessonId).toBe(true);
    }
  });

  it("refuses to call an unaided first recall independence", () => {
    expect(LEARNING_STATE_LABELS.firstUnaidedRecall).toContain("تدريب");
    expect(LEARNING_STATE_LABELS.firstUnaidedRecall).not.toContain("مستقلة");
    expect(LEARNING_STATE_LABELS.retained).toContain("مؤجل");
    expect(LEARNING_STATE_INDEPENDENCE_NOTE).toContain("ثلاثة أيام");
    expect(results.every((result) => result.answers["evidence-split"].ok)).toBe(true);
  });

  it("counts the authored gaps that the content work has to close", () => {
    const withDeferred = academicLessonList.filter((lesson) => independentProductionTasks.some((task) => task.sourceLessonId === lesson.id)).length;
    expect(withDeferred).toBe(32);
    expect(results.filter((result) => result.gaps.some((gap) => gap.startsWith("transfer")))).toHaveLength(64);
  });

  it("pins every lesson's cards into the review pool that /review reads", () => {
    const pool = new Set(reviewCards.map((card) => card.id));
    for (const lesson of academicLessonList) {
      const cards = buildLessonSrsCards(lesson);
      expect(cards.length, lesson.id).toBeGreaterThanOrEqual(CONTRACT_THRESHOLDS.lessonCardsMin);
      expect(cards.every((card) => pool.has(card.id)), lesson.id).toBe(true);
    }
  });

  it("keeps the committed audit consistent with these measurements and its ceilings", () => {
    expect(report.policyVersion).toBe(LESSON_TEACHING_CONTRACT_POLICY);
    expect(report.status).toBe("pass");
    expect(report.measured.lessonsTotal).toBe(96);
    expect(report.measured.hardFailures).toBe(0);
    expect(report.measured.itemsWithoutExplanation).toBe(0);
    expect(report.measured.cardsMissingFromReviewPool).toBe(0);
    for (const [key, ceiling] of Object.entries(report.limits)) {
      expect(report.measured[key], key).toBeLessThanOrEqual(ceiling);
    }
    expect(report.lessons).toHaveLength(96);
    expect(report.lessons.filter((row) => row.authoredPrerequisiteNodes === 0)).toHaveLength(73);
  });
});
