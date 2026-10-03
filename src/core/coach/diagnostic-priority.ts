import type { LearningState } from "@/types/learning";

/**
 * أسبقية تشخيص نقطة البداية (ADR-106 · م1 من تدقيق 2026-10-03).
 *
 * التشخيص يسبق كل شيء ما لم يعلن المتعلم أنه يبدأ من الصفر — وهذا صحيح قبل أي عمل. لكنه لا يجوز أن
 * يبقى حاكمًا بعد أن يكون المتعلم قد أنجز دروسًا كاملة: عندها تكون الأدلة أبلغ من قياس محتاط.
 * العدد المرجعي مأخوذ من أصغر بوابة مستوى داخلي (8 دروس مُنهيّة بأدلتها) لا من انطباع.
 */
export const DIAGNOSTIC_PREEMPTION_COMPLETED_LESSON_LIMIT = 8;

export function placementDiagnosticShouldPreempt(state: LearningState): boolean {
  if (state.diagnosticResult) return false;
  if (state.profile?.priorExperience === "none") return false;
  return state.completedLessonIds.length < DIAGNOSTIC_PREEMPTION_COMPLETED_LESSON_LIMIT;
}
