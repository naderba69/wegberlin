"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, BrainCircuit, CalendarCheck2, Check, ChevronLeft, CircleAlert, ClipboardCheck, Clock3, FilePenLine, Flame, Mic2, RotateCcw, Sparkles, Target } from "lucide-react";
import { buildRetrievalWarmup, composeTodayMission, getCoachTarget, missionRationale, type RetrievalWarmupItem } from "@/core/coach/coach";
import { behavioralPraise } from "@/core/coach/behavioral-praise";
import { applyImmediateSessionAdaptation, chooseMissionAlternative, decideLoadReductionOffer, detectLoadReductionTrigger, nextFocusLabel, recordLoadReductionOffer, saveDailyCheckIn, saveDailyReflection, startTenMinuteRescueMode } from "@/core/coach/session-signals";
import { buildWeeklyPlan, weeklyBudgetLabel } from "@/core/coach/weekly-plan";
import { deriveJourneyState, journeyPhases } from "@/core/coach/journey-state";
import type { DailySessionRecord, LearnerProfile, MissionBlock, SessionNextFocus } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { buildEvidenceReport } from "@/core/evidence/report";
import { ReadingBenchmark } from "./reading-benchmark";
import { LearningContractSummary } from "./learning-contract-summary";
import { TodayOfflineReadiness } from "./today-offline-readiness";
import { buildTodayOfflineRequirements } from "@/core/offline/today-readiness";
import { PlanChangeTimeline } from "./plan-change-timeline";
import { planningPresetMinutes } from "@/core/coach/intensity-presets";
import { WeeklyReflection } from "./weekly-reflection";
import { buildStartingGoalReport } from "@/core/coach/starting-goal-report";
import { buildExamTargetForecast } from "@/core/coach/exam-target-forecast";
import { DailyFocusTools } from "./daily-focus-tools";

const kindIcons = { diagnostic: ClipboardCheck, "check-in": Sparkles, review: RotateCcw, warmup: BrainCircuit, lesson: BrainCircuit, reading: BookOpenCheck, writing: FilePenLine, practice: Target, production: Mic2, reflection: CalendarCheck2 };
const ratingValues = [1, 2, 3, 4, 5] as const;

function RetrievalWarmupCard({block,index,items,isDone,onComplete,gamificationVisible}:{block:MissionBlock;index:number;items:RetrievalWarmupItem[];isDone:boolean;onComplete:()=>void;gamificationVisible:boolean}){
  const[position,setPosition]=useState(0);
  const[revealed,setRevealed]=useState(false);
  const item=items[Math.min(position,Math.max(0,items.length-1))];
  function grade(){const nextPosition=position+1;setRevealed(false);if(nextPosition>=items.length)onComplete();else setPosition(nextPosition)}
  return <section className={isDone?"retrieval-warmup-card done":"retrieval-warmup-card"} data-warmup-policy={items[0]?.policyVersion}>
    <header><span className="mission-check">{isDone?<Check size={16}/>:index+1}</span><span className="mission-icon"><BrainCircuit size={19}/></span><div><strong>{block.titleAr}</strong><small lang="de" dir="ltr">{block.titleDe}</small><p>{block.objective}</p></div><b>{block.minutes} د</b></header>
    {isDone?<StatusAnnouncement message={gamificationVisible?`اكتملت ${items.length}/${items.length} محاولات تمهيدية. ${behavioralPraise("warmup-complete")}`:`اكتملت ${items.length}/${items.length} محاولات تمهيدية. انتقل إلى الخطوة التالية.`} channel="retrieval-warmup" className="warmup-complete" icon={<Check size={17}/>}/>:item?<div className="warmup-prompt"><header><span>{position+1}/{items.length}</span><strong lang="de" dir="ltr">Sagen Sie die deutsche Wendung.</strong><small>قل العبارة الألمانية الموافقة للمعنى، أو اكشفها دون تخمين.</small></header><blockquote>{item.cueAr}</blockquote>{revealed?<><p lang="de" dir="ltr">{item.answerDe}</p><div><button type="button" onClick={grade}>أحتاج إعادتها</button><button type="button" onClick={grade}>تذكرتها قبل الكشف</button></div></>:<button type="button" onClick={()=>setRevealed(true)}>اكشف بعد محاولة الاسترجاع</button>}</div>:<button type="button" onClick={onComplete}>ثبّت عدم وجود عبارات للتمهيد</button>}
  </section>;
}

export function CoachDashboard() {
  const { state, update } = useLearning();
  const gamificationVisible=state.motivationPreferences.gamificationVisible;
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const todaySession = state.dailySessions[localDate];
  const presetPlan=planningPresetMinutes(state);
  const [energyBefore,setEnergyBefore]=useState<DailySessionRecord["energyBefore"]>(todaySession?.energyBefore??3);
  const [availableMinutes,setAvailableMinutes]=useState<LearnerProfile["dailyMinutes"]>(todaySession?.availableMinutes??presetPlan.minutes);
  const [difficultyAfter,setDifficultyAfter]=useState<NonNullable<DailySessionRecord["difficultyAfter"]>>(todaySession?.difficultyAfter??3);
  const [confidenceAfter,setConfidenceAfter]=useState<NonNullable<DailySessionRecord["confidenceAfter"]>>(todaySession?.confidenceAfter??3);
  const [reflection,setReflection]=useState(todaySession?.reflection??"");
  const [nextFocus,setNextFocus]=useState<SessionNextFocus>(todaySession?.nextFocus??"continue");
  const [adaptationMessage,setAdaptationMessage]=useState("");
  const mission = composeTodayMission(state,now);
  const warmupItems = buildRetrievalWarmup(state,now);
  const report = buildEvidenceReport(state, now);
  const journeyState = deriveJourneyState(state);
  const weeklyPlan = buildWeeklyPlan(state,now);
  const startingGoalReport=buildStartingGoalReport(state);
  const targetForecast=buildExamTargetForecast(state,now);
  const missionKey = (id:string) => `${localDate}:${id}`;
  const completed = new Set(state.completedBlockIds.filter((id) => id.startsWith(`${localDate}:`)));
  const doneMinutes = mission.filter((block) => completed.has(missionKey(block.id))).reduce((sum, block) => sum + block.minutes, 0);
  const totalMinutes = mission.reduce((sum, b) => sum + b.minutes, 0);
  const percent = Math.round((doneMinutes / Math.max(totalMinutes, 1)) * 100);
  const target = getCoachTarget(state);
  const needsDiagnostic = target.kind === "diagnostic";
  const primaryHref = target.href;
  const heroTitle = needsDiagnostic ? "لن نخمن مستواك." : target.kind === "review" ? "المراجعة أولويتك الآن." : target.kind === "errors" ? "العلاج المستحق قبل الجديد." : target.kind === "assessment" ? "حان وقت بوابة المستوى." : target.kind === "exam" ? "هذه أضعف وحدة امتحانية." : "هذه خطوتك التالية.";
  const heroAccent = needsDiagnostic ? "سنقيس نقطة البداية." : target.titleAr;
  const actionLabel = needsDiagnostic ? "ابدأ التشخيص" : target.kind === "review" ? "ابدأ المراجعة" : target.kind === "errors" ? "افتح عيادة الأخطاء" : target.kind === "assessment" ? "ابدأ بوابة المستوى" : target.kind === "exam" ? "ابدأ تدريب الوحدة" : "ابدأ المهمة";
  const dateLabel = new Intl.DateTimeFormat("ar-TN", { weekday:"long", day:"numeric", month:"long" }).format(now);
  const journeyDay = state.profile ? Math.max(1, Math.floor((now.getTime()-Date.parse(state.profile.createdAt))/86_400_000)+1) : 1;
  const studiedDates = new Set(state.studyHistory.filter((day)=>day.minutes>0||day.evidenceCount>0).map((day)=>day.date));
  const weekDays = Array.from({length:7},(_,index)=>{const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(6-index));const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;return{key,label:new Intl.DateTimeFormat("ar-TN",{weekday:"narrow"}).format(date),day:date.getDate(),studied:studiedDates.has(key),today:index===6}});
  const primaryRisk = report.risks[0];
  const offlineRequirements=buildTodayOfflineRequirements(state,mission,target);
  const automaticLoadSignal=detectLoadReductionTrigger(state,mission,now);
  const loadReductionOffer=todaySession?.loadReductionOffer;

  useEffect(()=>{
    if(!automaticLoadSignal)return;
    const timeout=window.setTimeout(()=>update((current)=>recordLoadReductionOffer(current,automaticLoadSignal,new Date())),0);
    return()=>window.clearTimeout(timeout);
  },[automaticLoadSignal,update]);

  function toggle(id: string) {
    const scopedId=missionKey(id);
    update((current) => ({ ...current,
      completedBlockIds: current.completedBlockIds.includes(scopedId)
        ? current.completedBlockIds.filter((item) => item !== scopedId)
        : [...current.completedBlockIds, scopedId],
    }));
  }

  function completeWarmup(){const scopedId=missionKey("warmup");update((current)=>current.completedBlockIds.includes(scopedId)?current:{...current,completedBlockIds:[...current.completedBlockIds,scopedId]})}
  function saveCheckIn(){update((current)=>{const next=saveDailyCheckIn(current,{availableMinutes,energyBefore});const scopedId=missionKey("check-in");return{...next,completedBlockIds:next.completedBlockIds.includes(scopedId)?next.completedBlockIds:[...next.completedBlockIds,scopedId]}})}
  function saveReflection(){update((current)=>{const next=saveDailyReflection(current,{difficultyAfter,confidenceAfter,reflection,nextFocus});const scopedId=missionKey("reflection");return{...next,completedBlockIds:next.completedBlockIds.includes(scopedId)?next.completedBlockIds:[...next.completedBlockIds,scopedId]}})}
  function startRescueMode(){update((current)=>startTenMinuteRescueMode(current,new Date()));setAvailableMinutes(10);setAdaptationMessage("فُعّل «أنقذ يومي»: عشر دقائق مفيدة فقط. لا نعدّ التفعيل إنجازًا ولا نمس الأدلة السابقة.")}
  function adaptSession(reason:"less-time"|"too-easy"|"too-hard"){
    const outcome=applyImmediateSessionAdaptation(state,mission,reason,now);
    update(()=>outcome.state);
    setAvailableMinutes(outcome.record.afterMinutes as LearnerProfile["dailyMinutes"]);
    setAdaptationMessage(reason==="too-easy"?outcome.changed?"سجّلنا أن الحمل سهل وحولنا وقتًا من التدريب الموجّه إلى إنتاج أبعد عن المثال؛ لم يتغير الإتقان.":"سجّلنا إشارة السهولة للتخطيط، لكن لا توجد كتلة تدريب موجّه غير منجزة لنقل وقتها؛ لم يتغير الإتقان.":reason==="too-hard"?outcome.changed?`خفضنا بقية الخطة من ${outcome.record.beforeMinutes} إلى ${outcome.record.afterMinutes} دقيقة مع إبقاء الأدلة المثبتة.`:"لا توجد ميزانية أقصر آمنة بعد الوقت المثبت؛ احتفظنا بالتأمل دون حذف دليل.":outcome.changed?`أعدنا تركيب الجلسة من ${outcome.record.beforeMinutes} إلى ${outcome.record.afterMinutes} دقيقة دون حذف ما أنجزته.`:"لا توجد مدة أقصر تحافظ على الكتل المنجزة والإغلاق؛ لم نحذف أي دليل.");
  }
  function selectMissionAlternative(blockId:string){
    try{const outcome=chooseMissionAlternative(state,mission,blockId,now);update(()=>outcome.state);setAdaptationMessage("استبدلنا المهمة ببديل له الهدف ونوع الدليل والمدة نفسها. المهمة الأصلية لم تُثبت كمكتملة ولم يتغير الإتقان.");}
    catch(error){setAdaptationMessage(error instanceof Error?error.message:"تعذر اختيار البديل.")}
  }
  function answerLoadReduction(accepted:boolean){
    const outcome=decideLoadReductionOffer(state,mission,accepted,now);update(()=>outcome.state);
    if(outcome.adaptationRecord)setAvailableMinutes(outcome.adaptationRecord.afterMinutes as LearnerProfile["dailyMinutes"]);
    setAdaptationMessage(accepted?outcome.adaptationRecord&&outcome.adaptationRecord.afterMinutes<outcome.adaptationRecord.beforeMinutes?`اخترت التخفيف: أعيدت بقية الجلسة إلى ${outcome.adaptationRecord.afterMinutes} دقيقة دون حذف أي دليل أو معاقبة الخطأ.`:"سُجل قبولك، لكن لا توجد مدة أقصر آمنة بعد الكتل المثبتة؛ لم نحذف شيئًا.":"أبقيت الحمل الحالي. لن نكرر هذا الاقتراح في الجلسة ولن نعاقب قرارك.");
  }

  return (
    <div className="dashboard-grid">
      <section className="dashboard-main">
        <div className="date-kicker"><span>{dateLabel}</span>{gamificationVisible&&<><i /><b className="gamification-surface inline-gamification">اليوم {journeyDay} في رحلتك</b></>}</div>
        <section className="journey-state-card" data-journey-policy={journeyState.policyVersion}>
          <header><span><Target size={18}/></span><div><small>مرحلة الرحلة الحالية</small><h2>{journeyState.titleAr} <b lang="de" dir="ltr">{journeyState.titleDe}</b></h2><p>{journeyState.reasonAr}</p></div><strong>{journeyState.progressPercent}%</strong></header>
          <nav aria-label="مراحل رحلة التعلم الخمس">{journeyPhases.map((phase,index)=><span key={phase.id} className={index<journeyState.phaseIndex?"complete":index===journeyState.phaseIndex?"active":""} aria-current={index===journeyState.phaseIndex?"step":undefined}><i>{index+1}</i><b>{phase.titleAr}</b><small lang="de" dir="ltr">{phase.titleDe}</small></span>)}</nav>
          <div className="journey-state-progress"><i role="progressbar" aria-label="تقدم المرحلة الحالية" aria-valuemin={0} aria-valuemax={100} aria-valuenow={journeyState.progressPercent}><b style={{width:`${journeyState.progressPercent}%`}}/></i><p><strong>شرط الانتقال:</strong> {journeyState.nextTransitionAr}</p></div>
          <footer>{journeyState.evidenceBoundaryAr}</footer>
        </section>
        <LearningContractSummary />
        <div className="mission-hero">
          <div className="hero-copy">
            <span className="eyebrow light"><Sparkles size={15}/> مهمة اليوم</span>
            <h1>{heroTitle}<br/><em>{heroAccent}</em></h1>
            <p>{missionRationale(state)}</p>
            <div className="hero-actions"><Link href={primaryHref} className="hero-button">{actionLabel} <ArrowLeft size={18}/></Link><span><Clock3 size={16}/> نحو {totalMinutes} دقيقة</span></div>
          </div>
          <div className="hero-route gamification-surface" aria-hidden="true">
            <span className="route-city">BERLIN</span>
            <svg viewBox="0 0 260 180"><path d="M20 148C62 153 70 95 120 108c39 10 45-52 113-66" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeDasharray="4 9" strokeLinecap="round"/><circle cx="20" cy="148" r="7" fill="#f0b44c"/><circle cx="120" cy="108" r="5" fill="white"/><path d="M214 26h34v45h-9V58h-15v13h-10V26Z" fill="rgba(255,255,255,.16)"/></svg>
          </div>
        </div>

        <TodayOfflineReadiness requirements={offlineRequirements}/>
        <PlanChangeTimeline />

        <details className="starting-goal-report" data-starting-goal-report-policy={startingGoalReport.policyVersion}>
          <summary><Target size={18}/><span><small>تقرير بداية قابل للمراجعة</small><strong>لماذا اختار المرشد هذه الأهداف؟</strong></span><b>{startingGoalReport.rows.length} أدلة</b></summary>
          <div>{startingGoalReport.rows.map((row)=><article key={row.id}><strong>{row.goalAr}</strong><p>{row.evidenceAr}</p><small data-bidi-scope="technical" dir="ltr">{row.evidenceRef}</small><footer>{row.boundaryAr}</footer></article>)}</div>
        </details>

        <section className={todaySession?.rescueMode?"rescue-day-card active":"rescue-day-card"} data-rescue-day-policy="save-my-day-ten-minute-v1">
          <div><Clock3 size={19}/><span><small lang="de" dir="ltr">Rette meinen Lerntag</small><strong>أنقذ يومي بجلسة مفيدة من 10 دقائق</strong><p>استرجاع قصير، خطوة تعلم أو نقل، ثم إغلاق إن أبقيته مفعّلًا. لا دين غدًا ولا إتقان بمجرد الضغط.</p></span></div>
          <button type="button" onClick={startRescueMode}>{todaySession?.rescueMode?"أعد تركيب 10 دقائق":"فعّل جلسة الإنقاذ"}</button>
        </section>

        <DailyFocusTools mission={mission}/>

        {todaySession?.checkedInAt&&<section className="session-adaptation-card" data-adaptation-policy="session-adaptation-v1">
          <header><span><Clock3 size={17}/></span><div><strong>عدّل بقية الجلسة الآن</strong><small>إشارة تخطيط فقط؛ لا تمنح إتقانًا ولا تسجل جوابًا صحيحًا.</small></div></header>
          <div><button type="button" onClick={()=>adaptSession("less-time")}><Clock3 size={15}/> لدي وقت أقل</button><button type="button" onClick={()=>adaptSession("too-easy")}><ArrowLeft size={15}/> هذا سهل — زد النقل</button><button type="button" onClick={()=>adaptSession("too-hard")}><RotateCcw size={15}/> هذا صعب — خفف الحمل</button></div>
          {adaptationMessage&&<StatusAnnouncement message={adaptationMessage} channel="session-adaptation" className="compact" icon={<Check size={15}/>}/>} 
          <footer>تبقى الكتل المنجزة مثبتة، ويُحفظ سبب التعديل والوقت قبل/بعد داخل نسختك المحلية.</footer>
        </section>}

        {loadReductionOffer?.status==="pending"&&<section className="load-reduction-offer" data-load-offer-policy={loadReductionOffer.policyVersion}>
          <header><CircleAlert size={19}/><div><strong>هل تريد تخفيف بقية الجلسة؟</strong><small>{loadReductionOffer.trigger==="consecutive-errors"?`ظهرت ${loadReductionOffer.consecutiveErrorCount} إجابات غير صحيحة متتالية منذ التهيئة.`:`بلغ وقت النشاط الفعلي ${Math.ceil(loadReductionOffer.activeSeconds/60)} دقيقة مقابل ${Math.round(loadReductionOffer.plannedSeconds/60)} مخططة.`}</small></div></header>
          <p>هذا اقتراح واحد فقط، وليس حكمًا على قدرتك. القرار لك، والخطأ لا يمحو دليلًا ولا يخفض الإتقان.</p>
          <div><button type="button" onClick={()=>answerLoadReduction(true)}>نعم، خفف البقية</button><button type="button" onClick={()=>answerLoadReduction(false)}>لا، أبقِ خطتي</button></div>
        </section>}

        <ReadingBenchmark/>

        <div className="section-heading"><div><span>خطة الجلسة</span><h2>خطوات قليلة، كل واحدة لها سبب</h2></div><strong>{doneMinutes}/{totalMinutes} دقيقة</strong></div>
        <div className="mission-list">
          {mission.map((block, index) => {
            const Icon = kindIcons[block.kind];
            const isDone = completed.has(missionKey(block.id));
            if(block.kind==="warmup")return <RetrievalWarmupCard key={block.id} block={block} index={index} items={warmupItems} isDone={isDone} onComplete={completeWarmup} gamificationVisible={gamificationVisible}/>;
            if(block.kind==="check-in")return <section key={block.id} className={isDone?"session-signal-card done":"session-signal-card"}>
              <header><span className="mission-check">{isDone?<Check size={16}/>:index+1}</span><span className="mission-icon"><Icon size={19}/></span><div><strong>{block.titleAr}</strong><small lang="de" dir="ltr">{block.titleDe}</small><p>اختر طاقتك والوقت الحقيقي المتاح؛ الطاقة المنخفضة تخفّض الخطة إلى عشرين دقيقة كحد أقصى.</p></div><b>{block.minutes} د</b></header>
              <div className="session-signal-fields"><label><span>الطاقة قبل الجلسة</span><div className="signal-scale">{ratingValues.map((value)=><button type="button" key={value} aria-pressed={energyBefore===value} className={energyBefore===value?"active":""} onClick={()=>setEnergyBefore(value)}>{value}</button>)}</div></label><label><span>الوقت المتاح فعلًا</span><select value={availableMinutes} onChange={(event)=>setAvailableMinutes(Number(event.target.value) as LearnerProfile["dailyMinutes"])}>{[10,20,30,45,60,90].map((value)=><option key={value} value={value}>{value} دقيقة</option>)}</select></label></div>
              <footer><small>{todaySession?.checkedInAt?"يمكنك تعديل الفحص؛ ستُعاد موازنة خطة اليوم دون حذف الأدلة.":"1 = طاقة منخفضة، 5 = طاقة مرتفعة."}</small><button type="button" onClick={saveCheckIn}>{isDone?"حدّث التهيئة":"ثبّت تهيئة اليوم"}</button></footer>
            </section>;
            if(block.kind==="reflection")return <section key={block.id} className={isDone?"session-signal-card reflection done":"session-signal-card reflection"}>
              <header><span className="mission-check">{isDone?<Check size={16}/>:index+1}</span><span className="mission-icon"><Icon size={19}/></span><div><strong>{block.titleAr}</strong><small lang="de" dir="ltr">{block.titleDe}</small><p>سجّل صعوبة الجلسة وثقتك واختر القرار الذي يجب أن يؤثر في البداية التالية.</p></div><b>{block.minutes} د</b></header>
              <div className="session-signal-fields reflection-fields"><label><span>الصعوبة بعد الجلسة</span><div className="signal-scale">{ratingValues.map((value)=><button type="button" key={value} aria-pressed={difficultyAfter===value} className={difficultyAfter===value?"active":""} onClick={()=>setDifficultyAfter(value)}>{value}</button>)}</div></label><label><span>ثقتي دون مساعدات</span><div className="signal-scale">{ratingValues.map((value)=><button type="button" key={value} aria-pressed={confidenceAfter===value} className={confidenceAfter===value?"active":""} onClick={()=>setConfidenceAfter(value)}>{value}</button>)}</div></label><label><span>قرار الجلسة التالية</span><select value={nextFocus} onChange={(event)=>setNextFocus(event.target.value as SessionNextFocus)}><option value="continue">واصل المسار</option><option value="review">ابدأ بالمراجعة</option><option value="lighter">خفف الحمل</option><option value="production">أعطِ الإنتاج أولوية</option></select></label></div>
              <label className="session-reflection-note"><span>ملاحظة قصيرة اختيارية</span><textarea maxLength={1000} value={reflection} onChange={(event)=>setReflection(event.target.value)} placeholder="ما الذي نجح؟ وما الفجوة التي يجب ألا ينساها المدرب؟"/></label>
              <footer><small>{todaySession?.reflectedAt?nextFocusLabel(todaySession.nextFocus??"continue"):"لا توجد درجة آلية هنا؛ هذه إشارة تخطيط منك."}</small><button type="button" onClick={saveReflection}>{isDone?"حدّث الإغلاق":"احفظ قرار الغد"}</button></footer>
            </section>;
            const canUseAlternative=["review","lesson","reading","writing","practice","production"].includes(block.kind)&&!block.alternativeForId;
            return <article key={block.id} className={block.alternativeForId?"mission-row-shell alternative":"mission-row-shell"}>
              <button className={isDone ? "mission-row done" : "mission-row"} onClick={() => toggle(block.id)}>
                <span className="mission-check">{isDone ? <Check size={16}/> : index + 1}</span>
                <span className="mission-icon"><Icon size={19}/></span>
                <span className="mission-copy"><strong>{block.titleAr}</strong><small lang="de" dir="ltr">{block.titleDe}</small><p>{block.objective}</p></span>
                <span className="mission-time">{block.minutes} د</span>
                <ChevronLeft size={18} />
              </button>
              {canUseAlternative&&!isDone&&<div className="mission-substitution-action"><button type="button" onClick={()=>selectMissionAlternative(block.id)}>لا يناسبني الآن</button><small>بديل بنفس الهدف والدليل والمدة؛ لا يكمل الأصل.</small></div>}
              {block.alternativeForId&&<div className="mission-substitution-action selected"><span><Check size={14}/> بديل مكافئ · الأصل غير مكتمل</span>{block.href&&<Link href={block.href}>افتح البديل</Link>}</div>}
            </article>;
          })}
        </div>

        <section className="weekly-plan-card">
          <header><div><span className="eyebrow"><CalendarCheck2 size={14}/> خطة الأسبوع</span><h2>وقت موزع، لا ديون تتضاعف.</h2><p>ستة أيام دراسة ويوم راحة، ومعهما يوم سماح واحد ظاهر أسبوعيًا. يوم السماح لا يصنع دليلًا ولا يضاعف حمل العودة.</p></div><div><strong>{weeklyBudgetLabel(weeklyPlan.plannedMinutes)}</strong><small>{weeklyPlan.weekStart} → {weeklyPlan.weekEnd}</small></div></header>
          <div className={weeklyPlan.graceDayDate?"continuity-policy applied":"continuity-policy"}><CalendarCheck2 size={15}/><p><b>سياسة الاستمرارية · weekly-grace-v1:</b> {weeklyPlan.graceDayDate?`استُخدم يوم السماح في ${weeklyPlan.graceDayDate}. عد من الخطة الحالية دون تعويضه.`:"يوم سماح واحد متاح هذا الأسبوع؛ لا تحتاج إلى سلسلة مثالية حتى تحافظ على العودة."}</p></div>
          <section className={`weekly-time-comparison ${weeklyPlan.timeComparison.status}`} data-time-comparison-policy={weeklyPlan.timeComparison.policyVersion}>
            <header><div><small>حتى {weeklyPlan.timeComparison.throughDate}</small><strong>المخطط والمسجل — بلا لوم</strong></div><span><b>{weeklyPlan.timeComparison.plannedToDateMinutes}</b> مخطط</span><span><b>{weeklyPlan.timeComparison.actualRecordedMinutes}</b> مسجل</span></header>
            <p>{weeklyPlan.timeComparison.messageAr}</p><footer>الدقائق المسجلة تقديرات الأنشطة المحفوظة، لا مؤقت مراقبة. الفرق لا يغيّر الإتقان أو البوابة.</footer>
          </section>
          <section className={`target-date-forecast ${targetForecast.status}`} data-target-date-load-policy={targetForecast.policyVersion}>
            <header><Target size={17}/><div><small>الحمل حتى التاريخ المستهدف</small><strong>{targetForecast.status==="no-date"?"لا يوجد تاريخ ملزم":targetForecast.status==="past-date"?"التاريخ يحتاج تحديثًا":targetForecast.status==="load-gap"?"الخطة الحالية دون الحمل التقديري":"الحمل التقديري داخل الخطة"}</strong></div>{targetForecast.requiredWeeklyMinutes!==null&&<b>{targetForecast.requiredWeeklyMinutes} د/أسبوع</b>}</header>
            {targetForecast.targetDate&&<p>إلى {targetForecast.targetDate}: نحو {targetForecast.remainingStudyMinutes} دقيقة متبقية موزعة على {targetForecast.weeksRemaining} أسابيع؛ المخطط الحالي {targetForecast.plannedWeeklyMinutes} دقيقة أسبوعيًا.</p>}
            <ul>{targetForecast.solutionsAr.map((solution)=><li key={solution}>{solution}</li>)}</ul><footer>تقدير تخطيط شفاف للدروس والبوابات وعينات الجهة المختارة؛ ليس احتمال نجاح أو نتيجة رسمية ولا يغيّر mastery.</footer>
          </section>
          {(weeklyPlan.missedStudyDays>0||weeklyPlan.deferredCount>0)&&<div className="weekly-recovery-note"><RotateCcw size={15}/><p>فاتك {weeklyPlan.missedStudyDays} يوم. نُقلت مهمة واحدة فقط إلى أقرب يوم متاح، وبقي {weeklyPlan.deferredCount} في طابور التعافي دون مضاعفة حمل اليوم.</p></div>}
          <div className="weekly-plan-days">{weeklyPlan.days.map((day)=><article key={day.date} className={`weekly-plan-day ${day.status}`}><header><div><strong>{day.weekdayAr}</strong><small>{day.date.slice(5)}</small></div><span>{day.status==="rest"?"راحة":day.status==="complete"?"مكتمل":day.status==="grace"?"سماح":day.status==="missed"?"فائت":day.status==="today"?"اليوم":"قادم"}</span><b>{day.budgetMinutes?`${day.budgetMinutes} د`:"—"}</b></header>{day.status==="rest"?<p>راحة مقصودة أو استماع خفيف اختياري؛ لا يوجد دين دراسة.</p>:day.status==="grace"?<p>يوم سماح مستخدم؛ لا دليل مزيف ولا مهمة تعويضية.</p>:<div>{day.slots.map((slot)=><Link key={slot.id} href={slot.href} className={slot.kind==="recovery"?"recovery":""}><span>{slot.titleAr}</span><b>{slot.minutes} د</b></Link>)}</div>}{day.recoverySourceDate&&<small>استعادة محدودة من {day.recoverySourceDate}</small>}</article>)}</div>
        </section>
        <WeeklyReflection/>
      </section>

      <aside className="dashboard-side">
        <div className="progress-card">
          <div className="progress-card-head"><div><small>إنجاز جلسة اليوم</small><strong>{percent}%</strong></div><div className="ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><span>{mission.filter((block)=>!completed.has(missionKey(block.id))).length}</span></div></div>
          <div className="progress-track"><i style={{ width: `${percent}%` }}/></div>
          <p>{percent === 100 ? gamificationVisible?behavioralPraise("session-complete"):"اكتملت كتل الجلسة المثبتة؛ ستبقى الأدلة والخطة كما هي في الوضع الهادئ." : "لا نحتاج جلسة مثالية؛ نحتاج دليلًا صادقًا على ما تستطيع فعله."}</p>
        </div>
        <div className="coach-note">
          <span className="coach-face">DW</span>
          <div><small>ملاحظة المرشد من أدلتك</small><p><b>{report.nextAction.titleAr}:</b> {report.nextAction.reasonAr}</p></div>
        </div>
        <div className="week-card">
          <div className="card-title"><span><CalendarCheck2 size={18}/> هذا الأسبوع</span><small>خطة مرنة</small></div>
          <div className="week-days">{weekDays.map((day) => <span key={day.key} className={day.today ? "today" : day.studied ? "studied" : ""}>{day.label}<i>{day.day}</i></span>)}</div>
          <div className="stat-pair"><div className="gamification-surface"><Flame size={18}/><span><strong>{report.studyStreakDays}</strong><small>أيام دراسة مستمرة</small></span></div><div><Clock3 size={18}/><span><strong>{doneMinutes}</strong><small>دقيقة خطة اليوم</small></span></div></div>
          {gamificationVisible&&report.graceDayDate&&<p className="grace-return-note gamification-surface">{behavioralPraise("grace-return")} <small>{report.graceDayDate}</small></p>}
        </div>
        <div className="risk-card"><CircleAlert size={20}/><div><strong>{primaryRisk?.titleAr ?? (report.overallScore===null?"الجاهزية لا تُقاس بعد":"لا يوجد خطر آلي مرتفع")}</strong><p>{primaryRisk?.reasonAr ?? (report.overallScore===null?"نحتاج أدلة من ثلاث مهارات على الأقل قبل حساب مؤشر متوازن.":`مؤشر الأدلة الحالي ${report.overallScore}% بعينة ${report.overallConfidence==="high"?"قوية":"ما زالت بحاجة للتوسيع"}.`)}</p></div></div>
      </aside>
    </div>
  );
}
