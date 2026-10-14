import type { ExerciseAttempt, LearningState } from "@/types/learning";

/**
 * Knowledge tracing (P2-349): a Bayesian Knowledge Tracing estimate computed
 * only from the learner's own local exercise attempts.
 *
 * Boundary (must stay visible wherever this is shown):
 * - It is a local, explainable estimate per lesson. It is NOT a prediction of an
 *   exam result, NOT a CEFR level, and NOT a calibrated probability.
 * - The four parameters are fixed defaults chosen by policy. They are not fitted
 *   to user data, so the numbers describe the model's assumptions, not the person.
 * - Independent assessment attempts (`evidenceContext`) are excluded so that
 *   formal level checks are not mixed into practice-based coaching estimates.
 * - Nothing is sent off the device.
 */

export const KNOWLEDGE_TRACING_POLICY = "bkt-local-v1" as const;
export const KNOWLEDGE_TRACING_BOUNDARY =
  "تقدير محلي لكل درس من محاولات التمرين فقط؛ ليس توقعًا لنتيجة امتحان ولا مستوى CEFR رسميًا." as const;

export const KNOWLEDGE_TRACING_PARAMETERS = {
  /** Prior probability the skill is already known before any attempt. */
  pInitial: 0.2,
  /** Probability of learning the skill after one practice attempt. */
  pTransit: 0.1,
  /** Probability of answering wrong although the skill is known. */
  pSlip: 0.1,
  /** Probability of answering right although the skill is not known. */
  pGuess: 0.25,
} as const;

/** Minimum practice attempts before a lesson receives any estimate. */
export const KNOWLEDGE_TRACING_MIN_OBSERVATIONS = 5;

export interface KnowledgeTracingEstimate {
  lessonId: string;
  observations: number;
  correct: number;
  status: "insufficient-evidence" | "estimate";
  /** Estimated probability the skill is known, 0–100, only when status is "estimate". */
  pKnownPercent?: number;
}

export interface KnowledgeTracingReport {
  policyVersion: typeof KNOWLEDGE_TRACING_POLICY;
  boundary: typeof KNOWLEDGE_TRACING_BOUNDARY;
  minObservations: number;
  lessonsWithEstimate: number;
  lessonsInsufficient: number;
  estimates: KnowledgeTracingEstimate[];
}

/** One Bayesian Knowledge Tracing step: update with the observation, then apply learning. */
export function updateKnowledge(pKnown: number, correct: boolean, params = KNOWLEDGE_TRACING_PARAMETERS): number {
  const { pTransit, pSlip, pGuess } = params;
  const known = pKnown * (correct ? 1 - pSlip : pSlip);
  const unknown = (1 - pKnown) * (correct ? pGuess : 1 - pGuess);
  const posterior = known + unknown === 0 ? pKnown : known / (known + unknown);
  return posterior + (1 - posterior) * pTransit;
}

function isPracticeAttempt(attempt: ExerciseAttempt): boolean {
  return !attempt.evidenceContext && typeof attempt.correct === "boolean" && typeof attempt.lessonId === "string" && attempt.lessonId.length > 0;
}

export function buildKnowledgeTracingReport(state: Pick<LearningState, "exerciseAttempts">, minObservations = KNOWLEDGE_TRACING_MIN_OBSERVATIONS): KnowledgeTracingReport {
  const ordered = state.exerciseAttempts
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt }) => isPracticeAttempt(attempt))
    .sort((left, right) => {
      const time = Date.parse(left.attempt.createdAt) - Date.parse(right.attempt.createdAt);
      return (Number.isFinite(time) ? time : 0) || left.index - right.index;
    });

  const perLesson = new Map<string, { pKnown: number; observations: number; correct: number }>();
  for (const { attempt } of ordered) {
    const current = perLesson.get(attempt.lessonId) ?? { pKnown: KNOWLEDGE_TRACING_PARAMETERS.pInitial, observations: 0, correct: 0 };
    current.pKnown = updateKnowledge(current.pKnown, attempt.correct);
    current.observations += 1;
    if (attempt.correct) current.correct += 1;
    perLesson.set(attempt.lessonId, current);
  }

  const estimates: KnowledgeTracingEstimate[] = [...perLesson.entries()]
    .map(([lessonId, value]) => {
      const enough = value.observations >= minObservations;
      return {
        lessonId,
        observations: value.observations,
        correct: value.correct,
        status: enough ? "estimate" as const : "insufficient-evidence" as const,
        ...(enough ? { pKnownPercent: Math.round(value.pKnown * 1000) / 10 } : {}),
      };
    })
    .sort((left, right) => left.lessonId.localeCompare(right.lessonId));

  return {
    policyVersion: KNOWLEDGE_TRACING_POLICY,
    boundary: KNOWLEDGE_TRACING_BOUNDARY,
    minObservations,
    lessonsWithEstimate: estimates.filter((item) => item.status === "estimate").length,
    lessonsInsufficient: estimates.filter((item) => item.status === "insufficient-evidence").length,
    estimates,
  };
}
