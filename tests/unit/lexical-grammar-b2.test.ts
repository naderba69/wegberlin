import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { b2NounGrammarEntries, b2VerbPrepositionFrames } from "@/data/lexical-grammar-b2";
import { lexicalGrammarCoverage, nounGrammarEntries, nounsByLesson, verbFramesByLesson, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";

describe("B2 structured noun and verb-preposition anchors", () => {
  it("keeps the all-lesson baseline and expands structured frame coverage", () => {
    expect(academicLessonList).toHaveLength(84);
    expect(b2NounGrammarEntries).toHaveLength(195);
    expect(b2VerbPrepositionFrames).toHaveLength(18);
    expect(nounGrammarEntries).toHaveLength(1044);
    expect(verbPrepositionFrames).toHaveLength(104);
    expect(lexicalGrammarCoverage.B2).toEqual({ lessons: 12, nounEntries: 195, verbFrames: 18 });
    for (const lesson of academicLessonList) {
      expect(nounsByLesson[lesson.id]?.length, lesson.id).toBeGreaterThanOrEqual(4);
      expect(verbFramesByLesson[lesson.id]?.length, lesson.id).toBeGreaterThanOrEqual(1);
    }
    for (const lessonId of ["b2-05", "b2-07", "b2-08", "b2-09", "b2-11", "b2-12"]) expect(verbFramesByLesson[lessonId], lessonId).toHaveLength(2);
  });

  it("passes strict schemas and owns the B2 source version", () => {
    for (const noun of b2NounGrammarEntries) {
      expect(noun.sourceVersion).toBe("b2-lexical-grammar-v1");
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
    }
    for (const frame of b2VerbPrepositionFrames) {
      expect(frame.sourceVersion).toBe("b2-lexical-grammar-v1");
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
    }
  });

  it("keeps noun case forms, plurals, and mass-noun policy explicit", () => {
    for (const noun of b2NounGrammarEntries) {
      expect(noun.caseForms.nominative.startsWith(`${noun.article} `), noun.id).toBe(true);
      expect(noun.caseForms.accusative.trim(), noun.id).not.toBe("");
      expect(noun.caseForms.dative.trim(), noun.id).not.toBe("");
      expect(noun.plural.noteAr.length, noun.id).toBeGreaterThan(12);
    }
    const productivity = b2NounGrammarEntries.find((noun) => noun.lemma === "Produktivität")!;
    expect(productivity.plural.form).toBeNull();
    expect(productivity.plural.noteAr).toContain("لا يُستعمل");
  });

  it("covers Akkusativ and Dativ frames with complete reusable chunks", () => {
    expect(new Set(b2VerbPrepositionFrames.map((frame) => frame.governedCase))).toEqual(new Set(["accusative", "dative"]));
    for (const frame of b2VerbPrepositionFrames) {
      const preposition = frame.preposition.toLocaleLowerCase("de-DE");
      expect(frame.chunkDe.toLocaleLowerCase("de-DE"), frame.id).toContain(preposition);
      expect(frame.exampleDe.toLocaleLowerCase("de-DE"), frame.id).toContain(preposition);
      expect(frame.contrastAr.length, frame.id).toBeGreaterThan(12);
    }
  });

  it("renders the B2 German-first panel with expanded and honest coverage", () => {
    const perspectiveFrame = render(createElement(LexicalGrammarPanel, { lessonId: "b2-09" }));
    expect(screen.getAllByText("die Perspektive").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Perspektiven").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("von Erfahrungen geprägt sein")).toBeTruthy();
    expect(screen.getByText("von der Situation abhängen")).toBeTruthy();
    expect(screen.getByText(/A1–B2/)).toBeTruthy();
    expect(screen.getByText(/لا تمثل كل مفردات الدرس بعد/)).toBeTruthy();
    perspectiveFrame.unmount();
    const finalFrame = render(createElement(LexicalGrammarPanel, { lessonId: "b2-12" }));
    expect(screen.getByText("nach Wirkung priorisieren")).toBeTruthy();
    finalFrame.unmount();
  });
});
