"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Check, FilePenLine, Lightbulb, RotateCcw, Save, Sparkles } from "lucide-react";
import { analyzeWriting, type WritingAnalysis } from "@/core/writing/analyze";
import { behavioralPraise } from "@/core/coach/behavioral-praise";
import { appendSupportUsageEvent, createSupportUsageEvent } from "@/core/evidence/support-usage";
import { academicLessons } from "@/data/academic-lessons";
import type { WritingPlan, WritingSubmission } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { WritingDeviceBenchmark } from "./writing-device-benchmark";
import { WritingRepairPractice } from "./writing-repair-practice";
import { WritingGrammarSignalsPanel } from "./writing-grammar-signals-panel";
import { HybridWritingReview } from "./hybrid-writing-review";
import { ExternalEvaluatorBridge } from "./external-evaluator-bridge";
import { buildWritingRepairExercises, createWritingRepairAttempt, type WritingRepairExercise } from "@/core/writing/error-practice";
import { WritingVersionDiff } from "./writing-version-diff";
import { appendTrainingInteraction } from "@/core/evidence/training-interactions";

type WritingPhase="plan"|"draft"|"self-check"|"feedback"|"revision";
const phaseLabels:Array<{id:WritingPhase;label:string}>=[{id:"plan",label:"التخطيط"},{id:"draft",label:"المسودة"},{id:"self-check",label:"التحقق الذاتي"},{id:"feedback",label:"الملاحظات"},{id:"revision",label:"إعادة الكتابة"}];

export function WritingLab({lessonId}:{lessonId?:string}){
  const{state,update}=useLearning();
  const requestedLesson=lessonId?academicLessons[lessonId]:undefined;
  const latestCompletedLesson=[...state.completedLessonIds].reverse().map((id)=>academicLessons[id]).find(Boolean);
  const currentLesson=academicLessons[state.currentLessonId]??academicLessons["a1-01"];
  const lesson=requestedLesson??latestCompletedLesson??currentLesson;
  const lessonReady=Boolean(state.completedLessonIds.includes(lesson.id)||(state.lessonProgress[lesson.id]??0)>=9);
  const task=lesson.writing;
  const taskId=lesson.id;
  const level=lesson.level;
  const rangeMatch=task.promptDe.match(/(\d{2,3})[–-](\d{2,3})\s+Wörter/i);
  const singleMatch=task.promptDe.match(/(\d{2,3})\s+Wörter/i);
  const fallbackMinimum=level==="A1"?30:level==="A2"?70:level==="B1"?100:140;
  const minWords=rangeMatch?Number(rangeMatch[1]):singleMatch?Number(singleMatch[1]):fallbackMinimum;
  const requireGreeting=/Nachricht|E-Mail|Brief|Mail/iu.test(task.promptDe);
  const submissions=state.writingSubmissions.filter((submission)=>submission.taskId===taskId);
  const latest=submissions.at(-1);
  const interactionThrottle=useRef(0);
  const [phase,setPhase]=useState<WritingPhase>(()=>latest?.status==="draft"?"self-check":latest?"feedback":"plan");
  const [plan,setPlan]=useState<WritingPlan>(()=>latest?.plan??{audience:"",purpose:"",points:["","",""]});
  const [text,setText]=useState(latest?.text??"");
  const [selfChecklist,setSelfChecklist]=useState<string[]>(latest?.selfChecklist??[]);
    const [reviewedText,setReviewedText]=useState(latest?.status!=="draft"?latest?.text??"":"");
    const [reviewedSubmissionId,setReviewedSubmissionId]=useState(latest?.status!=="draft"?latest?.id??"":"");
    const [reviewedAnalysis,setReviewedAnalysis]=useState<WritingAnalysis|null>(()=>latest?.dimensions?{...analyzeWriting(latest.text,{minWords,requireGreeting,taskPointsCompleted:latest.selfChecklist?.length??0,taskPointsTotal:task.checklistAr.length}),dimensions:latest.dimensions,feedback:latest.feedback}:null);
  const planComplete=Boolean(plan.audience.trim()&&plan.purpose.trim()&&plan.points.filter((point)=>point.trim()).length>=2);
  const selfCheckComplete=task.checklistAr.every((item)=>selfChecklist.includes(item));
  const analysis=useMemo(()=>analyzeWriting(text,{minWords,requireGreeting,taskPointsCompleted:selfChecklist.length,taskPointsTotal:task.checklistAr.length}),[text,minWords,requireGreeting,selfChecklist,task.checklistAr.length]);
  const reviewedSubmission=submissions.find((submission)=>submission.id===reviewedSubmissionId);
  const latestRevision=[...submissions].reverse().find((submission)=>submission.status==="revised");
  const revisionSource=latestRevision?.sourceVersion?submissions.find((submission)=>submission.version===latestRevision.sourceVersion):undefined;
  const repairExercises=useMemo(()=>reviewedSubmission?buildWritingRepairExercises({text:reviewedText,taskId,sourceSubmissionId:reviewedSubmission.id,sourceVersion:reviewedSubmission.version}):[],[reviewedText,reviewedSubmission,taskId]);
  const repairAttempts=state.writingRepairAttempts.filter((attempt)=>attempt.sourceSubmissionId===reviewedSubmissionId);

  function logInteraction(event:"pause"|"resume"|"answer-change"){const now=Date.now();if(event==="answer-change"&&now-interactionThrottle.current<3000)return;if(event==="answer-change")interactionThrottle.current=now;update((current)=>({...current,trainingInteractionEvents:appendTrainingInteraction(current.trainingInteractionEvents,{surface:"writing-draft",contentId:taskId,event})}))}
  function cleanPlan():WritingPlan{return{audience:plan.audience.trim(),purpose:plan.purpose.trim(),points:plan.points.map((point)=>point.trim()).filter(Boolean)}}
  function persist(status:WritingSubmission["status"],withAnalysis:boolean){
    const now=new Date().toISOString();
    const version=submissions.length+1;
    const sourceVersion=[...submissions].reverse().find((submission)=>submission.status!=="draft")?.version;
    const submission:WritingSubmission={id:`writing-${crypto.randomUUID()}`,taskId,text,wordCount:analysis.wordCount,version,status,feedback:withAnalysis?analysis.feedback:[],plan:cleanPlan(),selfChecklist:[...selfChecklist],dimensions:withAnalysis?analysis.dimensions:undefined,sourceVersion:status==="revised"?sourceVersion:undefined,createdAt:now,updatedAt:now};
    update((current)=>({...current,writingSubmissions:[...current.writingSubmissions,submission]}));
    if(withAnalysis){setReviewedAnalysis(analysis);setReviewedText(text);setReviewedSubmissionId(submission.id);setPhase("feedback")}else setPhase("self-check");
  }
  function toggleCheck(item:string){setSelfChecklist((current)=>current.includes(item)?current.filter((value)=>value!==item):[...current,item])}
  function recordModelReveal(){const event=createSupportUsageEvent({kind:"writing-model",surface:"writing-lab",contentId:`${taskId}:writing-model`,lessonId:lesson.id,afterCommit:true});update((current)=>({...current,supportUsageEvents:appendSupportUsageEvent(current.supportUsageEvents,event)}))}
  function recordRepairAttempt(exercise:WritingRepairExercise,answer:string){const attempt=createWritingRepairAttempt(exercise,answer);update((current)=>({...current,writingRepairAttempts:[...current.writingRepairAttempts,attempt]}))}
  const activeIndex=phaseLabels.findIndex((item)=>item.id===phase);

  if(!lessonReady)return <div className="wide-page beginner-lab-gate"><span><BookOpenCheck size={30}/></span><small>حماية المتعلم المبتدئ</small><h1>لن نطلب منك الكتابة قبل أن تتعلم أولى العبارات.</h1><p>{state.profile?.priorExperience==="none"?"اخترت البدء من الصفر. ابدأ بالتحية والاسم داخل الدرس، واستمع وكرر ثم افتح مختبر الكتابة عندما تصل إلى مرحلته.":"مختبر الكتابة يحتاج سياق درس وصلت إلى مرحلته أو أنهيته، حتى لا يعرض مهمة ألمانية معزولة ومحيرة."}</p><div><Link className="primary-button" href={state.profile?`/lernen/${lesson.id}`:"/today"}>{state.profile?"ابدأ الدرس خطوة خطوة":"عرّفني بمستواك أولًا"}<ArrowLeft size={16}/></Link><Link className="secondary-button" href="/today">العودة إلى مهمتي اليوم</Link></div><em>لن يظهر نص المهمة الألماني هنا قبل الجاهزية.</em></div>;

  return <div className="lab-page">
    <header className="page-heading"><div><span className="eyebrow"><FilePenLine size={15}/> مختبر الكتابة · {level}</span><h1>خطّط، اكتب، <em>ثم أثبت المراجعة.</em></h1><p>{lesson?`المهمة مرتبطة بهدف «${lesson.titleAr}» في مستوى ${lesson.level}.`:"اختر درسًا من المسار للحصول على مهمة مرتبطة بهدفه."}</p></div><div className="lab-counter"><strong>{submissions.length}</strong><span>نسخ المهمة<br/>محفوظة محليًا</span></div></header>
    <WritingDeviceBenchmark level={level}/>
    <nav className="writing-workflow" aria-label="مراحل دورة الكتابة">{phaseLabels.map((item,index)=><span key={item.id} className={phase===item.id?"active":index<activeIndex?"complete":""}><i>{index<activeIndex?<Check size={12}/>:index+1}</i>{item.label}</span>)}</nav>
    <div className="writing-layout">
      <section className="writing-editor">
        <div className="task-box"><span>{level} · {task.titleAr}</span><p lang="de" dir="ltr">{task.promptDe}</p><div><Lightbulb size={16}/><small>{task.promptAr}</small></div></div>

        {phase==="plan"&&<section className="writing-plan"><header><strong>1. فكّ المهمة قبل الكتابة</strong><small>لا تُفتح المسودة قبل تحديد المتلقي والغرض ونقطتين على الأقل.</small></header><label>لمن أكتب؟<input value={plan.audience} onChange={(event)=>setPlan((current)=>({...current,audience:event.target.value}))} placeholder="مثال: إدارة الدورة"/></label><label>ما النتيجة التي أريدها؟<input value={plan.purpose} onChange={(event)=>setPlan((current)=>({...current,purpose:event.target.value}))} placeholder="مثال: طلب موعد بديل"/></label><div><strong>نقاط المحتوى</strong>{plan.points.map((point,index)=><input key={index} value={point} onChange={(event)=>setPlan((current)=>({...current,points:current.points.map((value,itemIndex)=>itemIndex===index?event.target.value:value)}))} placeholder={`النقطة ${index+1}`}/>)}</div><button className="primary-button" disabled={!planComplete} onClick={()=>setPhase("draft")}>ابدأ المسودة <ArrowLeft size={16}/></button></section>}

        {(phase==="draft"||phase==="revision")&&<><section className="plan-summary"><span><b>المتلقي</b>{plan.audience}</span><span><b>الغرض</b>{plan.purpose}</span><span><b>النقاط</b>{plan.points.filter(Boolean).join(" · ")}</span></section><textarea aria-label={phase==="revision"?"النسخة المنقحة":"المسودة الألمانية"} dir="ltr" lang="de" value={text} onFocus={()=>logInteraction("resume")} onBlur={()=>logInteraction("pause")} onChange={(event)=>{if(text&&event.target.value!==text)logInteraction("answer-change");setText(event.target.value)}} placeholder="Schreiben Sie hier …" spellCheck={false} autoCorrect="off" autoCapitalize="off"/><div className="editor-footer"><span className={analysis.wordCount>=minWords?"good":""}>{analysis.wordCount} كلمة · الهدف الأدنى {minWords}</span><div>{phase==="draft"?<button className="primary-button" onClick={()=>persist("draft",false)} disabled={!text.trim()}><Save size={16}/> حفظ المسودة والانتقال</button>:<button className="primary-button" onClick={()=>persist("revised",true)} disabled={analysis.wordCount<10||text.trim()===reviewedText.trim()}><Save size={16}/> حفظ النسخة المنقحة</button>}</div></div></>}

        {phase==="self-check"&&<section className="writing-self-check"><header><strong>3. تحقق قبل طلب الملاحظات</strong><small>أكد ما نفذته فعلًا، لا ما كنت تنوي تنفيذه.</small></header><article lang="de" dir="ltr">{text}</article><div>{task.checklistAr.map((item)=><label key={item} className={selfChecklist.includes(item)?"checked":""}><input type="checkbox" checked={selfChecklist.includes(item)} onChange={()=>toggleCheck(item)}/><span>{item}</span></label>)}</div><footer><button className="secondary-button" onClick={()=>setPhase("draft")}><RotateCcw size={15}/> عدّل المسودة</button><button className="primary-button" disabled={!selfCheckComplete||analysis.wordCount<10} onClick={()=>persist("submitted",true)}><Sparkles size={15}/> شغّل الفحص المرتبط بنصي</button></footer></section>}

        {phase==="feedback"&&<section className="writing-reviewed-text"><header><strong>النص الذي فُحص</strong><small>النسخة محفوظة ولا تتغير عند بدء المراجعة.</small></header><article lang="de" dir="ltr">{reviewedText}</article><button className="primary-button" onClick={()=>setPhase("revision")}><RotateCcw size={16}/> ابدأ إعادة الكتابة</button></section>}
      </section>

      <aside className="writing-feedback">
        <div className="card-title"><span>خمسة محاور منفصلة</span><small>مؤشرات حتمية، ليست درجة امتحان</small></div>
        {latestRevision&&revisionSource&&<WritingVersionDiff before={revisionSource.text} after={latestRevision.text}/>} 
        {latest?.status==="revised"&&<StatusAnnouncement message={behavioralPraise("writing-revision")} channel="writing-lab" className="behavioral-praise gamification-surface" icon={<Sparkles size={15}/>}/>} 
        {reviewedAnalysis?<><div className="writing-dimensions">{reviewedAnalysis.dimensions.map((dimension)=><article key={dimension.key} className={dimension.passed?"passed":""}><header><span>{dimension.passed?<Check size={13}/>:"—"}</span><strong>{dimension.labelAr}</strong></header><p>{dimension.detailAr}</p>{dimension.evidenceQuote&&<blockquote lang="de" dir="ltr">{dimension.evidenceQuote}</blockquote>}</article>)}</div><div className="feedback-box"><strong>ملاحظات مرتبطة بجملتك</strong>{reviewedAnalysis.feedback.map((item)=><p key={item}>{item}</p>)}</div><WritingGrammarSignalsPanel text={reviewedText}/><WritingRepairPractice exercises={repairExercises} attempts={repairAttempts} onAttempt={recordRepairAttempt}/>{reviewedSubmission&&<HybridWritingReview sourceText={reviewedText} sourceSubmissionId={reviewedSubmission.id} taskId={taskId} sourceVersion={reviewedSubmission.version} level={level} taskPromptDe={task.promptDe} localPatternIds={reviewedAnalysis.errorPatterns.map((pattern)=>pattern.patternId)}/>}{reviewedText&&reviewedSubmission?<ExternalEvaluatorBridge sourceText={reviewedText} submissionId={reviewedSubmission.id} taskId={taskId} level={level}/>:null}<details className="translation-panel" onToggle={(event)=>{if(event.currentTarget.open)recordModelReveal()}}><summary>النموذج بعد فحص المسودة</summary><p lang="de" dir="ltr">{task.modelDe}</p></details></>:<div className="feedback-placeholder"><FilePenLine size={26}/><p>أكمل التخطيط والمسودة والتحقق الذاتي. لن نستبدل نصك بإجابة مثالية صامتة.</p></div>}
      </aside>
    </div>
  </div>;
}
