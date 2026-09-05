/**
 * P0-124: فهرس مواضع الدليل المؤلفة لأسئلة الاستماع.
 *
 * يحوّل جدول `listening-evidence.ts` (رقم مقطع + تعليل) إلى اقتباس حرفي من نص
 * استماع كل درس، ثم يقيس التغطية: كم سؤالًا له موضع مؤلف، وكم سؤالًا بلا موضع،
 * وكم موضعًا لا يشترك لفظيًا مع سؤاله أو خياره الصحيح دون تصريح بالاستنتاج.
 *
 * وحدة الاقتباس هي **المقطع** (`splitListeningUnits`): دور داخل الحوار أو جملة
 * داخل الدور، لأن المستمع يسمع النص متتابعًا ولا يراه فقرات.
 *
 * حدّ معلن: الموضع المؤلف يختار المقطع الذي يبرّره المعنى، لكن المصدر نفسه
 * (نص الاستماع) مؤلف داخل المشروع، ولم تُراجع هذه المواضع مدرّس ألماني مستقل.
 */
import { academicLessonList } from "./academic-lessons";
import { listeningEvidenceSeeds, type ListeningEvidenceRelation } from "./listening-evidence";
import { splitListeningUnits } from "@/core/lesson/sentences";

export type ListeningEvidence = {
  lessonId: string;
  questionId: string;
  /** المقطع المقتبس حرفيًا من نص استماع الدرس. */
  quote: string;
  /** لماذا هذا المقطع هو موضع الدليل. */
  whyAr: string;
  relation: ListeningEvidenceRelation;
  origin: "authored" | "auto";
};

export type ListeningQuestionTarget = {
  lessonId: string;
  questionId: string;
  promptDe: string;
  correctOption: string;
};

const unitsByLesson = new Map<string, string[]>();
const targetsByQuestionId = new Map<string, ListeningQuestionTarget>();

for (const lesson of academicLessonList) {
  if (lesson.listening) unitsByLesson.set(lesson.id, splitListeningUnits(lesson.listening.transcriptDe));
  for (const question of lesson.listening?.questions ?? []) {
    targetsByQuestionId.set(question.id, {
      lessonId: lesson.id,
      questionId: question.id,
      promptDe: question.promptDe,
      correctOption: question.options[question.correctIndex] ?? "",
    });
  }
}

export const listeningQuestionTargets: ListeningQuestionTarget[] = [...targetsByQuestionId.values()];

/** موضع الدليل المؤلف بعد تحويل رقم المقطع إلى اقتباس حرفي. */
export const authoredListeningEvidence: ListeningEvidence[] = listeningEvidenceSeeds.map(([questionId, unitIndex, whyAr, relation]) => {
  const target = targetsByQuestionId.get(questionId);
  const units = target ? unitsByLesson.get(target.lessonId) ?? [] : [];
  return {
    lessonId: target?.lessonId ?? "",
    questionId,
    quote: units[unitIndex] ?? "",
    whyAr,
    relation: relation ?? "direct",
    origin: "authored",
  };
});

export const listeningEvidenceByQuestionId: Record<string, ListeningEvidence> = Object.fromEntries(
  authoredListeningEvidence.map((evidence) => [evidence.questionId, evidence]),
);

/** أسئلة استماع منشورة بلا موضع دليل مؤلف: يجب أن تبقى فارغة. */
export const listeningQuestionsWithoutEvidence: string[] = listeningQuestionTargets
  .filter((target) => !listeningEvidenceByQuestionId[target.questionId])
  .map((target) => target.questionId)
  .sort();

/** مواضع مؤلفة لا يقابلها سؤال منشور (رقم معرّف خاطئ أو سؤال محذوف). */
export const orphanListeningEvidence: string[] = authoredListeningEvidence
  .filter((evidence) => !targetsByQuestionId.has(evidence.questionId))
  .map((evidence) => evidence.questionId)
  .sort();

/** مواضع لم تُحلّ إلى اقتباس (رقم مقطع خارج النص). */
export const unresolvedListeningEvidence: string[] = authoredListeningEvidence
  .filter((evidence) => !evidence.quote)
  .map((evidence) => evidence.questionId)
  .sort();

export type ListeningEvidenceSummary = {
  lessons: number;
  listeningQuestions: number;
  authoredEvidence: number;
  /** مواضع صُرِّح فيها بعدم وجود لفظ مشترك (مثل الأرقام المنطوقة بالحروف). */
  inferenceEvidence: number;
  questionsWithoutEvidence: number;
  orphanEvidence: number;
  unresolvedEvidence: number;
  byLevel: Record<string, { lessons: number; questions: number; evidence: number }>;
};

export function buildListeningEvidenceSummary(): ListeningEvidenceSummary {
  const byLevel: ListeningEvidenceSummary["byLevel"] = {};
  for (const target of listeningQuestionTargets) {
    const level = target.lessonId.slice(0, 2).toUpperCase();
    byLevel[level] ??= { lessons: 0, questions: 0, evidence: 0 };
    byLevel[level].questions += 1;
    if (listeningEvidenceByQuestionId[target.questionId]) byLevel[level].evidence += 1;
  }
  for (const lesson of academicLessonList) {
    if (!lesson.listening) continue;
    const level = lesson.id.slice(0, 2).toUpperCase();
    byLevel[level] ??= { lessons: 0, questions: 0, evidence: 0 };
    byLevel[level].lessons += 1;
  }
  return {
    lessons: academicLessonList.filter((lesson) => Boolean(lesson.listening)).length,
    listeningQuestions: listeningQuestionTargets.length,
    authoredEvidence: authoredListeningEvidence.length,
    inferenceEvidence: authoredListeningEvidence.filter((evidence) => evidence.relation === "inference").length,
    questionsWithoutEvidence: listeningQuestionsWithoutEvidence.length,
    orphanEvidence: orphanListeningEvidence.length,
    unresolvedEvidence: unresolvedListeningEvidence.length,
    byLevel,
  };
}

export const listeningEvidenceSummary = buildListeningEvidenceSummary();
