import type { LearningState } from "@/types/learning";
import { effectiveSessionMinutes, localSessionDate } from "@/core/coach/session-signals";

export function dailyReviewQuota(state:LearningState,now=new Date()){
  const minutes=effectiveSessionMinutes(state,now);
  const required=minutes===10?3:minutes===20?4:minutes===30?5:minutes===45?6:minutes===60?10:12;
  const today=localSessionDate(now);
  const reviewed=new Set(state.reviewEvents.filter(event=>event.evidenceScope!=="personal-error-remediation"&&Date.parse(event.reviewedAt)<=now.getTime()&&localSessionDate(new Date(event.reviewedAt))===today).map(event=>event.cardId)).size;
  return {required,reviewed,reached:reviewed>=required,boundary:"bounded-review-effort-not-card-mastery-or-backlog-debt" as const};
}
