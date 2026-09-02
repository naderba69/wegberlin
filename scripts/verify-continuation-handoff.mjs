import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const json = (path) => JSON.parse(read(path));
const fail = (message) => { throw new Error(`Handoff verification failed: ${message}`); };
const requireText = (content, value, label) => { if (!content.includes(value)) fail(`${label} is missing ${JSON.stringify(value)}`); };

const ideas = read("IDEA_BACKLOG.md");
const prompt = read("PROFESSIONAL_CONTINUATION_PROMPT_AR.md");
const p0Audit = read("P0_AUDIT.md");
const status = read("PROJECT_STATUS.md");
const readme = read("README.md");
const worker = read("public/sw.js");
const e2e = read("tests/e2e/critical-flows.spec.ts");
const packageJson = json("package.json");
const offline = json("public/offline-routes.json");
const libraryAudio = json("public/audio/library/manifest.json");
const lessonAudio = json("public/audio/lessons/manifest.json");
const examAudio = json("public/audio/exams/manifest.json");

const priorityCount = (priority) => [...ideas.matchAll(new RegExp(`\\*\\*\\[${priority}\\]\\*\\*`, "g"))].length;
const expectedPriorities = { P0: 124, P1: 132, P2: 140 };
for (const [priority, expected] of Object.entries(expectedPriorities)) {
  const actual = priorityCount(priority);
  if (actual !== expected) fail(`${priority} count is ${actual}, expected ${expected}`);
  requireText(prompt, `${priority === "P0" ? "Total P0: 124" : priority === "P1" ? "## 8. حالة P1 — 132 اقتراحًا" : "## 9. حالة P2 — 140 اقتراحًا"}`, "continuation prompt");
}

const auditSectionIds = (start, end) => {
  const section = p0Audit.split(start)[1]?.split(end)[0] ?? "";
  return [...section.matchAll(/^\| (\d+) \|/gm)].map((match) => Number(match[1]));
};
const partialIds = auditSectionIds("## P0 المنجز جزئيًا", "## P0 غير المنجز");
const missingIds = auditSectionIds("## P0 غير المنجز", "## P0 المتوقف");
const blockedIds = auditSectionIds("## P0 المتوقف", "## عناصر P0");
if (partialIds.length !== 25) fail(`P0 partial table has ${partialIds.length} rows`);
if (missingIds.length !== 3) fail(`P0 missing table has ${missingIds.length} rows`);
if (blockedIds.length !== 1) fail(`P0 blocked table has ${blockedIds.length} rows`);
for (const text of ["Implemented: 95", "Partial: 25", "Not implemented: 3", "Blocked by user credentials: 1"]) requireText(prompt, text, "continuation prompt P0 counters");
for (const text of ["95 implemented, 25 partial, 3 not implemented", "226/226", "50/50", "301 generated static/SSG pages", "298/298"]) requireText(status, text, "PROJECT_STATUS.md");
for (const text of ["226/226", "50/50"]) requireText(readme, text, "README.md");

if (offline.routeCount !== 298 || offline.routes.length !== 298 || new Set(offline.routes).size !== 298) fail("offline route manifest is not exactly 298 unique routes");
if (libraryAudio.assets.length !== 80 || libraryAudio.generatedAssetCount !== 80) fail("library audio count drifted");
if (lessonAudio.assets.length !== 84 || lessonAudio.generatedAssetCount !== 84) fail("lesson audio count drifted");
if (examAudio.assets.length !== 96 || examAudio.coveredClipCount !== 90 || examAudio.fullyCoveredTaskCount !== 42) fail("exam audio counters drifted");

const cacheMatch = worker.match(/const PACK_CACHE = "([^"]+)"/);
if (!cacheMatch) fail("PACK_CACHE constant is missing");
const cacheName = cacheMatch[1];
if (cacheName !== "dwnb-full-pack-v48") fail(`unexpected current cache ${cacheName}`);
requireText(e2e, `caches.open("${cacheName}")`, "Playwright cache contract");
requireText(prompt, `Offline cache: ${cacheName}`, "continuation prompt cache contract");

if (packageJson.dependencies.next !== "16.3.3" || packageJson.dependencies.react !== "19.2.8") fail("framework versions drifted from the audited handoff");
if (packageJson.scripts.dev !== "next dev --webpack") fail("dev server must remain webpack by default");

console.log("Continuation handoff verified:");
console.log(`- backlog: P0 ${expectedPriorities.P0}, P1 ${expectedPriorities.P1}, P2 ${expectedPriorities.P2}`);
console.log(`- P0 state: 95 implemented, ${partialIds.length} partial, ${missingIds.length} missing, ${blockedIds.length} blocked`);
console.log(`- curriculum/audio: 84 lessons, 80 library MP3, 84 lesson MP3, 96 exam files / 90 clips`);
console.log(`- delivery: ${offline.routeCount} Offline routes, ${cacheName}, 226 unit/integrity and 50 browser tests documented`);
