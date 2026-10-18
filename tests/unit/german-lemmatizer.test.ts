import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GERMAN_LEMMATIZER_POLICY, buildLemmaDictionary, foldGerman, lemmaCandidates } from "@/core/german/lemmatizer";
import { GERMAN_LEMMA_DICTIONARY_COUNTS, germanLemmaDictionary, germanLemmaEntries } from "@/data/german-lemma-dictionary";
import { CURRICULUM_PROPER_NAMES_POLICY, curriculumPersonNames, curriculumPlaceNames } from "@/data/curriculum-proper-names";
import { createLexicalLoadContext, measureText } from "@/core/content-validation/lexical-load";
import { extendedComprehensionTasks } from "@/data/extended-comprehension";

// ADR-126 (P2-401): the reading/long-input load is measured with lemma candidates, not a suffix
// stemmer. These tests pin the cases the stemmer could not unify.
const lemmas = (word: string) => lemmaCandidates(foldGerman(word), germanLemmaDictionary);

describe("German curriculum lemmatizer (ADR-126)", () => {
  it("folds umlauts and strips other accents instead of splitting the word", () => {
    expect(foldGerman("Sätze")).toBe("saetze");
    expect(foldGerman("Straße")).toBe("strasse");
    expect(foldGerman("Café").trim()).toBe("cafe");
    expect(foldGerman("Sprachcafés").split(/\s+/).filter(Boolean)).toEqual(["sprachcafes"]);
  });

  it("unifies strong-verb vowel changes and principal parts", () => {
    expect(lemmas("spricht")).toContain("sprechen");
    expect(lemmas("sprichst")).toContain("sprechen");
    expect(lemmas("fährt")).toContain("fahren");
    expect(lemmas("ging")).toContain("gehen");
    expect(lemmas("gegangen")).toContain("gehen");
    expect(lemmas("verstanden")).toContain("verstehen");
    expect(lemmas("verstand")).toContain("verstehen");
    expect(lemmas("bekommen")).toContain("bekommen");
    expect(lemmas("abgeschlossen")).toContain("abschliessen");
    expect(lemmas("anrief")).toContain("anrufen");
    expect(lemmas("ist")).toContain("sein");
    expect(lemmas("musste")).toContain("muessen");
  });

  it("unifies umlaut plurals, Latin plurals and compounds whose tail is irregular", () => {
    expect(lemmas("Sätze")).toContain("satz");
    expect(lemmas("Bücher")).toContain("buch");
    expect(lemmas("Arbeitsplätze")).toContain("arbeitsplatz");
    expect(lemmas("besser")).toContain("gut");
  });

  it("keeps regular inflection to rule candidates without inventing a dictionary hit", () => {
    expect(lemmas("Lehrerinnen")).toContain("lehrerin");
    expect(lemmas("arbeitet")).toContain("arbeiten");
    expect(lemmas("Tisch")).toContain("tisch");
  });

  it("refuses multi-word dictionary entries, so a typo cannot silently widen the dictionary", () => {
    expect(() => buildLemmaDictionary([["zwei woerter", "x"]])).toThrow();
  });

  it("records its version and the size of the irregular dictionary", () => {
    expect(GERMAN_LEMMATIZER_POLICY).toBe("german-curriculum-lemmatizer-v1");
    expect(GERMAN_LEMMA_DICTIONARY_COUNTS.verbs).toBeGreaterThanOrEqual(100);
    expect(germanLemmaEntries.length).toBeGreaterThan(1000);
    for (const [form, lemma] of germanLemmaEntries) expect(`${foldGerman(form).trim()}→${foldGerman(lemma).trim()}`).toMatch(/^[a-z]+→[a-z]+$/);
  });
});

describe("curriculum proper names (ADR-126)", () => {
  it("lists every speaker named in the long inputs and no country or language name", () => {
    expect(CURRICULUM_PROPER_NAMES_POLICY).toBe("curriculum-proper-names-v1");
    const names = new Set<string>([...curriculumPersonNames, ...curriculumPlaceNames]);
    // Role-only speakers ("Bruder", "Moderatorin") are common nouns, not names.
    const roles = new Set(["Bruder", "Erzählerin", "Erzähler", "Leiterin", "Leitung", "Besucher", "Koordinatorin", "Moderatorin"]);
    for (const task of extendedComprehensionTasks) {
      for (const segment of task.segments) {
        if (roles.has(segment.speaker)) continue;
        const surname = segment.speaker.split(/\s+/).pop()!;
        expect(names.has(surname), `${task.id}: ${segment.speaker}`).toBe(true);
      }
    }
    for (const notAName of ["Deutschland", "Tunesien", "Spanien", "Deutsch", "Arabisch", "Französisch"]) expect(names.has(notAName)).toBe(false);
  });

  it("excludes names, including the genitive, from the measured content words", () => {
    const context = createLexicalLoadContext({ dictionary: germanLemmaDictionary, stopWords: ["der", "die"], properNames: curriculumPersonNames, stem: (word) => word });
    const row = measureText("t", "A1", "Herrn Yusufs Fahrrad steht bei Sofia", new Set(), context);
    expect(row.properNames).toBe(2);
    expect(row.unknown).not.toContain("sofia");
    expect(row.unknown).not.toContain("yusufs");
  });
});

describe("lesson-quality report carries the lemmatized gate (ADR-126)", () => {
  const report = JSON.parse(readFileSync("reports/lesson-quality-audit.json", "utf8"));

  it("reports lemmatized reading load beside the legacy figure and stays under the ratchet", () => {
    const lemmatized = report.reading.lemmatized;
    expect(lemmatized.policy).toBe("lemmatized-lexical-load-v2");
    expect(lemmatized.vocabularyStagePolicy).toBe("reading-anchored-noun-visibility-v1");
    // ADR-127: the 25% pedagogical median is met, and the ratchet sits at the measured state.
    expect(lemmatized.ratchet.targetMet).toBe(true);
    expect(report.thresholds.readingLemmatizedMedianPctMax).toBeLessThanOrEqual(22);
    expect(report.thresholds.readingLemmatizedOver45Max).toBe(0);
    // ADR-128: the first A1 readings were simplified; no reading text is above 45% and the heaviest is ratcheted.
    expect(lemmatized.lessonsOver45Pct).toBe(0);
    expect(lemmatized.maxUnknownWordPct).toBeLessThanOrEqual(report.thresholds.readingLemmatizedMaxPctMax);
    expect(report.thresholds.readingLemmatizedMaxPctMax).toBeLessThanOrEqual(42);
    expect(lemmatized.medianUnknownWordPct).toBeLessThanOrEqual(report.thresholds.readingLemmatizedMedianPctMax);
    expect(lemmatized.lessonsOver45Pct).toBeLessThanOrEqual(report.thresholds.readingLemmatizedOver45Max);
    expect(lemmatized.medianUnknownWordPct).toBeLessThan(report.reading.medianUnknownWordPct);
    expect(lemmatized.ratchet.pedagogicalTargetMedianPct).toBe(25);
    expect(lemmatized.properNamesExcluded).toBeGreaterThan(100);
  });

  it("measures all sixteen long inputs and keeps every one under the ceiling", () => {
    expect(report.longInputs.tasks).toBe(16);
    expect(report.longInputs.rows.map((row: { id: string }) => row.id).sort()).toEqual(extendedComprehensionTasks.map((task) => task.id).sort());
    for (const row of report.longInputs.rows) expect(row.pct, row.id).toBeLessThanOrEqual(report.thresholds.longInputUnknownPctMax);
    expect(report.thresholds.longInputUnknownPctMax).toBeLessThanOrEqual(32);
    expect(report.status).toBe("pass");
  });
});
