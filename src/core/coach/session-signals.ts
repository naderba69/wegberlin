import type { DailySessionRecord, LearnerProfile, LearningState, LoadReductionOfferRecord, LoadReductionTrigger, MissionAlternativeRecord, MissionBlock, MissionBlockKind, SessionAdaptationReason, SessionNextFocus } from "@/types/learning";
import { planningPresetMinutes } from "./intensity-presets";

export const SESSION_ADAPTATION_VERSION = "session-adaptation-v1" as const;
export const SESSION_ADAPTATION_BOUNDARY = "planning-signal-no-mastery-or-correctness" as const;
export const MISSION_ALTERNATIVE_VERSION = "equivalent-mission-alternative-v1" as const;
export const MISSION_ALTERNATIVE_BOUNDARY = "planning-substitution-no-completion-mastery-or-correctness" as const;
export const LOAD_REDUCTION_OFFER_VERSION = "automatic-load-reduction-offer-v1" as const;
export const LOAD_REDUCTION_OFFER_BOUNDARY = "learner-controlled-planning-offer-no-penalty-mastery-or-deletion" as const;
const validSessionBudgets = [10,20,30,45,60,90] as const;
const alternativeEligibleKinds = new Set<MissionBlockKind>(["review","lesson","reading","writing","practice","production"]);
const alternativePresentation:Record<Exclude<MissionBlockKind,"diagnostic"|"check-in"|"reflection">,{titleAr:string;titleDe:string;fallbackHref:string}>={
  review:{titleAr:"بديل الاسترجاع: اكتب الإجابة قبل كشفها",titleDe:"Abrufen durch Schreiben",fallbackHref:"/review"},
  warmup:{titleAr:"بديل التمهيد: استرجاع صامت ثم كشف",titleDe:"Stilles Abruf-Warm-up",fallbackHref:"/review"},
  lesson:{titleAr:"بديل الدرس: نفس الهدف بخطوات أصغر",titleDe:"Dasselbe Lernziel in kleinen Schritten",fallbackHref:"/today"},
  reading:{titleAr:"بديل القراءة: نص آخر بالمستوى نفسه",titleDe:"Alternativer Text auf demselben Niveau",fallbackHref:"/library"},
  writing:{titleAr:"بديل الكتابة: صياغة أقصر بالهدف نفسه",titleDe:"Kürzer schreiben mit demselben Ziel",fallbackHref:"/writing"},
  practice:{titleAr:"بديل التدريب: نوع سؤال آخر للقاعدة نفسها",titleDe:"Andere Übungsform zum selben Ziel",fallbackHref:"/practice"},
  production:{titleAr:"بديل الإنتاج: موقف آخر بالهدف نفسه",titleDe:"Andere Situation mit demselben Ziel",fallbackHref:"/speaking"},
};

export function localSessionDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function saveDailyCheckIn(
  state: LearningState,
  input: { availableMinutes: LearnerProfile["dailyMinutes"]; energyBefore: DailySessionRecord["energyBefore"] },
  now = new Date(),
): LearningState {
  const date = localSessionDate(now);
  const previous = state.dailySessions[date];
  return {
    ...state,
    dailySessions: {
      ...state.dailySessions,
      [date]: {
        ...previous,
        date,
        availableMinutes: input.availableMinutes,
        energyBefore: input.energyBefore,
        checkedInAt: now.toISOString(),
      },
    },
  };
}

export function startTenMinuteRescueMode(state:LearningState,now=new Date()):LearningState{
  const date=localSessionDate(now);const previous=state.dailySessions[date];
  return{...state,dailySessions:{...state.dailySessions,[date]:{
    ...previous,date,availableMinutes:10,energyBefore:previous?.energyBefore??3,checkedInAt:previous?.checkedInAt??now.toISOString(),
    rescueMode:{policyVersion:"save-my-day-ten-minute-v1",selectedAt:now.toISOString(),evidenceBoundary:"learner-selected-ten-minute-plan-no-completion-mastery-or-penalty"},
  }}};
}

export function saveDailyReflection(
  state: LearningState,
  input: {
    difficultyAfter: NonNullable<DailySessionRecord["difficultyAfter"]>;
    confidenceAfter: NonNullable<DailySessionRecord["confidenceAfter"]>;
    reflection: string;
    nextFocus: SessionNextFocus;
  },
  now = new Date(),
): LearningState {
  const date = localSessionDate(now);
  const previous = state.dailySessions[date] ?? {
    date,
    availableMinutes: planningPresetMinutes(state).minutes,
    energyBefore: 3 as const,
    checkedInAt: now.toISOString(),
  };
  return {
    ...state,
    dailySessions: {
      ...state.dailySessions,
      [date]: {
        ...previous,
        difficultyAfter: input.difficultyAfter,
        confidenceAfter: input.confidenceAfter,
        reflection: input.reflection.trim().slice(0, 1000),
        nextFocus: input.nextFocus,
        reflectedAt: now.toISOString(),
      },
    },
  };
}

export function applyImmediateSessionAdaptation(
  state: LearningState,
  currentMission: MissionBlock[],
  reason: SessionAdaptationReason,
  now = new Date(),
  id = `adapt-${crypto.randomUUID()}`,
) {
  const date=localSessionDate(now);
  const previous=state.dailySessions[date]??{
    date,
    availableMinutes:planningPresetMinutes(state).minutes,
    energyBefore:3 as const,
    checkedInAt:now.toISOString(),
  };
  const beforeMinutes=currentMission.reduce((sum,block)=>sum+block.minutes,0)||previous.availableMinutes;
  const completedBlockIdsBefore=currentMission.filter((block)=>state.completedBlockIds.includes(`${date}:${block.id}`)).map((block)=>block.id);
  const completedMinutes=currentMission.filter((block)=>completedBlockIdsBefore.includes(block.id)).reduce((sum,block)=>sum+block.minutes,0);
  const reflectionPending=currentMission.some((block)=>block.id==="reflection")&&!completedBlockIdsBefore.includes("reflection");
  const minimumBudget=Math.max(10,completedMinutes+(reflectionPending?2:0));
  const lower=validSessionBudgets.filter((budget)=>budget<beforeMinutes&&budget>=minimumBudget);
  let afterMinutes=beforeMinutes;
  if(reason==="less-time")afterMinutes=lower.at(-1)??beforeMinutes;
  if(reason==="too-hard"||reason==="load-suggestion")afterMinutes=[...lower].reverse().find((budget)=>budget<=20)??lower.at(-1)??beforeMinutes;
  const record={
    id,
    policyVersion:SESSION_ADAPTATION_VERSION,
    reason,
    beforeMinutes,
    afterMinutes,
    completedBlockIdsBefore,
    evidenceBoundary:SESSION_ADAPTATION_BOUNDARY,
    createdAt:now.toISOString(),
  } as const;
  const nextSession:DailySessionRecord={
    ...previous,
    availableMinutes:(validSessionBudgets.includes(afterMinutes as typeof validSessionBudgets[number])?afterMinutes:previous.availableMinutes) as LearnerProfile["dailyMinutes"],
    planningSignal:reason==="too-easy"?"too-easy":reason==="too-hard"?"too-hard":previous.planningSignal,
    adaptations:[...(previous.adaptations??[]),record],
  };
  const canShiftToProduction=reason==="too-easy"&&currentMission.some((block)=>block.id==="practice"&&!completedBlockIdsBefore.includes("practice"))&&currentMission.some((block)=>block.id==="production"&&!completedBlockIdsBefore.includes("production"));
  return{
    state:{...state,dailySessions:{...state.dailySessions,[date]:nextSession}},
    record,
    changed:afterMinutes<beforeMinutes||canShiftToProduction,
  };
}

export function chooseMissionAlternative(
  state: LearningState,
  currentMission: MissionBlock[],
  originalBlockId: string,
  now = new Date(),
  id = `alternative-${crypto.randomUUID()}`,
): { state: LearningState; record: MissionAlternativeRecord } {
  const date=localSessionDate(now);
  const original=currentMission.find((block)=>block.id===originalBlockId&&!block.alternativeForId);
  if(!original||!alternativeEligibleKinds.has(original.kind))throw new Error("هذه الكتلة لا تملك بديلًا مكافئًا آمنًا.");
  if(state.completedBlockIds.includes(`${date}:${original.id}`))throw new Error("لا يمكن رفض مهمة ثُبتت كمكتملة بالفعل.");
  const presentation=alternativePresentation[original.kind as keyof typeof alternativePresentation];
  const previous=state.dailySessions[date]??{
    date,
    availableMinutes:planningPresetMinutes(state).minutes,
    energyBefore:3 as const,
    checkedInAt:now.toISOString(),
  };
  const existing=previous.missionAlternatives?.find((record)=>record.originalBlockId===original.id);
  if(existing)return{state,record:existing};
  const record:MissionAlternativeRecord={
    id,
    policyVersion:MISSION_ALTERNATIVE_VERSION,
    date,
    originalBlockId:original.id,
    alternativeBlockId:`alternative-${original.id}`,
    originalKind:original.kind,
    alternativeTitleAr:presentation.titleAr,
    alternativeTitleDe:presentation.titleDe,
    objectiveSnapshot:original.objective,
    evidenceKind:original.evidenceKind,
    minutes:original.minutes,
    href:original.href??presentation.fallbackHref,
    reason:"learner-declined-now",
    originalCompletedAtSelection:false,
    evidenceBoundary:MISSION_ALTERNATIVE_BOUNDARY,
    createdAt:now.toISOString(),
  };
  return{
    state:{...state,dailySessions:{...state.dailySessions,[date]:{...previous,missionAlternatives:[...(previous.missionAlternatives??[]),record]}}},
    record,
  };
}

export function applySelectedMissionAlternatives(state:LearningState, mission:MissionBlock[], now=new Date()):MissionBlock[]{
  const records=state.dailySessions[localSessionDate(now)]?.missionAlternatives??[];
  return mission.map((block)=>{
    const record=[...records].reverse().find((candidate)=>candidate.originalBlockId===block.id);
    if(!record)return block;
    return{
      ...block,
      id:record.alternativeBlockId,
      titleAr:record.alternativeTitleAr,
      titleDe:record.alternativeTitleDe,
      minutes:record.minutes,
      objective:record.objectiveSnapshot,
      evidenceKind:record.evidenceKind,
      href:record.href,
      alternativeForId:record.originalBlockId,
    };
  });
}

export function recordVisibleSessionActivity(state:LearningState, seconds:number, now=new Date()):LearningState{
  const date=localSessionDate(now);const previous=state.dailySessions[date];
  if(!previous||!Number.isFinite(seconds)||seconds<=0)return state;
  const bounded=Math.min(120,Math.max(1,Math.round(seconds)));
  return{...state,dailySessions:{...state.dailySessions,[date]:{...previous,activeSeconds:(previous.activeSeconds??0)+bounded,activeTimeUpdatedAt:now.toISOString()}}};
}

function recentConsecutiveErrors(state:LearningState, checkedInAt:string):number{
  const started=Date.parse(checkedInAt);
  const attempts=state.exerciseAttempts.filter((attempt)=>Date.parse(attempt.createdAt)>=started).sort((left,right)=>Date.parse(right.createdAt)-Date.parse(left.createdAt));
  let count=0;for(const attempt of attempts){if(attempt.correct)break;count+=1;}return count;
}

export function detectLoadReductionTrigger(state:LearningState, currentMission:MissionBlock[], now=new Date()):{trigger:LoadReductionTrigger;consecutiveErrorCount:number;activeSeconds:number;plannedSeconds:number}|null{
  const session=state.dailySessions[localSessionDate(now)];
  if(!session||session.reflectedAt||session.loadReductionOffer)return null;
  const plannedSeconds=Math.max(1,currentMission.reduce((sum,block)=>sum+block.minutes,0))*60;
  const consecutiveErrorCount=recentConsecutiveErrors(state,session.checkedInAt);
  const activeSeconds=session.activeSeconds??0;
  if(consecutiveErrorCount>=3)return{trigger:"consecutive-errors",consecutiveErrorCount,activeSeconds,plannedSeconds};
  const overrunThreshold=Math.max(Math.round(plannedSeconds*1.25),plannedSeconds+300);
  if(activeSeconds>=overrunThreshold)return{trigger:"active-time-overrun",consecutiveErrorCount,activeSeconds,plannedSeconds};
  return null;
}

export function recordLoadReductionOffer(
  state:LearningState,
  signal:NonNullable<ReturnType<typeof detectLoadReductionTrigger>>,
  now=new Date(),
  id=`load-offer-${crypto.randomUUID()}`,
):LearningState{
  const date=localSessionDate(now);const previous=state.dailySessions[date];
  if(!previous||previous.loadReductionOffer)return state;
  const offer:LoadReductionOfferRecord={id,policyVersion:LOAD_REDUCTION_OFFER_VERSION,trigger:signal.trigger,consecutiveErrorCount:signal.consecutiveErrorCount,activeSeconds:signal.activeSeconds,plannedSeconds:signal.plannedSeconds,status:"pending",offeredOnce:true,evidenceBoundary:LOAD_REDUCTION_OFFER_BOUNDARY,offeredAt:now.toISOString()};
  return{...state,dailySessions:{...state.dailySessions,[date]:{...previous,loadReductionOffer:offer}}};
}

export function decideLoadReductionOffer(state:LearningState,currentMission:MissionBlock[],accepted:boolean,now=new Date()){
  const date=localSessionDate(now);const session=state.dailySessions[date];const offer=session?.loadReductionOffer;
  if(!session||!offer||offer.status!=="pending")return{state,adaptationRecord:undefined};
  const adapted=accepted?applyImmediateSessionAdaptation(state,currentMission,"load-suggestion",now):{state,record:undefined};
  const adaptedSession=adapted.state.dailySessions[date]??session;
  const nextOffer:LoadReductionOfferRecord={...offer,status:accepted?"accepted":"declined",decidedAt:now.toISOString()};
  return{state:{...adapted.state,dailySessions:{...adapted.state.dailySessions,[date]:{...adaptedSession,loadReductionOffer:nextOffer}}},adaptationRecord:adapted.record};
}

export function latestSessionBefore(state: LearningState, date = localSessionDate()): DailySessionRecord | undefined {
  return Object.values(state.dailySessions)
    .filter((session) => session.date < date && session.reflectedAt)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
}

export function effectiveSessionMinutes(state: LearningState, now = new Date()): LearnerProfile["dailyMinutes"] {
  const date = localSessionDate(now);
  const today = state.dailySessions[date];
  const configured = today?.availableMinutes ?? planningPresetMinutes(state).minutes;
  const previous = latestSessionBefore(state, date);
  const shouldReduce = (today?.energyBefore ?? 3) <= 2 || today?.planningSignal === "too-hard" || (!today && previous?.nextFocus === "lighter");
  return (shouldReduce ? Math.min(configured, 20) : configured) as LearnerProfile["dailyMinutes"];
}

export function nextFocusLabel(focus: SessionNextFocus): string {
  return focus === "review" ? "ابدأ بالمراجعة والاسترجاع قبل محتوى جديد."
    : focus === "lighter" ? "ابدأ بجلسة أخف لا تتجاوز عشرين دقيقة ما لم تغيّر وقتك."
      : focus === "production" ? "أعطِ مهمة الكتابة أو الكلام أولوية في الجلسة التالية."
        : "واصل أول هدف غير مكتمل مع إبقاء المراجعة والإنتاج في الجلسة.";
}
