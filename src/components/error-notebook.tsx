"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpenCheck, BrainCircuit, CalendarCheck, Check, Clock3, Eye, EyeOff, Filter, NotebookTabs, Printer, RotateCcw, Sparkles, X } from "lucide-react";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { buildErrorClinics, type ErrorClinic } from "@/core/errors/clinic";
import { applySuccessfulErrorRepair, errorRepairState, matchesErrorCorrection, recordFailedErrorRepair } from "@/core/errors/remediation";
import { classifyErrorPattern, errorInterventionPriority, errorPrerequisite } from "@/core/errors/pattern";
import { confirmedErrorSrsCards } from "@/core/srs/error-cards";
import type { ErrorPatternClassification, ErrorRecord } from "@/types/learning";
import { LocalErrorClassifier } from "./local-error-classifier";
import { ErrorInsightsPanel } from "./error-insights-panel";
import { ERROR_PRINT_PRIVACY_POLICY, ERROR_TIME_PRESSURE_TAG_POLICY, updateErrorLearnerMetadata } from "@/core/errors/insights";

const commonTraps = [
  { type:"word-order",title:"مكان الفعل",de:"weil ich krank bin",ar:"بعد weil يأتي الفعل المصرف في النهاية." },
  { type:"article",title:"حفظ الاسم مع أداة",de:"der Tisch · die Tische",ar:"لا تحفظ Tisch وحدها؛ احفظ الجنس والجمع معًا." },
  { type:"case",title:"الحالة بعد حرف الجر",de:"mit dem Bus",ar:"mit يطلب Dativ؛ لا تعتمد على ترجمة «بـ» العربية." },
  { type:"vocabulary",title:"العبارات المتلازمة",de:"eine Entscheidung treffen",ar:"الألمانية تقول «يتخذ قرارًا» بالفعل treffen لا machen." },
];

type Feedback = "correct" | "wrong";
const patternLabels: Record<ErrorPatternClassification, { title:string; detail:string }> = {
  "possible-slip": { title:"زلة محتملة", detail:"ظهور واحد دون ثقة عالية؛ نراقب قبل تعميم النمط." },
  "emerging-pattern": { title:"نمط ناشئ", detail:"تكرار أو فشل علاج أول؛ يحتاج تدريبًا مركزًا." },
  "misconception-risk": { title:"خطر تصور خاطئ", detail:"تكرار قوي أو ثقة عالية مع الخطأ أو فشل علاج متكرر؛ هذه إشارة تدخل وليست تشخيصًا معرفيًا." },
};

export function ErrorNotebook() {
  const { state, update } = useLearning();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [clinicAnswers,setClinicAnswers]=useState<Record<string,string>>({});
  const [clinicFeedback,setClinicFeedback]=useState<Record<string,Feedback>>({});
  const [revealedClinics,setRevealedClinics]=useState<Set<string>>(()=>new Set());
  const clinics=buildErrorClinics(state.errors);
  const pendingCount = state.errors.filter((error) => errorRepairState(error) === "waiting").length;
  const dueCount = state.errors.filter((error) => errorRepairState(error) === "due").length;
  const sortedErrors = [...state.errors].sort((left,right)=>Number(Boolean(left.resolved))-Number(Boolean(right.resolved))||errorInterventionPriority(right)-errorInterventionPriority(left)||Date.parse(right.lastSeenAt)-Date.parse(left.lastSeenAt));
  const personalErrorCards = confirmedErrorSrsCards(state.errors);

  function checkClinic(clinic:ErrorClinic){const answer=clinicAnswers[clinic.id]??"";const correct=matchesErrorCorrection(answer,clinic.followUpAnswer);setClinicFeedback((current)=>({...current,[clinic.id]:correct?"correct":"wrong"}));const now=new Date();update((current)=>({...current,errorClinicAttempts:[...current.errorClinicAttempts,{id:`clinic-attempt-${crypto.randomUUID()}`,clinicType:clinic.type,sourceErrorIds:clinic.sourceErrorIds,answer,correct,createdAt:now.toISOString()}],studyHistory:correct?[...current.studyHistory,{date:now.toISOString().slice(0,10),minutes:2,evidenceCount:1}]:current.studyHistory}))}

  function checkCorrection(error: ErrorRecord) {
    const correct = matchesErrorCorrection(answers[error.id] ?? "", error.correct);
    setFeedback((current) => ({ ...current, [error.id]: correct ? "correct" : "wrong" }));
    const now = new Date();
    if (!correct) {
      update((current) => ({ ...current, errors:current.errors.map((item)=>item.id===error.id?recordFailedErrorRepair(item,now):item) }));
      return;
    }
    update((current) => ({
      ...current,
      errors: current.errors.map((item) => item.id === error.id ? applySuccessfulErrorRepair(item, now) : item),
      studyHistory: [...current.studyHistory, { date: now.toISOString().slice(0, 10), minutes: 1, evidenceCount: 1 }],
    }));
  }

  function openPrerequisite(error: ErrorRecord) {
    const prerequisite = errorPrerequisite(error);
    if (!prerequisite) return;
    update((current) => ({ ...current, currentLessonId:prerequisite.lessonId, currentStage:prerequisite.stageIndex, lessonProgress:{ ...current.lessonProgress, [prerequisite.lessonId]:prerequisite.stageIndex } }));
  }

  function reopen(id: string) {
    update((current) => ({ ...current, errors: current.errors.map((error) => error.id === id ? { ...error, resolved: false, repairCount: 0, lastRepairedAt: undefined, nextReviewAt: undefined, confirmedAt: undefined } : error) }));
    setAnswers((current) => ({ ...current, [id]: "" }));
    setFeedback((current) => { const next = { ...current }; delete next[id]; return next; });
    setRevealed((current) => { const next = new Set(current); next.delete(id); return next; });
  }

  function reveal(id: string) {
    setRevealed((current) => new Set([...current, id]));
  }

  function toggleTimePressureTag(error:ErrorRecord){const active=error.learnerContextTags?.includes("knows-rule-under-time-pressure")??false;update((current)=>({...current,errors:current.errors.map((item)=>item.id===error.id?updateErrorLearnerMetadata(item,{timePressureTag:!active}):item)}))}
  function toggleSensitivePrint(error:ErrorRecord){update((current)=>({...current,errors:current.errors.map((item)=>item.id===error.id?updateErrorLearnerMetadata(item,{sensitiveInPrint:!error.sensitiveInPrint}):item)}))}

  return <div className="wide-page" data-error-print-policy={ERROR_PRINT_PRIVACY_POLICY} data-error-time-pressure-policy={ERROR_TIME_PRESSURE_TAG_POLICY}>
    <header className="page-heading"><div><span className="eyebrow"><NotebookTabs size={15}/> دفتر الأخطاء</span><h1>الخطأ الذي نفهمه <em>لا يتكرر عبثًا.</em></h1><p>اكتب التصحيح من الذاكرة قبل كشفه. لا يُغلق الخطأ بمجرد الضغط؛ يلزم إنتاج الجواب الصحيح.</p></div><div className="path-summary"><strong>{state.errors.filter((error)=>!error.resolved).length}</strong><span>فجوات نشطة<br/>{dueCount} مؤجل مستحق · {pendingCount} ينتظر · {personalErrorCards.length} بطاقات علاج</span></div></header>
    <LocalErrorClassifier/>
    <ErrorInsightsPanel/>
    <div className="error-toolbar"><span><Filter size={16}/> أخطائي الشخصية</span><small>المحلول لا يُحذف؛ يبقى في السجل التاريخي ويمكن إعادة فتحه.</small><button type="button" onClick={()=>window.print()}><Printer size={15}/> اطبع التقرير الآمن</button></div>
    {clinics.length>0&&<section className="error-clinic-stack"><header><div><span className="eyebrow"><BookOpenCheck size={14}/> عيادات تلقائية</span><h2>تكرر النمط؛ نعالج القاعدة لا السؤال وحده.</h2></div><strong>{clinics.length} عيادة نشطة</strong></header>{clinics.map((clinic)=>{const result=clinicFeedback[clinic.id];const isRevealed=revealedClinics.has(clinic.id);const successes=state.errorClinicAttempts.filter((attempt)=>attempt.clinicType===clinic.type&&attempt.correct).length;return <article key={clinic.id} className="error-clinic-card"><header><div><span>{clinic.type}</span><h3>{clinic.titleAr}</h3></div><b>{clinic.evidenceCount} أدلة تكرار · {clinic.sourceErrorIds.length} سجلات</b></header><div className="clinic-rule"><strong>القاعدة</strong><p>{clinic.ruleAr}</p><small><Sparkles size={12}/> تريك: {clinic.trickAr}</small></div><div className="clinic-model" lang="de" dir="ltr"><del>{clinic.modelWrong}</del><span>→</span><strong>{clinic.modelCorrect}</strong></div><details><summary>أمثلة النمط من أخطائك</summary><div>{clinic.sourceErrors.map((error)=><p key={error.id} lang="de" dir="ltr"><del>{error.wrong}</del><span>→</span><strong>{error.correct}</strong></p>)}</div></details><form className="clinic-follow-up" onSubmit={(event)=>{event.preventDefault();checkClinic(clinic)}}><label><span>تمرين نقل جديد</span><small>{clinic.followUpPromptAr}</small><input lang="de" dir="ltr" value={clinicAnswers[clinic.id]??""} onChange={(event)=>{setClinicAnswers((current)=>({...current,[clinic.id]:event.target.value}));setClinicFeedback((current)=>{const next={...current};delete next[clinic.id];return next})}} aria-label={`تمرين نقل ${clinic.titleAr}`} placeholder="اكتب الجملة الصحيحة كاملةً"/></label><div><button className="primary-button" type="submit" disabled={!clinicAnswers[clinic.id]?.trim()}><Check size={14}/> تحقق من النقل</button>{!isRevealed&&<button className="secondary-button" type="button" onClick={()=>setRevealedClinics((current)=>new Set([...current,clinic.id]))}><Eye size={14}/> اكشف جواب النقل</button>}</div>{(isRevealed||result==="correct")&&<p className="clinic-answer" lang="de" dir="ltr">{clinic.followUpAnswer}</p>}{result&&<StatusAnnouncement message={result==="correct"?"نجح تمرين النقل. تبقى أمثلة الخطأ الفردية بحاجة لعلاجها المؤجل.":"لم ينجح النقل بعد؛ ارجع إلى القاعدة والنموذج ثم أعد الإنتاج."} channel={`error-clinic-${clinic.id}`} className={result==="correct"?"remediation-feedback correct":"remediation-feedback wrong"} icon={result==="correct"?<Check size={14}/>:<X size={14}/>}/>}</form><footer><small>{successes} محاولات نقل ناجحة محفوظة محليًا</small><span>نجاح العيادة لا يغلق الأخطاء الفردية تلقائيًا.</span></footer></article>})}</section>}
    {state.errors.length ? <div className="personal-errors">{sortedErrors.map((error) => {
      const isRevealed = revealed.has(error.id);
      const result = feedback[error.id];
      const repairState = errorRepairState(error);
      const waiting = repairState === "waiting";
      const due = repairState === "due";
      const classification = error.patternClassification ?? classifyErrorPattern(error.occurrences,error.highConfidenceWrongCount??0,error.failedRepairCount??0);
      const pattern = patternLabels[classification];
      const prerequisite = errorPrerequisite(error);
      const personalCard = personalErrorCards.find((card)=>card.id===`personal-error-card:${error.id}`);
      return <article key={error.id} className={`${error.resolved ? "resolved " : ""}${classification}${(error.highConfidenceWrongCount??0)>0?" high-confidence-wrong":""}${error.sensitiveInPrint?" sensitive-in-print":""}`.trim()}>
        <span className="error-type"><AlertTriangle size={16}/>{error.type}<b className={`pattern-${classification}`}>{pattern.title}</b>{(error.highConfidenceWrongCount??0)>0&&<em>ثقة عالية + خطأ</em>}{error.learnerContextTags?.includes("knows-rule-under-time-pressure")&&<em className="time-pressure-tag"><Clock3 size={12}/> أفهمها دون ضغط</em>}</span>
        <div className="error-lines" lang="de" dir="ltr"><del>{error.wrong}</del>{error.resolved || waiting || isRevealed ? <strong>{error.correct}</strong> : <span className="hidden-correction">التصحيح مخفي حتى المحاولة</span>}</div>
        <p>{error.explanationAr}</p>
        <div className="error-pattern-explanation"><strong>{pattern.title}</strong><p>{pattern.detail}</p><small>السياسة `error-pattern-classification-v1` · التكرار {error.occurrences} · فشل العلاج {error.failedRepairCount??0} · أخطاء بثقة عالية {error.highConfidenceWrongCount??0}</small></div>
        {waiting && <div className="repair-pending"><CalendarCheck size={17}/><div><strong>علاج أولي ناجح — ينتظر اختبارًا مؤجلًا</strong><p>سيُخفى التصحيح من جديد في {new Date(error.nextReviewAt!).toLocaleDateString("ar-TN")}؛ لا يُعتبر الخطأ مستقرًا قبل نجاح الاسترجاع الثاني.</p></div></div>}
        {!error.resolved && !waiting && <form className="error-remediation" onSubmit={(event) => { event.preventDefault(); checkCorrection(error); }}>
          <label><span>{due?"اختبار مؤجل: اكتب التصحيح من الذاكرة":"العلاج الأول: اكتب التصحيح من الذاكرة"}</span><input lang="de" dir="ltr" value={answers[error.id] ?? ""} onChange={(event) => { setAnswers((current) => ({ ...current, [error.id]: event.target.value })); setFeedback((current) => { const next = { ...current }; delete next[error.id]; return next; }); }} aria-label={`تصحيح ${error.wrong}`} placeholder="اكتب الجواب الصحيح…" /></label>
          <div><button className="primary-button" disabled={!answers[error.id]?.trim()} type="submit"><Check size={14}/> تحقق من العلاج</button>{!isRevealed && <button className="secondary-button" type="button" onClick={() => reveal(error.id)}><Eye size={14}/> اكشف التصحيح</button>}</div>
          {result && <StatusAnnouncement message={result === "correct" ? (due?"صحيح بعد التأخير — تأكد العلاج وأُغلق الخطأ.":"صحيح — جُدول اختبار مؤجل قبل إغلاق الخطأ.") : (error.failedRepairCount??0)+1>=2?"لم ينجح العلاج مرتين؛ افتح شرح القاعدة المرتبط قبل محاولة جديدة.":"ليس مطابقًا بعد. راجع الترتيب والكتابة ثم حاول ثانية."} channel={`error-repair-${error.id}`} className={result === "correct" ? "remediation-feedback correct" : "remediation-feedback wrong"} icon={result === "correct"?<Check size={14}/>:<X size={14}/>}/>}
        </form>}
        {prerequisite && !waiting && !error.resolved && <div className="error-prerequisite"><BookOpenCheck size={18}/><div><strong>ارجع إلى المتطلب قبل إعادة العلاج</strong><p>{prerequisite.reasonAr}</p></div><Link href={prerequisite.href} onClick={()=>openPrerequisite(error)}>افتح شرح القاعدة</Link></div>}
        {personalCard && <div className="personal-error-srs"><BrainCircuit size={17}/><p><strong>دخلت بطاقة علاج شخصية إلى SRS.</strong><span>تظهر مرة واحدة بعد تأكيد العلاج المؤجل، ولا تضيف mastery عند مراجعتها.</span></p><Link href="/review">افتح المراجعة</Link></div>}
        <div className="error-learner-metadata"><button type="button" aria-pressed={error.learnerContextTags?.includes("knows-rule-under-time-pressure")??false} onClick={()=>toggleTimePressureTag(error)}><Clock3 size={14}/><span><b>أفهم القاعدة لكن لا أطبقها تحت الوقت</b><small>وسم تختاره أنت لتخطيط العلاج، وليس تشخيصًا أو دليل إتقان.</small></span></button><button type="button" aria-pressed={Boolean(error.sensitiveInPrint)} onClick={()=>toggleSensitivePrint(error)}>{error.sensitiveInPrint?<EyeOff size={14}/>:<Printer size={14}/>}<span><b>{error.sensitiveInPrint?"مخفي من التقارير المطبوعة":"إخفاء هذا الخطأ من الطباعة"}</b><small>يبقى داخل التطبيق وملف DWNB؛ الإخفاء يخص الطباعة فقط.</small></span></button></div>
        <footer><small>تكرر {error.occurrences} مرة · آخر ظهور {new Date(error.lastSeenAt).toLocaleDateString("ar-TN")}</small>{error.resolved && <button onClick={() => reopen(error.id)}><RotateCcw size={14}/> إعادة فتح للتدريب</button>}</footer>
      </article>;
    })}</div> : <div className="empty-errors"><Check size={25}/><h3>لا توجد أخطاء شخصية مسجلة بعد</h3><p>أكمل اختبار تحديد المستوى أو التدريبات حتى يستطيع المدرب اكتشاف أنماطك.</p></div>}
    <section className="common-traps"><div className="section-heading"><div><span>قاعدة معرفة</span><h2>مصائد شائعة للناطق بالعربية</h2></div><strong><Sparkles size={14}/> للاستباق لا للحكم عليك</strong></div><div className="trap-grid">{commonTraps.map((trap)=><article key={trap.title}><small>{trap.type}</small><h3>{trap.title}</h3><strong dir="ltr" lang="de">{trap.de}</strong><p>{trap.ar}</p></article>)}</div></section>
  </div>;
}
