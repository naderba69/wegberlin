import { describe, expect, it } from "vitest";
import { buildOerReviewQueue } from "@/core/oer/attribution";
import { importOerReferences, OER_IMPORT_POLICY_VERSION, type OerReferenceImportRequest } from "@/core/oer/importer";
import { grammarGlossary } from "@/data/grammar-glossary";
import { importedOerReferences, OER_IMPORT_REQUESTS } from "@/data/oer-imports";
import { OER_REGISTER } from "@/data/oer-register";

const request: OerReferenceImportRequest = OER_IMPORT_REQUESTS[0];

describe("P2-357 attributed OER import (ADR-119)", () => {
  it("lets only the two CC BY 4.0-verified COERLL records through the licence gate", () => {
    const queue = buildOerReviewQueue(OER_REGISTER);
    expect(queue.filter((entry) => entry.decision === "eligible-for-import-review").map((entry) => entry.id)).toEqual(["OER-02", "OER-03"]);
    const reasons = Object.fromEntries(queue.map((entry) => [entry.id, entry.reasons]));
    expect(reasons["OER-01"]).toContain("license-version-unverified:CC-BY");
    expect(reasons["OER-04"]).toContain("share-alike-not-accepted");
    expect(reasons["OER-05"].some((reason) => reason.startsWith("non-commercial-license"))).toBe(true);
    expect(reasons["OER-07"].some((reason) => reason.startsWith("non-commercial-license"))).toBe(true);
    expect(reasons["OER-08"]).toContain("attribution-authors-missing");
  });

  it("imports 21 Grimm Grammar pages as attributed links for real glossary terms, copying no text", () => {
    expect(OER_IMPORT_POLICY_VERSION).toBe("oer-attributed-reference-import-v1");
    expect(importedOerReferences).toHaveLength(21);
    const glossaryIds = new Set(grammarGlossary.map((entry) => entry.id));
    const topics = new Set<string>();
    for (const item of importedOerReferences) {
      expect(item.candidateId).toBe("OER-02");
      expect(glossaryIds.has(item.topicId), item.topicId).toBe(true);
      expect(topics.has(item.topicId), item.topicId).toBe(false);
      topics.add(item.topicId);
      expect(item.url).toMatch(/^https:\/\/coerll\.utexas\.edu\/gg\/gr\/[a-z]+_\d{2}\.html$/);
      expect(item.kind).toBe("attributed-link");
      expect(item.changes).toBe("none — linked, not copied");
      expect(item.licenseIds).toEqual(["CC-BY-4.0"]);
      expect(item.attributionLine).toBe("Zsuzsanna Abrams: „Grimm Grammar“, COERLL / The University of Texas at Austin, Lizenz CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/), geprüft am 2026-10-17");
      expect(item.review).toMatchObject({ decidedBy: "source-verified-agent", decidedOn: "2026-10-17" });
    }
    // Terms without a matching Grimm Grammar page stay unlinked instead of receiving a loose match.
    for (const id of ["nominalisierung", "partizipialattribut", "funktionsverbgefuege"]) expect(topics.has(id), id).toBe(false);
  });

  it("refuses rejected records, URLs outside the licensed source, duplicates, and incomplete reviews", () => {
    expect(() => importOerReferences(OER_REGISTER, [{ ...request, candidateId: "OER-01" }])).toThrow(/rejected by the licence gate/);
    expect(() => importOerReferences(OER_REGISTER, [{ ...request, candidateId: "OER-99" }])).toThrow(/unknown register record/);
    expect(() => importOerReferences(OER_REGISTER, [{ ...request, url: "https://coerll.utexas.edu/dib/index.php" }])).toThrow(/outside the licensed source/);
    expect(() => importOerReferences(OER_REGISTER, [request, request])).toThrow(/duplicate item id/);
    expect(() => importOerReferences(OER_REGISTER, [{ ...request, review: { ...request.review, evidence: " " } }])).toThrow(/review record incomplete/);
  });
});
