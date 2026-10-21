import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// ADR-153 / v262: the incremental mode of scripts/compare-goethe-wordlists.ts (`--from-report`) counted three
// headwords that are taught in the registry but appear in no lesson string (das Trinkgeld, leiden, verzichten) again
// on every run, and it could not see words that later rewrites removed from the lessons. The B1 and A1 figures were
// therefore recounted in full from the official PDFs, whose SHA-256 match the editions pinned in
// docs/GOETHE_REFERENCE_ALIGNMENT_AR.md. These checks keep the committed report internally consistent.
type LevelReport = {
  headwords: number; appearsInLessonsUpToLevel: number; taughtExplicitlyUpToLevel: number; missingAtLevel: number;
  absentFromAllLessons: number; firstAppearsLater: Record<string, number>;
  absentFromAllLessonsList: string[]; firstAppearsLaterList: string[]; explicitWhileAbsentList?: string[];
};
const report = JSON.parse(readFileSync("reports/goethe-reference-alignment.json", "utf8")) as {
  levels: Record<"A1" | "A2" | "B1", LevelReport>;
  partialFullRun?: { recountedLevels: string[]; carriedOverLevels: string[] };
};
const script = readFileSync("scripts/compare-goethe-wordlists.ts", "utf8");

describe("Goethe reference report counting (ADR-153)", () => {
  it("records which levels were recounted in full from the pinned PDFs", () => {
    expect(report.partialFullRun?.recountedLevels).toEqual(["A1", "B1"]);
    expect(report.partialFullRun?.carriedOverLevels).toEqual(["A2"]);
  });

  it("keeps every level internally consistent", () => {
    for (const level of ["A1", "A2", "B1"] as const) {
      const data = report.levels[level];
      expect(data.appearsInLessonsUpToLevel + data.missingAtLevel, level).toBe(data.headwords);
      expect(data.absentFromAllLessonsList.length, level).toBe(data.absentFromAllLessons);
      expect(data.firstAppearsLaterList.length, level).toBe(Object.values(data.firstAppearsLater).reduce((sum, count) => sum + count, 0));
    }
  });

  it("counts a word taught only in the registry once, never once per run", () => {
    const b1 = report.levels.B1;
    const missing = new Set([...b1.absentFromAllLessonsList, ...b1.firstAppearsLaterList.map((item) => item.split(" → ")[0])]);
    expect(b1.explicitWhileAbsentList).toEqual(["leiden", "das Trinkgeld", "verzichten"]);
    for (const word of b1.explicitWhileAbsentList ?? []) expect(missing.has(word), word).toBe(true);
    // a taught word either appears in a lesson or is one of the registry-only words counted by the full run
    expect(b1.taughtExplicitlyUpToLevel).toBeLessThanOrEqual(b1.appearsInLessonsUpToLevel + (b1.explicitWhileAbsentList?.length ?? 0));
    expect(script).toContain("row.explicit && row.any && !countedByFullRun.has(row.entry.raw)");
  });

  it("pins the full B1 recount", () => {
    expect(report.levels.B1).toMatchObject({ headwords: 2820, appearsInLessonsUpToLevel: 2362, taughtExplicitlyUpToLevel: 1901, missingAtLevel: 458, absentFromAllLessons: 310, firstAppearsLater: { B2: 146 } });
    expect(report.levels.A1).toMatchObject({ headwords: 670, appearsInLessonsUpToLevel: 669, taughtExplicitlyUpToLevel: 559 });
  });
});

// ADR-154 / v263: the PDF parser glued two headwords that share a printed line („die Dusche, -n duzen, duzt, duzte,
// hat“ + „geduzt“), so 18 verbs were counted as their participle and 12 of them showed up as „absent“ words while the
// real verb was not in the list at all. Hyphen breaks („Port-/monee“), a glued reflexive („sicherkälten“), wrapped
// plural endings and regional markers on the feminine line were repaired too, and word-formation headwords
// („Kriminal-“, „Not-“, „un-“) are matched through the forms that show them in use.
describe("Goethe B1 parser repair (ADR-154)", () => {
  const b1 = report.levels.B1;
  const listed = [...b1.absentFromAllLessonsList, ...b1.firstAppearsLaterList.map((item) => item.split(" → ")[0])];
  const parser = readFileSync("scripts/parse-goethe-wortliste.py", "utf8");

  it("lists no parser artifact as a missing word", () => {
    for (const artifact of ["gebadet", "geduzt", "geflossen", "gelacht", "gelebt", "gelegt", "genäht", "gesollt", "gespart", "gesungen", "getippt", "getrieben", "gelandet", "monee", "sicherkälten", "en", "e"]) {
      expect(listed, artifact).not.toContain(artifact);
    }
    // the verbs that were hidden behind their participle are real headwords again; these three are absent for real
    for (const verb of ["duzen", "tippen", "treiben"]) expect(b1.absentFromAllLessonsList).toContain(verb);
    for (const regional of ["der Abwart", "der Coiffeur", "der Fleischhauer", "der Pensionist"]) expect(listed, regional).not.toContain(regional);
    expect(parser).toContain("def repair(out):");
  });

  it("matches word-formation headwords only through their own forms", () => {
    expect(script).toContain("const PREFIX_FORMS");
    // „Öko-“ means ökologisch: „ökonomisch“ in a B2 lesson must not count it as present
    expect(b1.absentFromAllLessonsList).toContain("Öko");
    for (const prefix of ["Elektro", "inner", "ober", "vorder", "Spezial"]) expect(b1.absentFromAllLessonsList, prefix).toContain(prefix);
    // „mittlere“ is used, but only in B2 lessons
    expect(b1.firstAppearsLaterList).toContain("mittler → B2");
    for (const prefix of ["Kriminal", "Not", "un"]) expect(listed, prefix).not.toContain(prefix);
  });
});
