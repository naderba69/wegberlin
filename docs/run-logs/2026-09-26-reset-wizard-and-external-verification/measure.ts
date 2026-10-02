/**
 * مسبار القياس لدفعة v179 (يُشغَّل عبر vitest لأن الوحدات تستورده في بيئة node).
 * يقيس أرقامًا لا نوايا: تغطية التصنيف، وقائع التهيئة، وحالات الفحص الثمانية، وجدولة النقل.
 */
import { defaultState } from "@/core/portability/db";
import { applyLearningReset, classifyResetCoverage, planLearningReset } from "@/core/state/reset-plan";
import { verifyExternalEvaluation } from "@/core/assessment/external-evaluation-verification";
import { scheduleDelayedTransferTask, completeDelayedTransferTask } from "@/core/evidence/delayed-transfer-task";
import type { LearningState } from "@/types/learning";

export function measureResetProbe(state: LearningState, now = new Date("2026-09-26T12:00:00.000Z")) {
  const plan = planLearningReset(state);
  const outcome = applyLearningReset(state, now);
  return {
    coverage: classifyResetCoverage(defaultState),
    cleared: outcome.clearedFieldCount,
    preservedEvidence: outcome.preservedEvidenceFieldCount,
    keptAttempts: outcome.attemptLogCount,
    before: plan.before,
    after: outcome.after,
    resetEvents: outcome.state.resetEvents?.length ?? 0,
  };
}

export function measureVerificationProbe() {
  const learnerText = "Ich bewerbe mich um einen Platz im Deutschkurs und beschreibe meinen Alltag mit Arbeit und Lernen.";
  const clean = "Der Text ist verständlich, aber der zweite Absatz braucht eine klarere Reihenfolge der Gedanken.";
  const now = new Date("2026-09-26T12:00:00.000Z");
  const base = { learnerText, reviewerLabel: "أ. كريم", receivedAt: "2026-09-20T09:00:00.000Z", now };
  const cases = [
    verifyExternalEvaluation({ ...base, raw: clean }),
    verifyExternalEvaluation({ ...base, raw: `${clean} Ergebnis: 87 von 100 Punkten.` }),
    verifyExternalEvaluation({ ...base, raw: `${clean} Zertifikat für Niveau B2.` }),
    verifyExternalEvaluation({ ...base, reviewerLabel: "   ", raw: clean }),
    verifyExternalEvaluation({ ...base, receivedAt: "2025-01-05T09:00:00.000Z", raw: clean }),
    verifyExternalEvaluation({ ...base, raw: "   " }),
    verifyExternalEvaluation({ ...base, raw: "!!! 12 ??? ..." }),
    verifyExternalEvaluation({ ...base, raw: learnerText }),
  ];
  return {
    checks: 8,
    usable: cases.filter((row) => row.verdict === "usable").length,
    storedWithRejectedClaim: cases.filter((row) => row.verdict === "stored-with-rejected-claim").length,
    blocked: cases.filter((row) => row.verdict === "blocked").length,
  };
}

export function measureTransferProbe(state: LearningState, now = new Date("2026-09-26T12:00:00.000Z")) {
  const scheduled = scheduleDelayedTransferTask(state, { now });
  if (!scheduled) return { scheduled: 0 };
  const withTask: LearningState = {
    ...state,
    delayedTransferTasks: [...(state.delayedTransferTasks ?? []), scheduled.record],
  };
  const completion = completeDelayedTransferTask(withTask, scheduled.record.id, {
    answerText:
      "Heute bewerbe ich mich erneut und erkläre, warum mein Zeitplan anders aussieht als im letzten Monat und was ich zuerst üben will.",
    now,
  });
  return {
    scheduled: 1,
    sourceKind: scheduled.record.sourceKind,
    dueInDays: Math.round((Date.parse(scheduled.record.scheduledFor) - now.getTime()) / 86_400_000),
    completed: completion.ok ? 1 : 0,
    boundary: completion.record?.evidenceBoundary,
    masteryUntouched: JSON.stringify(state.mastery) === JSON.stringify(completion.state.mastery),
  };
}
