"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * قيمة يقرأها المتصفح وحده (مخزن جلسة، منطقة زمنية، ساعة، إذن إشعار).
 *
 * على الخادم وفي أول رسم للعميل تُرجع `fallback` حصراً، ثم تنتقل إلى قيمة الجهاز بعد الترطيب،
 * فلا يختلف HTML الخادم عن أول رسم للعميل ولا يُولَّد خطأ React hydration رقم 418.
 * تُستعمل للقيم المعروضة فقط؛ القيم المحفوظة تُقرأ في معالجات الأحداث كما هي.
 * لأن React يقارن بالمرجع، تُرجع الدوال أرقاماً أو نصوصاً لا كائنات جديدة.
 */
export function useDeviceValue<T>(read: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, read, () => fallback);
}

/** هل اكتمل الترطيب؟ false على الخادم وفي أول رسم للعميل. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * لحظة التحميل مثبّتة مرة واحدة بعد الترطيب.
 *
 * لماذا: `useDeviceValue(() => Date.now(), 0)` كان يُمرَّر إلى `useSyncExternalStore`، وهذا يقارن
 * بالمرجع ويستدعي `read()` بعد كل رسم؛ و`Date.now()` يعود بقيمة جديدة في كل مرة، فيُعاد الرسم بلا
 * توقف ⇒ «Maximum update depth exceeded» (React #185) وتسقط الصفحة كلها إلى
 * «This page couldn't load». ظهر العطل فقط بعد تراكم تقدّم حقيقي (٨ دروس مكتملة فأكثر) لأن
 * `buildDueReviewQueue` عندها يُنتج مراجعات مستحقة فيُفعَّل المسار الحسّاس (2026-09-22).
 *
 * الآن: `fallback` على الخادم وفي أول رسم، ثم قيمة ثابتة واحدة بعد الترطيب. الشاشات التي تحتاج
 * ساعة حيّة تملك مؤقّتها الخاص (`setInterval` + `useState`) وهو ما يحرّك الوقت، لا هذه الدالة.
 */
const MOUNT_EPOCH = typeof window === "undefined" ? 0 : Date.now();
export function useDeviceEpoch(fallback = 0): number {
  return useSyncExternalStore(subscribe, () => MOUNT_EPOCH, () => fallback);
}
