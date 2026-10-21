import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";

// ADR-142 / v251: the Goethe-Zertifikat B1 food (Verpflegung) and perception/movement (Wahrnehmung/Motorik)
// words that the B1 lessons had missed are taught on the vocabulary stage (phrases), practised in the review
// deck (cards) and in one matching exercise in each of the five lessons that received them.
const b1 = academicLessonList.filter((lesson) => lesson.level === "B1");
// ADR-150 / v259 added further B1 anchors in other lessons; this package keeps to its own five lessons.
const ADR142_LESSONS = new Set(["b1-08", "b1-10", "b1-12", "b1-20", "b1-23"]);
const b1Anchors = goetheCoreNounEntries.filter((entry) => ADR142_LESSONS.has(entry.lessonId));
const vocabularyText = (lessonId: string) => {
  const lesson = b1.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};
const b1Tokens = new Set(b1.flatMap((lesson) => [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)]).join(" ").split(/[^\p{L}]+/u).filter(Boolean));

describe("Goethe B1 food and perception vocabulary package (ADR-142)", () => {
  it("teaches the two B1 themes the lessons had missed on a B1 vocabulary surface", () => {
    const groups = {
      food: ["Nahrungsmittel", "Bio", "haltbar", "Mehl", "Honig", "Gewürz", "Mahlzeit", "zubereiten", "lecker", "roh", "Ernährung", "satt", "hungrig", "durstig"],
      perception: ["stinken", "feucht", "spüren", "merkwürdig", "Kälte", "Hitze", "blind", "taub", "frieren", "schwitzen"],
      movement: ["rennen", "springen", "klettern", "drehen", "schieben", "klopfen"],
    };
    for (const [group, words] of Object.entries(groups)) for (const word of words) expect(b1Tokens.has(word), `${group}: ${word}`).toBe(true);
  });

  it("anchors every new noun in the lesson that teaches it and keeps it out of the original P0-98 scope", () => {
    expect(b1Anchors.length).toBe(43);
    expect(new Set(b1Anchors.map((entry) => entry.lessonId))).toEqual(new Set(["b1-08", "b1-10", "b1-12", "b1-20", "b1-23"]));
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of b1Anchors) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      const text = vocabularyText(entry.lessonId);
      expect([entry.lemma, entry.plural.form ?? entry.lemma].some((form) => text.includes(form)), `${entry.id} ${entry.lemma}`).toBe(true);
    }
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-core-nouns-2026-10-20.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(b1Anchors.length);
    for (const entry of b1Anchors) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      expect([cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toBe("confirmed-wiktionary");
    }
  });

  it("practises the new words only after the lesson has taught them", () => {
    let matchingCount = 0;
    for (const lesson of b1.filter((item) => ADR142_LESSONS.has(item.id))) {
      const exercise = lesson.exercises.find((item) => item.id === `${lesson.id}-e8`);
      if (!exercise) continue;
      expect(exercise.type, exercise.id).toBe("matching");
      if (exercise.type !== "matching") continue;
      matchingCount += 1;
      const taught = vocabularyText(lesson.id);
      for (const pair of exercise.pairs) expect(taught.includes(pair.left), `${exercise.id}: ${pair.left}`).toBe(true);
      expect(new Set(exercise.pairs.map((pair) => pair.right)).size, exercise.id).toBe(exercise.pairs.length);
    }
    expect(matchingCount).toBe(5);
  });
});
