"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Box, CheckCircle2, CircleAlert, FileCheck2, RefreshCcw } from "lucide-react";
import { buildStaticDeliveryHealth } from "@/core/governance/delivery-health";

type Probe={complete:number;missing:number;failed:number;details:string[];checkedAt?:string};
export function DeliveryHealthDashboard(){
  const compiled=useMemo(()=>buildStaticDeliveryHealth(),[]);
  const[runtime,setRuntime]=useState<Probe>({complete:0,missing:3,failed:0,details:["لم يبدأ فحص المتصفح."]});
  const[assets,setAssets]=useState<Probe>({complete:compiled.assets.complete,missing:compiled.assets.missing,failed:compiled.assets.failed,details:[]});
  const[busy,setBusy]=useState(false);
  const probe=useCallback(async()=>{
    setBusy(true);const runtimeDetails:string[]=[];let runtimeComplete=0,runtimeFailed=0;
    for(const[name,ok]of[["IndexedDB",typeof indexedDB!=="undefined"],["Cache Storage",typeof caches!=="undefined"],["Service Worker","serviceWorker"in navigator]]as const){if(ok){runtimeComplete++;runtimeDetails.push(`${name}: متاح`)}else{runtimeFailed++;runtimeDetails.push(`${name}: غير متاح`)}}
    const paths=["/audio/library/manifest.json","/audio/lessons/manifest.json","/audio/exams/manifest.json","/audio/library/lib-l-a1-01.mp3","/audio/lessons/a1-01.mp3",compiled.assets.complete?"/audio/exams/goethe-h1-clip-1.mp3":"/missing"];
    let assetComplete=0,assetFailed=0;const assetDetails:string[]=[];
    for(const path of paths)try{const response=await fetch(path,{method:"HEAD",cache:"no-store"});if(response.ok){assetComplete++;assetDetails.push(`${path}: ${response.status}`)}else{assetFailed++;assetDetails.push(`${path}: HTTP ${response.status}`)}}catch{assetFailed++;assetDetails.push(`${path}: فشل الطلب`)}
    setRuntime({complete:runtimeComplete,missing:3-runtimeComplete,failed:runtimeFailed,details:runtimeDetails,checkedAt:new Date().toISOString()});
    setAssets({complete:compiled.assets.complete,missing:compiled.assets.missing,failed:compiled.assets.failed+assetFailed,details:[`فحوص HTTP الحية: ${assetComplete}/${paths.length}`,...assetDetails],checkedAt:new Date().toISOString()});setBusy(false);
  },[compiled]);
  useEffect(()=>{const timer=window.setTimeout(()=>void probe(),0);return()=>window.clearTimeout(timer)},[probe]);
  const totalFailed=compiled.content.failed+assets.failed+runtime.failed,totalMissing=compiled.content.missing+assets.missing+runtime.missing;
  return <div className="wide-page delivery-health-page" data-delivery-health-policy={compiled.policyVersion}>
    <header className="page-heading"><div><span className="eyebrow"><Activity size={15}/> حالة تسليم موحدة</span><h1>المكتمل والناقص <em>والفاشل</em></h1><p>تجمع هذه اللوحة عقود المحتوى والأصول المبنية وقدرات المتصفح الحالية. لا تستبدل CI أو المراجعة البشرية أو المراقبة الخارجية.</p></div><button className="secondary-button" disabled={busy} onClick={()=>void probe()}><RefreshCcw size={15}/> {busy?"جارٍ الفحص":"أعد الفحص"}</button></header>
    <section className={totalFailed?"delivery-health-summary failed":"delivery-health-summary ok"}>{totalFailed?<CircleAlert size={22}/>:<CheckCircle2 size={22}/>}<div><strong>{totalFailed?`${totalFailed} فشل ظاهر الآن`:"لا فشل ظاهر في الفحص الحالي"}</strong><p>{totalMissing} ناقص · الفحص الحي لا يثبت عمل كل جهاز أو كل مسار منشور.</p></div></section>
    <div className="delivery-health-grid"><article><FileCheck2/><div><small>المحتوى المنشور</small><strong>{compiled.content.complete}/{compiled.content.expected}</strong><p>{compiled.content.missing} ناقص · {compiled.content.failed} فاشل</p></div></article><article><Box/><div><small>MP3 في السجلات</small><strong>{assets.complete}/{compiled.assets.expected}</strong><p>{assets.missing} ناقص · {assets.failed} فشل سجل/HTTP</p></div></article><article><Activity/><div><small>قدرات Runtime</small><strong>{runtime.complete}/3</strong><p>{runtime.missing} ناقص · {runtime.failed} فاشل</p></div></article></div>
    <section className="delivery-health-details"><h2>التفاصيل القابلة للتدقيق</h2>{compiled.issues.map((item)=><p key={item}>{item}</p>)}{assets.details.map((item)=><p key={item} data-bidi-scope="technical" dir="ltr">{item}</p>)}{runtime.details.map((item)=><p key={item}>{item}</p>)}</section>
  </div>;
}
