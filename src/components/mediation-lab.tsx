"use client";

import { useMemo,useState } from "react";
import { ArrowLeft,Check,Languages,RotateCcw,Save,Sparkles } from "lucide-react";
import { analyzeMediation,MEDIATION_SELF_CHECKS,type MediationAnalysis } from "@/core/mediation/analyze";
import { academicLessons } from "@/data/academic-lessons";
import type { MediationSubmission } from "@/types/learning";
import { useLearning } from "./learning-provider";

type Phase="plan"|"draft"|"self-check"|"feedback"|"revision";
const fallback={scenarioAr:"صديقك لم يفهم إعلانًا ألمانيًا قصيرًا.",sourceDe:"Der Termin ist am Freitag um zehn Uhr. Bitte bringen Sie Ihren Ausweis mit.",taskAr:"اشرح له بالعربية الموعد وما يجب إحضاره، ثم اكتب ردًا ألمانيًا قصيرًا.",suggestedAr:"الموعد يوم الجمعة في العاشرة، ويجب إحضار بطاقة الهوية. Danke, ich komme am Freitag und bringe meinen Ausweis mit."};
const phases:Array<{id:Phase;label:string}>=[{id:"plan",label:"تفكيك المصدر"},{id:"draft",label:"النقل الأول"},{id:"self-check",label:"التحقق"},{id:"feedback",label:"المقارنة"},{id:"revision",label:"الصياغة المحسنة"}];

export function MediationLab({lessonId}:{lessonId?:string}){
  const{state,update}=useLearning();
  const lesson=lessonId?academicLessons[lessonId]:undefined;
  const task=lesson?.mediation??fallback;
  const taskId=lesson?.id??"a1-mediation";
  const level=lesson?.level??"A1";
  const submissions=state.mediationSubmissions.filter((item)=>item.taskId===taskId);
  const latest=submissions.at(-1);
  const[phase,setPhase]=useState<Phase>(()=>latest?.status==="draft"?"self-check":latest?"feedback":"plan");
  const[audience,setAudience]=useState(latest?.audience??"");
  const[purpose,setPurpose]=useState(latest?.purpose??"");
  const[keyFacts,setKeyFacts]=useState<string[]>(latest?.keyFacts?.length?latest.keyFacts:["","",""]);
  const[transferAr,setTransferAr]=useState(latest?.transferAr??"");
  const[responseDe,setResponseDe]=useState(latest?.responseDe??"");
  const[selfChecklist,setSelfChecklist]=useState<string[]>(latest?.selfChecklist??[]);
  const[reviewedTransfer,setReviewedTransfer]=useState(latest?.status!=="draft"?latest?.transferAr??"":"");
  const[reviewedResponse,setReviewedResponse]=useState(latest?.status!=="draft"?latest?.responseDe??"":"");
  const[reviewedAnalysis,setReviewedAnalysis]=useState<MediationAnalysis|null>(()=>latest?.dimensions?{...analyzeMediation({sourceDe:task.sourceDe,taskAr:task.taskAr,audience:latest.audience,purpose:latest.purpose,keyFacts:latest.keyFacts,transferAr:latest.transferAr,responseDe:latest.responseDe,selfChecklist:latest.selfChecklist}),dimensions:latest.dimensions,feedback:latest.feedback}:null);
  const planComplete=Boolean(audience.trim()&&purpose.trim()&&keyFacts.filter((item)=>item.trim()).length>=2);
  const analysis=useMemo(()=>analyzeMediation({sourceDe:task.sourceDe,taskAr:task.taskAr,audience,purpose,keyFacts,transferAr,responseDe,selfChecklist}),[task.sourceDe,task.taskAr,audience,purpose,keyFacts,transferAr,responseDe,selfChecklist]);
  const draftComplete=transferAr.trim().length>=20&&(!analysis.requiresGermanResponse||responseDe.trim().split(/\s+/u).length>=4);
  const selfCheckComplete=MEDIATION_SELF_CHECKS.every((item)=>selfChecklist.includes(item));
  const changed=transferAr.trim()!==reviewedTransfer.trim()||responseDe.trim()!==reviewedResponse.trim();
  const activeIndex=phases.findIndex((item)=>item.id===phase);

  function toggleCheck(item:string){setSelfChecklist((current)=>current.includes(item)?current.filter((value)=>value!==item):[...current,item])}
  function persist(status:MediationSubmission["status"],withAnalysis:boolean){const now=new Date().toISOString();const sourceVersion=[...submissions].reverse().find((item)=>item.status!=="draft")?.version;const submission:MediationSubmission={id:`mediation-${crypto.randomUUID()}`,taskId,audience:audience.trim(),purpose:purpose.trim(),keyFacts:keyFacts.map((item)=>item.trim()).filter(Boolean),transferAr,responseDe,version:submissions.length+1,status,selfChecklist:[...selfChecklist],dimensions:withAnalysis?analysis.dimensions:undefined,feedback:withAnalysis?analysis.feedback:[],sourceVersion:status==="revised"?sourceVersion:undefined,createdAt:now,updatedAt:now};update((current)=>({...current,mediationSubmissions:[...current.mediationSubmissions,submission],studyHistory:withAnalysis?[...current.studyHistory,{date:now.slice(0,10),minutes:5,evidenceCount:1}]:current.studyHistory}));if(withAnalysis){setReviewedAnalysis(analysis);setReviewedTransfer(transferAr);setReviewedResponse(responseDe);setPhase("feedback")}else setPhase("self-check")}

  return <div className="lab-page mediation-lab"><header className="page-heading"><div><span className="eyebrow"><Languages size={15}/> مختبر الوساطة · {level}</span><h1>انقل المقصد، <em>لا ترتيب الكلمات.</em></h1><p>{lesson?`المهمة مرتبطة بالدرس ${lesson.id}: ${lesson.titleAr}.`:"اختر درسًا للحصول على وساطة مرتبطة بهدفه."}</p></div><div className="lab-counter"><strong>{submissions.length}</strong><span>نسخ الوساطة<br/>محفوظة محليًا</span></div></header>
    <nav className="mediation-workflow" aria-label="مراحل دورة الوساطة">{phases.map((item,index)=><span key={item.id} className={phase===item.id?"active":index<activeIndex?"complete":""}><i>{index<activeIndex?<Check size={12}/>:index+1}</i>{item.label}</span>)}</nav>
    <div className="mediation-layout"><section className="mediation-source"><span className="task-label">السياق</span><p>{task.scenarioAr}</p><article lang="de" dir="ltr">{task.sourceDe}</article><div><strong>المهمة</strong><p>{task.taskAr}</p></div></section><section className="mediation-workspace">
      {phase==="plan"&&<div className="mediation-plan"><header><strong>1. حدّد المتلقي والغرض والمعلومات</strong><small>لا تبدأ بصياغة عربية كلمة مقابل كلمة.</small></header><label>من هو المتلقي؟<input value={audience} onChange={(event)=>setAudience(event.target.value)} placeholder="مثال: صديق يريد التسجيل"/></label><label>ماذا يجب أن يستطيع فعله بعد الشرح؟<input value={purpose} onChange={(event)=>setPurpose(event.target.value)} placeholder="مثال: يعرف الموعد والوثيقة المطلوبة"/></label><div><strong>حقائق المصدر</strong>{keyFacts.map((fact,index)=><input key={index} value={fact} onChange={(event)=>setKeyFacts((current)=>current.map((value,itemIndex)=>itemIndex===index?event.target.value:value))} placeholder={`حقيقة ${index+1}`}/>)}</div><button className="primary-button" disabled={!planComplete} onClick={()=>setPhase("draft")}>ابدأ النقل الأول <ArrowLeft size={15}/></button></div>}
      {(phase==="draft"||phase==="revision")&&<div className="mediation-draft"><div className="mediation-plan-summary"><span><b>المتلقي</b>{audience}</span><span><b>الغرض</b>{purpose}</span><span><b>الحقائق</b>{keyFacts.filter(Boolean).join(" · ")}</span></div><label>الشرح العربي<textarea value={transferAr} onChange={(event)=>setTransferAr(event.target.value)} placeholder="اشرح المعنى والمطلوب والقيود بلغة مناسبة للمتلقي…"/></label>{analysis.requiresGermanResponse&&<label>الاستجابة الألمانية القصيرة<textarea dir="ltr" lang="de" value={responseDe} onChange={(event)=>setResponseDe(event.target.value)} placeholder="Schreiben Sie eine kurze passende Antwort …"/></label>}<footer><span>{transferAr.trim().split(/\s+/u).filter(Boolean).length} كلمة عربية تقريبًا</span>{phase==="draft"?<button className="primary-button" disabled={!draftComplete} onClick={()=>persist("draft",false)}><Save size={15}/> حفظ النقل الأول</button>:<button className="primary-button" disabled={!draftComplete||!changed} onClick={()=>persist("revised",true)}><Save size={15}/> حفظ الصياغة المحسنة</button>}</footer></div>}
      {phase==="self-check"&&<div className="mediation-self-check"><header><strong>3. تحقق قبل المقارنة</strong><small>تأكيدك دليل تغطية، وليس إثبات جودة لغوية.</small></header><blockquote>{transferAr}</blockquote><div>{MEDIATION_SELF_CHECKS.map((item)=><label key={item} className={selfChecklist.includes(item)?"checked":""}><input type="checkbox" checked={selfChecklist.includes(item)} onChange={()=>toggleCheck(item)}/><span>{item}</span></label>)}</div><footer><button className="secondary-button" onClick={()=>setPhase("draft")}><RotateCcw size={14}/> عدّل النقل</button><button className="primary-button" disabled={!selfCheckComplete} onClick={()=>persist("submitted",true)}><Sparkles size={14}/> افحص الوساطة</button></footer></div>}
      {phase==="feedback"&&<div className="mediation-feedback"><div className="mediation-dimensions">{reviewedAnalysis?.dimensions.map((item)=><article key={item.key} className={item.passed?"passed":""}><header><span>{item.passed?<Check size={13}/>:"—"}</span><strong>{item.labelAr}</strong></header><p>{item.detailAr}</p>{item.evidenceQuote&&<blockquote lang={item.key==="response"?"de":"ar"} dir={item.key==="response"?"ltr":"rtl"}>{item.evidenceQuote}</blockquote>}</article>)}</div><div className="feedback-box"><strong>ملاحظات مرتبطة بصياغتك</strong>{reviewedAnalysis?.feedback.map((item)=><p key={item}>{item}</p>)}</div><details className="translation-panel"><summary>اقتراح للمقارنة بعد المحاولة</summary><p>{task.suggestedAr}</p></details><div className="mediation-reviewed"><strong>النقل الذي فُحص</strong><p>{reviewedTransfer}</p>{reviewedResponse&&<p lang="de" dir="ltr">{reviewedResponse}</p>}</div><button className="primary-button" onClick={()=>setPhase("revision")}><RotateCcw size={15}/> ابدأ صياغة محسنة دون نسخ الاقتراح</button></div>}
    </section></div>
  </div>;
}
