import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { buildEvidenceReport } from "@/core/evidence/report";
import { buildNoveltyWeightedEvidence, lessonMasteryFromAttempts, NOVEL_PRACTICE_WEIGHT, NOVEL_TRANSFER_WEIGHT, SAME_ITEM_RETRY_WEIGHT } from "@/core/evidence/mastery-weighting";
import { defaultState } from "@/core/portability/db";
import type { ExerciseAttempt } from "@/types/learning";

const lesson = academicLessons["a1-01"];
const attempt = (exerciseId: string, correct: boolean, minute: number): ExerciseAttempt => ({
  id: `attempt-${exerciseId}-${minute}`,
  lessonId: lesson.id,
  exerciseId,
  answer: correct ? "correct" : "wrong",
  correct,
  createdAt: `2026-09-03T10:${String(minute).padStart(2, "0")}:00Z`,
});

describe("P0 novelty-weighted mastery evidence", () => {
  it("gives unseen transfer more weight than unseen guided practice and same-item retry", () => {
    const practiceId = lesson.exercises[0].id;
    const transferId = lesson.miniTest[0].id;
    const evidence = buildNoveltyWeightedEvidence([
      attempt(practiceId, true, 0),
      attempt(practiceId, true, 1),
      attempt(transferId, true, 2),
    ], new Set([transferId]));
    expect(NOVEL_TRANSFER_WEIGHT).toBeGreaterThan(NOVEL_PRACTICE_WEIGHT);
    expect(NOVEL_PRACTICE_WEIGHT).toBeGreaterThan(SAME_ITEM_RETRY_WEIGHT);
    expect(evidence).toMatchObject({ novelItemCount: 2, novelTransferCount: 1, retryAttemptCount: 1, countedRetryCount: 1, weightedCorrect: 2.75, weightedPossible: 2.75 });
  });

  it("counts only the latest retry signal so repeated clicking cannot inflate weight", () => {
    const itemId = lesson.exercises[0].id;
    const evidence = buildNoveltyWeightedEvidence(Array.from({ length: 20 }, (_, index) => attempt(itemId, index === 19, index)));
    expect(evidence.novelItemCount).toBe(1);
    expect(evidence.retryAttemptCount).toBe(19);
    expect(evidence.countedRetryCount).toBe(1);
    expect(evidence.weightedPossible).toBe(1.25);
    expect(evidence.weightedCorrect).toBe(0.25);
    expect(evidence.weightedAccuracyPercent).toBe(20);
  });

  it("raises lesson evidence more for a new item than for unlimited repeats of one item", () => {
    const firstId = lesson.exercises[0].id;
    const transferId = lesson.reading.questions[0].id;
    const repeated = Array.from({ length: 20 }, (_, index) => attempt(firstId, true, index));
    const repeatMastery = lessonMasteryFromAttempts(lesson, repeated);
    const withNewTransfer = lessonMasteryFromAttempts(lesson, [...repeated, attempt(transferId, true, 30)]);
    expect(repeatMastery.evidence.novelItemCount).toBe(1);
    expect(withNewTransfer.evidence.novelTransferCount).toBe(1);
    expect(withNewTransfer.score).toBeGreaterThan(repeatMastery.score);
  });

  it("exposes the weighting version and retry boundary in learner evidence", () => {
    const question = lesson.reading.questions[0];
    const state = { ...defaultState, exerciseAttempts: [attempt(question.id, false, 0), attempt(question.id, true, 1), attempt(question.id, true, 2)] };
    const reading = buildEvidenceReport(state, new Date("2026-09-03T12:00:00Z")).skills.find((skill) => skill.key === "reading")!;
    expect(reading.noveltyWeighting).toEqual({ version: "novelty-weighting-v1", novelItems: 1, novelTransfers: 1, retryAttempts: 2, weightedAccuracyPercent: 14 });
    expect(reading.detailAr).toContain("إعادات بوزن منخفض");
    expect(reading.boundaryAr).toContain("أعلى وزنًا");
  });
});
