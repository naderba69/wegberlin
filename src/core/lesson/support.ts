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

export function exerciseHintSteps(exercise: PracticeExercise): [string, string] {
  if (exercise.type === "multiple-choice") return [
    "اقرأ الجملة كاملة وحدد الوظيفة المطلوبة قبل مقارنة الخيارات.",
    "استبعد خيارين بسبب ترتيب الفعل أو الحالة أو المعنى، ثم قارن الباقيين داخل الجملة لا منفردين.",
  ];
  if (exercise.type === "fill-blank") return [
    "حدد نوع الكلمة التي يحتاجها الفراغ: فعل، أداة، رابط أم نهاية صرفية.",
    "اقرأ ما قبل الفراغ وما بعده، وطبّق قاعدة هذا الدرس دون البحث عن عدد الحروف.",
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
  const focus=/^wann/iu.test(question.promptDe)?"حدّد الحدث الذي يُطلب وقته، ثم افصل موعده عن الأوقات الأخرى.":/^warum/iu.test(question.promptDe)?"ابحث عن السبب المرتبط بالحدث، لا عن تفصيل صحيح لكنه لا يفسره.":/^wo/iu.test(question.promptDe)?"حدّد الشخص أو الحدث المقصود ثم ابحث عن مكانه، لا عن كل مكان مذكور.":"أعد صياغة السؤال بكلماتك وحدد هل يطلب فكرة عامة أم تفصيلًا أم سببًا.";
  return [
    focus,
    "ابحث عن دليل يجيب عن السؤال داخل النص أو المسموع، ثم استبعد الخيارات التي تغيّر الفاعل أو الزمن أو المقصد.",
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
