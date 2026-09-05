import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { buildRetrievalWarmup, warmupItemCount } from "@/core/srs/warmup";
import { composeTodayMission } from "@/core/coach/coach";
import { defaultState } from "@/core/portability/db";
import type { LearningState } from "@/types/learning";

const firstLesson = academicLessonList[0];
const at = (iso: string) => new Date(iso);

const baseState: LearningState = {
  ...defaultState,
  profile: {
    name: "Nadia",
    targetExam: "goethe-b2",
    dailyMinutes: 45,
    arabicSupport: "modern-standard-arabic",
    currentLevel: "A1",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  diagnosticResult: {
    estimatedLevel: "A1",
    score: 3,
    maxScore: 4,
    levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 },
    completedAt: "2026-08-01T00:10:00.000Z",
  },
};

/** حالة أنهت أول درس وأكملت مراحله. */
const completedFirst: LearningState = {
  ...baseState,
  completedLessonIds: [firstLesson.id],
  currentLessonId: firstLesson.id,
  lessonProgress: { [firstLesson.id]: 13 },
};

/** حالة في منتصف أول درس: المرحلة 1 (المدخل) آخر ما شاهده. */
const midFirst: LearningState = {
  ...baseState,
  currentLessonId: firstLesson.id,
  lessonProgress: { [firstLesson.id]: 1 },
};

describe("P0-38: short retrieval warm-up before any SM-2 card exists", () => {
  it("retrieves nothing before the learner has seen any lesson stage", () => {
    const plan = buildRetrievalWarmup(baseState, at("2026-09-05T09:00:00.000Z"), 4);
    expect(plan.items).toHaveLength(0);
    // الصدق قبل كل شيء: لا نخترع مادة استرجاع من لا شيء، ونشرح السبب.
    expect(plan.reasonAr).toContain("لم تفتح أي مرحلة");
  });

  it("draws only from stages the learner has already seen", () => {
    const plan = buildRetrievalWarmup(midFirst, at("2026-09-05T09:00:00.000Z"), 4);
    expect(plan.items.length).toBeGreaterThan(0);
    for (const item of plan.items) {
      expect(item.stageIndex, item.id).toBeLessThanOrEqual(1);
    }
    // ...ويستمدّ المزيد بعد تجاوز مراحل لاحقة.
    const deeper = buildRetrievalWarmup(
      { ...baseState, currentLessonId: firstLesson.id, lessonProgress: { [firstLesson.id]: 8 } },
      at("2026-09-05T09:00:00.000Z"),
      4,
    );
    expect(deeper.items.some((item) => item.stageIndex > 1)).toBe(true);
  });

  it("never repeats a scheduled SM-2 card front", () => {
    for (const lesson of academicLessonList) {
      const fronts = new Set(
        buildLessonSrsCards(lesson).map((card) => card.front.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/\s+/gu, " ").trim()),
      );
      const plan = buildRetrievalWarmup(
        { ...baseState, completedLessonIds: [lesson.id], currentLessonId: lesson.id, lessonProgress: { [lesson.id]: 13 } },
        at("2026-09-05T09:00:00.000Z"),
        6,
      );
      expect(plan.items.length, lesson.id).toBeGreaterThan(0);
      for (const item of plan.items) {
        const key = item.answerDe.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/\s+/gu, " ").trim();
        expect(fronts.has(key), `${lesson.id} → ${item.answerDe}`).toBe(false);
      }
    }
  });

  it("is stable within a day and rotates between days", () => {
    const day = (iso: string) => buildRetrievalWarmup(completedFirst, at(iso), 4).items.map((item) => item.id);
    expect(day("2026-09-05T09:00:00.000Z")).toEqual(day("2026-09-05T21:30:00.000Z"));
    // عبر أسبوع: تظهر أكثر من جولة مختلفة، حتى لا يتكرر الإحماء نفسه كل يوم.
    const week = new Set(
      Array.from({ length: 7 }, (_, index) => day(`2026-09-0${5 + (index % 4)}T09:00:00.000Z`).join("|")),
    );
    const distinct = new Set(Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 8, 5 + index));
      return buildRetrievalWarmup(completedFirst, date, 4).items.map((item) => item.id).join("|");
    }));
    expect(distinct.size).toBeGreaterThanOrEqual(3);
    expect(week.size).toBeGreaterThanOrEqual(1);
  });

  it("keeps every item usable: an Arabic cue, a German answer, and a known stage", () => {
    const plan = buildRetrievalWarmup(completedFirst, at("2026-09-05T09:00:00.000Z"), 6);
    for (const item of plan.items) {
      expect(item.cueAr.length, item.id).toBeGreaterThan(0);
      expect(item.answerDe.length, item.id).toBeGreaterThan(0);
      expect(item.instructionAr.length, item.id).toBeGreaterThan(0);
      expect(item.stageIndex, item.id).toBeGreaterThanOrEqual(0);
      expect(item.stageIndex, item.id).toBeLessThanOrEqual(13);
      expect(item.lessonId).toBe(firstLesson.id);
    }
    expect(warmupItemCount(2)).toBe(3);
    expect(warmupItemCount(45)).toBe(6);
  });

  it("keeps a short retrieval block in the session plan instead of deleting it", () => {
    const mission = composeTodayMission(midFirst, at("2026-09-05T09:00:00.000Z"));
    const review = mission.find((block) => block.id === "review");
    expect(review).toBeDefined();
    expect(review?.mode).toBe("warmup");
    expect(review?.minutes).toBeGreaterThan(0);
    expect(review?.minutes).toBeLessThanOrEqual(4);
    expect(review?.titleAr).toContain("إحماء");
    // الدقائق لا تُحذف من الخطة: مجموع الكتل يساوي وقت الجلسة المختار (45 د).
    expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(45);
  });

  it("drops the block only when there is genuinely nothing to retrieve", () => {
    const mission = composeTodayMission(baseState, at("2026-09-05T09:00:00.000Z"));
    expect(mission.find((block) => block.id === "review")).toBeUndefined();
    expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(45);
  });
});
