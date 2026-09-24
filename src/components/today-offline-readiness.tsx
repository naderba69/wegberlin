"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCcw, WifiOff } from "lucide-react";
import { checkTodayOfflineReadiness, type TodayOfflineReadinessResult, type TodayOfflineRequirements } from "@/core/offline/today-readiness";

export function TodayOfflineReadiness({requirements}:{requirements:TodayOfflineRequirements}){
  const initial=useMemo<TodayOfflineReadinessResult>(()=>({status:"error",workerVerified:false,requiredRouteCount:requirements.routes.length,requiredAudioCount:requirements.audioAssets.length,missingRoutes:[],missingAudioAssets:[],checkedAt:"",message:"جارٍ فحص Cache وService Worker…"}),[requirements.routes.length,requirements.audioAssets.length]);
  const[result,setResult]=useState(initial);const[checking,setChecking]=useState(true);
  const check=useCallback(async()=>{setChecking(true);setResult(await checkTodayOfflineReadiness(requirements));setChecking(false)},[requirements]);
  useEffect(()=>{const timeout=window.setTimeout(()=>void check(),0);return()=>window.clearTimeout(timeout)},[check]);
  const ready=!checking&&result.status==="ready"&&result.workerVerified;
  const missingCount=result.missingRoutes.length+result.missingAudioAssets.length;
  return <section className={ready?"today-offline-readiness ready":"today-offline-readiness"} data-offline-readiness-policy={requirements.policyVersion}>
    <header><span>{ready?<CheckCircle2 size={19}/>:<WifiOff size={19}/>}</span><div><strong>جاهزية جلسة اليوم دون إنترنت</strong><small>{checking?"نتحقق فعليًا من المسارات والصوت…":ready?"تحقق Service Worker من كل الموارد المطلوبة.":"لن ندّعي الجاهزية قبل وجود الموارد في Cache."}</small></div></header>
    {checking?<p role="status">جارٍ فحص {requirements.routes.length} مسارًا و{requirements.audioAssets.length} ملف صوت…</p>:ready?<p role="status">جاهزة Offline: {result.requiredRouteCount} مسارًا{result.requiredAudioCount?` و${result.requiredAudioCount} ملف صوت`:""} متاحة الآن.</p>:<div className="offline-readiness-missing"><p role="status">{result.status==="uncontrolled"||result.status==="unsupported"||result.status==="error"?result.message:`ينقص ${missingCount} موردًا: ${result.missingRoutes.length} مسار و${result.missingAudioAssets.length} ملف صوت.`}</p>{missingCount>0&&<details><summary>اعرض الموارد الناقصة</summary><ul>{result.missingRoutes.map((path)=><li key={path}><code dir="ltr" data-bidi-scope="technical">{path}</code></li>)}{result.missingAudioAssets.map((path)=><li key={path}><code dir="ltr" data-bidi-scope="technical">{path}</code> <span>صوت</span></li>)}</ul></details>}</div>}
    <footer><button type="button" onClick={()=>void check()} disabled={checking}><RefreshCcw size={14}/> أعد الفحص</button>{!ready&&<Link href="/settings">افتح تنزيل الحزم يدويًا</Link>}<small>لا تنزيل تلقائي ولا تغيير للتقدم.</small></footer>
  </section>;
}
