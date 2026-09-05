/**
 * P0-124: فهرس مواضع الدليل المؤلفة لأسئلة القراءة.
 *
 * يحوّل جدول `reading-evidence.ts` (رقم جملة + تعليل) إلى اقتباس حرفي من نص
 * كل درس، ثم يقيس التغطية: كم سؤالًا له موضع مؤلف، وكم سؤالًا بلا موضع، وكم
 * موضعًا لا يشترك لفظيًا مع سؤاله أو خياره الصحيح دون تصريح بالاستنتاج.
 *
 * حدّ معلن: الموضع المؤلف يختار الجملة التي يبرّرها المعنى، لكن المصدر نفسه
 * (نص القراءة) مؤلف داخل المشروع، ولم تُراجع هذه المواضع مدرّس ألماني مستقل.
 */
import { academicLessonList } from "./academic-lessons";
import { readingEvidenceSeeds, type ReadingEvidenceRelation } from "./reading-evidence";
import { splitGermanSentences } from "@/core/lesson/sentences";

export type ReadingEvidence = {
  lessonId: string;
  questionId: string;
  /** الجملة المقتبسة حرفيًا من نص قراءة الدرس. */
  quote: string;
  /** لماذا هذه الجملة هي موضع الدليل. */
  whyAr: string;
  relation: ReadingEvidenceRelation;
  origin: "authored" | "auto";
};

export type ReadingQuestionTarget = {
  lessonId: string;
  questionId: string;
  promptDe: string;
  correctOption: string;
};

const sentencesByLesson = new Map<string, string[]>();
const targetsByQuestionId = new Map<string, ReadingQuestionTarget>();

for (const lesson of academicLessonList) {
  sentencesByLesson.set(lesson.id, splitGermanSentences(lesson.reading.textDe));
  for (const question of lesson.reading.questions) {
    targetsByQuestionId.set(question.id, {
      lessonId: lesson.id,
      questionId: question.id,
      promptDe: question.promptDe,
      correctOption: question.options[question.correctIndex] ?? "",
    });
  }
}

export const readingQuestionTargets: ReadingQuestionTarget[] = [...targetsByQuestionId.values()];

/** موضع الدليل المؤلف بعد تحويل رقم الجملة إلى اقتباس حرفي. */
export const authoredReadingEvidence: ReadingEvidence[] = readingEvidenceSeeds.map(([questionId, sentenceIndex, whyAr, relation]) => {
  const target = targetsByQuestionId.get(questionId);
  const sentences = target ? sentencesByLesson.get(target.lessonId) ?? [] : [];
  return {
    lessonId: target?.lessonId ?? "",
    questionId,
    quote: sentences[sentenceIndex] ?? "",
    whyAr,
    relation: relation ?? "direct",
    origin: "authored",
  };
});

export const readingEvidenceByQuestionId: Record<string, ReadingEvidence> = Object.fromEntries(
  authoredReadingEvidence.map((evidence) => [evidence.questionId, evidence]),
);

/** أسئلة قراءة منشورة بلا موضع دليل مؤلف: يجب أن تبقى فارغة. */
export const readingQuestionsWithoutEvidence: string[] = readingQuestionTargets
  .filter((target) => !readingEvidenceByQuestionId[target.questionId])
  .map((target) => target.questionId)
  .sort();

/** مواضع مؤلفة لا يقابلها سؤال منشور (رقم معرّف خاطئ أو سؤال محذوف). */
export const orphanReadingEvidence: string[] = authoredReadingEvidence
  .filter((evidence) => !targetsByQuestionId.has(evidence.questionId))
  .map((evidence) => evidence.questionId)
  .sort();

/** مواضع لم تُحلّ إلى اقتباس (رقم جملة خارج النص). */
export const unresolvedReadingEvidence: string[] = authoredReadingEvidence
  .filter((evidence) => !evidence.quote)
  .map((evidence) => evidence.questionId)
  .sort();

export type ReadingEvidenceSummary = {
  lessons: number;
  readingQuestions: number;
  authoredEvidence: number;
  /** مواضع صُرِّح فيها بعدم وجود لفظ مشترك (مثل الأرقام المكتوبة بالحروف). */
  inferenceEvidence: number;
  questionsWithoutEvidence: number;
  orphanEvidence: number;
  unresolvedEvidence: number;
  byLevel: Record<string, { lessons: number; questions: number; evidence: number }>;
};

export function buildReadingEvidenceSummary(): ReadingEvidenceSummary {
  const byLevel: ReadingEvidenceSummary["byLevel"] = {};
  for (const target of readingQuestionTargets) {
    const level = target.lessonId.slice(0, 2).toUpperCase();
    byLevel[level] ??= { lessons: 0, questions: 0, evidence: 0 };
    byLevel[level].questions += 1;
    if (readingEvidenceByQuestionId[target.questionId]) byLevel[level].evidence += 1;
  }
  for (const lesson of academicLessonList) {
    const level = lesson.id.slice(0, 2).toUpperCase();
    byLevel[level] ??= { lessons: 0, questions: 0, evidence: 0 };
    byLevel[level].lessons += 1;
  }
  return {
    lessons: academicLessonList.length,
    readingQuestions: readingQuestionTargets.length,
    authoredEvidence: authoredReadingEvidence.length,
    inferenceEvidence: authoredReadingEvidence.filter((evidence) => evidence.relation === "inference").length,
    questionsWithoutEvidence: readingQuestionsWithoutEvidence.length,
    orphanEvidence: orphanReadingEvidence.length,
    unresolvedEvidence: unresolvedReadingEvidence.length,
    byLevel,
  };
}

export const readingEvidenceSummary = buildReadingEvidenceSummary();
