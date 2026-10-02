import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { a2NounGrammarEntries, a2VerbPrepositionFrames } from "@/data/lexical-grammar-a2";
import { lexicalGrammarCoverage, nounsByLesson, verbFramesByLesson } from "@/data/lexical-grammar-registry";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";

describe("A2 structured noun and verb-preposition anchors", () => {
  it("covers all 24 A2 lessons and adds governed target frames without weakening the baseline", () => {
    const lessonIds = academicLessonList.filter((lesson) => lesson.level === "A2").map((lesson) => lesson.id);
    expect(lessonIds).toHaveLength(24);
    expect(a2NounGrammarEntries).toHaveLength(269);
    expect(a2VerbPrepositionFrames).toHaveLength(30);
    expect(lexicalGrammarCoverage.A2).toEqual({ lessons: 24, nounEntries: 269, verbFrames: 30 });
    for (const lessonId of lessonIds) {
      expect(nounsByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(4);
      expect(verbFramesByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(1);
    }
    for (const lessonId of ["a2-04", "a2-05", "a2-06", "a2-07", "a2-15", "a2-19"]) expect(verbFramesByLesson[lessonId], lessonId).toHaveLength(2);
    expect(nounsByLesson["a2-05"]).toHaveLength(14);
    expect(nounsByLesson["a2-17"]).toHaveLength(16);
    expect(nounsByLesson["a2-20"]).toHaveLength(20);
    expect(nounsByLesson["a2-23"]).toHaveLength(15);
  });

  it("passes the shared strict schemas with the A2 source version", () => {
    for (const noun of a2NounGrammarEntries) {
      expect(noun.sourceVersion).toBe("a2-lexical-grammar-v1");
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
    }
    for (const frame of a2VerbPrepositionFrames) {
      expect(frame.sourceVersion).toBe("a2-lexical-grammar-v1");
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
    }
  });

  it("preserves weak-masculine case forms and plural policy", () => {
    const neighbor = a2NounGrammarEntries.find((noun) => noun.lemma === "Nachbar")!;
    expect(neighbor.caseForms).toEqual({ nominative: "der Nachbar", accusative: "den Nachbarn", dative: "dem Nachbarn" });
    expect(neighbor.plural.form).toBe("Nachbarn");
    expect(a2NounGrammarEntries.filter((noun) => noun.plural.form === null).length).toBeGreaterThanOrEqual(5);
    expect(a2NounGrammarEntries.filter((noun) => noun.plural.form === null).every((noun) => noun.plural.noteAr.includes("لا يُستعمل"))).toBe(true);
    const name = a2NounGrammarEntries.find((noun) => noun.lessonId === "a2-09" && noun.lemma === "Name")!;
    const requirement = a2NounGrammarEntries.find((noun) => noun.lessonId === "a2-08" && noun.lemma === "Anforderung")!;
    const lessonHour = a2NounGrammarEntries.find((noun) => noun.lessonId === "a2-20" && noun.lemma === "Unterrichtsstunde")!;
    expect(name.caseForms).toEqual({ nominative:"der Name",accusative:"den Namen",dative:"dem Namen" });
    expect(requirement.plural.form).toBe("Anforderungen");
    expect(lessonHour.plural.form).toBe("Unterrichtsstunden");
  });

  it("covers both Akkusativ and Dativ verb-preposition government", () => {
    const cases = new Set(a2VerbPrepositionFrames.map((frame) => frame.governedCase));
    expect(cases).toEqual(new Set(["accusative", "dative"]));
    for (const frame of a2VerbPrepositionFrames) {
      expect(frame.chunkDe.toLocaleLowerCase("de-DE")).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(frame.exampleDe.toLocaleLowerCase("de-DE")).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(frame.contrastAr.length).toBeGreaterThan(12);
    }
  });

  it("renders the A2 German-first panel and authored additional frames", () => {
    const { unmount } = render(createElement(LexicalGrammarPanel, { lessonId: "a2-01" }));
    expect(screen.getAllByText("die Erfahrung").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Erfahrungen").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("von einer Erfahrung erzählen")).toBeTruthy();
    expect(screen.getByText(/A1–B2/)).toBeTruthy();
    unmount();
    const houseRulesFrame = render(createElement(LexicalGrammarPanel, { lessonId: "a2-05" }));
    expect(screen.getByText("auf andere Rücksicht nehmen")).toBeTruthy();
    expect(screen.getByText(/4 مراسي اسم و2 إطار فعل/)).toBeTruthy();
    houseRulesFrame.unmount();
    const medicationFrame = render(createElement(LexicalGrammarPanel, { lessonId: "a2-15" }));
    expect(screen.getByText("ein Medikament mit Wasser einnehmen")).toBeTruthy();
    medicationFrame.unmount();
    const courseNouns = render(createElement(LexicalGrammarPanel, { lessonId: "a2-20" }));
    expect(screen.getByText(/20 مراسي اسم/)).toBeTruthy();
    expect(screen.getByText("Weitere Zielnomen")).toBeTruthy();
    courseNouns.unmount();
  });
});
