import { normalizeGermanText } from "@/core/lesson/evaluate";
import type { WritingErrorPatternId, WritingRepairAttempt } from "@/types/learning";

export const WRITING_ERROR_PRACTICE_POLICY = "writing-error-micro-practice-v1" as const;
export const WRITING_REPAIR_BOUNDARY = "personal-writing-repair-no-mastery-or-gate" as const;

export type WritingErrorPatternMatch = {
  patternId: WritingErrorPatternId;
  sourceExcerpt: string;
  correctedExcerpt: string;
  explanationAr: string;
  detector: "deterministic-local-pattern";
};

export type WritingRepairExercise = WritingErrorPatternMatch & {
  id: string;
  policyVersion: typeof WRITING_ERROR_PRACTICE_POLICY;
  sourceSubmissionId: string;
  taskId: string;
  sourceVersion: number;
  promptDe: string;
  promptAr: string;
  acceptedAnswers: string[];
  evidenceBoundary: typeof WRITING_REPAIR_BOUNDARY;
};

type Detector = {
  patternId: WritingErrorPatternId;
  detect: RegExp;
  correct: (sentence: string) => string;
  explanationAr: string;
};

const ichForms: Record<string,string> = { kommen:"komme",wohnen:"wohne",lernen:"lerne",arbeiten:"arbeite",sprechen:"spreche",machen:"mache",gehen:"gehe",haben:"habe",sein:"bin" };
const duForms: Record<string,string> = { kommen:"kommst",wohnen:"wohnst",lernen:"lernst",arbeiten:"arbeitest",sprechen:"sprichst",machen:"machst",gehen:"gehst",haben:"hast",sein:"bist" };
const thirdForms: Record<string,string> = { kommen:"kommt",wohnen:"wohnt",lernen:"lernt",arbeiten:"arbeitet",sprechen:"spricht",machen:"macht",gehen:"geht",haben:"hat",sein:"ist" };

function replaceMappedVerb(sentence:string,pronounPattern:string,forms:Record<string,string>){
  const verbs=Object.keys(forms).join("|");
  return sentence.replace(new RegExp(`\\b(${pronounPattern})\\s+(${verbs})\\b`,`iu`),(_match,pronoun:string,verb:string)=>`${pronoun} ${forms[verb.toLocaleLowerCase("de-DE")]}`);
}
function capitalizeFirstLetter(sentence:string){return sentence.replace(/\p{Ll}/u,(letter)=>letter.toLocaleUpperCase("de-DE"));}
function correctWeilCopula(sentence:string){return sentence.replace(/\bweil\s+(ich|du|er|sie|es|wir|ihr|Sie)\s+(bin|bist|ist|sind|seid)\s+([^,.!?]{1,80})/iu,(_match,subject:string,verb:string,rest:string)=>`weil ${subject} ${rest.trim()} ${verb}`);}
function correctMovementPerfect(sentence:string){const auxiliaries:Record<string,string>={ich:"bin",du:"bist",er:"ist",sie:"ist",es:"ist",wir:"sind",ihr:"seid"};return sentence.replace(/\b(ich|du|er|sie|es|wir|ihr)\s+(habe|hast|hat|haben|habt)(?=\s+[^.!?]{0,70}\b(?:gegangen|gefahren|gekommen)\b)/iu,(_match,subject:string)=>`${subject} ${auxiliaries[subject.toLocaleLowerCase("de-DE")]}`);}

const detectors:Detector[]=[
  {patternId:"bin-heissen",detect:/\b(?:ich\s+bin\s+heißen|ich\s+bin\s+heisse?n)\b/iu,correct:(sentence)=>sentence.replace(/\bich\s+bin\s+heißen\b/iu,"Ich heiße").replace(/\bich\s+bin\s+heisse?n\b/iu,"Ich heiße"),explanationAr:"heißen فعل مستقل؛ مع ich نستعمل heiße دون bin."},
  {patternId:"weil-copula-order",detect:/\bweil\s+(?:ich|du|er|sie|es|wir|ihr|Sie)\s+(?:bin|bist|ist|sind|seid)\s+[^,.!?]{1,80}/iu,correct:correctWeilCopula,explanationAr:"بعد weil ينتقل الفعل المصرف إلى نهاية الجملة التابعة."},
  {patternId:"movement-perfect-auxiliary",detect:/\b(?:ich|du|er|sie|es|wir|ihr)\s+(?:habe|hast|hat|haben|habt)\s+[^.!?]{0,70}\b(?:gegangen|gefahren|gekommen)\b/iu,correct:correctMovementPerfect,explanationAr:"أفعال الحركة الشائعة مثل gehen وfahren وkommen تبني Perfekt هنا مع sein."},
  {patternId:"ich-infinitive",detect:/\bich\s+(?:kommen|wohnen|lernen|arbeiten|sprechen|machen|gehen|haben|sein)\b/iu,correct:(sentence)=>replaceMappedVerb(sentence,"ich",ichForms),explanationAr:"بعد ich نحتاج صيغة الفعل المصرفة، لا المصدر."},
  {patternId:"du-infinitive",detect:/\bdu\s+(?:kommen|wohnen|lernen|arbeiten|sprechen|machen|gehen|haben|sein)\b/iu,correct:(sentence)=>replaceMappedVerb(sentence,"du",duForms),explanationAr:"بعد du نحتاج صيغة المخاطب المصرفة."},
  {patternId:"third-person-infinitive",detect:/\b(?:er|sie|es)\s+(?:kommen|wohnen|lernen|arbeiten|sprechen|machen|gehen|haben|sein)\b/iu,correct:(sentence)=>replaceMappedVerb(sentence,"er|sie|es",thirdForms),explanationAr:"مع er/sie/es يجب تصريف الفعل، ولا يبقى في صيغة المصدر."},
  {patternId:"sentence-capitalization",detect:/^[\s„“"'(\[]*\p{Ll}/u,correct:capitalizeFirstLetter,explanationAr:"تبدأ الجملة الألمانية المكتوبة بحرف كبير."},
];

function sentenceExcerpts(text:string){
  const compact=text.normalize("NFC").replace(/[\u202A-\u202E\u2066-\u2069]/gu,"").replace(/\s+/gu," ").trim();
  return compact.match(/[^.!?]+[.!?]?/gu)?.map((sentence)=>sentence.trim()).filter(Boolean)??[];
}

export function detectWritingErrorPatterns(text:string,maxPatterns=3):WritingErrorPatternMatch[]{
  const matches:WritingErrorPatternMatch[]=[];
  const seen=new Set<string>();
  for(const sentence of sentenceExcerpts(text)){
    for(const detector of detectors){
      if(!detector.detect.test(sentence))continue;
      const corrected=detector.correct(sentence).replace(/\s+/gu," ").trim();
      const source=sentence.slice(0,180);
      if(!corrected||(detector.patternId==="sentence-capitalization"?corrected===source:normalizeGermanText(corrected)===normalizeGermanText(source)))continue;
      const key=`${detector.patternId}:${normalizeGermanText(source)}`;
      if(seen.has(key))continue;
      seen.add(key);
      matches.push({patternId:detector.patternId,sourceExcerpt:source,correctedExcerpt:corrected.slice(0,180),explanationAr:detector.explanationAr,detector:"deterministic-local-pattern"});
      if(matches.length>=maxPatterns)return matches;
    }
  }
  return matches;
}

export function buildWritingRepairExercises(input:{text:string;taskId:string;sourceSubmissionId:string;sourceVersion:number;maxExercises?:number}):WritingRepairExercise[]{
  if(!input.sourceSubmissionId.trim()||!input.taskId.trim()||input.sourceVersion<1)return[];
  return detectWritingErrorPatterns(input.text,input.maxExercises??3).map((match,index)=>({
    ...match,
    id:`writing-repair:${input.sourceSubmissionId}:${match.patternId}:${index+1}`,
    policyVersion:WRITING_ERROR_PRACTICE_POLICY,
    sourceSubmissionId:input.sourceSubmissionId,
    taskId:input.taskId,
    sourceVersion:input.sourceVersion,
    promptDe:"Korrigieren Sie den Satz aus Ihrem eigenen Text.",
    promptAr:"صحح المقتطف الذي كُتب في نسختك. يظهر التصحيح المحلي بعد تثبيت جوابك.",
    acceptedAnswers:[match.correctedExcerpt],
    evidenceBoundary:WRITING_REPAIR_BOUNDARY,
  }));
}

export function evaluateWritingRepair(exercise:WritingRepairExercise,answer:string){return exercise.acceptedAnswers.some((accepted)=>normalizeGermanText(accepted)===normalizeGermanText(answer));}

export function createWritingRepairAttempt(exercise:WritingRepairExercise,answer:string,now=new Date()):WritingRepairAttempt{
  const clean=answer.normalize("NFC").replace(/[\u202A-\u202E\u2066-\u2069]/gu,"").replace(/\s+/gu," ").trim().slice(0,220);
  if(!clean)throw new Error("اكتب تصحيحًا قبل التحقق.");
  return{id:`writing-repair-attempt:${crypto.randomUUID()}`,policyVersion:WRITING_ERROR_PRACTICE_POLICY,exerciseId:exercise.id,sourceSubmissionId:exercise.sourceSubmissionId,taskId:exercise.taskId,sourceVersion:exercise.sourceVersion,patternId:exercise.patternId,answer:clean,correct:evaluateWritingRepair(exercise,clean),evidenceBoundary:WRITING_REPAIR_BOUNDARY,createdAt:now.toISOString()};
}
