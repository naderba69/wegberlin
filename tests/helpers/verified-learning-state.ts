import { defaultState } from "@/core/portability/db";
import { academicLessonList } from "@/data/academic-lessons";
import { independentProductionTasks } from "@/data/independent-production-tasks";
import { levelAssessmentQuestions } from "@/data/level-assessment-bank";
import type { CEFRLevel, ExerciseAttempt, LearningState, WritingSubmission, SpeakingAttempt } from "@/types/learning";

export const evidenceTestNow = new Date("2026-10-02T08:00:00Z");
export function levelRun(level:CEFRLevel,formId:"A"|"B"="A",at=new Date("2026-10-01T10:00:00Z"),wrong=0):ExerciseAttempt[]{
  const qs=levelAssessmentQuestions(level,formId),runId=`fixture-${level}-${formId}-${at.toISOString()}`;
  return qs.map((q,index)=>({id:`${runId}:${q.id}`,lessonId:`assessment-${level.toLowerCase()}`,exerciseId:q.id,answer:q.options[index<wrong?(q.correctIndex+1)%4:q.correctIndex],answerIndex:index<wrong?(q.correctIndex+1)%4:q.correctIndex,correct:index>=wrong,evidenceContext:{policyVersion:"independent-assessment-v1",kind:"level-check",level,formId,runId,independent:true,expectedItems:qs.length},createdAt:at.toISOString()}));
}
export function independentWriting(level:CEFRLevel,index:number,at=evidenceTestNow):WritingSubmission{
  const task=independentProductionTasks.filter(task=>task.level===level)[index];
  const count=level==="A1"?40:level==="A2"?90:level==="B1"?160:200;
  return{id:`write-${level}-${index}`,taskId:`${task.id}-writing`,text:Array.from({length:count},(_,i)=>i%5===0?"Deutsch":"lernen").join(" "),wordCount:count,version:1,status:"submitted",feedback:[],plan:{audience:"Übungspartner",purpose:"Situation erklären",points:["Ziel","Rückfrage"]},evidenceContext:{policyVersion:"productive-independence-v1",supportUsedBeforeDraft:false,firstDraft:true,taskLevel:level},createdAt:at.toISOString(),updatedAt:at.toISOString()};
}
export function independentSpeaking(level:CEFRLevel,index:number,at=evidenceTestNow):SpeakingAttempt{
  const task=independentProductionTasks.filter(task=>task.level===level)[index];
  return{id:`speak-${level}-${index}`,taskId:`${task.id}-speaking`,durationSeconds:level==="B2"?180:level==="B1"?90:45,selfScore:3,reflection:"مراجعة ذاتية محدودة",selfReview:{listenedBack:true,achievedCriteria:[],clarityScore:3,turnTaking:false,repairUsed:true,preparationNotes:[],supportVisibleDuringRecording:false},createdAt:at.toISOString()};
}
/** Fixtures satisfy provenance, not linguistic quality. Never used as runtime demo data. */
export function verifiedThrough(levels:CEFRLevel[],now=evidenceTestNow):LearningState{
  let state:LearningState={...defaultState,profile:{name:"Test learner",targetExam:"goethe-b2",dailyMinutes:90,arabicSupport:"modern-standard-arabic",currentLevel:levels.at(-1)??"A1",priorExperience:"none",createdAt:"2026-09-01T10:00:00Z"},completedLessonIds:academicLessonList.filter(lesson=>levels.includes(lesson.level)).map(lesson=>lesson.id)};
  for(const level of levels){const samples=level==="A1"?3:level==="A2"?4:level==="B1"?5:6;state={...state,exerciseAttempts:[...state.exerciseAttempts,...levelRun(level,"A",new Date(now.getTime()-5*86_400_000)),...levelRun(level,"B",new Date(now.getTime()-86_400_000))],writingSubmissions:[...state.writingSubmissions,...Array.from({length:samples},(_,index)=>independentWriting(level,index,now))],speakingAttempts:[...state.speakingAttempts,...Array.from({length:samples},(_,index)=>independentSpeaking(level,index,now))],mastery:{...state.mastery,[`level-${level.toLowerCase()}-ready`]:100}};}
  return state;
}
