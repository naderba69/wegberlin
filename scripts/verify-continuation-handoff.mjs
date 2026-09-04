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
const sourceRegistry = json("src/config/source-verification-registry.json");
const sourceWorkflow = read(".github/workflows/source-freshness.yml");
const zeroCost = read("ZERO_COST.md");
const academicAudit = json("reports/academic-content-audit.json");
const academicSchemaReport = read("docs/generated/ACADEMIC_SCHEMA_REPORT.md");
const answerIntegrityReport = read("docs/generated/ANSWER_INTEGRITY_REPORT.md");
const objectiveCoverageReport = read("docs/generated/OBJECTIVE_COVERAGE_REPORT.md");
const masteryWeighting = read("src/core/evidence/mastery-weighting.ts");
const sm2 = read("src/core/srs/sm2.ts");
const lexicalGrammar = read("src/data/lexical-grammar-a1.ts");
const lexicalPanel = read("src/components/lexical-grammar-panel.tsx");
const termuxReplace = read("TERMUX_REPLACE_REPO.sh");
const termuxGuide = read("TERMUX_GITHUB_UPLOAD.md");
const termuxOneCommand = read("TERMUX_ONE_COMMAND.txt");

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
if (partialIds.length !== 19) fail(`P0 partial table has ${partialIds.length} rows`);
if (missingIds.length !== 2) fail(`P0 missing table has ${missingIds.length} rows`);
if (blockedIds.length !== 1) fail(`P0 blocked table has ${blockedIds.length} rows`);
for (const text of ["Implemented: 102", "Partial: 19", "Not implemented: 2", "Blocked by user credentials: 1"]) requireText(prompt, text, "continuation prompt P0 counters");
for (const text of ["102 implemented, 19 partial, 2 not implemented", "264/264", "50/50", "301 generated static/SSG pages", "298/298"]) requireText(status, text, "PROJECT_STATUS.md");
for (const text of ["264/264", "50/50"]) requireText(readme, text, "README.md");

if (offline.routeCount !== 298 || offline.routes.length !== 298 || new Set(offline.routes).size !== 298) fail("offline route manifest is not exactly 298 unique routes");
if (libraryAudio.assets.length !== 80 || libraryAudio.generatedAssetCount !== 80) fail("library audio count drifted");
if (lessonAudio.assets.length !== 84 || lessonAudio.generatedAssetCount !== 84) fail("lesson audio count drifted");
if (examAudio.assets.length !== 96 || examAudio.coveredClipCount !== 90 || examAudio.fullyCoveredTaskCount !== 42) fail("exam audio counters drifted");

const cacheMatch = worker.match(/const PACK_CACHE = "([^"]+)"/);
if (!cacheMatch) fail("PACK_CACHE constant is missing");
const cacheName = cacheMatch[1];
if (cacheName !== "dwnb-full-pack-v52") fail(`unexpected current cache ${cacheName}`);
requireText(e2e, `caches.open("${cacheName}")`, "Playwright cache contract");
requireText(prompt, `Offline cache: ${cacheName}`, "continuation prompt cache contract");

if (sourceRegistry.schemaVersion !== 1 || sourceRegistry.policyVersion !== "source-freshness-v1" || sourceRegistry.records?.length !== 12) fail("official-source registry contract drifted");
if (new Set(sourceRegistry.records.map((record) => record.id)).size !== 12) fail("official-source registry IDs are not unique");
requireText(prompt, "Official source records: 12/12", "continuation prompt source registry");
requireText(status, "12/12 official source records", "PROJECT_STATUS.md source registry");
requireText(zeroCost, "Hard mandatory budget: **0 USD**", "ZERO_COST.md");
requireText(sourceWorkflow, "node scripts/audit-source-freshness.mjs --fail-on=due --probe", "monthly source workflow");

if (academicAudit.version !== "academic-governance-v1") fail("academic audit version drifted");
if (academicAudit.schema?.counts?.totalRootObjects !== 2665 || academicAudit.schema?.schemaFamilies !== 12) fail("academic Zod counters drifted");
if (academicAudit.schema?.counts?.nounGrammarEntries !== 96 || academicAudit.schema?.counts?.verbPrepositionFrames !== 24) fail("A1 lexical grammar counters drifted");
if (academicAudit.answerIntegrity?.closedAnswerItems !== 2584 || academicAudit.answerIntegrity?.productiveTasks !== 348 || academicAudit.answerIntegrity?.failures !== 0 || academicAudit.answerIntegrity?.exemptions !== 3) fail("answer integrity counters drifted");
if (academicAudit.objectiveCoverage?.objectives !== 336 || academicAudit.objectiveCoverage?.gaps !== 0) fail("objective coverage counters drifted");
for (const report of [academicSchemaReport, answerIntegrityReport, objectiveCoverageReport]) requireText(report, academicAudit.contentSha256, "generated academic report hash");
for (const text of ["2,665", "2,584", "348", "336/336"]) requireText(prompt, text, "continuation prompt academic audit");
for (const text of ["NOVEL_TRANSFER_WEIGHT = 1.5", "NOVEL_PRACTICE_WEIGHT = 1", "SAME_ITEM_RETRY_WEIGHT = 0.25"]) requireText(masteryWeighting, text, "mastery novelty weights");
for (const text of ["sm2-v2-calendar", "review-calendar-v1", "calendarPartsAt"]) requireText(sm2, text, "zoned SM-2 contract");
for (const text of ["novelty-weighting-v1", "sm2-v2-calendar", "review-calendar-v1"]) requireText(prompt, text, "continuation prompt mastery/calendar contract");
for (const text of ["a1-lexical-grammar-v1", "\"a1-01\"", "\"a1-24\""]) requireText(lexicalGrammar, text, "A1 lexical grammar registry");
for (const text of ["Nomen mit Artikel, Plural und Kasus", "Verb + Präposition + Kasus", "A2–B2"]) requireText(lexicalPanel, text, "A1 lexical grammar panel");
for (const text of ["96 سجل اسم", "24 إطار فعل/حرف جر", "24/24 درس A1"]) requireText(prompt, text, "continuation prompt A1 lexical grammar contract");
for (const text of ["2026-09-04 — Africa/Tunis", "wegberlin-full.zip.sha256", "TERMUX_REPLACE_REPO.sh", "sha256sum -c wegberlin-full.zip.sha256", "دون Force"]) requireText(prompt, text, "continuation prompt Termux handoff");
for (const text of ["storage/downloads/wegberlin-full.zip", "gh api user --jq .login", "git push origin main", "GIT_ASKPASS"] ) requireText(termuxReplace, text, "Termux clean-replacement script");
for (const forbidden of ["git push -f", "gh auth login", "@github.com/${GITHUB_PAT}"]) if (termuxReplace.includes(forbidden)) fail(`Termux replacement script contains forbidden pattern ${forbidden}`);
for (const text of ["wegberlin-full.zip", "wegberlin-full.zip.sha256", "Contents: Read and write", "ممنوع `git push -f`"]) requireText(termuxGuide, text, "Termux upload guide");
for (const text of ["sha256sum -c wegberlin-full.zip.sha256", "TERMUX_REPLACE_REPO.sh", "git ls-remote origin refs/heads/main"]) requireText(termuxOneCommand, text, "Termux one-command handoff");

if (packageJson.dependencies.next !== "16.3.3" || packageJson.dependencies.react !== "19.2.8") fail("framework versions drifted from the audited handoff");
if (packageJson.scripts.dev !== "next dev --webpack") fail("dev server must remain webpack by default");
if (!packageJson.scripts.check.includes("source:audit -- --strict")) fail("strict source freshness audit must remain in npm run check");
if (!packageJson.scripts.prebuild.includes("content:audit")) fail("academic content audit must remain in prebuild");

console.log("Continuation handoff verified:");
console.log(`- backlog: P0 ${expectedPriorities.P0}, P1 ${expectedPriorities.P1}, P2 ${expectedPriorities.P2}`);
console.log(`- P0 state: 102 implemented, ${partialIds.length} partial, ${missingIds.length} missing, ${blockedIds.length} blocked`);
console.log(`- curriculum/audio: 84 lessons, 80 library MP3, 84 lesson MP3, 96 exam files / 90 clips`);
console.log(`- governance: ${sourceRegistry.records.length} official sources; ${academicAudit.schema.counts.totalRootObjects} Zod roots; ${academicAudit.answerIntegrity.closedAnswerItems} answers; ${academicAudit.objectiveCoverage.objectives} objectives`);
console.log(`- A1 lexical grammar: ${academicAudit.schema.counts.nounGrammarEntries} nouns + ${academicAudit.schema.counts.verbPrepositionFrames} verb frames across 24 lessons`);
console.log(`- mastery/calendar: novelty-weighting-v1, sm2-v2-calendar, review-calendar-v1`);
console.log(`- delivery: ${offline.routeCount} Offline routes, ${cacheName}, 264 unit/integrity and 50 browser tests documented`);
