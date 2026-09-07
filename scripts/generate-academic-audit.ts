import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAnswerIntegrityAudit } from "../src/core/content-validation/answer-integrity";
import { buildObjectiveCoverageReport } from "../src/core/content-validation/objective-coverage";
import { assertAcademicContentValid } from "../src/core/content-validation/validate-academic-content";

const AUDIT_VERSION = "academic-governance-v1";
const AUDIT_DATE = "2026-09-04";
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;

const schema = assertAcademicContentValid();
const answer = buildAnswerIntegrityAudit();
const coverage = buildObjectiveCoverageReport();
if (!answer.ok) throw new Error(`Answer integrity audit failed:\n${answer.issues.slice(0, 100).join("\n")}`);
if (!coverage.ok) throw new Error(`Objective coverage audit failed:\n${coverage.issues.slice(0, 100).join("\n")}`);

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

\`PASS\` — ${schema.counts.totalRootObjects} top-level runtime academic objects passed ${schema.schemaFamilies} strict Zod schema families, including every nested lesson stage, question, exercise, library item, diagnostic item, exam task, profile, source, dashboard, and derived review card.

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

const outputs = new Map<string, string>([
  ["docs/generated/ACADEMIC_SCHEMA_REPORT.md", schemaReport],
  ["docs/generated/ANSWER_INTEGRITY_REPORT.md", answerReport],
  ["docs/generated/OBJECTIVE_COVERAGE_REPORT.md", coverageReport],
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
console.log(`- content SHA-256: ${contentHash}`);
