import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { a1NounGrammarEntries, a1NounsByLesson, a1VerbFramesByLesson, a1VerbPrepositionFrames } from "@/data/lexical-grammar-a1";
import { a2NounGrammarEntries, a2NounsByLesson, a2VerbFramesByLesson, a2VerbPrepositionFrames } from "@/data/lexical-grammar-a2";
import { framesByLesson, lexicalLevelOf, nounsByLesson, nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";
import { validateAcademicContent } from "@/core/content-validation/validate-academic-content";

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

describe("A2 structured noun and verb-preposition anchors", () => {
  const a2LessonIds = academicLessonList.filter((lesson) => lesson.level === "A2").map((lesson) => lesson.id);

  it("covers all 24 A2 lessons with four noun anchors and two verb frames", () => {
    expect(a2LessonIds).toHaveLength(24);
    expect(a2NounGrammarEntries).toHaveLength(96);
    expect(a2VerbPrepositionFrames).toHaveLength(48);
    for (const lessonId of a2LessonIds) {
      expect(a2NounsByLesson[lessonId], lessonId).toHaveLength(4);
      expect(a2VerbFramesByLesson[lessonId], lessonId).toHaveLength(2);
    }
    expect(nounGrammarEntries).toHaveLength(192);
    expect(verbPrepositionFrames).toHaveLength(72);
  });

  it("stores article, gender, plural policy, and three case forms for every A2 noun", () => {
    const articles = { masculine: "der", feminine: "die", neuter: "das" } as const;
    for (const noun of a2NounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      expect(noun.article, noun.id).toBe(articles[noun.gender]);
      expect(noun.caseForms.nominative, noun.id).toBe(`${noun.article} ${noun.lemma}`);
      expect(noun.caseForms.accusative.trim(), noun.id).not.toBe("");
      expect(noun.caseForms.dative.trim(), noun.id).not.toBe("");
      expect(noun.plural.noteAr.trim(), noun.id).not.toBe("");
      expect(noun.sourceVersion).toBe("a2-lexical-grammar-v1");
      expect(lexicalLevelOf(noun.lessonId)).toBe("A2");
    }
  });

  it("keeps weak masculine and no-plural A2 nouns explicit instead of guessing", () => {
    const neighbour = a2NounGrammarEntries.find((noun) => noun.lemma === "Nachbar")!;
    expect(neighbour.caseForms).toEqual({ nominative: "der Nachbar", accusative: "den Nachbarn", dative: "dem Nachbarn" });
    const noPlural = a2NounGrammarEntries.filter((noun) => noun.plural.form === null).map((noun) => noun.lemma);
    expect(noPlural).toEqual(["Stolz", "Müll", "Gepäck", "Schlaf", "Ernährung", "Privatsphäre"]);
    for (const lemma of noPlural) {
      const noun = a2NounGrammarEntries.find((entry) => entry.lemma === lemma)!;
      expect(noun.plural.noteAr, lemma).toContain("لا يُستعمل له جمع عادي");
    }
  });

  it("stores a usable chunk, governed case, example, and Arabic contrast for every A2 frame", () => {
    for (const frame of a2VerbPrepositionFrames) {
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
      const chunk = frame.chunkDe.toLocaleLowerCase("de-DE");
      const example = frame.exampleDe.toLocaleLowerCase("de-DE");
      expect(chunk, frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      for (const token of frame.infinitive.split(/\s+/).filter((word) => word !== "sich")) {
        expect(chunk, `${frame.id} / ${token}`).toContain(token.toLocaleLowerCase("de-DE"));
      }
      expect(example, frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(["accusative", "dative"]).toContain(frame.governedCase);
      expect(frame.contrastAr.length, frame.id).toBeGreaterThan(12);
    }
  });

  it("uses every A2 frame combination only once and keeps the Dativ exception explicit", () => {
    const keys = a2VerbPrepositionFrames.map((frame) => `${frame.infinitive}|${frame.preposition}`.toLocaleLowerCase("de-DE"));
    expect(new Set(keys).size).toBe(keys.length);
    const dativAfterAuf = a2VerbPrepositionFrames.filter((frame) => frame.preposition === "auf" && frame.governedCase === "dative");
    expect(dativAfterAuf.map((frame) => frame.infinitive)).toContain("bestehen");
  });

  it("renders German-first A2 anchors with two frames and no coverage overclaim", () => {
    const { unmount } = render(createElement(LexicalGrammarPanel, { lessonId: "a2-04" }));
    expect(screen.getAllByText("der Nachbar").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Nachbarn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("sich für die Hilfe bedanken")).toBeTruthy();
    expect(screen.getByText("um Hilfe bitten")).toBeTruthy();
    expect(screen.getByText(/إطارين للفعل مع حرف الجر/)).toBeTruthy();
    expect(screen.getByText(/B1–B2 لم تؤلف بعد/)).toBeTruthy();
    unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "b2-01" }));
    expect(container.childElementCount).toBe(0);
  });

  it("passes the shared prebuild validator and rejects broken A2 records at the same gate", () => {
    const result = validateAcademicContent();
    expect(result.ok, result.issues.join("\n")).toBe(true);
    expect(result.counts.nounGrammarEntries).toBe(192);
    expect(result.counts.verbPrepositionFrames).toBe(72);

    const noun = structuredClone(a2NounGrammarEntries[0]) as Partial<(typeof a2NounGrammarEntries)[number]>;
    delete noun.plural;
    expect(nounGrammarEntrySchema.safeParse(noun).success).toBe(false);
    expect(nounGrammarEntrySchema.safeParse({ ...a2NounGrammarEntries[0], sourceVersion: "a1-lexical-grammar-v1" }).success).toBe(true);
    expect(nounGrammarEntrySchema.safeParse({ ...a2NounGrammarEntries[0], sourceVersion: "invented-v9" }).success).toBe(false);
    expect(verbPrepositionFrameSchema.safeParse({ ...a2VerbPrepositionFrames[0], governedCase: "nominative" }).success).toBe(false);
    expect(verbPrepositionFrameSchema.safeParse({ ...a2VerbPrepositionFrames[0], chunkDe: "ohne Präposition" }).success).toBe(true);
    expect(nounsByLesson["a2-24"]).toHaveLength(4);
    expect(framesByLesson["a2-24"]).toHaveLength(2);
  });
});
