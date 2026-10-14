// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GERMAN_VARIANTS_BOUNDARY, GERMAN_VARIANTS_POLICY, buildVariantQuiz, variantCoverage, variantEntries, variantEntryById } from "@/data/german-variants";

/**
 * حارس وحدة التنوّع (P1-17): التغطية الجهات الثلاث، وكل سؤال له جواب واحد صحيح،
 * وكل فرق مصحوب بفخّ عملي مكتوب، والحدّ صريح: وعي لا إتقان لهجة.
 */
describe("German variant awareness unit", () => {
  it("covers Austria, Switzerland and Germany with authored entries", () => {
    const coverage = variantCoverage();
    expect(coverage.entries).toBe(12);
    expect(coverage.at).toBeGreaterThanOrEqual(8);
    expect(coverage.ch).toBeGreaterThanOrEqual(8);
    expect(coverage.de).toBeGreaterThanOrEqual(1);
    expect(coverage.withHazard).toBe(12);
    expect(coverage.policyVersion).toBe(GERMAN_VARIANTS_POLICY);
    expect(new Set(variantEntries.map((entry) => entry.id)).size).toBe(12);
    for (const entry of variantEntries) {
      expect(entry.hazardAr.length, entry.id).toBeGreaterThan(20);
      expect(entry.usageAr.length, entry.id).toBeGreaterThan(15);
      expect(entry.meaningAr.length, entry.id).toBeGreaterThan(2);
    }
  });

  it("asks one unambiguous question per region with the right answer inside the choices", () => {
    const quiz = buildVariantQuiz();
    expect(quiz.length).toBeGreaterThanOrEqual(24);
    for (const item of quiz) {
      expect(new Set(item.choices).size, `${item.entryId}:${item.region} has duplicate choices`).toBe(item.choices.length);
      expect(item.choices, `${item.entryId}:${item.region} must contain its own answer`).toContain(item.correct);
      expect(item.choices.length, `${item.entryId}:${item.region} needs at least three options`).toBeGreaterThanOrEqual(3);
      const entry = variantEntryById.get(item.entryId)!;
      expect(entry.regional.map((regional) => regional.form)).toContain(item.correct);
      expect(item.promptAr).toContain(item.region === "AT" ? "النمسا" : item.region === "CH" ? "سويسرا" : "ألمانيا");
    }
  });

  it("keeps the pronunciation claim out: no dialect training, only notes", () => {
    const source = readFileSync("src/data/german-variants.ts", "utf8");
    expect(source).toContain("regional-awareness-no-dialect-pronunciation-training-and-no-dialect-mastery-claim");
    expect(GERMAN_VARIANTS_BOUNDARY).toBe("regional-awareness-no-dialect-pronunciation-training-and-no-dialect-mastery-claim");
    const lab = readFileSync("src/components/variants-lab.tsx", "utf8");
    expect(lab).toContain("data-variants-policy={GERMAN_VARIANTS_POLICY}");
    expect(lab).toContain("جهة");
    expect(lab).toContain("لا لتتكلّم لهجة");
    expect(lab).toContain("لا تُحفظ كدليل إتقان");
    const hub = readFileSync("src/components/practice-hub.tsx", "utf8");
    expect(hub).toContain('href:"/practice/variants"');
    const page = readFileSync("src/app/practice/variants/page.tsx", "utf8");
    expect(page).toContain("VariantsLab");
  });

  it("never claims a region where the standard word is not used there", () => {
    const tomato = variantEntryById.get("var-paradeiser")!;
    expect(tomato.standardDe).toBe("Tomate");
    expect(tomato.regional.map((regional) => regional.form)).toContain("Paradeiser");
    expect(tomato.hazardAr).toContain("شمال");
    const matura = variantEntryById.get("var-matura")!;
    expect(matura.usageAr).toContain("Matura");
    const velo = variantEntryById.get("var-velo")!;
    expect(velo.regional.find((regional) => regional.region === "CH")?.form).toBe("Velo");
    expect(velo.regional.find((regional) => regional.region === "AT")?.form, "Austria uses the standard word here, and the data says so").toBe("Fahrrad");
  });
});
