import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildNursingLayerAudit } from "../src/core/content-validation/nursing-layer";

/**
 * Nursing-layer audit (owner contract v152 / ADR-080).
 *
 * Beyond the content checks in the core validator, this script measures the two structural properties
 * that make rule (c) — "the layer is parasitic, not load-bearing" — verifiable instead of asserted:
 *   1. every file that imports the layer is on a declared allowlist (one panel + one audit + tests);
 *   2. no gate/exam/evidence/review module mentions the layer at all, so the layer cannot influence a
 *      level gate, an exam task, or mastery even by accident.
 */
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const SCAN_DIRS = ["src", "scripts", "tests"];
const ALLOWED_IMPORTERS = new Set([
  "src/data/nursing-layer-registry.ts",
  "src/core/content-validation/nursing-layer.ts",
  "src/core/nursing/safety-practice.ts",
  "src/components/nursing-layer-panel.tsx",
  "scripts/generate-nursing-layer-audit.ts",
  "tests/unit/nursing-layer.test.ts",
  "tests/e2e/nursing-layer.spec.ts",
]);
const LAYER_IMPORT = /@\/data\/nursing-layer-registry|@\/core\/nursing\/safety-practice|from "\.\.\/src\/core\/nursing\/safety-practice"|from "\.\.\/src\/core\/content-validation\/nursing-layer"/;
const COUPLING_DIRS = ["src/core/exams", "src/core/lessons", "src/core/evidence", "src/core/review", "src/core/assessment", "src/core/diagnostic"];

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const audit = buildNursingLayerAudit();

const files = (await Promise.all(SCAN_DIRS.map((dir) => walk(path.join(ROOT, dir))))).flat();
const importers: string[] = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  if (LAYER_IMPORT.test(text)) importers.push(path.relative(ROOT, file));
}
const unexpectedImporters = importers.filter((file) => !ALLOWED_IMPORTERS.has(file));

const couplingHits: string[] = [];
for (const dir of COUPLING_DIRS) {
  let dirFiles: string[] = [];
  try {
    dirFiles = await walk(path.join(ROOT, dir));
  } catch {
    continue;
  }
  for (const file of dirFiles) {
    const text = await readFile(file, "utf8");
    if (/nursing/i.test(text)) couplingHits.push(path.relative(ROOT, file));
  }
}

const structuralIssues = [
  ...unexpectedImporters.map((file) => `undeclared layer importer: ${file}`),
  ...couplingHits.map((file) => `layer mentioned inside a gate/exam/evidence/review module: ${file}`),
];
const combined = { ...audit, layerImporters: importers.sort(), unexpectedImporters, couplingHits, issues: [...audit.issues, ...structuralIssues] };
const ok = combined.issues.length === 0;

const withoutHash = { format: "dwnb-nursing-layer-audit", generatedAt: "2026-09-23", ...combined, ok };
const contentSha256 = createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
const machine = { ...withoutHash, contentSha256 };

await mkdir(path.join(ROOT, "reports"), { recursive: true });
await mkdir(path.join(ROOT, "docs/generated"), { recursive: true });
await writeFile(path.join(ROOT, "reports/nursing-layer-audit.json"), `${JSON.stringify(machine, null, 1)}\n`, "utf8");

const rows = combined.reviewWordsByLevel;
const report = `# Woven Nursing Layer Report — توابل (A1/A2) · طبق ثانٍ (B1+)

Generated: 2026-09-23  
Policy: \`${combined.policyVersion}\`  
Audit: \`${combined.version}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`${ok ? "PASS" : "FAIL"}\` — **${combined.unitCount} woven units across ${combined.lessonCount} lessons**, one deterministic safety task each
(${combined.acceptedOptionCount} accepted language action(s), ${combined.failedGuessOptionCount} explicitly failed guess options),
**${combined.reviewWordCount} of ${combined.reviewWordBudget}** declared professional words used, and **${combined.professionalReviews} professional reviews**
recorded. Every unit carries \`${combined.disclaimerAr}\`.

| Level | Units | Authored cluster | Accepted action | Professional words |
|---|---:|---|---|---:|
| A1 | ${combined.byLevel.A1} | \`${combined.clusterByLevel.A1}\` | \`${combined.acceptedKindByLevel.A1}\` | ${rows.A1.length} of ${0} |
| A2 | ${combined.byLevel.A2} | \`${combined.clusterByLevel.A2}\` | \`${combined.acceptedKindByLevel.A2}\` | ${rows.A2.length} of ${0} |
| B1 | ${combined.byLevel.B1} | \`${combined.clusterByLevel.B1}\` | \`${combined.acceptedKindByLevel.B1}\` | ${rows.B1.length} of ${4} |
| B2 | ${combined.byLevel.B2} | \`${combined.clusterByLevel.B2}\` | \`${combined.acceptedKindByLevel.B2}\` | ${rows.B2.length} of ${4} |

## The three strict rules, as measured

1. **No new grammar.** Every unit names the published theory blocks it reuses: ${
  combined.unitCount
} units, all references resolved inside their own lesson; a unit whose reference stops resolving fails this audit.
2. **No clinical knowledge needed to answer.** Exactly one accepted action per task and it is always a language act
   (\`recognize\` / \`confirm\` / \`ask\` / \`document\`); the validator additionally rejects accepted texts that read like a
   dosing or administration instruction. Guessing is offered and failed by the environment, not by a written rule
   (${combined.failedGuessOptionCount} guess options across ${combined.safetyTaskCount} tasks).
3. **Parasitic, not load-bearing.** The layer is imported by exactly ${importers.length} files, all on the declared
   allowlist (one panel, one validator, one practice core, one audit, tests); **zero** gate/exam/evidence/review modules
   mention it (${couplingHits.length} hits), so deleting the registry leaves the general B2 path complete.

## Rollback breaker

\`${combined.rollbackBreaker.version}\` — metric: ${combined.rollbackBreaker.metric}; window ${combined.rollbackBreaker.windowDays} days;
trigger: a ${combined.rollbackBreaker.ifDropsPercentagePoints}-percentage-point drop; action: ${combined.rollbackBreaker.actionAr}
The layer is removable by deleting one registry file; mastery effect \`${combined.masteryEffect}\`, gate effect \`${combined.gateEffect}\`, exam effect \`${combined.examEffect}\`.

## Boundary

${combined.boundary}

**What this audit does not claim.** ${combined.pendingProfessionalReview} units are authored and tagged
\`pending-nursing-professional\`: no nurse, no clinical educator, and no German
teacher has reviewed them (0 professional reviews). The layer is language practice inside a care situation; it is not
professional training, it does not certify anything, and every unit tells the learner so.
`;

await writeFile(path.join(ROOT, "docs/generated/NURSING_LAYER_REPORT.md"), report, "utf8");

if (!ok) {
  console.error("Nursing layer audit failed:");
  for (const issue of combined.issues) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(
  `Nursing layer: ${combined.unitCount} units (A1 ${combined.byLevel.A1} · A2 ${combined.byLevel.A2} · B1 ${combined.byLevel.B1} · B2 ${combined.byLevel.B2}) · ` +
    `${combined.safetyTaskCount} safety tasks · ${combined.failedGuessOptionCount} failed guesses · ${combined.reviewWordCount}/${combined.reviewWordBudget} professional words · ` +
    `${importers.length} declared importers · ${couplingHits.length} gate/exam couplings · ${combined.professionalReviews} professional reviews · fingerprint ${contentSha256.slice(0, 12)}`,
);
if (checkMode && !writeMode) console.log("check mode: report and machine audit written from the current tree");
