import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildTunisianSupportAudit } from "../src/core/content-validation/tunisian-support";

const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;
const audit = buildTunisianSupportAudit();
if (!audit.ok) throw new Error(`Tunisian support audit failed:\n${audit.issues.join("\n")}`);

const withoutHash = { format: "dwnb-tunisian-support-audit", generatedAt: "2026-09-05", ...audit };
const contentSha256 = createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
const machine = { ...withoutHash, contentSha256 };
const rows = audit.notes.map((item) => `| \`${item.lessonId}\` | ${item.titleDe} | \`${item.category}\` | ${item.theoryIds.map((id) => `\`${id}\``).join(", ")} | \`${item.reviewStatus}\` |`).join("\n");
const report = `# Optional Tunisian Support Coverage Report

Generated: 2026-09-05  
Version: \`${audit.version}\`  
Policy: \`${audit.policyVersion}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`PASS\` — **${audit.noteCount} optional notes across ${audit.lessonCount} lessons** connect an MSA bridge, a short Tunisian approximation, the comprehension risk, and a German anchor. All **${audit.theoryReferenceCount} theory references** resolve to published A1–B2 content, and the notes render only for \`arabicSupport="tunisian-supported"\`.

| Level | Authored notes |
|---|---:|
| A1 | ${audit.byLevel.A1} |
| A2 | ${audit.byLevel.A2} |
| B1 | ${audit.byLevel.B1} |
| B2 | ${audit.byLevel.B2} |
| **Total** | **${audit.noteCount}** |

| Review state | Count |
|---|---:|
| Authored; independent review pending | ${audit.pendingReview} |
| Independently reviewed with named evidence | ${audit.independentlyReviewed} |

The ${audit.categoryCount} covered contrast categories include question/verb order, origin versus location, possessive gender, V2, case roles, the Perfekt bracket, temporal connectors, modal negation, subordinate clauses, relative pronouns, passive focus, reported distance, prepositional pronouns, percentage precision, and formal governed prepositions.

## Per-note registry

| Lesson | German focus | Category | Theory references | Review status |
|---|---|---|---|---|
${rows}

## Acceptance rules

- a note is inaccessible in Modern Standard Arabic and minimal-Arabic modes;
- every note links to an existing published lesson and theory block;
- MSA and Tunisian fields must be nonempty Arabic-script text and cannot duplicate each other;
- every CEFR level has at least two meaningful contrast notes;
- an independently reviewed status is rejected without reviewer and date evidence;
- a pending note cannot carry contradictory reviewer evidence.

## Boundary

${audit.boundary}

All ${audit.pendingReview} current notes remain **authored-review-pending**. Therefore P0-373 and P0-376 remain partial until the final independent Tunisian/MSA review is recorded; this report must not be used to claim that review already happened.
`;

const outputs = new Map([
  ["reports/tunisian-support-audit.json", `${JSON.stringify(machine, null, 2)}\n`],
  ["docs/generated/TUNISIAN_SUPPORT_REPORT.md", report],
]);
if (writeMode) for (const [file, content] of outputs) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, content); }
if (checkMode) {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Tunisian support artifacts are not current:\n${stale.join("\n")}\nRun: npm run tunisian:audit:write`);
}
console.log(`Tunisian support governance verified: ${audit.noteCount} notes / ${audit.lessonCount} lessons / ${audit.theoryReferenceCount} theory refs / ${audit.pendingReview} pending independent review / 0 structural gaps`);
console.log(`- content SHA-256: ${contentSha256}`);
