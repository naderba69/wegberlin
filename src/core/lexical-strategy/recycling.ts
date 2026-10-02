import { academicLessonList } from "@/data/academic-lessons";
import { curriculum, moduleTitles } from "@/data/curriculum";
import type { CEFRLevel } from "@/types/learning";
import type { FullLesson, Question } from "@/types/lesson-content";

export const MODULE_RECYCLING_VERSION="module-recycling-ratio-v1" as const;
export const MODULE_RECYCLING_BOUNDARY="review-composition-ratio-no-automatic-mastery-or-cefr" as const;
export type RecyclingScope="current"|"recycled";
export type RecyclingContentKind="current-assessment"|"vocabulary-retrieval"|"grammar-retrieval";

export interface ModuleReviewQuestionPlanItem{
  question:Question;
  scope:RecyclingScope;
  contentKind:RecyclingContentKind;
  sourceLessonId:string;
}
export interface ModuleRecyclingSummary{
  moduleId:string;
  level:CEFRLevel;
  module:number;
  titleDe:string;
  totalQuestions:10;
  currentCount:number;
  recycledCount:number;
  currentPercent:number;
  recycledPercent:number;
  expectedRecycledPercent:number;
  sourceLessonIds:string[];
  policyVersion:typeof MODULE_RECYCLING_VERSION;
  evidenceBoundary:typeof MODULE_RECYCLING_BOUNDARY;
}

const levelRank:Record<CEFRLevel,number>={A1:0,A2:1,B1:2,B2:3};
const lessonOrder=new Map(curriculum.map((lesson,index)=>[lesson.id,index]));
const lessonById=new Map(academicLessonList.map((lesson)=>[lesson.id,lesson]));

export function expectedRecycledPercent(level:CEFRLevel,module:number){
  if(level==="A1"&&module===1)return 0;
  if(level==="A1")return 20;
  if(level==="B2")return 40;
  return 30;
}

function parseModuleId(moduleId:string):{level:CEFRLevel;module:number}{
  const match=/^(A1|A2|B1|B2)\.(\d+)$/.exec(moduleId);
  if(!match)throw new Error(`Invalid module id: ${moduleId}`);
  const level=match[1] as CEFRLevel;const moduleNumber=Number(match[2]);
  const max=moduleTitles[level].length;
  if(!Number.isInteger(moduleNumber)||moduleNumber<1||moduleNumber>max)throw new Error(`Unknown module id: ${moduleId}`);
  return{level,module:moduleNumber};
}

function rotateOptions(options:[string,string,string,string],correctIndex:number,rotation:number):{options:[string,string,string,string];correctIndex:0|1|2|3}{
  const amount=((rotation%4)+4)%4;const rotated=[...options.slice(amount),...options.slice(0,amount)] as [string,string,string,string];const next=((correctIndex-amount+4)%4) as 0|1|2|3;return{options:rotated,correctIndex:next};
}

function uniquePhrases(lessons:FullLesson[]){
  const seen=new Set<string>();return lessons.flatMap((lesson)=>lesson.phrases.map((phrase,index)=>({lessonId:lesson.id,index,de:phrase.de,ar:phrase.ar}))).filter((item)=>{const key=item.de.toLocaleLowerCase("de-DE");if(seen.has(key))return false;seen.add(key);return true;});
}

function pickSpread<T>(items:T[],count:number,offset=0):T[]{
  if(count<=0)return[];if(items.length<count)throw new Error(`Not enough prior material: need ${count}, found ${items.length}`);
  const picked:T[]=[];const used=new Set<number>();
  for(let index=0;index<count;index+=1){let candidate=Math.min(items.length-1,Math.floor(((index+0.5)*items.length)/count+offset)%items.length);while(used.has(candidate))candidate=(candidate+1)%items.length;used.add(candidate);picked.push(items[candidate]);}
  return picked;
}

function vocabularyQuestions(moduleId:string,priorLessons:FullLesson[],count:number,moduleOrdinal:number):ModuleReviewQuestionPlanItem[]{
  const phrases=uniquePhrases(priorLessons);const targets=pickSpread(phrases,count,moduleOrdinal);
  return targets.map((target,index)=>{
    const distractors=phrases.filter((item)=>item.de!==target.de);const picked=pickSpread(distractors,3,moduleOrdinal+index).map((item)=>item.de);
    const rotated=rotateOptions([target.de,picked[0],picked[1],picked[2]],0,moduleOrdinal+index);
    return{scope:"recycled",contentKind:"vocabulary-retrieval",sourceLessonId:target.lessonId,question:{id:`recycling-${moduleId.toLowerCase().replace(".","-")}-v${index+1}`,promptDe:"Welche frühere Wendung passt?",promptAr:`اختر العبارة الألمانية السابقة التي تؤدي معنى: ${target.ar}`,options:rotated.options,correctIndex:rotated.correctIndex,explanationAr:"استرجاع مفردات من درس سابق؛ النسبة تخطط المراجعة ولا تمنح إتقانًا وحدها."}};
  });
}

function grammarQuestions(moduleId:string,priorLessons:FullLesson[],count:number,moduleOrdinal:number):ModuleReviewQuestionPlanItem[]{
  const candidates=priorLessons.flatMap((lesson)=>lesson.miniTest.slice(0,2).map((question)=>({lessonId:lesson.id,question})));
  return pickSpread(candidates,count,moduleOrdinal+1).map((candidate,index)=>({scope:"recycled",contentKind:"grammar-retrieval",sourceLessonId:candidate.lessonId,question:{...candidate.question,id:`recycling-${moduleId.toLowerCase().replace(".","-")}-g${index+1}`,explanationAr:`${candidate.question.explanationAr} هذا استرجاع بنية من وحدة سابقة، ولا يغيّر المستوى تلقائيًا.`}}));
}

function currentQuestions(currentLessons:FullLesson[],count:number):ModuleReviewQuestionPlanItem[]{
  const selected:ModuleReviewQuestionPlanItem[]=[];
  for(let round=0;selected.length<count;round+=1){for(const lesson of currentLessons){const question=lesson.miniTest[round];if(question)selected.push({question,scope:"current",contentKind:"current-assessment",sourceLessonId:lesson.id});if(selected.length===count)break;}if(round>10)break;}
  if(selected.length!==count)throw new Error(`Current module has ${selected.length}/${count} review questions`);
  return selected;
}

export function buildModuleReviewQuestionPlan(moduleId:string,currentLessons?:FullLesson[]):ModuleReviewQuestionPlanItem[]{
  const parsed=parseModuleId(moduleId);const lessons=currentLessons??academicLessonList.filter((lesson)=>lesson.level===parsed.level&&lesson.module===parsed.module);
  if(!lessons.length||lessons.some((lesson)=>lesson.level!==parsed.level||lesson.module!==parsed.module))throw new Error(`Lesson set does not match ${moduleId}`);
  const firstOrder=Math.min(...lessons.map((lesson)=>lessonOrder.get(lesson.id)??Number.MAX_SAFE_INTEGER));
  const priorLessons=academicLessonList.filter((lesson)=>(lessonOrder.get(lesson.id)??Number.MAX_SAFE_INTEGER)<firstOrder);
  const recycledCount=expectedRecycledPercent(parsed.level,parsed.module)/10;const vocabularyCount=Math.ceil(recycledCount/2);const grammarCount=recycledCount-vocabularyCount;
  const moduleOrdinal=levelRank[parsed.level]*8+parsed.module;
  const recycled=[...vocabularyQuestions(moduleId,priorLessons,vocabularyCount,moduleOrdinal),...grammarQuestions(moduleId,priorLessons,grammarCount,moduleOrdinal)];
  const current=currentQuestions(lessons,10-recycledCount);
  const mixed:ModuleReviewQuestionPlanItem[]=[];let currentIndex=0;let recycledIndex=0;
  for(let index=0;index<10;index+=1){const placeRecycled=recycledIndex<recycled.length&&((index+1)%Math.max(2,Math.floor(10/recycled.length))===0||currentIndex>=current.length);mixed.push(placeRecycled?recycled[recycledIndex++]:current[currentIndex++]);}
  while(recycledIndex<recycled.length)mixed[mixed.length-(recycled.length-recycledIndex)]=recycled[recycledIndex++];
  return mixed;
}

export function summarizeModuleRecycling(moduleId:string,plan=buildModuleReviewQuestionPlan(moduleId)):ModuleRecyclingSummary{
  const {level,module}=parseModuleId(moduleId);const recycled=plan.filter((item)=>item.scope==="recycled");const expected=expectedRecycledPercent(level,module);
  return{moduleId,level,module,titleDe:moduleTitles[level][module-1].titleDe,totalQuestions:10,currentCount:10-recycled.length,recycledCount:recycled.length,currentPercent:100-recycled.length*10,recycledPercent:recycled.length*10,expectedRecycledPercent:expected,sourceLessonIds:[...new Set(recycled.map((item)=>item.sourceLessonId))],policyVersion:MODULE_RECYCLING_VERSION,evidenceBoundary:MODULE_RECYCLING_BOUNDARY};
}

export const moduleRecyclingSummaries:ModuleRecyclingSummary[]=(Object.entries(moduleTitles) as Array<[CEFRLevel,typeof moduleTitles[CEFRLevel]]>).flatMap(([level,modules])=>modules.map((_,index)=>summarizeModuleRecycling(`${level}.${index+1}`)));

export function lessonIsBeforeModule(lessonId:string,moduleId:string){const {level,module}=parseModuleId(moduleId);const source=lessonById.get(lessonId);if(!source)return false;return levelRank[source.level]<levelRank[level]||(source.level===level&&source.module<module);}
