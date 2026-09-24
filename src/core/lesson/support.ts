import type { PracticeExercise, Question } from "@/types/lesson-content";
import { normalizeGermanText } from "./evaluate";

const germanStopwords = new Set([
  "aber", "als", "am", "an", "auf", "aus", "bei", "das", "dass", "dem", "den", "der", "des", "die", "ein", "eine", "einer", "eines", "er", "es", "für", "hat", "im", "in", "ist", "mit", "nicht", "oder", "sie", "sind", "und", "von", "war", "was", "welche", "welcher", "welches", "wer", "wie", "wird", "wo", "zu",
]);

function words(value: string) {
  return normalizeGermanText(value)
    .split(/\s+/u)
    .map((word) => word.replace(/[^\p{L}\p{N}ßäöü-]/gu, ""))
    .filter((word) => word.length >= 3 && !germanStopwords.has(word));
}

function answerShape(answer: string) {
  return answer
    .trim()
    .split(/\s+/u)
    .map((part) => part.length <= 2 ? "•".repeat(part.length) : `${part.slice(0, 1)}${"•".repeat(Math.min(8, part.length - 1))}`)
    .join(" ");
}

export function exerciseHintSteps(exercise: PracticeExercise): [string, string] {
  if (exercise.type === "multiple-choice") return [
    "اقرأ الجملة كاملة وحدد الوظيفة المطلوبة قبل مقارنة الخيارات.",
    "استبعد خيارين بسبب ترتيب الفعل أو الحالة أو المعنى، ثم قارن الباقيين داخل الجملة لا منفردين.",
  ];
  if (exercise.type === "fill-blank") return [
    "حدد نوع الكلمة التي يحتاجها الفراغ: فعل، أداة، رابط أم نهاية صرفية.",
    `شكل الجواب المستهدف دون كشفه: ${answerShape(exercise.acceptedAnswers[0] ?? "?")}`,
  ];
  if (exercise.type === "word-ordering") return [
    "ابحث أولًا عن الفعل المصرف وحدد هل الجملة رئيسية أم تابعة.",
    "ثبّت الموضع الأول وموضع الفعل، ثم ضع الزمن والمكان وبقية العناصر حولهما.",
  ];
  if (exercise.type === "error-correction") return [
    "لا تعِد كتابة كل شيء فورًا؛ عيّن أولًا الموضع الذي يكسر القاعدة.",
    "راجع تصريف الفعل وترتيبه والحالة المطلوبة، وغيّر أقل عدد ممكن من الكلمات.",
  ];
  return [
    "صنّف عناصر العمود الأول: شخص، فعل، مكان، معنى أو وظيفة.",
    "ابدأ بالزوج الأكثر يقينًا، ثم استبعد المعنى المستخدم قبل حل الأزواج المتبقية.",
  ];
}

export function questionHintSteps(question: Question): [string, string] {
  return [
    "أعد صياغة السؤال بكلماتك وحدد هل يطلب فكرة عامة أم تفصيلًا أم سببًا.",
    `ابحث عن كلمات السؤال الأساسية، ثم قارنها بالخيارات. شكل الخيار الصحيح: ${answerShape(question.options[question.correctIndex])}`,
  ];
}

export function selectReadingEvidence(textDe: string, question: Question) {
  const sentences = textDe
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (!sentences.length) return textDe.trim();

  const answerTokens = new Set(words(question.options[question.correctIndex]));
  const promptTokens = new Set(words(question.promptDe));
  let bestSentence = sentences[0];
  let bestScore = -1;

  for (const sentence of sentences) {
    const sentenceTokens = new Set(words(sentence));
    let score = 0;
    for (const token of answerTokens) if (sentenceTokens.has(token)) score += 3;
    for (const token of promptTokens) if (sentenceTokens.has(token)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }
  return bestSentence;
}

export function readingEvidenceMap(textDe: string, questions: Question[]) {
  return Object.fromEntries(questions.map((question) => [question.id, selectReadingEvidence(textDe, question)]));
}
