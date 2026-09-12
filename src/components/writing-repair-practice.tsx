"use client";

import { useState } from "react";
import { Check, FileWarning, RotateCcw, ShieldCheck, X } from "lucide-react";
import type { WritingRepairAttempt } from "@/types/learning";
import type { WritingRepairExercise } from "@/core/writing/error-practice";
import { evaluateWritingRepair, WRITING_ERROR_PRACTICE_POLICY } from "@/core/writing/error-practice";

export function WritingRepairPractice({ exercises, attempts, onAttempt }: {
  exercises: WritingRepairExercise[];
  attempts: WritingRepairAttempt[];
  onAttempt: (exercise: WritingRepairExercise, answer: string) => void;
}) {
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [committed,setCommitted]=useState<Record<string,boolean>>({});

  if(exercises.length===0)return <section className="writing-repair-empty" data-writing-repair-policy={WRITING_ERROR_PRACTICE_POLICY}><ShieldCheck size={18}/><div><strong>لا يوجد تمرين شخصي موثوق الآن</strong><p>لم يطابق نصك الأنماط المحلية المحدودة. هذا لا يعني أن الكتابة خالية من الأخطاء؛ راجعها بشريًا عند الحاجة.</p></div></section>;

  return <section className="writing-repair-practice" data-writing-repair-policy={WRITING_ERROR_PRACTICE_POLICY}>
    <header><span><FileWarning size={18}/></span><div><small lang="de" dir="ltr">Aus Ihrem eigenen Text</small><h3>تمارين قصيرة من أخطائك المرصودة</h3><p>محلية وحتمية: لا يُرسل نصك إلى AI، ولا يظهر التصحيح قبل تثبيت محاولة.</p></div></header>
    <div>{exercises.map((exercise)=>{
      const latest=[...attempts].reverse().find((attempt)=>attempt.exerciseId===exercise.id);
      const revealed=Boolean(committed[exercise.id]||latest);
      const answer=answers[exercise.id]??"";
      const currentCorrect=latest?.correct??(committed[exercise.id]?evaluateWritingRepair(exercise,answer):undefined);
      return <article key={exercise.id} className={revealed?(currentCorrect?"correct":"committed"):""}>
        <small>{exercise.patternId}</small>
        <h4 lang="de" dir="ltr">{exercise.promptDe}</h4><p>{exercise.promptAr}</p>
        <blockquote lang="de" dir="ltr">{exercise.sourceExcerpt}</blockquote>
        <label>Ihre Korrektur · تصحيحك<input lang="de" dir="ltr" value={answer} onChange={(event)=>setAnswers((current)=>({...current,[exercise.id]:event.target.value}))} disabled={Boolean(committed[exercise.id])}/></label>
        {!committed[exercise.id]?<button disabled={!answer.trim()} onClick={()=>{onAttempt(exercise,answer);setCommitted((current)=>({...current,[exercise.id]:true}))}}><Check size={14}/> Prüfen · تحقق</button>:<button className="repair-again" onClick={()=>{setAnswers((current)=>({...current,[exercise.id]:""}));setCommitted((current)=>({...current,[exercise.id]:false}))}}><RotateCcw size={14}/> Noch einmal · أعد</button>}
        {revealed&&<aside><span>{currentCorrect?<Check size={15}/>:<X size={15}/>}</span><div><strong>{currentCorrect?"مطابقة للتصحيح المحلي":"قارن وحاول النقل مرة أخرى"}</strong><code lang="de" dir="ltr">{exercise.correctedExcerpt}</code><p>{exercise.explanationAr}</p><small>هذا علاج شخصي ولا يرفع mastery أو بوابة المستوى.</small></div></aside>}
      </article>})}</div>
  </section>;
}
