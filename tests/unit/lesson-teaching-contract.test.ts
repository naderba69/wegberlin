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
import { fullLessonSchema } from "@/core/content-validation/schemas";
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

  it("keeps the B2 pilot's remaining gap visible instead of hiding it", () => {
    const contract = lessonTeachingContract(academicLessons["b2-14"]);
    expect(contract.hardFailures).toEqual([]);
    expect(contract.gaps.join(" ")).toContain("متطلب");
    expect(contract.gaps.some((gap) => gap.startsWith("transfer"))).toBe(false);
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

  it("has a deferred transfer task for every lesson after Stage C", () => {
    const withDeferred = academicLessonList.filter((lesson) => independentProductionTasks.some((task) => task.sourceLessonId === lesson.id)).length;
    expect(independentProductionTasks).toHaveLength(96);
    expect(withDeferred).toBe(96);
    expect(results.filter((result) => result.gaps.some((gap) => gap.startsWith("transfer")))).toHaveLength(0);
    // Zero scaffolding before the attempt: the model and phrases stay hidden even now.
    expect(independentProductionTasks.every((task) => task.speaking.usefulPhrases.length === 0)).toBe(true);
    expect(independentProductionTasks.every((task) => task.writing.modelDe.startsWith("لا يوجد نموذج"))).toBe(true);
  });

  it("leaves no error-clinic line as a stub after Stage B authoring", () => {
    const items = academicLessonList.flatMap((lesson) => lesson.mistakes);
    expect(items.length).toBe(392);
    for (const lesson of academicLessonList) {
      for (const mistake of lesson.mistakes) {
        expect(mistake.whyAr.trim().length, `${lesson.id} whyAr`).toBeGreaterThanOrEqual(CONTRACT_THRESHOLDS.mistakeWhyMinChars);
        expect(mistake.trickAr.trim().length, `${lesson.id} trickAr`).toBeGreaterThanOrEqual(CONTRACT_THRESHOLDS.mistakeTrickMinChars);
        expect(mistake.whyAr.trim() === mistake.trickAr.trim(), `${lesson.id} repeats one line`).toBe(false);
        expect(mistake.whyAr.trim(), `${lesson.id} stub whyAr`).not.toMatch(/TODO|placeholder/i);
      }
    }
    expect(report.measured.mistakeWhyStubs).toBe(0);
    expect(report.measured.mistakeTrickStubs).toBe(0);
    // The ceiling is pinned at zero, so a new stub fails the gate instead of being tolerated.
    expect(report.limits.mistakeWhyStubs).toBe(0);
    expect(report.limits.mistakeTrickStubs).toBe(0);
  });

  it("keeps the schema floor and the contract threshold on the same number", () => {
    expect(CONTRACT_THRESHOLDS.mistakeWhyMinChars).toBe(20);
    expect(CONTRACT_THRESHOLDS.mistakeTrickMinChars).toBe(15);
    const lesson = academicLessons["a1-10"];
    expect(fullLessonSchema.safeParse(lesson).success).toBe(true);
    const thin = { ...lesson, mistakes: [{ wrong: "Ich habe kein Milch.", correct: "Ich habe keine Milch.", whyAr: "مؤنث.", trickAr: "die → keine." }] };
    expect(fullLessonSchema.safeParse(thin).success).toBe(false);
    const doubled = { ...lesson, mistakes: [{ wrong: "a", correct: "b", whyAr: "جملة عربية طويلة بما يكفي للشرح هنا", trickAr: "جملة عربية طويلة بما يكفي للشرح هنا" }] };
    expect(fullLessonSchema.safeParse(doubled).success).toBe(false);
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

  it("keeps English grammar metalanguage out of learner-facing Arabic (ع1)", async () => {
    const { academicLessonList } = await import("@/data/academic-lessons");
    const { independentProductionTasks } = await import("@/data/independent-production-tasks");
    const { englishGrammarTermLeak, learnerArabicFields, ENGLISH_GRAMMAR_TERMS } = await import("@/core/lesson/teaching-contract");
    const rows = [...(academicLessonList as unknown as unknown[]), ...(independentProductionTasks as unknown as unknown[])];
    const leaks = rows.flatMap((row) => learnerArabicFields(row).filter((field) => englishGrammarTermLeak(field.text).length > 0));
    expect(leaks).toEqual([]);
    // German metalanguage stays legitimate, so these spellings must not be in the blocklist.
    for (const german of ["Akkusativ", "Nebensatz", "Modalverb", "Genus", "Partikel"]) {
      expect(ENGLISH_GRAMMAR_TERMS).not.toContain(german.toLowerCase());
    }
    expect(englishGrammarTermLeak("Der Leser sieht das Modalverb am Ende.")).toEqual([]);
    expect(englishGrammarTermLeak("يتصرف modal في الموقع الثاني")).toContain("modal");
  });

});
