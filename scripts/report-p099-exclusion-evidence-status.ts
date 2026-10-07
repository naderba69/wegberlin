import { readFile } from "node:fs/promises";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";
import {
  auditP099ExclusionReviewSlots,
  summarizeP099ExclusionEvidenceReferences,
} from "../src/core/content-validation/lexical-review-packet";

const packetPath = "reports/lexical-review-packet/structural-exclusions.csv";
const packetCsv = await readFile(packetPath, "utf8");
const audit = buildLexicalTargetGapAudit();
if (audit.issues.length > 0) throw new Error(`Lexical audit has ${audit.issues.length} issue(s); evidence-reference inventory is unavailable.`);
const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
const inventory = summarizeP099ExclusionEvidenceReferences(packetCsv, expectedDecisionIds);
const slots = auditP099ExclusionReviewSlots(packetCsv, expectedDecisionIds);

console.log("P0-99 named-evidence-reference inventory (read-only; not evidence verification or human review):");
console.log(`Exclusion references named: ${inventory.namedReferenceCount}/${inventory.exclusionCount}`);
console.log(`Named references missing: ${inventory.missingDecisionIds.length}`);
if (inventory.missingDecisionIds.length > 0) {
  console.log(`Missing reference IDs: ${inventory.missingDecisionIds.join(", ")}`);
}
console.log(`Placeholder-only references (not counted as named): ${slots.placeholderReferenceCount}`);
if (slots.placeholderDecisionIds.length > 0) {
  console.log(`Placeholder reference IDs: ${slots.placeholderDecisionIds.join(", ")}`);
}
console.log(`Signature cells filled (presence only, contents not interpreted): ${slots.signatureCellsFilled}/${slots.signatureCellsExpected}`);
console.log(`Slots ready for independent review: ${slots.readyForIndependentReviewCount}/${slots.exclusionCount}`);
for (const slot of slots.slots) {
  const remaining = slot.signatureCellsExpected - slot.signatureCellsFilled;
  console.log(`- ${slot.decisionId}: reference ${slot.evidenceReferenceState}; status ${slot.reviewStatus}; signature cells remaining ${remaining}`);
}
console.log(`Evidence contents inspected: ${inventory.evidenceContentsInspected ? "yes" : "no"}`);
console.log(`Review decision contents interpreted: ${slots.reviewDecisionContentsInterpreted ? "yes" : "no"}`);
console.log(`P0-99 closure asserted: ${slots.p099ClosureAsserted ? "yes" : "no"}`);
console.log("A recorded name alone does not establish that evidence exists, is adequate, or has been reviewed.");
