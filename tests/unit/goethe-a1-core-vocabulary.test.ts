import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries as allGoetheCoreNounEntries, nounGrammarEntries } from "@/data/lexical-grammar-registry";

// ADR-141 / v250 appends the A2 anchors to the shared list; this suite guards the A1 package only.
const goetheCoreNounEntries = allGoetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a1-"));

// ADR-139 / v248: the Goethe-Zertifikat A1 core vocabulary that the A1 lessons had missed is now taught
// on the vocabulary stage (phrases), practised in the review deck (cards) and in one matching exercise per lesson.
const a1 = academicLessonList.filter((lesson) => lesson.level === "A1");
const vocabularyText = (lessonId: string) => {
  const lesson = a1.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};
const a1Tokens = new Set(a1.flatMap((lesson) => [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)]).join(" ").split(/[^\p{L}-]+/u).filter(Boolean));

describe("Goethe A1 core vocabulary package (ADR-139)", () => {
  it("teaches every official A1 word group the lessons had missed on an A1 vocabulary surface", () => {
    const groups = {
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      seasons: ["Frühling", "Sommer", "Herbst", "Winter"],
      directions: ["Norden", "Süden", "Osten", "Westen"],
      colours: ["rot", "blau", "gelb", "grün", "schwarz", "weiß", "braun", "grau"],
      numbers: ["hundert", "tausend", "Million"],
    };
    for (const [group, words] of Object.entries(groups)) for (const word of words) expect(a1Tokens.has(word), `${group}: ${word}`).toBe(true);
  });

  it("anchors every new noun in the lesson that teaches it and keeps it out of the original P0-98 scope", () => {
    expect(goetheCoreNounEntries.length).toBe(144);
    for (const entry of goetheCoreNounEntries) {
      expect(entry.lessonId.startsWith("a1-"), entry.id).toBe(true);
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      const text = vocabularyText(entry.lessonId);
      const forms = [entry.lemma, entry.plural.form ?? entry.lemma];
      expect(forms.some((form) => text.includes(form)), `${entry.id} ${entry.lemma} is taught on its lesson's phrases or cards`).toBe(true);
    }
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-core-nouns-2026-10-19.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(goetheCoreNounEntries.length);
    for (const entry of goetheCoreNounEntries) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      // Any edit to gender, article or plural must be re-verified, not silently drift from the evidence.
      expect([cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toMatch(/^confirmed-wiktionary(-plural-only)?$/);
    }
  });

  it("practises the new words only after the lesson has taught them", () => {
    let matchingCount = 0;
    for (const lesson of a1) {
      const exercise = lesson.exercises.find((item) => item.id === `${lesson.id}-e8`);
      if (!exercise) continue;
      expect(exercise.type, exercise.id).toBe("matching");
      if (exercise.type !== "matching") continue;
      matchingCount += 1;
      const taught = vocabularyText(lesson.id);
      for (const pair of exercise.pairs) expect(taught.includes(pair.left), `${exercise.id}: ${pair.left}`).toBe(true);
      expect(new Set(exercise.pairs.map((pair) => pair.right)).size, exercise.id).toBe(exercise.pairs.length);
    }
    expect(matchingCount).toBe(23);
  });

  it("raises only the curriculum hard limit, by owner decision, and keeps the 15% reserve", () => {
    const script = readFileSync("scripts/audit-media-pack-budgets.mjs", "utf8");
    expect(script).toContain("curriculumSourceGzipBytes:1_540_000");
    expect(script).toContain("MARGIN=0.15");
    const decision = readFileSync("docs/adr/ADR-139-goethe-a1-core-vocabulary.md", "utf8");
    expect(decision).toContain("1,309,000");
    expect(decision).toContain("«نعم»");
  });
});
