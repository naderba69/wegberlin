import { readFile } from "node:fs/promises";
import { auditGeneratedArtifactSignatures } from "../src/core/content-validation/human-review-presence";

const REVIEW_COLUMNS = ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"];
const LEXICAL_PACKET_ARTIFACTS = [
  { path: "reports/lexical-review-packet/structural-exclusions.csv", columns: ["reviewEvidenceName", ...REVIEW_COLUMNS] },
  { path: "reports/lexical-review-packet/frame-quality-targets.csv", columns: REVIEW_COLUMNS },
  { path: "reports/lexical-review-packet/noun-anchors.csv", columns: REVIEW_COLUMNS },
  { path: "reports/lexical-review-packet/verb-frames.csv", columns: REVIEW_COLUMNS },
  { path: "reports/lexical-review-packet/unresolved-candidates.csv", columns: REVIEW_COLUMNS },
];
const SHEET_ARTIFACTS = Array.from({ length: 17 }, (_, index) => ({
  path: `reports/review-packet/review-sheet-${String(index + 1).padStart(2, "0")}.csv`,
  columns: ["decision", "reviewerName", "reviewDate", "note"],
}));

const report = auditGeneratedArtifactSignatures(
  await Promise.all([...LEXICAL_PACKET_ARTIFACTS, ...SHEET_ARTIFACTS].map(async (artifact) => ({ ...artifact, content: await readFile(artifact.path, "utf8") }))),
);

console.log(`Generated review artifacts: ${report.artifactCount} files / ${report.rowCount} rows / ${report.filledCellCount} reviewer-input cells filled of ${report.expectedCellCount} (reviewer work stays outside generated files)`);
for (const artifact of report.artifacts) {
  console.log(`- ${artifact.path}: ${artifact.rows} rows / ${artifact.filledCells} filled of ${artifact.rows * artifact.columns.length}`);
}
if (report.filledCellCount > 0) {
  console.log("Filled cells found: keep the reviewer's signed copy outside the generated files, then record the owner's decision in the approved record. This scan does not authenticate a reviewer or close any review.");
}
console.log("Human review closure asserted: no");
if (report.filledCellCount > 0) process.exit(1);
