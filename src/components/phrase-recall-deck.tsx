"use client";

import { useState } from "react";
import { Check, Eye, Lightbulb, RotateCcw, Volume2, X } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import { BidiText } from "./bidi-text";

type RecallDirection = "de-ar" | "ar-de";

export function PhraseRecallDeck({
  lesson,
  onSpeak,
  onGrade,
}: {
  lesson: FullLesson;
  onSpeak: (text: string) => void;
  onGrade: (id: string, remembered: boolean) => void;
}) {
  const [mode, setMode] = useState<"study" | "recall">("study");
  const [direction, setDirection] = useState<RecallDirection>("de-ar");
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [grades, setGrades] = useState<Record<number, boolean>>({});

  function resetRecall(nextDirection = direction) {
    setDirection(nextDirection);
    setRevealed(new Set());
    setGrades({});
  }

  function reveal(index: number, german: string) {
    setRevealed((current) => new Set([...current, index]));
    if (direction === "de-ar") onSpeak(german);
  }

  function grade(index: number, remembered: boolean) {
    setGrades((current) => ({ ...current, [index]: remembered }));
    onGrade(`phrase-recall-${index + 1}`, remembered);
  }

  const graded = Object.keys(grades).length;
  const remembered = Object.values(grades).filter(Boolean).length;

  return <>
    <div className="phrase-mode-toolbar">
      <div><button className={mode === "study" ? "active" : ""} onClick={() => setMode("study")}>عرض ودراسة</button><button className={mode === "recall" ? "active" : ""} onClick={() => setMode("recall")}>استرجاع دون كشف</button></div>
      {mode === "recall" && <div><button className={direction === "de-ar" ? "active" : ""} onClick={() => resetRecall("de-ar")}>Deutsch → العربية</button><button className={direction === "ar-de" ? "active" : ""} onClick={() => resetRecall("ar-de")}>العربية → Deutsch</button></div>}
    </div>

    {mode === "study" ? <div className="phrase-grid">{lesson.phrases.map((phrase) => <button key={phrase.de} className="phrase-card" onClick={() => onSpeak(phrase.de)}><Volume2 size={17} /><span lang="de" dir="ltr">{phrase.de}</span><small><BidiText text={phrase.ar}/></small>{phrase.noteAr && <i><BidiText text={phrase.noteAr}/></i>}</button>)}</div> : <div className="phrase-recall-zone">
      <header><div><strong>اختبر الذاكرة قبل الكشف</strong><small>قل الجواب بصوت مسموع، ثم اكشفه وقيّم نفسك بصدق.</small></div><span>{remembered}/{lesson.phrases.length} · قيّمت {graded}</span></header>
      <div className="phrase-recall-grid">{lesson.phrases.map((phrase, index) => {
        const isRevealed = revealed.has(index);
        const gradeValue = grades[index];
        const front = direction === "de-ar" ? phrase.de : phrase.ar;
        const back = direction === "de-ar" ? phrase.ar : phrase.de;
        return <article key={`${direction}-${phrase.de}`} className={gradeValue === true ? "remembered" : gradeValue === false ? "forgotten" : ""}>
          <small>{direction === "de-ar" ? "ما المعنى والاستعمال؟" : "قل العبارة بالألمانية"}</small>
          <strong lang={direction === "de-ar" ? "de" : "ar"} dir={direction === "de-ar" ? "ltr" : "rtl"}>{front}</strong>
          {!isRevealed ? <button className="recall-reveal" onClick={() => reveal(index, phrase.de)}><Eye size={14} /> اكشف بعد الإجابة</button> : <>
            <p lang={direction === "ar-de" ? "de" : "ar"} dir={direction === "ar-de" ? "ltr" : "rtl"}>{back}</p>
            {phrase.noteAr && <em><BidiText text={phrase.noteAr}/></em>}
            <div><button className={gradeValue === true ? "active success" : "success"} onClick={() => grade(index, true)}><Check size={13} /> تذكرت</button><button className={gradeValue === false ? "active retry" : "retry"} onClick={() => grade(index, false)}><X size={13} /> أعدها</button></div>
          </>}
        </article>;
      })}</div>
      <button className="recall-reset" onClick={() => resetRecall()}><RotateCcw size={14} /> إعادة الجولة دون تغيير الترتيب</button>
    </div>}

    <details className="lesson-memory-map">
      <summary><Lightbulb size={15} /> خريطة تريكات الحفظ في هذا الدرس</summary>
      <div>
        {lesson.theory.map((block) => <article key={block.id}><span>قاعدة</span><strong>{block.titleAr}</strong><p>{block.trickAr}</p></article>)}
        <article><span>نطق</span><strong>{lesson.pronunciation.titleAr}</strong><p>{lesson.pronunciation.trickAr}</p></article>
        {lesson.mistakes.slice(0, 2).map((mistake) => <article key={mistake.wrong}><span>منع خطأ</span><strong lang="de" dir="ltr">{mistake.wrong} → {mistake.correct}</strong><p>{mistake.trickAr}</p></article>)}
      </div>
    </details>
  </>;
}
