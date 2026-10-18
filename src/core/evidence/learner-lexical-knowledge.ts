import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt, ReviewEvent } from "@/types/learning";
import { addSupport, contentWordTypes, isProperName, lessonSupportTexts, type LexicalLoadContext } from "@/core/content-validation/lexical-load";
import { foldGerman, lemmaKeys } from "@/core/german/lemmatizer";

/**
 * Per-learner, per-lemma evidence for a reading text (ADR-132, learning repair م17).
 *
 * The lexical-load audit (ADR-126) answers a curriculum question: "was this word supported by
 * earlier lessons?". This module answers the learner question the audit explicitly refused to
 * answer: "what has THIS learner shown about the words of this text?". It is derived from evidence
 * the app already stores, so it adds no state field, no migration and no export change.
 *
 * Two halves, so the lesson page does not ship the whole curriculum to the browser:
 *   - buildReadingLexiconSeed (server, at build time): for every content word of the reading text,
 *     its exact lemma keys, the lesson-card ids whose German front contains one of those keys, the
 *     lessons whose taught material covers it, and whether the current lesson teaches it before the
 *     reading stage.
 *   - profileReadingForLearner (browser): joins the seed with the learner's own review events,
 *     correct exercise answers and completed lessons.
 *
 * Evidence per word, oldest first; the most recent observation decides:
 *   - lesson-card review: grade 3 or more is a success; a delayed success is retrieval after a gap.
 *   - correct exercise answer containing the word: an in-lesson success. Wrong answers are NOT
 *     attributed to words: a wrong answer does not say which word failed, and guessing would
 *     invent weakness the learner never showed.
 *
 * Boundaries, stated so no screen overclaims:
 *   - Deterministic evidence tracking, not a vocabulary test and not a probability model.
 *   - A phrase card credits all of its content words together.
 *   - Only exact lemma candidates credit evidence. The audit's legacy "~stem" key is used for the
 *     "taught" check only, so Wohnung is never claimed as retrieved because wohnen was.
 *   - Personal error-remediation reviews are skipped: their card front is the wrong form.
 */
export const LEARNER_LEXICAL_KNOWLEDGE_POLICY = "learner-lemma-evidence-v1" as const;

/**
 * One content word of the reading text, as a compact tuple because one seed per lesson page travels
 * in the page payload:
 *   [0] folded word as it appears in the text;
 *   [1] first spelling in the text when it differs from the folded word (Bäckerei, Arbeit), else "";
 *   [2] hex bitmask over seed.lessonOrder: other lessons whose taught material covers the word
 *       (lemma keys, including the audit's legacy stem);
 *   [3] 1 when the current lesson teaches it before the reading stage (phrases, cards, vocabulary stage);
 *   [4] space-separated word-level card refs whose German front contains one of the exact lemma keys:
 *       base-36 lesson index + "c" (authored card) or "p" (phrase) + number; "=" + raw id otherwise.
 */
export type ReadingLexiconWord = [word: string, surface: string, taughtMask: string, beforeReading: 0 | 1, cardRefs: string];

export type ReadingLexiconSeed = {
  policyVersion: typeof LEARNER_LEXICAL_KNOWLEDGE_POLICY;
  lessonId: string;
  properNames: number;
  /** Lesson ids in curriculum order; bit i of a taught mask and lesson index i of a card ref. */
  lessonOrder: string[];
  words: ReadingLexiconWord[];
};

/** Bitmask helpers: 4 lessons per hex digit, lowest index first, trailing zeros dropped. */
export function encodeLessonMask(indexes: readonly number[], size: number): string {
  const digits = new Array<number>(Math.ceil(size / 4)).fill(0);
  for (const index of indexes) digits[index >> 2] |= 1 << (index & 3);
  return digits.map((digit) => digit.toString(16)).join("").replace(/0+$/, "");
}

export function maskIntersects(mask: string, indexes: ReadonlySet<number>): boolean {
  for (const index of indexes) { const digit = mask[index >> 2]; if (digit && (parseInt(digit, 16) >> (index & 3)) & 1) return true; }
  return false;
}

export function encodeCardRef(cardId: string, lessonIndex: ReadonlyMap<string, number>): string {
  const match = /^(.+)-(card|phrase)-(\d+)$/.exec(cardId);
  const index = match ? lessonIndex.get(match[1]) : undefined;
  return match && index !== undefined ? `${index.toString(36)}${match[2] === "card" ? "c" : "p"}${match[3]}` : `=${cardId}`;
}

export function decodeCardRef(ref: string, lessonOrder: readonly string[]): string {
  if (ref.startsWith("=")) return ref.slice(1);
  const match = /^([0-9a-z]+?)([cp])(\d+)$/.exec(ref);
  if (!match) return ref;
  return `${lessonOrder[parseInt(match[1], 36)] ?? ""}-${match[2] === "c" ? "card" : "phrase"}-${match[3]}`;
}

export type LearnerWordStatus = "retrieved" | "practised" | "struggling" | "taught-only" | "new";

export type LearnerReadingWord = { word: string; surface: string; status: LearnerWordStatus };

export type LearnerReadingProfile = {
  policyVersion: typeof LEARNER_LEXICAL_KNOWLEDGE_POLICY;
  contentWords: number;
  properNames: number;
  counts: Record<LearnerWordStatus, number>;
  words: LearnerReadingWord[];
  /** True once at least one word of this text has review or exercise evidence. */
  hasWordEvidence: boolean;
};

export type LearnerEvidenceInput = {
  reviewEvents: readonly ReviewEvent[];
  exerciseAttempts: readonly ExerciseAttempt[];
  completedLessonIds: readonly string[];
};

export const LEARNER_WORD_STATUSES: readonly LearnerWordStatus[] = ["struggling", "new", "taught-only", "practised", "retrieved"];

export function exactLemmaKeys(word: string, context: LexicalLoadContext): string[] {
  return lemmaKeys(word, context.dictionary, context.stem).filter((key) => !key.startsWith("~"));
}

/** Exact lemma keys of every non-name content word of a German text. */
export function textLemmaKeys(text: string, context: LexicalLoadContext): Set<string> {
  return new Set(contentWordTypes(text, context).filter((word) => !isProperName(word, context)).flatMap((word) => exactLemmaKeys(word, context)));
}

/** First spelling of each folded word as it appears in the text. */
export function surfaceForms(text: string): Map<string, string> {
  const forms = new Map<string, string>();
  for (const token of String(text ?? "").normalize("NFC").split(/[^\p{L}\p{N}]+/u)) {
    if (!token) continue;
    for (const folded of foldGerman(token).split(/\s+/)) if (folded && !forms.has(folded)) forms.set(folded, token);
  }
  return forms;
}

/**
 * Server side. `lessons` is the whole published sequence; `cards` every lesson SRS card (id + German
 * front); `vocabularyStage` the vocabulary-stage texts of a lesson, as in the curriculum audit.
 */
export function buildReadingLexiconSeed(
  lesson: FullLesson,
  lessons: readonly FullLesson[],
  cards: readonly { id: string; front: string }[],
  vocabularyStage: (lesson: FullLesson) => readonly string[],
  context: LexicalLoadContext,
  supportOf: (lesson: FullLesson) => ReadonlySet<string> = (item) => lessonTaughtKeys(item, vocabularyStage, context),
  cardKeysOf: (card: { id: string; front: string }) => ReadonlySet<string> = (card) => textLemmaKeys(card.front, context),
): ReadingLexiconSeed {
  const all = contentWordTypes(lesson.reading.textDe, context);
  const forms = surfaceForms(lesson.reading.textDe);
  const beforeReading = new Set<string>();
  for (const text of [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe), ...vocabularyStage(lesson)]) addSupport(beforeReading, text, context);
  const lessonIndex = new Map(lessons.map((item, index) => [item.id, index]));
  const words = all.filter((word) => !isProperName(word, context)).map((word): ReadingLexiconWord => {
    const keys = exactLemmaKeys(word, context);
    const supportKeys = lemmaKeys(word, context.dictionary, context.stem);
    const refs = cards.filter((card) => { const cardKeys = cardKeysOf(card); return keys.some((key) => cardKeys.has(key)); }).map((card) => encodeCardRef(card.id, lessonIndex));
    const taught = lessons.flatMap((other, index) => (other.id !== lesson.id && supportKeys.some((key) => supportOf(other).has(key)) ? [index] : []));
    const surface = forms.get(word) ?? word;
    return [word, surface === word ? "" : surface, encodeLessonMask(taught, lessons.length), supportKeys.some((key) => beforeReading.has(key)) ? 1 : 0, refs.join(" ")];
  });
  return { policyVersion: LEARNER_LEXICAL_KNOWLEDGE_POLICY, lessonId: lesson.id, properNames: all.length - words.length, lessonOrder: lessons.map((item) => item.id), words };
}

/** Everything a completed lesson has shown: phrases, cards, glossary and vocabulary stage (same exposure as the audit). */
export function lessonTaughtKeys(lesson: FullLesson, vocabularyStage: (lesson: FullLesson) => readonly string[], context: LexicalLoadContext): Set<string> {
  const keys = new Set<string>();
  for (const text of [...lessonSupportTexts(lesson), ...vocabularyStage(lesson)]) addSupport(keys, text, context);
  return keys;
}

type Observation = { at: string; success: boolean; delayed: boolean };

/** Browser side: joins the seed with this learner's own evidence. */
export function profileReadingForLearner(seed: ReadingLexiconSeed, input: LearnerEvidenceInput, context: LexicalLoadContext): LearnerReadingProfile {
  const completedIds = new Set(input.completedLessonIds);
  const completed = new Set(seed.lessonOrder.flatMap((id, index) => (completedIds.has(id) ? [index] : [])));
  const cardEvents = new Map<string, Observation[]>();
  for (const event of input.reviewEvents) {
    if (event.evidenceScope === "personal-error-remediation") continue;
    const list = cardEvents.get(event.cardId) ?? [];
    list.push({ at: event.reviewedAt, success: event.grade >= 3, delayed: event.evidenceKind === "delayed" });
    cardEvents.set(event.cardId, list);
  }
  const answers = input.exerciseAttempts.filter((attempt) => attempt.correct && /[a-zäöüß]/i.test(attempt.answer)).map((attempt) => ({ at: attempt.createdAt, keys: textLemmaKeys(attempt.answer, context) }));
  const words = seed.words.map(([word, surface, taughtMask, beforeReading, cardRefs]): LearnerReadingWord => {
    const observations: Observation[] = cardRefs ? cardRefs.split(" ").flatMap((ref) => cardEvents.get(decodeCardRef(ref, seed.lessonOrder)) ?? []) : [];
    const keys = exactLemmaKeys(word, context);
    for (const answer of answers) if (keys.some((key) => answer.keys.has(key))) observations.push({ at: answer.at, success: true, delayed: false });
    return { word, surface: surface || word, status: statusFrom(observations, beforeReading === 1 || maskIntersects(taughtMask, completed)) };
  });
  const counts: Record<LearnerWordStatus, number> = { retrieved: 0, practised: 0, struggling: 0, "taught-only": 0, new: 0 };
  for (const word of words) counts[word.status] += 1;
  return { policyVersion: LEARNER_LEXICAL_KNOWLEDGE_POLICY, contentWords: words.length, properNames: seed.properNames, counts, words, hasWordEvidence: counts.retrieved + counts.practised + counts.struggling > 0 };
}

export function statusFrom(observations: readonly Observation[], taught: boolean): LearnerWordStatus {
  if (!observations.length) return taught ? "taught-only" : "new";
  const latest = observations.reduce((best, item) => (item.at >= best.at ? item : best));
  if (!latest.success) return "struggling";
  return observations.some((item) => item.success && item.delayed) ? "retrieved" : "practised";
}
