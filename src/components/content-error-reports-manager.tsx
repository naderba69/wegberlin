"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug,Clipboard,Download,Trash2 } from "lucide-react";
import { contentErrorCategoryLabels,contentErrorReportExport,contentErrorReportFileName,CONTENT_ERROR_REPORT_POLICY,deleteContentErrorReport } from "@/core/reports/content-error-report";
import type { ContentErrorReport } from "@/types/learning";
import { useLearning } from "./learning-provider";

function download(report:ContentErrorReport){const url=URL.createObjectURL(new Blob([contentErrorReportExport(report)],{type:"application/json;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=contentErrorReportFileName(report);anchor.click();setTimeout(()=>URL.revokeObjectURL(url),500)}

export function ContentErrorReportsManager(){
  const{state,update}=useLearning();
  const reports=[...state.contentErrorReports].reverse();
  const[latestMessage,setLatestMessage]=useState("");
  async function copy(report:ContentErrorReport){try{await navigator.clipboard.writeText(contentErrorReportExport(report));setLatestMessage("نُسخ البلاغ محليًا؛ لم يُرسل.")}catch{setLatestMessage("تعذر النسخ؛ استخدم تنزيل JSON.")}}
  function remove(id:string){update((current)=>({...current,contentErrorReports:deleteContentErrorReport(current.contentErrorReports,id)}))}
  function clear(){if(!window.confirm("حذف جميع مسودات بلاغات الأخطاء المحلية؟"))return;update((current)=>({...current,contentErrorReports:[]}));setLatestMessage("حُذفت جميع مسودات البلاغات المحلية.")}
  return <section className="settings-card content-error-reports-manager" data-error-report-manager={CONTENT_ERROR_REPORT_POLICY}>
    <div className="settings-title"><span><Bug size={20}/></span><div><h2>مسودات بلاغات المحتوى</h2><p>{reports.length} محلية غير مرسلة · النسخ أو التنزيل للإرسال اليدوي فقط.</p></div></div>
    {reports.length?<div>{reports.map((report)=><article key={report.id}><header><span>{contentErrorCategoryLabels[report.category].ar}</span><b>غير مُرسل</b></header><Link href={report.route}><strong lang="de" dir="ltr">{report.titleDe}</strong><small>{report.titleAr}</small></Link><p>{report.description}</p>{report.suggestedCorrection&&<blockquote>{report.suggestedCorrection}</blockquote>}<footer><button onClick={()=>void copy(report)}><Clipboard size={14}/> نسخ</button><button onClick={()=>download(report)}><Download size={14}/> تنزيل</button><button className="delete" aria-label={`حذف بلاغ ${report.titleAr}`} onClick={()=>remove(report.id)}><Trash2 size={14}/> حذف</button></footer></article>)}</div>:<p className="content-error-empty">لا توجد مسودة بلاغ. افتح أداة البلاغ داخل درس أو مادة مكتبة، وراجع المعاينة قبل الحفظ.</p>}
    {latestMessage&&<p role="status">{latestMessage}</p>}<footer><small>لا توجد مزامنة أو إرسال تلقائي إلى GitHub أو البريد.</small><button className="secondary-button" disabled={!reports.length} onClick={clear}><Trash2 size={14}/> حذف جميع مسودات البلاغات</button></footer>
  </section>;
}
