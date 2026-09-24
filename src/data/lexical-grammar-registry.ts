import { a1NounGrammarEntries, a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2NounGrammarEntries, a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { b1NounGrammarEntries, b1VerbPrepositionFrames } from "./lexical-grammar-b1";
import { b2NounGrammarEntries, b2VerbPrepositionFrames } from "./lexical-grammar-b2";

function groupByLesson<T extends { lessonId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.lessonId] = [...(groups[item.lessonId] ?? []), item];
    return groups;
  }, {});
}

export const nounGrammarEntries = [...a1NounGrammarEntries, ...a2NounGrammarEntries, ...b1NounGrammarEntries, ...b2NounGrammarEntries];
export const verbPrepositionFrames = [...a1VerbPrepositionFrames, ...a2VerbPrepositionFrames, ...b1VerbPrepositionFrames, ...b2VerbPrepositionFrames];
export const nounsByLesson = groupByLesson(nounGrammarEntries);
export const verbFramesByLesson = groupByLesson(verbPrepositionFrames);

/**
 * `lessons` is derived from the anchor rows themselves (how many lessons actually carry anchors)
 * instead of a literal, so adding a lesson cannot leave the coverage table claiming an old total.
 */
function coverageFor(nouns: { lessonId: string }[], frames: { lessonId: string }[]) {
  return {
    lessons: new Set(nouns.map((entry) => entry.lessonId)).size,
    nounEntries: nouns.length,
    verbFrames: frames.length,
  };
}

export const lexicalGrammarCoverage = {
  A1: coverageFor(a1NounGrammarEntries, a1VerbPrepositionFrames),
  A2: coverageFor(a2NounGrammarEntries, a2VerbPrepositionFrames),
  B1: coverageFor(b1NounGrammarEntries, b1VerbPrepositionFrames),
  B2: coverageFor(b2NounGrammarEntries, b2VerbPrepositionFrames),
} as const;
