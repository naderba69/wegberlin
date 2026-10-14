import { diagnosticForms, type DiagnosticQuestion } from "@/data/diagnostic";

/**
 * مراجعة ما بعد التشخيص: الأسئلة التي أجاب عنها المتعلّم خطأً فقط.
 * تُعرض بعد انتهاء الاختبار، لا أثناءه، حتى لا يكشف الجواب قبل اكتمال القياس.
 * الشرح الألماني (explanationDe) موجود لكل سؤال؛ والشرح العربي (explanationAr) مُعتمد ومطبّق على الأسئلة الـ32 (انظر AUDIT_FIX_RESULTS §16).
 */
export type DiagnosticReviewItem = {
  id: string;
  promptAr: string;
  chosenDe: string;
  correctDe: string;
  explanationDe: string;
  explanationAr?: string;
};

export function diagnosticReviewItems(questions: readonly DiagnosticQuestion[], answers: Record<string, number>): DiagnosticReviewItem[] {
  return questions.flatMap((question) => {
    const chosen = answers[question.id];
    if (chosen === undefined || chosen === question.correctIndex) return [];
    return [{
      id: question.id,
      promptAr: question.prompt,
      chosenDe: question.options[chosen],
      correctDe: question.options[question.correctIndex],
      explanationDe: question.explanation,
      explanationAr: question.explanationAr,
    }];
  });
}

/** الإجابات الخاطئة فقط بصيغة قابلة للحفظ: معرّف السؤال → الخيار المختار. */
export function diagnosticWrongAnswers(questions: readonly DiagnosticQuestion[], answers: Record<string, number>): Record<string, number> {
  const wrong: Record<string, number> = {};
  for (const question of questions) {
    const chosen = answers[question.id];
    if (chosen !== undefined && chosen !== question.correctIndex) wrong[question.id] = chosen;
  }
  return wrong;
}

/** إعادة بناء المراجعة من البيانات المحفوظة، بمحتوى الصيغة الحالي. */
export function diagnosticReviewItemsFromStored(formId: "A" | "B", wrong: Record<string, number>): DiagnosticReviewItem[] {
  return diagnosticReviewItems(diagnosticForms[formId], wrong);
}
