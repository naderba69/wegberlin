/**
 * Compare the official Goethe-Institut Wortlisten (A1, A2, B1) with the core curriculum.
 *
 * Usage:
 *   /tmp/pdfv/bin/python scripts/parse-goethe-wortliste.py --dir /tmp/goethe-src A1 A2 B1
 *   npx tsx scripts/compare-goethe-wordlists.ts --entries /tmp/goethe-src [--write]
 *   npx tsx scripts/compare-goethe-wordlists.ts --from-report [--write]   (ADR-141 / v250, see below)
 *
 * The entries directory must live OUTSIDE the repository: the Goethe lists are copyrighted
 * (section 52a notice in each PDF). The report stores only counts, our own lesson IDs and the
 * lemmas that our lessons do NOT contain (section 44b UrhG, text and data mining). Delete the
 * directory after the run.
 *
 * Matching (deliberately strict, see docs/GOETHE_REFERENCE_ALIGNMENT_AR.md):
 * - a Goethe headword counts as present when its folded lemma is one of the lemmatizer
 *   candidates (src/core/german/lemmatizer.ts, no legacy stem) of a token in the lessons of
 *   that level or below; separable verbs also count when the base verb and the particle end
 *   the same clause ("Der Zug fährt um acht ab").
 * - "taught explicitly" uses only phrases, flashcards, reading glossary and the noun/verb
 *   registry; "appears" uses every German string of the lesson.
 *
 * --from-report (ADR-141 / v250): when the PDFs are not at hand, re-checks only the headwords the
 * committed report lists as missing (absentFromAllLessonsList + firstAppearsLaterList) against the
 * current lessons, with the same matcher. Newly present words are added to the committed counts;
 * "taught explicitly" then grows only by missing words that are now taught, so it is a lower bound.
 * Headword totals, anywhereInAppAnyLevelPct and wortgruppenCoveredPct are carried over from the last
 * full run and say so in `incremental`. A later full run with the PDFs replaces every number.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { academicLessonList as lessons } from "../src/data/academic-lessons";
import { nounsByLesson, verbFramesByLesson } from "../src/data/lexical-grammar-registry";
import { foldGerman, lemmaCandidates } from "../src/core/german/lemmatizer";
import { germanLemmaDictionary } from "../src/data/german-lemma-dictionary";
import type { FullLesson } from "../src/types/lesson-content";

const args = process.argv.slice(2);
const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const fromReport = args.includes("--from-report");
const entriesDir = option("--entries") ?? (fromReport ? "/nonexistent-goethe-entries" : undefined);
if (!entriesDir) throw new Error("Usage: --entries <dir outside repo> [--write] | --from-report [--write]");
const repoRoot = path.resolve(process.cwd());
const entriesRoot = path.resolve(entriesDir);
if (entriesRoot === repoRoot || entriesRoot.startsWith(repoRoot + path.sep)) throw new Error("The Goethe lists are copyrighted: --entries must live outside the repository.");

type Entry = { raw: string; page: number; lemma: string; alts: string[]; noun: boolean; sub: boolean; regional: boolean };
type Bag = { cands: Set<string>; tokens: Set<string>; clauses: Array<{ last: string; cands: Set<string> }> };
const LEVELS = ["A1", "A2", "B1", "B2"] as const;
type Level = (typeof LEVELS)[number];
const WORDLIST_LEVELS = ["A1", "A2", "B1"] as const;
const rank = (level: string) => LEVELS.indexOf(level as Level);
const SEPARABLE = ["zurueck", "zusammen", "vorbei", "weiter", "wieder", "heraus", "herein", "hinaus", "herunter", "hinunter", "nach", "fest", "frei", "hoch", "statt", "teil", "fern", "durch", "um", "los", "weg", "ein", "aus", "auf", "mit", "vor", "bei", "ab", "an", "zu", "her", "hin", "kennen", "kaputt", "spazieren", "leid", "sauber", "fort", "dabei", "dazu", "rauf", "raus", "rein", "runter"];

const newBag = (): Bag => ({ cands: new Set(), tokens: new Set(), clauses: [] });
const candidateCache = new Map<string, string[]>();
function candidates(token: string): string[] {
  let cached = candidateCache.get(token);
  if (!cached) { cached = lemmaCandidates(token, germanLemmaDictionary); candidateCache.set(token, cached); }
  return cached;
}
function addText(bag: Bag, text: string): void {
  for (const clause of text.split(/[.,!?;:\n„“"()–]+/)) {
    const tokens = foldGerman(clause).split(/\s+/).filter(Boolean);
    const clauseCands = new Set<string>();
    for (const token of tokens) { bag.tokens.add(token); for (const candidate of candidates(token)) { bag.cands.add(candidate); clauseCands.add(candidate); } }
    // Hyphenated words fold to two tokens (E-Mail → "e mail"); keep the pairs for those headwords.
    for (let index = 1; index < tokens.length; index += 1) bag.tokens.add(`${tokens[index - 1]} ${tokens[index]}`);
    if (tokens.length > 1) bag.clauses.push({ last: tokens[tokens.length - 1], cands: clauseCands });
  }
}
function merge(target: Bag, source: Bag): void {
  for (const value of source.cands) target.cands.add(value);
  for (const value of source.tokens) target.tokens.add(value);
  target.clauses.push(...source.clauses);
}
/** Every German string of a lesson: skips Arabic fields, ids and IPA. */
function germanStrings(value: unknown, key = "", acc: string[] = []): string[] {
  if (typeof value === "string") { if (!/(Ar|^ar|^id|Id|^ipa)$/.test(key)) acc.push(value); }
  else if (Array.isArray(value)) for (const item of value) germanStrings(item, key, acc);
  else if (value && typeof value === "object") for (const [childKey, child] of Object.entries(value)) germanStrings(child, childKey, acc);
  return acc;
}
function explicitTexts(lesson: FullLesson): string[] {
  return [
    ...lesson.phrases.map((phrase) => phrase.de),
    ...lesson.flashcards.map((card) => card.frontDe),
    ...lesson.reading.glossary.flatMap((entry) => [entry.lemma, entry.surfaceForm]),
    ...(nounsByLesson[lesson.id] ?? []).map((noun) => noun.lemma),
    ...(verbFramesByLesson[lesson.id] ?? []).flatMap((frame) => [frame.infinitive, frame.chunkDe]),
  ];
}

const explicitByLevel = Object.fromEntries(LEVELS.map((level) => [level, newBag()])) as Record<Level, Bag>;
const allByLevel = Object.fromEntries(LEVELS.map((level) => [level, newBag()])) as Record<Level, Bag>;
const firstSeen = new Map<string, number>();
for (const lesson of lessons) {
  const explicit = newBag(); const all = newBag();
  for (const text of explicitTexts(lesson)) addText(explicit, text);
  for (const text of germanStrings(lesson)) addText(all, text);
  const lessonRank = rank(lesson.level);
  for (const level of LEVELS.slice(lessonRank)) { merge(explicitByLevel[level], explicit); merge(allByLevel[level], all); }
  for (const candidate of all.cands) if (!firstSeen.has(candidate) || firstSeen.get(candidate)! > lessonRank) firstSeen.set(candidate, lessonRank);
}

/**
 * Bound headwords (ADR-150 / v259). The lists print a few headwords as bound forms with a trailing hyphen
 * (all-, jed-, Lieblings-, Geburts-, Einzel-, dar-); the parser strips the hyphen, and none of the six is a
 * standalone German word, so a whole-word match can never find them. They count as present when a token shows
 * the bound form in use: an inflected determiner (alle, jeder), a compound (Lieblingsessen, Geburtsdatum,
 * Einzelzimmer, einzeln) or a da(r)- adverb (darauf, daran, darin, darum, darüber). Folded spelling, so ü = ue.
 */
const BOUND_FORMS: Record<string, RegExp> = {
  all: /^all(?:e|er|es|en|em)$/,
  jed: /^jed(?:e|er|es|en|em)$/,
  lieblings: /^lieblings[a-z]{3,}$/,
  geburts: /^geburts[a-z]{3,}$/,
  einzel: /^einzel(?:n|ne|nen|ner|nes|nem|[a-z]{4,})$/,
  dar: /^dar(?:an|auf|aus|in|ueber|um|unter)$/,
};
function present(entry: Entry, bag: Bag): boolean {
  for (const alternative of entry.alts) {
    const folded = foldGerman(alternative).trim();
    if (!folded) continue;
    if (bag.cands.has(folded) || bag.tokens.has(folded)) return true;
    const bound = BOUND_FORMS[folded];
    if (bound) { for (const token of bag.tokens) if (bound.test(token)) return true; continue; }
    if (folded.includes(" ")) continue;
    if (/n$/.test(folded)) {
      for (const particle of SEPARABLE) {
        if (!folded.startsWith(particle) || folded.length - particle.length < 4) continue;
        const base = folded.slice(particle.length);
        if (bag.clauses.some((clause) => clause.last === particle && clause.cands.has(base))) return true;
      }
    }
  }
  return false;
}
const firstLevel = (entry: Entry): number | null => {
  let best: number | null = null;
  for (const alternative of entry.alts) { const seen = firstSeen.get(foldGerman(alternative).trim()); if (seen !== undefined && (best === null || seen < best)) best = seen; }
  return best;
};
const label = (entry: Entry) => `${entry.noun ? `${entry.raw.split(" ")[0]} ` : ""}${entry.alts.join("/")}`;

// Upper bound: German strings anywhere in src/data (all features, any level).
const appBag = newBag();
for (const file of readdirSync(path.join(repoRoot, "src/data"), { recursive: true }) as string[]) {
  if (!file.endsWith(".ts")) continue;
  const source = readFileSync(path.join(repoRoot, "src/data", file), "utf8");
  for (const match of source.matchAll(/"((?:[^"\\]|\\.)*)"|`([^`]*)`/g)) addText(appBag, match[1] ?? match[2] ?? "");
}

const levels: Record<string, unknown> = {};
const reportPath = path.join(repoRoot, "reports/goethe-reference-alignment.json");
type LevelReport = Record<string, unknown> & { headwords: number; appearsInLessonsUpToLevel: number; taughtExplicitlyUpToLevel: number; absentFromAllLessonsList: string[]; firstAppearsLaterList: string[] };
const committed = fromReport ? JSON.parse(readFileSync(reportPath, "utf8")) as { levels: Record<string, LevelReport>; incremental?: unknown } : null;
const entryFromLabel = (label: string): Entry => {
  const tokens = label.split(" ");
  const noun = tokens.length > 1 && ["der", "die", "das"].includes(tokens[0]!);
  const rest = noun ? tokens.slice(1).join(" ") : label;
  return { raw: label, page: 0, lemma: rest.split("/")[0]!, alts: rest.split("/"), noun, sub: false, regional: false };
};
for (const level of committed ? [] : WORDLIST_LEVELS) {
  const raw = JSON.parse(readFileSync(path.join(entriesRoot, `${level}.entries.json`), "utf8")) as Entry[];
  const seen = new Set<string>(); const entries: Entry[] = [];
  for (const entry of raw) {
    if (entry.regional || /^\(/.test(entry.raw) || /^gehen\/sein/.test(entry.raw) || !entry.alts.length) continue;
    const key = foldGerman(entry.alts[0]).trim();
    if (!seen.has(key)) { seen.add(key); entries.push(entry); }
  }
  const rows = entries.map((entry) => ({ entry, explicit: present(entry, explicitByLevel[level]), any: present(entry, allByLevel[level]) }));
  const missing = rows.filter((row) => !row.any).map((row) => row.entry);
  const later = missing.map((entry) => ({ entry, at: firstLevel(entry) })).filter((item): item is { entry: Entry; at: number } => item.at !== null && item.at > rank(level));
  const never = missing.filter((entry) => firstLevel(entry) === null && !present(entry, allByLevel.B2));
  const groupText = readFileSync(path.join(entriesRoot, `${level}.groups.txt`), "utf8");
  const groupJunk = new Set(["inventare", "wortgruppenliste", "wortgruppen", "wortliste", "seite", "usw", "siehe", "zertifikat", "goethe", "nen", "ter", "etsiltrow"]);
  const groupTokens = [...new Set(foldGerman(groupText).split(/\s+/).filter((token) => token.length >= 3 && !/\d/.test(token) && !groupJunk.has(token)))];
  const groupCovered = groupTokens.filter((token) => allByLevel[level].cands.has(token) || allByLevel[level].tokens.has(token)).length;
  const pct = (part: number, whole: number) => +(100 * part / whole).toFixed(1);
  levels[level] = {
    headwords: entries.length,
    indentedSubEntries: entries.filter((entry) => entry.sub).length,
    appearsInLessonsUpToLevel: rows.filter((row) => row.any).length,
    appearsPct: pct(rows.filter((row) => row.any).length, entries.length),
    taughtExplicitlyUpToLevel: rows.filter((row) => row.explicit).length,
    taughtExplicitlyPct: pct(rows.filter((row) => row.explicit).length, entries.length),
    anywhereInAppAnyLevelPct: pct(entries.filter((entry) => present(entry, appBag)).length, entries.length),
    missingAtLevel: missing.length,
    missingNouns: missing.filter((entry) => entry.noun).length,
    firstAppearsLater: Object.fromEntries(LEVELS.map((name, index) => [name, later.filter((item) => item.at === index).length]).filter(([, count]) => count)),
    absentFromAllLessons: never.length,
    wortgruppenTokens: groupTokens.length,
    wortgruppenCoveredPct: pct(groupCovered, groupTokens.length),
    absentFromAllLessonsList: never.map(label),
    firstAppearsLaterList: later.map((item) => `${label(item.entry)} → ${LEVELS[item.at]}`),
  };
}

if (committed) {
  for (const level of WORDLIST_LEVELS) {
    const previous = committed.levels[level]!;
    const entries = [...previous.absentFromAllLessonsList, ...previous.firstAppearsLaterList.map((item) => item.split(" → ")[0]!)].map(entryFromLabel);
    const rows = entries.map((entry) => ({ entry, explicit: present(entry, explicitByLevel[level]), any: present(entry, allByLevel[level]) }));
    const missing = rows.filter((row) => !row.any).map((row) => row.entry);
    const later = missing.map((entry) => ({ entry, at: firstLevel(entry) })).filter((item): item is { entry: Entry; at: number } => item.at !== null && item.at > rank(level));
    const never = missing.filter((entry) => firstLevel(entry) === null && !present(entry, allByLevel.B2));
    const pct = (part: number, whole: number) => +(100 * part / whole).toFixed(1);
    const appears = previous.appearsInLessonsUpToLevel + rows.filter((row) => row.any).length;
    const taught = previous.taughtExplicitlyUpToLevel + rows.filter((row) => row.explicit).length;
    levels[level] = {
      ...previous,
      appearsInLessonsUpToLevel: appears,
      appearsPct: pct(appears, previous.headwords),
      taughtExplicitlyUpToLevel: taught,
      taughtExplicitlyPct: pct(taught, previous.headwords),
      // The labels fold a few duplicate headwords together, so the counts subtract instead of recounting.
      missingAtLevel: (previous.missingAtLevel as number) - rows.filter((row) => row.any).length,
      missingNouns: (previous.missingNouns as number) - rows.filter((row) => row.any && row.entry.noun).length,
      firstAppearsLater: Object.fromEntries(LEVELS.map((name, index) => [name, later.filter((item) => item.at === index).length]).filter(([, count]) => count)),
      absentFromAllLessons: (previous.absentFromAllLessons as number) - (previous.absentFromAllLessonsList.length - never.length),
      absentFromAllLessonsList: never.map((entry) => entry.raw),
      firstAppearsLaterList: later.map((item) => `${item.entry.raw} → ${LEVELS[item.at]}`),
    };
  }
}

const report = {
  generatedBy: "scripts/compare-goethe-wordlists.ts",
  method: "strict-lemma-candidates-v1",
  note: "Counts and missing lemmas only (section 44b UrhG). The Goethe PDFs are not in the repository; editions are pinned by SHA-256 in docs/GOETHE_REFERENCE_ALIGNMENT_AR.md.",
  lessons: Object.fromEntries(LEVELS.map((level) => [level, lessons.filter((lesson) => lesson.level === level).length])),
  levels,
  ...(committed ? { incremental: {
    mode: "from-report",
    note: "Only the previously missing headwords were re-checked with the same matcher; taughtExplicitly is a lower bound. headwords, anywhereInAppAnyLevelPct and wortgruppenCoveredPct are carried over from the last full PDF run.",
  } } : {}),
};
for (const level of WORDLIST_LEVELS) {
  const summary = Object.fromEntries(Object.entries(levels[level] as Record<string, unknown>).filter(([key]) => !key.endsWith("List")));
  console.log(level, JSON.stringify(summary));
}
if (args.includes("--write")) writeFileSync(path.join(repoRoot, "reports/goethe-reference-alignment.json"), `${JSON.stringify(report, null, 2)}\n`);
