import type { CEFRLevel, LearningState, WritingBenchmarkAttempt } from "@/types/learning";
import { countGermanWords } from "@/core/reading/benchmark";

export const WRITING_BENCHMARK_VERSION="writing-device-benchmark-v1" as const;
export const WRITING_BENCHMARK_BOUNDARY="device-input-planning-only-no-language-score" as const;
export const MIN_WRITING_SECONDS=5;
export const MAX_WRITING_WPM=100;
export const MAX_WRITING_CPM=600;

const prompts:Record<CEFRLevel,{id:string;textDe:string}>={
  A1:{id:"writing-device-a1",textDe:"Am Montag lerne ich Deutsch, danach kaufe ich im Supermarkt ein."},
  A2:{id:"writing-device-a2",textDe:"Morgen schreibe ich der Kursleitung, weil ich einen anderen Termin brauche."},
  B1:{id:"writing-device-b1",textDe:"Obwohl der Termin kurzfristig geändert wurde, konnte das Team eine passende Lösung finden."},
  B2:{id:"writing-device-b2",textDe:"Eine nachvollziehbare Entscheidung nennt die verfügbaren Daten, ihre Grenzen und mögliche Alternativen."},
};

export function writingBenchmarkPrompt(level:CEFRLevel){return prompts[level]}
export function normalizeWritingCopy(value:string){return value.normalize("NFC").replace(/\s+/gu," ").trim()}

function levenshtein(left:string,right:string){
  const a=[...left.toLocaleLowerCase("de-DE")],b=[...right.toLocaleLowerCase("de-DE")];
  let previous=Array.from({length:b.length+1},(_,index)=>index);
  for(let row=1;row<=a.length;row+=1){const current=[row];for(let column=1;column<=b.length;column+=1)current[column]=Math.min(current[column-1]+1,previous[column]+1,previous[column-1]+(a[row-1]===b[column-1]?0:1));previous=current}
  return previous[b.length];
}

export function writingCopyAccuracy(target:string,typed:string){
  const cleanTarget=normalizeWritingCopy(target),cleanTyped=normalizeWritingCopy(typed);const longest=Math.max([...cleanTarget].length,[...cleanTyped].length,1);return Math.max(0,Math.round((1-levenshtein(cleanTarget,cleanTyped)/longest)*100));
}

export function recommendedWritingMinutes(wordsPerMinute:number):5|8|10|12{
  if(wordsPerMinute<15)return 12;
  if(wordsPerMinute<25)return 10;
  if(wordsPerMinute<40)return 8;
  return 5;
}

export function evaluateWritingBenchmark(input:{id:string;level:CEFRLevel;typedText:string;durationSeconds:number;createdAt:string}):WritingBenchmarkAttempt{
  const prompt=writingBenchmarkPrompt(input.level);const target=normalizeWritingCopy(prompt.textDe),typed=normalizeWritingCopy(input.typedText);const durationSeconds=Math.round(input.durationSeconds*10)/10;
  if(!Number.isFinite(durationSeconds)||durationSeconds<MIN_WRITING_SECONDS||durationSeconds>1800)throw new Error(`مدة الكتابة يجب أن تكون بين ${MIN_WRITING_SECONDS} ثوان و30 دقيقة.`);
  const targetCharacterCount=[...target].length,typedCharacterCount=[...typed].length,copyAccuracyPercent=writingCopyAccuracy(target,typed);const qualified=copyAccuracyPercent>=90&&typedCharacterCount>=Math.round(targetCharacterCount*.8);
  const rawWpm=countGermanWords(typed)/durationSeconds*60;const rawCpm=typedCharacterCount/durationSeconds*60;const wordsPerMinute=qualified?Math.max(5,Math.min(MAX_WRITING_WPM,Math.round(rawWpm))):undefined;const charactersPerMinute=qualified?Math.max(20,Math.min(MAX_WRITING_CPM,Math.round(rawCpm))):undefined;
  return{id:input.id,policyVersion:WRITING_BENCHMARK_VERSION,promptId:prompt.id,level:input.level,targetCharacterCount,typedCharacterCount,durationSeconds,copyAccuracyPercent,qualified,...(qualified&&wordsPerMinute&&charactersPerMinute?{wordsPerMinute,charactersPerMinute,recommendedWritingMinutes:recommendedWritingMinutes(wordsPerMinute)}:{}),timingSource:"visible-performance-timer",evidenceBoundary:WRITING_BENCHMARK_BOUNDARY,createdAt:input.createdAt};
}

export function latestQualifiedWritingBenchmark(state:LearningState){return state.writingBenchmarkAttempts.filter((attempt)=>attempt.qualified&&attempt.wordsPerMinute&&attempt.recommendedWritingMinutes).sort((left,right)=>Date.parse(right.createdAt)-Date.parse(left.createdAt))[0]}
export function calibratedWritingBlockMinutes(state:LearningState,availableMinutes:number){const latest=latestQualifiedWritingBenchmark(state);if(!latest||availableMinutes<6)return 0;return Math.min(latest.recommendedWritingMinutes!,Math.max(3,availableMinutes-4))}
