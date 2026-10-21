import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";
import { isGoetheB1Themes6Entry } from "@/core/content-validation/lexical-review-packet";

// ADR-150 / v259: six further Goethe-Zertifikat B1 themes that the B1 lessons had missed, taught inside the existing
// lesson whose topic fits: family and life stages (b1-01), accident and emergency (b1-03), work (b1-06), nature and
// weather (b1-07), traffic (b1-11), bank and post with double meanings (b1-19). Every word is a vocabulary phrase and a
// review card with an example sentence (appended, so no stored ID moves); each lesson gets one matching exercise e8.
const THEME_LESSONS = ["b1-01", "b1-03", "b1-06", "b1-07", "b1-11", "b1-19"] as const;
const lessons = academicLessonList.filter((lesson) => (THEME_LESSONS as readonly string[]).includes(lesson.id));
// ADR-155 / v264 appended further anchors to b1-11 and b1-19 under its own scope; they are not part of this package.
const anchors = goetheCoreNounEntries.filter((entry) => (THEME_LESSONS as readonly string[]).includes(entry.lessonId) && !isGoetheB1Themes6Entry(entry));
const vocabularyText = (lessonId: string) => {
  const lesson = lessons.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};

describe("Goethe B1 theme vocabulary package (ADR-150)", () => {
  it("teaches each theme in its host lesson, as phrase and as card with a German example sentence", () => {
    const themes: Record<(typeof THEME_LESSONS)[number], string[]> = {
      "b1-01": ["die Kindheit", "der Neffe", "die Scheidung", "die Rente", "das Heimweh", "das Abitur", "die Schwiegermutter"],
      "b1-03": ["die Verletzung", "bluten", "der Notruf", "der Krankenwagen", "die Notaufnahme", "verschreiben", "die Versichertenkarte"],
      "b1-06": ["das Vorstellungsgespräch", "die Arbeitserlaubnis", "halbtags", "der Lohn", "die Lehrstelle", "die Gewerkschaft", "der Streik"],
      "b1-07": ["das Gebirge", "das Tal", "die Küste", "die Ernte", "der Nebel", "hageln", "die Wettervorhersage"],
      "b1-11": ["der Stau", "tanken", "die Einbahnstraße", "überholen", "die Vorfahrt", "der Strafzettel", "sich anschnallen"],
      "b1-19": ["Geld abheben", "den Hörer abheben", "der Geldautomat", "das Bargeld", "der Briefumschlag", "umsonst", "gratis"],
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
    // 124 from this package, plus the 27 (b1-11) and 25 (b1-19) words that ADR-155 appended after them
    expect(added).toBe(124 + 27 + 25);
  });

  it("anchors every article-marked new noun, including the feminine forms, outside the original P0-98 scope", () => {
    expect(anchors.length).toBe(117);
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of anchors) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      expect(vocabularyText(entry.lessonId).includes(entry.lemma), `${entry.id} ${entry.lemma}`).toBe(true);
    }
    for (const weak of ["Neffe", "Praktikant", "Geldautomat"]) {
      const entry = anchors.find((item) => item.lemma === weak)!;
      expect(entry.caseForms.accusative, weak).toBe(`den ${weak.endsWith("e") ? `${weak}n` : `${weak}en`}`);
    }
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-themes-nouns-2026-10-21.csv", "utf8").trimEnd().split("\n");
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
