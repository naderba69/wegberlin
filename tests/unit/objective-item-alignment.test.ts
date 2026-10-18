import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { OBJECTIVE_ITEM_ALIGNMENT } from "@/data/objective-item-alignment";
import { alignmentSurfaces, buildObjectiveCoverageReport } from "@/core/content-validation/objective-coverage";

const report = buildObjectiveCoverageReport();
const row = (lessonId: string, n: number) => report.rows.find((candidate) => candidate.objectiveId === `${lessonId}-objective-${n}`)!;

// P2-400 / ADR-121: the authored gap ledger is a ratchet. Closing a gap shrinks this list in the same change;
// a new gap (or a silently re-widened link) fails here instead of disappearing behind lesson-level presence.
// v231 closed the last 54 gaps in content (replaced Mini-Test items, five theory extensions, one retargeted exercise);
// the ledger is now empty and must stay empty.
const GAP_LEDGER: Array<[string, string]> = [];

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
    expect(report.gapsByDimension).toEqual({ taught: 0, practiced: 0, assessed: 0 });
  });

  it("records real semantic decisions, not structural presence", () => {
    // Grammar objective taught by its theory block and assessed by its own Mini-Test item.
    expect(row("b1-23", 2).taughtIn).toContain("b1-23-t1");
    expect(row("b1-23", 2).assessedIn).toEqual(["b1-23-m1", "b1-23-m2", "b1-23-m4"]);
    expect(row("b1-23", 1).assessedIn).toEqual(["b1-23-m3"]);
    // Comprehension-only questions are explicitly unaligned.
    expect(report.unalignedSurfaces).toContainEqual({ lessonId: "b2-21", surfaceId: "b2-21-r1", dimension: "practiced" });
    // A former gap closed in content, not by re-tagging: "Vor- und Nachteile" is now taught by an extended theory block
    // and assessed by a dedicated Mini-Test item, and still practised elsewhere.
    expect(row("a1-15", 4).missing).toEqual([]);
    expect(row("a1-15", 4).taughtIn).toContain("a1-15-t1");
    expect(row("a1-15", 4).assessedIn).toEqual(["a1-15-m5"]);
    expect(row("a1-15", 4).practicedIn.length).toBeGreaterThan(0);
    // "Nach dem Ort fragen" is practised by an exercise that really builds a Wo-question.
    expect(row("a1-14", 2).practicedIn).toContain("a1-14-e3");
  });
});
