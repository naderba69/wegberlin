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

function buildMatchResult(transcript: string, words: LocalWordMatchItem[]): LocalWordMatchResult {
  const unconfirmed = words.filter((item) => item.status === "unconfirmed");
  const heardCount = words.length - unconfirmed.length;
  const feedbackAr = unconfirmed
    .slice(0, localPronunciationModelRegistry.maximumFeedbackItems)
    .map((item) => `لم يستطع النموذج تأكيد «${item.word}». استمع إلى الكلمة ثم أعد العبارة كاملة؛ قد يكون السبب النطق أو الضوضاء أو الميكروفون.`);
  if (words.length > 0 && unconfirmed.length === 0) feedbackAr.push("استطاع النموذج التعرف على جميع الكلمات المستهدفة وبترتيبها. هذا يثبت مطابقة الكلمات فقط، ولا يثبت تحليل الفونيمات أو اللهجة أو الطلاقة.");
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

export function matchExpectedGermanWords(transcript: string, expectedPhrases: string[]): LocalWordMatchResult {
  const heard = new Set(germanWords(transcript).map(normalizeGermanWord).filter(Boolean));
  const words: LocalWordMatchItem[] = expectedUniqueWords(expectedPhrases).map((item) => ({
    ...item,
    status: heard.has(item.normalized) ? "heard" : "unconfirmed",
  }));
  return buildMatchResult(transcript, words);
}

/**
 * Aligns one known target phrase against a transcript in sequence. Unlike the
 * vocabulary-wide matcher, repeated words stay repeated and a reordered
 * utterance cannot complete the phrase merely because its word set matches.
 */
export function matchExpectedGermanPhrase(transcript: string, expectedPhrase: string): LocalWordMatchResult {
  const expected = germanWords(expectedPhrase).map((word) => ({ word, normalized: normalizeGermanWord(word) }));
  const heard = germanWords(transcript).map(normalizeGermanWord).filter(Boolean);
  const rows = expected.length + 1;
  const columns = heard.length + 1;
  const lengths = Array.from({ length: rows }, () => new Uint16Array(columns));
  for (let expectedIndex = 1; expectedIndex < rows; expectedIndex += 1) {
    for (let heardIndex = 1; heardIndex < columns; heardIndex += 1) {
      lengths[expectedIndex][heardIndex] = expected[expectedIndex - 1].normalized === heard[heardIndex - 1]
        ? lengths[expectedIndex - 1][heardIndex - 1] + 1
        : Math.max(lengths[expectedIndex - 1][heardIndex], lengths[expectedIndex][heardIndex - 1]);
    }
  }
  const matchedExpectedIndexes = new Set<number>();
  let expectedIndex = expected.length;
  let heardIndex = heard.length;
  while (expectedIndex > 0 && heardIndex > 0) {
    if (expected[expectedIndex - 1].normalized === heard[heardIndex - 1]) {
      matchedExpectedIndexes.add(expectedIndex - 1);
      expectedIndex -= 1;
      heardIndex -= 1;
    } else if (lengths[expectedIndex - 1][heardIndex] >= lengths[expectedIndex][heardIndex - 1]) expectedIndex -= 1;
    else heardIndex -= 1;
  }
  return buildMatchResult(transcript, expected.map((item, index) => ({
    ...item,
    status: matchedExpectedIndexes.has(index) ? "heard" : "unconfirmed",
  })));
}
