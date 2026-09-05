import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { a1NounGrammarEntries, a1NounsByLesson, a1VerbFramesByLesson, a1VerbPrepositionFrames } from "@/data/lexical-grammar-a1";
import { a2NounGrammarEntries, a2NounsByLesson, a2VerbFramesByLesson, a2VerbPrepositionFrames } from "@/data/lexical-grammar-a2";
import { b1NounGrammarEntries, b1NounsByLesson, b1VerbFramesByLesson, b1VerbPrepositionFrames } from "@/data/lexical-grammar-b1";
import { b2NounGrammarEntries, b2NounsByLesson, b2VerbFramesByLesson, b2VerbPrepositionFrames } from "@/data/lexical-grammar-b2";
import { derivedFramesByLesson, verbCoverageSummary } from "@/data/lexical-grammar-derived";
import { framesByLesson, lexicalLevelOf, nounsByLesson, nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { frameKeyOf, measuredValencyEntries, valencyEntries, valencyEntriesById } from "@/data/verb-preposition-dictionary";
import { measuredTargetsByLesson, targetEvidence } from "@/data/verb-preposition-coverage";
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

  it("stores article, gender, plural policy, and four case forms for every noun", () => {
    const articles = { masculine: "der", feminine: "die", neuter: "das" } as const;
    for (const noun of a1NounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      expect(noun.article, noun.id).toBe(articles[noun.gender]);
      expect(noun.caseForms.nominative, noun.id).toBe(`${noun.article} ${noun.lemma}`);
      expect(noun.caseForms.accusative.trim(), noun.id).not.toBe("");
      expect(noun.caseForms.dative.trim(), noun.id).not.toBe("");
      expect(noun.plural.noteAr.trim(), noun.id).not.toBe("");
      expect(noun.caseForms.genitive.startsWith(noun.gender === "feminine" ? "der " : "des "), noun.id).toBe(true);
    }
  });

  it("keeps weak masculine oblique forms explicit instead of deriving the wrong case", () => {
    const name = a1NounGrammarEntries.find((noun) => noun.lessonId === "a1-01" && noun.lemma === "Name")!;
    const colleague = a1NounGrammarEntries.find((noun) => noun.lemma === "Kollege")!;
    expect(name.caseForms).toEqual({ nominative: "der Name", accusative: "den Namen", dative: "dem Namen", genitive: "des Namens" });
    expect(colleague.caseForms).toEqual({ nominative: "der Kollege", accusative: "den Kollegen", dative: "dem Kollegen", genitive: "des Kollegen" });
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
    expect(screen.getByText("Nomen mit Artikel, Plural, Genitiv und Dativ Plural")).toBeTruthy();
    expect(screen.getAllByText("der Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("die Namen").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("nach dem Namen fragen")).toBeTruthy();
    unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "c1-01" }));
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
    expect(nounGrammarEntries).toHaveLength(336);
    expect(verbPrepositionFrames).toHaveLength(262);
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
    expect(neighbour.caseForms).toEqual({ nominative: "der Nachbar", accusative: "den Nachbarn", dative: "dem Nachbarn", genitive: "des Nachbarn" });
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
    expect(screen.getByText(/إطارات الفعل مع حرف الجر/)).toBeTruthy();
    expect(screen.getByText(/لم تُراجَع ألمانيًا بشريًا بعد/)).toBeTruthy();
    unmount();
    const { container } = render(createElement(LexicalGrammarPanel, { lessonId: "c1-01" }));
    expect(container.childElementCount).toBe(0);
  });

  it("passes the shared prebuild validator and rejects broken A2 records at the same gate", () => {
    const result = validateAcademicContent();
    expect(result.ok, result.issues.join("\n")).toBe(true);
    expect(result.counts.nounGrammarEntries).toBe(336);
    expect(result.counts.verbPrepositionFrames).toBe(262);

    const noun = structuredClone(a2NounGrammarEntries[0]) as Partial<(typeof a2NounGrammarEntries)[number]>;
    delete noun.plural;
    expect(nounGrammarEntrySchema.safeParse(noun).success).toBe(false);
    expect(nounGrammarEntrySchema.safeParse({ ...a2NounGrammarEntries[0], sourceVersion: "a1-lexical-grammar-v1" }).success).toBe(true);
    expect(nounGrammarEntrySchema.safeParse({ ...a2NounGrammarEntries[0], sourceVersion: "invented-v9" }).success).toBe(false);
    expect(verbPrepositionFrameSchema.safeParse({ ...a2VerbPrepositionFrames[0], governedCase: "nominative" }).success).toBe(false);
    expect(verbPrepositionFrameSchema.safeParse({ ...a2VerbPrepositionFrames[0], chunkDe: "ohne Präposition" }).success).toBe(true);
    expect(nounsByLesson["a2-24"]).toHaveLength(4);
    expect(framesByLesson["a2-24"]?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("B1 structured noun and verb-preposition anchors", () => {
  const b1LessonIds = academicLessonList.filter((lesson) => lesson.level === "B1").map((lesson) => lesson.id);

  it("covers all 24 B1 lessons with four noun anchors and two verb frames", () => {
    expect(b1LessonIds).toHaveLength(24);
    expect(b1NounGrammarEntries).toHaveLength(96);
    expect(b1VerbPrepositionFrames).toHaveLength(48);
    for (const lessonId of b1LessonIds) {
      expect(b1NounsByLesson[lessonId], lessonId).toHaveLength(4);
      expect(b1VerbFramesByLesson[lessonId], lessonId).toHaveLength(2);
    }
  });

  it("keeps every B1 noun schema-valid, level-tagged, and case-complete", () => {
    const articles = { masculine: "der", feminine: "die", neuter: "das" } as const;
    for (const noun of b1NounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      expect(noun.article, noun.id).toBe(articles[noun.gender]);
      expect(noun.caseForms.nominative, noun.id).toBe(`${noun.article} ${noun.lemma}`);
      expect(noun.caseForms.accusative.trim() && noun.caseForms.dative.trim(), noun.id).toBeTruthy();
      expect(noun.sourceVersion).toBe("b1-lexical-grammar-v1");
    }
  });

  it("uses every B1 frame combination once and keeps the known Dativ exceptions explicit", () => {
    const keys = b1VerbPrepositionFrames.map((frame) => `${frame.infinitive}|${frame.preposition}`.toLocaleLowerCase("de-DE"));
    expect(new Set(keys).size).toBe(keys.length);
    for (const frame of b1VerbPrepositionFrames) {
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
      const chunk = frame.chunkDe.toLocaleLowerCase("de-DE");
      expect(chunk, frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(frame.exampleDe.toLocaleLowerCase("de-DE"), frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
      expect(frame.contrastAr.length, frame.id).toBeGreaterThan(12);
    }
    const dativAfterAuf = b1VerbPrepositionFrames.filter((frame) => frame.preposition === "auf" && frame.governedCase === "dative");
    expect(dativAfterAuf.map((frame) => frame.infinitive)).toContain("beruhen");
  });

  it("renders German-first B1 anchors", () => {
    render(createElement(LexicalGrammarPanel, { lessonId: "b1-04" }));
    expect(screen.getAllByText("das Ergebnis").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("sich mit dem Team abstimmen")).toBeTruthy();
    expect(screen.getByText("für ein Ergebnis verantwortlich sein")).toBeTruthy();
    expect(screen.getByText(/إطارات الفعل مع حرف الجر/)).toBeTruthy();
  });
});

describe("B2 structured noun and verb-preposition anchors", () => {
  const b2LessonIds = academicLessonList.filter((lesson) => lesson.level === "B2").map((lesson) => lesson.id);

  it("covers all 12 B2 lessons with four noun anchors and two verb frames", () => {
    expect(b2LessonIds).toHaveLength(12);
    expect(b2NounGrammarEntries).toHaveLength(48);
    expect(b2VerbPrepositionFrames).toHaveLength(24);
    for (const lessonId of b2LessonIds) {
      expect(b2NounsByLesson[lessonId], lessonId).toHaveLength(4);
      expect(b2VerbFramesByLesson[lessonId], lessonId).toHaveLength(2);
    }
  });

  it("models the formal B2 Genitiv prepositions that A1-B1 never needed", () => {
    const genitive = b2VerbPrepositionFrames.filter((frame) => frame.governedCase === "genitive");
    expect(genitive.map((frame) => frame.preposition)).toEqual(["angesichts", "hinsichtlich", "trotz"]);
    for (const frame of genitive) {
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
      expect(frame.exampleDe.toLocaleLowerCase("de-DE"), frame.id).toContain(frame.preposition.toLocaleLowerCase("de-DE"));
    }
    const angesichts = genitive.find((frame) => frame.preposition === "angesichts")!;
    expect(angesichts.chunkDe).toBe("angesichts der Frist entscheiden");
  });

  it("keeps every B2 record schema-valid and level-tagged", () => {
    for (const noun of b2NounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      expect(noun.sourceVersion, noun.id).toBe("b2-lexical-grammar-v1");
    }
    for (const frame of b2VerbPrepositionFrames) {
      expect(verbPrepositionFrameSchema.safeParse(frame).success, frame.id).toBe(true);
      expect(frame.sourceVersion, frame.id).toBe("b2-lexical-grammar-v1");
      expect(["accusative", "dative", "genitive"]).toContain(frame.governedCase);
    }
  });

  it("renders German-first B2 anchors with the Genitiv label", () => {
    render(createElement(LexicalGrammarPanel, { lessonId: "b2-04" }));
    expect(screen.getAllByText("der Leistungsumfang").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("angesichts der Frist entscheiden")).toBeTruthy();
    expect(screen.getByText("angesichts + Genitiv")).toBeTruthy();
    expect(screen.getByText("hinsichtlich des Umfangs priorisieren")).toBeTruthy();
    expect(screen.getByText("hinsichtlich + Genitiv")).toBeTruthy();
  });
});

describe("whole-course lexical coverage boundary", () => {
  it("reaches every published lesson without claiming exhaustive vocabulary coverage", () => {
    expect(nounGrammarEntries).toHaveLength(336);
    expect(verbPrepositionFrames).toHaveLength(262);
    expect(new Set(nounGrammarEntries.map((entry) => entry.lessonId)).size).toBe(84);
    expect(academicLessonList).toHaveLength(84);
    for (const lesson of academicLessonList) {
      expect(nounsByLesson[lesson.id], lesson.id).toHaveLength(4);
      expect(framesByLesson[lesson.id]?.length ?? 0, lesson.id).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("nominal Genitiv and Dativ Plural across A1-B2", () => {
  it("gives all 336 noun anchors an authored genitive form that matches its gender article", () => {
    expect(nounGrammarEntries).toHaveLength(336);
    for (const noun of nounGrammarEntries) {
      expect(nounGrammarEntrySchema.safeParse(noun).success, noun.id).toBe(true);
      const article = noun.gender === "feminine" ? "der" : "des";
      expect(noun.caseForms.genitive.startsWith(`${article} `), `${noun.id}: ${noun.caseForms.genitive}`).toBe(true);
      expect(noun.caseForms.genitive.length, noun.id).toBeGreaterThan(article.length + 2);
    }
    // صيغ بعينها كانت ستخطئها القاعدة العامة لو لم تُؤلَّف صراحةً.
    const byLemma = (lemma: string) => nounGrammarEntries.find((noun) => noun.lemma === lemma)!;
    expect(byLemma("Land").caseForms.genitive).toBe("des Landes");
    expect(byLemma("Kind").caseForms.genitive).toBe("des Kindes");
    expect(byLemma("Buch").caseForms.genitive).toBe("des Buches");
    expect(byLemma("Bus").caseForms.genitive).toBe("des Busses");
    expect(byLemma("Zyklus").caseForms.genitive).toBe("des Zyklus");
    expect(byLemma("Erlebnis").caseForms.genitive).toBe("des Erlebnisses");
    expect(byLemma("Name").caseForms.genitive).toBe("des Namens");
    expect(byLemma("Kollege").caseForms.genitive).toBe("des Kollegen");
    expect(byLemma("Nachbar").caseForms.genitive).toBe("des Nachbarn");
    expect(byLemma("Stadt").caseForms.genitive).toBe("der Stadt");
    expect(byLemma("Müll").caseForms.genitive).toBe("des Mülls");
  });

  it("authors a dative plural for every countable anchor and declares none for no-plural nouns", () => {
    const countable = nounGrammarEntries.filter((noun) => noun.plural.form !== null);
    const noPlural = nounGrammarEntries.filter((noun) => noun.plural.form === null);
    expect(countable.length + noPlural.length).toBe(336);
    for (const noun of countable) {
      expect(noun.dativePlural.form, noun.id).toMatch(/^den \S+(n|s)$/);
      expect(noun.dativePlural.form, noun.id).toBe(`den ${noun.plural.form}${/(n|s)$/.test(noun.plural.form!) ? "" : "n"}`);
      expect(noun.dativePlural.noteAr.trim(), noun.id).not.toBe("");
    }
    for (const noun of noPlural) expect(noun.dativePlural.form, noun.id).toBeNull();
    expect(noPlural.map((noun) => noun.lemma).sort()).toEqual([
      "Alltag", "Alter", "Barrierefreiheit", "Bildschirmzeit", "Ernährung", "Erreichbarkeit", "Freizeit",
      "Gemüse", "Gepäck", "Lebensdauer", "Lebensqualität", "Leistungsumfang", "Müll", "Privatsphäre", "Reichweite", "Schlaf",
      "Sport", "Stolz", "Teilhabe", "Umfang", "Wetter", "Zeitdruck", "Zuverlässigkeit",
    ]);
    const dative = (lemma: string) => nounGrammarEntries.find((noun) => noun.lemma === lemma)!.dativePlural.form;
    expect(dative("Kind")).toBe("den Kindern");
    expect(dative("Stadt")).toBe("den Städten");
    expect(dative("Nachbar")).toBe("den Nachbarn");
    expect(dative("Hobby")).toBe("den Hobbys");
    expect(dative("Firma")).toBe("den Firmen");
  });

  it("passes the shared prebuild validator and rejects a broken genitive or dative plural at the same gate", () => {
    const result = validateAcademicContent();
    expect(result.ok, result.issues.join("\n")).toBe(true);
    expect(result.counts.nounGrammarEntries).toBe(336);

    const sample = nounGrammarEntries[0];
    expect(nounGrammarEntrySchema.safeParse({ ...sample, caseForms: { ...sample.caseForms, genitive: sample.lemma } }).success).toBe(false);
    expect(nounGrammarEntrySchema.safeParse({
      ...sample,
      dativePlural: { form: sample.dativePlural.form?.replace(/n$/, "") ?? null, noteAr: sample.dativePlural.noteAr },
    }).success).toBe(false);
    const tampered = structuredClone(sample) as Partial<(typeof nounGrammarEntries)[number]>;
    delete tampered.dativePlural;
    expect(nounGrammarEntrySchema.safeParse(tampered).success).toBe(false);
  });
});

describe("P0-99: valency dictionary and measured verb-preposition coverage", () => {
  it("declares one entry per verb + preposition + case and keeps every frame tied to a declared entry", () => {
    expect(valencyEntries.length).toBe(214);
    expect(new Set(valencyEntries.map((entry) => entry.id)).size).toBe(214);
    expect(measuredValencyEntries.length).toBe(206);
    expect(valencyEntries.filter((entry) => !entry.measured).length).toBe(8);
    for (const frame of verbPrepositionFrames) {
      const key = frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase);
      expect(valencyEntriesById[key], `${frame.id} -> ${key}`).toBeTruthy();
    }
  });

  it("measures the gap from the lesson text itself and closes every measured target", () => {
    // الأرقام مقيسة من محتوى الدروس نفسه، لا مفروضة: 141 هدفًا، 23 منها كان مؤلفًا من قبل.
    expect(verbCoverageSummary.totalTargets).toBe(141);
    expect(verbCoverageSummary.totalCovered).toBe(23);
    expect(verbCoverageSummary.lessonCount).toBe(84);
    expect(verbCoverageSummary.byLevel).toEqual({
      A1: { lessons: 24, targets: 29, covered: 8, gaps: 21 },
      A2: { lessons: 24, targets: 40, covered: 7, gaps: 33 },
      B1: { lessons: 24, targets: 45, covered: 6, gaps: 39 },
      B2: { lessons: 12, targets: 27, covered: 2, gaps: 25 },
    });
    for (const [lessonId, targets] of Object.entries(measuredTargetsByLesson)) {
      const keys = new Set(
        (framesByLesson[lessonId] ?? []).map((frame) => frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase)),
      );
      for (const entryId of targets) expect(keys.has(entryId), `${lessonId}: ${entryId}`).toBe(true);
    }
  });

  it("derives exactly the missing frames and quotes the sentence that justified each target", () => {
    const derived = verbPrepositionFrames.filter((frame) => frame.origin === "derived");
    expect(derived).toHaveLength(118);
    for (const frame of derived) {
      const key = frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase);
      expect(measuredTargetsByLesson[frame.lessonId], `${frame.id} -> ${key}`).toContain(key);
    }
    // كل درس يحمل إطاراته المشتقة فقط، ولا إطارًا عن هدف لم يقع في نصه.
    expect(Object.values(derivedFramesByLesson).flat()).toHaveLength(118);
    let quoted = 0;
    for (const lessonId of Object.keys(measuredTargetsByLesson)) {
      const evidence = targetEvidence(lessonId);
      expect(evidence.length, lessonId).toBe((measuredTargetsByLesson[lessonId] ?? []).length);
      for (const item of evidence) {
        quoted += 1;
        const entry = valencyEntriesById[item.entryId];
        expect(item.sentence.length, item.entryId).toBeGreaterThan(10);
        expect(item.sentence.toLowerCase(), item.entryId).toContain(entry.preposition.toLowerCase());
      }
    }
    expect(quoted).toBe(141);
  });

  it("declares the adverbial patterns it refuses to measure instead of inflating the gap", () => {
    for (const key of ["liegen", "haengen"]) expect(measuredValencyEntries.some((entry) => entry.id.startsWith(`${key}-an-`))).toBe(false);
    for (const pair of ["wohnen in", "stehen auf", "ankommen in", "beginnen um"]) {
      const [infinitive, preposition] = pair.split(" ");
      expect(measuredValencyEntries.some((entry) => entry.infinitive === infinitive && entry.preposition === preposition)).toBe(false);
    }
  });
});
