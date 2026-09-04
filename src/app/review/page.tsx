"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BrainCircuit, CalendarCheck, Check, RotateCcw, Sparkles } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import { newReviewItem } from "@/core/srs/sm2";
import { buildDueReviewQueue, nextScheduledReviewDate } from "@/core/srs/review-queue";
import { applyReviewGrade, retentionEvidence } from "@/core/srs/review-session";

export default function ReviewPage() {
  const { state, update } = useLearning();
  const [flipped, setFlipped] = useState(false);
  const [lastInterval, setLastInterval] = useState<number | null>(null);
  const [reviewedThisSession, setReviewedThisSession] = useState(0);
  const reviewTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const queue = useMemo(() => buildDueReviewQueue(state, new Date()), [state]);
  const nextScheduled = useMemo(() => nextScheduledReviewDate(state, new Date()), [state]);
  const queued = queue[0];
  const card = queued?.card;
  const reviewState = card ? queued.review ?? newReviewItem(card.id) : null;
  const retention = useMemo(() => retentionEvidence(state), [state]);

  function grade(value: number) {
    if (!card || !reviewState || !queued) return;
    const now = new Date();
    const outcome = applyReviewGrade(state, { ...queued, review: reviewState }, value, now, { timeZone: reviewTimeZone });
    update(() => outcome.state);
    setLastInterval(outcome.nextReview.interval);
    setFlipped(false);
    setReviewedThisSession((count) => count + 1);
  }

  return <div className="focus-page">
    <header className="page-heading"><div><span className="eyebrow"><RotateCcw size={15}/> مراجعة SM-2</span><h1>استرجع أولًا، <em>ثم اكشف.</em></h1><p>تظهر هنا بطاقات الدروس المكتملة فقط، مرتبة حسب موعد SM-2. لا تدخل مفردات من مستوى أو درس لم تنجزه.</p></div><div className="review-count"><strong>{queue.length}</strong><span>مراجعة مستحقة<br/>{reviewedThisSession ? `أنجزت الآن: ${reviewedThisSession}` : lastInterval !== null ? `الفاصل الأخير: ${lastInterval} يوم` : "حسب الدروس المكتملة"}</span></div></header>

    <section className="retention-evidence-strip" aria-label="دليل الاحتفاظ المؤجل"><div><small>مراجعات أولى</small><strong>{retention.initialReviewEvents}</strong></div><div><small>بطاقات نجحت بعد موعد مؤجل</small><strong>{retention.successfulDelayedCards}</strong></div><div><small>دروس بعينة احتفاظ مؤجلة</small><strong>{retention.confirmedLessonIds.length}</strong></div><p>كشف البطاقة أول مرة لا يرفع إتقان الدرس. الزيادة لا تحدث إلا عند نجاح البطاقة بعد أن يحين موعدها، ولا تسمى إتقانًا دائمًا.</p></section>

    {card && reviewState ? <div className="flashcard-zone">
      <div className="review-card-meta"><span>{card.tags[0]}</span><strong>{card.tags[1]}</strong><small>{queued.isNew ? "بطاقة جديدة" : `كانت مستحقة: ${new Date(queued.dueAt).toLocaleDateString("ar-TN")}`}</small></div>
      <button className={flipped ? "flashcard flipped" : "flashcard"} onClick={() => setFlipped(!flipped)}>
        <span><BrainCircuit size={22}/>{flipped ? "الإجابة والتريك" : "استرجاع نشط"}</span>
        <h2 lang={flipped ? "ar" : "de"} dir={flipped ? "rtl" : "ltr"}>{flipped ? card.back : card.front}</h2>
        <p>{flipped ? card.hint : "قل المعنى والاستعمال قبل النقر"}</p>
        <small>{flipped ? "قيّم الاسترجاع بصدق" : "انقر لكشف الجواب"}</small>
      </button>
      {flipped && <div className="grade-grid"><button onClick={() => grade(1)}><span>1</span>نسيت</button><button onClick={() => grade(3)}><span>3</span>بصعوبة</button><button onClick={() => grade(4)} className="good"><span>4</span>جيد</button><button onClick={() => grade(5)} className="easy"><Check size={15}/>سهل</button></div>}
      <div className="review-tip"><Sparkles size={18}/><p><b>التريك الخاص بهذه البطاقة:</b> {card.hint}</p></div>
    </div> : <section className="review-empty-state">
      <span><CalendarCheck size={28}/></span>
      <h2>{state.completedLessonIds.length === 0 ? "لا توجد بطاقات منجزة بعد" : "أنهيت مراجعات اليوم"}</h2>
      <p>{state.completedLessonIds.length === 0 ? "أكمل أول درس بأدلته الأربعة حتى تدخل بطاقاته إلى الطابور." : nextScheduled ? `الموعد القادم: ${new Date(nextScheduled).toLocaleDateString("ar-TN")}. لا حاجة لمراجعة عشوائية الآن.` : "ستظهر البطاقات هنا عندما يحين موعدها وفق SM-2."}</p>
      <Link href="/today" className="primary-button">العودة إلى مهمة اليوم</Link>
    </section>}
  </div>;
}
