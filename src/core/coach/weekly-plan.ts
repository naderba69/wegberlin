import type { LearningState } from "@/types/learning";
import { getCoachTarget } from "./coach";
import { effectiveSessionMinutes, localSessionDate } from "./session-signals";

export type WeeklySlotKind = "review" | "lesson" | "listening" | "writing" | "speaking" | "exam" | "reflection" | "recovery";
/** P0-266: «يوم سماح» = يوم دراسة فائت بلا دين، ضمن سقف أسبوعي معلن. */
export const GRACE_DAYS_PER_WEEK = 1;
export type WeeklyDayStatus = "complete" | "grace" | "missed" | "today" | "upcoming" | "rest";
export type WeeklyPlanSlot = { id:string;kind:WeeklySlotKind;titleAr:string;minutes:number;href:string };
export type WeeklyPlanDay = { date:string;weekdayAr:string;status:WeeklyDayStatus;budgetMinutes:number;slots:WeeklyPlanSlot[];recoverySourceDate?:string };
export type WeeklyPlan = { weekStart:string;weekEnd:string;plannedMinutes:number;completedStudyDays:number;
  /** كل أيام الدراسة الماضية بلا دراسة، بما فيها أيام السماح. */
  missedStudyDays:number;
  /** أيام السماح المستخدمة هذا الأسبوع: بلا مهمة مؤجلة ولا مضاعفة. */
  graceDaysUsed:number;graceAllowance:number;graceDaysRemaining:number;graceDates:string[];
  /** أيام الفوات التي تجاوزت سقف السماح: هي وحدها التي تُنقل منها مهمة استعادة. */
  debtDays:number;deferredCount:number;days:WeeklyPlanDay[] };

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
    [{id:"exam-sat",kind:"exam",titleAr:"تدريب صيغة الامتحان",href:"/exams",weight:3},{id:"reflection-sat",kind:"reflection",titleAr:"مراجعة الأسبوع",href:"/progress",weight:1}],
    [],
  ];
  return rows[index];
}

function dayBudget(state:LearningState,date:string,index:number,today:string,now:Date):number{
  if(index===6)return 0;
  const session=state.dailySessions[date];
  if(date===today)return effectiveSessionMinutes(state,now);
  if(session)return session.energyBefore<=2?Math.min(session.availableMinutes,20):session.availableMinutes;
  return state.profile?.dailyMinutes??45;
}

export function buildWeeklyPlan(state:LearningState,now=new Date()):WeeklyPlan{
  const start=mondayOf(now);
  const today=localSessionDate(now);
  const lessonHref=getCoachTarget(state).href;
  const baseDays:WeeklyPlanDay[]=Array.from({length:7},(_,index)=>{
    const date=localSessionDate(addDays(start,index));
    const budget=dayBudget(state,date,index,today,now);
    const studied=studiedOn(state,date);
    const status:WeeklyDayStatus=index===6?"rest":date===today?"today":date<today?(studied?"complete":"missed"):"upcoming";
    return{date,weekdayAr:dayNames[index],status,budgetMinutes:budget,slots:allocateMinutes(budget,definitionsForDay(index,lessonHref))};
  });
  const missed=baseDays.filter((day)=>day.status==="missed");
  // يوم السماح أولًا: أول GRACE_DAYS_PER_WEEK أيام فائتة تُغفر بلا دين ولا استعادة،
  // وما بعدها فقط هو الذي يُنقل منه مهمة واحدة داخل ميزانية اليوم (لا مضاعفة).
  const graceDates=missed.slice(0,GRACE_DAYS_PER_WEEK).map((day)=>day.date);
  const graceSet=new Set(graceDates);
  const debt=missed.slice(GRACE_DAYS_PER_WEEK);
  const recoveryDay=baseDays.find((day)=>day.status==="today"||day.status==="upcoming");
  const days=baseDays.map((day)=>{
    const forgiven=graceSet.has(day.date);
    if(!debt.length||day!==recoveryDay||day.status==="rest")return forgiven?{...day,status:"grace" as WeeklyDayStatus}:day;
    const definitions:SlotDefinition[]=[{id:`recovery-${debt[0].date}`,kind:"recovery",titleAr:"استعادة مهمة فائتة واحدة",href:lessonHref,weight:1},...definitionsForDay(baseDays.indexOf(day),lessonHref).map((item)=>({...item,weight:item.weight*3}))];
    return{...day,recoverySourceDate:debt[0].date,slots:allocateMinutes(day.budgetMinutes,definitions)};
  });
  return{
    weekStart:days[0].date,
    weekEnd:days[6].date,
    plannedMinutes:days.reduce((sum,day)=>sum+day.budgetMinutes,0),
    completedStudyDays:days.filter((day)=>day.status==="complete").length,
    missedStudyDays:missed.length,
    graceAllowance:GRACE_DAYS_PER_WEEK,
    graceDaysUsed:graceDates.length,
    graceDaysRemaining:Math.max(0,GRACE_DAYS_PER_WEEK-graceDates.length),
    graceDates,
    debtDays:debt.length,
    deferredCount:Math.max(0,debt.length-(recoveryDay?1:0)),
    days,
  };
}

export function weeklyBudgetLabel(minutes:number){const hours=Math.floor(minutes/60),remainder=minutes%60;return hours?`${hours} س ${remainder?`${remainder} د`:""}`:`${minutes} د`}
