"use client";

import { useState } from "react";
import { useDeviceValue } from "./device-value";
import { Bell, BellOff, Clock3, ShieldCheck } from "lucide-react";
import { REVIEW_REMINDER_POLICY } from "@/core/review/reminder";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

function initialPermission():NotificationPermission|"unsupported"{return typeof Notification==="undefined"?"unsupported":Notification.permission}

export function ReviewReminderControl(){
  const{state,update}=useLearning();
  const settings=state.reviewReminderSettings;
  // قراءتان تخصّان الجهاز وحده: أول رسم على الخادم وأول رسم للعميل يجب أن يتساويا، وإلا اختلف
  // HTML الخادم عن العميل فسقط خطأ React hydration. تبدأ القيمتان ثابتيْن وتُستأنَفان بعد الترطيب.
  const timeZone=useDeviceValue(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC","UTC");
  const devicePermission=useDeviceValue(initialPermission,"unsupported");
  const[permissionOverride,setPermission]=useState<NotificationPermission|"unsupported"|null>(null);
  const permission=permissionOverride??devicePermission;
  const[message,setMessage]=useState("");

  async function toggle(){
    if(settings.enabled){update((current)=>({...current,reviewReminderSettings:{...current.reviewReminderSettings,enabled:false}}));setMessage("أوقفت تذكير المراجعة. بقيت المواعيد والبطاقات محفوظة.");return}
    let nextPermission=permission;
    if(typeof Notification!=="undefined"&&Notification.permission==="default")nextPermission=await Notification.requestPermission();
    setPermission(nextPermission);
    update((current)=>({...current,reviewReminderSettings:{...current.reviewReminderSettings,enabled:true,timeZone,lastDeviceNotificationDate:undefined,dismissedInAppDate:undefined}}));
    setMessage(nextPermission==="granted"?"فُعّل تذكير داخل التطبيق وإشعار الجهاز عندما تكون المنصة مفتوحة.":nextPermission==="denied"?"فُعّل التذكير داخل التطبيق. المتصفح رفض إشعار الجهاز ويمكن تغييره من إعدادات الموقع.":"فُعّل التذكير داخل التطبيق؛ Notification API غير متاح على هذا الجهاز.");
  }

  function changeTime(hourLocal:string){update((current)=>({...current,reviewReminderSettings:{...current.reviewReminderSettings,hourLocal,timeZone,lastDeviceNotificationDate:undefined,dismissedInAppDate:undefined}}));setMessage("حُفظ وقت التذكير محليًا.")}

  return <section className="settings-card review-reminder-control" data-review-reminder-policy={REVIEW_REMINDER_POLICY}>
    <div className="settings-title"><span>{settings.enabled?<Bell size={20}/>:<BellOff size={20}/>}</span><div><h2>تذكير مراجعة المفردات</h2><p>تذكير محلي للبطاقات المستحقة، بلا حساب أو خادم أو Push مدفوع.</p></div></div>
    <div className="review-reminder-grid">
      <label><Clock3 size={16}/><span>وقت التذكير<input type="time" value={settings.hourLocal} onChange={(event)=>changeTime(event.target.value)}/></span></label>
      <div><small>المنطقة الزمنية</small><strong>{timeZone}</strong><span>حالة الجهاز: {permission==="granted"?"مسموح":permission==="denied"?"مرفوض":permission==="default"?"لم يُطلب بعد":"غير مدعوم"}</span></div>
    </div>
    <button type="button" className={settings.enabled?"secondary-button":"primary-button"} onClick={()=>void toggle()}>{settings.enabled?<BellOff size={16}/>:<Bell size={16}/>} {settings.enabled?"إيقاف التذكير":"تفعيل التذكير"}</button>
    {message&&<StatusAnnouncement message={message} channel="review-reminder-control" className="compact" icon={<ShieldCheck size={15}/>}/>} 
    <footer>يظهر التذكير داخل المنصة عند حلول الوقت. إشعار الجهاز اختياري ويعمل فقط عندما تكون المنصة مفتوحة؛ لا ندعي تشغيلًا مضمونًا بعد إغلاق المتصفح، وتحترم العملية ساعات الهدوء.</footer>
  </section>
}
