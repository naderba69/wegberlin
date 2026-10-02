import type { LessonEvidenceCriterion } from "./evidence-gate";

export const BEGINNER_READABLE_COMPLETION_POLICY = "beginner-readable-completion-v2" as const;
export type LessonCompletionGuidance = {
  criterionId: LessonEvidenceCriterion["id"];
  statusAr: "مكتمل" | "قيد التقدم" | "لم يبدأ بعد";
  detailAr: string;
  actionAr: string;
  remaining: number;
};

export const criterionStage: Record<LessonEvidenceCriterion["id"], number> = { controlled: 5, reading: 6, listening: 7, "mini-test": 13, writing: 9, speaking: 10, mediation: 11 };

export function lessonCompletionGuidance(criterion: LessonEvidenceCriterion): LessonCompletionGuidance {
  const remaining = criterion.passed ? 0 : Math.max(0, criterion.required - criterion.achieved);
  const statusAr = criterion.passed ? "مكتمل" : criterion.achieved ? "قيد التقدم" : "لم يبدأ بعد";
  const details: Record<LessonEvidenceCriterion["id"], [string, string]> = {
    controlled: [`أكمل ${remaining} تمارين أساسية مختلفة بإجابة صحيحة. أحدث جواب هو الذي يصف التدريب الحالي.`, "ابدأ التمارين الأساسية"],
    reading: [`أجب عن ${criterion.required} من ${criterion.total} أسئلة قراءة؛ سؤال واحد لا يكفي للحكم على الفهم.`, "ابدأ تمرين القراءة"],
    listening: [`استمع إلى مقطع قصير فعلًا، ثم أجب عن ${criterion.required} من ${criterion.total} أسئلة.`, "ابدأ تمرين الاستماع"],
    "mini-test": [`أكمل ${remaining} أسئلة أخرى صحيحة في الاختبار القصير. الإعادة لا تصبح سؤالًا جديدًا.`, "ابدأ الاختبار القصير"],
    writing: ["خطّط لمسودة مرتبطة بالدرس ثم سلّمها في مختبر الكتابة. تسليمها ليس حكمًا على سلامة اللغة.", "افتح مهمة الكتابة"],
    speaking: ["سجّل محاولة قصيرة، استمع إليها، واكتب مراجعة ذاتية. فشل الجهاز ليس خطأ لغة؛ يمكنك مواصلة التعلّم دون ادعاء إثبات الكلام.", "افتح مهمة الكلام"],
    mediation: ["حدّد المتلقي والغرض ثم سلّم نقل المعنى في مختبر الوساطة.", "افتح مهمة الوساطة"],
  };
  return { criterionId: criterion.id, statusAr, detailAr: criterion.passed ? "أنجزت نشاط هذا الجزء؛ الجودة الحرة والاستقلال يعرضان منفصلين." : details[criterion.id][0], actionAr: criterion.passed ? "مراجعة هذا الجزء" : details[criterion.id][1], remaining };
}

export function nextLessonCompletionGuidance(criteria: LessonEvidenceCriterion[]): LessonCompletionGuidance | null {
  const next = criteria.find((criterion) => !criterion.passed);
  return next ? lessonCompletionGuidance(next) : null;
}
