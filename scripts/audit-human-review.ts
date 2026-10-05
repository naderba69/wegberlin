import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { HUMAN_REVIEW_CHECKLIST, HUMAN_REVIEW_LESSON_TOTAL, humanReviewLedger, summarizeHumanReviewLedger } from "../src/data/human-review-ledger";

const writeMode = process.argv.includes("--write");
const now = new Date("2026-10-04T00:00:00.000Z");
const summary = summarizeHumanReviewLedger(humanReviewLedger, now);
const payload = {
  format: "dwnb-human-review-audit",
  version: "human-review-audit-v1",
  generatedAt: "2026-10-04",
  ok: summary.invalidEntries.length === 0,
  independentReviewStatus: summary.reviewedLessons > 0 ? "reviewer-recorded-entry-present" : "pending-zero-recorded-reviews",
  checklistItems: HUMAN_REVIEW_CHECKLIST.map((item) => item.id),
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

## Boundary

${summary.boundaryAr}

${summary.reviewedLessons === 0 ? "The ledger is empty on purpose: nothing in this repository claims an independent human review of the content. `npm run review:packet` produces the signed sheets a named reviewer fills, and this ledger counts what comes back.\n" : ""}
${summary.invalidEntries.length ? `## Invalid entries\n\n${summary.invalidEntries.map((entry) => `- ${entry.lessonId}: ${entry.issuesAr.join(" · ")}`).join("\n")}\n` : ""}
`;
const outputs = [["reports/human-review-audit.json", content], ["docs/generated/HUMAN_REVIEW_LEDGER.md", `${report.trimEnd()}\n`]];
if (writeMode) {
  for (const [file, text] of outputs) { await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true }); await writeFile(file, text); }
  console.log(`Human review ledger written: ${summary.reviewedLessons}/${HUMAN_REVIEW_LESSON_TOTAL} reviewed · ${summary.lastMonthReviewed} this month (target ${summary.monthlyTarget}) · ${summary.invalidEntries.length} invalid entries`);
} else {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Human review artifacts are not current:\n${stale.join("\n")}\nRun: npm run human:review:write`);
  console.log(`Human review verified: ${summary.reviewedLessons}/${HUMAN_REVIEW_LESSON_TOTAL} reviewed · independent review ${payload.independentReviewStatus}`);
}
if (summary.invalidEntries.length) throw new Error(`Human review ledger has invalid entries:\n${summary.invalidEntries.map((entry) => `${entry.lessonId}: ${entry.issuesAr.join(" · ")}`).join("\n")}`);
