import type { LearningState } from "@/types/learning";
import { latestLearningContract } from "./learning-agreement";
import { localSessionDate } from "./session-signals";

/** Explicit onboarding/check-in may start an optional session; rest never fabricates progress. */
export function isPlannedRestDay(state:LearningState,now=new Date()):boolean{
  if(!state.profile)return false;
  const today=localSessionDate(now);
  if(state.dailySessions[today]?.checkedInAt)return false;
  if(state.profile.createdAt.slice(0,10)===today&&!state.exerciseAttempts.length)return false;
  const contract=latestLearningContract(state.learningContracts);
  const weekday=now.getDay()===0?7:now.getDay();
  return contract?!contract.studyWeekdays.includes(weekday as 1|2|3|4|5|6|7):weekday===7;
}
