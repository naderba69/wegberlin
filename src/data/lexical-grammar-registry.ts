import { a1NounGrammarEntries, a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2NounGrammarEntries, a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { b1NounGrammarEntries, b1VerbPrepositionFrames } from "./lexical-grammar-b1";
import { b2NounGrammarEntries, b2VerbPrepositionFrames } from "./lexical-grammar-b2";
import { groupByLesson } from "./lexical-grammar-build";
import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

/**
 * السجل الموحّد لبيانات الاسم والفعل البنيوية عبر كل المستويات المنشورة.
 * A1: 96 اسمًا و24 إطارًا · A2: 96 و48 · B1: 96 و48 · B2: 48 و24.
 */
export const nounGrammarEntries: NounGrammarEntry[] = [
  ...a1NounGrammarEntries,
  ...a2NounGrammarEntries,
  ...b1NounGrammarEntries,
  ...b2NounGrammarEntries,
];
export const verbPrepositionFrames: VerbPrepositionFrame[] = [
  ...a1VerbPrepositionFrames,
  ...a2VerbPrepositionFrames,
  ...b1VerbPrepositionFrames,
  ...b2VerbPrepositionFrames,
];

export const nounsByLesson = groupByLesson(nounGrammarEntries);
export const framesByLesson = groupByLesson(verbPrepositionFrames);

export const LEXICAL_GRAMMAR_LEVELS = {
  A1: { nounsPerLesson: 4, framesPerLesson: 1, lessons: 24 },
  A2: { nounsPerLesson: 4, framesPerLesson: 2, lessons: 24 },
  B1: { nounsPerLesson: 4, framesPerLesson: 2, lessons: 24 },
  B2: { nounsPerLesson: 4, framesPerLesson: 2, lessons: 12 },
} as const;

export type LexicalGrammarLevel = keyof typeof LEXICAL_GRAMMAR_LEVELS;

export function lexicalLevelOf(lessonId: string): LexicalGrammarLevel | null {
  const prefix = lessonId.slice(0, 2).toUpperCase();
  return prefix === "A1" || prefix === "A2" || prefix === "B1" || prefix === "B2" ? prefix : null;
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
  pendingLevels: [] as string[],
  pendingWork: [
    "تدقيق كل اسم هدف في A1–B2 لا المراسي الأربعة فقط",
    "تغطية كل فعل ذي متمم جرّي مستهدف، لا إطارًا أو إطارين في الدرس",
    "تأليف صيغة Genitiv الاسمية وجمع المجرور داخل سجل الاسم",
    "مراجعة ألمانية بشرية مستقلة",
  ],
  boundaryAr:
    "كل الدروس الـ84 المنشورة تملك الآن مراسي اسمية وإطارات فعل مؤلفة ومدققة بنيويًا، لكن هذه مراسي مختارة من نظرية كل درس: لا تغطي كل أسماء المنهج ولا كل فعل ذي متمم جرّي، ولا تساوي مراجعة أكاديمية بشرية مستقلة.",
} as const;
