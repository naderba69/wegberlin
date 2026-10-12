import { describe, expect, it } from "vitest";
import type { ExerciseAttempt, LearningState } from "@/types/learning";
import {
  KNOWLEDGE_TRACING_BOUNDARY,
  KNOWLEDGE_TRACING_MIN_OBSERVATIONS,
  KNOWLEDGE_TRACING_PARAMETERS,
  buildKnowledgeTracingReport,
  updateKnowledge,
} from "@/core/evidence/knowledge-tracing";

function attempt(id: number, lessonId: string, correct: boolean, createdAt = `2026-10-01T10:00:${String(id % 60).padStart(2, "0")}.000Z`, extra: Partial<ExerciseAttempt> = {}): ExerciseAttempt {
  return { id: `a-${id}`, lessonId, exerciseId: `e-${id}`, answer: "x", correct, createdAt, ...extra } as ExerciseAttempt;
}

function state(attempts: ExerciseAttempt[]): Pick<LearningState, "exerciseAttempts"> {
  return { exerciseAttempts: attempts };
}

describe("knowledge tracing (P2-349)", () => {
  it("raises the estimate after a correct answer and lowers the update effect after a wrong one", () => {
    const start = KNOWLEDGE_TRACING_PARAMETERS.pInitial;
    const afterCorrect = updateKnowledge(start, true);
    const afterWrong = updateKnowledge(start, false);
    expect(afterCorrect).toBeGreaterThan(start);
    expect(afterWrong).toBeLessThan(afterCorrect);
    expect(afterCorrect).toBeGreaterThan(0);
    expect(afterCorrect).toBeLessThanOrEqual(1);
  });

  it("matches the standard BKT formula for a known example", () => {
    const { pSlip, pGuess, pTransit } = KNOWLEDGE_TRACING_PARAMETERS;
    const p = 0.2;
    const posterior = (p * (1 - pSlip)) / (p * (1 - pSlip) + (1 - p) * pGuess);
    expect(updateKnowledge(p, true)).toBeCloseTo(posterior + (1 - posterior) * pTransit, 12);
  });

  it("gives no estimate until the minimum number of practice attempts exists", () => {
    const attempts = Array.from({ length: KNOWLEDGE_TRACING_MIN_OBSERVATIONS - 1 }, (_, i) => attempt(i, "a1-01", true));
    const report = buildKnowledgeTracingReport(state(attempts));
    expect(report.estimates).toHaveLength(1);
    expect(report.estimates[0].status).toBe("insufficient-evidence");
    expect(report.estimates[0].pKnownPercent).toBeUndefined();
    expect(report.lessonsWithEstimate).toBe(0);
    expect(report.lessonsInsufficient).toBe(1);
  });

  it("gives a percentage once the threshold is reached, per lesson", () => {
    const attempts = [
      ...Array.from({ length: KNOWLEDGE_TRACING_MIN_OBSERVATIONS }, (_, i) => attempt(i, "a1-01", true)),
      ...Array.from({ length: KNOWLEDGE_TRACING_MIN_OBSERVATIONS }, (_, i) => attempt(100 + i, "a1-02", false)),
    ];
    const report = buildKnowledgeTracingReport(state(attempts));
    const byLesson = Object.fromEntries(report.estimates.map((item) => [item.lessonId, item]));
    expect(byLesson["a1-01"].status).toBe("estimate");
    expect(byLesson["a1-02"].status).toBe("estimate");
    expect(byLesson["a1-01"].pKnownPercent!).toBeGreaterThan(byLesson["a1-02"].pKnownPercent!);
    expect(byLesson["a1-01"].pKnownPercent!).toBeGreaterThanOrEqual(0);
    expect(byLesson["a1-01"].pKnownPercent!).toBeLessThanOrEqual(100);
    expect(report.lessonsWithEstimate).toBe(2);
  });

  it("excludes independent assessment attempts (evidenceContext) from practice estimates", () => {
    const assessment = Array.from({ length: 10 }, (_, i) =>
      attempt(200 + i, "a1-03", true, undefined, {
        evidenceContext: { policyVersion: "independent-assessment-v1", kind: "level-check", level: "A1", formId: "A", runId: "r", independent: true, expectedItems: 10 },
      }),
    );
    const report = buildKnowledgeTracingReport(state(assessment));
    expect(report.estimates).toHaveLength(0);
  });

  it("orders attempts by time, not by array position", () => {
    const later = attempt(1, "a1-04", false, "2026-10-02T10:00:00.000Z");
    const earlier = attempt(2, "a1-04", true, "2026-10-01T10:00:00.000Z");
    const ordered = buildKnowledgeTracingReport(state([later, earlier]));
    const reversed = buildKnowledgeTracingReport(state([earlier, later]));
    expect(ordered.estimates[0].pKnownPercent ?? null).toBe(reversed.estimates[0].pKnownPercent ?? null);
    expect(ordered.estimates[0].correct).toBe(1);
  });

  it("ignores malformed attempts and states the claim boundary", () => {
    const broken = { ...attempt(300, "a1-05", true), lessonId: "" } as ExerciseAttempt;
    const report = buildKnowledgeTracingReport(state([broken]));
    expect(report.estimates).toHaveLength(0);
    expect(report.boundary).toBe(KNOWLEDGE_TRACING_BOUNDARY);
    expect(report.boundary).toContain("ليس توقعًا لنتيجة امتحان");
  });
});
