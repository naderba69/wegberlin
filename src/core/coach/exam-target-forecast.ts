import type { LearningState } from "@/types/learning";
import { curriculum } from "@/data/curriculum";
import { buildExamReadiness } from "@/core/exams/readiness";
import { buildWeeklyPlan } from "./weekly-plan";

export const TARGET_DATE_LOAD_POLICY_VERSION="target-date-workload-risk-v1" as const;
const GATE_MINUTES=45,EXAM_SAMPLE_MINUTES=15;

function dayStart(value:Date){return new Date(value.getFullYear(),value.getMonth(),value.getDate()).getTime()}
export function buildExamTargetForecast(state:LearningState,now=new Date()){
  const targetDate=state.profile?.targetDate;
  if(!targetDate)return{policyVersion:TARGET_DATE_LOAD_POLICY_VERSION,status:"no-date" as const,targetDate:null,weeksRemaining:null,remainingStudyMinutes:null,requiredWeeklyMinutes:null,plannedWeeklyMinutes:buildWeeklyPlan(state,now).plannedMinutes,gapMinutes:null,solutionsAr:["أضف تاريخًا مستهدفًا فقط إذا كان لديك موعد حقيقي؛ الخطة تعمل بدونه."],evidenceBoundary:"planning-estimate-no-official-readiness-pass-probability-penalty-or-mastery" as const};
  const target=Date.parse(`${targetDate}T00:00:00`);const daysRemaining=Math.floor((target-dayStart(now))/86_400_000);const weeksRemaining=Math.max(1,Math.ceil(Math.max(0,daysRemaining+1)/7));
  const lessonMinutes=curriculum.filter((lesson)=>lesson.status==="published"&&!state.completedLessonIds.includes(lesson.id)).reduce((sum,lesson)=>sum+lesson.estimatedMinutes,0);
  const gateMinutes=(["a1","a2","b1","b2"] as const).filter((level)=>(state.mastery[`level-${level}-ready`]??0)<100).length*GATE_MINUTES;
  const provider=state.profile?.targetExam??"goethe-b2";const readiness=buildExamReadiness(state,provider);
  const missingExamSamples=readiness.modules.reduce((sum,module)=>sum+Math.max(0,module.requiredSamples-module.attemptedTasks),0);
  const remainingStudyMinutes=lessonMinutes+gateMinutes+missingExamSamples*EXAM_SAMPLE_MINUTES;
  const requiredWeeklyMinutes=Math.ceil(remainingStudyMinutes/weeksRemaining/5)*5;const plannedWeeklyMinutes=buildWeeklyPlan(state,now).plannedMinutes;const gapMinutes=Math.max(0,requiredWeeklyMinutes-plannedWeeklyMinutes);
  const status=daysRemaining<0?"past-date" as const:gapMinutes>0?"load-gap" as const:"within-plan" as const;
  const solutionsAr=status==="past-date"?["حدّث التاريخ المستهدف؛ لن نضغط المهام في أيام مضت."]:
    status==="load-gap"?[`زد الخطة يدويًا بنحو ${gapMinutes} دقيقة أسبوعيًا إن كان ذلك واقعيًا.`,"أو حرّك التاريخ بدل مضاعفة جلسات العودة.","ابدأ بأضعف دليل حالي ولا تحوّل الفجوة إلى دين يومي."]:
      ["الحمل المخطط يغطي التقدير الحالي؛ احتفظ بيوم الراحة وأعد الحساب بعد كل أسبوع."];
  return{policyVersion:TARGET_DATE_LOAD_POLICY_VERSION,status,targetDate,weeksRemaining,remainingStudyMinutes,requiredWeeklyMinutes,plannedWeeklyMinutes,gapMinutes,solutionsAr,assumptions:{gateMinutes:GATE_MINUTES,examSampleMinutes:EXAM_SAMPLE_MINUTES},evidenceBoundary:"planning-estimate-no-official-readiness-pass-probability-penalty-or-mastery" as const};
}
