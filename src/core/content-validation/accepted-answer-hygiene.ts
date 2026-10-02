import { normalizeGermanText } from "@/core/lesson/evaluate";
import type { PracticeExercise } from "@/types/lesson-content";

/**
 * Accepted-answer hygiene: an exercise may only claim more than one accepted form when every listed
 * form survives normalization.
 *
 * Why this guard exists (measured 2026-09-23 on main): `normalizeGermanText` already lowercases and
 * strips `. ! ? , : ; ، „ “ " '`, so a second variant such as `"Wie heißt du?"` next to
 * `"Wie heißt du"` is unreachable — the grader can never tell the two apart. 150 such entries were
 * listed across 146 exercises, and they made the productive-breadth figure read 50.9% (197/387)
 * while the tree actually accepted exactly one string in 338 of 387 exercises (87.3%).
 *
 * The failure mode is therefore not a grading bug; it is a *measurement* bug: breadth can be bought
 * with a capital letter or a full stop without widening what the learner is allowed to type.
 * P1-398's ceiling (<=25% single-string productive exercises) can only be evaluated against the
 * distinct-normalized basis below.
 *
 * This module is pure: it reads exercise objects and never touches the lesson data, so both the
 * unit guard and the generated audit use the same code path.
 */
export const ACCEPTED_ANSWER_HYGIENE_VERSION = "accepted-answer-hygiene-v1" as const;

export const NO_OP_VARIANT_POLICY =
  "A listed accepted answer is padding when it normalizes onto another listed answer: students cannot type it distinctly, the grader cannot reward it, and counting it widens the claimed answer breadth without widening acceptance.";

export type AcceptedAnswerRow = {
  exerciseId: string;
  type: string;
  variants: string[];
  distinctNormalized: number;
  noOpVariants: string[];
  acceptsExactlyOneString: boolean;
};

type AnswerBearingExercise = Extract<PracticeExercise, { acceptedAnswers: string[] }>;

export const hasAcceptedAnswers = (exercise: PracticeExercise): exercise is AnswerBearingExercise =>
  exercise.type === "fill-blank" || exercise.type === "word-ordering" || exercise.type === "error-correction";

/** Distinct normalized forms, in first-seen order. Sentence-initial capitalization is never a distinct form. */
export function distinctAcceptedForms(variants: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const variant of variants) {
    const key = normalizeGermanText(variant);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(variant);
  }
  return kept;
}

/** Variants that normalize onto an earlier listed variant, so the grader can never reach them separately. */
export function noOpAcceptedVariants(variants: string[]): string[] {
  const seen = new Set<string>();
  const padded: string[] = [];
  for (const variant of variants) {
    const key = normalizeGermanText(variant);
    if (seen.has(key)) padded.push(variant);
    else seen.add(key);
  }
  return padded;
}

export function acceptedAnswerRow(exercise: PracticeExercise): AcceptedAnswerRow | null {
  if (!hasAcceptedAnswers(exercise)) return null;
  const variants = exercise.acceptedAnswers;
  const distinctNormalized = distinctAcceptedForms(variants).length;
  return {
    exerciseId: exercise.id,
    type: exercise.type,
    variants,
    distinctNormalized,
    noOpVariants: noOpAcceptedVariants(variants),
    acceptsExactlyOneString: distinctNormalized <= 1,
  };
}

type HygieneLesson = { id: string; level: string; exercises: PracticeExercise[] };

export type AcceptedAnswerHygieneSummary = {
  version: typeof ACCEPTED_ANSWER_HYGIENE_VERSION;
  policy: typeof NO_OP_VARIANT_POLICY;
  productiveExercises: number;
  multiVariantExercises: number;
  noOpVariantCount: number;
  exercisesWithNoOpVariants: number;
  acceptsExactlyOneString: number;
  acceptsExactlyOneStringPct: number;
  broadenedExercises: number;
  byLevel: Record<string, { productiveExercises: number; acceptsExactlyOneString: number; acceptsExactlyOneStringPct: number; noOpVariantCount: number }>;
  offenders: Array<{ lessonId: string; exerciseId: string; type: string; noOpVariants: string[] }>;
};

export function analyzeAcceptedAnswerHygiene(lessons: HygieneLesson[]): AcceptedAnswerHygieneSummary {
  const byLevel: AcceptedAnswerHygieneSummary["byLevel"] = {};
  const offenders: AcceptedAnswerHygieneSummary["offenders"] = [];
  let productiveExercises = 0;
  let multiVariantExercises = 0;
  let noOpVariantCount = 0;
  let exercisesWithNoOpVariants = 0;
  let acceptsExactlyOneString = 0;
  let broadenedExercises = 0;

  for (const lesson of lessons) {
    const level = (byLevel[lesson.level] ??= { productiveExercises: 0, acceptsExactlyOneString: 0, acceptsExactlyOneStringPct: 0, noOpVariantCount: 0 });
    for (const exercise of lesson.exercises) {
      const row = acceptedAnswerRow(exercise);
      if (!row) continue;
      productiveExercises += 1;
      level.productiveExercises += 1;
      if (row.variants.length > 1) multiVariantExercises += 1;
      if (row.acceptsExactlyOneString) {
        acceptsExactlyOneString += 1;
        level.acceptsExactlyOneString += 1;
      } else {
        broadenedExercises += 1;
      }
      if (row.noOpVariants.length) {
        exercisesWithNoOpVariants += 1;
        noOpVariantCount += row.noOpVariants.length;
        level.noOpVariantCount += row.noOpVariants.length;
        offenders.push({ lessonId: lesson.id, exerciseId: row.exerciseId, type: row.type, noOpVariants: row.noOpVariants });
      }
    }
  }

  for (const level of Object.values(byLevel)) {
    level.acceptsExactlyOneStringPct = Number(((100 * level.acceptsExactlyOneString) / Math.max(1, level.productiveExercises)).toFixed(1));
  }

  return {
    version: ACCEPTED_ANSWER_HYGIENE_VERSION,
    policy: NO_OP_VARIANT_POLICY,
    productiveExercises,
    multiVariantExercises,
    noOpVariantCount,
    exercisesWithNoOpVariants,
    acceptsExactlyOneString,
    acceptsExactlyOneStringPct: Number(((100 * acceptsExactlyOneString) / Math.max(1, productiveExercises)).toFixed(1)),
    broadenedExercises,
    byLevel,
    offenders,
  };
}
