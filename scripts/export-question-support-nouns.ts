/**
 * ADR-135 / v244: writes the question-support noun anchors as JSON for
 * `scripts/verify-question-support-nouns.py` (WiktionaryDE via the `german_nouns` PyPI package).
 * Usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core|goethe-b1-themes|goethe-b1-themes-2|goethe-b1-themes-3|goethe-b1-themes-4|goethe-b1-themes-5|goethe-b1-themes-6]
 * ADR-139 / v248: `goethe-core` exports the Goethe-Zertifikat A1 core-vocabulary anchors instead.
 * ADR-141 / v250: `goethe-a2-core` exports the Goethe-Zertifikat A2 core-vocabulary anchors.
 * ADR-142 / v251: `goethe-b1-core` exports the Goethe-Zertifikat B1 food and perception anchors.
 * ADR-150 / v259: `goethe-b1-themes` exports the anchors of the six further B1 themes (b1-01/03/06/07/11/19);
 * `goethe-b1-core` stays limited to the five ADR-142 lessons so its evidence file keeps its meaning.
 * ADR-151 / v260: `goethe-b1-themes-2` exports the anchors of four more B1 themes (b1-05/16/17/21).
 * ADR-152 / v261: `goethe-b1-themes-3` exports the anchors of four more B1 themes (b1-09/13/18/22).
 * ADR-153 / v262: `goethe-b1-themes-4` exports the anchors of four more B1 themes (b1-02/04/14/15).
 * ADR-154 / v263: `goethe-b1-themes-5` exports the anchors of the project-work words in b1-24.
 * ADR-155 / v264: `goethe-b1-themes-6` exports the anchors appended to b1-08, b1-11, b1-19 and b1-20 (keyed by lesson and lemma); the older sets exclude them.
 */
import { writeFileSync } from "node:fs";
import { goetheCoreNounEntries, questionSupportNounEntries } from "../src/data/lexical-grammar-registry";
import { isGoetheB1Themes6Entry } from "../src/core/content-validation/lexical-review-packet";

const ADR142_LESSONS = new Set(["b1-08", "b1-10", "b1-12", "b1-20", "b1-23"]);
const ADR150_LESSONS = new Set(["b1-01", "b1-03", "b1-06", "b1-07", "b1-11", "b1-19"]);
const ADR151_LESSONS = new Set(["b1-05", "b1-16", "b1-17", "b1-21"]);
const ADR152_LESSONS = new Set(["b1-09", "b1-13", "b1-18", "b1-22"]);
const ADR153_LESSONS = new Set(["b1-02", "b1-04", "b1-14", "b1-15"]);
const ADR154_LESSONS = new Set(["b1-24"]);
const out = process.argv[2];
if (!out) throw new Error("usage: npx tsx scripts/export-question-support-nouns.ts <out.json> [question-support|goethe-core|goethe-a2-core|goethe-b1-core|goethe-b1-themes|goethe-b1-themes-2|goethe-b1-themes-3|goethe-b1-themes-4|goethe-b1-themes-5|goethe-b1-themes-6]");
const set = process.argv[3] ?? "question-support";
if (set !== "question-support" && set !== "goethe-core" && set !== "goethe-a2-core" && set !== "goethe-b1-core" && set !== "goethe-b1-themes" && set !== "goethe-b1-themes-2" && set !== "goethe-b1-themes-3" && set !== "goethe-b1-themes-4" && set !== "goethe-b1-themes-5" && set !== "goethe-b1-themes-6") throw new Error(`unknown anchor set ${set}`);
const entries = set === "goethe-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a1-"))
  : set === "goethe-a2-core" ? goetheCoreNounEntries.filter((entry) => entry.lessonId.startsWith("a2-"))
  : set === "goethe-b1-core" ? goetheCoreNounEntries.filter((entry) => ADR142_LESSONS.has(entry.lessonId) && !isGoetheB1Themes6Entry(entry))
  : set === "goethe-b1-themes" ? goetheCoreNounEntries.filter((entry) => ADR150_LESSONS.has(entry.lessonId) && !isGoetheB1Themes6Entry(entry))
  : set === "goethe-b1-themes-2" ? goetheCoreNounEntries.filter((entry) => ADR151_LESSONS.has(entry.lessonId))
  : set === "goethe-b1-themes-3" ? goetheCoreNounEntries.filter((entry) => ADR152_LESSONS.has(entry.lessonId))
  : set === "goethe-b1-themes-4" ? goetheCoreNounEntries.filter((entry) => ADR153_LESSONS.has(entry.lessonId))
  : set === "goethe-b1-themes-5" ? goetheCoreNounEntries.filter((entry) => ADR154_LESSONS.has(entry.lessonId))
  : set === "goethe-b1-themes-6" ? goetheCoreNounEntries.filter((entry) => isGoetheB1Themes6Entry(entry))
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
