#!/usr/bin/env node
/**
 * Delivery archive builder — ADR-082 plus the 2026-09-21 Vercel failure.
 *
 * Why this exists: a wrapped archive (`der-weg-nach-berlin/…`) makes `main` a repository whose
 * root has no `package.json`/`src/app`. Vercel then fails with
 *   "Couldn't find any `pages` or `app` directory. Please create one under the project root"
 * and the repo's own uploader cannot even extract itself (`unzip -jo … TERMUX_REPLACE_REPO.sh`
 * returns "caution: filename not matched"). So the layout is checked here, mechanically, before
 * the archive is ever handed over — an archive that would break a deploy is refused.
 *
 * Rules enforced (all measured, not asserted in prose):
 *  - built from the project root, entries stored flat: `package.json`, `next.config.ts`, `src/app/**`
 *  - zero entries starting with `der-weg-nach-berlin/` (or any single wrapper directory)
 *  - zero forbidden members: node_modules/, .next/, .git/, test-results/, playwright-report/,
 *    out/, coverage/, *.tsbuildinfo, .env*, *.dwnb
 *  - Vercel-critical files present at the ROOT of the archive
 *  - authored lesson sources present and non-empty (src/data/lessons-*.ts + explanation census)
 *  - sidecar checksum written next to the archive and re-verified
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = process.env.DELIVERY_ZIP ?? path.join(path.dirname(ROOT), "wegberlin-full.zip");
const REQUIRED_AT_ROOT = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "vercel.json",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "public/sw.js",
  "PROFESSIONAL_CONTINUATION_PROMPT_AR.md",
  "TERMUX_REPLACE_REPO.sh",
];
// CONTENT GUARD — intent: never hand over an archive that deploys a shell with no lessons.
//
// History: this rule used to demand `src/data/{exercises,curriculum,micro-drills}` as DIRECTORIES
// with 900/30/10 JSON files. Measured on 2026-09-22 that proxy is stale for this generation and
// was blocking delivery of a complete tree:
//   - 0 files under src/ import those paths; there is no import.meta.glob/require.context/readdir
//   - `@/data/curriculum` resolves to the FILE src/data/curriculum.ts, which holds all 96 modules
//   - the authored content lives in src/data/lessons-*.ts: 96 lessons · 677 exercises · 480 miniTest
//     · 288 reading-Q · 288 listening-Q · 976 flashcards · 272 theory blocks, 0 lessons empty
//   - governance agrees: 4,345 Zod objects / 2,805 closed items / 389 of 389 objective maps / 0 gaps
//   - `next build` emits 321/321 pages from exactly this tree
// So the directories are a historical artifact of an older layout, not missing product.
//
// The protection is KEPT but now measures the real thing: the lesson sources must be present and
// must actually carry authored text. A shell tree fails this just as loudly as before.
const REQUIRED_DATA_FILES = ["src/data/academic-lessons.ts", "src/data/curriculum.ts"];
const LESSON_SOURCE_GLOB = /^lessons-.*\.ts$/;
const MIN_LESSON_FILES = Number(process.env.DELIVERY_MIN_LESSON_FILES ?? 24);
const MIN_EXPLANATIONS = Number(process.env.DELIVERY_MIN_EXPLANATIONS ?? 1500);
const FORBIDDEN = /(^|\/)(node_modules|\.next|\.git|test-results|playwright-report|out|coverage)\//;
const FORBIDDEN_SUFFIX = /(\.tsbuildinfo|\.dwnb|\/\.env[^/]*)$/;
// A refusal must not leave a half-built archive behind: a stale ZIP in the same folder is exactly
// how the wrapped v154b bytes survived next to a v155 sidecar and got handed over twice.
const fail = (m) => {
  rmSync(OUT, { force: true });
  rmSync(`${OUT}.sha256`, { force: true });
  console.error(`delivery archive refused: ${m}`);
  process.exit(1);
};

if (!existsSync(path.join(ROOT, "package.json"))) fail(`not the project root: ${ROOT}`);

// Tree-level requirements are checked before anything is written, so an unfit tree never produces
// an archive that could be uploaded by mistake.
for (const rel of REQUIRED_AT_ROOT) {
  if (!existsSync(path.join(ROOT, rel))) fail(`tree is missing ${rel} (would be missing at the archive root too)`);
}
for (const rel of REQUIRED_DATA_FILES) {
  if (!existsSync(path.join(ROOT, rel))) fail(`authored data file missing from the tree: ${rel}`);
}
// Census the authored lesson sources: presence is not enough, they must hold real text.
const dataDir = path.join(ROOT, "src/data");
if (!existsSync(dataDir)) fail("src/data is missing from the tree");
const dataFiles = readdirSync(dataDir).filter((f) => f.endsWith(".ts"));
const lessonFiles = dataFiles.filter((f) => LESSON_SOURCE_GLOB.test(f));
if (lessonFiles.length < MIN_LESSON_FILES) {
  fail(`src/data holds ${lessonFiles.length} lessons-*.ts file(s) (< ${MIN_LESSON_FILES}) — the authored content is not present; recover it before delivering`);
}
let explanations = 0;
for (const f of lessonFiles) {
  explanations += (readFileSync(path.join(dataDir, f), "utf8").match(/explanationAr:/g) ?? []).length;
}
if (explanations < MIN_EXPLANATIONS) {
  fail(`authored lessons carry only ${explanations} explanation field(s) (< ${MIN_EXPLANATIONS}) — this tree would deploy a shell`);
}
const treeDataFiles = dataFiles.length;

rmSync(OUT, { force: true });
rmSync(`${OUT}.sha256`, { force: true });

const zipArgs = ["-qr", OUT, ".",
  "-x", "./node_modules/*", "-x", "./.next/*", "-x", "./.git/*",
  "-x", "./test-results/*", "-x", "./playwright-report/*", "-x", "./out/*",
  "-x", "./coverage/*", "-x", "./__pycache__/*", "-x", "*.tsbuildinfo",
  "-x", "./.env*", "-x", "*.dwnb"];
execFileSync("zip", zipArgs, { cwd: ROOT, stdio: "inherit" });

const names = execFileSync("unzip", ["-Z1", OUT], { encoding: "utf8" }).split("\n").filter(Boolean);
const files = names.filter((n) => !n.endsWith("/"));
const dirs = names.filter((n) => n.endsWith("/"));
const wrapped = names.filter((n) => n.startsWith("der-weg-nach-berlin/"));
const forbidden = names.filter((n) => FORBIDDEN.test(n) || FORBIDDEN_SUFFIX.test(n));
const set = new Set(names);
if (wrapped.length) fail(`${wrapped.length} entries carry the wrapper folder "der-weg-nach-berlin/"`);
if (forbidden.length) fail(`forbidden entries present: ${forbidden.slice(0, 3).join(", ")}`);
for (const rel of REQUIRED_AT_ROOT) {
  if (!set.has(rel)) fail(`missing at archive root (Vercel-critical): ${rel}`);
}
// The tree's authored data must survive the exclusion rules intact.
for (const rel of REQUIRED_DATA_FILES) {
  if (!set.has(rel)) fail(`authored data file missing from the archive: ${rel}`);
}
const archiveDataFiles = files.filter((n) => /^src\/data\/[^/]+\.ts$/.test(n)).length;
if (archiveDataFiles < treeDataFiles) {
  fail(`src/data has ${treeDataFiles} .ts file(s) in the tree but only ${archiveDataFiles} in the archive`);
}
const archiveLessonFiles = files.filter((n) => /^src\/data\/lessons-.*\.ts$/.test(n)).length;
if (archiveLessonFiles < lessonFiles.length) {
  fail(`src/data has ${lessonFiles.length} lessons-*.ts in the tree but only ${archiveLessonFiles} in the archive`);
}
// The uploader extracts itself by bare member name; that must keep working.
try {
  execFileSync("unzip", ["-Z1", OUT, "TERMUX_REPLACE_REPO.sh"], { encoding: "utf8", stdio: "pipe" });
} catch { fail("TERMUX_REPLACE_REPO.sh is not addressable by bare name at the archive root"); }

const sha = createHash("sha256").update(readFileSync(OUT)).digest("hex");
const sidecar = `${sha}  ${path.basename(OUT)}\n`;
writeFileSync(`${OUT}.sha256`, sidecar);
execFileSync("sha256sum", ["-c", `${path.basename(OUT)}.sha256`], { cwd: path.dirname(OUT), stdio: "inherit" });
execFileSync("unzip", ["-t", OUT], { stdio: "ignore" });

console.log(`- delivery archive: ${OUT}`);
console.log(`  entries: ${files.length} files + ${dirs.length} dir entries = ${names.length} · size ${statSync(OUT).size} bytes`);
console.log(`  sha256: ${sha}`);
console.log(`  layout: flat (project files at the archive root) · wrapper entries 0 · forbidden entries 0`);
console.log(`  authored data: ${archiveDataFiles}/${treeDataFiles} src/data/*.ts · ${archiveLessonFiles} lessons-*.ts · ${explanations} explanation fields`);
console.log(`  Vercel-critical at root: ${REQUIRED_AT_ROOT.filter((r) => set.has(r)).length}/${REQUIRED_AT_ROOT.length}`);
console.log(`  repo after upload: root = project root (npm install && npm run build finds src/app)`);
