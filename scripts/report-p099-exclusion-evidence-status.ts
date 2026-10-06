import { readFile } from "node:fs/promises";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";
import { summarizeP099ExclusionEvidenceReferences } from "../src/core/content-validation/lexical-review-packet";

const packetPath = "reports/lexical-review-packet/structural-exclusions.csv";
const packetCsv = await readFile(packetPath, "utf8");
const audit = buildLexicalTargetGapAudit();
if (audit.issues.length > 0) throw new Error(`Lexical audit has ${audit.issues.length} issue(s); evidence-reference inventory is unavailable.`);
const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
const inventory = summarizeP099ExclusionEvidenceReferences(packetCsv, expectedDecisionIds);

console.log("P0-99 named-evidence-reference inventory (read-only; not evidence verification or human review):");
console.log(`Exclusion references named: ${inventory.namedReferenceCount}/${inventory.exclusionCount}`);
console.log(`Named references missing: ${inventory.missingDecisionIds.length}`);
if (inventory.missingDecisionIds.length > 0) {
  console.log(`Missing reference IDs: ${inventory.missingDecisionIds.join(", ")}`);
}
console.log(`Evidence contents inspected: ${inventory.evidenceContentsInspected ? "yes" : "no"}`);
console.log(`Human review decisions inspected: ${inventory.reviewDecisionCellsInspected ? "yes" : "no"}`);
console.log(`P0-99 closure asserted: ${inventory.p099ClosureAsserted ? "yes" : "no"}`);
console.log("A recorded name alone does not establish that evidence exists, is adequate, or has been reviewed.");
