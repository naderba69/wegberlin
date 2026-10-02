export const BEHAVIORAL_PRAISE_VERSION = "behavioral-praise-v1" as const;

export const behavioralPraiseMessages = {
  "session-complete": "أكملت خطوات الجلسة وثبّتَّ قرار البداية التالية؛ هذا سلوك تخطيط يمكن للمدرب البناء عليه.",
  "warmup-complete": "حاولت استرجاع ثلاث عبارات قبل فتح الحل وقيّمت ما تذكرته بصدق؛ لم نضف إتقانًا وهميًا.",
  "review-initial": "استرجعت البطاقة قبل الكشف ثم قيّمت صعوبتها؛ سُجلت المحاولة الأولى بلا زيادة إتقان.",
  "review-delayed-success": "استرجعت البطاقة بعد موعدها المؤجل؛ سُجل دليل احتفاظ جديد مرتبط بهذه البطاقة.",
  "review-delayed-repair": "واجهت فجوة في الاسترجاع المؤجل وقيّمتها بصدق؛ عادت البطاقة إلى الجدول بدل منح نجاح غير مستحق.",
  "writing-revision": "غيّرت النسخة بعد الفحص وحفظت مراجعة قابلة للمقارنة مع النص السابق.",
  "speaking-self-review": "استمعت إلى التسجيل كاملًا وحددت فجوة وخطة إعادة قبل حفظ المحاولة.",
  "exam-submission": "ثبّتَّ إجابات المهمة كاملةً؛ حُفظ الدليل التدريبي منفصلًا عن أي نقاط رسمية.",
  "grace-return": "عدت بعد يوم السماح دون مضاعفة الحمل؛ الاستمرارية بُنيت على العودة لا على سلسلة مثالية.",
} as const;

export type BehavioralPraiseEvent = keyof typeof behavioralPraiseMessages;

export function behavioralPraise(event: BehavioralPraiseEvent) {
  return behavioralPraiseMessages[event];
}
