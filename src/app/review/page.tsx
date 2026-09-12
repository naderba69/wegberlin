"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BrainCircuit, CalendarCheck, Check, RotateCcw, Sparkles } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import { newReviewItem } from "@/core/srs/sm2";
import { buildDueReviewQueue, nextScheduledReviewDate } from "@/core/srs/review-queue";
import { applyReviewGrade, retentionEvidence } from "@/core/srs/review-session";
import { behavioralPraise } from "@/core/coach/behavioral-praise";
import { StatusAnnouncement } from "@/components/status-announcement";
import { resolveReviewShortcut, REVIEW_SHORTCUT_POLICY } from "@/core/review/shortcuts";
import { academicLessons } from "@/data/academic-lessons";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { PhrasePronunciationCheck } from "@/components/phrase-pronunciation-check";

function reviewContextLabel(tags:string[]){const lesson=academicLessons[tags[1]];if(lesson)return lesson.titleAr;if(tags.includes("personal-error"))return"علاج شخصي";return"مراجعة المنهج"}

export default function ReviewPage() {
  const { state, update } = useLearning();
  const [flipped, setFlipped] = useState(false);
  const [lastInterval, setLastInterval] = useState<number | null>(null);
  const [reviewedThisSession, setReviewedThisSession] = useState(0);
  const [lastPraise, setLastPraise] = useState("");
  const [deferredCardIds,setDeferredCardIds]=useState<string[]>([]);
  const gradingRef = useRef(false);
  const reviewTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const queue = useMemo(() => buildDueReviewQueue(state, new Date()), [state]);
  const nextScheduled = useMemo(() => nextScheduledReviewDate(state, new Date()), [state]);
  const queued = queue.find((item)=>!deferredCardIds.includes(item.card.id));
  const card = queued?.card;
  const personalErrorCard = Boolean(card?.tags.includes("personal-error"));
  const reviewState = card ? queued.review ?? newReviewItem(card.id) : null;
  const retention = useMemo(() => retentionEvidence(state), [state]);

  const grade = useCallback((value: 1|3|4|5) => {
    if (!card || !reviewState || !queued || gradingRef.current) return;
    gradingRef.current=true;
    const now = new Date();
    const outcome = applyReviewGrade(state, { ...queued, review: reviewState }, value, now, { timeZone: reviewTimeZone });
    update(() => outcome.state);
    setLastInterval(outcome.nextReview.interval);
    setLastPraise(outcome.event.evidenceKind === "initial" ? behavioralPraise("review-initial") : value >= 3 ? behavioralPraise("review-delayed-success") : behavioralPraise("review-delayed-repair"));
    setFlipped(false);
    setReviewedThisSession((count) => count + 1);
  },[card,queued,reviewState,reviewTimeZone,state,update]);

  useEffect(()=>{gradingRef.current=false},[card?.id]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      const action=resolveReviewShortcut({key:event.key,repeat:event.repeat,ctrlKey:event.ctrlKey,altKey:event.altKey,metaKey:event.metaKey,shiftKey:event.shiftKey,targetTag:target?.tagName,contentEditable:Boolean(target?.isContentEditable)},{cardAvailable:Boolean(card),revealed:flipped});
      if(!action)return;
      event.preventDefault();
      if(action.type==="toggle-reveal")setFlipped((value)=>!value);
      else grade(action.grade);
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[card,flipped,grade]);

  function playReviewModel(text:string){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const utterance=applySpeechPreferences(new SpeechSynthesisUtterance(text),state.speechPreferences,window.speechSynthesis.getVoices());utterance.lang="de-DE";utterance.rate=.86;window.speechSynthesis.speak(utterance)}
  function deferCurrentCard(){if(!card)return;setDeferredCardIds((current)=>current.includes(card.id)?current:[...current,card.id]);setFlipped(false)}

  return <div className="focus-page">
    <header className="page-heading"><div><span className="eyebrow"><RotateCcw size={15}/> مراجعة SM-2</span><h1>استرجع أولًا، <em>ثم اكشف.</em></h1><p>تظهر بطاقات الدروس المكتملة وبطاقات العلاج الشخصية بعد تأكيد التصحيح المؤجل، مرتبة حسب موعد SM-2. لا تدخل مفردات جديدة من درس غير منجز.</p></div><div className="review-count"><strong>{queue.length}</strong><span>مراجعة مستحقة<br/>{reviewedThisSession ? `أنجزت الآن: ${reviewedThisSession}` : lastInterval !== null ? `الفاصل الأخير: ${lastInterval} يوم` : "حسب الدروس المكتملة"}</span></div></header>

    <section className="retention-evidence-strip" aria-label="دليل الاحتفاظ المؤجل"><div><small>مراجعات أولى</small><strong>{retention.initialReviewEvents}</strong></div><div><small>بطاقات نجحت بعد موعد مؤجل</small><strong>{retention.successfulDelayedCards}</strong></div><div><small>دروس بعينة احتفاظ مؤجلة</small><strong>{retention.confirmedLessonIds.length}</strong></div><p>كشف البطاقة أول مرة لا يرفع إتقان الدرس. الزيادة لا تحدث إلا عند نجاح بطاقة درس بعد أن يحين موعدها؛ بطاقة الخطأ الشخصية علاج فقط وmasteryDelta فيها صفر دائمًا.</p></section>
    <section className="review-shortcut-guide" data-review-shortcut-policy={REVIEW_SHORTCUT_POLICY} aria-label="اختصارات لوحة مفاتيح المراجعة"><strong>اختصارات سريعة</strong><span><kbd>Space</kbd> كشف/إخفاء</span><span><kbd>1</kbd> نسيت</span><span><kbd>3</kbd> بصعوبة</span><span><kbd>4</kbd> جيد</span><span><kbd>5</kbd> سهل</span><small>لا تعمل داخل حقول الكتابة، ولا تُقبل درجة قبل كشف البطاقة.</small></section>
    {lastPraise&&<StatusAnnouncement message={lastPraise} channel="review" className="behavioral-praise gamification-surface" icon={<Sparkles size={16}/>}/>} 

    {card && reviewState ? <div className="flashcard-zone">
      <div className="review-card-meta"><span>{card.tags[0]}</span><strong>{reviewContextLabel(card.tags)}</strong><small>{personalErrorCard ? (queued.isNew ? "بطاقة علاج شخصية جديدة · بلا mastery" : `علاج شخصي مستحق: ${new Date(queued.dueAt).toLocaleDateString("ar-TN")} · بلا mastery`) : queued.isNew ? "بطاقة درس جديدة" : `كانت مستحقة: ${new Date(queued.dueAt).toLocaleDateString("ar-TN")}`}</small></div>
      {card.tags.includes("pronunciation")?<section className="pronunciation-review-card"><header><span><BrainCircuit size={22}/></span><div><small>بطاقة نطق مستحقة</small><h2 lang="de" dir="ltr">{card.front}</h2><p>{card.back}</p></div></header><PhrasePronunciationCheck key={card.id} phrase={card.front} onPlayModel={playReviewModel} onAttempt={(_,complete)=>{if(complete)grade(4)}}/><button type="button" className="secondary-button" onClick={deferCurrentCard}>راجع بطاقة أخرى الآن</button><footer>التأجيل لا يمنح نجاحًا ولا يلغي البطاقة؛ تبقى مستحقة حتى تتأكد جميع كلماتها.</footer></section>:<><button className={flipped ? "flashcard flipped" : "flashcard"} aria-keyshortcuts="Space" onClick={() => setFlipped(!flipped)}>
        <span><BrainCircuit size={22}/>{flipped ? "الإجابة والتريك" : "استرجاع نشط"}</span>
        <h2 lang={flipped ? "ar" : "de"} dir={flipped ? "rtl" : "ltr"}>{flipped ? card.back : card.front}</h2>
        <p>{flipped ? card.hint : "قل المعنى والاستعمال قبل النقر"}</p>
        <small>{flipped ? "قيّم الاسترجاع بصدق" : "انقر لكشف الجواب"}</small>
      </button>
      {flipped && <div className="grade-grid"><button aria-keyshortcuts="1" onClick={() => grade(1)}><span>1</span>نسيت</button><button aria-keyshortcuts="3" onClick={() => grade(3)}><span>3</span>بصعوبة</button><button aria-keyshortcuts="4" onClick={() => grade(4)} className="good"><span>4</span>جيد</button><button aria-keyshortcuts="5" onClick={() => grade(5)} className="easy"><Check size={15}/>سهل</button></div>}</>}
      <div className="review-tip"><Sparkles size={18}/><p><b>التريك الخاص بهذه البطاقة:</b> {card.hint}</p></div>
    </div> : <section className="review-empty-state">
      <span><CalendarCheck size={28}/></span>
      <h2>{state.completedLessonIds.length === 0 ? "لا توجد بطاقات منجزة بعد" : queue.length > 0 ? "أجلت بقية بطاقات هذه الجلسة" : "أنهيت مراجعات اليوم"}</h2>
      <p>{state.completedLessonIds.length === 0 ? "أكمل أول درس بأدلته الأربعة حتى تدخل بطاقاته إلى الطابور." : queue.length > 0 ? "لم تُحتسب البطاقات المؤجلة نجاحًا، وستبقى مستحقة عند عودتك." : nextScheduled ? `الموعد القادم: ${new Date(nextScheduled).toLocaleDateString("ar-TN")}. لا حاجة لمراجعة عشوائية الآن.` : "ستظهر البطاقات هنا عندما يحين موعدها وفق SM-2."}</p>
      <Link href="/today" className="primary-button">العودة إلى مهمة اليوم</Link>
    </section>}
  </div>;
}
