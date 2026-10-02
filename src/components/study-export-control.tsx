"use client";

import { useMemo,useState } from "react";
import { useDeviceValue, useDeviceEpoch } from "./device-value";
import { CalendarDays,Download,FileDown,FileSpreadsheet,Printer,ShieldCheck } from "lucide-react";
import { buildAnkiTsv,buildStudyExportSnapshot,buildWeeklyPlanIcs,buildWeeklyReportPdf,STUDY_EXPORT_POLICY,type WeeklyReportSections } from "@/core/exports/study-exports";
import { useLearning } from "./learning-provider";

function downloadBlob(content:BlobPart,mime:string,filename:string){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();setTimeout(()=>{URL.revokeObjectURL(url);anchor.remove()},1000)}

const EPOCH=new Date(0);
const epochOr=(ms:number)=>ms?new Date(ms):EPOCH;

export function StudyExportControl(){
const {state}=useLearning();
const deviceNow=useDeviceEpoch(0);
const now=useMemo(()=>epochOr(deviceNow),[deviceNow]);
const snapshot=buildStudyExportSnapshot(state,now);
const [sections,setSections]=useState<WeeklyReportSections>({plan:true,evidence:true,profileName:false});
const [message,setMessage]=useState("");
const [busy,setBusy]=useState(false);
const timeZone=useDeviceValue(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC","UTC");
 function toggle(key:keyof WeeklyReportSections){setSections(current=>({...current,[key]:!current[key]}));setMessage("")}
 function exportIcs(){try{const file=buildWeeklyPlanIcs(state,now,timeZone);downloadBlob(file.content,file.mime,file.filename);setMessage(`تم تنزيل ${file.eventCount} أحداث ICS محلية بتوقيت ${file.timeZone}.`)}catch(error){setMessage(error instanceof Error?error.message:"تعذر تصدير التقويم.")}}
 function exportAnki(){try{const file=buildAnkiTsv(state,now);downloadBlob(file.content,file.mime,file.filename);setMessage(`تم تنزيل ${file.rowCount} بطاقة TSV بعقد أعمدة ثابت.`)}catch(error){setMessage(error instanceof Error?error.message:"تعذر تصدير البطاقات.")}}
 async function exportPdf(){setBusy(true);try{const file=await buildWeeklyReportPdf(state,sections,now);downloadBlob(file.bytes,file.mime,file.filename);setMessage("تم إنشاء PDF محلي من معاينة التقرير. النص داخله صورة للطباعة؛ استخدم المعاينة الدلالية للقراءة المساعدة.")}catch(error){setMessage(error instanceof Error?error.message:"تعذر إنشاء PDF.")}finally{setBusy(false)}}
 function printPreview(){if(!snapshot.ready||(!sections.plan&&!sections.evidence)){setMessage(!snapshot.ready?"أكمل التهيئة قبل طباعة التقرير.":"اختر قسم الخطة أو الأدلة على الأقل.");return}window.print();setMessage("فُتحت طباعة المعاينة المحلية؛ لا يُرسل التقرير إلى خادم.")}
 return <section className="settings-card study-export-card" data-export-policy={STUDY_EXPORT_POLICY}>
  <div className="settings-title"><span><FileDown size={20}/></span><div><h2>صادرات الدراسة المحلية</h2><p>تقويم ICS، تقرير أسبوعي قابل للطباعة/PDF، وبطاقات Anki TSV دون خادم.</p></div></div>
  <div className="study-export-options"><label><input type="checkbox" checked={sections.plan} onChange={()=>toggle("plan")}/><span><b>الخطة الأسبوعية</b><small>مواعيد وكتل الدراسة فقط</small></span></label><label><input type="checkbox" checked={sections.evidence} onChange={()=>toggle("evidence")}/><span><b>ملخص الأدلة</b><small>عدادات دون نصوصك الحرة</small></span></label><label><input type="checkbox" checked={sections.profileName} onChange={()=>toggle("profileName")}/><span><b>تضمين الاسم</b><small>متوقف افتراضيًا للخصوصية</small></span></label></div>
  <article className="study-export-preview study-export-print" aria-label="معاينة التقرير الأسبوعي قبل التنزيل"><header><div><small>معاينة قبل التنزيل</small><h3>الأسبوع {snapshot.plan.weekStart} — {snapshot.plan.weekEnd}</h3></div><span>{sections.profileName?(snapshot.profileName||"—"):"الاسم غير مضمّن"}</span></header>{sections.evidence&&<div className="study-export-summary"><span><b>{snapshot.plan.plannedMinutes}</b> دقيقة مخططة</span><span><b>{snapshot.actualMinutes}</b> دقيقة فعلية</span><span><b>{snapshot.evidenceCount}</b> أدلة أسبوعية</span><span><b>{snapshot.cardCount}</b> بطاقات مؤهلة</span></div>}{sections.plan&&<div className="study-export-days">{snapshot.plan.days.map(day=><span key={day.date}><b>{day.weekdayAr}</b><small>{day.date}</small><em>{day.budgetMinutes?`${day.budgetMinutes} د`:"راحة"}</em></span>)}</div>}<footer>لا تسجيلات · لا API keys · لا كتابة أو محادثة حرة · DWNB وحده قابل للاستعادة</footer></article>
  <div className="study-export-actions"><button className="secondary-button" disabled={!snapshot.ready} onClick={exportIcs}><CalendarDays size={16}/> تنزيل ICS</button><button className="secondary-button" disabled={!snapshot.ready||(!sections.plan&&!sections.evidence)} onClick={printPreview}><Printer size={16}/> طباعة المعاينة</button><button className="primary-button" disabled={!snapshot.ready||busy||(!sections.plan&&!sections.evidence)} onClick={()=>void exportPdf()}><Download size={16}/>{busy?"إنشاء PDF…":"تنزيل PDF"}</button><button className="secondary-button" disabled={snapshot.cardCount===0} onClick={exportAnki}><FileSpreadsheet size={16}/> Anki TSV ({snapshot.cardCount})</button></div>
  <div className="study-export-boundary"><ShieldCheck size={16}/><p><strong>خصوصية افتراضية:</strong> الاسم اختياري، ولا تدخل الوسائط أو مفاتيح AI أو النصوص الحرة. TSV للدراسة فقط ولا يستعيد التقدم؛ استخدم `.dwnb` للاستعادة.</p></div>
  <p className="study-export-status" role="status" aria-live="polite">{message||(!snapshot.ready?"أكمل التهيئة لتفعيل الخطة والتقرير. بطاقات Anki تتطلب درسًا مكتملًا أو خطأ مؤكدًا.":"")}</p>
 </section>
}
