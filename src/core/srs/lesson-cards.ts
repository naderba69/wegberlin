import type { FullLesson } from "@/types/lesson-content";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";

export type LessonSrsCard = { id:string; front:string; back:string; hint:string; tags:string[] };

function lexicalKey(value:string){return value.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/[^a-zäöüß]+/gu," ").trim()}
function uniqueTags(tags:string[]){return[...new Set(tags)]}

function enrichLexicalCard(card:LessonSrsCard,lesson:FullLesson):LessonSrsCard{
  const key=lexicalKey(card.front);
  const noun=nounGrammarEntries.find((entry)=>entry.lessonId===lesson.id&&(key===lexicalKey(entry.lemma)||key===lexicalKey(`${entry.article} ${entry.lemma}`)));
  if(noun){
    const plural=noun.plural.form?`الجمع: ${noun.plural.form}`:noun.plural.noteAr;
    return{...card,back:`${noun.meaningAr} · ${plural}`,hint:`Akkusativ: ${noun.caseForms.accusative} · Dativ: ${noun.caseForms.dative}`,tags:uniqueTags([...card.tags,"noun-grammar"])};
  }
  const frame=verbPrepositionFrames.find((entry)=>entry.lessonId===lesson.id&&key===lexicalKey(entry.chunkDe));
  if(frame)return{...card,back:frame.meaningAr,hint:`${frame.governedCase==="accusative"?"Akkusativ":"Dativ"} · ${frame.exampleDe} · ${frame.contrastAr}`,tags:uniqueTags([...card.tags,"verb-frame"])};
  return card;
}

export function buildLessonSrsCards(lesson:FullLesson):LessonSrsCard[]{
  const candidates:LessonSrsCard[]=[
    ...lesson.flashcards.map((card)=>({id:card.id,front:card.frontDe,back:card.backAr,hint:`مثال: ${card.exampleDe}`,tags:[lesson.level,lesson.id,"authored"]})),
    ...lesson.phrases.map((phrase,index)=>({id:`${lesson.id}-phrase-${index+1}`,front:phrase.de,back:phrase.ar,hint:phrase.noteAr??"استعمل العبارة داخل جملة تخصك.",tags:[lesson.level,lesson.id,"phrase",...(index<4?["pronunciation"]:[])]})),
    ...lesson.mistakes.map((mistake,index)=>({id:`${lesson.id}-error-card-${index+1}`,front:mistake.wrong,back:mistake.correct,hint:`السبب: ${mistake.whyAr} التريك: ${mistake.trickAr}`,tags:[lesson.level,lesson.id,"error"]})),
    ...lesson.theory.flatMap((block,blockIndex)=>block.examples.map((example,index)=>({id:`${lesson.id}-example-${blockIndex+1}-${index+1}`,front:example.de,back:example.ar,hint:block.trickAr,tags:[lesson.level,lesson.id,"example"]}))),
  ];
  const unique=new Map<string,LessonSrsCard>();
  for(const card of candidates){const key=lexicalKey(card.front);if(!unique.has(key))unique.set(key,enrichLexicalCard(card,lesson))}
  return [...unique.values()].slice(0,24);
}

export function lessonInteractiveItemCount(lesson:FullLesson):number{
  return lesson.exercises.length+lesson.reading.questions.length+lesson.listening.questions.length+lesson.miniTest.length;
}
