// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import {
  applyLearningReset,
  assertAttemptLogPreserved,
  attemptLogDeletionRefusalAr,
  buildResetPlan,
  buildResetEvent,
  canExecuteReset,
  classifyResetCoverage,
  planLearningReset,
  RESET_CLEARED_DEFAULTS,
  RESET_CLEARED_FIELDS,
  RESET_CONFIRMATION_WORD,
  RESET_EVIDENCE_FIELDS,
  RESET_FIELD_POLICIES,
  RESET_PLAN_POLICY,
} from "@/core/state/reset-plan";
import type { ExerciseAttempt, LearningState } from "@/types/learning";

function attempt(index: number): ExerciseAttempt {
  return {
    id: `attempt-${index}`,
    lessonId: "a1-01",
    exerciseId: `a1-01-e${index}`,
    answer: `Antwort ${index}`,
    correct: index % 2 === 0,
    confidence: "medium",
    createdAt: `2026-09-2${index}T10:00:00.000Z`,
  };
}

function seededState(): LearningState {
  return {
    ...defaultState,
    completedLessonIds: ["a1-01", "a1-02"],
    completedBlockIds: ["block-1"],
    currentLessonId: "a1-03",
    currentStage: 9,
    lessonProgress: { "a1-01": 13, "a1-02": 13 },
    dueReviews: 7,
    mastery: { "a1-01": 60 },
    exerciseAttempts: [1, 2, 3, 4, 5].map(attempt),
    reviewItems: [{ id: "review-1" } as LearningState["reviewItems"][number]],
    studyHistory: [{ date: "2026-09-26", minutes: 30, evidenceCount: 5 }],
    writingSubmissions: [{ id: "writing-1" } as LearningState["writingSubmissions"][number]],
    profile: { ...(defaultState.profile ?? ({} as LearningState["profile"])) } as LearningState["profile"],
  };
}

describe("reset plan — تغطية كاملة وسلال أربع", () => {
  it("classifies every field of the shipped state with zero unclassified", () => {
    const coverage = classifyResetCoverage(defaultState);
    // 66 صفًّا بلا تكرار، وكل حقل مشحون في `defaultState` مصنَّف (0 بلا سلة).
    // صار 66 بـP2-93 (الهوية) وP2-119 (الإعدادات) وP2-156 (أحكام قابلية الفهم في سلة الأدلة).
    expect(coverage.totalClassified).toBe(66);
    expect(new Set(RESET_FIELD_POLICIES.map((row) => row.field)).size).toBe(66);
    expect(coverage.unclassifiedFields).toEqual([]);
    // الحقول الاختيارية غير المشحونة (externalEvaluatorNotes · lastBackupAt) لا تظهر في الحالة الافتراضية،
    // لكنها مصنَّفة أيضًا: التغطية 66 صفًّا لكل حقول النوع، و0 حقل مشحون بلا سلة.
    expect(Object.keys(defaultState).length).toBeGreaterThanOrEqual(60);
  });

  it("keeps the documented split: 19 cleared / 25 evidence / 12 settings / 10 identity", () => {
    const coverage = classifyResetCoverage(defaultState);
    expect({
      cleared: coverage.progressCleared,
      evidence: coverage.evidencePreserved,
      settings: coverage.settingsPreserved,
      identity: coverage.identityPreserved,
    }).toEqual({ cleared: 19, evidence: 25, settings: 12, identity: 10 });
    expect(RESET_CLEARED_FIELDS).toHaveLength(19);
    expect(RESET_EVIDENCE_FIELDS).toHaveLength(25);
    expect(RESET_CLEARED_FIELDS.length + RESET_EVIDENCE_FIELDS.length + 12 + 10).toBe(66);
  });

  it("clears to the shipped defaults, not to hand-written copies", () => {
    for (const [field, value] of Object.entries(RESET_CLEARED_DEFAULTS)) {
      expect(defaultState[field as keyof LearningState], field).toEqual(value);
    }
    const outcome = applyLearningReset(seededState(), new Date("2026-09-26T12:00:00.000Z"));
    expect(outcome.after).toEqual({
      dueReviews: defaultState.dueReviews,
      completedLessonCount: defaultState.completedLessonIds.length,
      masteryCount: Object.keys(defaultState.mastery).length,
      currentLessonId: defaultState.currentLessonId,
      currentStage: defaultState.currentStage,
    });
    expect(outcome.state.lessonProgress).toEqual({});
    expect(outcome.state.reviewItems).toEqual([]);
    expect(outcome.state.completedBlockIds).toEqual([]);
  });

  it("keeps every evidence log before === after, including the attempt log", () => {
    const before = seededState();
    const outcome = applyLearningReset(before, new Date("2026-09-26T12:00:00.000Z"));
    for (const field of RESET_EVIDENCE_FIELDS) {
      if (field === "resetEvents") continue;
      expect(outcome.state[field], field as string).toEqual(before[field]);
    }
    expect(outcome.state.exerciseAttempts).toHaveLength(5);
    expect(outcome.state.exerciseAttempts).toEqual(before.exerciseAttempts);
    expect(outcome.state.studyHistory).toEqual(before.studyHistory);
    expect(outcome.attemptLogCount).toBe(5);
  });

  it("refuses to run without the explicit acknowledgement and the typed confirmation word", () => {
    expect(canExecuteReset({ acknowledged: false, confirmation: RESET_CONFIRMATION_WORD }).allowed).toBe(false);
    expect(canExecuteReset({ acknowledged: true, confirmation: "إعادة " }).allowed).toBe(true);
    expect(canExecuteReset({ acknowledged: true, confirmation: "reset" }).allowed).toBe(false);
    expect(canExecuteReset({ acknowledged: true, confirmation: RESET_CONFIRMATION_WORD }).allowed).toBe(true);
  });

  it("keeps the attempt log and the learner's own evidence byte-for-byte and rejects any deletion through the tested guard", () => {
    const before = seededState();
    const tampered: LearningState = { ...before, exerciseAttempts: before.exerciseAttempts.slice(0, 3) };
    expect(() => assertAttemptLogPreserved(before, tampered)).toThrowError(attemptLogDeletionRefusalAr);
    const edited: LearningState = {
      ...before,
      exerciseAttempts: before.exerciseAttempts.map((row, index) => (index === 0 ? { ...row, answer: "geändert" } : row)),
    };
    expect(() => assertAttemptLogPreserved(before, edited)).toThrowError(/سجل المحاولات/);
    expect(() => assertAttemptLogPreserved(before, before)).not.toThrow();
  });

  it("appends one audit event per reset and never replaces the previous ones", () => {
    const first = applyLearningReset(seededState(), new Date("2026-09-26T12:00:00.000Z"));
    const second = applyLearningReset(first.state, new Date("2026-09-27T12:00:00.000Z"));
    expect(first.state.resetEvents).toHaveLength(1);
    expect(second.state.resetEvents).toHaveLength(2);
    expect(second.state.resetEvents?.[0].id).toBe(first.state.resetEvents?.[0].id);
    const event = second.state.resetEvents?.[1];
    expect(event?.policyVersion).toBe(RESET_PLAN_POLICY);
    expect(event?.clearedFields).toHaveLength(19);
    expect(event?.preservedEvidenceFields.length).toBe(25);
    expect(event?.keptAttemptCount).toBe(5);
    expect(event?.confirmationWord).toBe(RESET_CONFIRMATION_WORD);
    expect(event?.boundary).toBe("reset-clears-derived-progress-keeps-evidence-and-attempt-log");
  });

  it("describes the plan before execution with the measured before/after and evidence sizes", () => {
    const plan = buildResetPlan(seededState());
    expect(plan.policyVersion).toBe(RESET_PLAN_POLICY);
    expect(plan.clearedFields).toHaveLength(19);
    expect(plan.attemptLogCount).toBe(5);
    expect(plan.before).toEqual({ dueReviews: 7, completedLessonCount: 2, masteryCount: 1, currentLessonId: "a1-03", currentStage: 9 });
    const attemptsRow = plan.preservedEvidence.find((row) => row.field === "exerciseAttempts");
    expect(attemptsRow?.size).toBe(5);
    const event = buildResetEvent(plan, seededState(), new Date("2026-09-26T12:00:00.000Z"));
    expect(event.preservedEvidenceCounts.find((row) => row.field === "exerciseAttempts")?.count).toBe(5);
  });
});
