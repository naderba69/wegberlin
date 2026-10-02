import type { LessonEvidenceCriterion } from "./evidence-gate";

export const BEGINNER_READABLE_COMPLETION_POLICY = "beginner-readable-completion-v1" as const;

export type LessonCompletionGuidance = {
  criterionId: LessonEvidenceCriterion["id"];
  statusAr: "مكتمل" | "قيد التقدم" | "لم يبدأ بعد";
  detailAr: string;
  actionAr: string;
  remaining: number;
};

function remainingItems(criterion: LessonEvidenceCriterion): number {
  return Math.max(0, criterion.required - criterion.achieved);
}

function countPhrase(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : `${count} ${plural}`;
}

export function lessonCompletionGuidance(criterion: LessonEvidenceCriterion): LessonCompletionGuidance {
  const remaining = remainingItems(criterion);
  const statusAr = criterion.passed ? "مكتمل" : criterion.achieved > 0 ? "قيد التقدم" : "لم يبدأ بعد";

  if (criterion.passed) {
    return {
      criterionId: criterion.id,
      statusAr,
      detailAr: "أكملت المطلوب في هذا الجزء. يمكنك متابعة الدرس.",
      actionAr: "مراجعة هذا الجزء",
      remaining,
    };
  }

  if (criterion.id === "reading") {
    return {
      criterionId: criterion.id,
      statusAr,
      detailAr: `أجب إجابة صحيحة عن سؤال قراءة واحد. لديك ${criterion.total} تمارين، ويكفي إنجاز واحد.`,
      actionAr: "ابدأ تمرين القراءة",
      remaining,
    };
  }

  if (criterion.id === "listening") {
    return {
      criterionId: criterion.id,
      statusAr,
      detailAr: `استمع إلى مقطع قصير ثم أجب إجابة صحيحة عن سؤال واحد. لديك ${criterion.total} تمارين، ويكفي إنجاز واحد.`,
      actionAr: "ابدأ تمرين الاستماع",
      remaining,
    };
  }

  if (criterion.id === "controlled") {
    return {
      criterionId: criterion.id,
      statusAr,
      detailAr: `أكمل ${countPhrase(remaining, "تمرينًا أساسيًا آخر", "تمارين أساسية أخرى")} بإجابة صحيحة ومختلفة.`,
      actionAr: criterion.achieved > 0 ? "أكمل التمارين الأساسية" : "ابدأ التمارين الأساسية",
      remaining,
    };
  }

  return {
    criterionId: criterion.id,
    statusAr,
    detailAr: `أكمل ${countPhrase(remaining, "سؤالًا آخر", "أسئلة أخرى")} في الاختبار القصير بإجابة صحيحة.`,
    actionAr: criterion.achieved > 0 ? "أكمل الاختبار القصير" : "ابدأ الاختبار القصير",
    remaining,
  };
}

export function nextLessonCompletionGuidance(criteria: LessonEvidenceCriterion[]): LessonCompletionGuidance | null {
  const next = criteria.find((criterion) => !criterion.passed);
  return next ? lessonCompletionGuidance(next) : null;
}
