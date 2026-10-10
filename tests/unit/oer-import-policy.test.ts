import { describe, expect, it } from "vitest";
import { evaluateOerCandidate, type OerCandidate } from "@/core/oer/import-policy";

const base: OerCandidate = {
  id: "TEST",
  sourceName: "Test source",
  sourceUrl: "https://example.org/source",
  licenseIds: ["CC-BY-4.0"],
  checkedOn: "2026-10-08",
  attribution: {
    authors: "Test Author",
    title: "Test Title",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  shareAlikeAccepted: false,
};

const withPatch = (patch: Partial<OerCandidate>): OerCandidate => ({ ...base, ...patch });

describe("OER import license gate (P2-357)", () => {
  it("accepts a fully specified CC-BY-4.0 record for import review only", () => {
    expect(evaluateOerCandidate(base)).toEqual({ decision: "eligible-for-import-review", reasons: [] });
  });

  it("rejects CC-BY without a stated version (the three COERLL entries as currently read)", () => {
    const result = evaluateOerCandidate(withPatch({ licenseIds: ["CC-BY"] }));
    expect(result.decision).toBe("rejected");
    expect(result.reasons).toContain("license-version-unverified:CC-BY");
  });

  it("rejects non-commercial and no-derivatives licences", () => {
    expect(evaluateOerCandidate(withPatch({ licenseIds: ["CC-BY-NC-SA-4.0"] })).reasons).toContain(
      "non-commercial-license:CC-BY-NC-SA-4.0",
    );
    expect(evaluateOerCandidate(withPatch({ licenseIds: ["CC-BY-ND-4.0"] })).reasons).toContain(
      "no-derivatives-license:CC-BY-ND-4.0",
    );
  });

  it("requires explicit acceptance of share-alike for CC BY-SA and GFDL", () => {
    const sa = evaluateOerCandidate(withPatch({ licenseIds: ["CC-BY-SA-4.0"] }));
    expect(sa.reasons).toEqual(["share-alike-not-accepted"]);
    expect(evaluateOerCandidate(withPatch({ licenseIds: ["CC-BY-SA-4.0"], shareAlikeAccepted: true })).decision).toBe(
      "eligible-for-import-review",
    );
    expect(evaluateOerCandidate(withPatch({ licenseIds: ["GFDL-1.1"] })).reasons).toContain("share-alike-not-accepted");
  });

  it("rejects missing or unknown licences rather than guessing", () => {
    expect(evaluateOerCandidate(withPatch({ licenseIds: [] })).reasons).toContain("license-missing");
    expect(evaluateOerCandidate(withPatch({ licenseIds: ["All rights reserved"] })).reasons).toContain(
      "license-not-allowed:All rights reserved",
    );
  });

  it("rejects records missing source URL, date, or attribution", () => {
    const result = evaluateOerCandidate(
      withPatch({
        sourceUrl: "http://example.org",
        checkedOn: "08.10.2026",
        attribution: { authors: " ", title: "", licenseUrl: "" },
      }),
    );
    expect(result.decision).toBe("rejected");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "source-url-not-https",
        "checked-date-invalid",
        "attribution-authors-missing",
        "attribution-title-missing",
        "attribution-license-url-missing",
      ]),
    );
  });
});
