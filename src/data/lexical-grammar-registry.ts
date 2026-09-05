import { a1NounGrammarEntries, a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2NounGrammarEntries, a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { b1NounGrammarEntries, b1VerbPrepositionFrames } from "./lexical-grammar-b1";
import { b2NounGrammarEntries, b2VerbPrepositionFrames } from "./lexical-grammar-b2";
import { derivedFrames } from "./lexical-grammar-derived";
import { inventoryNouns } from "./noun-inventory";
import { groupByLesson } from "./lexical-grammar-build";
import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

/**
 * السجل الموحّد لبيانات الاسم والفعل البنيوية عبر كل المستويات المنشورة.
 * الأسماء = 336 مرسى مؤلفًا (A1 96 · A2 96 · B1 96 · B2 48) + 222 سجلًا مشتقًا من
 * جرد أسماء مسرد القراءة (المجموع 558).
 * الإطارات = مؤلفة + مشتقة من جرد التكافؤ المقاس:
 * A1 24+24=48 · A2 48+32=80 · B1 48+34=82 · B2 24+24=48 (المجموع 258).
 */
export const nounGrammarEntries: NounGrammarEntry[] = [
  ...a1NounGrammarEntries,
  ...a2NounGrammarEntries,
  ...b1NounGrammarEntries,
  ...b2NounGrammarEntries,
  ...inventoryNouns,
];
export const verbPrepositionFrames: VerbPrepositionFrame[] = [
  ...a1VerbPrepositionFrames,
  ...a2VerbPrepositionFrames,
  ...b1VerbPrepositionFrames,
  ...b2VerbPrepositionFrames,
  ...derivedFrames,
];

export const nounsByLesson = groupByLesson(nounGrammarEntries);
export const framesByLesson = groupByLesson(verbPrepositionFrames);

/** framesPerLesson هو الحد الأدنى المؤلف لكل درس؛ التغطية الكاملة يقيسها جرد التكافؤ. */
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
    "توسيع قاموس التكافؤ ليشمل أفعالًا جرّية أخرى قد يفوتها الجرد الحالي",
    "مراجعة ألمانية بشرية مستقلة لكل صيغة Genitiv وجمع مجرور وإطار فعل",
  ],
  boundaryAr:
    "كل الدروس الـ84 المنشورة تملك الآن مراسي اسمية مؤلفة بصيغ Genitiv والمجرور، وإطارات فعل تغطي كل فعل ذي متمم جرّي قاسه الجرد داخل نص الدرس نفسه. حدّ الجرد معلن: يقيس الأشكال التصريفية المدرجة في القاموس ولا يستخدم مُعلّمًا صرفيًا، فلا يساوي مراجعة أكاديمية بشرية مستقلة، ولا يغطي أفعالًا جرّية غير مدرجة في القاموس.",
} as const;
