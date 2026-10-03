import type { LearningState } from "@/types/learning";
import { effectiveSessionMinutes, localSessionDate } from "@/core/coach/session-signals";
import { buildDueReviewQueue } from "@/core/srs/review-queue";

export function dailyReviewQuota(state:LearningState,now=new Date()){
  const minutes=effectiveSessionMinutes(state,now);
  const required=minutes===10?3:minutes===20?4:minutes===30?5:minutes===45?6:minutes===60?10:12;
  const today=localSessionDate(now);
  const reviewed=new Set(state.reviewEvents.filter(event=>event.evidenceScope!=="personal-error-remediation"&&Date.parse(event.reviewedAt)<=now.getTime()&&localSessionDate(new Date(event.reviewedAt))===today).map(event=>event.cardId)).size;
  return {required,reviewed,reached:reviewed>=required,boundary:"bounded-review-effort-not-card-mastery-or-backlog-debt" as const};
}

/**
 * خطة تفريغ كومة المراجعة (ADR-107 · م5): كم في الطابور، وكم يسع يوم المتعلم المُعلَن، وكم
 * يوم دراسة يلزم خطيًا. تُحسب من نفس الطابور الذي يقرأه المدرّب والتقرير — فلا رقمين للحقيقة،
 * ولا إخفاء لبطاقة: ما لم يُراجَع يبقى مستحقًا.
 */
export function reviewBacklogPlan(state:LearningState,now=new Date()){
  const due=buildDueReviewQueue(state,now).length;
  const perDay=Math.max(1,dailyReviewQuota(state,now).required);
  return {due,perDay,studyDaysToClear:due>0?Math.ceil(due/perDay):0,boundary:"linear-drain-estimate-no-commitment-no-hidden-cards"} as const;
}
