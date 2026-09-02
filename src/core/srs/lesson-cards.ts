import type { FullLesson } from "@/types/lesson-content";

export type LessonSrsCard = { id:string; front:string; back:string; hint:string; tags:string[] };

export function buildLessonSrsCards(lesson:FullLesson):LessonSrsCard[]{
  const candidates:LessonSrsCard[]=[
    ...lesson.flashcards.map((card)=>({id:card.id,front:card.frontDe,back:card.backAr,hint:`مثال: ${card.exampleDe}`,tags:[lesson.level,lesson.id,"authored"]})),
    ...lesson.phrases.map((phrase,index)=>({id:`${lesson.id}-phrase-${index+1}`,front:phrase.de,back:phrase.ar,hint:phrase.noteAr??"استعمل العبارة داخل جملة تخصك.",tags:[lesson.level,lesson.id,"phrase"]})),
    ...lesson.mistakes.map((mistake,index)=>({id:`${lesson.id}-error-card-${index+1}`,front:mistake.wrong,back:mistake.correct,hint:`السبب: ${mistake.whyAr} التريك: ${mistake.trickAr}`,tags:[lesson.level,lesson.id,"error"]})),
    ...lesson.theory.flatMap((block,blockIndex)=>block.examples.map((example,index)=>({id:`${lesson.id}-example-${blockIndex+1}-${index+1}`,front:example.de,back:example.ar,hint:block.trickAr,tags:[lesson.level,lesson.id,"example"]}))),
  ];
  const unique=new Map<string,LessonSrsCard>();
  for(const card of candidates){const key=card.front.normalize("NFKC").toLocaleLowerCase("de-DE").trim();if(!unique.has(key))unique.set(key,card)}
  return [...unique.values()].slice(0,24);
}

export function lessonInteractiveItemCount(lesson:FullLesson):number{
  return lesson.exercises.length+lesson.reading.questions.length+lesson.listening.questions.length+lesson.miniTest.length;
}
