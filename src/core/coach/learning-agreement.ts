import type { LearnerGoal, LearnerProfile, LearningContract, QuietHoursSettings } from "@/types/learning";

export const LEARNING_CONTRACT_POLICY="fourteen-day-learning-contract-v1" as const;
export const QUIET_HOURS_POLICY="quiet-hours-local-v1" as const;
export const DEFAULT_QUIET_HOURS:QuietHoursSettings={policyVersion:QUIET_HOURS_POLICY,enabled:false,startLocal:"22:00",endLocal:"07:00",timeZone:"UTC",notificationBoundary:"no-push-no-notification-api-in-app-nudges-only"};

function validDate(value:string){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)throw new Error("تاريخ بداية العقد غير صالح.");const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));if(date.getFullYear()!==Number(match[1])||date.getMonth()!==Number(match[2])-1||date.getDate()!==Number(match[3]))throw new Error("تاريخ بداية العقد غير صالح.");return date}
function localDate(date:Date){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
export function contractEndDate(startsOn:string){const date=validDate(startsOn);date.setDate(date.getDate()+13);return localDate(date)}
export function latestLearningContract(contracts:LearningContract[]){return[...contracts].sort((a,b)=>b.revision-a.revision||Date.parse(b.createdAt)-Date.parse(a.createdAt))[0]}
export function createLearningContract(input:{startsOn:string;goal:LearnerGoal;dailyMinutes:LearnerProfile["dailyMinutes"];studyWeekdays:LearningContract["studyWeekdays"]},previous?:LearningContract,now=new Date(),id=`contract-${crypto.randomUUID()}`):LearningContract{const weekdays=[...new Set(input.studyWeekdays)].sort() as LearningContract["studyWeekdays"];if(!weekdays.length)throw new Error("اختر يوم دراسة واحدًا على الأقل.");return{id,policyVersion:LEARNING_CONTRACT_POLICY,revision:(previous?.revision??0)+1,previousContractId:previous?.id,startsOn:input.startsOn,endsOn:contractEndDate(input.startsOn),goal:input.goal,dailyMinutes:input.dailyMinutes,studyWeekdays:weekdays,evidenceBoundary:"planning-commitment-no-mastery-or-gate",createdAt:now.toISOString()}}

function minutes(value:string){const match=value.match(/^(\d{2}):(\d{2})$/);if(!match)return null;const hour=Number(match[1]),minute=Number(match[2]);return hour<24&&minute<60?hour*60+minute:null}
export function isQuietHoursActive(settings:QuietHoursSettings,now=new Date()){if(!settings.enabled)return false;const start=minutes(settings.startLocal),end=minutes(settings.endLocal);if(start===null||end===null||start===end)return false;const current=now.getHours()*60+now.getMinutes();return start<end?current>=start&&current<end:current>=start||current<end}
export function shouldSuppressInAppReminder(settings:QuietHoursSettings,kind:"study-nudge"|"review-nudge"|"deadline-safety",now=new Date()){return kind!=="deadline-safety"&&isQuietHoursActive(settings,now)}
