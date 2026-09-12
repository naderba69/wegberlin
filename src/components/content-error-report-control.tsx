"use client";

import { useState } from "react";
import { Bug,Clipboard,Download,FileWarning,Save,ShieldCheck } from "lucide-react";
import type { ContentErrorCategory,ContentErrorReport,ContentNoteKind } from "@/types/learning";
import { buildContentErrorReportDraft,contentErrorCategoryLabels,contentErrorReportExport,contentErrorReportFileName,CONTENT_ERROR_REPORT_POLICY,MAX_ERROR_DESCRIPTION_LENGTH,MAX_ERROR_SUGGESTION_LENGTH,saveContentErrorReport,type ContentErrorReportDraft } from "@/core/reports/content-error-report";
import { getContentReference } from "@/core/notes/content-notes";
import { useLearning } from "./learning-provider";

function download(report:ContentErrorReport){const url=URL.createObjectURL(new Blob([contentErrorReportExport(report)],{type:"application/json;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=contentErrorReportFileName(report);anchor.click();setTimeout(()=>URL.revokeObjectURL(url),500)}

export function ContentErrorReportControl({kind,contentId}:{kind:ContentNoteKind;contentId:string}){
  const{update}=useLearning();
  const reference=getContentReference(kind,contentId);
  const[category,setCategory]=useState<ContentErrorCategory>("german");
  const[description,setDescription]=useState("");
  const[suggestion,setSuggestion]=useState("");
  const[preview,setPreview]=useState<ContentErrorReportDraft|null>(null);
  const[saved,setSaved]=useState<ContentErrorReport|null>(null);
  const[message,setMessage]=useState("");
  function makePreview(){try{setPreview(buildContentErrorReportDraft({kind,contentId,category,description,suggestedCorrection:suggestion}));setSaved(null);setMessage("هذه معاينة محلية فقط؛ لم يُرسل البلاغ.")}catch(error){setPreview(null);setMessage(error instanceof Error?error.message:"تعذر إنشاء المعاينة.")}}
  function save(){if(!preview)return;const{report}=saveContentErrorReport([],preview);update((current)=>({...current,contentErrorReports:[...current.contentErrorReports,report]}));setSaved(report);setMessage("حُفظ البلاغ محليًا بحالة غير مُرسل. انسخه أو نزله وأرسله يدويًا إذا أردت.")}
  async function copy(){if(!saved)return;try{await navigator.clipboard.writeText(contentErrorReportExport(saved));setMessage("نُسخت حمولة البلاغ الآمنة. لم تُرسل عبر الشبكة.")}catch{setMessage("تعذر النسخ في هذا المتصفح؛ استخدم تنزيل JSON.")}}
  return <details className="content-error-report-control" data-error-report-policy={CONTENT_ERROR_REPORT_POLICY}>
    <summary><Bug size={15}/><span><strong>بلّغ عن خطأ في هذا المحتوى</strong><small lang="de" dir="ltr">Fehler lokal vorbereiten</small></span></summary>
    <div><p>يرفق النموذج العنوان والمسار ومعرف المحتوى وإصدار التطبيق فقط. لا يرفق Answer key أو تقدمك أو مفاتيحك أو نص إنتاج آخر.</p><label>نوع المشكلة<select value={category} onChange={(event)=>{setCategory(event.target.value as ContentErrorCategory);setPreview(null)}}>{Object.entries(contentErrorCategoryLabels).map(([value,label])=><option key={value} value={value}>{label.de} · {label.ar}</option>)}</select></label><label>وصف المشكلة<textarea maxLength={MAX_ERROR_DESCRIPTION_LENGTH} value={description} onChange={(event)=>{setDescription(event.target.value);setPreview(null)}} placeholder="صف موضع الخطأ وما الذي تراه…"/></label><label>التصحيح المقترح — اختياري<textarea maxLength={MAX_ERROR_SUGGESTION_LENGTH} value={suggestion} onChange={(event)=>{setSuggestion(event.target.value);setPreview(null)}} placeholder="اكتب اقتراحك دون بيانات شخصية…"/></label><button className="secondary-button" onClick={makePreview}><FileWarning size={14}/> معاينة البلاغ دون إرسال</button>
      {preview&&<section className="content-error-preview"><header><ShieldCheck size={17}/><div><strong>{preview.titleAr}</strong><small lang="de" dir="ltr">{preview.titleDe}</small></div></header><dl><div><dt>المحتوى</dt><dd dir="ltr" data-bidi-scope="technical">{preview.kind}:{preview.contentId}</dd></div><div><dt>المسار</dt><dd dir="ltr" data-bidi-scope="technical">{preview.route}</dd></div><div><dt>الإصدار</dt><dd dir="ltr" data-bidi-scope="technical">{preview.appVersion}</dd></div><div><dt>الحالة</dt><dd>مسودة محلية غير مرسلة</dd></div></dl><blockquote>{preview.description}</blockquote>{preview.suggestedCorrection&&<p><b>اقتراحك:</b> {preview.suggestedCorrection}</p>}<button className="primary-button" onClick={save}><Save size={14}/> حفظ البلاغ محليًا</button></section>}
      {saved&&<div className="content-error-export"><button onClick={()=>void copy()}><Clipboard size={14}/> نسخ JSON الآمن</button><button onClick={()=>download(saved)}><Download size={14}/> تنزيل JSON</button></div>}{message&&<p role="status" aria-live="polite">{message}</p>}<small>السياق الحالي: <span lang="de" dir="ltr">{reference.titleDe}</span></small></div>
  </details>;
}
