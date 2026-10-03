import type { LearningState } from "@/types/learning";
import { attemptIsIndependent, latestUniqueAttempts } from "./independence";
import { localSessionDate } from "@/core/coach/session-signals";
import { retentionEvidence } from "@/core/srs/review-session";

export const LOCAL_LEARNING_OUTCOMES_POLICY = "local-learning-outcome-observation-v1" as const;

/** Describes existing learner-owned evidence; never infers that a feature caused improvement. */
export function buildLearningOutcomeObservation(state: LearningState, now = new Date(), windowDays = 14) {
  const from = now.getTime() - windowDays * 86_400_000;
  const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const oldest=localSessionDate(new Date(from));
  const attempts = state.exerciseAttempts.filter(attempt => Date.parse(attempt.createdAt) >= from && Date.parse(attempt.createdAt) <= now.getTime());
  const firstByItem = new Map<string, typeof attempts[number]>();
  for (const attempt of [...state.exerciseAttempts].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt))) {
    const key=`${attempt.lessonId}:${attempt.exerciseId}`;
    if(!firstByItem.has(key))firstByItem.set(key,attempt);
  }
  const newFirst = attempts.filter(attempt=>firstByItem.get(`${attempt.lessonId}:${attempt.exerciseId}`)?.id===attempt.id);
  const independent = newFirst.filter(attempt=>attemptIsIndependent(attempt,state)&&attempt.evidenceContext?.kind!=="endurance");
  const assisted = newFirst.filter(attempt=>!independent.some(item=>item.id===attempt.id));
  const retries = attempts.filter(attempt=>firstByItem.get(`${attempt.lessonId}:${attempt.exerciseId}`)?.id!==attempt.id);
  const delayed = state.reviewEvents.filter(event=>event.evidenceKind==="delayed"&&Date.parse(event.reviewedAt)>=from&&Date.parse(event.reviewedAt)<=now.getTime());
  const productiveVersions = state.writingSubmissions.filter(item=>Date.parse(item.createdAt)>=from&&Date.parse(item.createdAt)<=now.getTime());
  const retained=retentionEvidence(state);
  const summarise=(items:typeof attempts)=>({items:items.length,correct:items.filter(item=>item.correct).length,accuracyPercent:items.length?Math.round(items.filter(item=>item.correct).length/items.length*100):null});
  return {
    policyVersion:LOCAL_LEARNING_OUTCOMES_POLICY,windowDays,
    independentFirst:summarise(independent),assistedFirst:summarise(assisted),retries:summarise(retries),
    latestUnique:summarise(latestUniqueAttempts(attempts)),
    delayedReviews:delayed.length,successfulDelayedCards:new Set(delayed.filter(event=>event.grade>=3).map(event=>event.cardId)).size,
    lexicalRetentionLessons:retained.confirmedLessonIds.length,
    revisedWritingTasks:new Set(productiveVersions.filter(item=>item.status==="revised").map(item=>item.taskId)).size,
    delayedTransferTasks:(state.delayedTransferTasks??[]).filter(task=>task.status==="completed"&&task.completedAt&&Date.parse(task.completedAt)>=from).length,
    visibleSessionMinutes:Math.floor(Object.values(state.dailySessions).filter(session=>session.date>=oldest&&session.date<=today).reduce((sum,session)=>sum+(session.activeSeconds??0),0)/60),
    evidenceBoundary:"local-descriptive-observation-no-causal-feature-effect-no-official-language-quality" as const,
    interpretationAr:independent.length<10?"العينة المستقلة صغيرة؛ لا نستنتج أثرًا تعليميًا من النسبة أو عدد الميزات.":"يمكن مقارنة أنماط الاستقلال والمساعدة والاحتفاظ، لكن اختلاف صعوبة المهام والظروف يمنع نسبة التغير إلى ميزة بعينها.",
  };
}
