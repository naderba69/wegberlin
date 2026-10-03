import type { QueuedReviewCard } from "@/core/srs/review-queue";

/**
 * حصة العلاج داخل جلسة المراجعة — سياسة `review-session-dose-v1`.
 *
 * القياس من المصدر: `dailyReviewQuota` يستثني صراحةً أحداث `personal-error-remediation` من عدّاد
 * اليوم (السطر 8 من daily-quota.ts)، بينما `eligibleReviewCards` يلحق كل بطاقات الأخطاء المؤكَّدة
 * بطابور الاستحقاق بلا سقف. النتيجة أن علاج الأخطاء لا يُحصى ولا يُحدَّد: متعلّم أخطأ كثيرًا وراجع
 * قليلًا يجد عشرات بطاقات العلاج دفعة واحدة، وكلها لا تُغلق حصة اليوم. هذا عقاب بصيغة جلسة، لا تعليم.
 *
 * ما تفعله السياسة: تضبط **حصة العلاج** داخل الجلسة فقط. بطاقات المنهج المجدولة تبقى كلها مرئية
 * كما هي — لا يُخفى منها شيء ولا يُصطنع تجويع لذيل الطابور، والزمن تقدير مرن لا هدف سرعة. والرقم
 * المعروض في `.review-count` يبقى عدد المستحق كله، فلا إنكار لطابور ولا دَين مخفي.
 */
export const REVIEW_SESSION_DOSE_POLICY = "review-session-dose-v1" as const;
export const REMEDIATION_TAG = "personal-error" as const;
/** سقفٌ لحصة العلاج وحدها؛ لا يمسّ البطاقات المجدولة ولا الحصة اليومية ولا الإتقان. */
export const REVIEW_SESSION_DOSE_BOUNDARY =
  "السقف على بطاقة العلاج في الجلسة وحدها. بطاقات المنهج المستحقة لا تُخفى، والمدة تقدير مرن لا هدف سرعة." as const;

export function isRemediationCard(card: { tags?: readonly string[] } | undefined) {
  return Array.isArray(card?.tags) && card.tags.includes(REMEDIATION_TAG);
}

export type ReviewSessionDoseInput = {
  queue: readonly QueuedReviewCard[];
  /** `dailyReviewQuota(...).required`: حصة البطاقات اليومية المشتقة من وقت المتعلم. */
  quotaRequired: number;
  /** كم بطاقة علاج نُظرت في هذه الجلسة — حتى لا تُستبدل واحدة بأخرى إلى ما لا نهاية. */
  remediationDone?: number;
  /** رفع السقف بطلب صريح من المتعلم لهذه الجلسة فقط. */
  extended?: boolean;
};

export type ReviewSessionDose = {
  policyVersion: typeof REVIEW_SESSION_DOSE_POLICY;
  scheduledCount: number;
  remediationCount: number;
  /** أقصى عدد بطاقات علاج يُعرض في هذه الجلسة: نصف الحصة اليومية، ببطاقة واحدة على الأقل. */
  remediationCap: number;
  remediationShown: number;
  hiddenRemediationCount: number;
  extended: boolean;
  capped: boolean;
  visible: QueuedReviewCard[];
  boundary: typeof REVIEW_SESSION_DOSE_BOUNDARY;
};

export function reviewSessionDose({ queue, quotaRequired, remediationDone = 0, extended = false }: ReviewSessionDoseInput): ReviewSessionDose {
  const required = Number.isFinite(quotaRequired) && quotaRequired > 0 ? Math.floor(quotaRequired) : 0;
  const remediation = queue.filter((item) => isRemediationCard(item.card));
  const scheduledCount = queue.length - remediation.length;
  // نصف الحصة، وبطاقة واحدة على الأقل: المتعلم الذي أنهى بطاقاته المستحقة يبقى له علاجٌ واحد.
  const cap = remediation.length === 0 ? 0 : Math.max(1, Math.ceil(required / 2));
  const done = Number.isFinite(remediationDone) ? Math.max(0, Math.floor(remediationDone)) : 0;
  const allowance = extended ? remediation.length : Math.min(remediation.length, Math.max(0, cap - done));
  const visibleRemediation = remediation.slice(0, allowance);
  // ترتيب الطابور محفوظ حرفيًا: كل المجدول يبقى، والعلاج داخل السقف فقط، ولا يُقدَّم بطاقة من الذيل.
  const shownRemediationIds = new Set(visibleRemediation.map((item) => item.card.id));
  const visible = queue.filter((item) => !isRemediationCard(item.card) || shownRemediationIds.has(item.card.id));
  const hiddenRemediationCount = remediation.length - visibleRemediation.length;
  return {
    policyVersion: REVIEW_SESSION_DOSE_POLICY,
    scheduledCount,
    remediationCount: remediation.length,
    remediationCap: cap,
    remediationShown: visibleRemediation.length,
    hiddenRemediationCount,
    extended,
    capped: hiddenRemediationCount > 0,
    visible,
    boundary: REVIEW_SESSION_DOSE_BOUNDARY,
  };
}

/** ساعة المراجعة المحلية التي يختارها المتعلم: تثبّت موعد الاستحقاق في يومه، لا منتصف الليل UTC. */
export function reviewHourFromLocalClock(hourLocal: string | undefined): number {
  const match = typeof hourLocal === "string" ? hourLocal.match(/^(\d{1,2}):(\d{2})$/u) : null;
  if (!match) return 0;
  const hour = Number(match[1]);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 0;
}
