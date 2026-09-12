import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { a1NounGrammarEntries, a1NounsByLesson, a1VerbFramesByLesson, a1VerbPrepositionFrames } from "@/data/lexical-grammar-a1";
import { nounGrammarEntrySchema, verbPrepositionFrameSchema } from "@/core/content-validation/schemas";

describe("A1 structured noun and verb-preposition anchors", () => {
  it("keeps four baseline nouns in all 24 A1 lessons and expands nouns plus one target frame", () => {
    const a1LessonIds = academicLessonList.filter((lesson) => lesson.level === "A1").map((lesson) => lesson.id);
    expect(a1LessonIds).toHaveLength(24);
    expect(a1NounGrammarEntries).toHaveLength(272);
    expect(a1VerbPrepositionFrames).toHaveLength(25);
    for (const lessonId of a1LessonIds) {
      expect(a1NounsByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(4);
      expect(a1VerbFramesByLesson[lessonId]?.length, lessonId).toBeGreaterThanOrEqual(1);
    }
    expect(a1NounsByLesson["a1-01"]).toHaveLength(5);
    expect(a1NounsByLesson["a1-02"]).toHaveLength(8);
    expect(a1NounsByLesson["a1-03"]).toHaveLength(10);
    expect(a1NounsByLesson["a1-04"]).toHaveLength(12);
    expect(a1NounsByLesson["a1-05"]).toHaveLength(11);
    expect(a1NounsByLesson["a1-06"]).toHaveLength(17);
    expect(a1NounsByLesson["a1-07"]).toHaveLength(9);
    expect(a1NounsByLesson["a1-08"]).toHaveLength(5);
    expect(a1NounsByLesson["a1-09"]).toHaveLength(6);
    expect(a1NounsByLesson["a1-10"]).toHaveLength(17);
    expect(a1NounsByLesson["a1-11"]).toHaveLength(15);
    expect(a1NounsByLesson["a1-12"]).toHaveLength(12);
    expect(a1NounsByLesson["a1-13"]).toHaveLength(13);
    expect(a1NounsByLesson["a1-14"]).toHaveLength(15);
    expect(a1NounsByLesson["a1-15"]).toHaveLength(12);
    expect(a1NounsByLesson["a1-16"]).toHaveLength(8);
    expect(a1NounsByLesson["a1-17"]).toHaveLength(8);
    expect(a1NounsByLesson["a1-18"]).toHaveLength(8);
    expect(a1NounsByLesson["a1-19"]).toHaveLength(13);
    expect(a1NounsByLesson["a1-20"]).toHaveLength(14);
    expect(a1NounsByLesson["a1-21"]).toHaveLength(11);
    expect(a1NounsByLesson["a1-22"]).toHaveLength(16);
    expect(a1NounsByLesson["a1-23"]).toHaveLength(10);
    expect(a1NounsByLesson["a1-24"]).toHaveLength(17);
    expect(a1VerbFramesByLesson["a1-11"]).toHaveLength(2);
  });

  it("stores article, gender, plural policy, and three case forms for every noun", () => {
    const articles = { masculine: "der", feminine: "die", neuter: "das", "plural-only": "die" } as const;
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
    const surname = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-03" && noun.lemma === "Nachname")!;
    const firstName = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-03" && noun.lemma === "Vorname")!;
    expect(name.caseForms).toEqual({ nominative: "der Name", accusative: "den Namen", dative: "dem Namen" });
    expect(colleague.caseForms).toEqual({ nominative: "der Kollege", accusative: "den Kollegen", dative: "dem Kollegen" });
    expect(surname.caseForms).toEqual({ nominative: "der Nachname", accusative: "den Nachnamen", dative: "dem Nachnamen" });
    expect(firstName.caseForms).toEqual({ nominative: "der Vorname", accusative: "den Vornamen", dative: "dem Vornamen" });
    const parents = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-04" && noun.lemma === "Eltern")!;
    const contactData = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-05" && noun.lemma === "Kontaktdaten")!;
    expect(parents).toMatchObject({ article:"die",gender:"plural-only",plural:{form:"Eltern"},caseForms:{nominative:"die Eltern",accusative:"die Eltern",dative:"den Eltern"} });
    expect(contactData.caseForms).toEqual({ nominative:"die Kontaktdaten",accusative:"die Kontaktdaten",dative:"den Kontaktdaten" });
    expect([parents,contactData].every((noun)=>noun.plural.noteAr.includes("الجمع فقط"))).toBe(true);
    const customer = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-06" && noun.lemma === "Kunde")!;
    expect(customer.caseForms).toEqual({ nominative:"der Kunde",accusative:"den Kunden",dative:"dem Kunden" });
    const water = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-10" && noun.lemma === "Wasser")!;
    expect(water.plural).toMatchObject({ form:null });
    expect(water.plural.noteAr).toContain("لا يُستعمل له جمع عادي");
    const chair = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-14" && noun.lemma === "Stuhl")!;
    const serviceCosts = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-15" && noun.lemma === "Nebenkosten")!;
    expect(chair.plural).toMatchObject({ form:"Stühle",dativeForm:"Stühlen" });
    expect(serviceCosts).toMatchObject({ gender:"plural-only",caseForms:{nominative:"die Nebenkosten",accusative:"die Nebenkosten",dative:"den Nebenkosten"} });
    const eye = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-22" && noun.lemma === "Auge")!;
    const tablet = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-23" && noun.lemma === "Tablette")!;
    const surname24 = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-24" && noun.lemma === "Nachname")!;
    expect(eye.plural.form).toBe("Augen");
    expect(tablet.plural.form).toBe("Tabletten");
    expect(surname24.caseForms).toEqual({nominative:"der Nachname",accusative:"den Nachnamen",dative:"dem Nachnamen"});
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

  it("renders German-first A1 anchors and stays absent for unsupported levels", () => {
    const { unmount } = render(createElement(LexicalGrammarPanel, { lessonId: "a1-01" }));
    expect(screen.getByText("Nomen mit Artikel, Plural und Kasus")).toBeTruthy();
    expect(screen.getAllByText("der Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Namen").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("nach dem Namen fragen")).toBeTruthy();
    const extraSummary = screen.getByText("Weitere Zielnomen");
    const extraDetails = extraSummary.closest("details")!;
    expect(extraDetails.hasAttribute("open")).toBe(false);
    fireEvent.click(extraSummary);
    expect(extraDetails.hasAttribute("open")).toBe(true);
    expect(screen.getAllByText("die Karte").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Karten").length).toBeGreaterThanOrEqual(1);
    unmount();
    const paymentFrame = render(createElement(LexicalGrammarPanel, { lessonId: "a1-11" }));
    expect(screen.getByText("mit der Karte bezahlen")).toBeTruthy();
    expect(screen.getByText(/15 مراسي اسم و2 إطار فعل/)).toBeTruthy();
    paymentFrame.unmount();
    const familyNouns = render(createElement(LexicalGrammarPanel, { lessonId: "a1-04" }));
    const familyExtras = screen.getByText("Weitere Zielnomen").closest("details")!;
    expect(familyExtras.textContent).toContain("أسماء هدف إضافية موثقة · 8");
    fireEvent.click(screen.getByText("Weitere Zielnomen"));
    expect(screen.getAllByText("die Eltern").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("nur Plural")).toBeTruthy();
    familyNouns.unmount();
    const foodNouns = render(createElement(LexicalGrammarPanel, { lessonId: "a1-10" }));
    const foodExtras = screen.getByText("Weitere Zielnomen").closest("details")!;
    expect(foodExtras.textContent).toContain("أسماء هدف إضافية موثقة · 13");
    fireEvent.click(screen.getByText("Weitere Zielnomen"));
    expect(screen.getAllByText("der Apfel").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("das Wasser").length).toBeGreaterThanOrEqual(1);
    foodNouns.unmount();
    const roomNouns = render(createElement(LexicalGrammarPanel, { lessonId: "a1-14" }));
    expect(screen.getByText("Plural Dativ: den Stühlen")).toBeTruthy();
    const roomExtras = screen.getByText("Weitere Zielnomen").closest("details")!;
    expect(roomExtras.textContent).toContain("أسماء هدف إضافية موثقة · 11");
    roomNouns.unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "c1-01" }));
    expect(container.childElementCount).toBe(0);
  });
});
