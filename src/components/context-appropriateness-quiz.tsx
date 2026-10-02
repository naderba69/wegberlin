"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, RotateCcw, Scale } from "lucide-react";
import { contextAppropriatenessItems, CONTEXT_APPROPRIATENESS_POLICY_VERSION } from "@/data/context-appropriateness-quiz";

export function ContextAppropriatenessQuiz(){
  const[index,setIndex]=useState(0);
  const[answer,setAnswer]=useState<number|null>(null);
  const[correctCount,setCorrectCount]=useState(0);
  const[complete,setComplete]=useState(false);
  const item=contextAppropriatenessItems[index];
  const checked=answer!==null;

  function next(){
    if(answer===null)return;
    setCorrectCount((count)=>count+(answer===item.correctIndex?1:0));
    if(index===contextAppropriatenessItems.length-1){setComplete(true);return}
    setIndex((current)=>current+1);
    setAnswer(null);
  }

  function restart(){setIndex(0);setAnswer(null);setCorrectCount(0);setComplete(false)}

  return <section className="context-appropriateness-quiz" data-context-appropriateness-policy={CONTEXT_APPROPRIATENESS_POLICY_VERSION}>
    <header><Scale size={20}/><div><small lang="de" dir="ltr">Richtig geformt oder passend im Kontext?</small><h2>الشكل الصحيح لا يكفي دائمًا</h2><p>اختر الصيغة الأنسب للموقف، ثم اقرأ سبب الملاءمة. لا تُمنح mastery من هذا المختبر.</p></div><b>{complete?contextAppropriatenessItems.length:index+1}/{contextAppropriatenessItems.length}</b></header>
    {complete?<article className="context-appropriateness-complete"><CheckCircle2 size={25}/><h3>اكتملت جولة ملاءمة السياق</h3><p>طابقت {correctCount} من {contextAppropriatenessItems.length} في المحاولة الأولى. انتهت الجولة دون الرجوع تلقائيًا إلى السؤال الأول.</p><div><button type="button" onClick={restart}><RotateCcw size={15}/> جولة جديدة باختيارك</button><Link href="/practice">العودة إلى المختبرات <ArrowLeft size={15}/></Link></div></article>:<article><span>{item.level}</span><strong lang="de" dir="ltr">{item.contextDe}</strong><small>{item.contextAr}</small><div>{item.options.map((option,optionIndex)=><button type="button" key={option} disabled={checked} aria-pressed={answer===optionIndex} onClick={()=>setAnswer(optionIndex)} className={checked?(optionIndex===item.correctIndex?"correct":answer===optionIndex?"wrong":""):""}><b lang="de" dir="ltr">{option}</b>{checked&&optionIndex===item.correctIndex&&<Check size={15}/>}</button>)}</div>{checked&&<footer><strong>{answer===item.correctIndex?"مناسب للسياق":"الشكل مفهوم، لكن السياق يطلب بديلًا"}</strong><p>{item.explanationAr}</p><button type="button" onClick={next}>{index===contextAppropriatenessItems.length-1?"إنهاء الجولة":"السؤال التالي"}</button></footer>}</article>}
  </section>;
}
