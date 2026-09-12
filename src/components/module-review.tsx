"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardCheck, Mic2, PenLine, RotateCcw, Trophy } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import { buildModuleReviewQuestionPlan, summarizeModuleRecycling } from "@/core/lexical-strategy/recycling";

export function ModuleReview({moduleId,titleAr,titleDe,lessons,projectTitle,projectCopy}:{moduleId:string;titleAr:string;titleDe:string;lessons:FullLesson[];projectTitle:string;projectCopy:string}){
  const{update}=useLearning();
  const[answers,setAnswers]=useState<Record<string,number>>({});
  const[finished,setFinished]=useState(false);
  const plan=useMemo(()=>buildModuleReviewQuestionPlan(moduleId,lessons),[moduleId,lessons]);
  const questions=plan.map((item)=>item.question);
  const recycling=useMemo(()=>summarizeModuleRecycling(moduleId,plan),[moduleId,plan]);
  const score=questions.filter((question)=>answers[question.id]===question.correctIndex).length;

  function finish(){
    setFinished(true);
    update((current)=>({...current,mastery:{...current.mastery,[`module-${moduleId}`]:score*10},studyHistory:[...current.studyHistory,{date:new Date().toISOString().slice(0,10),minutes:20,evidenceCount:questions.length}]}));
  }

  if(finished)return <div className="module-result"><span><Trophy size={28}/></span><small>مراجعة الوحدة {moduleId}</small><h1>{score}/10</h1><h2>{score>=8?"أداء جيد — انتقل إلى مشروع النقل":"تحتاج إلى علاج قبل مشروع النقل"}</h2><p>{score>=8?"هذه نتيجة فورية فقط. سيعيد المدرب اختبار أهداف مختارة بعد مدة للتأكد من الاحتفاظ.":"راجع التفسيرات ودفتر الأخطاء ثم أجب عن صيغة جديدة، لا تحفظ هذه الخيارات."}</p><StatusAnnouncement message={`اكتملت مراجعة الوحدة ${moduleId}: ${score} من 10. ${score>=8?"افتح مشروع نقل جديدًا.":"ارجع إلى العلاج ثم استخدم صيغة جديدة."}`} channel={`module-review-${moduleId}`} className="compact"/><div>{score>=8?<Link href="/writing" className="primary-button">ابدأ مشروع الوحدة <ArrowLeft size={17}/></Link>:<Link href="/errors" className="primary-button">افتح دفتر الأخطاء</Link>}<button className="secondary-button" onClick={()=>{setFinished(false);setAnswers({})}}><RotateCcw size={16}/> إعادة التدريب</button></div></div>;

  return <div className="wide-page">
    <header className="page-heading"><div><span className="eyebrow"><ClipboardCheck size={15}/> مراجعة الوحدة {moduleId}</span><h1>{titleAr} <em lang="de" dir="ltr">{titleDe}</em></h1><p>عشرة أسئلة مختلطة محسوبة، ثم مشروع يجمع الكتابة والمحادثة بدل فصل المهارات.</p></div><div className="path-summary"><strong>{Object.keys(answers).length}</strong><span>إجابات<br/>من أصل 10</span></div></header>
    <section className="module-recycling-strip" data-recycling-policy={recycling.policyVersion}>
      <div><strong>{recycling.recycledPercent}%</strong><span>استرجاع من وحدات سابقة</span></div>
      <div><strong>{recycling.currentPercent}%</strong><span>أهداف الوحدة الحالية</span></div>
      <p>{recycling.recycledCount===0?"هذه أول وحدة؛ لا توجد مادة سابقة يمكن إعادة تدويرها دون اختلاق تعلم لم يحدث.":`${recycling.recycledCount} أسئلة سابقة: مفردات وبنية · ${recycling.currentCount} أسئلة من الوحدة الحالية.`}</p>
      <small>النسبة تركّب المراجعة فقط؛ لا تمنح مستوى أو إتقانًا تلقائيًا.</small>
    </section>
    <div className="module-quiz">{plan.map(({question,scope},index)=><article key={question.id} data-recycling-scope={scope}><small>{index+1}</small><div><span className={scope==="recycled"?"recycling-origin recycled":"recycling-origin"}>{scope==="recycled"?"من وحدات سابقة":"من الوحدة الحالية"}</span><h3 lang="de" dir="ltr">{question.promptDe}</h3><p>{question.promptAr}</p></div><select value={answers[question.id]??""} onChange={(event)=>setAnswers((current)=>({...current,[question.id]:Number(event.target.value)}))}><option value="">اختر الجواب</option>{question.options.map((option,optionIndex)=><option key={option} value={optionIndex} {...fragmentLanguageAttributes(option)}>{option}</option>)}</select></article>)}</div>
    <button className="primary-button module-submit" disabled={Object.keys(answers).length<questions.length} onClick={finish}><Check size={17}/> صحح مراجعة الوحدة</button>
    <section className="module-project"><span className="eyebrow">مشروع نقل أصلي</span><h2>{projectTitle}</h2><p>{projectCopy}</p><div><Link href="/writing" className="secondary-button"><PenLine size={17}/> الجزء الكتابي</Link><Link href="/speaking" className="secondary-button"><Mic2 size={17}/> الجزء الشفهي</Link></div></section>
  </div>;
}
