// P2-357 importer step: review queue + attribution text. Pure logic only.
// It reads candidate METADATA records, runs the licence gate, and writes attribution lines for
// records that pass the gate. It never fetches a source, never copies content, and never marks
// anything as imported. A human reviewer still decides each record.
import { evaluateOerCandidate, type OerCandidate, type OerDecision } from "./import-policy";

export const OER_REVIEW_QUEUE_POLICY_VERSION = "oer-review-queue-attribution-v1" as const;

export type OerReviewEntry = {
  id: string;
  decision: OerDecision["decision"];
  reasons: string[];
  /** Present only when the gate passed. Says what the reviewer must credit, not that content was imported. */
  attributionLine?: string;
};

export function formatOerAttribution(candidate: OerCandidate): string {
  const { authors, title, licenseUrl } = candidate.attribution;
  return `${authors}: „${title}“, ${candidate.sourceName}, Lizenz ${candidate.licenseIds.join(", ")} (${licenseUrl}), geprüft am ${candidate.checkedOn}`;
}

export function buildOerReviewQueue(candidates: readonly OerCandidate[]): OerReviewEntry[] {
  return candidates.map((candidate) => {
    const decision = evaluateOerCandidate(candidate);
    return {
      id: candidate.id,
      decision: decision.decision,
      reasons: decision.reasons,
      ...(decision.decision === "eligible-for-import-review" ? { attributionLine: formatOerAttribution(candidate) } : {}),
    };
  });
}
