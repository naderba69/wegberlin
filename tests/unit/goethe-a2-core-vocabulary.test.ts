import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";

// ADR-141 / v250: the Goethe-Zertifikat A2 words that the A2 lessons had missed are now taught on the
// vocabulary stage (phrases), practised in the review deck (cards) and in one matching exercise per lesson.
const a2 = academicLessonList.filter((lesson) => lesson.level === "A2");
const a2Anchors = goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a2-"));
const vocabularyText = (lessonId: string) => {
  const lesson = a2.find((item) => item.id === lessonId)!;
  return [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");
};
const a2Tokens = new Set(a2.flatMap((lesson) => [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)]).join(" ").split(/[^\p{L}-]+/u).filter(Boolean));

describe("Goethe A2 core vocabulary package (ADR-141)", () => {
  it("teaches the A2 themes the lessons had missed on an A2 vocabulary surface", () => {
    const groups = {
      clothing: ["Hose", "Hemd", "Bluse", "Rock", "Pullover", "Mantel", "Mütze", "Stiefel", "Jeans", "T-Shirt", "Anzug", "Mode"],
      environment: ["Wald", "Fluss", "Landschaft", "Insel", "Strand", "Natur", "Gewitter", "neblig", "Katze", "Vogel", "Pferd"],
      leisure: ["Radio", "Fernseher", "Sendung", "Theater", "Festival", "singen", "Klavier", "Tennis", "Basketball"],
      food: ["Pizza", "Wurst", "Schokolade", "Nudeln", "Zitrone", "Orange"],
    };
    for (const [group, words] of Object.entries(groups)) for (const word of words) expect(a2Tokens.has(word), `${group}: ${word}`).toBe(true);
  });

  it("anchors every new noun in the lesson that teaches it and keeps it out of the original P0-98 scope", () => {
    expect(a2Anchors.length).toBe(144);
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of a2Anchors) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      const text = vocabularyText(entry.lessonId);
      const forms = [entry.lemma, entry.plural.form ?? entry.lemma];
      expect(forms.some((form) => text.includes(form)), `${entry.id} ${entry.lemma} is taught on its lesson's phrases or cards`).toBe(true);
    }
  });

  it("keeps every new noun anchor source-verified against WiktionaryDE", () => {
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-a2-core-nouns-2026-10-19.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(a2Anchors.length);
    for (const entry of a2Anchors) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      // Any edit to gender, article or plural must be re-verified, not silently drift from the evidence.
      expect([cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toBe("confirmed-wiktionary");
    }
  });

  it("practises the new words only after the lesson has taught them", () => {
    let matchingCount = 0;
    for (const lesson of a2) {
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

  it("raises only the total JavaScript ceiling, by owner decision, and keeps the 15% reserve", () => {
    const script = readFileSync("scripts/audit-js-budgets.mjs", "utf8");
    expect(script).toContain("totalChunkGzipBytes:2594118");
    expect(script).toContain("maxSingleChunkGzipBytes:750000");
    expect(script).toContain("safetyMarginPercent=15");
    expect(Math.floor(2594118 * 0.85)).toBe(2205000);
    const media = readFileSync("scripts/audit-media-pack-budgets.mjs", "utf8");
    expect(media).toContain("curriculumSourceGzipBytes:1_580_000"); // curriculum limit raised separately by ADR-149 and ADR-152
    const decision = readFileSync("docs/adr/ADR-141-goethe-a2-core-vocabulary-and-js-ceiling.md", "utf8");
    expect(decision).toContain("2,205,000");
    expect(decision).toContain("ارفعه 80 KB");
  });
});
