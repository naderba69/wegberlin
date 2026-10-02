"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Check, Clock3, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { evaluateReadingBenchmark, latestQualifiedReadingBenchmark, MIN_READING_SECONDS, READING_BENCHMARK_VERSION, selectReadingBenchmarkItem } from "@/core/reading/benchmark";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

type BenchmarkPhase="intro"|"reading"|"questions"|"result";

export function ReadingBenchmark(){
  const{state,update}=useLearning();
  const level=state.profile?.currentLevel??"A1";
  const item=useMemo(()=>selectReadingBenchmarkItem(level),[level]);
  const[phase,setPhase]=useState<BenchmarkPhase>("intro");
  const[startedAt,setStartedAt]=useState(0);
  const[elapsed,setElapsed]=useState(0);
  const[answers,setAnswers]=useState<[number|null,number|null]>([null,null]);
  const[message,setMessage]=useState("");
  const latest=state.readingBenchmarkAttempts.at(-1);
  const latestQualified=latestQualifiedReadingBenchmark(state);
  const eligible=Boolean(state.profile&&(state.diagnosticResult||state.completedLessonIds.length>0));

  useEffect(()=>{
    if(phase!=="reading"||!startedAt)return;
    const timer=window.setInterval(()=>setElapsed((performance.now()-startedAt)/1000),100);
    const visibility=()=>{if(document.hidden){window.clearInterval(timer);setPhase("intro");setStartedAt(0);setElapsed(0);setMessage("أُلغي القياس لأن الصفحة غادرت الواجهة؛ لم تُحفظ سرعة من مؤقت يعمل في الخلفية.")}};
    document.addEventListener("visibilitychange",visibility);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",visibility)};
  },[phase,startedAt]);

  if(!eligible)return null;

  function start(){setAnswers([null,null]);setElapsed(0);setMessage("");setStartedAt(performance.now());setPhase("reading")}
  function finish(){const seconds=(performance.now()-startedAt)/1000;if(seconds<MIN_READING_SECONDS){setMessage(`واصل القراءة قليلًا؛ الحد الأدنى ${MIN_READING_SECONDS} ثوان لمنع قياس نقرة عابرة.`);return}setElapsed(seconds);setPhase("questions")}
  function choose(questionIndex:number,optionIndex:number){setAnswers((current)=>current.map((value,index)=>index===questionIndex?optionIndex:value) as [number|null,number|null])}
  function submit(){if(answers.some((answer)=>answer===null))return;const attempt=evaluateReadingBenchmark({id:`reading-benchmark-${crypto.randomUUID()}`,item,durationSeconds:elapsed,answers:answers as [number,number],createdAt:new Date().toISOString()});update((current)=>({...current,readingBenchmarkAttempts:[...current.readingBenchmarkAttempts,attempt]}));setMessage(attempt.qualified?`حُفظ قياس ${attempt.wordsPerMinute} كلمة/دقيقة مع فهم ${attempt.comprehensionCorrect}/${attempt.comprehensionTotal}. سيضبط طول كتلة القراءة فقط.`:`الفهم ${attempt.comprehensionCorrect}/${attempt.comprehensionTotal}؛ حُفظت المحاولة دون سرعة أو تعديل للخطة.`);setPhase("result")}
  function reset(){setPhase("intro");setStartedAt(0);setElapsed(0);setAnswers([null,null]);setMessage("")}
  function clear(){update((current)=>({...current,readingBenchmarkAttempts:[]}));reset();setMessage("حُذفت قياسات القراءة المحلية. لم يتغير الإتقان أو تقدم الدروس.")}

  return <section className="reading-benchmark-card" data-reading-benchmark-policy={READING_BENCHMARK_VERSION}>
    <header><span><BookOpenCheck size={18}/></span><div><small>اختياري · تخطيط فقط</small><h2>معايرة القراءة مع الفهم</h2><p>يبدأ المؤقت بعد ضغطك، ويتوقف قبل الأسئلة. لا نحتسب سرعة بلا إجابتين صحيحتين.</p></div>{latestQualified&&<strong>{latestQualified.wordsPerMinute}<small>كلمة/د</small></strong>}</header>

    {phase==="intro"&&<div className="reading-benchmark-intro"><p>النص من مكتبة المنهج بمستوى <b>{level}</b>. عنوانه لا يظهر كاملًا قبل البدء، ولا يعمل المؤقت إذا أخفيت الصفحة.</p><button type="button" onClick={start}><Clock3 size={15}/> ابدأ القراءة والمؤقت</button></div>}

    {phase==="reading"&&<div className="reading-benchmark-reading"><div><span>الوقت المرئي</span><strong>{elapsed.toFixed(1)} ث</strong></div><article lang="de" dir="ltr">{item.textDe}</article><button type="button" onClick={finish}><Check size={15}/> انتهيت — أخفِ النص وافتح أسئلة الفهم</button></div>}

    {phase==="questions"&&<div className="reading-benchmark-questions"><header><strong lang="de" dir="ltr">Verständnis vor Geschwindigkeit</strong><span>{elapsed.toFixed(1)} ث · سؤالان</span></header>{item.questions.slice(0,2).map((question,index)=><fieldset key={question.id}><legend><span lang="de" dir="ltr">{question.promptDe}</span><small>{question.promptAr}</small></legend><div>{question.options.map((option,optionIndex)=><button type="button" key={option} aria-pressed={answers[index]===optionIndex} className={answers[index]===optionIndex?"selected":""} onClick={()=>choose(index,optionIndex)}><bdi {...fragmentLanguageAttributes(option)}>{option}</bdi></button>)}</div></fieldset>)}<button className="primary-button" type="button" disabled={answers.some((answer)=>answer===null)} onClick={submit}>تحقق واحفظ إن بقي الفهم</button></div>}

    {phase==="result"&&latest&&<div className={latest.qualified?"reading-benchmark-result qualified":"reading-benchmark-result"}><span>{latest.qualified?<Check size={18}/>:<RotateCcw size={18}/>}</span><div><strong>{latest.qualified?`${latest.wordsPerMinute} كلمة/دقيقة مع فهم ${latest.comprehensionCorrect}/2`:`فهم ${latest.comprehensionCorrect}/2 — لا سرعة محفوظة`}</strong><p>{latest.qualified?`كتلة القراءة الموصى بها ${latest.recommendedReadingMinutes} دقائق، وستُقتطع من وقت الدرس دون زيادة الجلسة.`:"أعد القياس بهدوء. المحاولة لا تخفض مستوى أو إتقانًا."}</p></div><button type="button" onClick={reset}><RotateCcw size={14}/> أعد القياس</button></div>}

    {message&&<StatusAnnouncement message={message} channel="reading-benchmark" className="compact" icon={<ShieldCheck size={15}/>}/>} 
    {state.readingBenchmarkAttempts.length>0&&phase!=="reading"&&<button type="button" className="reading-benchmark-clear" onClick={clear}><Trash2 size={14}/> حذف كل قياسات القراءة</button>}
    <footer>الحد: `planning-only-no-cefr-or-mastery`. الكلمات/دقيقة تضبط وقت القراءة فقط ولا تصبح درجة لغة أو امتحان.</footer>
  </section>;
}
