import type { FullLesson } from "@/types/lesson-content";
import type { CEFRLevel } from "@/types/learning";
import { foldGerman, lemmaKeys, type LemmaDictionary } from "@/core/german/lemmatizer";

/**
 * Lexical load of reading texts and long inputs (ADR-126, P2-401).
 *
 * "Unknown" means "not supported by earlier curricular exposure". It never means "the
 * learner does not know the word". Words are compared as lemma candidates, so spricht/sprechen,
 * Sätze/Satz and abgeschlossen/abschließen count as the same word. Proper names are excluded and
 * counted separately.
 */
export const LEXICAL_LOAD_POLICY = "lemmatized-lexical-load-v1" as const;
const LEVEL_ORDER: readonly CEFRLevel[] = ["A1", "A2", "B1", "B2"];

export type LexicalLoadContext = {
  dictionary: LemmaDictionary;
  stopWords: ReadonlySet<string>;
  properNames: ReadonlySet<string>;
  stem: (word: string) => string;
};

export function createLexicalLoadContext(input: { dictionary: LemmaDictionary; stopWords: Iterable<string>; properNames: Iterable<string>; stem: (word: string) => string }): LexicalLoadContext {
  return {
    dictionary: input.dictionary,
    stopWords: new Set([...input.stopWords].map((word) => foldGerman(word).trim()).filter(Boolean)),
    properNames: new Set([...input.properNames].map((word) => foldGerman(word).trim()).filter(Boolean)),
    stem: input.stem,
  };
}

/** Distinct content-word types of a German text (folded, >2 letters, no digits, no stop words). */
export function contentWordTypes(text: string, context: LexicalLoadContext): string[] {
  return [...new Set(foldGerman(text).split(/\s+/).filter((word) => word.length > 2 && !/^\d+$/.test(word) && !context.stopWords.has(word)))];
}

export function isProperName(word: string, context: LexicalLoadContext): boolean {
  return context.properNames.has(word) || (word.endsWith("s") && context.properNames.has(word.slice(0, -1)));
}

export function addSupport(bag: Set<string>, text: string, context: LexicalLoadContext): void {
  for (const word of contentWordTypes(text, context)) for (const key of lemmaKeys(word, context.dictionary, context.stem)) bag.add(key);
}

export function lessonSupportTexts(lesson: FullLesson): string[] {
  return [
    ...lesson.phrases.map((phrase) => phrase.de),
    ...lesson.flashcards.map((card) => card.frontDe),
    ...lesson.reading.glossary.flatMap((entry) => [entry.surfaceForm, entry.lemma]),
  ];
}

export type LexicalLoadRow = { id: string; level: CEFRLevel; contentTypes: number; properNames: number; unknown: string[]; pct: number };

export function measureText(id: string, level: CEFRLevel, text: string, support: ReadonlySet<string>, context: LexicalLoadContext): LexicalLoadRow {
  const all = contentWordTypes(text, context);
  const names = all.filter((word) => isProperName(word, context));
  const words = all.filter((word) => !isProperName(word, context));
  const unknown = words.filter((word) => !lemmaKeys(word, context.dictionary, context.stem).some((key) => support.has(key)));
  return { id, level, contentTypes: words.length, properNames: names.length, unknown, pct: Number(((100 * unknown.length) / Math.max(1, words.length)).toFixed(1)) };
}

/**
 * Reading texts under prior-sequence support: every earlier lesson (phrases, cards, glossary)
 * plus the current lesson's phrases and cards, which are taught before the reading. The current
 * glossary and all later lessons are excluded.
 */
export function measureReadingLoad(lessons: readonly FullLesson[], context: LexicalLoadContext): LexicalLoadRow[] {
  const prior = new Set<string>();
  return lessons.map((lesson) => {
    const support = new Set(prior);
    for (const text of [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)]) addSupport(support, text, context);
    const row = measureText(lesson.id, lesson.level, lesson.reading.textDe, support, context);
    for (const text of lessonSupportTexts(lesson)) addSupport(prior, text, context);
    return row;
  });
}

/** Long inputs: every lesson up to and including the input's level, plus the input's own glossary shown beside it. */
export function measureLongInputLoad(tasks: readonly { id: string; level: CEFRLevel; text: string; glossary: readonly string[] }[], lessons: readonly FullLesson[], context: LexicalLoadContext): LexicalLoadRow[] {
  return tasks.map((task) => {
    const support = new Set<string>();
    for (const lesson of lessons) if (LEVEL_ORDER.indexOf(lesson.level) <= LEVEL_ORDER.indexOf(task.level)) for (const text of lessonSupportTexts(lesson)) addSupport(support, text, context);
    for (const entry of task.glossary) addSupport(support, entry, context);
    return measureText(task.id, task.level, task.text, support, context);
  });
}

export function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0;
}
