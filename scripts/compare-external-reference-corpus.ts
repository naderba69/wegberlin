/**
 * P1-92 — compare every German string in src/data against an external reference corpus.
 *
 * Usage:
 *   npx tsx scripts/compare-external-reference-corpus.ts --corpus /path/outside/repo --label NAME [--write]
 *
 * The corpus directory holds UTF-8 .txt files plus sources.json
 * ([{file,title,publisher,isbn?,url,accessedAt}]). It must live OUTSIDE the repository: reference text is never
 * copied into the repo or the report. The report stores only our own segment IDs and text,
 * reference file names, segment indices, SHA-256 hashes, and scores.
 * § 44b UrhG: copies for text and data mining of lawfully accessible works are allowed and must be deleted
 * when no longer needed — delete the corpus directory after the run.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  compareWithReference,
  segmentGermanText,
  type ComparisonSegment,
} from "../src/core/content-validation/external-reference-comparison";

const args = process.argv.slice(2);
const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const corpusDir = option("--corpus");
const label = option("--label");
if (!corpusDir || !label || !/^[a-z0-9-]+$/.test(label)) throw new Error("Usage: --corpus <dir outside repo> --label <kebab-id> [--write]");
const repoRoot = path.resolve(process.cwd());
const corpusRoot = path.resolve(corpusDir);
if (corpusRoot === repoRoot || corpusRoot.startsWith(repoRoot + path.sep)) throw new Error("Reference corpus must live outside the repository (copyrighted text must never enter Git).");

type SourceMeta = { file: string; title: string; publisher: string; isbn?: string; url: string; accessedAt: string };
const sources = JSON.parse(await readFile(path.join(corpusRoot, "sources.json"), "utf8")) as SourceMeta[];
const files = (await readdir(corpusRoot)).filter((file) => file.endsWith(".txt")).sort();
for (const file of files) if (!sources.some((source) => source.file === file)) throw new Error(`No sources.json entry for ${file}`);
const reference = [] as Array<{ file: string; segments: string[] }>;
const referenceMeta = [] as Array<SourceMeta & { sha256: string; segmentCount: number; wordCount: number }>;
for (const file of files) {
  const text = await readFile(path.join(corpusRoot, file), "utf8");
  const segments = segmentGermanText(text);
  reference.push({ file, segments });
  referenceMeta.push({ ...sources.find((source) => source.file === file)!, sha256: createHash("sha256").update(text).digest("hex"), segmentCount: segments.length, wordCount: text.split(/\s+/).filter(Boolean).length });
}

// Collect every German string reachable from the exports of src/data/*.ts.
const ours: ComparisonSegment[] = [];
const dataDir = path.join(repoRoot, "src/data");
const visited = new WeakSet<object>();
const seenText = new Set<string>();
function walk(value: unknown, at: string) {
  if (typeof value === "string") {
    segmentGermanText(value).forEach((segment, index) => {
      if (seenText.has(segment)) return;
      seenText.add(segment);
      ours.push({ id: `${at}#${index}`, text: segment });
    });
    return;
  }
  if (!value || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${at}[${index}]`));
  else for (const [key, item] of Object.entries(value)) walk(item, `${at}.${key}`);
}
for (const file of (await readdir(dataDir)).filter((name) => name.endsWith(".ts")).sort()) {
  const dataModule = await import(pathToFileURL(path.join(dataDir, file)).href) as Record<string, unknown>;
  for (const [name, value] of Object.entries(dataModule)) walk(value, `${file.replace(/\.ts$/, "")}:${name}`);
}

const result = compareWithReference(ours, reference);
const report = {
  format: "dwnb-external-reference-comparison",
  label,
  ...result,
  references: referenceMeta,
  matches: result.matches.map((match) => ({ ...match, ourText: ours.find((segment) => segment.id === match.ourId)?.text })),
  boundary: "Reference text is not stored here: only hashes, segment indices, and scores. A match means lexical closeness to the reference; it is not a legal finding, and absence of matches covers only the reference pages listed.",
};
console.log(`External reference comparison (${label}): ${result.ourSegmentCount} project segments × ${result.referenceSegmentCount} reference segments · ${result.comparedPairCount} candidate pairs · ${result.matchCount} matches`);
for (const match of report.matches.slice(0, 60)) console.log(`- ${match.kind} ${match.score} run=${match.sharedRunTokens} ${match.ourId} ↔ ${match.referenceFile}[${match.referenceIndex}] :: ${match.ourText}`);
for (const near of report.closestBelowThreshold) console.log(`  closest ${near.score} ${near.ourId} ↔ ${near.referenceFile}[${near.referenceIndex}] :: ${ours.find((segment) => segment.id === near.ourId)?.text}`);
if (args.includes("--write")) {
  const out = path.join(repoRoot, "reports/external-reference-comparison", `${label}.json`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote ${path.relative(repoRoot, out)}`);
}
