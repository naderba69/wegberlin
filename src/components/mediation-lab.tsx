"use client";

import { useMemo,useState } from "react";
import { ArrowLeft,Check,Languages,RotateCcw,Save,Sparkles } from "lucide-react";
import { analyzeMediation,MEDIATION_SELF_CHECKS,type MediationAnalysis } from "@/core/mediation/analyze";
import { appendSupportUsageEvent, createSupportUsageEvent } from "@/core/evidence/support-usage";
import { academicLessons } from "@/data/academic-lessons";
import type { MediationSubmission } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { GUIDED_MEDIATION_POLICY, mediationStarter } from "@/core/mediation/guidance";

type Phase="plan"|"draft"|"self-check"|"feedback"|"revision";
const fallback={scenarioAr:"صديقك لم يفهم إعلانًا ألمانيًا قصيرًا.",sourceDe:"Der Termin ist am Freitag um zehn Uhr. Bitte bringen Sie Ihren Ausweis mit.",taskAr:"اشرح له بالعربية الموعد وما يجب إحضاره، ثم اكتب ردًا ألمانيًا قصيرًا.",suggestedAr:"الموعد يوم الجمعة في العاشرة، ويجب إحضار بطاقة الهوية. Danke, ich komme am Freitag und bringe meinen Ausweis mit."};
const phases:Array<{id:Phase;label:string}>=[{id:"plan",label:"افهم الموقف"},{id:"draft",label:"ساعد صديقك"},{id:"self-check",label:"راجع إجابتك"},{id:"feedback",label:"افهم الملاحظات"},{id:"revision",label:"حسّن الإجابة"}];

export function MediationLab({lessonId}:{lessonId?:string}){
  const{state,update}=useLearning();
  const lesson=lessonId?academicLessons[lessonId]:undefined;
  const task=lesson?.mediation??fallback;
  const taskId=lesson?.id??"a1-mediation";
  const level=lesson?.level??"A1";
  const starter=mediationStarter(taskId,level);
  const submissions=state.mediationSubmissions.filter((item)=>item.taskId===taskId);
  const latest=submissions.at(-1);
  const[phase,setPhase]=useState<Phase>(()=>latest?.status==="draft"?"self-check":latest?"feedback":"plan");
  const[audience,setAudience]=useState(latest?.audience??starter.audience);
  const[purpose,setPurpose]=useState(latest?.purpose??starter.purpose);
  const[keyFacts,setKeyFacts]=useState<string[]>(latest?.keyFacts?.length?latest.keyFacts:starter.keyFacts);
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
  function recordModelReveal(){const event=createSupportUsageEvent({kind:"mediation-model",surface:"mediation-lab",contentId:`${taskId}:mediation-model`,lessonId:lesson?.id,afterCommit:true});update((current)=>({...current,supportUsageEvents:appendSupportUsageEvent(current.supportUsageEvents,event)}))}
  function persist(status:MediationSubmission["status"],withAnalysis:boolean){const now=new Date().toISOString();const sourceVersion=[...submissions].reverse().find((item)=>item.status!=="draft")?.version;const submission:MediationSubmission={id:`mediation-${crypto.randomUUID()}`,taskId,audience:audience.trim(),purpose:purpose.trim(),keyFacts:keyFacts.map((item)=>item.trim()).filter(Boolean),transferAr,responseDe,version:submissions.length+1,status,selfChecklist:[...selfChecklist],dimensions:withAnalysis?analysis.dimensions:undefined,feedback:withAnalysis?analysis.feedback:[],sourceVersion:status==="revised"?sourceVersion:undefined,createdAt:now,updatedAt:now};update((current)=>({...current,mediationSubmissions:[...current.mediationSubmissions,submission],studyHistory:withAnalysis?[...current.studyHistory,{date:now.slice(0,10),minutes:5,evidenceCount:1}]:current.studyHistory}));if(withAnalysis){setReviewedAnalysis(analysis);setReviewedTransfer(transferAr);setReviewedResponse(responseDe);setPhase("feedback")}else setPhase("self-check")}

  return <div className="lab-page mediation-lab" data-guided-mediation-policy={GUIDED_MEDIATION_POLICY}><header className="page-heading"><div><span className="eyebrow"><Languages size={15}/> تدريب الوساطة · {level}</span><h1>افهم الرسالة، <em>ثم ساعد شخصًا آخر.</em></h1><p>{lesson?`من درس «${lesson.titleAr}». ستفهم المطلوب أولًا، ثم تبني شرحك وردك خطوة بخطوة.`:"اختر درسًا، وسنشرح الموقف قبل أن نطلب منك الكتابة."}</p></div><div className="lab-counter"><strong>{submissions.length||"ابدأ"}</strong><span>{submissions.length?"محاولات محفوظة محليًا":"لا توجد محاولة بعد"}</span></div></header><section className="mediation-goal"><small>هدفك في هذه المهمة</small><strong>{starter.goalAr}</strong><p>لا تحتاج إلى ترجمة النص كلمة بكلمة. ركّز على ما يجب أن يفهمه الشخص وما الذي سيفعله بعد ذلك.</p></section>
    <nav className="mediation-workflow" aria-label="مراحل دورة الوساطة">{phases.map((item,index)=><span key={item.id} className={phase===item.id?"active":index<activeIndex?"complete":""}><i>{index<activeIndex?<Check size={12}/>:index+1}</i>{item.label}</span>)}</nav>
    <div className="mediation-layout"><section className="mediation-source"><span className="task-label">ما الذي يحدث؟</span><p>{task.scenarioAr}</p><article lang="de" dir="ltr">{task.sourceDe}</article><div><strong>ماذا ستفعل؟</strong><p>{task.taskAr}</p></div></section><section className="mediation-workspace">
      {phase==="plan"&&<div className="mediation-plan"><header><strong>1. افهم من يحتاج مساعدتك وما المطلوب</strong><small>{starter.guided?"جهزنا لك بداية من النص نفسه. اقرأها وعدّلها إذا لزم، ثم انتقل إلى شرحك.":"اكتب نقطتين واضحتين على الأقل من النص قبل أن تبدأ الشرح."}</small></header><label>من الذي ستساعده؟<input value={audience} onChange={(event)=>setAudience(event.target.value)} placeholder="مثال: صديق لا يفهم الرسالة"/></label><label>ماذا يجب أن يعرف أو يفعل بعد شرحك؟<input value={purpose} onChange={(event)=>setPurpose(event.target.value)} placeholder="مثال: يفهم المطلوب ويستطيع الرد"/></label><div><strong>المعلومات التي يجب ألا تضيع</strong><small>هذه ليست ترجمة حرفية؛ إنها أهم النقاط التي يحتاجها الشخص.</small>{keyFacts.map((fact,index)=><input key={index} value={fact} onChange={(event)=>setKeyFacts((current)=>current.map((value,itemIndex)=>itemIndex===index?event.target.value:value))} placeholder={`المعلومة المهمة ${index+1}`}/>)}</div><button className="primary-button" disabled={!planComplete} onClick={()=>setPhase("draft")}>ابدأ شرحك الأول <ArrowLeft size={15}/></button></div>}
      {(phase==="draft"||phase==="revision")&&<div className="mediation-draft"><div className="mediation-plan-summary"><span><b>من أساعد؟</b>{audience}</span><span><b>ماذا يحتاج؟</b>{purpose}</span><span><b>النقاط المهمة</b>{keyFacts.filter(Boolean).join(" · ")}</span></div><label>اشرح لصديقك بالعربية<textarea value={transferAr} onChange={(event)=>setTransferAr(event.target.value)} placeholder="قل له ببساطة ماذا تعني الرسالة وماذا يجب أن يفعل…"/></label>{analysis.requiresGermanResponse&&<label><span lang="de" dir="ltr">Kurze Antwort auf Deutsch</span> · الرد الألماني القصير<textarea dir="ltr" lang="de" value={responseDe} onChange={(event)=>setResponseDe(event.target.value)} placeholder="Guten Morgen. Ich heiße …"/></label>}<footer><span>{transferAr.trim().split(/\s+/u).filter(Boolean).length} كلمة عربية تقريبًا</span>{phase==="draft"?<button className="primary-button" disabled={!draftComplete} onClick={()=>persist("draft",false)}><Save size={15}/> احفظ ثم راجع إجابتك</button>:<button className="primary-button" disabled={!draftComplete||!changed} onClick={()=>persist("revised",true)}><Save size={15}/> احفظ الإجابة المحسنة</button>}</footer></div>}
      {phase==="self-check"&&<div className="mediation-self-check"><header><strong>3. راجع إجابتك قبل التصحيح</strong><small>اقرأ كل نقطة وحدد ما فعلته فعلًا. يمكنك العودة والتعديل قبل الفحص.</small></header><blockquote>{transferAr}</blockquote><div>{MEDIATION_SELF_CHECKS.map((item)=><label key={item} className={selfChecklist.includes(item)?"checked":""}><input type="checkbox" checked={selfChecklist.includes(item)} onChange={()=>toggleCheck(item)}/><span>{item}</span></label>)}</div><footer><button className="secondary-button" onClick={()=>setPhase("draft")}><RotateCcw size={14}/> عدّل الإجابة</button><button className="primary-button" disabled={!selfCheckComplete} onClick={()=>persist("submitted",true)}><Sparkles size={14}/> افحص ما نقلته</button></footer></div>}
      {phase==="feedback"&&<><StatusAnnouncement message={latest?.status==="revised"?"حُفظت إجابتك المحسنة وربطت بالمحاولة السابقة.":"اكتمل الفحص. سترى الآن ما نقلته جيدًا وما يحتاج إلى إضافة واضحة."} channel="mediation-lab" className="compact"/><div className="mediation-feedback"><div className="mediation-dimensions">{reviewedAnalysis?.dimensions.map((item)=><article key={item.key} className={item.passed?"passed":""}><header><span>{item.passed?<Check size={13}/>:"!"}</span><strong>{item.labelAr}</strong></header><p>{item.detailAr}</p>{item.evidenceQuote&&<blockquote lang={item.key==="response"?"de":"ar"} dir={item.key==="response"?"ltr":"rtl"}>{item.evidenceQuote}</blockquote>}</article>)}</div><div className="feedback-box"><strong>ملاحظات مرتبطة بصياغتك</strong>{reviewedAnalysis?.feedback.map((item)=><p key={item}>{item}</p>)}</div><details className="translation-panel" onToggle={(event)=>{if(event.currentTarget.open)recordModelReveal()}}><summary>اقتراح للمقارنة بعد المحاولة</summary><p>{task.suggestedAr}</p></details><div className="mediation-reviewed"><strong>النقل الذي فُحص</strong><p>{reviewedTransfer}</p>{reviewedResponse&&<p lang="de" dir="ltr">{reviewedResponse}</p>}</div><button className="primary-button" onClick={()=>setPhase("revision")}><RotateCcw size={15}/> ابدأ صياغة محسنة دون نسخ الاقتراح</button></div></>}
    </section></div>
  </div>;
}
