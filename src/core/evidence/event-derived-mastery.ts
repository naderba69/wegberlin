import type { LearningState, MasteryEvidenceEvent, ReviewEvent } from "@/types/learning";

export const EVENT_DERIVED_MASTERY_POLICY="event-derived-mastery-v1" as const;
export const EVENT_DERIVED_MASTERY_BOUNDARY="event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit" as const;

const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value*1000)/1000));
const validNumber=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value);

function eventSource(key:string):MasteryEvidenceEvent["source"]{
  if(key==="diagnostic")return"diagnostic-assessment";
  if(/^[ab][12]-\d{2}$/i.test(key))return"lesson-evidence";
  if(key.startsWith("module-"))return"module-assessment";
  if(key.startsWith("level-"))return"level-assessment";
  if(key.startsWith("exam-target-"))return"targeted-exam";
  if(key.startsWith("full-exam-"))return"full-exam-workflow";
  return"other-learning-evidence";
}

function addedReviewEvents(current:LearningState,candidate:LearningState){const ids=new Set(current.reviewEvents.map((event)=>event.id));return candidate.reviewEvents.filter((event)=>!ids.has(event.id))}
function addedEvidenceRefs(current:LearningState,candidate:LearningState,key:string,reviews:ReviewEvent[]){
 const refs:string[]=[];
 const attemptIds=new Set(current.exerciseAttempts.map((item)=>item.id));for(const item of candidate.exerciseAttempts)if(!attemptIds.has(item.id))refs.push(`exercise:${item.id}`);
 for(const item of reviews)if(item.lessonId===key)refs.push(`review:${item.id}`);
 const lessonIds=new Set(current.completedLessonIds);for(const id of candidate.completedLessonIds)if(!lessonIds.has(id))refs.push(`lesson-complete:${id}`);
 if(candidate.diagnosticResult?.completedAt!==current.diagnosticResult?.completedAt)refs.push(`diagnostic:${candidate.diagnosticResult?.completedAt??"cleared"}`);
 if(candidate.studyHistory.length>current.studyHistory.length)candidate.studyHistory.slice(current.studyHistory.length).forEach((item,index)=>refs.push(`study:${item.date}:${item.minutes}:${item.evidenceCount}:${current.studyHistory.length+index}`));
 const sessionIds=new Set(Object.keys(current.examSessions));for(const id of Object.keys(candidate.examSessions))if(!sessionIds.has(id)||candidate.examSessions[id]!==current.examSessions[id])refs.push(`exam-session:${id}:${candidate.examSessions[id].status}`);
 return[...new Set(refs)].slice(0,64);
}
function stableEventId(source:MasteryEvidenceEvent["source"],key:string,operation:MasteryEvidenceEvent["operation"],refs:string[],createdAt:string,index:number){const seed=(refs.length?refs.join("+"):createdAt).replace(/[^a-zA-Z0-9:._-]+/g,"-").slice(0,280);return`mastery-event:${source}:${key}:${operation}:${seed}:${index}`}

export function captureMasteryMutationEvents(current:LearningState,candidate:LearningState,now=new Date()):LearningState{
 const keys=[...new Set([...Object.keys(current.mastery),...Object.keys(candidate.mastery)])].filter((key)=>current.mastery[key]!==candidate.mastery[key]).sort();
 if(!keys.length)return candidate;
 const reviews=addedReviewEvents(current,candidate);const createdAt=now.toISOString();const existing=new Map(candidate.masteryEvidenceEvents.map((event)=>[event.id,event]));
 keys.forEach((key,index)=>{
   const previousValue=validNumber(current.mastery[key])?current.mastery[key]:undefined;const nextValue=validNumber(candidate.mastery[key])?candidate.mastery[key]:undefined;const source=eventSource(key);const refs=addedEvidenceRefs(current,candidate,key,reviews);
   const reviewDelta=reviews.filter((event)=>event.lessonId===key).reduce((sum,event)=>sum+event.masteryDelta,0);
   const increment=reviewDelta!==0&&previousValue!==undefined&&nextValue!==undefined&&clamp(previousValue+reviewDelta)===nextValue;
   const operation:MasteryEvidenceEvent["operation"]=nextValue===undefined?"delete":increment?"increment":"set";
   const value=operation==="increment"?reviewDelta:nextValue;
   const event:MasteryEvidenceEvent={id:stableEventId(source,key,operation,refs,createdAt,index),policyVersion:EVENT_DERIVED_MASTERY_POLICY,key,operation,value,previousValue,resultingValue:nextValue,source,evidenceRefs:refs,evidenceBoundary:EVENT_DERIVED_MASTERY_BOUNDARY,createdAt};
   existing.set(event.id,event);
 });
 const masteryEvidenceEvents=[...existing.values()].sort((left,right)=>Date.parse(left.createdAt)-Date.parse(right.createdAt)||left.id.localeCompare(right.id));
 return{...candidate,masteryEvidenceEvents,mastery:recalculateMasteryFromEvidence(candidate.mastery,masteryEvidenceEvents)};
}

export function recalculateMasteryFromEvidence(legacyMastery:Record<string,number>,events:MasteryEvidenceEvent[]){
 const result={...legacyMastery};const ordered=[...new Map(events.map((event)=>[event.id,event])).values()].sort((left,right)=>Date.parse(left.createdAt)-Date.parse(right.createdAt)||left.id.localeCompare(right.id));const initialized=new Set<string>();
 for(const event of ordered){
   if(!initialized.has(event.key)){if(event.operation==="increment")result[event.key]=clamp(event.previousValue??0);initialized.add(event.key)}
   if(event.operation==="delete"){delete result[event.key];continue}
   if(event.operation==="set"&&event.value!==undefined){result[event.key]=clamp(event.value);continue}
   if(event.operation==="increment"&&event.value!==undefined)result[event.key]=clamp((result[event.key]??event.previousValue??0)+event.value);
 }
 return result;
}

export function normalizeEventDerivedMastery(state:LearningState):LearningState{return{...state,mastery:recalculateMasteryFromEvidence(state.mastery,state.masteryEvidenceEvents)}}

export function masteryDerivationSummary(state:LearningState){const eventKeys=new Set(state.masteryEvidenceEvents.map((event)=>event.key));const legacyFallbackKeys=Object.keys(state.mastery).filter((key)=>!eventKeys.has(key)).sort();return{policyVersion:EVENT_DERIVED_MASTERY_POLICY,eventCount:state.masteryEvidenceEvents.length,eventDerivedKeys:eventKeys.size,legacyFallbackKeys,legacyFallbackCount:legacyFallbackKeys.length,evidenceBoundary:EVENT_DERIVED_MASTERY_BOUNDARY}}
