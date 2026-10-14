import type { FullLesson } from "@/types/lesson-content";

/**
 * يجد الاقتباسات الألمانية «…» داخل شروح الإجابات (explanationAr) التي لا ترد حرفيًا
 * في المحتوى الألماني للدرس نفسه. لا يفرّق وحده بين «بديل مرفوض مقصود» و«دليل مُحرَّف»:
 * هذا التمييز يقرّره مراجع بشري، ولذلك تُسجَّل النتائج في قائمة استثناءات مسمّاة.
 */
export type UnquotedExplanationQuote = { lessonId: string; quote: string };

export function normalizeQuoteText(text: string): string {
  return text.normalize("NFC").replace(/[“”„‟"]/g, '"').replace(/[‘’‚‛']/g, "'").replace(/\s+/g, " ").trim();
}

function isGermanQuote(quote: string): boolean {
  const withoutArabic = quote.replace(/[\u0600-\u06FF]/g, "");
  return /[A-Za-zÄÖÜäöüß]{3,}/.test(withoutArabic) && withoutArabic.trim().length >= 6;
}

export function findUnquotedExplanationQuotes(lessons: readonly FullLesson[]): UnquotedExplanationQuote[] {
  const found: UnquotedExplanationQuote[] = [];
  for (const lesson of lessons) {
    const explanations: string[] = [];
    const corpusSource = JSON.stringify(lesson, (key, value) => {
      if (key === "explanationAr" && typeof value === "string") {
        explanations.push(value);
        return undefined;
      }
      return value;
    });
    const corpus = normalizeQuoteText(corpusSource.replace(/\\"/g, '"'));
    const seen = new Set<string>();
    for (const explanation of explanations) {
      for (const match of explanation.matchAll(/«([^»]+)»/g)) {
        const quote = match[1];
        if (!isGermanQuote(quote)) continue;
        const key = normalizeQuoteText(quote);
        if (seen.has(key)) continue;
        seen.add(key);
        if (!corpus.includes(key)) found.push({ lessonId: lesson.id, quote });
      }
    }
  }
  return found;
}
