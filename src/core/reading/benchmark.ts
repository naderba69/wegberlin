import { readingLibrary } from "@/data/library-registry";
import type { CEFRLevel, LearningState, ReadingBenchmarkAttempt } from "@/types/learning";
import type { ReadingLibraryItem } from "@/types/library";

export const READING_BENCHMARK_VERSION = "reading-comprehension-benchmark-v1" as const;
export const READING_BENCHMARK_BOUNDARY = "planning-only-no-cefr-or-mastery" as const;
export const MIN_READING_SECONDS = 5;
export const MAX_READING_WPM = 400;

export function countGermanWords(text:string) {
  return (text.normalize("NFC").match(/[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'-]*/gu)??[]).length;
}

export function selectReadingBenchmarkItem(level:CEFRLevel):ReadingLibraryItem {
  const item=readingLibrary.find((candidate)=>candidate.level===level&&candidate.questions.length>=2&&countGermanWords(candidate.textDe)>=40);
  if(!item)throw new Error(`No reading benchmark item for ${level}`);
  return item;
}

export function recommendedReadingMinutes(wordsPerMinute:number):5|6|8|10 {
  if(wordsPerMinute<80)return 10;
  if(wordsPerMinute<120)return 8;
  if(wordsPerMinute<180)return 6;
  return 5;
}

export function evaluateReadingBenchmark(input:{
  id:string;
  item:ReadingLibraryItem;
  durationSeconds:number;
  answers:[number,number];
  createdAt:string;
}):ReadingBenchmarkAttempt {
  const durationSeconds=Math.round(input.durationSeconds*10)/10;
  if(!Number.isFinite(durationSeconds)||durationSeconds<MIN_READING_SECONDS||durationSeconds>1800)throw new Error(`مدة القراءة يجب أن تكون بين ${MIN_READING_SECONDS} ثوان و30 دقيقة.`);
  const questions=input.item.questions.slice(0,2);
  const comprehensionCorrect=questions.filter((question,index)=>input.answers[index]===question.correctIndex).length;
  const qualified=comprehensionCorrect===2;
  const wordCount=countGermanWords(input.item.textDe);
  const wordsPerMinute=qualified?Math.max(20,Math.min(MAX_READING_WPM,Math.round(wordCount/durationSeconds*60))):undefined;
  return{
    id:input.id,
    policyVersion:READING_BENCHMARK_VERSION,
    itemId:input.item.id,
    level:input.item.level,
    wordCount,
    durationSeconds,
    comprehensionCorrect,
    comprehensionTotal:2,
    qualified,
    ...(wordsPerMinute?{wordsPerMinute,recommendedReadingMinutes:recommendedReadingMinutes(wordsPerMinute)}:{}),
    timingSource:"visible-performance-timer",
    evidenceBoundary:READING_BENCHMARK_BOUNDARY,
    createdAt:input.createdAt,
  };
}

export function latestQualifiedReadingBenchmark(state:LearningState) {
  return state.readingBenchmarkAttempts.filter((attempt)=>attempt.qualified&&attempt.wordsPerMinute&&attempt.recommendedReadingMinutes).sort((left,right)=>Date.parse(right.createdAt)-Date.parse(left.createdAt))[0];
}

export function calibratedReadingBlockMinutes(state:LearningState,lessonMinutes:number) {
  const latest=latestQualifiedReadingBenchmark(state);
  if(!latest||lessonMinutes<8)return 0;
  return Math.min(latest.recommendedReadingMinutes!,Math.max(3,lessonMinutes-5));
}
