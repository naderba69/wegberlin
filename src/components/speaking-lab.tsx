"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleStop, Clock3, Headphones, Mic2, RotateCcw, Save, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import { academicLessons } from "@/data/academic-lessons";
import { saveMedia } from "@/core/portability/db";
import { canSaveSpeakingReview, speakingDurationBand, speakingPreparationSeconds, speakingTargetSeconds } from "@/core/speaking/workflow";
import type { SpeakingSelfReview } from "@/types/learning";
import { useLearning } from "./learning-provider";

const fallback={level:"A1",titleAr:"قدم نفسك",promptDe:"Stellen Sie sich 30 Sekunden lang vor und stellen Sie eine Frage.",promptAr:"قدم نفسك ثم اطرح سؤالًا.",usefulPhrases:["Ich heiße …","Ich komme aus …","Wie heißt du?"],successCriteriaAr:["تحدثت دون قراءة النص كاملًا.","طرحت سؤالًا."]};
type SpeakingPhase="prepare"|"ready"|"recording"|"review"|"saved";
const ratingValues=[1,2,3,4,5] as const;

export function SpeakingLab({lessonId}:{lessonId?:string}){
  const{state,update}=useLearning();
  const lesson=lessonId?academicLessons[lessonId]:undefined;
  const task=lesson?.speaking??fallback;
  const taskId=lesson?.id??"a1-introduction";
  const level=lesson?.level??"A1";
  const targetSeconds=speakingTargetSeconds(task.promptDe,level);
  const preparationTotal=speakingPreparationSeconds(level);
  const attempts=state.speakingAttempts.filter((attempt)=>attempt.taskId===taskId);
  const latestAttempt=attempts.at(-1);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const startedAtRef=useRef(0);
  const[phase,setPhase]=useState<SpeakingPhase>("prepare");
  const[preparationRemaining,setPreparationRemaining]=useState(preparationTotal);
  const[responseRemaining,setResponseRemaining]=useState(targetSeconds);
  const[preparationNotes,setPreparationNotes]=useState(["","",""]);
  const[audioUrl,setAudioUrl]=useState("");
  const[blob,setBlob]=useState<Blob|null>(null);
  const[duration,setDuration]=useState(0);
  const[listenedBack,setListenedBack]=useState(false);
  const[achievedCriteria,setAchievedCriteria]=useState<string[]>([]);
  const[clarityScore,setClarityScore]=useState<SpeakingSelfReview["clarityScore"]>(3);
  const[turnTaking,setTurnTaking]=useState(false);
  const[repairUsed,setRepairUsed]=useState(false);
  const[reflection,setReflection]=useState("");
  const[message,setMessage]=useState("");

  useEffect(()=>{if(phase!=="prepare"||preparationRemaining<=0)return;const timer=window.setTimeout(()=>{setPreparationRemaining((value)=>Math.max(0,value-1));if(preparationRemaining<=1)setPhase("ready")},1000);return()=>window.clearTimeout(timer)},[phase,preparationRemaining]);
  useEffect(()=>{if(phase!=="recording"||responseRemaining<=0)return;const timer=window.setTimeout(()=>{setResponseRemaining((value)=>Math.max(0,value-1));if(responseRemaining<=1&&recorderRef.current?.state==="recording")recorderRef.current.stop()},1000);return()=>window.clearTimeout(timer)},[phase,responseRemaining]);
  useEffect(()=>()=>{recorderRef.current?.stream.getTracks().forEach((track)=>track.stop());if(audioUrl)URL.revokeObjectURL(audioUrl)},[audioUrl]);

  async function startRecording(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const recorder=new MediaRecorder(stream);chunksRef.current=[];startedAtRef.current=Date.now();setResponseRemaining(targetSeconds);
      recorder.ondataavailable=(event)=>{if(event.data.size)chunksRef.current.push(event.data)};
      recorder.onstop=()=>{const next=new Blob(chunksRef.current,{type:recorder.mimeType||"audio/webm"});setBlob(next);setAudioUrl((current)=>{if(current)URL.revokeObjectURL(current);return URL.createObjectURL(next)});setDuration(Math.max(1,Math.round((Date.now()-startedAtRef.current)/1000)));setListenedBack(false);stream.getTracks().forEach((track)=>track.stop());setPhase("review")};
      recorderRef.current=recorder;recorder.start();setMessage("");setPhase("recording");
    }catch{setMessage("لم نتمكن من الوصول إلى الميكروفون. تحقق من إذن المتصفح.")}
  }
  function stopRecording(){if(recorderRef.current?.state==="recording")recorderRef.current.stop()}
  function toggleCriterion(item:string){setAchievedCriteria((current)=>current.includes(item)?current.filter((value)=>value!==item):[...current,item])}
  async function save(){
    if(!blob||!canSaveSpeakingReview({listenedBack,reflection}))return;
    const mediaId=`speaking-${crypto.randomUUID()}`;await saveMedia(mediaId,blob);const now=new Date().toISOString();
    update((current)=>({...current,speakingAttempts:[...current.speakingAttempts,{id:`attempt-${crypto.randomUUID()}`,taskId,mediaId,durationSeconds:duration,selfScore:clarityScore,reflection,selfReview:{listenedBack,achievedCriteria:[...achievedCriteria],clarityScore,turnTaking,repairUsed,preparationNotes:preparationNotes.map((note)=>note.trim()).filter(Boolean)},targetSeconds,preparationSeconds:preparationTotal-preparationRemaining,retryOf:latestAttempt?.id,createdAt:now}],studyHistory:[...current.studyHistory,{date:now.slice(0,10),minutes:Math.max(1,Math.ceil((preparationTotal+duration)/60)),evidenceCount:1}]}));
    setMessage("حُفظت المحاولة والمراجعة الذاتية محليًا. لم يُرفع الصوت ولم تُحسب درجة نطق.");setPhase("saved");
  }
  function retry(){if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl("");setBlob(null);setDuration(0);setListenedBack(false);setAchievedCriteria([]);setClarityScore(3);setTurnTaking(false);setRepairUsed(false);setReflection("");setMessage("");setPreparationRemaining(preparationTotal);setResponseRemaining(targetSeconds);setPhase("prepare")}
  function discard(){retry();setPreparationNotes(["","",""])}
  const prepLabel=`${String(Math.floor(preparationRemaining/60)).padStart(2,"0")}:${String(preparationRemaining%60).padStart(2,"0")}`;
  const responseLabel=`${String(Math.floor(responseRemaining/60)).padStart(2,"0")}:${String(responseRemaining%60).padStart(2,"0")}`;
  const band=duration?speakingDurationBand(duration,targetSeconds):null;
  const saveReady=Boolean(blob&&canSaveSpeakingReview({listenedBack,reflection}));

  return <div className="lab-page">
    <header className="page-heading"><div><span className="eyebrow"><Mic2 size={15}/> مختبر المحادثة · {level}</span><h1>حضّر، سجّل، <em>استمع ثم أعد.</em></h1><p>{lesson?`المهمة مرتبطة بالدرس ${lesson.id}: ${lesson.titleAr}.`:"اختر درسًا للحصول على مهمة مرتبطة بهدفه."}</p></div><div className="lab-counter"><strong>{attempts.length}</strong><span>محاولات المهمة<br/>محفوظة</span></div></header>
    <nav className="speaking-workflow" aria-label="مراحل دورة المحادثة">{["تحضير محدود","تسجيل بلا نموذج","استماع ذاتي","تقييم وإصلاح","إعادة المحاولة"].map((label,index)=>{const active=phase==="prepare"?0:phase==="ready"||phase==="recording"?1:phase==="review"?index===2||index===3:phase==="saved"?4:false;return <span key={label} className={active?"active":""}><i>{index+1}</i>{label}</span>})}</nav>
    <div className="speaking-layout">
      <section className="speaking-task">
        <span className="task-label">{level} · {task.titleAr}</span><h2 lang="de" dir="ltr">{task.promptDe}</h2><p>{task.promptAr}</p>
        {(phase==="prepare"||phase==="ready")&&<><div className="prompt-chips" dir="ltr">{task.usefulPhrases.map((phrase)=><span key={phrase}>{phrase}</span>)}</div><div className="speaking-preparation"><header><Clock3 size={18}/><div><strong>تحضير بكلمات مفتاحية فقط</strong><small>تختفي العبارات والملاحظات أثناء التسجيل.</small></div><b>{prepLabel}</b></header><div>{preparationNotes.map((note,index)=><input key={index} value={note} onChange={(event)=>setPreparationNotes((current)=>current.map((value,itemIndex)=>itemIndex===index?event.target.value:value))} placeholder={`كلمة مفتاحية ${index+1}`}/>)}</div>{phase==="prepare"?<button onClick={()=>setPhase("ready")}>أنهِ التحضير الآن</button>:<button onClick={()=>void startRecording()}><Mic2 size={16}/> ابدأ التسجيل</button>}</div></>}
        {phase==="recording"&&<div className="speaking-live"><span className="record-dot"/><div><strong>التسجيل يعمل دون نموذج أو ملاحظات</strong><small>الهدف الزمني الداخلي {targetSeconds} ثانية</small></div><b>{responseLabel}</b><button onClick={stopRecording}><CircleStop size={17}/> إيقاف</button></div>}
        {(phase==="review"||phase==="saved")&&<div className="speaking-playback"><header><Headphones size={18}/><div><strong>استمع إلى محاولتك كاملةً</strong><small>لا يُفتح الحفظ قبل وصول المشغل إلى النهاية.</small></div></header><audio controls src={audioUrl} onEnded={()=>setListenedBack(true)} aria-label="تشغيل محاولة المحادثة"/><div><span>المدة الفعلية <b>{duration} ث</b></span><span>الهدف الداخلي <b>{targetSeconds} ث</b></span><span>مقارنة المدة <b>{band==="short"?"أقصر من 60%":band==="long"?"أطول من 130%":"ضمن النطاق الداخلي"}</b></span></div>{listenedBack&&<p><Check size={14}/> اكتمل الاستماع الذاتي.</p>}</div>}
        {message&&<div className="success-banner"><ShieldCheck size={17}/>{message}</div>}
        {phase==="review"&&<button className="secondary-button speaking-discard" onClick={discard}><Trash2 size={16}/> حذف التسجيل دون احتسابه</button>}
      </section>

      <aside className="self-rubric">
        <div className="card-title"><span>تقييم ذاتي صادق</span><small>ليس تقييم نطق آلي</small></div>
        {phase==="review"||phase==="saved"?<><div className="speaking-criteria">{task.successCriteriaAr.map((item)=><label key={item} className={achievedCriteria.includes(item)?"checked":""}><input type="checkbox" checked={achievedCriteria.includes(item)} onChange={()=>toggleCriterion(item)}/><span>{item}</span></label>)}</div><label>وضوح المهمة من 5<div className="score-buttons">{ratingValues.map((score)=><button key={score} onClick={()=>setClarityScore(score)} className={clarityScore===score?"active":""}>{score}</button>)}</div></label><label className="speaking-review-check"><input type="checkbox" checked={turnTaking} onChange={(event)=>setTurnTaking(event.target.checked)}/><span>أخذت الدور أو طرحت/أجبت عن سؤال مناسب.</span></label><label className="speaking-review-check"><input type="checkbox" checked={repairUsed} onChange={(event)=>setRepairUsed(event.target.checked)}/><span>أصلحت فكرة أو أعدت صياغتها عند التعثر.</span></label><label>الفجوة المحددة وخطة الإعادة<textarea value={reflection} onChange={(event)=>setReflection(event.target.value)} placeholder="مثال: توقفت قبل السؤال؛ في الإعادة سأحفظ ترتيب السؤال لا النص كاملًا."/></label><button className="primary-button" onClick={()=>void save()} disabled={!saveReady||phase==="saved"}><Save size={16}/> {phase==="saved"?"تم حفظ المحاولة":"حفظ الدليل بعد الاستماع"}</button>{phase==="saved"&&<button className="secondary-button" onClick={retry}><RotateCcw size={15}/> ابدأ محاولة محسنة</button>}<div className="privacy-note"><Volume2 size={17}/><p>المحفوظ هو التسجيل والمدة وتقييمك الذاتي فقط. لا يوجد تحليل فونيمي أو درجة طلاقة أو نطق آلية.</p></div></>:<div className="feedback-placeholder"><Mic2 size={26}/><p>أكمل التحضير والتسجيل أولًا. العبارات والملاحظات تختفي أثناء الأداء حتى يبقى الدليل مستقلًا.</p></div>}
      </aside>
    </div>
  </div>;
}
