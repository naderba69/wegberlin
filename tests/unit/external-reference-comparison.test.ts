import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compareWithReference,
  EXTERNAL_REFERENCE_COMPARISON_POLICY,
  segmentGermanText,
} from "@/core/content-validation/external-reference-comparison";

// Invented reference sentences (positive controls). No publisher text is used in tests.
const reference = [{
  file: "control.txt",
  segments: segmentGermanText(
    "Der Bäcker an der Ecke verkauft jeden Morgen frische Brötchen mit Sesam. "
    + "Am Wochenende fahren wir mit dem Fahrrad zum großen See im Norden. "
    + "Meine Nachbarin gießt im Sommer jeden Abend die Tomaten auf dem Balkon.",
  ),
}];

describe("P1-92 external reference comparison", () => {
  it("segments German text and treats Arabic runs as boundaries", () => {
    const segments = segmentGermanText("اقرأ الجملة: Ich wohne seit zwei Jahren in Berlin. ثم أجب. Wie heißt du?");
    // Leading punctuation is kept verbatim; normalization drops it before scoring. Short questions (<5 tokens) are skipped.
    expect(segments).toHaveLength(1);
    expect(segments[0].endsWith("Ich wohne seit zwei Jahren in Berlin.")).toBe(true);
  });

  it("flags exact copies, close paraphrases, and long verbatim runs but not unrelated or short text", () => {
    const result = compareWithReference([
      { id: "exact", text: "Der Bäcker an der Ecke verkauft jeden Morgen frische Brötchen mit Sesam." },
      { id: "near", text: "Am Wochenende fahren wir mit dem Fahrrad zum großen See im Süden." },
      { id: "run", text: "Ich weiß, meine Nachbarin gießt im Sommer jeden Abend die Tomaten, und dann ruft sie mich an, weil sie Hilfe braucht." },
      { id: "unrelated", text: "Bitte schicken Sie mir die Unterlagen bis Freitag per E-Mail." },
      { id: "short", text: "Frische Brötchen mit Sesam." },
    ], reference);
    expect(result.policyVersion).toBe(EXTERNAL_REFERENCE_COMPARISON_POLICY);
    const kinds = Object.fromEntries(result.matches.map((match) => [match.ourId, match.kind]));
    expect(kinds).toEqual({ exact: "exact", near: "near", run: "verbatim-run" });
    expect(result.matches.find((match) => match.ourId === "run")!.sharedRunTokens).toBeGreaterThanOrEqual(7);
    // Results never echo reference text.
    expect(JSON.stringify(result)).not.toContain("Tomaten");
  });

  it("keeps the committed Menschen public-sample run at zero matches without storing reference text", () => {
    const report = JSON.parse(readFileSync("reports/external-reference-comparison/menschen-public-samples-2026-10-17.json", "utf8"));
    expect(report.policyVersion).toBe(EXTERNAL_REFERENCE_COMPARISON_POLICY);
    expect(report.matchCount).toBe(0);
    expect(report.ourSegmentCount).toBeGreaterThan(19_000);
    expect(report.references).toHaveLength(3);
    for (const source of report.references) {
      expect(source.url).toMatch(/^https:\/\/shop\.hueber\.de\/media\/hueber_dateien\/Internet_Muster\//);
      expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(Object.keys(source).sort()).toEqual(["accessedAt", "file", "isbn", "publisher", "segmentCount", "sha256", "title", "url", "wordCount"]);
    }
    for (const near of report.closestBelowThreshold) expect(near.score).toBeLessThan(report.thresholds.nearScore);
  });
});
