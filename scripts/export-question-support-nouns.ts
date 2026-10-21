/**
 * ADR-135 / v244: writes the question-support noun anchors as JSON for
 * `scripts/verify-question-support-nouns.py` (WiktionaryDE via the `german_nouns` PyPI package).
 * Usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core|goethe-b1-themes]
 * ADR-139 / v248: `goethe-core` exports the Goethe-Zertifikat A1 core-vocabulary anchors instead.
 * ADR-141 / v250: `goethe-a2-core` exports the Goethe-Zertifikat A2 core-vocabulary anchors.
 * ADR-142 / v251: `goethe-b1-core` exports the Goethe-Zertifikat B1 food and perception anchors.
 * ADR-150 / v259: `goethe-b1-themes` exports the anchors of the six further B1 themes (b1-01/03/06/07/11/19);
 * `goethe-b1-core` stays limited to the five ADR-142 lessons so its evidence file keeps its meaning.
 */
import { writeFileSync } from "node:fs";
import { goetheCoreNounEntries, questionSupportNounEntries } from "../src/data/lexical-grammar-registry";

const ADR142_LESSONS = new Set(["b1-08", "b1-10", "b1-12", "b1-20", "b1-23"]);
const ADR150_LESSONS = new Set(["b1-01", "b1-03", "b1-06", "b1-07", "b1-11", "b1-19"]);
const out = process.argv[2];
if (!out) throw new Error("usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core|goethe-b1-themes]");
const set = process.argv[3] ?? "question-support";
if (set !== "question-support" && set !== "goethe-core" && set !== "goethe-a2-core" && set !== "goethe-b1-core" && set !== "goethe-b1-themes") throw new Error(`unknown anchor set ${set}`);
const entries = set === "goethe-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a1-"))
  : set === "goethe-a2-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a2-"))
  : set === "goethe-b1-core" ? goetheCoreNounEntries.filter((entry) => ADR142_LESSONS.has(entry.lessonId))
  : set === "goethe-b1-themes" ? goetheCoreNounEntries.filter((entry) => ADR150_LESSONS.has(entry.lessonId))
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
