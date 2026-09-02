"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, CalendarCheck2, Check, ChevronLeft, CircleAlert, ClipboardCheck, Clock3, Flame, Mic2, RotateCcw, Sparkles, Target } from "lucide-react";
import { composeTodayMission, getCoachTarget, missionRationale } from "@/core/coach/coach";
import { nextFocusLabel, saveDailyCheckIn, saveDailyReflection } from "@/core/coach/session-signals";
import { buildWeeklyPlan, weeklyBudgetLabel } from "@/core/coach/weekly-plan";
import type { DailySessionRecord, LearnerProfile, SessionNextFocus } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { buildEvidenceReport } from "@/core/evidence/report";

const kindIcons = { diagnostic: ClipboardCheck, "check-in": Sparkles, review: RotateCcw, lesson: BrainCircuit, practice: Target, production: Mic2, reflection: CalendarCheck2 };
const ratingValues = [1, 2, 3, 4, 5] as const;

export function CoachDashboard() {
  const { state, update } = useLearning();
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const todaySession = state.dailySessions[localDate];
  const [energyBefore,setEnergyBefore]=useState<DailySessionRecord["energyBefore"]>(todaySession?.energyBefore??3);
  const [availableMinutes,setAvailableMinutes]=useState<LearnerProfile["dailyMinutes"]>(todaySession?.availableMinutes??state.profile?.dailyMinutes??45);
  const [difficultyAfter,setDifficultyAfter]=useState<NonNullable<DailySessionRecord["difficultyAfter"]>>(todaySession?.difficultyAfter??3);
  const [confidenceAfter,setConfidenceAfter]=useState<NonNullable<DailySessionRecord["confidenceAfter"]>>(todaySession?.confidenceAfter??3);
  const [reflection,setReflection]=useState(todaySession?.reflection??"");
  const [nextFocus,setNextFocus]=useState<SessionNextFocus>(todaySession?.nextFocus??"continue");
  const mission = composeTodayMission(state,now);
  const report = buildEvidenceReport(state, now);
  const weeklyPlan = buildWeeklyPlan(state,now);
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

  function toggle(id: string) {
    const scopedId=missionKey(id);
    update((current) => ({ ...current,
      completedBlockIds: current.completedBlockIds.includes(scopedId)
        ? current.completedBlockIds.filter((item) => item !== scopedId)
        : [...current.completedBlockIds, scopedId],
    }));
  }

  function saveCheckIn(){update((current)=>{const next=saveDailyCheckIn(current,{availableMinutes,energyBefore});const scopedId=missionKey("check-in");return{...next,completedBlockIds:next.completedBlockIds.includes(scopedId)?next.completedBlockIds:[...next.completedBlockIds,scopedId]}})}
  function saveReflection(){update((current)=>{const next=saveDailyReflection(current,{difficultyAfter,confidenceAfter,reflection,nextFocus});const scopedId=missionKey("reflection");return{...next,completedBlockIds:next.completedBlockIds.includes(scopedId)?next.completedBlockIds:[...next.completedBlockIds,scopedId]}})}

  return (
    <div className="dashboard-grid">
      <section className="dashboard-main">
        <div className="date-kicker"><span>{dateLabel}</span><i /> اليوم {journeyDay} في رحلتك</div>
        <div className="mission-hero">
          <div className="hero-copy">
            <span className="eyebrow light"><Sparkles size={15}/> مهمة اليوم</span>
            <h1>{heroTitle}<br/><em>{heroAccent}</em></h1>
            <p>{missionRationale(state)}</p>
            <div className="hero-actions"><Link href={primaryHref} className="hero-button">{actionLabel} <ArrowLeft size={18}/></Link><span><Clock3 size={16}/> نحو {totalMinutes} دقيقة</span></div>
          </div>
          <div className="hero-route" aria-hidden="true">
            <span className="route-city">BERLIN</span>
            <svg viewBox="0 0 260 180"><path d="M20 148C62 153 70 95 120 108c39 10 45-52 113-66" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeDasharray="4 9" strokeLinecap="round"/><circle cx="20" cy="148" r="7" fill="#f0b44c"/><circle cx="120" cy="108" r="5" fill="white"/><path d="M214 26h34v45h-9V58h-15v13h-10V26Z" fill="rgba(255,255,255,.16)"/></svg>
          </div>
        </div>

        <div className="section-heading"><div><span>خطة الجلسة</span><h2>خطوات قليلة، كل واحدة لها سبب</h2></div><strong>{doneMinutes}/{totalMinutes} دقيقة</strong></div>
        <div className="mission-list">
          {mission.map((block, index) => {
            const Icon = kindIcons[block.kind];
            const isDone = completed.has(missionKey(block.id));
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
            return <button key={block.id} className={isDone ? "mission-row done" : "mission-row"} onClick={() => toggle(block.id)}>
              <span className="mission-check">{isDone ? <Check size={16}/> : index + 1}</span>
              <span className="mission-icon"><Icon size={19}/></span>
              <span className="mission-copy"><strong>{block.titleAr}</strong><small lang="de" dir="ltr">{block.titleDe}</small><p>{block.objective}</p></span>
              <span className="mission-time">{block.minutes} د</span>
              <ChevronLeft size={18} />
            </button>;
          })}
        </div>

        <section className="weekly-plan-card">
          <header><div><span className="eyebrow"><CalendarCheck2 size={14}/> خطة الأسبوع</span><h2>وقت موزع، لا ديون تتضاعف.</h2><p>ستة أيام دراسة ويوم راحة. الكتابة والمحادثة والامتحان لها أماكن ثابتة، وأي فائت ينقل كمهمة واحدة فقط داخل ميزانية اليوم.</p></div><div><strong>{weeklyBudgetLabel(weeklyPlan.plannedMinutes)}</strong><small>{weeklyPlan.weekStart} → {weeklyPlan.weekEnd}</small></div></header>
          {(weeklyPlan.missedStudyDays>0||weeklyPlan.deferredCount>0)&&<div className="weekly-recovery-note"><RotateCcw size={15}/><p>فاتك {weeklyPlan.missedStudyDays} يوم. نُقلت مهمة واحدة فقط إلى أقرب يوم متاح، وبقي {weeklyPlan.deferredCount} في طابور التعافي دون مضاعفة حمل اليوم.</p></div>}
          <div className="weekly-plan-days">{weeklyPlan.days.map((day)=><article key={day.date} className={`weekly-plan-day ${day.status}`}><header><div><strong>{day.weekdayAr}</strong><small>{day.date.slice(5)}</small></div><span>{day.status==="rest"?"راحة":day.status==="complete"?"مكتمل":day.status==="missed"?"فائت":day.status==="today"?"اليوم":"قادم"}</span><b>{day.budgetMinutes?`${day.budgetMinutes} د`:"—"}</b></header>{day.status==="rest"?<p>راحة مقصودة أو استماع خفيف اختياري؛ لا يوجد دين دراسة.</p>:<div>{day.slots.map((slot)=><Link key={slot.id} href={slot.href} className={slot.kind==="recovery"?"recovery":""}><span>{slot.titleAr}</span><b>{slot.minutes} د</b></Link>)}</div>}{day.recoverySourceDate&&<small>استعادة محدودة من {day.recoverySourceDate}</small>}</article>)}</div>
        </section>
      </section>

      <aside className="dashboard-side">
        <div className="progress-card">
          <div className="progress-card-head"><div><small>إنجاز جلسة اليوم</small><strong>{percent}%</strong></div><div className="ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><span>{mission.filter((block)=>!completed.has(missionKey(block.id))).length}</span></div></div>
          <div className="progress-track"><i style={{ width: `${percent}%` }}/></div>
          <p>{percent === 100 ? "أحسنت. سنستخدم أداءك لبناء مهمة الغد." : "لا نحتاج جلسة مثالية؛ نحتاج دليلًا صادقًا على ما تستطيع فعله."}</p>
        </div>
        <div className="coach-note">
          <span className="coach-face">DW</span>
          <div><small>ملاحظة المرشد من أدلتك</small><p><b>{report.nextAction.titleAr}:</b> {report.nextAction.reasonAr}</p></div>
        </div>
        <div className="week-card">
          <div className="card-title"><span><CalendarCheck2 size={18}/> هذا الأسبوع</span><small>خطة مرنة</small></div>
          <div className="week-days">{weekDays.map((day) => <span key={day.key} className={day.today ? "today" : day.studied ? "studied" : ""}>{day.label}<i>{day.day}</i></span>)}</div>
          <div className="stat-pair"><div><Flame size={18}/><span><strong>{report.studyStreakDays}</strong><small>أيام متتالية</small></span></div><div><Clock3 size={18}/><span><strong>{doneMinutes}</strong><small>دقيقة خطة اليوم</small></span></div></div>
        </div>
        <div className="risk-card"><CircleAlert size={20}/><div><strong>{primaryRisk?.titleAr ?? (report.overallScore===null?"الجاهزية لا تُقاس بعد":"لا يوجد خطر آلي مرتفع")}</strong><p>{primaryRisk?.reasonAr ?? (report.overallScore===null?"نحتاج أدلة من ثلاث مهارات على الأقل قبل حساب مؤشر متوازن.":`مؤشر الأدلة الحالي ${report.overallScore}% بعينة ${report.overallConfidence==="high"?"قوية":"ما زالت بحاجة للتوسيع"}.`)}</p></div></div>
      </aside>
    </div>
  );
}
