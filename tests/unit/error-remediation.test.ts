import { describe, expect, it } from "vitest";
import { applySuccessfulErrorRepair, errorCorrectionVariants, errorRepairState, matchesErrorCorrection } from "@/core/errors/remediation";
import type { ErrorRecord } from "@/types/learning";

const baseError: ErrorRecord = { id:"e1",type:"grammar",wrong:"Wie du heißt?",correct:"Wie heißt du?",explanationAr:"ترتيب",occurrences:1,lastSeenAt:"2026-08-30T09:00:00Z",resolved:false,repairCount:0 };

describe("personal error remediation", () => {
  it("accepts the full expected correction despite harmless punctuation and case", () => {
    expect(matchesErrorCorrection("wie heißt du", "Wie heißt du?")).toBe(true);
  });

  it("accepts one explicitly published alternative", () => {
    const expected = "Ich heiße Sami. / Mein Name ist Sami.";
    expect(errorCorrectionVariants(expected)).toEqual(["Ich heiße Sami.", "Mein Name ist Sami."]);
    expect(matchesErrorCorrection("Mein Name ist Sami", expected)).toBe(true);
  });

  it("keeps meaningful German orthography strict", () => {
    expect(matchesErrorCorrection("Wie heisst du?", "Wie heißt du?")).toBe(false);
  });

  it("rejects empty and partial answers", () => {
    expect(matchesErrorCorrection("", "Wie heißt du?")).toBe(false);
    expect(matchesErrorCorrection("Wie heißt", "Wie heißt du?")).toBe(false);
  });

  it("schedules a delayed retest after the first successful repair", () => {
    const repaired = applySuccessfulErrorRepair(baseError, new Date("2026-08-30T12:00:00Z"));
    expect(repaired.resolved).toBe(false);
    expect(repaired.repairCount).toBe(1);
    expect(repaired.nextReviewAt).toBe("2026-08-31T00:00:00.000Z");
    expect(errorRepairState(repaired, new Date("2026-08-30T18:00:00Z"))).toBe("waiting");
  });

  it("does not confirm a repair before its delayed due time", () => {
    const repaired = applySuccessfulErrorRepair(baseError, new Date("2026-08-30T12:00:00Z"));
    expect(applySuccessfulErrorRepair(repaired, new Date("2026-08-30T18:00:00Z"))).toEqual(repaired);
  });

  it("confirms resolution only after a second successful delayed recall", () => {
    const repaired = applySuccessfulErrorRepair(baseError, new Date("2026-08-30T12:00:00Z"));
    const confirmed = applySuccessfulErrorRepair(repaired, new Date("2026-08-31T09:00:00Z"));
    expect(errorRepairState(repaired, new Date("2026-08-31T09:00:00Z"))).toBe("due");
    expect(confirmed.resolved).toBe(true);
    expect(confirmed.repairCount).toBe(2);
    expect(confirmed.confirmedAt).toBe("2026-08-31T09:00:00.000Z");
    expect(confirmed.nextReviewAt).toBeUndefined();
  });
});
