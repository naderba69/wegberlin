import type { PracticeExercise, Question } from "@/types/lesson-content";
import { normalizeGermanText } from "./evaluate";

const germanStopwords = new Set([
  "aber", "als", "am", "an", "auf", "aus", "bei", "das", "dass", "dem", "den", "der", "des", "die", "ein", "eine", "einer", "eines", "er", "es", "für", "hat", "im", "in", "ist", "mit", "nicht", "oder", "sie", "sind", "und", "von", "war", "was", "welche", "welcher", "welches", "wer", "wie", "wird", "wo", "zu",
]);

/** Closed, gradeable set: A1/A2 texts express quantities, times and prices in words. */
const germanNumberWords = new Set([
  "null", "eins", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
  "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn",
  "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig", "hundert",
  "halb", "viertel", "uhr", "minute", "minuten", "tag", "tage", "tagen", "woche", "wochen", "monat", "monate", "monaten", "jahr", "jahre", "jahren", "stunde", "stunden", "euro",
]);

export const READING_EVIDENCE_POLICY_VERSION = "reading-evidence-grounded-v1" as const;

export type ReadingEvidence = {
  policyVersion: typeof READING_EVIDENCE_POLICY_VERSION;
  /** Verbatim sentence from the text, or null when no sentence carries the answer keys. */
  quote: string | null;
  kind: "verbatim" | "morphological" | "computed" | "ungrounded";
  labelAr: string;
};

type EvidenceKeys = { words: Set<string>; roots: Set<string>; digits: Set<string>; quantities: Set<string> };

/**
 * Keys used to locate the sentence a learner should point at. Digits and quantity words survive even
 * when short, because A1 answers are often "27", "8:00" or "dreimal"; a bare length filter drops
 * exactly the tokens that carry the evidence and the highlight then lands on a wrong sentence.
 */
export function evidenceKeysFor(value: string): EvidenceKeys {
  const tokens = normalizeGermanText(value)
    .split(/\s+/u)
    .map((token) => token.replace(/[^\p{L}\p{N}ßäöü-]/gu, ""))
    .filter(Boolean);
  const lexical = tokens.filter((token) => token.length >= 3 && !germanStopwords.has(token));
  return {
    words: new Set(lexical),
    // Four-letter roots bridge the A1 alternations that a verbatim match misses: regnen ↔ Regen,
    // windig ↔ Wind, kochen ↔ kocht. Longer stems lose those pairs, shorter ones create false hits.
    roots: new Set(tokens.filter((token) => token.length >= 4).map((token) => token.slice(0, 4))),
    digits: new Set(tokens.map((token) => token.replace(/[^\d]/gu, "")).filter(Boolean)),
    quantities: new Set(tokens.filter((token) => germanNumberWords.has(token))),
  };
}

function keyOverlap(answer: EvidenceKeys, sentence: EvidenceKeys) {
  let lexical = 0;
  for (const key of answer.words) if (sentence.words.has(key)) lexical += 1;
  let morphological = 0;
  for (const root of answer.roots) if (sentence.roots.has(root) && !answer.words.has(root)) morphological += 1;
  let numeric = 0;
  for (const digit of answer.digits) if (sentence.digits.has(digit)) numeric += 1;
  let quantity = 0;
  for (const term of answer.quantities) if (sentence.quantities.has(term)) quantity += 1;
  // A digit in the answer matched by a number word in the text is evidence too: "8:00" ↔ "acht Uhr".
  const computedBridge = answer.digits.size > 0 && sentence.quantities.size > 0 ? 1 : 0;
  return { lexical, morphological, numeric, quantity, computedBridge };
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

const EVIDENCE_LABELS: Record<ReadingEvidence["kind"], string> = {
  verbatim: "موضع الدليل من النص بعد الالتزام",
  morphological: "الدليل في النص بصيغة صرفية مختلفة، لا نسخًا حرفيًا",
  computed: "موضع البيانات: العدد أو الزمن مكتوب في النص بشكل مختلف عن الجواب",
  ungrounded: "",
};

/**
 * Locates the sentence that actually carries the answer. When no sentence carries any answer key the
 * result is deliberately quoteless: inventing a "location" for an inferential question would teach the
 * learner to cite a line that does not support their answer.
 */
export function selectReadingEvidence(textDe: string, question: Question): ReadingEvidence {
  const sentences = textDe
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const ungrounded: ReadingEvidence = { policyVersion: READING_EVIDENCE_POLICY_VERSION, quote: null, kind: "ungrounded", labelAr: "" };
  if (!sentences.length) return ungrounded;

  const answerKeys = evidenceKeysFor(question.options[question.correctIndex] ?? "");
  const promptKeys = evidenceKeysFor(question.promptDe);
  let bestSentence = "";
  let bestScore = 0;
  let bestOverlap = { lexical: 0, morphological: 0, numeric: 0, quantity: 0, computedBridge: 0 };

  for (const sentence of sentences) {
    const sentenceKeys = evidenceKeysFor(sentence);
    const answer = keyOverlap(answerKeys, sentenceKeys);
    const prompt = keyOverlap(promptKeys, sentenceKeys);
    const score =
      answer.lexical * 4 + answer.numeric * 4 + answer.morphological * 2 + answer.quantity * 2 + answer.computedBridge * 2 +
      prompt.lexical * 1;
    const strength = answer.lexical + answer.numeric + answer.morphological + answer.quantity + answer.computedBridge;
    if (strength > 0 && score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
      bestOverlap = answer;
    }
  }

  if (!bestSentence) return ungrounded;
  const kind: ReadingEvidence["kind"] = bestOverlap.lexical > 0 || bestOverlap.numeric > 0
    ? "verbatim"
    : bestOverlap.morphological > 0
      ? "morphological"
      : "computed";
  return { policyVersion: READING_EVIDENCE_POLICY_VERSION, quote: bestSentence, kind, labelAr: EVIDENCE_LABELS[kind] };
}

export function readingEvidenceMap(textDe: string, questions: Question[]): Record<string, ReadingEvidence> {
  return Object.fromEntries(questions.map((question) => [question.id, selectReadingEvidence(textDe, question)]));
}
