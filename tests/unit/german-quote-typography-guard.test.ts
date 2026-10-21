// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { nursingLayerUnits } from "@/data/nursing-layer-registry";

// ADR-150 / v259: German text uses German quotation marks „…“, never the Arabic/Swiss «…».
// ADR-149 fixed this for lesson entry, discovery and pronunciation. v259 closes the remaining German fields:
// reading and listening texts of b2-14/b2-16/b2-17, the nursing layer and one German source title.
// Arabic fields keep «…», also when they quote German (for example a titleAr «Warum nicht einfach beantragen?»).

// A German field is a string property named `de` or ending in `De` (textDe, transcriptDe, promptDe, targetDe …).
const germanField = /\b(de|\w*De)\s*:\s*(["'`])((?:\\.|(?!\2).)*)\2/gu;
const wrongQuotes = /[«»]/u;

export function germanQuoteProblems(source: string, file: string): string[] {
  const problems: string[] = [];
  for (const match of source.matchAll(germanField)) {
    if (wrongQuotes.test(match[3])) problems.push(`${file} ${match[1]}: ${match[3].slice(0, 80)}`);
  }
  return problems;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/u.test(name) ? [path] : [];
  });
}

function germanStrings(value: unknown, key = "", out: Array<[string, string]> = []): Array<[string, string]> {
  if (typeof value === "string") {
    if (key === "de" || /De$/u.test(key)) out.push([key, value]);
  } else if (Array.isArray(value)) {
    for (const item of value) germanStrings(item, key, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) germanStrings(v, k, out);
  }
  return out;
}

describe("German quotation marks (ADR-150)", () => {
  it("no German field anywhere in src uses «…»", () => {
    const problems = sourceFiles("src").flatMap((file) => germanQuoteProblems(readFileSync(file, "utf8"), file));
    expect(problems).toEqual([]);
  });

  it("the built lesson and nursing data carry no «…» in German strings (runtime view of the same rule)", () => {
    const lessonGerman = germanStrings(academicLessonList);
    const nursingGerman = germanStrings(nursingLayerUnits);
    expect(lessonGerman.length).toBeGreaterThan(5000);
    expect(nursingGerman.length).toBeGreaterThan(100);
    const bad = [...lessonGerman, ...nursingGerman].filter(([, text]) => wrongQuotes.test(text));
    expect(bad).toEqual([]);
    // The fixed listening/reading texts now quote with „…“.
    const b214 = academicLessonList.find((lesson) => lesson.id === "b2-14");
    expect(b214?.listening.transcriptDe).toContain("In Satz zwei steht „dieses“");
    expect(b214?.listening.questions[0].promptDe).toBe("Warum wird „dieses“ ersetzt?");
  });

  it("catches planted errors and leaves Arabic fields alone", () => {
    expect(germanQuoteProblems('textDe: "Er sagt: «Hallo.»"', "x.ts")).toHaveLength(1);
    expect(germanQuoteProblems("{ de: 'Das Wort «Alkohol»' }", "x.ts")).toHaveLength(1);
    expect(germanQuoteProblems('transcriptDe: `Ben liest vor: «Ich habe …»`', "x.ts")).toHaveLength(1);
    expect(germanQuoteProblems('textDe: "Er sagt: „Hallo.“"', "x.ts")).toEqual([]);
    expect(germanQuoteProblems('titleAr: "«Warum nicht einfach beantragen?»"', "x.ts")).toEqual([]);
    expect(germanQuoteProblems('explanationAr: "كلمة «dieses» محايدة"', "x.ts")).toEqual([]);
  });
});
