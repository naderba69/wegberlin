import type { LearningState } from "@/types/learning";
import { studyDayKey } from "./session-signals";
import { curriculum } from "@/data/curriculum";
import { buildExamReadiness } from "@/core/exams/readiness";
import { buildWeeklyPlan } from "./weekly-plan";
import { buildDueReviewQueue } from "@/core/srs/review-queue";

export const TARGET_DATE_LOAD_POLICY_VERSION="target-date-workload-risk-v2" as const;
const GATE_MINUTES=60,EXAM_SAMPLE_MINUTES=20;

function dayStart(value:Date){return new Date(value.getFullYear(),value.getMonth(),value.getDate()).getTime()}
export function buildExamTargetForecast(state:LearningState,now=new Date()){
  const targetDate=state.profile?.targetDate;
  const plannedWeeklyMinutes=buildWeeklyPlan(state,now).plannedMinutes;
  const boundary="planning-estimate-no-official-readiness-pass-probability-penalty-or-mastery" as const;
  if(!targetDate)return{policyVersion:TARGET_DATE_LOAD_POLICY_VERSION,status:"no-date" as const,targetDate:null,weeksRemaining:null,remainingStudyMinutes:null,requiredWeeklyMinutes:null,plannedWeeklyMinutes,gapMinutes:null,solutionsAr:["أضف تاريخًا حقيقيًا فقط للتخطيط؛ لا نعد ببلوغ مستوى في عدد ثابت من الأشهر."],evidenceBoundary:boundary};
  const target=Date.parse(`${targetDate}T00:00:00`);const daysRemaining=Math.floor((target-dayStart(now))/86_400_000);const weeksRemaining=Math.max(1,Math.ceil(Math.max(0,daysRemaining+1)/7));
  const remainingLessons=curriculum.filter(lesson=>lesson.status==="published"&&!state.completedLessonIds.includes(lesson.id));
  const lessonMinutes=remainingLessons.reduce((sum,lesson)=>sum+lesson.estimatedMinutes,0);
  // Reserve is explicit planning uncertainty, not an empirically calibrated hours-to-CEFR model.
  const retrievalReserveMinutes=Math.ceil(lessonMinutes*.35);
  const repairReserveMinutes=Math.ceil(lessonMinutes*.2)+state.errors.filter(error=>!error.resolved).length*5;
  const productiveReserveMinutes=remainingLessons.length*10;
  const dueReviewMinutes=Math.ceil(buildDueReviewQueue(state,now).length*45/60);
  const gateMinutes=(["a1","a2","b1","b2"] as const).filter(level=>(state.mastery[`level-${level}-ready`]??0)<100).length*GATE_MINUTES;
  const provider=state.profile?.targetExam??"goethe-b2";const readiness=buildExamReadiness(state,provider);
  const missingExamSamples=readiness.modules.reduce((sum,module)=>sum+Math.max(0,module.requiredSamples-module.attemptedTasks),0);
  const remainingStudyMinutes=lessonMinutes+retrievalReserveMinutes+repairReserveMinutes+productiveReserveMinutes+dueReviewMinutes+gateMinutes+missingExamSamples*EXAM_SAMPLE_MINUTES;
  const requiredWeeklyMinutes=Math.ceil(remainingStudyMinutes/weeksRemaining/5)*5;const gapMinutes=Math.max(0,requiredWeeklyMinutes-plannedWeeklyMinutes);
  const productiveDays=new Set(state.studyHistory.filter(item=>item.evidenceCount>0&&item.date>=studyDayKey(new Date(now.getTime()-28*86_400_000))).map(item=>item.date)).size;
  const acquisitionTimeStatus=productiveDays<7?"insufficient-observation" as const:"still-unmeasured-language-acquisition" as const;
  const status=daysRemaining<0?"past-date" as const:gapMinutes>0?"load-gap" as const:"within-plan" as const;
  const solutionsAr=status==="past-date"?["حدّث التاريخ المستهدف؛ لا نضغط المهام في أيام مضت."]:
    status==="load-gap"?[`يوجد فرق حمل تقديري ${gapMinutes} دقيقة أسبوعيًا؛ غيّر الخطة أو التاريخ إذا كان ذلك واقعيًا، دون دين يومي.`,"قدّم أضعف دليل ولا تضاعف جلسة العودة."]:
      ["ميزانية الأنشطة تغطي هذا التقدير مع احتياطي مراجعة وإصلاح؛ لا يثبت ذلك بلوغ B1/B2 أو جاهزية الامتحان.","راجع النطاق من عينات جديدة ومؤجلة، لا من إنهاء الشاشات فقط."];
  return{policyVersion:TARGET_DATE_LOAD_POLICY_VERSION,status,targetDate,weeksRemaining,remainingStudyMinutes,requiredWeeklyMinutes,plannedWeeklyMinutes,gapMinutes,solutionsAr,acquisitionTimeStatus,productiveDays,breakdown:{lessonMinutes,retrievalReserveMinutes,repairReserveMinutes,productiveReserveMinutes,dueReviewMinutes,gateMinutes,examMinutes:missingExamSamples*EXAM_SAMPLE_MINUTES},assumptions:{gateMinutes:GATE_MINUTES,examSampleMinutes:EXAM_SAMPLE_MINUTES,retrievalReserveRatio:.35,repairReserveRatio:.2,uncalibratedPlanningEstimate:true},evidenceBoundary:boundary};
}
