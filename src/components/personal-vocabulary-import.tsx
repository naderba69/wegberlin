"use client";

import { useRef,useState } from "react";
import { Download,FileCheck2,FileUp,Languages,Trash2,TriangleAlert } from "lucide-react";
import { commitPersonalVocabulary,deletePersonalVocabularyItem,MAX_PERSONAL_VOCABULARY_FILE_BYTES,MAX_PERSONAL_VOCABULARY_ROWS,PERSONAL_VOCABULARY_HEADER,PERSONAL_VOCABULARY_POLICY,personalVocabularySampleTsv,previewPersonalVocabularyFile,type PersonalVocabularyPreview } from "@/core/vocabulary/personal-import";
import { useLearning } from "./learning-provider";

function downloadText(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const anchor=document.createElement("a");anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),500)}

export function PersonalVocabularyImport(){
  const{state,update}=useLearning();
  const inputRef=useRef<HTMLInputElement>(null);
  const[preview,setPreview]=useState<PersonalVocabularyPreview|null>(null);
  const[message,setMessage]=useState("");
  async function choose(file?:File){if(!file)return;try{setPreview(await previewPersonalVocabularyFile(file,state.personalVocabulary));setMessage("تم فحص الملف محليًا. راجع الصفوف المقبولة والمرفوضة قبل الاستيراد.")}catch(error){setPreview(null);setMessage(error instanceof Error?error.message:"تعذر فحص ملف المفردات.")}}
  function commit(){if(!preview?.accepted.length)return;update((current)=>({...current,personalVocabulary:commitPersonalVocabulary(current.personalVocabulary,preview)}));setMessage(`استُوردت ${preview.accepted.length} مفردات شخصية دون إضافتها إلى SRS أو الإتقان.`);setPreview(null)}
  function remove(id:string){update((current)=>({...current,personalVocabulary:deletePersonalVocabularyItem(current.personalVocabulary,id)}))}
  function clear(){if(!window.confirm("حذف جميع المفردات الشخصية المستوردة؟"))return;update((current)=>({...current,personalVocabulary:[]}));setPreview(null);setMessage("حُذفت جميع المفردات الشخصية. لم يتغير المنهج أو الإتقان.")}
  return <section className="settings-card personal-vocabulary-import" data-vocabulary-import-policy={PERSONAL_VOCABULARY_POLICY}>
    <div className="settings-title"><span><Languages size={20}/></span><div><h2>استيراد مفردات شخصية</h2><p>TSV محلي Preview-first؛ منفصل عن المنهج وSRS والإتقان.</p></div></div>
    <div className="vocabulary-import-contract"><code dir="ltr" data-bidi-scope="technical">{PERSONAL_VOCABULARY_HEADER}</code><p>UTF-8 · أربعة أعمدة · حتى {MAX_PERSONAL_VOCABULARY_ROWS} صف و{Math.round(MAX_PERSONAL_VOCABULARY_FILE_BYTES/1024)} KB. Tags مفصولة بفواصل.</p></div>
    <div className="settings-actions"><button className="primary-button" onClick={()=>inputRef.current?.click()}><FileUp size={16}/> اختر ملف TSV للفحص</button><button className="secondary-button" onClick={()=>downloadText("dwnb-personal-vocabulary-sample.tsv",personalVocabularySampleTsv(),"text/tab-separated-values;charset=utf-8")}><Download size={16}/> تنزيل نموذج</button><input ref={inputRef} hidden type="file" accept=".tsv,text/tab-separated-values,text/plain" onChange={(event)=>void choose(event.target.files?.[0])}/></div>
    {message&&<p className="personal-vocabulary-status" role="status">{message}</p>}
    {preview&&<div className="vocabulary-import-preview"><header><span><FileCheck2 size={18}/></span><div><strong>معاينة قبل الاستيراد</strong><small>{preview.fileName} · {preview.totalRows} صفوف</small></div><b>{preview.accepted.length} مقبولة</b></header><div className="vocabulary-preview-counts"><span>مرفوضة <b>{preview.rejectedRows}</b></span><span>مكررة <b>{preview.duplicateRows}</b></span><span>تحذيرات تنظيف <b>{preview.issues.filter((issue)=>issue.severity==="warning").length}</b></span></div>{preview.accepted.length>0&&<div className="vocabulary-preview-rows">{preview.accepted.slice(0,10).map((item)=><article key={item.id}><strong lang="de" dir="ltr">{item.german}</strong><span>{item.arabic}</span>{item.exampleDe&&<small lang="de" dir="ltr">{item.exampleDe}</small>}</article>)}</div>}{preview.issues.length>0&&<details><summary><TriangleAlert size={14}/> أسباب الرفض والتنظيف</summary>{preview.issues.slice(0,20).map((issue,index)=><p key={`${issue.row}-${index}`}>صف {issue.row}: {issue.messageAr}</p>)}</details>}<footer><button className="secondary-button" onClick={()=>setPreview(null)}>إلغاء</button><button className="primary-button" disabled={!preview.accepted.length} onClick={commit}>تأكيد استيراد المقبول فقط</button></footer></div>}
    <div className="personal-vocabulary-list"><header><strong>القائمة الشخصية</strong><span>{state.personalVocabulary.length} عنصرًا</span></header>{state.personalVocabulary.length?<div>{state.personalVocabulary.map((item)=><article key={item.id}><div><strong lang="de" dir="ltr">{item.german}</strong><span>{item.arabic}</span>{item.exampleDe&&<small lang="de" dir="ltr">{item.exampleDe}</small>}</div><button aria-label={`حذف مفردة ${item.german}`} onClick={()=>remove(item.id)}><Trash2 size={14}/></button></article>)}</div>:<p>لا توجد مفردات مستوردة. الملف لا يضيف بطاقات مراجعة تلقائيًا.</p>}</div>
    <footer className="personal-vocabulary-boundary"><p>لا تصبح المفردة دليلًا أو بطاقة SRS أو جزءًا من المحتوى المنشور بمجرد الاستيراد.</p><button className="secondary-button" disabled={!state.personalVocabulary.length} onClick={clear}><Trash2 size={14}/> حذف القائمة الشخصية</button></footer>
  </section>;
}
