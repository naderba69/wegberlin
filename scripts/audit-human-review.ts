import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { HUMAN_REVIEW_CHECKLIST, HUMAN_REVIEW_LESSON_TOTAL, humanReviewLedger, summarizeHumanReviewLedger, summarizeP099ExclusionSlotsForHumanReview } from "../src/data/human-review-ledger";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";

const P099_EXCLUSIONS_PATH = "reports/lexical-review-packet/structural-exclusions.csv";

const writeMode = process.argv.includes("--write");
const now = new Date("2026-10-04T00:00:00.000Z");
const summary = summarizeHumanReviewLedger(humanReviewLedger, now);
const lexicalAudit = buildLexicalTargetGapAudit();
if (lexicalAudit.issues.length > 0) throw new Error(`Lexical audit has ${lexicalAudit.issues.length} issue(s); P0-99 slot summary is unavailable.`);
const p099ExclusionSlots = summarizeP099ExclusionSlotsForHumanReview(
  await readFile(P099_EXCLUSIONS_PATH, "utf8"),
  lexicalAudit.exclusionDecisions.map((decision) => decision.id),
);
const payload = {
  format: "dwnb-human-review-audit",
  version: "human-review-audit-v1",
  generatedAt: "2026-10-04",
  ok: summary.invalidEntries.length === 0,
  independentReviewStatus: summary.reviewedLessons > 0 ? "reviewer-recorded-entry-present" : "pending-zero-recorded-reviews",
  checklistItems: HUMAN_REVIEW_CHECKLIST.map((item) => item.id),
  p099ExclusionSlots,
  ...summary,
};
const content = `${JSON.stringify(payload, null, 1)}\n`;
const contentSha256 = createHash("sha256").update(content).digest("hex");
const monthRows = summary.months.length
  ? summary.months.map((row) => `| ${row.month} | ${row.reviewedLessons} | ${row.meetsTarget ? "met" : `below target (${summary.monthlyTarget})`} |`).join("\n")
  : "| — | 0 | below target |";
const report = `# Human Review Ledger Audit

Policy \`${summary.policyVersion}\`. Content SHA-256: \`${contentSha256}\`

Boundary: ${summary.boundary}

| Metric | Value |
| --- | --- |
| Recorded review entries | ${summary.totalEntries} |
| Reviewed lessons | ${summary.reviewedLessons}/${HUMAN_REVIEW_LESSON_TOTAL} (${summary.coveragePct}%) |
| Monthly target | ${summary.monthlyTarget} lessons |
| Reviews recorded in the current month | ${summary.lastMonthReviewed} |
| Invalid entries | ${summary.invalidEntries.length} |
| Lessons with duplicate reviews | ${summary.duplicateReviews.length} |
| Independent review status | ${payload.independentReviewStatus} |

| Month | Reviewed lessons | Target |
| --- | --- | --- |
${monthRows}

## P0-99 exclusion evidence slots (presence only)

Policy \`${p099ExclusionSlots.boundary}\`. This block counts filled cells only: it does not open evidence, does not read a reviewer decision, and does not close P0-99.

| Metric | Value |
| --- | --- |
| Structural exclusions | ${p099ExclusionSlots.exclusionCount} |
| Named evidence references | ${p099ExclusionSlots.namedReferenceCount}/${p099ExclusionSlots.exclusionCount} |
| Missing references | ${p099ExclusionSlots.missingReferenceCount} |
| Placeholder-only references | ${p099ExclusionSlots.placeholderReferenceCount} |
| Signature cells filled | ${p099ExclusionSlots.signatureCellsFilled}/${p099ExclusionSlots.signatureCellsExpected} |
| Slots ready for independent review | ${p099ExclusionSlots.readyForIndependentReviewCount} |
| Evidence contents inspected | no |
| Review decision contents interpreted | no |
| P0-99 closure asserted | no |

Pending exclusion IDs: ${p099ExclusionSlots.pendingDecisionIds.join(", ") || "—"}

${p099ExclusionSlots.boundaryAr}
${p099ExclusionSlots.namedReferenceCount === 0 ? "Every exclusion still lacks a named evidence reference; the eight slots are unfilled on purpose and no review has been recorded.\n" : ""}
## Boundary

${summary.boundaryAr}

${summary.reviewedLessons === 0 ? "The ledger is empty on purpose: nothing in this repository claims an independent human review of the content. `npm run review:packet` produces the signed sheets a named reviewer fills, and this ledger counts what comes back.\n" : ""}
${summary.invalidEntries.length ? `## Invalid entries\n\n${summary.invalidEntries.map((entry) => `- ${entry.lessonId}: ${entry.issuesAr.join(" · ")}`).join("\n")}\n` : ""}
`;
const outputs = [["reports/human-review-audit.json", content], ["docs/generated/HUMAN_REVIEW_LEDGER.md", `${report.trimEnd()}\n`]];
if (writeMode) {
  for (const [file, text] of outputs) { await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true }); await writeFile(file, text); }
  console.log(`Human review ledger written: ${summary.reviewedLessons}/${HUMAN_REVIEW_LESSON_TOTAL} reviewed · ${summary.lastMonthReviewed} this month (target ${summary.monthlyTarget}) · ${summary.invalidEntries.length} invalid entries · P0-99 slots ${p099ExclusionSlots.namedReferenceCount}/${p099ExclusionSlots.exclusionCount} named`);
} else {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Human review artifacts are not current:\n${stale.join("\n")}\nRun: npm run human:review:write`);
  console.log(`Human review verified: ${summary.reviewedLessons}/${HUMAN_REVIEW_LESSON_TOTAL} reviewed · independent review ${payload.independentReviewStatus} · P0-99 slots ${p099ExclusionSlots.namedReferenceCount}/${p099ExclusionSlots.exclusionCount} named, ${p099ExclusionSlots.signatureCellsFilled}/${p099ExclusionSlots.signatureCellsExpected} signature cells`);
}
if (summary.invalidEntries.length) throw new Error(`Human review ledger has invalid entries:\n${summary.invalidEntries.map((entry) => `${entry.lessonId}: ${entry.issuesAr.join(" · ")}`).join("\n")}`);
