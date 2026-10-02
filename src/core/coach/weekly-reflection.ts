import type { LearningState, WeeklyReflectionAdjustment, WeeklyReflectionObstacle, WeeklyReflectionRecord, WeeklyReflectionSuccess } from "@/types/learning";

export const WEEKLY_REFLECTION_POLICY_VERSION="independent-weekly-reflection-v1" as const;
export const WEEKLY_REFLECTION_BOUNDARY="weekly-learner-planning-only-no-daily-reflection-reuse-mastery-gate-or-psychological-inference" as const;

function atLocalMidnight(date:Date){return new Date(date.getFullYear(),date.getMonth(),date.getDate())}
function addDays(date:Date,days:number){const next=new Date(date);next.setDate(next.getDate()+days);return next}
function localDate(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}

export function weeklyReflectionBounds(now=new Date()){
  const value=atLocalMidnight(now);const day=value.getDay();const weekStart=addDays(value,-(day===0?6:day-1));
  return{weekStart:localDate(weekStart),weekEnd:localDate(addDays(weekStart,6))};
}

export function saveWeeklyReflection(
  state:LearningState,
  input:{whatWorked:WeeklyReflectionSuccess[];obstacles:WeeklyReflectionObstacle[];oneAdjustment:WeeklyReflectionAdjustment;note:string},
  now=new Date(),
):LearningState{
  const bounds=weeklyReflectionBounds(now);const id=`weekly-reflection-${bounds.weekStart}`;
  const previous=state.weeklyReflections.find((item)=>item.id===id);
  const unique=<T extends string>(values:T[],max:number)=>[...new Set(values)].slice(0,max);
  const record:WeeklyReflectionRecord={
    id,policyVersion:WEEKLY_REFLECTION_POLICY_VERSION,...bounds,
    whatWorked:unique(input.whatWorked,6),obstacles:unique(input.obstacles,6),oneAdjustment:input.oneAdjustment,
    note:input.note.trim().slice(0,400),source:"weekly-form-only",dailyReflectionReuseConsent:false,
    evidenceBoundary:WEEKLY_REFLECTION_BOUNDARY,createdAt:previous?.createdAt??now.toISOString(),updatedAt:now.toISOString(),
  };
  return{...state,weeklyReflections:[...state.weeklyReflections.filter((item)=>item.id!==id),record]};
}

export function latestWeeklyReflections(state:LearningState,limit=8){return [...state.weeklyReflections].sort((a,b)=>b.weekStart.localeCompare(a.weekStart)).slice(0,limit)}
