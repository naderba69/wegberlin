import { readFile } from "node:fs/promises";
import { buildLexicalTargetGapAudit } from "../src/core/content-validation/lexical-target-gap";
import {
  auditP099ExclusionReviewSlots,
  auditP099QualityTargetReviewSlots,
  P099_EXCLUSION_REVIEW_DOSSIER_PATH,
  P099_ORIGINAL_QUALITY_TARGET_COUNT,
  summarizeP099ExclusionEvidenceReferences,
} from "../src/core/content-validation/lexical-review-packet";

const packetPath = "reports/lexical-review-packet/structural-exclusions.csv";
const qualityTargetPath = "reports/lexical-review-packet/frame-quality-targets.csv";
const packetCsv = await readFile(packetPath, "utf8");
const audit = buildLexicalTargetGapAudit();
if (audit.issues.length > 0) throw new Error(`Lexical audit has ${audit.issues.length} issue(s); evidence-reference inventory is unavailable.`);
const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
const inventory = summarizeP099ExclusionEvidenceReferences(packetCsv, expectedDecisionIds);
const slots = auditP099ExclusionReviewSlots(packetCsv, expectedDecisionIds);
const qualityTargetSlots = auditP099QualityTargetReviewSlots(await readFile(qualityTargetPath, "utf8"), slots.namedReferenceCount);

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
console.log(`Stage 2 rows with a recorded signature (presence only; contents not interpreted): ${qualityTargetSlots.signedRowCount}/${qualityTargetSlots.targetCount}`);
console.log(`Stage 2 signature cells filled: ${qualityTargetSlots.signatureCellsFilled}/${qualityTargetSlots.signatureCellsExpected}`);
for (const [level, counts] of Object.entries(qualityTargetSlots.byLevel)) {
  console.log(`- ${level}: ${counts.signed}/${counts.total} rows with a recorded signature`);
}
const stageTwoOpen = slots.namedReferenceCount === slots.exclusionCount;
console.log(stageTwoOpen
  ? `Stage 2 (${P099_ORIGINAL_QUALITY_TARGET_COUNT} quality targets) ready to start: names recorded only; independent human review still required`
  : `Stage 2 (${P099_ORIGINAL_QUALITY_TARGET_COUNT} quality targets) ready: no (named references ${slots.namedReferenceCount}/${slots.exclusionCount}; all eight must be named first)`);
console.log(`Readable per-exclusion dossier (generated, not evidence): ${P099_EXCLUSION_REVIEW_DOSSIER_PATH}`);
console.log(`Evidence contents inspected: ${inventory.evidenceContentsInspected ? "yes" : "no"}`);
console.log(`Review decision contents interpreted: ${slots.reviewDecisionContentsInterpreted ? "yes" : "no"}`);
console.log(`P0-99 closure asserted: ${slots.p099ClosureAsserted ? "yes" : "no"}`);
console.log("A recorded name alone does not establish that evidence exists, is adequate, or has been reviewed.");
