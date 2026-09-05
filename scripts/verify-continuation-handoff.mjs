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
const offlineSizes = json("public/offline-size-manifest.json");
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
const lexicalGrammarA2 = read("src/data/lexical-grammar-a2.ts");
const lexicalRegistry = read("src/data/lexical-grammar-registry.ts");
const lexicalGrammarB1 = read("src/data/lexical-grammar-b1.ts");
const lexicalGrammarB2 = read("src/data/lexical-grammar-b2.ts");
const lexicalPanel = read("src/components/lexical-grammar-panel.tsx");
const lexicalBuild = read("src/data/lexical-grammar-build.ts");
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
if (partialIds.length !== 17) fail(`P0 partial table has ${partialIds.length} rows`);
if (missingIds.length !== 2) fail(`P0 missing table has ${missingIds.length} rows`);
if (blockedIds.length !== 1) fail(`P0 blocked table has ${blockedIds.length} rows`);
for (const text of ["Implemented: 104", "Partial: 17", "Not implemented: 2", "Blocked by user credentials: 1"]) requireText(prompt, text, "continuation prompt P0 counters");
for (const text of ["104 implemented, 17 partial, 2 not implemented", "312/312", "29/29", "301 generated static/SSG pages", "298/298", "298/51/51/51/199"])
  requireText(status, text, "PROJECT_STATUS.md");
for (const text of ["312/312", "29/29"]) requireText(readme, text, "README.md");

if (offline.routeCount !== 298 || offline.routes.length !== 298 || new Set(offline.routes).size !== 298) fail("offline route manifest is not exactly 298 unique routes");
if (offline.format !== "dwnb-offline-routes" || offline.version !== 2) fail("offline route manifest format/version drifted");
const fullRouteSet = new Set(offline.routes);
const expectedLevelCounts = { A1: 51, A2: 51, B1: 51, B2: 199 };
if (offline.levelPacks.full.routeCount !== 298) fail("full level pack must still cover every route");
for (const [level, count] of Object.entries(expectedLevelCounts)) {
  const pack = offline.levelPacks[level];
  if (!pack || pack.routeCount !== count) fail(`${level} pack routeCount is ${pack?.routeCount}, expected ${count}`);
  if (pack.routes.length !== count || new Set(pack.routes).size !== count) fail(`${level} pack routes are not ${count} unique routes`);
  for (const route of pack.routes) if (!fullRouteSet.has(route)) fail(`${level} pack contains a route outside the full manifest: ${route}`);
}
for (const route of offline.coreRoutes ?? []) for (const level of Object.keys(expectedLevelCounts)) if (!offline.levelPacks[level].routes.includes(route)) fail(`${level} pack is missing core route ${route}`);
const levelUnion = new Set(Object.keys(expectedLevelCounts).flatMap((level) => offline.levelPacks[level].routes));
if (levelUnion.size !== 298 || [...fullRouteSet].some((route) => !levelUnion.has(route))) fail("the four level packs must cover the full route set together");
for (const route of offline.routes) if (route.startsWith("/exams/") && !offline.levelPacks.B2.routes.includes(route)) fail(`exam route ${route} must belong to the B2 pack`);
if (offlineSizes.format !== "dwnb-offline-size" || offlineSizes.version !== 1) fail("offline size manifest format/version drifted");
if (offlineSizes.audio?.assetCount !== 260) fail(`offline size audio assetCount is ${offlineSizes.audio?.assetCount}, expected 260`);
for (const scope of ["full", "A1", "A2", "B1", "B2"]) {
  const pack = offlineSizes.packs?.[scope];
  if (!pack) fail(`offline size manifest is missing the ${scope} pack`);
  if (pack.missingRoutes !== 0 || pack.missingAssets !== 0) fail(`${scope} size pack still has unmeasured routes/assets`);
  if (!(pack.pageBytes > 0) || !(pack.pageTransferBytes > 0)) fail(`${scope} size pack has no measured bytes`);
  if (pack.measuredRouteCount !== pack.routeCount - 1) fail(`${scope} size pack measured ${pack.measuredRouteCount} of ${pack.routeCount} routes`);
  if (pack.unmeasuredAssets?.length !== 1 || pack.unmeasuredAssets[0] !== "/manifest.webmanifest") fail(`${scope} size pack unmeasured assets drifted`);
  if (pack.routeCount !== (scope === "full" ? 298 : expectedLevelCounts[scope])) fail(`${scope} size pack routeCount drifted`);
}
// كل حزمة مستوى تحمل الأصول المشتركة كاملة، لذا مجموع المستويات أكبر من الحزمة الكاملة؛ الفحص الصحيح هو الاحتواء والترتيب.
for (const level of Object.keys(expectedLevelCounts)) if (!(offlineSizes.packs.full.pageBytes >= offlineSizes.packs[level].pageBytes)) fail(`full pack must stay at least as large as the ${level} pack`);
if (!(offlineSizes.packs.B2.pageBytes > offlineSizes.packs.A1.pageBytes)) fail("B2 pack must stay larger than A1 because it carries the exam routes");
if (!(offlineSizes.packs.A2.pageBytes > 0 && offlineSizes.packs.B1.pageBytes >= offlineSizes.packs.A2.pageBytes)) fail("level pack size ordering drifted");
if (!(offlineSizes.packs.full.pageWithAudioBytes > offlineSizes.packs.full.pageBytes + offlineSizes.audio.byteSize - 1)) fail("audio must be added on top of the page-only size");
if (!packageJson.scripts["offline:size"] || !packageJson.scripts.postbuild?.includes("offline:size")) fail("post-build offline size manifest generation is missing");
if (libraryAudio.assets.length !== 80 || libraryAudio.generatedAssetCount !== 80) fail("library audio count drifted");
if (lessonAudio.assets.length !== 84 || lessonAudio.generatedAssetCount !== 84) fail("lesson audio count drifted");
if (examAudio.assets.length !== 96 || examAudio.coveredClipCount !== 90 || examAudio.fullyCoveredTaskCount !== 42) fail("exam audio counters drifted");

const cacheMatch = worker.match(/const PACK_CACHE = "([^"]+)"/);
if (!cacheMatch) fail("PACK_CACHE constant is missing");
const cacheName = cacheMatch[1];
if (cacheName !== "dwnb-full-pack-v58") fail(`unexpected current cache ${cacheName}`);
requireText(e2e, `caches.open("${cacheName}")`, "Playwright cache contract");
requireText(prompt, `Offline cache: ${cacheName}`, "continuation prompt cache contract");
requireText(worker, 'const levelPackCache = (level) => `dwnb-level-pack-${level.toLowerCase()}-${PACK_VERSION}`;', "service worker level pack cache factory");
requireText(worker, 'const levelStagingCache = (level) => `dwnb-level-pack-${level.toLowerCase()}-staging-${PACK_VERSION}`;', "service worker level staging cache factory");
requireText(worker, 'const PACK_SCOPES = ["full", ...LEVEL_SCOPES];', "service worker pack scope list");
requireText(worker, 'const packCacheFor = (scope) => (scope === "full" ? PACK_CACHE : levelPackCache(scope));', "service worker pack cache resolver");
requireText(e2e, 'caches.open("dwnb-level-pack-a1-v58")', "Playwright level pack cache contract");
requireText(worker, 'const OFFLINE_SIZE_PATH = "/offline-size-manifest.json";', "service worker size manifest path");
requireText(worker, 'const normalizeScope = (value) => (LEVEL_SCOPES.includes(value) ? value : "full");', "service worker scope normalizer");
requireText(prompt, `Offline cache: ${cacheName}`, "continuation prompt cache contract");
requireText(prompt, "298/51/51/51/199", "continuation prompt per-level pack sizes");
requireText(status, "298/51/51/51/199", "PROJECT_STATUS.md per-level pack sizes");

if (sourceRegistry.schemaVersion !== 1 || sourceRegistry.policyVersion !== "source-freshness-v1" || sourceRegistry.records?.length !== 12) fail("official-source registry contract drifted");
if (new Set(sourceRegistry.records.map((record) => record.id)).size !== 12) fail("official-source registry IDs are not unique");
requireText(prompt, "Official source records: 12/12", "continuation prompt source registry");
requireText(status, "12/12 official source records", "PROJECT_STATUS.md source registry");
requireText(zeroCost, "Hard mandatory budget: **0 USD**", "ZERO_COST.md");
requireText(sourceWorkflow, "node scripts/audit-source-freshness.mjs --fail-on=due --probe", "monthly source workflow");

if (academicAudit.version !== "academic-governance-v1") fail("academic audit version drifted");
if (academicAudit.schema?.counts?.totalRootObjects !== 5381 || academicAudit.schema?.schemaFamilies !== 12) fail("academic Zod counters drifted");
if (academicAudit.schema?.counts?.nounGrammarEntries !== 664 || academicAudit.schema?.counts?.verbPrepositionFrames !== 262) fail("A1-B2 lexical grammar counters drifted");
if (academicAudit.schema?.counts?.anchorNouns !== 336 || academicAudit.schema?.counts?.inventoryNouns !== 328 || academicAudit.schema?.counts?.measuredNounTargets !== 460) fail("glossary noun inventory counters drifted");
if (academicAudit.schema?.counts?.readingQuestions !== 252 || academicAudit.schema?.counts?.authoredReadingEvidence !== 252 || academicAudit.schema?.counts?.inferenceReadingEvidence !== 23) fail("P0-124 reading evidence counters drifted");
if (academicAudit.schema?.counts?.readingQuestionsWithoutEvidence !== 0 || academicAudit.schema?.counts?.unverifiedReadingEvidence !== 0) fail("P0-124 reading evidence has uncovered questions");
if (academicAudit.schema?.counts?.unjustifiedInventoryNouns !== 0 || academicAudit.schema?.counts?.nounTargetsWithoutMorphology !== 0) fail("noun inventory justification counters drifted");
if (academicAudit.schema?.counts?.derivedVerbFrames !== 118 || academicAudit.schema?.counts?.measuredValencyTargets !== 141 || academicAudit.schema?.counts?.unjustifiedDerivedFrames !== 0) fail("measured valency coverage counters drifted");
if (academicAudit.answerIntegrity?.closedAnswerItems !== 2584 || academicAudit.answerIntegrity?.productiveTasks !== 348 || academicAudit.answerIntegrity?.failures !== 0 || academicAudit.answerIntegrity?.exemptions !== 3) fail("answer integrity counters drifted");
if (academicAudit.objectiveCoverage?.objectives !== 336 || academicAudit.objectiveCoverage?.gaps !== 0) fail("objective coverage counters drifted");
for (const report of [academicSchemaReport, answerIntegrityReport, objectiveCoverageReport]) requireText(report, academicAudit.contentSha256, "generated academic report hash");
for (const text of ["4,854", "2,584", "348", "336/336"]) requireText(prompt, text, "continuation prompt academic audit");
for (const text of ["NOVEL_TRANSFER_WEIGHT = 1.5", "NOVEL_PRACTICE_WEIGHT = 1", "SAME_ITEM_RETRY_WEIGHT = 0.25"]) requireText(masteryWeighting, text, "mastery novelty weights");
for (const text of ["sm2-v2-calendar", "review-calendar-v1", "calendarPartsAt"]) requireText(sm2, text, "zoned SM-2 contract");
for (const text of ["novelty-weighting-v1", "sm2-v2-calendar", "review-calendar-v1"]) requireText(prompt, text, "continuation prompt mastery/calendar contract");
for (const text of ["a1-lexical-grammar-v1", "\"a1-01\"", "\"a1-24\""]) requireText(lexicalGrammar, text, "A1 lexical grammar registry");
for (const text of ["a2-lexical-grammar-v1", "\"a2-01\"", "\"a2-24\"", "lexical-grammar-build"]) requireText(lexicalGrammarA2, text, "A2 lexical grammar registry");
for (const text of ["b1-lexical-grammar-v1", "\"b1-01\"", "\"b1-24\""]) requireText(lexicalGrammarB1, text, "B1 lexical grammar registry");
for (const text of ["b2-lexical-grammar-v1", "\"b2-01\"", "\"b2-12\"", "genitive"]) requireText(lexicalGrammarB2, text, "B2 lexical grammar registry");
for (const text of ["nounsByLesson", "framesByLesson", "lexicalLevelOf", "pendingLevels", "B1:", "B2:"]) requireText(lexicalRegistry, text, "unified lexical grammar registry");
for (const text of ["Nomen mit Artikel, Plural, Genitiv und Dativ Plural", "Verb + Präposition + Kasus", "Genitiv"]) requireText(lexicalPanel, text, "A1-B2 lexical grammar panel");
for (const text of ["deriveGenitiveStem", "deriveDativePlural", "GENITIVE_OVERRIDES", "NS_GENITIVE_LEMMAS", "dativePlural"]) requireText(lexicalBuild, text, "lexical grammar builder Genitiv/Dativ Plural morphology");
requireText(lexicalPanel, "Genitiv · المضاف إليه", "lexical grammar panel Genitiv label");
requireText(lexicalPanel, "noun.dativePlural.form", "lexical grammar panel dative plural rendering");
for (const text of ["genitive", "dativePlural"]) requireText(read("src/core/content-validation/schemas.ts"), text, "Zod lexical grammar fields");
for (const text of ["invalid genitive form", "dative plural policy", "weak oblique stem"]) requireText(read("src/core/content-validation/validate-academic-content.ts"), text, "academic validator Genitiv/Dativ Plural rules");
for (const text of ["664 سجل اسم", "262 إطار فعل/حرف جر", "24/24 درس A1", "24/24 درس A2", "24/24 درس B1", "12/12 درس B2"]) requireText(prompt, text, "continuation prompt A1-B2 lexical grammar contract");
// P0-99: جرد التكافؤ المقاس من نص الدرس نفسه يجب أن يبقى جزءًا من عقد التسليم.
requireText(read("src/data/verb-preposition-coverage.ts"), "measuredTargetsByLesson", "valency coverage inventory");
requireText(read("src/data/verb-preposition-dictionary.ts"), "measuredValencyEntries", "valency dictionary measured entries");
requireText(read("src/data/lexical-grammar-derived.ts"), "derivedFramesByLesson", "derived valency frames");
requireText(read("src/data/noun-inventory.ts"), "lessonNounTargets", "glossary noun inventory");
requireText(read("src/data/noun-inventory-seeds.ts"), "nounInventorySeeds", "glossary noun morphology seed table");
// P0-124: مواضع الدليل المؤلفة لأسئلة القراءة يجب أن تبقى جزءًا من عقد التسليم.
requireText(read("src/data/reading-evidence.ts"), "readingEvidenceSeeds", "authored reading evidence table");
requireText(read("src/data/reading-evidence-index.ts"), "readingEvidenceByQuestionId", "authored reading evidence index");
for (const text of ["glossary target noun", "phrase target noun", "inventory noun", "target noun", "reading question has no authored evidence position", "authored quote is not a verbatim sentence", "authored quote shares no content word"])
  requireText(read("src/core/content-validation/validate-academic-content.ts"), text, "academic validator noun inventory rules");
for (const text of ["measured valency target", "derived frame", "not a declared valency entry"])
  requireText(read("src/core/content-validation/validate-academic-content.ts"), text, "academic validator valency coverage rules");
for (const text of ["336/336 صيغة Genitiv", "جمع مجرور مؤلف"]) requireText(prompt, text, "continuation prompt Genitiv/Dativ Plural contract");
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
console.log(`- P0 state: 104 implemented, ${partialIds.length} partial, ${missingIds.length} missing, ${blockedIds.length} blocked`);
console.log(`- curriculum/audio: 84 lessons, 80 library MP3, 84 lesson MP3, 96 exam files / 90 clips`);
console.log(`- governance: ${sourceRegistry.records.length} official sources; ${academicAudit.schema.counts.totalRootObjects} Zod roots; ${academicAudit.answerIntegrity.closedAnswerItems} answers; ${academicAudit.objectiveCoverage.objectives} objectives`);
console.log(`- A1-B2 lexical grammar: ${academicAudit.schema.counts.nounGrammarEntries} nouns + ${academicAudit.schema.counts.verbPrepositionFrames} verb frames across 84 lessons`);
console.log(`- mastery/calendar: novelty-weighting-v1, sm2-v2-calendar, review-calendar-v1`);
console.log(`- delivery: ${offline.routeCount} Offline routes, ${cacheName}, 312 unit/integrity and 29+29 browser tests documented`);
console.log(`- Offline packs: full ${offline.levelPacks.full.routeCount}, A1 ${offline.levelPacks.A1.routeCount}, A2 ${offline.levelPacks.A2.routeCount}, B1 ${offline.levelPacks.B1.routeCount}, B2 ${offline.levelPacks.B2.routeCount} routes`);
console.log(`- measured sizes: ${Object.entries(offlineSizes.packs).map(([scope, pack]) => `${scope} ${(pack.pageBytes / 1048576).toFixed(2)}MiB/${(pack.pageTransferBytes / 1048576).toFixed(2)}MiB`).join(", ")}`);
