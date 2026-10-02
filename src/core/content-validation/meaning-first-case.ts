import { academicLessonList } from "@/data/academic-lessons";
import { meaningFirstCaseContracts } from "@/data/case-teaching-registry";

export const MEANING_FIRST_CASE_AUDIT_VERSION="meaning-first-case-audit-v1" as const;
const caseSignal=/Akkusativ|Dativ|Genitiv|Nominativ|Kasus/u;
const forbiddenMeaningStart=/Akkusativ|Dativ|Genitiv|Nominativ|Kasus|\b(?:der|die|das|den|dem|einen|einem)\b|نهاي|أداة/u;
const requiredFormSignal=/Akkusativ|Dativ|Genitiv|Nominativ|نهاي|أداة|ضمير/u;

function textOf(value:unknown){return JSON.stringify(value)}

export function buildMeaningFirstCaseAudit(){
  const issues:string[]=[];
  const lessonById=new Map(academicLessonList.map((lesson)=>[lesson.id,lesson]));
  const theorySignals=academicLessonList.flatMap((lesson)=>lesson.theory.filter((item)=>caseSignal.test(textOf(item))).map((item)=>({lessonId:lesson.id,id:item.id})));
  const controlledSignals=academicLessonList.flatMap((lesson)=>lesson.exercises.filter((item)=>caseSignal.test(textOf(item))).map((item)=>({lessonId:lesson.id,id:item.id})));
  const assessmentSignals=academicLessonList.flatMap((lesson)=>lesson.miniTest.filter((item)=>caseSignal.test(textOf(item))).map((item)=>({lessonId:lesson.id,id:item.id})));
  const ownedTheory=new Set(meaningFirstCaseContracts.flatMap((item)=>item.theoryIds));
  const ownedControlled=new Set(meaningFirstCaseContracts.flatMap((item)=>item.controlledExerciseIds));
  const ownedAssessment=new Set(meaningFirstCaseContracts.flatMap((item)=>item.assessmentIds));

  const ids=new Set<string>();
  const lessons=new Set<string>();
  for(const contract of meaningFirstCaseContracts){
    if(ids.has(contract.id))issues.push(`${contract.id}: duplicate contract ID`);ids.add(contract.id);
    if(lessons.has(contract.lessonId))issues.push(`${contract.lessonId}: duplicate lesson contract`);lessons.add(contract.lessonId);
    const lesson=lessonById.get(contract.lessonId);
    if(!lesson){issues.push(`${contract.id}: unknown lesson`);continue}
    if(JSON.stringify(contract.sequence)!==JSON.stringify(["meaning","role","form"]))issues.push(`${contract.id}: sequence is not meaning→role→form`);
    if(forbiddenMeaningStart.test(contract.semanticQuestionAr))issues.push(`${contract.id}: semantic question leaks case/form terminology before role choice`);
    if(contract.roleChoicesAr.length<2)issues.push(`${contract.id}: fewer than two semantic role choices`);
    if(!requiredFormSignal.test(contract.formRuleAr))issues.push(`${contract.id}: form step lacks an explicit case/form cue`);
    if(!contract.theoryIds.length||!contract.controlledExerciseIds.length||!contract.assessmentIds.length)issues.push(`${contract.id}: teaching/practice/assessment references must be nonempty`);
    for(const id of contract.theoryIds)if(!lesson.theory.some((item)=>item.id===id))issues.push(`${contract.id}: unknown theory ${id}`);
    for(const id of contract.controlledExerciseIds)if(!lesson.exercises.some((item)=>item.id===id))issues.push(`${contract.id}: unknown controlled exercise ${id}`);
    for(const id of contract.assessmentIds)if(!lesson.miniTest.some((item)=>item.id===id))issues.push(`${contract.id}: unknown assessment ${id}`);
  }
  for(const signal of theorySignals)if(!ownedTheory.has(signal.id))issues.push(`${signal.lessonId}: unowned case theory ${signal.id}`);
  for(const signal of controlledSignals)if(!ownedControlled.has(signal.id))issues.push(`${signal.lessonId}: unowned case exercise ${signal.id}`);
  for(const signal of assessmentSignals)if(!ownedAssessment.has(signal.id))issues.push(`${signal.lessonId}: unowned case assessment ${signal.id}`);

  const byLevel=Object.fromEntries((["A1","A2","B1","B2"] as const).map((level)=>[level,meaningFirstCaseContracts.filter((item)=>item.lessonId.startsWith(level.toLowerCase())).length]));
  return{
    ok:issues.length===0,
    version:MEANING_FIRST_CASE_AUDIT_VERSION,
    contractCount:meaningFirstCaseContracts.length,
    lessonCount:lessons.size,
    theoryReferenceCount:meaningFirstCaseContracts.reduce((sum,item)=>sum+item.theoryIds.length,0),
    controlledReferenceCount:meaningFirstCaseContracts.reduce((sum,item)=>sum+item.controlledExerciseIds.length,0),
    assessmentReferenceCount:meaningFirstCaseContracts.reduce((sum,item)=>sum+item.assessmentIds.length,0),
    discoveredSignals:{theory:theorySignals.length,controlled:controlledSignals.length,assessment:assessmentSignals.length},
    byLevel,
    issues,
    contracts:meaningFirstCaseContracts,
    boundary:"The audit proves authored sequencing and complete ownership of explicit case-name signals. It does not replace an independent linguistic judgment of every explanation or learner interpretation.",
  };
}
