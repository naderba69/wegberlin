import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { a1NounGrammarEntries, a1NounsByLesson, a1VerbFramesByLesson, a1VerbPrepositionFrames } from "@/data/lexical-grammar-a1";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";

describe("A1 structured noun and verb-preposition anchors", () => {
  it("covers all 24 A1 lessons with four noun anchors and one verb frame", () => {
    const a1LessonIds = academicLessonList.filter((lesson) => lesson.level === "A1").map((lesson) => lesson.id);
    expect(a1LessonIds).toHaveLength(24);
    expect(a1NounGrammarEntries).toHaveLength(96);
    expect(a1VerbPrepositionFrames).toHaveLength(24);
    for (const lessonId of a1LessonIds) {
      expect(a1NounsByLesson[lessonId], lessonId).toHaveLength(4);
      expect(a1VerbFramesByLesson[lessonId], lessonId).toHaveLength(1);
    }
  });

  it("stores article, gender, plural policy, and three case forms for every noun", () => {
    const articles = { masculine: "der", feminine: "die", neuter: "das" } as const;
    for (const noun of a1NounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      expect(noun.article, noun.id).toBe(articles[noun.gender]);
      expect(noun.caseForms.nominative, noun.id).toBe(`${noun.article} ${noun.lemma}`);
      expect(noun.caseForms.accusative.trim(), noun.id).not.toBe("");
      expect(noun.caseForms.dative.trim(), noun.id).not.toBe("");
      expect(noun.plural.noteAr.trim(), noun.id).not.toBe("");
    }
  });

  it("keeps weak masculine oblique forms explicit instead of deriving the wrong case", () => {
    const name = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-01" && noun.lemma === "Name")!;
    const colleague = a1NounGrammarEntries.find((noun) => noun.lemma === "Kollege")!;
    expect(name.caseForms).toEqual({ nominative: "der Name", accusative: "den Namen", dative: "dem Namen" });
    expect(colleague.caseForms).toEqual({ nominative: "der Kollege", accusative: "den Kollegen", dative: "dem Kollegen" });
  });

  it("stores a usable chunk, governed case, example, and Arabic contrast for every frame", () => {
    for (const frame of a1VerbPrepositionFrames) {
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
      expect(frame.chunkDe.toLocaleLowerCase("de-DE"), frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(frame.exampleDe.toLocaleLowerCase("de-DE"), frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(["accusative", "dative"]).toContain(frame.governedCase);
      expect(frame.contrastAr.length).toBeGreaterThan(12);
    }
  });

  it("rejects incomplete lexical records at the same prebuild Zod gate", () => {
    const noun = structuredClone(a1NounGrammarEntries[0]) as Partial<(typeof a1NounGrammarEntries)[number]>;
    delete noun.plural;
    expect(nounGrammarEntrySchema.safeParse(noun).success).toBe(false);
    const frame = { ...a1VerbPrepositionFrames[0], governedCase: "nominative" };
    expect(verbPrepositionFrameSchema.safeParse(frame).success).toBe(false);
  });

  it("renders German-first A1 anchors and stays absent outside the authored batch", () => {
    const { unmount } = render(createElement(LexicalGrammarPanel, { lessonId: "a1-01" }));
    expect(screen.getByText("Nomen mit Artikel, Plural und Kasus")).toBeTruthy();
    expect(screen.getAllByText("der Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Namen").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("nach dem Namen fragen")).toBeTruthy();
    unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "b1-01" }));
    expect(container.childElementCount).toBe(0);
  });
});
