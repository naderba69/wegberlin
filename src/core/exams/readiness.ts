import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles } from "@/data/exam-profiles";
import type { PublishedTargetedExamSimulation } from "@/types/exam";
import type { ExamProvider, LearningState } from "@/types/learning";

export type ExamReadinessStatus="no-evidence"|"building"|"needs-work"|"strengthening"|"strong-evidence";
export type ExamModuleReadiness={
  moduleId:string;titleAr:string;titleDe:string;skill:PublishedTargetedExamSimulation["skill"];
  totalTasks:number;attemptedTasks:number;requiredSamples:number;coveragePercent:number;
  accuracyPercent:number|null;revisionOrRetryCount:number;status:ExamReadinessStatus;
  statusAr:string;detailAr:string;nextTaskId?:string;nextHref:string;
};
export const READINESS_FORECAST_POLICY_VERSION="evidence-velocity-readiness-range-v1" as const;
export type ReadinessForecastStatus="insufficient-data"|"range"|"evidence-threshold-met";
export type ReadinessForecast={policyVersion:typeof READINESS_FORECAST_POLICY_VERSION;provider:ExamProvider;status:ReadinessForecastStatus;remainingEvidenceUnits:number;observationDays:number;activeEvidenceDays:number;evidenceDaysPerWeek:number|null;minimumWeeks:number|null;maximumWeeks:number|null;confidence:"low"|"medium";messageAr:string;assumptionsAr:string[];evidenceBoundary:"planning-range-not-pass-date-official-score-or-guarantee"};
export type ExamReadinessReport={provider:ExamProvider;modules:ExamModuleReadiness[];readyModuleCount:number;totalModules:number;weakestModule:ExamModuleReadiness;forecast:ReadinessForecast;boundaryAr:string};

const moduleSkill:Record<ExamProvider,Record<string,PublishedTargetedExamSimulation["skill"]>>={
  "goethe-b2":{lesen:"reading",hoeren:"listening",schreiben:"writing",sprechen:"speaking"},
  "telc-deutsch-b2":{lesen:"reading",sprachbausteine:"language-elements",hoeren:"listening",schreiben:"writing",sprechen:"speaking"},
};
const statusLabels:Record<ExamReadinessStatus,string>={"no-evidence":"بلا دليل","building":"عينة أولية","needs-work":"يحتاج علاجًا","strengthening":"قيد التثبيت","strong-evidence":"دليل تدريبي قوي"};
const isReceptive=(skill:PublishedTargetedExamSimulation["skill"])=>skill==="reading"||skill==="listening"||skill==="language-elements";

function attemptedTaskIds(state:LearningState,tasks:PublishedTargetedExamSimulation[],skill:PublishedTargetedExamSimulation["skill"]){
  if(isReceptive(skill))return new Set(tasks.filter((task)=>typeof state.mastery[`exam-target-${task.id}`]==="number").map((task)=>task.id));
  if(skill==="writing")return new Set(state.writingSubmissions.filter((item)=>item.status!=="draft"&&tasks.some((task)=>task.id===item.taskId)).map((item)=>item.taskId));
  return new Set(state.speakingAttempts.filter((item)=>tasks.some((task)=>task.id===item.taskId)).map((item)=>item.taskId));
}

function productiveRepeatCount(state:LearningState,tasks:PublishedTargetedExamSimulation[],skill:PublishedTargetedExamSimulation["skill"]){
  if(skill==="writing")return new Set(state.writingSubmissions.filter((item)=>item.status==="revised"&&tasks.some((task)=>task.id===item.taskId)).map((item)=>item.taskId)).size;
  if(skill==="speaking"){const attempts=state.speakingAttempts.filter((item)=>tasks.some((task)=>task.id===item.taskId));return Math.max(0,attempts.length-new Set(attempts.map((item)=>item.taskId)).size)}
  return 0;
}

function nextTaskForModule(state:LearningState,tasks:PublishedTargetedExamSimulation[],skill:PublishedTargetedExamSimulation["skill"],attemptedIds:Set<string>){
  const unattempted=tasks.find((task)=>!attemptedIds.has(task.id));
  if(unattempted)return unattempted;
  if(isReceptive(skill))return [...tasks].sort((left,right)=>(state.mastery[`exam-target-${left.id}`]??101)-(state.mastery[`exam-target-${right.id}`]??101))[0];
  if(skill==="writing")return tasks.find((task)=>!state.writingSubmissions.some((item)=>item.taskId===task.id&&item.status==="revised"))??tasks[0];
  if(skill==="speaking")return [...tasks].sort((left,right)=>state.speakingAttempts.filter((item)=>item.taskId===left.id).length-state.speakingAttempts.filter((item)=>item.taskId===right.id).length)[0];
  return tasks[0];
}

function moduleStatus(input:{attempted:number;required:number;accuracy:number|null;repeatCount:number;skill:PublishedTargetedExamSimulation["skill"]}):ExamReadinessStatus{
  if(input.attempted===0)return"no-evidence";
  if(input.attempted<input.required)return"building";
  if(isReceptive(input.skill)&&input.accuracy!==null&&input.accuracy<60)return"needs-work";
  if(isReceptive(input.skill)&&input.accuracy!==null&&input.accuracy>=80)return"strong-evidence";
  if(!isReceptive(input.skill)&&input.repeatCount>0)return"strong-evidence";
  return"strengthening";
}

function localDateStamp(date:Date){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function addLocalDays(date:Date,days:number){const next=new Date(date.getFullYear(),date.getMonth(),date.getDate());next.setDate(next.getDate()+days);return next}
function remainingUnits(modules:ExamModuleReadiness[]){return modules.reduce((sum,module)=>{if(module.status==="strong-evidence")return sum;const sampleGap=Math.max(0,module.requiredSamples-module.attemptedTasks);if(module.status==="needs-work")return sum+sampleGap+2;if(module.status==="strengthening")return sum+Math.max(1,sampleGap);return sum+sampleGap;},0)}

export function buildReadinessForecast(state:LearningState,provider:ExamProvider,modules:ExamModuleReadiness[],now=new Date()):ReadinessForecast{
  const remainingEvidenceUnits=remainingUnits(modules);
  const today=localDateStamp(now);
  const oldestAllowed=localDateStamp(addLocalDays(now,-27));
  const profileStart=state.profile?.createdAt?.slice(0,10);
  const observationStart=profileStart&&/^\d{4}-\d{2}-\d{2}$/.test(profileStart)&&profileStart>oldestAllowed?profileStart:oldestAllowed;
  const observationStartDate=new Date(`${observationStart}T12:00:00`);
  const observationDays=Math.max(1,Math.min(28,Math.floor((new Date(`${today}T12:00:00`).getTime()-observationStartDate.getTime())/86_400_000)+1));
  const activeEvidenceDays=new Set(state.studyHistory.filter((item)=>item.date>=observationStart&&item.date<=today&&item.evidenceCount>0).map((item)=>item.date)).size;
  const base={policyVersion:READINESS_FORECAST_POLICY_VERSION,provider,remainingEvidenceUnits,observationDays,activeEvidenceDays,evidenceBoundary:"planning-range-not-pass-date-official-score-or-guarantee" as const};
  const assumptionsAr=["وحدة الفجوة تعني عينة جديدة أو إعادة/مراجعة مطلوبة، لا نقطة امتحان.","الوتيرة تحسب أيامًا حديثة أنتجت دليلًا محفوظًا، لا عدد ساعات الحضور.","قد يتسع النطاق إذا تغير الوقت أو بقيت فجوة جودة لا يقيسها التطبيق."];
  if(remainingEvidenceUnits===0)return{...base,status:"evidence-threshold-met",evidenceDaysPerWeek:null,minimumWeeks:null,maximumWeeks:null,confidence:"medium",messageAr:"اكتملت عتبات الدليل التدريبي الداخلية لهذه الجهة. لا نعرض تاريخ نجاح؛ راجع الأدلة وخطط لمراجعة بشرية ومحاكاة كاملة.",assumptionsAr};
  if(observationDays<7||activeEvidenceDays<3)return{...base,status:"insufficient-data",evidenceDaysPerWeek:null,minimumWeeks:null,maximumWeeks:null,confidence:"low",messageAr:`لا تكفي الوتيرة الحديثة لبناء نطاق: نحتاج 3 أيام منتجة للدليل خلال نافذة لا تقل عن 7 أيام. الفجوة الحالية ${remainingEvidenceUnits} وحدات تدريبية.`,assumptionsAr};
  const evidenceDaysPerWeek=Math.round(activeEvidenceDays/(observationDays/7)*10)/10;
  const optimisticRate=Math.max(.5,evidenceDaysPerWeek*1.35);
  const conservativeRate=Math.max(.25,evidenceDaysPerWeek*.65);
  const minimumWeeks=Math.max(1,Math.ceil(remainingEvidenceUnits/optimisticRate));
  const maximumWeeks=Math.max(minimumWeeks+1,Math.min(52,Math.ceil(remainingEvidenceUnits/conservativeRate)));
  const confidence=observationDays>=21&&activeEvidenceDays>=6?"medium":"low" as const;
  return{...base,status:"range",evidenceDaysPerWeek,minimumWeeks,maximumWeeks,confidence,messageAr:`بوتيرة ${evidenceDaysPerWeek} أيام دليل أسبوعيًا، نطاق التخطيط الحالي نحو ${minimumWeeks}–${maximumWeeks} أسابيع لإغلاق فجوة العينة الداخلية. هذا نطاق متغير وليس موعد نجاح.`,assumptionsAr};
}

export function buildExamReadiness(state:LearningState,provider:ExamProvider,now=new Date()):ExamReadinessReport{
  const profile=examProfiles[provider];
  const providerTasks=allPublishedExamTasks.filter((task)=>task.provider===provider);
  const modules=profile.modules.map((module):ExamModuleReadiness=>{
    const skill=moduleSkill[provider][module.id];
    const tasks=providerTasks.filter((task)=>task.skill===skill);
    const attemptedIds=attemptedTaskIds(state,tasks,skill);
    const attempted=attemptedIds.size;
    const requiredSamples=Math.min(6,Math.max(3,Math.ceil(tasks.length*.15)));
    const scores=tasks.flatMap((task)=>{const value=state.mastery[`exam-target-${task.id}`];return typeof value==="number"?[value]:[]});
    const accuracyPercent=scores.length?Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length):null;
    const repeatCount=productiveRepeatCount(state,tasks,skill);
    const status=moduleStatus({attempted,required:requiredSamples,accuracy:accuracyPercent,repeatCount,skill});
    const next=nextTaskForModule(state,tasks,skill,attemptedIds);
    const productive=!isReceptive(skill);
    const detailAr=attempted===0?"لا توجد محاولة محفوظة من مهام هذه الوحدة.":productive?`${attempted}/${tasks.length} مهام بدليل، و${repeatCount} مهام لها إعادة أو نسخة منقحة. المؤشر لا يحكم الجودة اللغوية.`:`${attempted}/${tasks.length} مهام، ومتوسط أحدث النتائج الداخلية ${accuracyPercent}%. لا يُحوّل إلى نقاط رسمية.`;
    return{moduleId:module.id,titleAr:module.titleAr,titleDe:module.titleDe,skill,totalTasks:tasks.length,attemptedTasks:attempted,requiredSamples,coveragePercent:Math.round(attempted/Math.max(tasks.length,1)*100),accuracyPercent,revisionOrRetryCount:repeatCount,status,statusAr:statusLabels[status],detailAr,nextTaskId:next?.id,nextHref:next?`/exams/${provider}/${next.id}`:"/exams"};
  });
  const rank:Record<ExamReadinessStatus,number>={"no-evidence":0,"needs-work":1,"building":2,"strengthening":3,"strong-evidence":4};
  const weakestModule=[...modules].sort((left,right)=>rank[left.status]-rank[right.status]||left.coveragePercent-right.coveragePercent)[0];
  return{provider,modules,readyModuleCount:modules.filter((module)=>module.status==="strong-evidence").length,totalModules:modules.length,weakestModule,forecast:buildReadinessForecast(state,provider,modules,now),boundaryAr:provider==="goethe-b2"?"هذه مؤشرات تدريب منفصلة لكل وحدة، وليست نتيجة Goethe أو تطبيقًا آليًا لحد 60/100.":"هذه مؤشرات تدريب منفصلة؛ لا تجمع نقاطًا رسمية ولا تطبق قاعدة Goethe على telc."};
}
