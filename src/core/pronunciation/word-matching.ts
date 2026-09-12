import { localPronunciationModelRegistry } from "@/config/local-pronunciation-model-registry";

export type LocalWordMatchItem = {
  word: string;
  normalized: string;
  status: "heard" | "unconfirmed";
};

export type LocalWordMatchResult = {
  policyVersion: typeof localPronunciationModelRegistry.policyVersion;
  transcript: string;
  words: LocalWordMatchItem[];
  heardCount: number;
  expectedCount: number;
  feedbackAr: string[];
  evaluationBoundary: typeof localPronunciationModelRegistry.evaluationBoundary;
};

export function normalizeGermanWord(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("de-DE").replace(/ß/gu, "ss").replace(/[^a-zäöü]/gu, "");
}

export function germanWords(value: string): string[] {
  return (value.normalize("NFC").match(/[A-Za-zÄÖÜäöüß]+/gu) ?? []).map((word) => word.trim()).filter(Boolean);
}

function expectedUniqueWords(phrases: string[]) {
  const seen = new Set<string>();
  const words: Array<{ word: string; normalized: string }> = [];
  for (const word of phrases.flatMap(germanWords)) {
    const normalized = normalizeGermanWord(word);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    words.push({ word, normalized });
  }
  return words;
}

export function matchExpectedGermanWords(transcript: string, expectedPhrases: string[]): LocalWordMatchResult {
  const heard = new Set(germanWords(transcript).map(normalizeGermanWord).filter(Boolean));
  const words: LocalWordMatchItem[] = expectedUniqueWords(expectedPhrases).map((item) => ({
    ...item,
    status: heard.has(item.normalized) ? "heard" : "unconfirmed",
  }));
  const unconfirmed = words.filter((item) => item.status === "unconfirmed");
  const heardCount = words.length - unconfirmed.length;
  const feedbackAr = unconfirmed.slice(0, localPronunciationModelRegistry.maximumFeedbackItems).map((item) => `لم يستطع النموذج تأكيد «${item.word}». استمع إلى الكلمة وسجّلها مرة أخرى؛ قد يكون السبب النطق أو الضوضاء أو الميكروفون.`);
  if (words.length > 0 && unconfirmed.length === 0) feedbackAr.push("استطاع النموذج التعرف على جميع الكلمات المستهدفة. هذا يثبت مطابقة الكلمات فقط، ولا يثبت نطق الأصوات أو اللهجة أو الطلاقة.");
  if (words.length > 0 && heardCount === 0) feedbackAr.unshift("لم يتعرف النموذج بثقة على الكلمات المستهدفة. افحص الميكروفون والضوضاء قبل اعتبار النطق سببًا.");
  return {
    policyVersion: localPronunciationModelRegistry.policyVersion,
    transcript: transcript.normalize("NFC").replace(/\s+/gu, " ").trim(),
    words,
    heardCount,
    expectedCount: words.length,
    feedbackAr: feedbackAr.slice(0, localPronunciationModelRegistry.maximumFeedbackItems),
    evaluationBoundary: localPronunciationModelRegistry.evaluationBoundary,
  };
}
