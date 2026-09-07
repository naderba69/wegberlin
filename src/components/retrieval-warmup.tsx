"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, RotateCcw, Volume2 } from "lucide-react";
import type { WarmupItem, WarmupPlan } from "@/core/srs/warmup";

/**
 * P0-38: إحماء استرجاع قصير قبل أو بدل بطاقات SM-2.
 *
 * الحدود مُعلنة في الواجهة نفسها: لا درجة، ولا جدولة، ولا إتقان. كل عنصر يُسترجع
 * قبل الكشف، والكشف لا يسجّل شيئًا في تعلّم المتعلّم.
 */
export function RetrievalWarmup({ plan }: { plan: WarmupPlan }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const item: WarmupItem | undefined = plan.items[index];

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function next() {
    setRevealed(false);
    setDone((count) => count + 1);
    setIndex((current) => Math.min(current + 1, plan.items.length));
  }

  function restart() {
    setIndex(0);
    setRevealed(false);
    setDone(0);
  }

  if (!item) {
    return <section className="warmup-zone" aria-label="إحماء استرجاع">
      <header className="warmup-head">
        <div><span className="eyebrow">إحماء استرجاع</span><h2>أنهيت الجولة</h2></div>
        <strong>{done}/{plan.items.length}</strong>
      </header>
      <p className="warmup-boundary">هذه الجولة بلا درجة: لم تُسجَّل نتيجة، ولم تتغير مواعيد SM-2، ولم يُحتسب شيء في الإتقان. الاسترجاع هنا إعادة تنشيط قبل التعلّم الجديد.</p>
      <footer className="warmup-actions">
        <button type="button" className="secondary-button" onClick={restart}><RotateCcw size={15}/> أعد الجولة نفسها</button>
        <Link href="/today" className="primary-button">العودة إلى مهمة اليوم <ArrowLeft size={16}/></Link>
      </footer>
    </section>;
  }

  return <section className="warmup-zone" aria-label="إحماء استرجاع">
    <header className="warmup-head">
      <div>
        <span className="eyebrow">إحماء استرجاع</span>
        <h2>{item.instructionAr}</h2>
        <p className="warmup-meta">{item.lessonTitleAr} · مرحلة «{item.stageAr}»</p>
      </div>
      <strong>{Math.min(index + 1, plan.items.length)}/{plan.items.length}</strong>
    </header>

    <div className="warmup-progress" role="progressbar" aria-label="تقدم جولة الإحماء" aria-valuemin={0} aria-valuemax={plan.items.length} aria-valuenow={done}>
      <i style={{ width: `${Math.round((done / plan.items.length) * 100)}%` }}/>
    </div>

    <article className="warmup-item">
      <p className="warmup-cue" lang="ar" dir="rtl">{item.cueAr}</p>
      {item.contextDe && <p className="warmup-context" lang="de" dir="ltr">{item.contextDe}</p>}
      {!revealed
        ? <p className="warmup-prompt">قل الجواب أو اكتبه — ثم اكشفه وقارن.</p>
        : <div className="warmup-answer" role="status">
            <strong lang="de" dir="ltr">{item.answerDe}</strong>
            {item.hintAr && <small>{item.hintAr}</small>}
          </div>}
      {!revealed
        ? <button type="button" className="primary-button" onClick={() => setRevealed(true)}><Eye size={15}/> اكشف بعد المحاولة</button>
        : <div className="warmup-actions">
            <button type="button" className="secondary-button" onClick={() => speak(item.answerDe)}><Volume2 size={15}/> اسمع الألمانية</button>
            <button type="button" className="primary-button" onClick={next}>{index + 1 >= plan.items.length ? "أنهِ الجولة" : "التالي"} <ArrowLeft size={15}/></button>
          </div>}
      {revealed && <p className="warmup-note"><EyeOff size={13}/> لا يوجد تقييم: لم نقارن جوابك آليًا، ولم تُسجَّل درجة ولا موعد مراجعة.</p>}
    </article>

    <p className="warmup-boundary">هذه العناصر من محتوى أنهيت مراحله فعلًا، ومستبعد منها كل ما يقابل بطاقة SM-2 مجدولة حتى لا تتحول الجولة إلى مراجعة مبكرة.</p>
  </section>;
}
