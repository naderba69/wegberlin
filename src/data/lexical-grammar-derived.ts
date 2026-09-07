/**
 * P0-99: الإطارات المشتقة من قاموس التكافؤ + جدول التغطية المقاسة.
 *
 * بعد أن يقيس الجرد (`verb-preposition-coverage`) أن فعلًا ذا متمم جرّي يقع فعلًا في نص
 * الدرس ولا يوجد له إطار مؤلف، يُنشأ له إطار «مشتق» من القاموس: نفس Chunk والمثال
 * والمقارنة العربية المؤلفة لمدخل القاموس، مع `origin: "derived"` حتى يبقى الفرق بين
 * الإطار المؤلف خصيصًا للدرس والإطار المشتق من الجرد ظاهرًا في البيانات والتقارير.
 *
 * لا يُشتق أي إطار لمدخل لم يقع في نص الدرس، ولا يُكرَّر إطار موجود في الدرس نفسه.
 */
import { academicLessonList } from "./academic-lessons";
import { a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { b1VerbPrepositionFrames } from "./lexical-grammar-b1";
import { b2VerbPrepositionFrames } from "./lexical-grammar-b2";
import { buildDerivedFrame } from "./lexical-grammar-build";
import { frameKeyOf } from "./verb-preposition-dictionary";
import {
  buildLessonVerbCoverage,
  gapEntriesFor,
  measuredTargetsByLesson,
  summarizeCoverage,
  type LessonVerbCoverage,
  type VerbCoverageSummary,
} from "./verb-preposition-coverage";
import type { LexicalSourceVersion, VerbPrepositionFrame } from "@/types/lexical-grammar";

const authoredFrames = [
  ...a1VerbPrepositionFrames,
  ...a2VerbPrepositionFrames,
  ...b1VerbPrepositionFrames,
  ...b2VerbPrepositionFrames,
];

/** مفاتيح الإطارات المؤلفة لكل درس. */
const authoredKeysByLesson = new Map<string, Set<string>>();
for (const frame of authoredFrames) {
  const key = frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase);
  const set = authoredKeysByLesson.get(frame.lessonId) ?? new Set<string>();
  set.add(key);
  authoredKeysByLesson.set(frame.lessonId, set);
}

export function hasAuthoredFrame(lessonId: string, entryId: string): boolean {
  return authoredKeysByLesson.get(lessonId)?.has(entryId) ?? false;
}

/** التغطية المقاسة قبل الاشتقاق: ماذا وجد الجرد، وماذا كان مؤلفًا من قبل؟ */
export const lessonVerbCoverage: Record<string, LessonVerbCoverage> = buildLessonVerbCoverage(hasAuthoredFrame);
export const verbCoverageSummary: VerbCoverageSummary = summarizeCoverage(lessonVerbCoverage);

const sourceVersionFor = (lessonId: string): LexicalSourceVersion =>
  `${lessonId.slice(0, 2).toLowerCase()}-lexical-grammar-v1` as LexicalSourceVersion;

/** إطارات مشتقة لكل درس، مرتّبة حسب ترتيب القاموس (أي حسب ترتيب القياس). */
export const derivedFramesByLesson: Record<string, VerbPrepositionFrame[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const entries = gapEntriesFor(lesson.id, hasAuthoredFrame);
    const sourceVersion = sourceVersionFor(lesson.id);
    return [
      lesson.id,
      entries.map((entry, index) => buildDerivedFrame(lesson.id, entry, index + 1000, sourceVersion)),
    ];
  }),
);

export const derivedFrames: VerbPrepositionFrame[] = Object.values(derivedFramesByLesson).flat();

export const derivedFrameCount = derivedFrames.length;

/** عدد الأهداف المقاسة لكل درس، لأجل التقارير. */
export const measuredTargetsByLessonId = measuredTargetsByLesson;
