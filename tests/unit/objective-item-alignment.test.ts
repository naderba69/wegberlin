import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { OBJECTIVE_ITEM_ALIGNMENT } from "@/data/objective-item-alignment";
import { alignmentSurfaces, buildObjectiveCoverageReport } from "@/core/content-validation/objective-coverage";

const report = buildObjectiveCoverageReport();
const row = (lessonId: string, n: number) => report.rows.find((candidate) => candidate.objectiveId === `${lessonId}-objective-${n}`)!;

// P2-400 / ADR-121: the authored gap ledger is a ratchet. Closing a gap shrinks this list in the same change;
// a new gap (or a silently re-widened link) fails here instead of disappearing behind lesson-level presence.
const GAP_LEDGER: Array<[string, string]> = [
  ["a1-01#3", "a"], ["a1-03#4", "a"], ["a1-06#2", "a"], ["a1-08#1", "a"], ["a1-12#1", "a"], ["a1-14#1", "a"], ["a1-14#2", "pa"],
  ["a1-15#4", "ta"], ["a1-19#4", "a"], ["a1-23#1", "a"], ["a1-24#4", "ta"],
  ["a2-01#4", "a"], ["a2-03#1", "a"], ["a2-04#1", "a"], ["a2-04#4", "ta"], ["a2-05#1", "a"], ["a2-06#1", "a"], ["a2-07#1", "a"],
  ["a2-09#4", "a"], ["a2-10#4", "ta"], ["a2-11#4", "a"], ["a2-12#4", "a"], ["a2-14#4", "a"], ["a2-15#1", "a"], ["a2-15#4", "a"],
  ["a2-17#1", "a"], ["a2-19#1", "a"], ["a2-20#1", "a"], ["a2-22#4", "a"], ["a2-23#1", "a"], ["a2-23#2", "a"], ["a2-24#1", "a"],
  ["b1-01#1", "a"], ["b1-05#2", "a"], ["b1-08#4", "a"], ["b1-12#4", "ta"], ["b1-13#1", "a"], ["b1-14#4", "a"], ["b1-16#1", "a"],
  ["b1-17#1", "a"], ["b1-19#1", "a"], ["b1-22#1", "a"], ["b1-23#1", "a"], ["b1-24#1", "a"], ["b1-24#2", "a"],
  ["b2-04#3", "a"], ["b2-07#2", "a"], ["b2-11#3", "a"], ["b2-15#2", "a"], ["b2-16#4", "a"], ["b2-19#2", "a"], ["b2-20#5", "a"],
  ["b2-22#3", "a"], ["b2-24#4", "a"],
];

describe("authored objective-item alignment (P2-400)", () => {
  it("accounts for every required surface of every lesson with valid objective indices", () => {
    expect(report.ok, report.issues.join("\n")).toBe(true);
    expect(Object.keys(OBJECTIVE_ITEM_ALIGNMENT)).toHaveLength(academicLessonList.length);
    for (const lesson of academicLessonList) {
      const alignment = OBJECTIVE_ITEM_ALIGNMENT[lesson.id];
      for (const surface of alignmentSurfaces(lesson).filter((candidate) => candidate.required)) {
        expect(alignment[surface.key], `${lesson.id} ${surface.key}`).toBeDefined();
      }
    }
  });

  it("links objectives to specific items instead of every item of the lesson", () => {
    const lessonWide = report.rows.filter((candidate) => {
      const lesson = academicLessonList.find((entry) => entry.id === candidate.lessonId)!;
      return lesson.objectives.length > 1 && candidate.assessedIn.length === lesson.miniTest.length && candidate.practicedIn.length === lesson.exercises.length + lesson.reading.questions.length + lesson.listening.questions.length + 3;
    });
    expect(lessonWide).toEqual([]);
    expect(row("a1-01", 1).assessedIn).not.toContain("a1-01:errors");
    expect(report.rows.flatMap((candidate) => candidate.practicedIn).some((id) => id.endsWith(":errors"))).toBe(false);
  });

  it("keeps the authored gap ledger exact", () => {
    const actual = report.gaps.map((gap) => [gap.objectiveId.replace("-objective-", "#"), gap.missing.map((dimension) => dimension[0]).join("")]);
    expect(actual).toEqual(GAP_LEDGER);
    expect(report.gapsByDimension).toEqual({ taught: 5, practiced: 1, assessed: 54 });
  });

  it("records real semantic decisions, not structural presence", () => {
    // Grammar objective taught by its theory block and assessed by its own Mini-Test item.
    expect(row("b1-23", 2).taughtIn).toContain("b1-23-t1");
    expect(row("b1-23", 2).assessedIn).toEqual(["b1-23-m1", "b1-23-m2", "b1-23-m3", "b1-23-m4"]);
    // Comprehension-only questions are explicitly unaligned.
    expect(report.unalignedSurfaces).toContainEqual({ lessonId: "b2-21", surfaceId: "b2-21-r1", dimension: "practiced" });
    // A real teaching gap stays visible: "Vor- und Nachteile" is practised but neither taught nor assessed.
    expect(row("a1-15", 4).missing).toEqual(["taught", "assessed"]);
    expect(row("a1-15", 4).practicedIn.length).toBeGreaterThan(0);
  });
});
