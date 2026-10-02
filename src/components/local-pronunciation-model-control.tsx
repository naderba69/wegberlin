"use client";

import { useEffect, useState } from "react";
import { AudioLines, CheckCircle2, Download, Gauge, HardDrive, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { LOCAL_PRONUNCIATION_MODEL_POLICY } from "@/config/local-pronunciation-model-registry";
import { deleteLocalPronunciationModel, detectLocalPronunciationCapability, getLocalPronunciationSourceDecision, inspectLocalPronunciationModel, installLocalPronunciationModel, type LocalPronunciationCapability, type LocalPronunciationModelMetadata, type LocalPronunciationProgress } from "@/core/pronunciation/local-model";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

const capabilityLabel:Record<LocalPronunciationCapability["status"],string>={supported:"مدعوم مبدئيًا",unavailable:"غير متاح","insufficient-memory":"ذاكرة غير كافية","insufficient-storage":"مساحة غير كافية"};
const byteLabel=(bytes?:number)=>typeof bytes==="number"&&bytes>0?`${(bytes/1024/1024).toFixed(1)} MB`:"يحدده المتصفح";

export function LocalPronunciationModelControl(){
  const{state}=useLearning();const lowDataMode=state.dataUsagePreferences.lowDataMode;
  const[capability,setCapability]=useState<LocalPronunciationCapability|null>(null);const[metadata,setMetadata]=useState<LocalPronunciationModelMetadata|null>(null);const[confirmed,setConfirmed]=useState(false);const[busy,setBusy]=useState(false);const[progress,setProgress]=useState<LocalPronunciationProgress|null>(null);const[message,setMessage]=useState("");
  const sourceDecision=getLocalPronunciationSourceDecision();
  useEffect(()=>{let active=true;void Promise.all([detectLocalPronunciationCapability(),inspectLocalPronunciationModel()]).then(([nextCapability,nextMetadata])=>{if(active){setCapability(nextCapability);setMetadata(nextMetadata)}}).catch(()=>{if(active)setCapability({status:"unavailable",reasonAr:"تعذر فحص WebGPU أو مساحة التخزين."})});return()=>{active=false}},[]);
  async function install(){if(!confirmed||capability?.status!=="supported"||lowDataMode)return;setBusy(true);setMessage("");try{if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);const installed=await installLocalPronunciationModel({onProgress:setProgress});setMetadata(installed);setProgress(null);setMessage("اكتمل تنزيل حزمة مطابقة الكلمات. أصبح التسجيل والتحليل محليين، ولا يُرسل الصوت إلى Gemini.")}catch(error){setProgress(null);setMessage(error instanceof Error?error.message:"فشل تنزيل حزمة مطابقة الكلمات.")}finally{setBusy(false)}}
  async function remove(){if(!window.confirm("حذف حزمة مطابقة الكلمات المحلية؟ لن تُحذف تسجيلاتك أو تقدمك."))return;setBusy(true);try{await deleteLocalPronunciationModel();setMetadata(null);setConfirmed(false);setProgress(null);setMessage("حُذفت حزمة مطابقة الكلمات. بقي الاستماع والتسجيل والمقارنة الذاتية متاحًا.")}catch(error){setMessage(error instanceof Error?error.message:"تعذر حذف الحزمة المحلية.")}finally{setBusy(false)}}
  const percent=progress?.percent??0;const storedBytes=metadata?.originUsageDeltaBytes||metadata?.headerByteSize;
  return <section id="local-pronunciation-model" className="settings-card local-pronunciation-model-card" data-local-pronunciation-model={LOCAL_PRONUNCIATION_MODEL_POLICY}>
    <div className="settings-title"><span><AudioLines size={20}/></span><div><h2>حزمة مطابقة الكلمات الألمانية</h2><p>نموذج Whisper صغير يعمل داخل Web Worker على جهازك بعد تنزيل صريح مرة واحدة.</p></div></div>
    <div className="webgpu-model-status"><span className={metadata?"ready":capability?.status==="supported"?"supported":"unavailable"}>{metadata?<CheckCircle2 size={18}/>:capability?.status==="supported"?<Gauge size={18}/>:<TriangleAlert size={18}/>}</span><div><small>حالة المدرب المحلي</small><strong>{metadata?"الحزمة مثبتة":capability?capabilityLabel[capability.status]:"جاري الفحص…"}</strong><p>{metadata?`Whisper tiny · ${metadata.dtype} · ${metadata.cacheEntries} ملفات Cache`:capability?.reasonAr??"نفحص WebGPU والذاكرة والمساحة دون تنزيل."}</p></div></div>
    <div className="webgpu-model-facts">
      <div><HardDrive size={16}/><span><small>الحجم المحافظ</small><strong>نحو 70–90 MB</strong><em>قد تختلف مساحة Cache الفعلية حسب المتصفح وملفات ONNX المطلوبة.</em></span></div>
      <div><ShieldCheck size={16}/><span><small>المصدر والترخيص</small><strong>Apache-2.0 · حتى {sourceDecision.dueAt}</strong><em>إصدار ONNX مثبت، والتنزيل الجديد يُحظر عند تقادم التحقق.</em></span></div>
      <div><AudioLines size={16}/><span><small>ما الذي يفعله؟</small><strong>تعرف ألماني ومطابقة كلمات</strong><em>لا يحلل الفونيمات ولا يمنح درجة لهجة أو طلاقة أو نتيجة امتحان.</em></span></div>
    </div>
    {lowDataMode&&!metadata&&<p className="webgpu-boundary">وضع البيانات المنخفضة يمنع تنزيل هذه الحزمة حتى توقفه صراحة.</p>}
    {!metadata&&<label className="webgpu-download-consent"><input type="checkbox" checked={confirmed} disabled={busy||capability?.status!=="supported"||!sourceDecision.allowed||lowDataMode} onChange={(event)=>setConfirmed(event.target.checked)}/><span><b>أوافق على تنزيل حزمة الصوت مرة واحدة</b><small>يطلب المتصفح أوزانًا من Hugging Face ثم يحفظها محليًا. لا يُرسل اسمك أو تقدمك أو تسجيلاتك.</small></span></label>}
    {progress&&<div className="webgpu-progress"><div><span>{progress.phase==="runtime"?"تثبيت Runtime المحلي":progress.phase==="initializing"?"تهيئة النموذج":`تنزيل ${progress.file??"ملفات Whisper"}`}</span><strong>{percent}%</strong></div><i role="progressbar" aria-label="تقدم تنزيل حزمة مطابقة الكلمات" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><b style={{width:`${percent}%`}}/></i>{progress.totalBytes?<small>{byteLabel(progress.loadedBytes)} / {byteLabel(progress.totalBytes)}</small>:null}</div>}
    {metadata&&<div className="webgpu-installed-size"><Download size={15}/><span><small>المساحة بعد التثبيت</small><strong>{byteLabel(storedBytes)}</strong></span></div>}
    {message&&<StatusAnnouncement message={message} channel="local-pronunciation-model" className="compact" icon={<ShieldCheck size={15}/>}/>} 
    <div className="settings-actions">{!metadata?<button className="primary-button" disabled={busy||!confirmed||capability?.status!=="supported"||!sourceDecision.allowed||lowDataMode} onClick={()=>void install()}><Download size={16}/>{busy?"جاري التنزيل والتهيئة…":"نزّل حزمة مطابقة الكلمات"}</button>:<button className="secondary-button" disabled={busy} onClick={()=>void remove()}><Trash2 size={16}/> حذف حزمة مطابقة الكلمات</button>}<a className="secondary-button" href="https://huggingface.co/onnx-community/whisper-tiny" target="_blank" rel="noreferrer">بطاقة النموذج</a></div>
    <p className="webgpu-boundary">المطابقة تقول ما إذا استطاع ASR سماع الكلمات المتوقعة. فشل كلمة قد يكون من الضوضاء أو الميكروفون، وليس حكمًا قاطعًا على النطق. لا تنزيل تلقائي ولا إرسال صوت.</p>
  </section>;
}
