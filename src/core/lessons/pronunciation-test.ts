import type { FullLesson } from "@/types/lesson-content";

/**
 * عنصر نطق إلزامي في اختبار كل درس (البند P1-22 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: كتلة النطق موجودة في 96/96 درسًا (576 بندًا)، لكنها **قراءة وتقليد**،
 * ولا وزن لها في تقويم الدرس: 33.3% تغطية وسيطة في الاختبارات ولا عنصر نطق مضمون في أي
 * اختبار. الضرر: المتعلّم الذي يقرأ الأصوات ولا يميّزها يمرّ إلى الدرس التالي بثقة كاذبة.
 *
 * التنفيذ هنا **اشتقاق** لا تأليف جديد: لكل درس نأخذ بنود نطقه المؤلَّفة (الكلمة + الرمز
 * الصوتي + المعنى) ونبني منها سؤال تمييز واحدًا: يُعرض رمز صوتي واحد صحيح من الدرس نفسه
 * وثلاثة رموز مشتّتة **من بنود الدرس نفسه** أيضًا، فلا يُختلق رمز صوتي جديد ولا يُستعار من
 * درس آخر. هذا يفسّر ما دُرِّس فعلًا، ولا يدّعي أن التطبيق يسمع نطق المتعلّم.
 */
export const PRONUNCIATION_TEST_POLICY = "lesson-pronunciation-item-v1" as const;
export const PRONUNCIATION_TEST_BOUNDARY = "ipa-discrimination-item-no-acoustic-verification-of-the-learner" as const;

export type DerivedPronunciationItem = {
  id: string;
  policyVersion: typeof PRONUNCIATION_TEST_POLICY;
  boundary: typeof PRONUNCIATION_TEST_BOUNDARY;
  lessonId: string;
  /** الكلمة المستهدفة من كتلة النطق المؤلَّفة. */
  wordDe: string;
  meaningAr: string;
  promptAr: string;
  promptDe: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
  /** هل الاختبار الأصلي للدرس يحتوي عنصر نطق مؤلَّفًا بالفعل؟ */
  authoredItemExists: boolean;
};

const IPA = /\[[^\]]+\]/u;

/** سؤال تمييز واحد لكل درس، أو null إن كانت كتلة النطق أقل من ثلاث كلمات مختلفة الرموز. */
export function derivePronunciationTestCase(lesson: FullLesson): DerivedPronunciationItem | null {
  const items = lesson.pronunciation?.items ?? [];
  const distinct = items.filter((item, index, all) => item.ipa && IPA.test(item.ipa) && all.findIndex((other) => other.ipa === item.ipa) === index);
  if (distinct.length < 3) return null;
  const target = distinct[0];
  const distractors = distinct.slice(1, 4).map((item) => item.ipa);
  if (distractors.length < 3) return null;
  const options = [target.ipa, ...distractors];
  // ترتيب ثابت مشتقّ من معرّف الدرس كي لا يتغيّر السؤال بين جلسات المراجعة، ولا يكون الجواب أولًا دائمًا.
  const seed = [...lesson.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const correctIndex = seed % options.length;
  [options[0], options[correctIndex]] = [options[correctIndex], options[0]];
  return {
    id: `${lesson.id}-pron-test`,
    policyVersion: PRONUNCIATION_TEST_POLICY,
    boundary: PRONUNCIATION_TEST_BOUNDARY,
    lessonId: lesson.id,
    wordDe: target.de,
    meaningAr: target.ar,
    promptAr: `أيّ رمز صوتي يطابق «${target.de}» (${target.ar}) كما دُرِّس في هذا الدرس؟`,
    promptDe: `Aussprache: ${target.de} — wie klingt das?`,
    options,
    correctIndex,
    explanationAr: `مدار الدرس: ${lesson.pronunciation.focus}. الصواب ${target.ipa} لكلمة ${target.de}. التمييز بين الرموز تدريب سمعي على ما دُرِّس، ولا يعني أن التطبيق قاس نطقك.`,
    authoredItemExists: lesson.miniTest.some((question) => IPA.test(`${question.promptDe} ${question.promptAr} ${question.explanationAr}`) || /نطق|Aussprache/u.test(`${question.promptAr} ${question.promptDe}`)),
  };
}

export type PronunciationTestCoverage = {
  policyVersion: typeof PRONUNCIATION_TEST_POLICY;
  lessons: number;
  withDerivedItem: number;
  withAuthoredItem: number;
  missing: string[];
  all_distinct_options: boolean;
};

export function pronunciationTestCoverage(lessons: readonly FullLesson[]): PronunciationTestCoverage {
  const derived = lessons.map((lesson) => ({ lesson, item: derivePronunciationTestCase(lesson) }));
  return {
    policyVersion: PRONUNCIATION_TEST_POLICY,
    lessons: lessons.length,
    withDerivedItem: derived.filter((row) => row.item !== null).length,
    withAuthoredItem: derived.filter((row) => row.item?.authoredItemExists).length,
    missing: derived.filter((row) => row.item === null).map((row) => row.lesson.id),
    all_distinct_options: derived.every((row) => {
      if (!row.item) return true;
      const correct = row.item.options[row.item.correctIndex];
      return new Set(row.item.options).size === row.item.options.length && row.item.options.every((option) => IPA.test(option)) && row.item.options.includes(correct);
    }),
  };
}
