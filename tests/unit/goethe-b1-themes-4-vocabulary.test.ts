import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";

// ADR-153 / v262: four more groups of Goethe-Zertifikat B1 words that no lesson taught, placed in the existing lesson whose
// topic fits: opinions, doubt and attitude (b1-02, decisions with würde), people and places at work (b1-04, teamwork
// with Passiv), trades, experts and qualifications (b1-14, further training with lassen), shapes and charts on slides
// (b1-15, presenting). Every word is a vocabulary phrase and a review card with an example sentence (appended, so no
// stored ID moves); each lesson gets one matching exercise e8.
const THEME_LESSONS = ["b1-02", "b1-04", "b1-14", "b1-15"] as const;
const lessons = academicLessonList.filter((lesson) => (THEME_LESSONS as readonly string[]).includes(lesson.id));
const anchors = goetheCoreNounEntries.filter((entry) => (THEME_LESSONS as readonly string[]).includes(entry.lessonId));
const vocabularyText = (lessonId: string) => {
  const lesson = lessons.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};

describe("Goethe B1 theme vocabulary package 4 (ADR-153)", () => {
  it("teaches each theme in its host lesson, as phrase and as card with a German example sentence", () => {
    const themes: Record<(typeof THEME_LESSONS)[number], string[]> = {
      "b1-02": ["die Überzeugung", "das Gewissen", "die Wirklichkeit", "sich irren", "sowieso", "meinetwegen", "beinahe", "mittlerweile"],
      "b1-04": ["der Arbeiter / die Arbeiterin", "der Unternehmer / die Unternehmerin", "die Konkurrenz", "entlassen", "die Vorschrift", "der Lift", "miteinander", "kaputtgehen"],
      "b1-14": ["der Lehrling", "der Fachmann / die Fachfrau", "der Experte / die Expertin", "der Architekt / die Architektin", "der Fotograf / die Fotografin", "die Urkunde", "der Nachwuchs", "sich erkundigen"],
      "b1-15": ["die Abbildung", "das Symbol", "der Kreis", "senkrecht", "waagerecht", "sogenannt", "die Broschüre", "der Stecker"],
    };
    let added = 0;
    for (const lesson of lessons) {
      const phrases = new Set(lesson.phrases.map((phrase) => phrase.de));
      for (const word of themes[lesson.id as (typeof THEME_LESSONS)[number]]) {
        expect(phrases.has(word), `${lesson.id} phrase ${word}`).toBe(true);
        const card = lesson.flashcards.find((item) => item.frontDe === word);
        expect(card, `${lesson.id} card ${word}`).toBeDefined();
        expect(card!.exampleDe, `${lesson.id} example ${word}`).toMatch(/^[„A-ZÄÖÜ].*[.?!“]$/u);
      }
      // the original 18 phrases stay first, the new words follow
      added += lesson.phrases.length - 18;
    }
    expect(added).toBe(80);
  });

  it("anchors every article-marked new noun, including the feminine forms, outside the original P0-98 scope", () => {
    expect(anchors.length).toBe(59);
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of anchors) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      expect(vocabularyText(entry.lessonId).includes(entry.lemma), `${entry.id} ${entry.lemma}`).toBe(true);
    }
    for (const weak of ["Experte", "Spezialist", "Architekt", "Fotograf"]) {
      const entry = anchors.find((item) => item.lemma === weak)!;
      expect(entry.caseForms.accusative, weak).toBe(weak.endsWith("e") ? `den ${weak}n` : `den ${weak}en`);
    }
    // irregular plural: der Fachmann → die Fachleute
    expect(anchors.find((item) => item.lemma === "Fachmann")!.plural.form).toBe("Fachleute");
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-themes-4-nouns-2026-10-21.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(anchors.length);
    for (const entry of anchors) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      expect([cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toMatch(/^confirmed-wiktionary/u);
    }
  });

  it("practises the new words in one matching exercise per lesson, only after teaching them", () => {
    for (const lesson of lessons) {
      const exercise = lesson.exercises.find((item) => item.id === `${lesson.id}-e8`);
      expect(exercise?.type, lesson.id).toBe("matching");
      if (exercise?.type !== "matching") continue;
      expect(exercise.pairs.length, exercise.id).toBe(5);
      const taught = vocabularyText(lesson.id);
      for (const pair of exercise.pairs) expect(taught.includes(pair.left), `${exercise.id}: ${pair.left}`).toBe(true);
      expect(new Set(exercise.pairs.map((pair) => pair.right)).size, exercise.id).toBe(exercise.pairs.length);
    }
  });
});
