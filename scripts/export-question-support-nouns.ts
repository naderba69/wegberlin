/**
 * ADR-135 / v244: writes the question-support noun anchors as JSON for
 * `scripts/verify-question-support-nouns.py` (WiktionaryDE via the `german_nouns` PyPI package).
 * Usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core]
 * ADR-139 / v248: `goethe-core` exports the Goethe-Zertifikat A1 core-vocabulary anchors instead.
 * ADR-141 / v250: `goethe-a2-core` exports the Goethe-Zertifikat A2 core-vocabulary anchors.
 * ADR-142 / v251: `goethe-b1-core` exports the Goethe-Zertifikat B1 food and perception anchors.
 */
import { writeFileSync } from "node:fs";
import { goetheCoreNounEntries, questionSupportNounEntries } from "../src/data/lexical-grammar-registry";

const out = process.argv[2];
if (!out) throw new Error("usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core]");
const set = process.argv[3] ?? "question-support";
if (set !== "question-support" && set !== "goethe-core" && set !== "goethe-a2-core" && set !== "goethe-b1-core") throw new Error(`unknown anchor set ${set}`);
const entries = set === "goethe-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a1-"))
  : set === "goethe-a2-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a2-"))
  : set === "goethe-b1-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("b1-"))
  : questionSupportNounEntries;
writeFileSync(out, JSON.stringify(entries.map((entry) => ({
  id: entry.id,
  lessonId: entry.lessonId,
  lemma: entry.lemma,
  gender: entry.gender,
  nom: entry.caseForms.nominative,
  acc: entry.caseForms.accusative,
  dat: entry.caseForms.dative,
  plural: entry.plural.form,
})), null, 1));
console.log(`wrote ${entries.length} ${set} anchors to ${out}`);
