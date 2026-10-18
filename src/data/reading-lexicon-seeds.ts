import type { FullLesson } from "@/types/lesson-content";
import { academicLessonList, academicLessons } from "./academic-lessons";
import { reviewCards } from "./review-cards";
import { nounsByLesson, verbFramesByLesson } from "./lexical-grammar-registry";
import { vocabularyStageVisibleTexts } from "@/core/lesson/vocabulary-stage";
import { curriculumLexicalContext } from "@/core/german/curriculum-lexical-context";
import { buildReadingLexiconSeed, lessonTaughtKeys, textLemmaKeys, type ReadingLexiconSeed } from "@/core/evidence/learner-lexical-knowledge";

/**
 * Build-time seeds for the learner reading profile (ADR-132). Imported only by the lesson page
 * (a server component), so the curriculum and the card list never reach the browser bundle; the
 * browser receives one small seed per lesson as a prop.
 */
const vocabularyStage = (lesson: FullLesson) => vocabularyStageVisibleTexts(nounsByLesson[lesson.id] ?? [], verbFramesByLesson[lesson.id] ?? [], lesson.reading.textDe);
/** Word-level cards only (authored flashcards and lesson phrases). Example-sentence and error cards test a sentence, not a word. */
const lexicalCards = reviewCards.filter((card) => card.tags.includes("authored") || card.tags.includes("phrase"));
const taughtCache = new Map<string, ReadonlySet<string>>();
const cardKeyCache = new Map<string, ReadonlySet<string>>();

export function readingLexiconSeed(lessonId: string): ReadingLexiconSeed | null {
  const lesson = academicLessons[lessonId];
  if (!lesson) return null;
  const context = curriculumLexicalContext();
  const supportOf = (item: FullLesson) => {
    let keys = taughtCache.get(item.id);
    if (!keys) { keys = lessonTaughtKeys(item, vocabularyStage, context); taughtCache.set(item.id, keys); }
    return keys;
  };
  const cardKeysOf = (card: { id: string; front: string }) => {
    let keys = cardKeyCache.get(card.id);
    if (!keys) { keys = textLemmaKeys(card.front, context); cardKeyCache.set(card.id, keys); }
    return keys;
  };
  return buildReadingLexiconSeed(lesson, academicLessonList, lexicalCards, vocabularyStage, context, supportOf, cardKeysOf);
}
