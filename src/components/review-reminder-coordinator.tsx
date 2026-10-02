"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDeviceEpoch } from "./device-value";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { buildDueReviewQueue } from "@/core/srs/review-queue";
import { reviewReminderDecision } from "@/core/review/reminder";
import { useLearning } from "./learning-provider";

const EPOCH=new Date(0);
const epochOr=(ms:number)=>ms?new Date(ms):EPOCH;

export function ReviewReminderCoordinator(){
  const{state,ready,update}=useLearning();
  const deviceNow=useDeviceEpoch(0);
  const[tick,setTick]=useState(0);
  const now=useMemo(()=>epochOr(tick||deviceNow),[tick,deviceNow]);
  const notifiedDateRef=useRef("");
  const dueCount=useMemo(()=>ready?buildDueReviewQueue(state,now).length:0,[ready,state,now]);
  const notificationSupported=typeof Notification!=="undefined";
  const notificationPermission:NotificationPermission=notificationSupported?Notification.permission:"denied";
  const decision=reviewReminderDecision({settings:state.reviewReminderSettings,quietHours:state.quietHours,dueCount,now,notificationSupported,notificationPermission});

  useEffect(()=>{const timer=window.setInterval(()=>setTick(Date.now()),60_000);return()=>window.clearInterval(timer)},[]);
  useEffect(()=>{
    if(!ready||!decision.sendDevice||notifiedDateRef.current===decision.localDate||typeof Notification==="undefined")return;
    notifiedDateRef.current=decision.localDate;
    try{
      new Notification("مراجعات الألمانية مستحقة",{body:`لديك ${decision.dueCount} بطاقة مستحقة. افتح جلسة قصيرة حتى لا يتراكم النسيان.`,tag:`dwnb-review-${decision.localDate}`});
      update((current)=>({...current,reviewReminderSettings:{...current.reviewReminderSettings,lastDeviceNotificationDate:decision.localDate}}));
    }catch{notifiedDateRef.current=""}
  },[decision.dueCount,decision.localDate,decision.sendDevice,ready,update]);

  if(!ready||!decision.showInApp)return null;
  return <aside className="review-reminder-banner" data-review-reminder={decision.policyVersion} role="status">
    <Bell size={18}/><div><strong>حان وقت مراجعة المفردات</strong><span>{decision.dueCount} بطاقة مستحقة الآن. ابدأ بالمراجعة قبل إضافة محتوى جديد.</span></div>
    <Link href="/review">ابدأ المراجعة</Link>
    <button type="button" aria-label="إخفاء تذكير المراجعة اليوم" onClick={()=>update((current)=>({...current,reviewReminderSettings:{...current.reviewReminderSettings,dismissedInAppDate:decision.localDate}}))}><X size={17}/></button>
  </aside>
}
