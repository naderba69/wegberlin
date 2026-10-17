// P2-357 importer: turns licence-gated register records into attributed learner-facing references.
// Only records that pass evaluateOerCandidate() can be imported. The bounded import mode is
// "attributed-link": title + URL + full attribution; no source text is copied into the app.
import { formatOerAttribution } from "./attribution";
import { evaluateOerCandidate, type OerCandidate } from "./import-policy";

export const OER_IMPORT_POLICY_VERSION = "oer-attributed-reference-import-v1" as const;

export type OerReferenceImportRequest = {
  itemId: string;
  candidateId: string;
  /** Glossary term the reference supports (src/data/grammar-glossary.ts). */
  topicId: string;
  /** Page title exactly as listed on the source's own index page. */
  title: string;
  url: string;
  language: "en" | "de";
  review: { decidedBy: "source-verified-agent"; decidedOn: string; evidence: string };
};

export type ImportedOerReference = OerReferenceImportRequest & {
  kind: "attributed-link";
  attributionLine: string;
  licenseIds: string[];
  licenseUrl: string;
  changes: "none — linked, not copied";
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function importOerReferences(candidates: readonly OerCandidate[], requests: readonly OerReferenceImportRequest[]): ImportedOerReference[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const seen = new Set<string>();
  return requests.map((request) => {
    const candidate = byId.get(request.candidateId);
    if (!candidate) throw new Error(`OER import ${request.itemId}: unknown register record ${request.candidateId}`);
    const decision = evaluateOerCandidate(candidate);
    if (decision.decision !== "eligible-for-import-review") throw new Error(`OER import ${request.itemId}: ${candidate.id} is rejected by the licence gate (${decision.reasons.join(", ")})`);
    if (seen.has(request.itemId)) throw new Error(`OER import ${request.itemId}: duplicate item id`);
    seen.add(request.itemId);
    if (!request.url.startsWith(candidate.sourceUrl)) throw new Error(`OER import ${request.itemId}: URL is outside the licensed source ${candidate.sourceUrl}`);
    if (!request.title.trim()) throw new Error(`OER import ${request.itemId}: title missing`);
    if (!ISO_DATE.test(request.review.decidedOn) || !request.review.evidence.trim()) throw new Error(`OER import ${request.itemId}: review record incomplete`);
    return {
      ...request,
      kind: "attributed-link",
      attributionLine: formatOerAttribution(candidate),
      licenseIds: [...candidate.licenseIds],
      licenseUrl: candidate.attribution.licenseUrl,
      changes: "none — linked, not copied",
    };
  });
}
