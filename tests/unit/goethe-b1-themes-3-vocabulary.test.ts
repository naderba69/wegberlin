import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";

// ADR-152 / v261: the next four Goethe-Zertifikat B1 themes that no lesson taught, placed in the existing lesson whose
// topic fits: city buildings and services (b1-09, with indem / dadurch, dass), study and learning (b1-13, with beim and
// durch), police and courts (b1-18, with sollen / angeblich for unconfirmed reports), sport and ambition (b1-22, with
// ohne … zu / ohne dass). Every word is a vocabulary phrase and a review card with an example sentence (appended, so no
// stored ID moves); each lesson gets one matching exercise e8.
const THEME_LESSONS = ["b1-09", "b1-13", "b1-18", "b1-22"] as const;
const lessons = academicLessonList.filter((lesson) => (THEME_LESSONS as readonly string[]).includes(lesson.id));
const anchors = goetheCoreNounEntries.filter((entry) => (THEME_LESSONS as readonly string[]).includes(entry.lessonId));
const vocabularyText = (lessonId: string) => {
  const lesson = lessons.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};

describe("Goethe B1 theme vocabulary package 3 (ADR-152)", () => {
  it("teaches each theme in its host lesson, as phrase and as card with a German example sentence", () => {
    const themes: Record<(typeof THEME_LESSONS)[number], string[]> = {
      "b1-09": ["das Denkmal", "die Mauer", "die Fabrik", "die Feuerwehr", "der Notausgang", "das Fundbüro", "riesig"],
      "b1-13": ["die Fremdsprache", "der Dialekt", "die Nachhilfe", "das Referat", "der Professor / die Professorin", "unterstreichen", "befriedigend"],
      "b1-18": ["der Polizist / die Polizistin", "der Einbruch", "der Täter / die Täterin", "der Zeuge / die Zeugin", "festnehmen", "das Gefängnis", "strafbar"],
      "b1-22": ["die Sportart", "der Sieg", "der Sieger / die Siegerin", "unentschieden", "der Rekord", "der Mut", "entschlossen"],
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
    expect(anchors.length).toBe(71);
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of anchors) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      expect(vocabularyText(entry.lessonId).includes(entry.lemma), `${entry.id} ${entry.lemma}`).toBe(true);
    }
    for (const weak of ["Polizist", "Zeuge"]) {
      const entry = anchors.find((item) => item.lemma === weak)!;
      expect(entry.caseForms.accusative, weak).toBe(weak.endsWith("e") ? `den ${weak}n` : `den ${weak}en`);
    }
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-themes-3-nouns-2026-10-21.csv", "utf8").trimEnd().split("\n");
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
