import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAnswerIntegrityAudit } from "../src/core/content-validation/answer-integrity";
import { buildObjectiveCoverageReport } from "../src/core/content-validation/objective-coverage";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";
import { assertAcademicContentValid } from "../src/core/content-validation/validate-academic-content";

const AUDIT_VERSION = "academic-governance-v1";
const AUDIT_DATE = "2026-09-05";
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;

const schema = assertAcademicContentValid();
const answer = buildAnswerIntegrityAudit();
const coverage = buildObjectiveCoverageReport();
const lexical = buildLexicalTargetGapAudit();
if (!answer.ok) throw new Error(`Answer integrity audit failed:\n${answer.issues.slice(0, 100).join("\n")}`);
if (!coverage.ok) throw new Error(`Objective coverage audit failed:\n${coverage.issues.slice(0, 100).join("\n")}`);
if (lexical.issues.length) throw new Error(`Lexical target decision audit failed:\n${lexical.issues.join("\n")}`);

const payloadWithoutHash = {
  format: "dwnb-academic-audit",
  version: AUDIT_VERSION,
  generatedAt: AUDIT_DATE,
  schema: { counts: schema.counts, schemaFamilies: schema.schemaFamilies, issues: schema.issues },
  answerIntegrity: {
    closedAnswerItems: answer.rows.length,
    productiveTasks: answer.productiveTasks.length,
    failures: answer.failures.length,
    exemptions: answer.exemptions.length,
    byScope: answer.byScope,
    rows: answer.rows,
    productiveTaskRows: answer.productiveTasks,
  },
  objectiveCoverage: {
    objectives: coverage.rows.length,
    gaps: coverage.rows.filter((row) => row.status === "gap").length,
    byLevel: coverage.byLevel,
    canonicalStages: coverage.canonicalStages,
    mappingBoundary: coverage.mappingBoundary,
    rows: coverage.rows,
  },
  lexicalTargetGaps: lexical,
};
const contentHash = createHash("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex");
const machinePayload = { ...payloadWithoutHash, contentSha256: contentHash };

function md(value: string, max = 120) {
  const clean = value.replace(/\s+/g, " ").replaceAll("|", "\\|").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

const schemaRows = Object.entries(schema.counts)
  .filter(([key]) => key !== "totalRootObjects")
  .map(([key, count]) => `| ${key} | ${count} | Zod strict + nested objects |`)
  .join("\n");
const schemaReport = `# Academic Content Zod Validation Report

Generated: ${AUDIT_DATE}  
Version: \`${AUDIT_VERSION}\`  
Content SHA-256: \`${contentHash}\`

## Result

\`PASS\` — ${schema.counts.totalRootObjects} top-level runtime academic objects passed ${schema.schemaFamilies} strict Zod schema families, including every nested lesson stage, question, exercise, library item, diagnostic item, exam task, profile, source, dashboard, derived review card, lexical grammar record, conditional Tunisian-support note, adaptive dictation, branching conversation, and collocation network.

| Root collection | Objects | Validation |
|---|---:|---|
${schemaRows}
| **Total top-level objects** | **${schema.counts.totalRootObjects}** | **0 schema failures** |

## Cross-reference gates

- published lesson metadata → academic lesson object;
- diagnostic listening item → real listening-library item;
- exam task/profile/dashboard → known official source IDs;
- matching item → option ID;
- listening item → clip ID;
- choice/listening correct index → available option;
- full dashboard → published provider-owned task ID;
- Tunisian-support note → published lesson and theory block;
- partial dictation template → complete canonical answer;
- branching choice → reachable local node and all three terminal outcomes;
- collocation node → stable parent-network ownership;
- unique IDs within every root collection.

The committed report is checked during \`prebuild\`; content drift without regenerated reports fails the build.
`;

const answerScopeRows = Object.entries(answer.byScope).map(([scope, count]) => `| ${scope} | ${count} |`).join("\n");
const exemptionRows = answer.exemptions.map((row) => `| \`${row.id}\` | ${md(row.leakMatch ?? "")} | ${md(row.exemptionReason ?? "")} |`).join("\n");
const answerReport = `# Unified Answer Integrity and Leakage Report

Generated: ${AUDIT_DATE}  
Version: \`${AUDIT_VERSION}\`  
Content SHA-256: \`${contentHash}\`

## Result

\`PASS\` — every one of **${answer.rows.length} closed-answer items** is linked to its answer and evidence reference. **${answer.productiveTasks.length} productive tasks** are separately recorded as no-single-answer or model-after-commit contracts.

\`\`\`text
Unapproved direct prompt leaks: ${answer.failures.length}
Explicit type-aware exemptions: ${answer.exemptions.length}
Missing answer/evidence links: 0
Duplicate audit IDs: 0
\`\`\`

| Scope | Closed-answer items |
|---|---:|
${answerScopeRows}
| **Total** | **${answer.rows.length}** |

## Visibility policies

- \`authorized-option-bank\`: options are intentionally visible; the keyed choice must not be repeated as an unapproved answer in the stem.
- \`hidden-target\`: fill/correction target remains hidden until commitment.
- \`authorized-token-bank\`: word-order tokens are intentionally visible, but the final sequence is not presented as a solved sentence.
- \`authorized-pair-bank\`: both columns are intentionally visible for matching; the relationship is what is assessed.
- Productive writing/speaking/mediation has no fabricated single correct answer. Models/comparisons marked \`model-after-commit\` are delayed.

## Explicit reviewed exemptions

| Item | Detected repeated surface | Why this is not an answer-key leak |
|---|---|---|
${exemptionRows}

The complete item-by-item question → answer → evidence registry is stored in \`reports/academic-content-audit.json\`. Evidence excerpts chosen from long texts are deterministic navigation aids and do not replace human semantic review.
`;

const levelRows = Object.entries(coverage.byLevel).map(([level, value]) => `| ${level} | ${value.objectives} | ${value.covered} | ${value.gaps} |`).join("\n");
const objectiveRows = coverage.rows.map((row) => `| \`${row.objectiveId}\` | ${md(row.canDoDe, 72)} | ${md(row.canDoAr, 72)} | ${row.taughtIn.length} · \`${row.taughtIn.slice(0, 2).join("`, `")}\` | ${row.practicedIn.length} | ${row.assessedIn.length} · \`${row.assessedIn[0]}\` | ${row.status} |`).join("\n");
const coverageReport = `# Objective → Teaching → Practice → Assessment Report

Generated: ${AUDIT_DATE}  
Version: \`${AUDIT_VERSION}\`  
Content SHA-256: \`${contentHash}\`

## Result

\`PASS\` — **${coverage.rows.length}/${coverage.rows.length} lesson objectives** own at least one teaching surface, practice surface, and Mini-Test assessment surface. There are **0 structural gaps**.

| Level | Objectives | Covered | Gaps |
|---|---:|---:|---:|
${levelRows}
| **Total** | **${coverage.rows.length}** | **${coverage.rows.length}** | **0** |

## Mapping boundary

${coverage.mappingBoundary}

Stable report IDs are derived as \`lessonId-objective-N\`. Teaching includes entry/vocabulary/discovery/theory; practice includes controlled, reading, listening, writing, speaking, mediation, and error-clinic surfaces; assessment uses unseen Mini-Test IDs. The machine report preserves every complete reference array.

## Per-objective structural map

| Objective ID | Can-Do DE | Can-Do AR | Teaching surfaces | Practice count | Assessment surfaces | Status |
|---|---|---|---|---:|---|---|
${objectiveRows}
`;

const lexicalLevelRows = (["A1", "A2", "B1", "B2"] as const).map((level) => {
  const nouns = lexical.nounSummary.byLevel[level];
  const verbs = lexical.verbFrameSummary.byLevel[level];
  return `| ${level} | ${nouns.totalCandidates} | ${nouns.covered} | ${nouns.pendingHuman} | ${nouns.contextualNotTarget} | ${verbs.totalCandidates} | ${verbs.covered} | ${verbs.pendingHuman} | ${verbs.contextualNotTarget} |`;
}).join("\n");
const nounPendingRows = lexical.nounRows.filter((row) => row.status === "pending-human").map((row) => {
  const evidence = row.sources.filter((item) => item.strength === "target").slice(0, 2).map((item) => `\`${item.path}\`: ${md(item.surface, 70)}`).join("<br>");
  return `| \`${row.id}\` | ${row.level} | \`${row.lessonId}\` | ${md(row.lemmaCandidate, 44)} | ${evidence} |`;
}).join("\n");
const verbPendingRows = lexical.verbFrameRows.filter((row) => row.status === "pending-human").map((row) => {
  const evidence = row.sources.filter((item) => item.strength === "target").slice(0, 2).map((item) => `\`${item.path}\`: ${md(item.surface, 70)}`).join("<br>");
  return `| \`${row.id}\` | ${row.level} | \`${row.lessonId}\` | ${md(row.infinitiveCandidate, 36)} | ${row.preposition} | ${row.observedCases.join(", ")} | ${evidence} |`;
}).join("\n");
const frameExclusionRows = lexical.exclusionDecisions.map((item) => `| \`${item.id}\` | \`${item.lessonId}\` | ${item.normalizedVerb} + ${item.preposition} | \`${item.reason}\` | ${md(item.explanationAr, 100)} | \`${item.reviewStatus}\` |`).join("\n");
const lexicalReport = `# Lexical Target → Anchor Gap Report

Generated: ${AUDIT_DATE}  
Version: \`${lexical.version}\`  
Content SHA-256: \`${contentHash}\`

## Honest result

\`REVIEW REQUIRED\` — this first machine inventory compares explicit authored lexical-target signals with the current **${lexical.nounAnchorCount} noun anchors** and **${lexical.verbFrameAnchorCount} verb-preposition-case frames** across **${lexical.lessonCount}/84 lessons**. It found **${lexical.nounSummary.pendingHuman} noun candidates** and **${lexical.verbFrameSummary.pendingHuman} unclassified verb-frame candidates**. It also records **${lexical.exclusionDecisionCount} explicit structural frame exclusions**, all still pending independent German confirmation before P0-99 can close.

The audit does **not** create grammatical facts. A pending noun row must receive a verified record or independent exclusion. A structural frame exclusion can remove a false-positive detector row from the unclassified queue, but its \`authored-review-pending\` state remains visible until final review.

| Level | Noun signals | Covered | Pending human | Context only | Verb signals | Covered | Pending human | Context only |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${lexicalLevelRows}
| **Total** | **${lexical.nounSummary.totalCandidates}** | **${lexical.nounSummary.covered}** | **${lexical.nounSummary.pendingHuman}** | **${lexical.nounSummary.contextualNotTarget}** | **${lexical.verbFrameSummary.totalCandidates}** | **${lexical.verbFrameSummary.covered}** | **${lexical.verbFrameSummary.pendingHuman}** | **${lexical.verbFrameSummary.contextualNotTarget}** |

## Classification contract

- **covered:** an exact lesson-scoped anchor alias exists. Registry rows are always included, so all ${lexical.nounAnchorCount} noun records and ${lexical.verbFrameAnchorCount} frame records are auditable.
- **pending-human:** an uncovered candidate appears on a vocabulary phrase, flashcard front, or uppercase reading-glossary lemma.
- **not-target:** either a signal appears only in contextual teaching/assessment surfaces, or a versioned explicit exclusion identifies a false-positive frame detector row. Exclusions retain their reason and pending-independent-review state.
- German sentence-initial capitalization alone is never treated as noun evidence.
- The frame detector records only visible infinitive + preposition evidence. It does not infer a missing case or pretend that every nearby preposition is governed.

Boundary: ${lexical.boundary}

## Pending noun decisions (${lexical.nounSummary.pendingHuman})

| Stable row | Level | Lesson | Candidate | Target evidence |
|---|---|---|---|---|
${nounPendingRows}

## Pending verb/preposition decisions (${lexical.verbFrameSummary.pendingHuman})

| Stable row | Level | Lesson | Infinitive candidate | Prep. | Observed case evidence | Target evidence |
|---|---|---|---|---|---|---|
${verbPendingRows || "| — | — | — | — | — | No unclassified verb-frame candidates |"}

## Explicit structural frame exclusions (${lexical.exclusionDecisionCount})

| Decision | Lesson | Detected pair | Reason | Authored explanation | Review status |
|---|---|---|---|---|---|
${frameExclusionRows}

All ${lexical.pendingIndependentExclusionReview} exclusions remain \`authored-review-pending\`; zero unclassified rows does not mean independent German review is complete.

The complete covered/pending/context inventory, every source path, matched anchor ID, and exclusion decision are stored under \`lexicalTargetGaps\` in \`reports/academic-content-audit.json\`.
`;

const outputs = new Map<string, string>([
  ["docs/generated/ACADEMIC_SCHEMA_REPORT.md", schemaReport],
  ["docs/generated/ANSWER_INTEGRITY_REPORT.md", answerReport],
  ["docs/generated/OBJECTIVE_COVERAGE_REPORT.md", coverageReport],
  ["docs/generated/LEXICAL_TARGET_GAP_REPORT.md", lexicalReport],
  ["reports/academic-content-audit.json", `${JSON.stringify(machinePayload, null, 2)}\n`],
]);

if (writeMode) {
  for (const [file, content] of outputs) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
}

if (checkMode) {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Academic audit artifacts are not current:\n${stale.join("\n")}\nRun: npm run content:audit:write`);
}

console.log("Academic content governance verified:");
console.log(`- Zod: ${schema.counts.totalRootObjects} root objects / ${schema.schemaFamilies} schema families / 0 failures`);
console.log(`- answers: ${answer.rows.length} closed items + ${answer.productiveTasks.length} productive tasks / ${answer.exemptions.length} explicit exemptions / 0 leaks`);
console.log(`- objectives: ${coverage.rows.length}/${coverage.rows.length} teaching→practice→assessment maps / 0 structural gaps`);
console.log(`- lexical target gaps: ${lexical.nounSummary.pendingHuman} noun + ${lexical.verbFrameSummary.pendingHuman} verb-frame candidates pending human review`);
console.log(`- content SHA-256: ${contentHash}`);
