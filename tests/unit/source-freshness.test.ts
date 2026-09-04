// @vitest-environment node
import { describe, expect, it } from "vitest";
import { costPolicy, costRegistry, getAICostDecision, HARD_BUDGET_USD } from "@/config/cost-registry";
import { examProfiles } from "@/data/exam-profiles";
import { getSourceFreshness, sourceVerificationRegistry, summarizeSourceFreshness } from "@/core/governance/source-freshness";

const at = (date: string) => new Date(`${date}T12:00:00Z`);

describe("P0 monthly official-source and zero-cost governance", () => {
  it("keeps a unique HTTPS registry whose records require human semantic review", () => {
    expect(sourceVerificationRegistry.schemaVersion).toBe(1);
    expect(sourceVerificationRegistry.policyVersion).toBe("source-freshness-v1");
    expect(sourceVerificationRegistry.records).toHaveLength(12);
    expect(new Set(sourceVerificationRegistry.records.map((record) => record.id)).size).toBe(12);
    for (const record of sourceVerificationRegistry.records) {
      expect(record.url).toMatch(/^https:\/\//);
      expect(record.verificationMode).toBe("manual-semantic-review");
      expect(record.maxAgeDays).toBe(30);
    }
  });

  it("marks the exact fresh, due-soon, stale, and invalid-clock boundaries", () => {
    const record = sourceVerificationRegistry.records[0];
    expect(getSourceFreshness(record, at("2026-09-25")).status).toBe("fresh");
    expect(getSourceFreshness(record, at("2026-09-26")).status).toBe("due-soon");
    expect(getSourceFreshness(record, at("2026-10-03"))).toMatchObject({ status: "due-soon", daysUntilDue: 0, dueAt: "2026-10-03" });
    expect(getSourceFreshness(record, at("2026-10-04")).status).toBe("stale");
    expect(getSourceFreshness(record, at("2026-09-02")).status).toBe("clock-error");
  });

  it("links every exam profile source to a current central record", () => {
    for (const profile of Object.values(examProfiles)) {
      const summary = summarizeSourceFreshness(profile.sourceRefs, at("2026-09-03"));
      expect(summary.status).toBe("fresh");
      expect(summary.oldestVerifiedAt).toBe(profile.verifiedAt);
      expect(summary.checks.every((check) => check.record.service === profile.id)).toBe(true);
    }
  });

  it("keeps the hard budget at zero and gives every optional service a local fallback", () => {
    expect(HARD_BUDGET_USD).toBe(0);
    expect(costPolicy).toMatchObject({ allowPaidModels: false, allowAutomaticPaidFallback: false, onUnknownPrice: "block" });
    expect(costRegistry.find((service) => service.mandatory)?.id).toBe("core-local");
    for (const service of costRegistry) expect(service.fallbackAr.length).toBeGreaterThan(8);
  });

  it("allows disabled and local AI even when remote verification would be stale", () => {
    expect(getAICostDecision("disabled", "", at("2030-01-01"))).toMatchObject({ allowed: true, freshness: "local" });
    expect(getAICostDecision("local", "qwen2.5:3b", at("2030-01-01"))).toMatchObject({ allowed: true, freshness: "local" });
  });

  it("allows only the explicitly verified Gemini free-tier model list", () => {
    expect(getAICostDecision("gemini", "gemini-2.5-flash", at("2026-09-03")).allowed).toBe(true);
    expect(getAICostDecision("gemini", "gemini-2.5-flash-lite", at("2026-09-03")).allowed).toBe(true);
    expect(getAICostDecision("gemini", "gemini-3.1-pro-preview", at("2026-09-03"))).toMatchObject({ allowed: false, freshness: "fresh" });
  });

  it("allows only OpenRouter's free router or :free suffix", () => {
    expect(getAICostDecision("openrouter", "openrouter/free", at("2026-09-03")).allowed).toBe(true);
    expect(getAICostDecision("openrouter", "vendor/model:free", at("2026-09-03")).allowed).toBe(true);
    expect(getAICostDecision("openrouter", "vendor/model", at("2026-09-03")).allowed).toBe(false);
  });

  it("blocks every remote AI request after the verification window expires", () => {
    expect(getAICostDecision("gemini", "gemini-2.5-flash", at("2026-10-04"))).toMatchObject({ allowed: false, freshness: "stale" });
    expect(getAICostDecision("openrouter", "openrouter/free", at("2026-10-04"))).toMatchObject({ allowed: false, freshness: "stale" });
  });

  it("uses blocking stale actions for all zero-cost external sources", () => {
    const externalCostSources = sourceVerificationRegistry.records.filter((record) => record.category !== "exam-format");
    expect(externalCostSources).toHaveLength(7);
    expect(externalCostSources.every((record) => record.staleAction === "block-remote-ai" || record.staleAction === "block-release")).toBe(true);
  });
});
