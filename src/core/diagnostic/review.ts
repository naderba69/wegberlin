import type { DiagnosticQuestion } from "@/data/diagnostic";

/**
 * مراجعة ما بعد التشخيص: الأسئلة التي أجاب عنها المتعلّم خطأً فقط.
 * تُعرض بعد انتهاء الاختبار، لا أثناءه، حتى لا يكشف الجواب قبل اكتمال القياس.
 * شرح بالألمانية هو الموجود الآن؛ الشرح العربي (explanationAr) يُضاف عند اعتماد المسودات.
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
