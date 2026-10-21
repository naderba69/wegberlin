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

  it("pins the full B1 recount of v262", () => {
    expect(report.levels.B1).toMatchObject({ headwords: 2830, appearsInLessonsUpToLevel: 2352, taughtExplicitlyUpToLevel: 1890, missingAtLevel: 478, absentFromAllLessons: 327, firstAppearsLater: { B2: 149 } });
    expect(report.levels.A1).toMatchObject({ headwords: 670, appearsInLessonsUpToLevel: 669, taughtExplicitlyUpToLevel: 559 });
  });
});
