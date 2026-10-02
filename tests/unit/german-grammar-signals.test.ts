// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyzeGermanGrammarSignals,
  GERMAN_GRAMMAR_SIGNALS_BOUNDARY,
  GERMAN_GRAMMAR_SIGNALS_LEXICON_SIZE,
  GERMAN_GRAMMAR_SIGNALS_POLICY,
  gradeableFindings,
  unresolvedExcerpts,
} from "@/core/writing/german-grammar-signals";
import { academicLessonList } from "@/data/academic-lessons";

/**
 * Nine learner sentences, one per local rule. These are the cases the detector
 * table was authored for; the assertions below are the measured behaviour, so a
 * regression in any single rule shows up as a named failure.
 */
const learnerCases: { text: string; expectSignal: string | null }[] = [
  { text: "Ich kommen aus Tunesien.", expectSignal: null },
  { text: "Ich bin müde weil ich arbeite den ganzen Tag.", expectSignal: "subordinate-verb-final" },
  { text: "Gestern ich gehe ins Kino.", expectSignal: "inversion-after-adverbial" },
  { text: "Ich möchte zu gehen.", expectSignal: "modal-plus-zu-infinitive" },
  { text: "Ich aufstehe um sieben Uhr.", expectSignal: "separable-prefix-position" },
  { text: "Wie Sie heißen?", expectSignal: "w-question-verb-second" },
  { text: "Ich habe den Bus genommen weil ich mit dem die Bahn nicht gefahren bin.", expectSignal: "comma-before-subordinate-conjunction" },
  { text: "Ich fahre mit der Bus und ich habe kein Ticket für die Zug.", expectSignal: "article-case-after-preposition" },
  { text: "Das ist ein Kurs dass morgens anfängt", expectSignal: "comma-before-subordinate-conjunction" },
];

describe("local German grammar signals are the primary teacher", () => {
  it("flags each authored learner pattern and restates it grammatically", () => {
    const results = learnerCases.map((testCase) => ({
      ...testCase,
      report: analyzeGermanGrammarSignals({ text: testCase.text }),
    }));
    for (const item of results) {
      const signals = item.report.findings.map((finding) => finding.signalId);
      if (item.expectSignal === null) {
        // Agreement is owned by the repair-loop detectors, not by this engine;
        // an untouched sentence must produce silence plus an unresolved row.
        expect(signals, item.text).toEqual([]);
        expect(item.report.unresolved.length).toBeGreaterThan(0);
        continue;
      }
      expect(signals, item.text).toContain(item.expectSignal);
      const finding = item.report.findings.find((candidate) => candidate.signalId === item.expectSignal);
      expect(finding?.certainty).toBe("proven");
      expect(finding?.suggestionDe, item.text).toBeTruthy();
    }
    expect(results.filter((item) => item.report.findings.length > 0)).toHaveLength(8);
    expect(results.find((item) => item.text === "Ich bin müde weil ich arbeite den ganzen Tag.")?.report.findings[0]?.suggestionDe)
      .toBe("weil ich den ganzen Tag arbeite");
  });

  it("quotes the learner verbatim so every finding can be re-grounded", () => {
    for (const testCase of learnerCases) {
      const report = analyzeGermanGrammarSignals({ text: testCase.text });
      for (const finding of report.findings) {
        expect(testCase.text, `${testCase.text} / ${finding.signalId}`).toContain(finding.excerpt);
        expect(finding.detector).toBe("deterministic-local-pattern");
        expect(finding.explanationAr.length).toBeGreaterThan(10);
        expect(finding.explanationAr).toMatch(/[\u0600-\u06FF]/u);
        expect(["authored-lesson-lexicon", "authored-verb-frames", "authored-detector-table"]).toContain(finding.ruleSource);
      }
      for (const unresolved of report.unresolved) {
        expect(testCase.text).toContain(unresolved.excerpt);
      }
    }
  });

  it("produces zero proven false positives across every authored model answer", () => {
    const models = academicLessonList
      .map((lesson) => lesson.writing?.modelDe)
      .filter((model): model is string => typeof model === "string" && model.trim().length > 0);
    expect(models.length).toBeGreaterThanOrEqual(84);
    const started = Date.now();
    const offenders: string[] = [];
    let probable = 0;
    for (const model of models) {
      const report = analyzeGermanGrammarSignals({ text: model });
      for (const finding of report.findings) {
        if (finding.certainty === "proven") offenders.push(`${finding.signalId} «${finding.excerpt}»`);
        else probable += 1;
      }
    }
    expect(offenders).toEqual([]);
    // A pattern list can never certify a text, so the flag stays fixed.
    expect(models.length).toBeGreaterThan(probable);
    expect(Date.now() - started).toBeLessThan(4000);
  });

  it("keeps the two certainty levels separated and the unresolved list visible", () => {
    const report = analyzeGermanGrammarSignals({ text: "Ich komme an, weil ich müde bin. Wir haben uns unterhalten, nachdem der Kurs begann." });
    expect(gradeableFindings(report)).toEqual([]);
    expect(report.canClaimErrorFree).toBe(false);
    expect(report.authority).toBe("authored-local-detectors-unverified-against-official-reference");
    expect(report.policyVersion).toBe(GERMAN_GRAMMAR_SIGNALS_POLICY);
    expect(report.boundary).toBe(GERMAN_GRAMMAR_SIGNALS_BOUNDARY);
    expect(report.boundary).toContain("no-error-free-claim");
    expect(report.coverage.sentences).toBeGreaterThan(0);
    // Coverage counts distinct lemmas, which is fewer than the raw inflected
    // registry rows: a reviewer must be able to spot that difference.
    expect(report.coverage.lexiconNouns).toBeGreaterThan(500);
    expect(report.coverage.lexiconNouns).toBeLessThan(GERMAN_GRAMMAR_SIGNALS_LEXICON_SIZE);
    expect(GERMAN_GRAMMAR_SIGNALS_LEXICON_SIZE).toBeGreaterThan(1000);

    const unknown = analyzeGermanGrammarSignals({ text: "Ich habe den Bus genomn und wir untermalen das." });
    expect(unresolvedExcerpts(unknown).length).toBeGreaterThan(0);
    expect(unknown.unresolved.every((entry) => entry.reasonAr.includes("محلي"))).toBe(true);
  });

  it("does not invent a comma rule where the conjunction is not subordinating", () => {
    for (const text of [
      "Ich lerne gern und mache dann eine Pause.",
      "Er sagt, dass er kommt.",
      "Das ist der Kurs, der morgens anfängt.",
      "Wir sprechen Deutsch, während wir kochen.",
      "Ich trinke Kaffee ohne dass ich Zucker nehme.",
    ]) {
      const report = analyzeGermanGrammarSignals({ text });
      expect(report.findings.map((finding) => finding.signalId), text).not.toContain("comma-before-subordinate-conjunction");
    }
  });

  it("renders in the writing lab as guidance and never as a score", () => {
    // JSX wraps Arabic copy across lines, so compare on collapsed whitespace.
    const panel = readFileSync("src/components/writing-grammar-signals-panel.tsx", "utf8").replace(/\s+/gu, " ");
    expect(panel).toContain("analyzeGermanGrammarSignals");
    expect(panel).toContain("gradeableFindings");
    expect(panel).toContain("unresolved");
    expect(panel).toContain("مرجع نحوي رسمي");
    expect(panel).toContain("للمراجعة الذاتية");
    expect(panel).not.toMatch(/\bpercent\b|[0-9]+\s*\/\s*100|compositeScore/);
  });
  it("permutes the learner's own words but never conjugates them", () => {
    // The reorder itself is safe because it only moves written words around. It
    // stops being safe when the written verb form cannot belong to the written
    // subject: "Heute ich arbeiten nicht" reordered is still ungrammatical, so
    // the diagnosis is shown and the fix is withheld instead of invented.
    const reorderOnly = analyzeGermanGrammarSignals({ text: "Wie Sie heißen?" });
    const question = reorderOnly.findings.find((finding) => finding.signalId === "w-question-verb-second");
    expect(question?.suggestionDe).toBe("Wie heißen Sie?");

    const needsEnding = analyzeGermanGrammarSignals({ text: "Heute ich arbeiten nicht." });
    const inversion = needsEnding.findings.find((finding) => finding.signalId === "inversion-after-adverbial");
    expect(inversion).toBeTruthy();
    expect(inversion?.suggestionDe).toBeNull();
    expect(inversion?.explanationAr.length).toBeGreaterThan(10);
  });
});
