import { a1NounGrammarEntries, a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2NounGrammarEntries, a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { groupByLesson } from "./lexical-grammar-build";
import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

/**
 * السجل الموحّد لبيانات الاسم والفعل البنيوية.
 * A1 = 96 اسمًا و24 إطارًا · A2 = 96 اسمًا و48 إطارًا · B1 وB2 لم تؤلف بعد.
 */
export const nounGrammarEntries: NounGrammarEntry[] = [...a1NounGrammarEntries, ...a2NounGrammarEntries];
export const verbPrepositionFrames: VerbPrepositionFrame[] = [...a1VerbPrepositionFrames, ...a2VerbPrepositionFrames];

export const nounsByLesson = groupByLesson(nounGrammarEntries);
export const framesByLesson = groupByLesson(verbPrepositionFrames);

export const LEXICAL_GRAMMAR_LEVELS = {
  A1: { nounsPerLesson: 4, framesPerLesson: 1, lessons: 24 },
  A2: { nounsPerLesson: 4, framesPerLesson: 2, lessons: 24 },
} as const;

export type LexicalGrammarLevel = keyof typeof LEXICAL_GRAMMAR_LEVELS;

export function lexicalLevelOf(lessonId: string): LexicalGrammarLevel | null {
  const prefix = lessonId.slice(0, 2).toUpperCase();
  return prefix === "A1" || prefix === "A2" ? prefix : null;
}

export const lexicalGrammarCoverage = {
  levels: Object.fromEntries(
    Object.entries(LEXICAL_GRAMMAR_LEVELS).map(([level, rule]) => [
      level,
      {
        ...rule,
        nounRecords: nounGrammarEntries.filter((entry) => lexicalLevelOf(entry.lessonId) === level).length,
        frameRecords: verbPrepositionFrames.filter((entry) => lexicalLevelOf(entry.lessonId) === level).length,
        coveredLessons: new Set(
          nounGrammarEntries.filter((entry) => lexicalLevelOf(entry.lessonId) === level).map((entry) => entry.lessonId),
        ).size,
      },
    ]),
  ),
  pendingLevels: ["B1", "B2"],
  boundaryAr:
    "هذه مراسي اسمية وإطارات فعل مختارة من نظرية كل درس ومفرداته، وليست تغطية كاملة لكل أسماء A1–A2 ولا لكل فعل ذي متمم جرّي، ولا مراجعة أكاديمية بشرية مستقلة.",
} as const;
