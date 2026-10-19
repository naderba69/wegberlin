/**
 * ADR-135 / v244: writes the question-support noun anchors as JSON for
 * `scripts/verify-question-support-nouns.py` (WiktionaryDE via the `german_nouns` PyPI package).
 * Usage: npx tsx scripts/export-question-support-nouns.ts <out.json>
 */
import { writeFileSync } from "node:fs";
import { questionSupportNounEntries } from "../src/data/lexical-grammar-registry";

const out = process.argv[2];
if (!out) throw new Error("usage: npx tsx scripts/export-question-support-nouns.ts <out.json>");
writeFileSync(out, JSON.stringify(questionSupportNounEntries.map((entry) => ({
  id: entry.id,
  lessonId: entry.lessonId,
  lemma: entry.lemma,
  gender: entry.gender,
  nom: entry.caseForms.nominative,
  acc: entry.caseForms.accusative,
  dat: entry.caseForms.dative,
  plural: entry.plural.form,
})), null, 1));
console.log(`wrote ${questionSupportNounEntries.length} anchors to ${out}`);
