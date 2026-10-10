import { readFile } from "node:fs/promises";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";
import { validateP099RetainedExclusionDecisions } from "../src/core/content-validation/lexical-review-packet";

const args = process.argv.slice(2);
const requireComplete = args.includes("--require-complete");
const path = args.find((value) => !value.startsWith("--"));
if (!path) {
  console.error("Usage: npm run p099:evidence:validate -- <returned-structural-exclusions.csv> [--require-complete]");
  process.exit(2);
}

const audit = buildLexicalTargetGapAudit();
if (audit.issues.length > 0) throw new Error(`Lexical audit has ${audit.issues.length} issue(s); the retained-decision check is unavailable.`);
const report = validateP099RetainedExclusionDecisions(
  await readFile(path, "utf8"),
  audit.exclusionDecisions.map((decision) => decision.id),
);

console.log(`P0-99 retained reviewer sheet check (read-only; no file is written): ${path}`);
console.log(`Exclusions: ${report.exclusionCount} · rows complete: ${report.completeRowCount} · rows incomplete: ${report.incompleteRowCount}`);
console.log(`Signature cells filled: ${report.signatureCellsFilled}/${report.signatureCellsExpected} (${report.signatureFieldsExpectedPerRow} fields per exclusion)`);
for (const row of report.rows) {
  const notes: string[] = [];
  if (row.evidenceReferenceState !== "named") notes.push(`evidence reference ${row.evidenceReferenceState}`);
  if (row.missingSignatureFields.length > 0) notes.push(`missing fields: ${row.missingSignatureFields.join(", ")}`);
  if (row.placeholderSignatureFields.length > 0) notes.push(`placeholder values: ${row.placeholderSignatureFields.join(", ")}`);
  if (row.malformedSignatureFields.length > 0) notes.push(`format issues: ${row.malformedSignatureFields.join(", ")}`);
  console.log(`- ${row.decisionId}: ${row.complete ? "complete" : "incomplete"} · status ${row.retainedReviewStatus || "empty"}${notes.length ? ` · ${notes.join(" · ")}` : ""}`);
}
console.log(`Reviewer identity authenticated: ${report.reviewerIdentityAuthenticated ? "yes" : "no"}`);
console.log(`Evidence contents inspected: ${report.evidenceContentsInspected ? "yes" : "no"}`);
console.log(`Review decision adequacy interpreted: ${report.reviewDecisionContentsInterpreted ? "yes" : "no"}`);
console.log(`P0-99 closure asserted: ${report.p099ClosureAsserted ? "yes" : "no"}`);
if (report.completeRowCount < report.exclusionCount) {
  console.log("Complete rows alone do not close P0-99: the retained sheet must still be recorded by the owner, and the 126 quality targets stay pending human review.");
}
if (requireComplete && report.completeRowCount !== report.exclusionCount) process.exit(1);
