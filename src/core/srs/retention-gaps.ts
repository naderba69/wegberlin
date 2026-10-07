import type { LearningState } from "@/types/learning";
import { DELAYED_RETENTION_CARD_THRESHOLD, lessonRetentionStatus } from "./review-session";

/**
 * التثبيت المعلَّق صار يُقاس بفاصل زمني صريح لا بمجرّد تكرار البطاقة.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البند P0-2 بعد التصحيح): القاعدة موجودة
 * في النموذج (`retentionEvidence` = 4 بطاقات مؤجَّلة لكل درس) لكن **الحد الأدنى للفاصل
 * لم يكن مكتوبًا في أي مكان**، ودالة `lessonRetentionStatus` كانت معرَّفة وغير معروضة
 * في أي واجهة. النتيجة: المتعلّم لا يرى فرقًا بين «كرّرت البطاقة» و«ثبّتّها بعد فاصل
 * كافٍ». هذه الوحدة تكتب الحدّ صراحةً وتحسبه من أحداث المراجعة الفعلية.
 */
export const RETENTION_GAP_POLICY = "retention-gap-72h-v1" as const;
export const RETENTION_MIN_GAP_HOURS = 72 as const;

export type RetentionGapStatus = "not-completed" | "in-progress" | "spaced-confirmed" | "unverified-gap";

export type RetentionGapSummary = {
  policyVersion: typeof RETENTION_GAP_POLICY;
  lessonId: string;
  status: RetentionGapStatus;
  delayedCards: number;
  requiredCards: number;
  successfulDelayEvents: number;
  measuredGaps: number;
  minimumGapHours: number | null;
  meetsMinimumGap: boolean;
  nextReviewAt?: string;
  detailAr: string;
};

const HOUR_MS = 3600 * 1000;

/**
 * يجمع لكل بطاقة في الدرس أحداث المراجعة بالترتيب الزمني، ويحسب الفواصل بين كل حدثين
 * متتاليين **حين ينتهيان بنجاح مؤجَّل** (درجة ≥ 3). الفاصل غير المقيس لا يُفترض: يُقال
 * صراحةً أنه غير متحقَّق بدل أن يُمنح الدرس وسم «مثبَّت».
 */
export function retentionGapSummary(state: LearningState, lessonId: string): RetentionGapSummary {
  const retention = lessonRetentionStatus(state, lessonId);
  const base = {
    policyVersion: RETENTION_GAP_POLICY,
    lessonId,
    delayedCards: retention.delayedCards,
    requiredCards: DELAYED_RETENTION_CARD_THRESHOLD,
  } as const;
  if (retention.status === "not-completed") {
    return { ...base, status: "not-completed", successfulDelayEvents: 0, measuredGaps: 0, minimumGapHours: null, meetsMinimumGap: false, detailAr: "أكمل الدرس أولًا؛ التثبيت المؤجَّل يبدأ بعده." };
  }

  const byCard = new Map<string, number[]>();
  for (const event of state.reviewEvents) {
    if (event.lessonId !== lessonId) continue;
    const at = Date.parse(event.reviewedAt);
    if (!Number.isFinite(at)) continue;
    byCard.set(event.cardId, [...(byCard.get(event.cardId) ?? []), at]);
  }

  const gaps: number[] = [];
  let successfulDelayEvents = 0;
  for (const event of state.reviewEvents) {
    if (event.lessonId !== lessonId) continue;
    if (event.evidenceKind !== "delayed" || event.grade < 3 || event.evidenceScope === "personal-error-remediation") continue;
    successfulDelayEvents += 1;
    const times = (byCard.get(event.cardId) ?? []).sort((left, right) => left - right);
    const at = Date.parse(event.reviewedAt);
    const index = times.indexOf(at);
    if (index > 0) gaps.push((at - times[index - 1]) / HOUR_MS);
  }

  const minimumGapHours = gaps.length ? Math.round(Math.min(...gaps) * 10) / 10 : null;
  const meetsMinimumGap = gaps.length > 0 && (minimumGapHours ?? 0) >= RETENTION_MIN_GAP_HOURS;
  const nextReviewAt = state.reviewItems
    .filter((item) => state.reviewEvents.some((event) => event.cardId === item.cardId && event.lessonId === lessonId))
    .map((item) => item.nextReviewDate)
    .sort()[0];

  if (retention.status === "delayed-confirmed" && meetsMinimumGap) {
    return {
      ...base,
      status: "spaced-confirmed",
      successfulDelayEvents,
      measuredGaps: gaps.length,
      minimumGapHours,
      meetsMinimumGap,
      nextReviewAt,
      detailAr: `مثبَّت باسترجاع مؤجَّل: ${retention.delayedCards}/${DELAYED_RETENTION_CARD_THRESHOLD} بطاقات، وأقصر فاصل مقيس ${minimumGapHours} ساعة (الحد الأدنى ${RETENTION_MIN_GAP_HOURS}).`,
    };
  }
  if (retention.status === "delayed-confirmed") {
    return {
      ...base,
      status: "unverified-gap",
      successfulDelayEvents,
      measuredGaps: gaps.length,
      minimumGapHours,
      meetsMinimumGap,
      nextReviewAt,
      detailAr: gaps.length
        ? `أربع بطاقات نجحت مؤجَّلة، لكن أقصر فاصل مقيس ${minimumGapHours} ساعة أقل من ${RETENTION_MIN_GAP_HOURS}؛ لا نعدّه تثبيتًا متباعدًا بعد.`
        : `أربع بطاقات نجحت مؤجَّلة، لكن لا يوجد فاصل زمني مقيس بين مراجعتين للبطاقة نفسها؛ أعد المراجعة لاحقًا ليُقاس الفاصل.`,
    };
  }
  return {
    ...base,
    status: "in-progress",
    successfulDelayEvents,
    measuredGaps: gaps.length,
    minimumGapHours,
    meetsMinimumGap,
    nextReviewAt,
    detailAr: `التثبيت قيد البناء: ${retention.delayedCards}/${DELAYED_RETENTION_CARD_THRESHOLD} بطاقات مؤجَّلة ناجحة. الحد الأدنى للفاصل المقيس ${RETENTION_MIN_GAP_HOURS} ساعة.`,
  };
}

export const RETENTION_GAP_BOUNDARY = "retention-gap-is-measured-from-recorded-review-events-not-inferred-from-card-counts" as const;
