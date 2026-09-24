import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { b1NounGrammarEntries, b1VerbPrepositionFrames } from "@/data/lexical-grammar-b1";
import { lexicalGrammarCoverage, nounsByLesson, verbFramesByLesson } from "@/data/lexical-grammar-registry";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";

describe("B1 structured noun and verb-preposition anchors", () => {
  it("covers all 24 B1 lessons and adds seven governed target frames", () => {
    const lessonIds = academicLessonList.filter((lesson) => lesson.level === "B1").map((lesson) => lesson.id);
    expect(lessonIds).toHaveLength(24);
    expect(b1NounGrammarEntries).toHaveLength(321);
    expect(b1VerbPrepositionFrames).toHaveLength(31);
    expect(lexicalGrammarCoverage.B1).toEqual({ lessons: 24, nounEntries: 321, verbFrames: 31 });
    for (const lessonId of lessonIds) {
      expect(nounsByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(4);
      expect(verbFramesByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(1);
    }
    for (const lessonId of ["b1-02", "b1-03", "b1-06", "b1-08", "b1-11", "b1-15", "b1-20"]) expect(verbFramesByLesson[lessonId], lessonId).toHaveLength(2);
    expect(nounsByLesson["b1-01"]).toHaveLength(25);
    expect(nounsByLesson["b1-05"]).toHaveLength(12);
  });

  it("passes strict schemas and owns the B1 source version", () => {
    for (const noun of b1NounGrammarEntries) {
      expect(noun.sourceVersion).toBe("b1-lexical-grammar-v1");
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
    }
    for (const frame of b1VerbPrepositionFrames) {
      expect(frame.sourceVersion).toBe("b1-lexical-grammar-v1");
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
    }
  });

  it("keeps article, case forms, and no-usual-plural notes complete", () => {
    for (const noun of b1NounGrammarEntries) {
      expect(noun.caseForms.nominative.startsWith(`${noun.article} `), noun.id).toBe(true);
      expect(noun.caseForms.accusative.length, noun.id).toBeGreaterThan(noun.lemma.length);
      expect(noun.caseForms.dative.length, noun.id).toBeGreaterThan(noun.lemma.length);
      expect(noun.plural.noteAr.length, noun.id).toBeGreaterThan(12);
    }
    const mobility = b1NounGrammarEntries.find((noun) => noun.lemma === "Mobilität")!;
    expect(mobility.plural.form).toBeNull();
    expect(mobility.plural.noteAr).toContain("لا يُستعمل");
    const study = b1NounGrammarEntries.find((noun) => noun.lessonId === "b1-01" && noun.lemma === "Studium")!;
    expect(study.caseForms).toMatchObject({nominative:"das Studium",accusative:"das Studium",dative:"dem Studium",genitive:"des Studiums"});
    const employees=b1NounGrammarEntries.find((noun)=>noun.lemma==="Beschäftigte")!;const participants=b1NounGrammarEntries.find((noun)=>noun.lemma==="Teilnehmende")!;expect(employees.caseForms).toEqual({nominative:"die Beschäftigten",accusative:"die Beschäftigten",dative:"den Beschäftigten",genitive:"der Beschäftigten"});expect(participants.caseForms.dative).toBe("den Teilnehmenden");
  });

  it("uses both governed cases and keeps the preposition inside chunk and example", () => {
    expect(new Set(b1VerbPrepositionFrames.map((frame) => frame.governedCase))).toEqual(new Set(["accusative", "dative"]));
    for (const frame of b1VerbPrepositionFrames) {
      const preposition = frame.preposition.toLocaleLowerCase("de-DE");
      expect(frame.chunkDe.toLocaleLowerCase("de-DE"), frame.id).toContain(preposition);
      expect(frame.exampleDe.toLocaleLowerCase("de-DE"), frame.id).toContain(preposition);
      expect(frame.contrastAr.length, frame.id).toBeGreaterThan(12);
    }
  });

  it("renders B1 through the shared German-first panel and rejects unsupported levels", () => {
    const { unmount } = render(createElement(LexicalGrammarPanel, { lessonId: "b1-02" }));
    expect(screen.getAllByText("die Entscheidung").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("sich für eine Möglichkeit entscheiden")).toBeTruthy();
    expect(screen.getByText("sich gegen eine Möglichkeit entscheiden")).toBeTruthy();
    expect(screen.getByText(/A1–B2/)).toBeTruthy();
    unmount();
    const presentationFrame = render(createElement(LexicalGrammarPanel, { lessonId: "b1-15" }));
    expect(screen.getByText("mit Stichpunkten sprechen")).toBeTruthy();
    presentationFrame.unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "c1-01" }));
    expect(container.childElementCount).toBe(0);
  });
});
