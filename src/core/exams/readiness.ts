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
export type ExamReadinessReport={provider:ExamProvider;modules:ExamModuleReadiness[];readyModuleCount:number;totalModules:number;weakestModule:ExamModuleReadiness;boundaryAr:string};

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

export function buildExamReadiness(state:LearningState,provider:ExamProvider):ExamReadinessReport{
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
  return{provider,modules,readyModuleCount:modules.filter((module)=>module.status==="strong-evidence").length,totalModules:modules.length,weakestModule,boundaryAr:provider==="goethe-b2"?"هذه مؤشرات تدريب منفصلة لكل وحدة، وليست نتيجة Goethe أو تطبيقًا آليًا لحد 60/100.":"هذه مؤشرات تدريب منفصلة؛ لا تجمع نقاطًا رسمية ولا تطبق قاعدة Goethe على telc."};
}
