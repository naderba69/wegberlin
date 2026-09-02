import type { CEFRLevel } from "@/types/learning";

const minuteWords:Record<string,number>={ein:1,eine:1,einen:1,zwei:2,drei:3,vier:4,fünf:5};

export function speakingTargetSeconds(promptDe:string,level:CEFRLevel):number{
  const range=promptDe.match(/(\d+)\s*[–-]\s*(\d+)\s*Sekunden/iu);if(range)return Number(range[2]);
  const seconds=promptDe.match(/(\d+)\s*Sekunden/iu);if(seconds)return Number(seconds[1]);
  const numericMinutes=promptDe.match(/(\d+)\s*Minuten?/iu);if(numericMinutes)return Number(numericMinutes[1])*60;
  const wordMinutes=promptDe.match(/\b(ein|eine|einen|zwei|drei|vier|fünf)\s+Minuten?/iu);if(wordMinutes)return minuteWords[wordMinutes[1].toLocaleLowerCase("de-DE")]*60;
  return level==="A1"?30:level==="A2"?45:level==="B1"?60:180;
}

export function speakingPreparationSeconds(level:CEFRLevel):number{return level==="A1"?15:level==="A2"?30:level==="B1"?45:60}

export function speakingDurationBand(duration:number,target:number):"short"|"within-range"|"long"{
  if(duration<target*.6)return"short";
  if(duration>target*1.3)return"long";
  return"within-range";
}

export function canSaveSpeakingReview(input:{listenedBack:boolean;reflection:string}):boolean{return input.listenedBack&&input.reflection.trim().length>=5}
