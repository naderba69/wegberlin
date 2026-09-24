import type { CEFRLevel, SpeakingAttempt } from "@/types/learning";

export const GUIDED_SPEAKING_SUPPORT_POLICY = "guided-speaking-support-provenance-v1" as const;

const minuteWords:Record<string,number>={ein:1,eine:1,einen:1,zwei:2,drei:3,vier:4,fünf:5};

export function speakingTargetSeconds(promptDe:string,level:CEFRLevel,options?:{beginnerFirstLesson?:boolean}):number{
  let target:number;
  const range=promptDe.match(/(\d+)\s*[–-]\s*(\d+)\s*Sekunden/iu);
  const seconds=promptDe.match(/(\d+)\s*Sekunden/iu);
  const numericMinutes=promptDe.match(/(\d+)\s*Minuten?/iu);
  const wordMinutes=promptDe.match(/\b(ein|eine|einen|zwei|drei|vier|fünf)\s+Minuten?/iu);
  if(range)target=Number(range[2]);
  else if(seconds)target=Number(seconds[1]);
  else if(numericMinutes)target=Number(numericMinutes[1])*60;
  else if(wordMinutes)target=minuteWords[wordMinutes[1].toLocaleLowerCase("de-DE")]*60;
  else target=level==="A1"?30:level==="A2"?45:level==="B1"?60:180;
  return options?.beginnerFirstLesson?Math.min(target,10):target;
}

export function speakingPreparationSeconds(level:CEFRLevel):number{return level==="A1"?15:level==="A2"?30:level==="B1"?45:60}

export function speakingDurationBand(duration:number,target:number):"short"|"within-range"|"long"{
  if(duration<target*.6)return"short";
  if(duration>target*1.3)return"long";
  return"within-range";
}

export function canSaveSpeakingReview(input:{listenedBack:boolean;reflection:string}):boolean{return input.listenedBack&&input.reflection.trim().length>=5}

export function speakingAttemptIsIndependent(attempt:Pick<SpeakingAttempt,"selfReview">):boolean{
  return attempt.selfReview?.supportVisibleDuringRecording !== true;
}
