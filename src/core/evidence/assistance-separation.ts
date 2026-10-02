import { academicLessonList } from"@/data/academic-lessons";
import type { ExerciseAttempt,LearningState,SupportUsageEvent } from"@/types/learning";

export const ASSISTANCE_SEPARATION_POLICY="guided-independent-support-separation-v1" as const;
export const ASSISTANCE_SEPARATION_BOUNDARY="closed-answer-process-comparison-no-productive-language-quality-cefr-or-mastery-mutation" as const;
export type PracticeMode="guided"|"transfer";
export type SupportMode="independent"|"assisted";
export type AssistanceEvidenceRecord={attemptId:string;lessonId:string;exerciseId:string;practiceMode:PracticeMode;supportMode:SupportMode;correct:boolean;supportEventIds:string[];evidenceBoundary:typeof ASSISTANCE_SEPARATION_BOUNDARY};
export type PerformanceBucket={attempted:number;correct:number;accuracyPercent:number|null};

const practiceModeByExerciseId=new Map<string,PracticeMode>();
for(const lesson of academicLessonList){for(const item of lesson.exercises)practiceModeByExerciseId.set(item.id,"guided");for(const item of [...lesson.reading.questions,...lesson.listening.questions,...lesson.miniTest])practiceModeByExerciseId.set(item.id,"transfer")}

function latestUnique(attempts:ExerciseAttempt[]){const latest=new Map<string,ExerciseAttempt>();for(const attempt of attempts){if(!practiceModeByExerciseId.has(attempt.exerciseId))continue;const key=`${attempt.lessonId}:${attempt.exerciseId}`;const previous=latest.get(key);if(!previous||Date.parse(attempt.createdAt)>=Date.parse(previous.createdAt))latest.set(key,attempt)}return[...latest.values()]}
function directSupportEvents(attempt:ExerciseAttempt,events:SupportUsageEvent[]){const attemptTime=Date.parse(attempt.createdAt);return events.filter((event)=>event.contentId===attempt.exerciseId&&!event.afterCommit&&Date.parse(event.createdAt)<=attemptTime)}
function bucket(records:AssistanceEvidenceRecord[]):PerformanceBucket{return{attempted:records.length,correct:records.filter((record)=>record.correct).length,accuracyPercent:records.length?Math.round(records.filter((record)=>record.correct).length/records.length*100):null}}

export function buildAssistanceSeparatedEvidence(state:LearningState){
 const records=latestUnique(state.exerciseAttempts).map((attempt):AssistanceEvidenceRecord=>{const support=directSupportEvents(attempt,state.supportUsageEvents);return{attemptId:attempt.id,lessonId:attempt.lessonId,exerciseId:attempt.exerciseId,practiceMode:practiceModeByExerciseId.get(attempt.exerciseId)!,supportMode:support.length?"assisted":"independent",correct:attempt.correct,supportEventIds:support.map((event)=>event.id).sort(),evidenceBoundary:ASSISTANCE_SEPARATION_BOUNDARY}});
 const guided=records.filter((record)=>record.practiceMode==="guided");const transfer=records.filter((record)=>record.practiceMode==="transfer");const independent=records.filter((record)=>record.supportMode==="independent");const assisted=records.filter((record)=>record.supportMode==="assisted");const transferIndependent=records.filter((record)=>record.practiceMode==="transfer"&&record.supportMode==="independent");const transferAssisted=records.filter((record)=>record.practiceMode==="transfer"&&record.supportMode==="assisted");
 const needsIndependentTransfer=transferAssisted.length>=2&&(transferIndependent.length<2||(bucket(transferIndependent).accuracyPercent??0)+20<(bucket(transferAssisted).accuracyPercent??0));
 return{policyVersion:ASSISTANCE_SEPARATION_POLICY,records,buckets:{guided:bucket(guided),transfer:bucket(transfer),independent:bucket(independent),assisted:bucket(assisted),transferIndependent:bucket(transferIndependent),transferAssisted:bucket(transferAssisted)},needsIndependentTransfer,recommendationAr:needsIndependentTransfer?"ثبّت عينة نقل جديدة دون تلميح قبل تعميم النجاح المدعوم.":"استمر في جمع عينات نقل مستقلة؛ لا نحول غياب الدعم وحده إلى إتقان.",evidenceBoundary:ASSISTANCE_SEPARATION_BOUNDARY};
}
