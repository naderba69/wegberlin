"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { extendedComprehensionTasks, extendedTaskText } from "@/data/extended-comprehension";
import { emitListeningUsage } from "@/core/listening/usage-evidence";
import { QuestionQuiz } from "./exercise-card";
import { useLearning } from "./learning-provider";
import type { CEFRLevel } from "@/types/learning";

export function EnduranceLab() {
  const { state, update } = useLearning();
  const params = useSearchParams();
  const requested = params.get("level");
  const initialLevel = (["A1","A2","B1","B2"].includes(requested??"") ? requested : "A1") as CEFRLevel;
  const [taskId,setTaskId]=useState(()=>extendedComprehensionTasks.find(task=>task.level===initialLevel)!.id);
  const [mode,setMode]=useState<"reading"|"listening">("reading");
  const [started,setStarted]=useState(false);
  const [played,setPlayed]=useState(false);
  const [audioComplete,setAudioComplete]=useState(false);
  const [showTranscript,setShowTranscript]=useState(false);
  const [committed,setCommitted]=useState<string[]>([]);
  const [status,setStatus]=useState("");
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceBySpeaker,setVoiceBySpeaker]=useState<Record<string,string>>({});
  const [segmentIndex,setSegmentIndex]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const activeAudioRef=useRef(false);
  const [runId,setRunId]=useState("");
  const task=extendedComprehensionTasks.find(item=>item.id===taskId)!;
  const wordCount=extendedTaskText(task).trim().split(/\s+/u).length;
  const speakers=[...new Set(task.segments.map(segment=>segment.speaker))];

  useEffect(()=>{
    const refresh=()=>setVoices(window.speechSynthesis?.getVoices().filter(voice=>voice.lang.toLowerCase().startsWith("de"))??[]);
    refresh();window.speechSynthesis?.addEventListener("voiceschanged",refresh);
    return()=>{window.speechSynthesis?.removeEventListener("voiceschanged",refresh);activeAudioRef.current=false;window.speechSynthesis?.cancel();};
  },[]);
  useEffect(()=>{if(!started)return;const timer=window.setInterval(()=>{if(document.visibilityState==="visible")setElapsed(seconds=>seconds+1);},1000);return()=>window.clearInterval(timer);},[started]);

  function reset(id=taskId,nextMode=mode){activeAudioRef.current=false;window.speechSynthesis?.cancel();setTaskId(id);setMode(nextMode);setStarted(false);setPlayed(false);setAudioComplete(false);setShowTranscript(false);setCommitted([]);setSegmentIndex(0);setElapsed(0);setStatus("");setRunId("");}
  function start(){setStarted(true);setRunId(`endurance-${crypto.randomUUID()}`);}
  function play(index=0){
    if(!window.speechSynthesis||!voices.length){setStatus("لا يوجد صوت ألماني متاح على هذا الجهاز. يمكنك القراءة؛ لا نسجل نجاح استماع وهميًا ولا نستخدم مزودًا مدفوعًا.");return;}
    if(index===0){window.speechSynthesis.cancel();activeAudioRef.current=true;setAudioComplete(false);}
    if(!activeAudioRef.current)return;
    const segment=task.segments[index];setSegmentIndex(index);
    const utterance=new SpeechSynthesisUtterance(segment.textDe);utterance.lang="de-DE";utterance.rate=1;utterance.pitch=state.speechPreferences.pitch;
    const chosen=voices.find(voice=>voice.voiceURI===voiceBySpeaker[segment.speaker])??voices[index%voices.length];utterance.voice=chosen;
    utterance.onstart=()=>{setPlayed(true);setStatus(`صوت اصطناعي من الجهاز؛ الجزء ${index+1}/${task.segments.length}. ليس تسجيلًا بشريًا أو صوت امتحان.`);if(index===0)emitListeningUsage({surface:"library",contentId:task.id,event:"playback",playbackSource:"browser-tts"});};
    utterance.onend=()=>{if(!activeAudioRef.current)return;if(index+1<task.segments.length)play(index+1);else{activeAudioRef.current=false;setAudioComplete(true);setStatus("انتهى التسلسل الاصطناعي. أجب ثم قارن بالنص بعد تثبيت جميع الأجوبة.");}};
    utterance.onerror=()=>{activeAudioRef.current=false;setStatus("تعذر إكمال الصوت. هذا فشل تقني لا خطأ لغة؛ النص متاح في وضع القراءة.");};
    window.speechSynthesis.speak(utterance);
  }

  return <div className="wide-page endurance-lab" data-endurance-policy="graded-long-input-v1">
    <header className="page-heading"><div><span className="eyebrow">مدخلات أطول تدريجيًا</span><h1>ابنِ التحمل <em>مع الفهم</em></h1><p>اثنا عشر سياقًا أصليًا من A1 إلى B2، ثلاثة لكل مستوى. الطول والسجل يتدرجان، وهذه تدريبات إضافية لا محاكاة رسمية ولا شهادة.</p></div></header>
    <section className="assessment-warning"><p>الصوت هنا اصطناعي من جهازك. اختلاف أصوات الجهاز اختياري؛ التسجيل البشري وتدقيق التنوع الصوتي والمراجعة اللغوية المستقلة ما زالت معلقة.</p><p>لا نقيس النطق أو الطلاقة ولا نستخدم جودة صوت الجهاز للحكم على لغتك. نجاح القراءة بعد سماع النص نفسه ليس عينة جديدة مستقلة.</p></section>
    <div className="endurance-controls"><label>السياق<select value={taskId} onChange={event=>reset(event.target.value)}>{extendedComprehensionTasks.map(item=><option key={item.id} value={item.id}>{item.level} · {item.titleAr}</option>)}</select></label><label>نوع التدريب<select value={mode} onChange={event=>reset(taskId,event.target.value as "reading"|"listening")}><option value="reading">قراءة</option><option value="listening">استماع دون نص</option></select></label></div>
    <section className="endurance-task"><header><span>{task.level} · {wordCount} كلمة</span><h2 lang="de" dir="ltr">{task.titleDe}</h2><p>{task.titleAr}</p></header>
      {!started?<><p>ابدأ صراحةً؛ الزمن المرئي للتخطيط فقط وليس سرعة لغة أو إتقانًا. يمكنك تقسيم المادة إلى فقرات مع الحفاظ على فهم الفكرة.</p><button className="primary-button" onClick={start}>ابدأ التدريب</button></>:<><p className="endurance-timer">{Math.floor(elapsed/60)} دقيقة و{elapsed%60} ثانية مرئية · لا درجة سرعة</p>
      {mode==="listening"&&<><div className="endurance-voices">{speakers.map(speaker=><label key={speaker}><span lang="de" dir="ltr">{speaker}</span><select aria-label={`صوت ${speaker}`} value={voiceBySpeaker[speaker]??""} onChange={event=>setVoiceBySpeaker(current=>({...current,[speaker]:event.target.value}))}><option value="">صوت ألماني متاح تلقائيًا</option>{voices.map(voice=><option key={voice.voiceURI} value={voice.voiceURI} data-bidi-scope="technical" dir="ltr">{voice.name}</option>)}</select></label>)}</div><p>{voices.length>1?"يمكنك اختيار أصوات ألمانية مختلفة؛ كلها اصطناعية.":"قد يتوفر صوت ألماني واحد فقط؛ لا ندعي تعدد المتحدثين البشريين."}</p><div className="endurance-audio-actions"><button className="primary-button" onClick={()=>play()}>شغّل التسلسل الاصطناعي</button><button className="secondary-button" onClick={()=>{activeAudioRef.current=false;window.speechSynthesis?.cancel();setStatus("توقف التشغيل باختيارك؛ لا تُمنح نتيجة إكمال الصوت.");}}>إيقاف</button><span>الجزء {segmentIndex+1}/{task.segments.length} · {audioComplete?"انتهى":"لم ينتهِ"}</span></div><p role="status">{status}</p></>}
      {(mode==="reading"||showTranscript)&&<article className="reading-text">{task.segments.map((segment,index)=><section key={index}><strong lang="de" dir="ltr">{segment.speaker}</strong><p lang="de" dir="ltr">{segment.textDe}</p></section>)}</article>}
      {(mode==="reading"||showTranscript)&&<details className="reading-vocabulary-bridge"><summary>جسر كلمات للتدريب؛ ليست معرفة مثبتة</summary><div className="glossary-strip">{task.glossary.map(item=><span key={item.de}><b lang="de" dir="ltr">{item.de}</b>{item.ar}</span>)}</div></details>}
      {(mode==="reading"||played)?<QuestionQuiz key={`${task.id}:${mode}:${runId}`} questions={task.questions} level={task.level} arabicSupport={state.profile?.arabicSupport} shuffleSeed={`${task.id}:${mode}`} onAttempt={(id,answer,correct,metadata)=>{const createdAt=new Date().toISOString();setCommitted(current=>[...new Set([...current,id])]);update(current=>({...current,exerciseAttempts:[...current.exerciseAttempts,{id:`endurance-attempt-${crypto.randomUUID()}`,lessonId:task.id,exerciseId:id,answer,correct,...metadata,evidenceContext:{policyVersion:"independent-assessment-v1",kind:"endurance",level:task.level,formId:task.formId,runId:runId,independent:false,expectedItems:task.questions.length},createdAt}]}));}}/>:<p>شغّل الصوت أولًا. لا تظهر أسئلة الاستماع قبل بدء صوت فعلي.</p>}
      {mode==="listening"&&<button className="secondary-button" disabled={committed.length<task.questions.length} onClick={()=>{setShowTranscript(true);emitListeningUsage({surface:"library",contentId:task.id,event:"transcript-revealed",revealAfterAnswerCommit:true});}}>افتح النص بعد تثبيت جميع الأجوبة</button>}
      {committed.length===task.questions.length&&<div className="endurance-terminal"><p>أنجزت أسئلة هذا السياق. أعد تلخيص الفكرة بصوتك أو كتابتك؛ هذه مهمة نقل، ولا يُحكم على صحتها من عدد الكلمات.</p><Link className="primary-button" href="/today">عد إلى مهمة اليوم</Link><button className="secondary-button" onClick={()=>reset(extendedComprehensionTasks.find(item=>item.level===task.level&&item.id!==task.id)!.id,mode)}>سياق بديل من المستوى نفسه</button></div>}
      </>}
    </section>
  </div>;
}
