import type { LearningState, MissionBlock, PinnedLearningTask, StudyRoutineModeSettings } from "@/types/learning";
import { getCoachTarget } from "./coach";
import { buildExamTargetForecast } from "./exam-target-forecast";
import { buildDueReviewQueue } from "@/core/srs/review-queue";

export const PINNED_TASK_POLICY_VERSION="learner-pinned-task-v1" as const;
export const ROUTINE_MODE_POLICY_VERSION="learner-selected-morning-evening-mode-v1" as const;
export const QUICK_PRACTICE_POLICY_VERSION="weakest-target-five-minute-practice-v1" as const;
export const EXAM_COUNTDOWN_POLICY_VERSION="exam-countdown-12-8-4-1-v1" as const;
export const EXTRA_TIME_WHAT_IF_POLICY_VERSION="local-extra-thirty-minutes-what-if-v1" as const;
export const LEVEL_BACKUP_REMINDER_POLICY_VERSION="level-end-backup-reminder-v1" as const;

export function pinLearningTask(state:LearningState,block:MissionBlock,now=new Date()):LearningState{
 const task:PinnedLearningTask={policyVersion:PINNED_TASK_POLICY_VERSION,blockId:block.id,titleAr:block.titleAr,titleDe:block.titleDe,objective:block.objective,href:block.href??"/today",pinnedAt:now.toISOString(),evidenceBoundary:"learner-pin-preserves-coach-recommendation-no-completion-mastery-or-priority-override"};
 return{...state,pinnedLearningTask:task};
}
export function clearPinnedLearningTask(state:LearningState):LearningState{return{...state,pinnedLearningTask:null}}
export function setStudyRoutineMode(state:LearningState,mode:StudyRoutineModeSettings["mode"],now=new Date()):LearningState{return{...state,studyRoutineMode:{policyVersion:ROUTINE_MODE_POLICY_VERSION,mode,...(mode==="auto"?{}:{selectedAt:now.toISOString()}),evidenceBoundary:"learner-selected-entry-mode-no-automatic-completion-mastery-or-time-debt"}}}

export function buildFiveMinuteQuickPractice(state:LearningState,now=new Date()){
 const activeErrors=state.errors.filter((error)=>!error.resolved);const dueReviews=buildDueReviewQueue(state,now).length;const target=activeErrors.length?{href:"/errors",titleAr:"عالج أضعف نمط نشط",titleDe:"Fehler kurz prüfen",reasonAr:`ابدأ بخطأ نشط واحد من ${activeErrors.length} دون فتح حل مسبق.`}:dueReviews>0?{href:"/review",titleAr:"استرجع بطاقة مستحقة",titleDe:"Fünf Minuten abrufen",reasonAr:`لديك ${dueReviews} مراجعة مستحقة؛ خذ أول عينة فقط.`}:getCoachTarget({...state,dueReviews},now);
 return{policyVersion:QUICK_PRACTICE_POLICY_VERSION,minutes:5,href:target.href,titleAr:target.titleAr,titleDe:target.titleDe,steps:[{minute:1,labelAr:"استرجاع دون كشف"},{minute:2,labelAr:"محاولة واحدة من الهدف"},{minute:1,labelAr:"تحقق من السبب"},{minute:1,labelAr:"سجل قرار العودة"}],reasonAr:target.reasonAr,evidenceBoundary:"five-minute-route-to-current-weakest-evidence-no-auto-completion-mastery-or-session-debt" as const};
}

export function buildExamCountdown(state:LearningState,now=new Date()){
 const targetDate=state.profile?.targetDate;if(!targetDate)return{policyVersion:EXAM_COUNTDOWN_POLICY_VERSION,status:"no-date" as const,daysRemaining:null,phase:null,titleAr:"لا يوجد عد تنازلي",actionAr:"أضف تاريخًا فقط عندما يكون لديك موعد حقيقي.",evidenceBoundary:"calendar-plan-no-pass-probability-official-readiness-or-mastery" as const};
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),target=Date.parse(`${targetDate}T00:00:00`),daysRemaining=Math.ceil((target-today)/86_400_000);
 const phase=daysRemaining<0?"past":daysRemaining<=7?"one-week":daysRemaining<=28?"four-weeks":daysRemaining<=56?"eight-weeks":daysRemaining<=84?"twelve-weeks":"long-range";
 const copy={past:["التاريخ مضى","حدّث الموعد ولا تضاعف الحمل."],"one-week":["الأسبوع الأخير","ثبت النوم والصيغة ومهمة ضعيفة واحدة؛ لا تضف منهجًا جديدًا."],"four-weeks":["خطة آخر 4 أسابيع","وازن الوحدات وأكمل بروفة متصلة واحدة كل أسبوع."],"eight-weeks":["خطة آخر 8 أسابيع","وسع عينات المهارات الضعيفة ثم أدخل البروفات تدريجيًا."],"twelve-weeks":["خطة آخر 12 أسبوعًا","أكمل فجوات المنهج واجمع نقلًا مؤجلًا قبل تكثيف الامتحان."],"long-range":["مرحلة بناء بعيدة","واصل المنهج والإتقان المؤجل دون ضغط امتحاني مبكر."]}as const;
 return{policyVersion:EXAM_COUNTDOWN_POLICY_VERSION,status:"dated" as const,targetDate,daysRemaining,phase,titleAr:copy[phase][0],actionAr:copy[phase][1],evidenceBoundary:"calendar-plan-no-pass-probability-official-readiness-or-mastery" as const};
}

export function buildExtraThirtyMinutesWhatIf(state:LearningState,now=new Date()){
 const forecast=buildExamTargetForecast(state,now);if(forecast.remainingStudyMinutes===null)return{policyVersion:EXTRA_TIME_WHAT_IF_POLICY_VERSION,status:"no-date" as const,baselineWeeks:null,extraWeeks:null,weeksDifference:null,extraWeeklyMinutes:30,messageAr:"أضف تاريخًا مستهدفًا لحساب سيناريو الوقت؛ لن نختلق موعد نجاح.",evidenceBoundary:"local-linear-planning-scenario-no-behavior-change-pass-date-or-mastery" as const};
 const baselineWeekly=Math.max(1,forecast.plannedWeeklyMinutes),remaining=forecast.remainingStudyMinutes,baselineWeeks=Math.ceil(remaining/baselineWeekly),extraWeeks=Math.ceil(remaining/(baselineWeekly+30));
 return{policyVersion:EXTRA_TIME_WHAT_IF_POLICY_VERSION,status:"calculated" as const,baselineWeeks,extraWeeks,weeksDifference:Math.max(0,baselineWeeks-extraWeeks),extraWeeklyMinutes:30,messageAr:`إضافة 30 دقيقة أسبوعيًا تغيّر تقدير توزيع ${remaining} دقيقة من نحو ${baselineWeeks} إلى ${extraWeeks} أسابيع.`,evidenceBoundary:"local-linear-planning-scenario-no-behavior-change-pass-date-or-mastery" as const};
}

export function levelEndBackupReminder(state:LearningState){
 const levels=(["A1","A2","B1","B2"]as const).filter((level)=>(state.mastery[`level-${level.toLowerCase()}-ready`]??0)>=100);const level=levels.at(-1);if(!level)return{policyVersion:LEVEL_BACKUP_REMINDER_POLICY_VERSION,show:false,level:null,reasonAr:"لم تصل بوابة مستوى مثبتة بعد.",evidenceBoundary:"backup-nudge-no-blocking-completion-mastery-or-cloud-upload" as const};
 const gateEvents=state.masteryEvidenceEvents.filter((event)=>event.key===`level-${level.toLowerCase()}-ready`&&event.resultingValue===100),gateAt=gateEvents.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.createdAt;const backedUp=Boolean(state.lastBackupAt&&(!gateAt||Date.parse(state.lastBackupAt)>=Date.parse(gateAt)));
 return{policyVersion:LEVEL_BACKUP_REMINDER_POLICY_VERSION,show:!backedUp,level,reasonAr:backedUp?`لديك نسخة بعد بوابة ${level}.`:`اكتملت بوابة ${level} دون نسخة أحدث؛ صدّر DWNB قبل الانتقال الطويل.`,evidenceBoundary:"backup-nudge-no-blocking-completion-mastery-or-cloud-upload" as const};
}
