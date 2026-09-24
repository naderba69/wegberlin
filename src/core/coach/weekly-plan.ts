import type { LearningState } from "@/types/learning";
import { getCoachTarget } from "./coach";
import { effectiveSessionMinutes, localSessionDate } from "./session-signals";
import { CONTINUITY_POLICY_VERSION, weeklyGraceCandidate } from "./continuity";
import { planningPresetMinutes } from "./intensity-presets";

export type WeeklySlotKind = "review" | "lesson" | "listening" | "writing" | "speaking" | "exam" | "reflection" | "recovery";
export type WeeklyDayStatus = "complete" | "missed" | "grace" | "today" | "upcoming" | "rest";
export type WeeklyPlanSlot = { id:string;kind:WeeklySlotKind;titleAr:string;minutes:number;href:string };
export type WeeklyPlanDay = { date:string;weekdayAr:string;status:WeeklyDayStatus;budgetMinutes:number;slots:WeeklyPlanSlot[];recoverySourceDate?:string };
export const WEEKLY_TIME_COMPARISON_POLICY_VERSION="weekly-planned-actual-no-blame-v1" as const;
export type WeeklyTimeComparisonStatus="no-elapsed-plan"|"within-range"|"less-recorded"|"more-recorded";
export type WeeklyTimeComparison={policyVersion:typeof WEEKLY_TIME_COMPARISON_POLICY_VERSION;throughDate:string;plannedToDateMinutes:number;actualRecordedMinutes:number;differenceMinutes:number;absoluteDifferenceMinutes:number;toleranceMinutes:number;status:WeeklyTimeComparisonStatus;messageAr:string;evidenceBoundary:"recorded-study-minutes-vs-plan-no-blame-penalty-debt-or-mastery"};
export type WeeklyPlan = { weekStart:string;weekEnd:string;plannedMinutes:number;completedStudyDays:number;missedStudyDays:number;deferredCount:number;graceDayDate:string|null;continuityPolicyVersion:typeof CONTINUITY_POLICY_VERSION;timeComparison:WeeklyTimeComparison;days:WeeklyPlanDay[] };

type SlotDefinition = Omit<WeeklyPlanSlot,"minutes"> & { weight:number };
const dayNames=["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];

function atLocalMidnight(date:Date){return new Date(date.getFullYear(),date.getMonth(),date.getDate())}
function addDays(date:Date,days:number){const next=new Date(date);next.setDate(next.getDate()+days);return next}
function mondayOf(date:Date){const value=atLocalMidnight(date);const day=value.getDay();return addDays(value,-(day===0?6:day-1))}
function studiedOn(state:LearningState,date:string){return state.studyHistory.some((item)=>item.date===date&&(item.minutes>0||item.evidenceCount>0))||state.completedBlockIds.some((id)=>id.startsWith(`${date}:`))}

function allocateMinutes(total:number,definitions:SlotDefinition[]):WeeklyPlanSlot[]{
  if(total<=0||definitions.length===0)return[];
  const weight=definitions.reduce((sum,item)=>sum+item.weight,0);
  const raw=definitions.map((item)=>total*item.weight/weight);
  const allocated=raw.map(Math.floor);
  let remainder=total-allocated.reduce((sum,value)=>sum+value,0);
  const order=raw.map((value,index)=>({index,fraction:value-Math.floor(value)})).sort((left,right)=>right.fraction-left.fraction);
  for(let index=0;remainder>0;index=(index+1)%order.length,remainder-=1)allocated[order[index].index]+=1;
  return definitions.map((definition,index)=>({id:definition.id,kind:definition.kind,titleAr:definition.titleAr,href:definition.href,minutes:allocated[index]})).filter((item)=>item.minutes>0);
}

function definitionsForDay(index:number,lessonHref:string):SlotDefinition[]{
  const rows:SlotDefinition[][]=[
    [{id:"review-mon",kind:"review",titleAr:"استرجاع الأسبوع",href:"/review",weight:1},{id:"lesson-mon",kind:"lesson",titleAr:"هدف المنهج",href:lessonHref,weight:2}],
    [{id:"listening-tue",kind:"listening",titleAr:"استماع وفهم",href:"/library",weight:1},{id:"lesson-tue",kind:"lesson",titleAr:"تثبيت الهدف",href:lessonHref,weight:2}],
    [{id:"writing-wed",kind:"writing",titleAr:"كتابة مستقلة",href:"/writing",weight:2},{id:"review-wed",kind:"review",titleAr:"مراجعة قصيرة",href:"/review",weight:1}],
    [{id:"speaking-thu",kind:"speaking",titleAr:"محادثة أو تسجيل",href:"/speaking",weight:2},{id:"lesson-thu",kind:"lesson",titleAr:"نقل هدف الدرس",href:lessonHref,weight:1}],
    [{id:"review-fri",kind:"review",titleAr:"مراجعة تراكمية",href:"/review",weight:1},{id:"lesson-fri",kind:"lesson",titleAr:"هدف المنهج",href:lessonHref,weight:2}],
    [{id:"exam-sat",kind:"exam",titleAr:"تدريب صيغة الامتحان",href:"/exams",weight:3},{id:"reflection-sat",kind:"reflection",titleAr:"تأمل أسبوعي مستقل",href:"/today#weekly-reflection",weight:1}],
    [{id:"lesson-sun",kind:"lesson",titleAr:"جلسة اختيارية خفيفة",href:lessonHref,weight:2},{id:"review-sun",kind:"review",titleAr:"مراجعة هادئة",href:"/review",weight:1}],
  ];
  return rows[index];
}

function dayBudget(state:LearningState,date:string,index:number,today:string,now:Date):number{
  const session=state.dailySessions[date];
  if(index===6&&!session)return 0;
  if(date===today)return effectiveSessionMinutes(state,now);
  if(session)return session.energyBefore<=2?Math.min(session.availableMinutes,20):session.availableMinutes;
  return planningPresetMinutes(state).minutes;
}

export function buildWeeklyTimeComparison(state:LearningState,days:WeeklyPlanDay[],today:string):WeeklyTimeComparison{
  const throughDate=days.some((day)=>day.date===today)?today:today<days[0].date?days[0].date:days.at(-1)?.date??today;
  const elapsedDays=days.filter((day)=>day.date<=throughDate);
  const plannedToDateMinutes=elapsedDays.reduce((sum,day)=>sum+day.budgetMinutes,0);
  const actualRecordedMinutes=state.studyHistory.filter((item)=>item.date>=days[0].date&&item.date<=throughDate).reduce((sum,item)=>sum+item.minutes,0);
  const differenceMinutes=actualRecordedMinutes-plannedToDateMinutes;
  const absoluteDifferenceMinutes=Math.abs(differenceMinutes);
  const toleranceMinutes=Math.max(10,Math.round(plannedToDateMinutes*.15));
  const status:WeeklyTimeComparisonStatus=plannedToDateMinutes===0?"no-elapsed-plan":absoluteDifferenceMinutes<=toleranceMinutes?"within-range":differenceMinutes<0?"less-recorded":"more-recorded";
  const messageAr=status==="no-elapsed-plan"?"لا توجد دقائق مخططة منقضية للمقارنة بعد."
    :status==="within-range"?`الوقت المسجل قريب من المخطط حتى اليوم؛ الفرق ${absoluteDifferenceMinutes} دقيقة ضمن نطاق مرونة ${toleranceMinutes} دقيقة.`
      :status==="less-recorded"?`الوقت المسجل أقل من المخطط حتى اليوم بـ${absoluteDifferenceMinutes} دقيقة. هذه ملاحظة تخطيط فقط؛ عدّل الأيام القادمة إذا تغيّر وقتك، بلا عقوبة أو دين تلقائي.`
        :`الوقت المسجل أكثر من المخطط حتى اليوم بـ${absoluteDifferenceMinutes} دقيقة. هذه ملاحظة وقت فقط ولا تمنح إتقانًا إضافيًا.`;
  return{policyVersion:WEEKLY_TIME_COMPARISON_POLICY_VERSION,throughDate,plannedToDateMinutes,actualRecordedMinutes,differenceMinutes,absoluteDifferenceMinutes,toleranceMinutes,status,messageAr,evidenceBoundary:"recorded-study-minutes-vs-plan-no-blame-penalty-debt-or-mastery"};
}

export function buildWeeklyPlan(state:LearningState,now=new Date()):WeeklyPlan{
  const start=mondayOf(now);
  const today=localSessionDate(now);
  const lessonHref=getCoachTarget(state).href;
  const baseDays:WeeklyPlanDay[]=Array.from({length:7},(_,index)=>{
    const date=localSessionDate(addDays(start,index));
    const budget=dayBudget(state,date,index,today,now);
    const studied=studiedOn(state,date);
    const status:WeeklyDayStatus=index===6&&budget===0?"rest":date===today?"today":date<today?(studied?"complete":"missed"):"upcoming";
    return{date,weekdayAr:dayNames[index],status,budgetMinutes:budget,slots:allocateMinutes(budget,definitionsForDay(index,lessonHref))};
  });
  const graceDayDate=weeklyGraceCandidate(baseDays);
  const graceAppliedDays=baseDays.map((day)=>day.date===graceDayDate?{...day,status:"grace" as const}:day);
  const missed=graceAppliedDays.filter((day)=>day.status==="missed");
  const recoveryDay=graceAppliedDays.find((day)=>day.status==="today"||day.status==="upcoming");
  const days=graceAppliedDays.map((day)=>{
    if(!missed.length||day!==recoveryDay||day.status==="rest")return day;
    const definitions:SlotDefinition[]=[{id:`recovery-${missed[0].date}`,kind:"recovery",titleAr:"استعادة مهمة فائتة واحدة",href:lessonHref,weight:1},...definitionsForDay(graceAppliedDays.indexOf(day),lessonHref).map((item)=>({...item,weight:item.weight*3}))];
    return{...day,recoverySourceDate:missed[0].date,slots:allocateMinutes(day.budgetMinutes,definitions)};
  });
  return{
    weekStart:days[0].date,
    weekEnd:days[6].date,
    plannedMinutes:days.reduce((sum,day)=>sum+day.budgetMinutes,0),
    completedStudyDays:days.filter((day)=>day.status==="complete").length,
    missedStudyDays:missed.length,
    deferredCount:Math.max(0,missed.length-(recoveryDay?1:0)),
    graceDayDate,
    continuityPolicyVersion:CONTINUITY_POLICY_VERSION,
    timeComparison:buildWeeklyTimeComparison(state,days,today),
    days,
  };
}

export function weeklyBudgetLabel(minutes:number){const hours=Math.floor(minutes/60),remainder=minutes%60;return hours?`${hours} س ${remainder?`${remainder} د`:""}`:`${minutes} د`}
