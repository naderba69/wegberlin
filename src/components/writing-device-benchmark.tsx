"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Keyboard, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { evaluateWritingBenchmark, latestQualifiedWritingBenchmark, MIN_WRITING_SECONDS, WRITING_BENCHMARK_VERSION, writingBenchmarkPrompt } from "@/core/writing/device-benchmark";
import type { CEFRLevel } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

type Phase="intro"|"typing"|"result";

export function WritingDeviceBenchmark({level}:{level:CEFRLevel}){
  const{state,update}=useLearning();
  const prompt=useMemo(()=>writingBenchmarkPrompt(level),[level]);
  const[phase,setPhase]=useState<Phase>("intro");
  const[startedAt,setStartedAt]=useState(0);
  const[elapsed,setElapsed]=useState(0);
  const[typed,setTyped]=useState("");
  const[message,setMessage]=useState("");
  const latest=state.writingBenchmarkAttempts.at(-1);
  const latestQualified=latestQualifiedWritingBenchmark(state);

  useEffect(()=>{
    if(phase!=="typing"||!startedAt)return;
    const timer=window.setInterval(()=>setElapsed((performance.now()-startedAt)/1000),100);
    const visibility=()=>{if(document.hidden){window.clearInterval(timer);setPhase("intro");setStartedAt(0);setElapsed(0);setTyped("");setMessage("أُلغي القياس لأن الصفحة غادرت الواجهة؛ لم تُحفظ سرعة كتابة من الخلفية.")}};
    document.addEventListener("visibilitychange",visibility);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",visibility)};
  },[phase,startedAt]);

  function start(){setTyped("");setElapsed(0);setMessage("");setStartedAt(performance.now());setPhase("typing")}
  function finish(){const seconds=(performance.now()-startedAt)/1000;if(seconds<MIN_WRITING_SECONDS){setMessage(`واصل الكتابة قليلًا؛ الحد الأدنى ${MIN_WRITING_SECONDS} ثوان.`);return}const attempt=evaluateWritingBenchmark({id:`writing-benchmark-${crypto.randomUUID()}`,level,typedText:typed,durationSeconds:seconds,createdAt:new Date().toISOString()});update((current)=>({...current,writingBenchmarkAttempts:[...current.writingBenchmarkAttempts,attempt]}));setElapsed(seconds);setMessage(attempt.qualified?`حُفظت سرعة إدخال الجهاز: ${attempt.wordsPerMinute} كلمة و${attempt.charactersPerMinute} حرفًا في الدقيقة. لا يوجد تصحيح لغة.`:`دقة النسخ ${attempt.copyAccuracyPercent}%. حُفظت المحاولة دون سرعة أو تعديل للخطة.`);setPhase("result")}
  function reset(){setPhase("intro");setStartedAt(0);setElapsed(0);setTyped("");setMessage("")}
  function clear(){update((current)=>({...current,writingBenchmarkAttempts:[]}));reset();setMessage("حُذفت قياسات سرعة الكتابة. لم تتغير نصوصك أو درجات الإتقان.")}

  return <section className="writing-device-benchmark" data-writing-benchmark-policy={WRITING_BENCHMARK_VERSION}>
    <header><span><Keyboard size={18}/></span><div><small>اختياري · سرعة الجهاز فقط</small><h2>معايرة وقت الكتابة</h2><p>انسخ جملة قصيرة بعد البدء. نقيس الإدخال لا صحة الألمانية أو جودة الأسلوب.</p></div>{latestQualified&&<strong>{latestQualified.wordsPerMinute}<small>كلمة/د</small></strong>}</header>

    {phase==="intro"&&<div className="writing-device-intro"><p>الجملة مخفية الآن. لا يظهر القياس للمبتدئ قبل بلوغ مرحلة الكتابة في درس فعلي.</p><button type="button" onClick={start}><Clock3 size={15}/> ابدأ مؤقت الكتابة</button></div>}

    {phase==="typing"&&<div className="writing-device-active"><div><span>الوقت المرئي</span><strong>{elapsed.toFixed(1)} ث</strong></div><blockquote lang="de" dir="ltr">{prompt.textDe}</blockquote><label><span lang="de" dir="ltr">Schreiben Sie den Satz ab.</span><textarea lang="de" dir="ltr" aria-label="Satz für die Gerätegeschwindigkeit abschreiben" value={typed} onChange={(event)=>setTyped(event.target.value)} onPaste={(event)=>{event.preventDefault();setMessage("اللصق لا يقيس سرعة الجهاز؛ اكتب الجملة بلوحة المفاتيح.")}} autoComplete="off" spellCheck={false}/></label><button type="button" disabled={!typed.trim()} onClick={finish}><Check size={15}/> انتهيت — تحقق من النسخ واحفظ التخطيط</button></div>}

    {phase==="result"&&latest&&<div className={latest.qualified?"writing-device-result qualified":"writing-device-result"}><span>{latest.qualified?<Check size={18}/>:<RotateCcw size={18}/>}</span><div><strong>{latest.qualified?`${latest.wordsPerMinute} كلمة/د · ${latest.charactersPerMinute} حرف/د`:`دقة النسخ ${latest.copyAccuracyPercent}% — لا سرعة محفوظة`}</strong><p>{latest.qualified?`وقت الكتابة المقترح ${latest.recommendedWritingMinutes} دقائق داخل ميزانية Today نفسها.`:"أعد النسخ بهدوء؛ هذا ليس تصحيحًا لغويًا."}</p></div><button type="button" onClick={reset}><RotateCcw size={14}/> أعد القياس</button></div>}

    {message&&<StatusAnnouncement message={message} channel="writing-device-benchmark" className="compact" icon={<ShieldCheck size={15}/>}/>} 
    {state.writingBenchmarkAttempts.length>0&&phase!=="typing"&&<button type="button" className="writing-device-clear" onClick={clear}><Trash2 size={14}/> حذف قياسات سرعة الكتابة</button>}
    <footer>الحد: `device-input-planning-only-no-language-score`. لا تدخل السرعة في تقييم نصك أو بوابات المستوى.</footer>
  </section>;
}
