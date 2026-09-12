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

export const lexicalGrammarCoverage = {
  A1: { lessons: 24, nounEntries: a1NounGrammarEntries.length, verbFrames: a1VerbPrepositionFrames.length },
  A2: { lessons: 24, nounEntries: a2NounGrammarEntries.length, verbFrames: a2VerbPrepositionFrames.length },
  B1: { lessons: 24, nounEntries: b1NounGrammarEntries.length, verbFrames: b1VerbPrepositionFrames.length },
  B2: { lessons: 12, nounEntries: b2NounGrammarEntries.length, verbFrames: b2VerbPrepositionFrames.length },
} as const;
