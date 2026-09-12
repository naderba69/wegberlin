import type { QuietHoursSettings, ReviewReminderSettings } from "@/types/learning";
import { isQuietHoursActive } from "@/core/coach/learning-agreement";
import { calendarPartsAt } from "@/core/srs/sm2";

export const REVIEW_REMINDER_POLICY = "local-review-reminder-v1" as const;
export const REVIEW_REMINDER_BOUNDARY = "in-app-and-notification-api-while-open-no-push-background-guarantee-mastery-or-penalty" as const;

export const DEFAULT_REVIEW_REMINDER_SETTINGS: ReviewReminderSettings = {
  policyVersion: REVIEW_REMINDER_POLICY,
  enabled: false,
  hourLocal: "18:00",
  timeZone: "UTC",
  deliveryBoundary: REVIEW_REMINDER_BOUNDARY,
};

function validClock(value:string){const match=value.match(/^(\d{2}):(\d{2})$/u);if(!match)return null;const hour=Number(match[1]);const minute=Number(match[2]);return hour<24&&minute<60?hour*60+minute:null}

export function reminderLocalDate(now:Date,timeZone:string){const parts=calendarPartsAt(now,timeZone);return`${parts.year}-${String(parts.month).padStart(2,"0")}-${String(parts.day).padStart(2,"0")}`}

export function reviewReminderDecision(input:{
  settings:ReviewReminderSettings;
  quietHours:QuietHoursSettings;
  dueCount:number;
  now?:Date;
  notificationSupported:boolean;
  notificationPermission:"default"|"denied"|"granted";
}){
  const now=input.now??new Date();
  const localDate=reminderLocalDate(now,input.settings.timeZone);
  const reminderMinutes=validClock(input.settings.hourLocal);
  const parts=calendarPartsAt(now,input.settings.timeZone);
  const currentMinutes=parts.hour*60+parts.minute;
  const reachedTime=reminderMinutes!==null&&currentMinutes>=reminderMinutes;
  const quiet=isQuietHoursActive(input.quietHours,now);
  const eligible=input.settings.enabled&&input.dueCount>0&&reachedTime&&!quiet;
  const showInApp=eligible&&input.settings.dismissedInAppDate!==localDate;
  const sendDevice=eligible&&input.notificationSupported&&input.notificationPermission==="granted"&&input.settings.lastDeviceNotificationDate!==localDate;
  const reasonAr=!input.settings.enabled?"التذكير متوقف.":input.dueCount<1?"لا توجد مراجعات مستحقة.":!reachedTime?"لم يحن وقت التذكير المحلي بعد.":quiet?"ساعات الهدوء نشطة.":"حان وقت المراجعة.";
  return{policyVersion:REVIEW_REMINDER_POLICY,localDate,reachedTime,quiet,showInApp,sendDevice,reasonAr,dueCount:input.dueCount,evidenceBoundary:REVIEW_REMINDER_BOUNDARY};
}
