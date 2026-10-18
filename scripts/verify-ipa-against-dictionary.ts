/**
 * ADR-134 — source verification of every tabulated IPA transcription (lessons, contrast pairs,
 * Arabic-learner pronunciation inventory) against a Wiktionary-derived German IPA dictionary.
 *
 * The dictionary is NOT vendored (CC BY-SA, ~787k lines). Fetch it once, then run:
 *   gh api -H "Accept: application/vnd.github.raw" repos/open-dict-data/ipa-dict/contents/data/de.txt > /tmp/de.txt
 *   npx tsx scripts/verify-ipa-against-dictionary.ts --dict /tmp/de.txt --write
 *
 * Output: reports/pronunciation-source-verification/IPA_SOURCE_VERIFICATION_2026-10-18.csv
 * The unit test `tests/unit/ipa-source-verification.test.ts` fails whenever a transcription in
 * the curriculum is not covered by this evidence, so edits must be re-verified.
 * Boundary: dictionary comparison of written transcriptions; no audio is analysed and no learner is scored.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { academicLessonList } from "../src/data/academic-lessons";
import { getArticulationGuide } from "../src/core/pronunciation/articulation";
import { arabicLearnerPronunciationInventory } from "../src/data/arabic-learner-pronunciation-inventory";
import { IPA_SOURCE_VERIFICATION_CSV, ipaVerificationKey, manualIpaDecisions } from "../src/core/german/ipa-source-verification";

const dictIndex = process.argv.indexOf("--dict");
const dictPath = dictIndex > 0 ? process.argv[dictIndex + 1] : undefined;
if (!dictPath) throw new Error("Pass --dict <path to ipa-dict de.txt>.");
const writeMode = process.argv.includes("--write");

const dictionary = new Map<string, string[]>();
for (const line of readFileSync(dictPath, "utf8").split("\n")) {
  const [word, pron] = line.split("\t");
  if (!word || !pron) continue;
  const list = pron.split(/,\s*/).map((item) => item.replace(/^\/|\/$/g, ""));
  dictionary.set(word, [...(dictionary.get(word) ?? []), ...list]);
}

const norm = (value: string) => value.normalize("NFC").replace(/[[\]/]/g, "").replace(/\u0361/g, "").replace(/ɡ/g, "g").trim();
const loose = (value: string) => norm(value)
  .replace(/ʔ/g, "").replace(/ˌ/g, "").replace(/\u032F/g, "")
  .replace(/ə(?=[nlm](?:$|[^aeiouəɛɪʊɔyøœʏɐ]))/g, "").replace(/\u0329/g, "")
  .replace(/r/g, "ʁ").replace(/ɔ[ʏɪy]/g, "ɔɪ").replace(/ɪç(?=$|[\s…])/g, "ɪk").replace(/ɪçs/g, "ɪks")
  .replace(/[\s.‿-]/g, "");
const lenient = (value: string) => loose(value).replace(/ˈ/g, "").replace(/tsuː/g, "tsu").replace(/ʊ/g, "u")
  .replace(/([bpf])m(?=$|[^aeiouəɛɪɔyøœʏɐ])/g, "$1n").replace(/ɪk(?=t)/g, "ɪç")
  .replace(/^(diː|das|deːɐ̯|deːɐ|dɛs|daɪ)\s*/, "").replace(/[ʔ\s]/g, "").replace(/eːɐ/g, "ɛɐ");

const lookupWord = (word: string) => dictionary.get(word) ?? dictionary.get(word.toLowerCase()) ?? dictionary.get(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
const linkIpa: Record<string, string> = { "": "", s: "s", n: "n", en: "ən", e: "ə" };
function splitCompound(word: string, depth = 0): string[] | undefined {
  if (depth > 3) return undefined;
  const lower = word.toLowerCase();
  for (let index = lower.length - 3; index >= 3; index -= 1) {
    for (const link of Object.keys(linkIpa)) {
      const head = lower.slice(0, index);
      if (link && !head.endsWith(link)) continue;
      const stem = link ? head.slice(0, -link.length) : head;
      const headIpa = lookupWord(stem);
      if (!headIpa) continue;
      const tailIpa = lookupWord(lower.slice(index)) ?? splitCompound(lower.slice(index), depth + 1);
      if (!tailIpa) continue;
      return [`${headIpa[0]}${linkIpa[link]}${tailIpa[0]}`];
    }
  }
  return undefined;
}
const lookup = (word: string) => lookupWord(word) ?? splitCompound(word);

type Row = { source: string; de: string; ipa: string; status: string; dictionaryIpa: string; decision: string; noteAr: string };
const rows: Row[] = [];
const seen = new Set<string>();
function classify(de: string, ipa: string): { status: string; dictionaryIpa: string } {
  const clean = de.replace(/[.,!?;:„“"()…—]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  let candidates = lookup(clean);
  if (!candidates && words.length > 1) {
    const perWord = words.map(lookup);
    if (perWord.every(Boolean)) candidates = [perWord.map((item) => item?.[0] ?? "").join(" ")];
  }
  if (!candidates) return { status: "not-in-dictionary", dictionaryIpa: "" };
  const dictionaryIpa = candidates.join(" | ");
  const fragments = (transform: (value: string) => string) => (ipa.includes("…") ? norm(ipa).split("…").map(transform).filter(Boolean) : [transform(ipa)]);
  if (candidates.some((candidate) => norm(candidate) === norm(ipa))) return { status: "exact", dictionaryIpa };
  if (candidates.some((candidate) => loose(candidate) === loose(ipa))) return { status: "notational-variant", dictionaryIpa };
  if (candidates.some((candidate) => fragments(loose).every((fragment) => loose(candidate).includes(fragment)))) return { status: "partial-transcription-match", dictionaryIpa };
  if (candidates.some((candidate) => fragments(lenient).every((fragment) => lenient(candidate).includes(fragment)))) return { status: "stress-weak-form-or-assimilation-variant", dictionaryIpa };
  return { status: "mismatch", dictionaryIpa };
}
function check(source: string, de: string, ipa: string) {
  const key = ipaVerificationKey(de, ipa);
  if (seen.has(key)) return;
  seen.add(key);
  const { status, dictionaryIpa } = classify(de, ipa);
  const manual = manualIpaDecisions[key];
  const needsManual = status === "mismatch" || status === "not-in-dictionary";
  if (needsManual && !manual) throw new Error(`Unresolved IPA row needs a manual decision: ${source} ${de} ${ipa} (dictionary: ${dictionaryIpa})`);
  rows.push({ source, de, ipa, status, dictionaryIpa, decision: manual?.decision ?? "accepted-dictionary-match", noteAr: manual?.noteAr ?? "" });
}

for (const lesson of academicLessonList) {
  for (const item of lesson.pronunciation.items) check(`lesson:${lesson.id}`, item.de, item.ipa);
  for (const pair of getArticulationGuide(lesson).pairs) for (const side of [pair.left, pair.right]) check(`pair:${pair.id}`, side.de, side.ipa);
}
for (const item of arabicLearnerPronunciationInventory) {
  check(`inventory:${item.id}`, item.leftDe, item.leftIpa);
  check(`inventory:${item.id}`, item.rightDe, item.rightIpa);
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
const csv = ["source,de,ipa,status,dictionary_ipa,decision,note_ar", ...rows.map((row) => [row.source, row.de, row.ipa, row.status, row.dictionaryIpa, row.decision, row.noteAr].map(csvCell).join(","))].join("\n");
const counts = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});
console.log(JSON.stringify({ rows: rows.length, counts }, null, 1));
if (writeMode) {
  mkdirSync("reports/pronunciation-source-verification", { recursive: true });
  writeFileSync(IPA_SOURCE_VERIFICATION_CSV, `${csv}\n`);
}
