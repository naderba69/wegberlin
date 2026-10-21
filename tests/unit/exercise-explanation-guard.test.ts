import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { compareAccepted, evaluateExercise, normalizeGermanText } from "@/core/lesson/evaluate";
import type { PracticeExercise } from "@/types/lesson-content";

// ADR-145 / v254: guard for the audit of all 728 exercises and 480 mini-test items (734 since ADR-150 / v259 added six matching e8).
// - Word-ordering chips are rendered in data order (exercise-card does not shuffle them), so chips that
//   already read as the accepted answer give the task away. 42 such items were found and reordered.
// - The chips must still build the answer, and must be unique because the card keys each chip by its word.
// - An error-correction sentence submitted unchanged must not be accepted by the real evaluator.
// - Arabic "و" is written attached to the next Arabic word ("وبلا", not "و بلا").
const tokens = (text: string) => normalizeGermanText(text).split(" ").filter(Boolean).sort();
const detachedWaw = /(?:^|[\s،؛(])و [\u0600-\u06FF]/u;

type Ordering = Extract<PracticeExercise, { type: "word-ordering" }>;
export function orderingProblems(exercise: Ordering): string[] {
  const problems: string[] = [];
  if (compareAccepted(exercise.words.join(" "), exercise.acceptedAnswers)) problems.push(`${exercise.id}: chips already in answer order`);
  if (tokens(exercise.words.join(" ")).join(" ") !== tokens(exercise.acceptedAnswers[0] ?? "").join(" ")) problems.push(`${exercise.id}: chips do not build the answer`);
  if (new Set(exercise.words).size !== exercise.words.length) problems.push(`${exercise.id}: duplicate chip`);
  return problems;
}
export function correctionProblems(exercise: PracticeExercise): string[] {
  return exercise.type === "error-correction" && evaluateExercise(exercise, exercise.sentence) ? [`${exercise.id}: unchanged sentence is accepted`] : [];
}
export function wawProblems(id: string, text: string | undefined): string[] {
  return text && detachedWaw.test(text) ? [`${id}: detached و before an Arabic word`] : [];
}

describe("Exercise and mini-test guard (ADR-145)", () => {
  it("catches planted errors", () => {
    const ordering: Ordering = { id: "x-e3", type: "word-ordering", promptAr: "رتّب الكلمات", words: ["Ich", "lerne", "Deutsch."], acceptedAnswers: ["Ich lerne Deutsch."] } as Ordering;
    expect(orderingProblems(ordering)).toEqual(["x-e3: chips already in answer order"]);
    expect(orderingProblems({ ...ordering, words: ["Deutsch", "lerne", "lerne"] })).toEqual(["x-e3: chips do not build the answer", "x-e3: duplicate chip"]);
    expect(orderingProblems({ ...ordering, words: ["Deutsch", "Ich", "lerne"] })).toEqual([]);
    const correction = { id: "x-e4", type: "error-correction", promptAr: "صحّح الخطأ", sentence: "Ich lerne deutsch.", acceptedAnswers: ["Ich lerne Deutsch."] } as PracticeExercise;
    expect(correctionProblems(correction)).toEqual(["x-e4: unchanged sentence is accepted"]);
    expect(correctionProblems({ ...correction, orthographyPolicy: "case-sensitive" } as PracticeExercise)).toEqual([]);
    expect(wawProblems("x-m1", "الأولى صحيحة، و بلا فاصلة يتغير المعنى.")).toHaveLength(1);
    expect(wawProblems("x-m1", "الأولى صحيحة، وبلا فاصلة يتغير المعنى، و Tschüs للوداع.")).toEqual([]);
  });

  it("keeps all 734 exercises and 480 mini-test items clean", () => {
    const problems: string[] = [];
    let exercises = 0;
    let mini = 0;
    for (const lesson of academicLessonList) {
      for (const exercise of lesson.exercises) {
        exercises += 1;
        if (exercise.type === "word-ordering") problems.push(...orderingProblems(exercise));
        problems.push(...correctionProblems(exercise));
        problems.push(...wawProblems(exercise.id, exercise.promptAr), ...wawProblems(exercise.id, exercise.explanationAr));
      }
      for (const item of lesson.miniTest) {
        mini += 1;
        problems.push(...wawProblems(item.id, item.promptAr), ...wawProblems(item.id, item.explanationAr));
      }
    }
    expect({ exercises, mini }).toEqual({ exercises: 734, mini: 480 });
    expect(problems).toEqual([]);
  });
});
