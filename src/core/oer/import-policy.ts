// P2-357 license gate. Pure decision logic only: it never fetches, reads, or stores external content.
// "eligible-for-import-review" means the record may proceed to a human-reviewed import step.
// It does NOT mean imported, licensed by a lawyer, or reviewed by a human.

export const ALLOWED_LICENSE_IDS = ["CC-BY-4.0", "CC-BY-SA-4.0", "GFDL-1.1"] as const;
export type AllowedLicenseId = (typeof ALLOWED_LICENSE_IDS)[number];

export type OerCandidate = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  /** Licence identifiers as read from the source page, normalised (e.g. "CC-BY-4.0"). */
  licenseIds: string[];
  checkedOn: string;
  attribution: {
    authors: string;
    title: string;
    licenseUrl: string;
  };
  /** Derivatives must stay under the same licence; the importer must record this explicitly. */
  shareAlikeAccepted: boolean;
};

export type OerDecision = {
  decision: "eligible-for-import-review" | "rejected";
  reasons: string[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function evaluateOerCandidate(candidate: OerCandidate): OerDecision {
  const reasons: string[] = [];

  if (!/^https:\/\//.test(candidate.sourceUrl)) reasons.push("source-url-not-https");
  if (!ISO_DATE.test(candidate.checkedOn)) reasons.push("checked-date-invalid");
  if (!candidate.attribution.authors.trim()) reasons.push("attribution-authors-missing");
  if (!candidate.attribution.title.trim()) reasons.push("attribution-title-missing");
  if (!/^https:\/\//.test(candidate.attribution.licenseUrl)) reasons.push("attribution-license-url-missing");

  if (candidate.licenseIds.length === 0) reasons.push("license-missing");

  for (const id of candidate.licenseIds) {
    if (/-NC(-|$)/.test(id)) reasons.push(`non-commercial-license:${id}`);
    else if (/-ND(-|$)/.test(id)) reasons.push(`no-derivatives-license:${id}`);
    else if (id === "CC-BY") reasons.push("license-version-unverified:CC-BY");
    else if (!(ALLOWED_LICENSE_IDS as readonly string[]).includes(id)) reasons.push(`license-not-allowed:${id}`);
  }

  const needsShareAlike = candidate.licenseIds.some((id) => /-SA(-|$)|^GFDL/.test(id));
  if (needsShareAlike && !candidate.shareAlikeAccepted) reasons.push("share-alike-not-accepted");

  return {
    decision: reasons.length === 0 ? "eligible-for-import-review" : "rejected",
    reasons,
  };
}
