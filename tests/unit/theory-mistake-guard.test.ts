import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";

// ADR-147 / v256: guard for the audit of all 272 theory blocks and 392 common mistakes.
// - German examples and German mistake lines use German quotation marks „…“, not the Arabic «…».
// - Learner text is plain text: markdown emphasis such as *word* would show its asterisks.
// - An Arabic gloss must explain; it may not simply repeat the German sentence ("لا تقل: <same German>").
// - Arabic words are quoted with «…» inside Arabic prose, never with the German „…“.
// - A common mistake must teach a difference: the wrong and correct lines are never identical
//   (eight items differ only by capitalisation or a comma; that is still a visible difference).
const arabicLetter = /[\u0600-\u06FF]/u;
const markdownEmphasis = /(?:^|[\s(])\*[^\s*][^*\n]*\*(?=[\s.,،؛:)]|$)/u;
const germanQuoteAroundArabic = /„[\u0600-\u06FF]/u;
const numericOnly = /^[\d\s:.,/–-]+$/u;

const theory = academicLessonList.flatMap((lesson) => lesson.theory);
const mistakes = academicLessonList.flatMap((lesson) => lesson.mistakes.map((mistake, index) => ({ id: `${lesson.id}-mk${index + 1}`, ...mistake })));

export function exampleGlossProblems(id: string, example: { de: string; ar: string }): string[] {
  const problems: string[] = [];
  if (/[«»]/u.test(example.de)) problems.push(`${id}: German example uses «» instead of „…“`);
  if (!arabicLetter.test(example.ar) && !numericOnly.test(example.ar)) problems.push(`${id}: gloss has no Arabic`);
  const core = example.de.replace(/^[A-Za-zÄÖÜäöü]+:\s*/u, "").replace(/[\s.…]+$/u, "");
  if (core.length >= 25 && example.ar.includes(core)) problems.push(`${id}: gloss only repeats the German sentence`);
  return problems;
}

describe("theory blocks and common mistakes (ADR-147)", () => {
  it("covers the audited inventory", () => {
    expect(theory.length).toBe(272);
    expect(mistakes.length).toBe(392);
  });

  it("keeps every theory example glossed in Arabic and German examples in German quotes", () => {
    const problems = theory.flatMap((block) => block.examples.flatMap((example, index) => exampleGlossProblems(`${block.id}-x${index + 1}`, example)));
    expect(problems).toEqual([]);
  });

  it("keeps learner text free of markdown emphasis and of „…“ around Arabic", () => {
    const problems: string[] = [];
    for (const block of theory) {
      for (const field of ["titleAr", "explanationAr", "contrastAr", "trickAr", "formula"] as const) {
        const text = block[field] ?? "";
        if (markdownEmphasis.test(text)) problems.push(`${block.id}.${field}: markdown emphasis`);
        if (germanQuoteAroundArabic.test(text)) problems.push(`${block.id}.${field}: „…“ around Arabic`);
      }
    }
    for (const mistake of mistakes) {
      for (const field of ["wrong", "correct", "whyAr", "trickAr"] as const) {
        if (markdownEmphasis.test(mistake[field])) problems.push(`${mistake.id}.${field}: markdown emphasis`);
        if (germanQuoteAroundArabic.test(mistake[field])) problems.push(`${mistake.id}.${field}: „…“ around Arabic`);
      }
      for (const field of ["wrong", "correct"] as const) {
        if (!arabicLetter.test(mistake[field]) && /[«»]/u.test(mistake[field])) problems.push(`${mistake.id}.${field}: German line uses «»`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("makes every common mistake show a difference", () => {
    const identical = mistakes.filter((mistake) => mistake.wrong.trim() === mistake.correct.trim()).map((mistake) => mistake.id);
    expect(identical).toEqual([]);
  });

  it("flags the defects that the audit removed", () => {
    expect(exampleGlossProblems("x", { de: "Notfalls: «die zweite Möglichkeit» statt eines Fürworts.", ar: "عند اللزوم" })).toHaveLength(1);
    expect(exampleGlossProblems("x", { de: "Nicht: Ich hätte müssen die Mappe abgeben.", ar: "لا تقل: Ich hätte müssen die Mappe abgeben." })).toHaveLength(1);
    expect(exampleGlossProblems("x", { de: "10:05", ar: "10:05" })).toEqual([]);
    expect(markdownEmphasis.test("تقول إن الأمر *يبدو* كذلك")).toBe(true);
    expect(markdownEmphasis.test("*die Prüfung gebühr Ordnung = مرفوض")).toBe(false);
    expect(germanQuoteAroundArabic.test("سياق „قَالَ إِنَّ“ مع")).toBe(true);
  });
});
