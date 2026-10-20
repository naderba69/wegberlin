import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { shuffledQuestionOptions } from "@/core/lesson/shuffle";

// ADR-146 / v255: reading, listening, mini-test and multiple-choice options are shown in a seeded
// shuffled order (src/core/lesson/shuffle.ts), so an explanation must never point to an option by its
// position ("الخيار الثاني", "والجملة الأخيرة"). The learner may see that option in another place.
// Explanations name the option by its content instead, usually with a short verbatim quote.
const optionByPosition = /(?:الخيار(?:ين|ان)?|الجواب|الإجابة|البديل)\s+(?:ال)?(?:أول|أوّل|ثاني|ثالث|رابع|أخير)/u;
// "الجملة الأولى" stays allowed: it is used for "the first sentence of your text/presentation".
const sentenceByPosition = /(?:الجملة|العبارة)\s+(?:الثانية|الثالثة|الرابعة|الأخيرة)/u;
const ordinalClause = /(?:^|[؛،.:]\s*)(?:و|ف)?(?:في\s+)?ال(?:أولى|ثانية|ثالثة|رابعة)\s/gu;

export function positionProblems(id: string, explanation: string | undefined, optionList: boolean): string[] {
  if (!explanation) return [];
  const problems: string[] = [];
  if (optionByPosition.test(explanation)) problems.push(`${id}: names an option by position`);
  if (optionList && sentenceByPosition.test(explanation)) problems.push(`${id}: names an option sentence by position`);
  if (optionList && (explanation.match(ordinalClause)?.length ?? 0) >= 2) problems.push(`${id}: walks the options by position`);
  return problems;
}

describe("Option position references (ADR-146)", () => {
  it("relies on options really being shuffled", () => {
    const question = academicLessonList[0].reading.questions[0];
    const orders = academicLessonList.slice(0, 12).map((lesson) => shuffledQuestionOptions(lesson.reading.questions[0], `${lesson.id}:reading`).options.map((option) => option.originalIndex).join(""));
    expect(new Set(orders).size).toBeGreaterThan(1);
    expect(shuffledQuestionOptions(question, "x").options).toHaveLength(question.options.length);
  });

  it("catches planted errors", () => {
    expect(positionProblems("x-m1", "الخيار الثاني يقلبهما.", true)).toEqual(["x-m1: names an option by position"]);
    expect(positionProblems("x-m2", "أما «A» فرأي، والجملة الأخيرة حكم.", true)).toEqual(["x-m2: names an option sentence by position"]);
    expect(positionProblems("x-m3", "الأولى تطلب بأدب؛ الثانية تطالب، والثالثة تتهم.", true)).toEqual(["x-m3: walks the options by position"]);
    expect(positionProblems("x-m4", "هل يعرف السامع الهدف من الجملة الأولى؟ و «die Mahnung ihm ist» لا تحمل معنى.", true)).toEqual([]);
    expect(positionProblems("x-q1", "في الجملة الثانية يقف „dieses“ بعد ثلاثة أسماء.", false)).toEqual([]);
  });

  it("no shuffled item explains an option by its position", () => {
    const problems = academicLessonList.flatMap((lesson) => [
      ...[...lesson.reading.questions, ...lesson.listening.questions].flatMap((question) => positionProblems(question.id, question.explanationAr, false)),
      ...lesson.miniTest.flatMap((question) => positionProblems(question.id, question.explanationAr, true)),
      ...lesson.exercises.flatMap((exercise) => exercise.type === "multiple-choice" ? positionProblems(exercise.id, exercise.explanationAr, true) : []),
    ]);
    expect(problems).toEqual([]);
  });
});
