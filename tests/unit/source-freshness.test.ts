// @vitest-environment node
import { describe, expect, it } from "vitest";
import { costPolicy, costRegistry, getAICostDecision, HARD_BUDGET_USD } from "@/config/cost-registry";
import { examProfiles } from "@/data/exam-profiles";
import { getSourceFreshness, sourceVerificationRegistry, summarizeSourceFreshness } from "@/core/governance/source-freshness";
import { webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { localPronunciationModelRegistry } from "@/config/local-pronunciation-model-registry";
import { aiSourceIds, dueSoonAt, earliestDueDay, freshAt, newestVerificationDay, oldestVerificationDay, staleAt } from "../helpers/source-verification-clock";

const at = (date: string) => new Date(`${date}T12:00:00Z`);

describe("P0 monthly official-source and zero-cost governance", () => {
  it("keeps a unique HTTPS registry whose records require human semantic review", () => {
    expect(sourceVerificationRegistry.schemaVersion).toBe(1);
    expect(sourceVerificationRegistry.policyVersion).toBe("source-freshness-v1");
    expect(sourceVerificationRegistry.records).toHaveLength(19);
    expect(new Set(sourceVerificationRegistry.records.map((record) => record.id)).size).toBe(19);
    for (const record of sourceVerificationRegistry.records) {
      expect(record.url).toMatch(/^https:\/\//);
      expect(record.verificationMode).toBe("manual-semantic-review");
      expect(record.maxAgeDays).toBe(30);
    }
  });

  it("marks the exact fresh, due-soon, stale, and invalid-clock boundaries", () => {
    // Fixture, not a registry record: the boundaries are pure arithmetic on one verification date, and a literal
    // registry date here would have to be rewritten every time a maintainer re-verifies that source.
    const record = { ...sourceVerificationRegistry.records[0], lastVerifiedAt: "2026-01-10", maxAgeDays: 30 };
    expect(getSourceFreshness(record, at("2026-02-01")).status).toBe("fresh");
    expect(getSourceFreshness(record, at("2026-02-02")).status).toBe("due-soon");
    expect(getSourceFreshness(record, at("2026-02-09"))).toMatchObject({ status: "due-soon", daysUntilDue: 0, dueAt: "2026-02-09" });
    expect(getSourceFreshness(record, at("2026-02-10")).status).toBe("stale");
    expect(getSourceFreshness(record, at("2026-01-09")).status).toBe("clock-error");
  });

  it("derives a fresh, due-soon, and stale test clock from the registry for every source group the tests pin", () => {
    // Guards tests/helpers/source-verification-clock.ts against the production functions, so a re-verification that leaves a
    // group's dates further apart than one window fails here with a clear message instead of as a confusing e2e or AI failure.
    const groups = [
      { name: "remote AI", ids: aiSourceIds, canBeFresh: true },
      ...Object.values(examProfiles).map((profile) => ({ name: profile.id, ids: profile.sourceRefs, canBeFresh: true })),
      { name: "browser WebGPU model", ids: webGPUModelRegistry.sourceIds, canBeFresh: false },
      { name: "local pronunciation model", ids: localPronunciationModelRegistry.sourceIds, canBeFresh: false },
    ];
    for (const group of groups) {
      if (group.canBeFresh) expect(summarizeSourceFreshness(group.ids, freshAt(group.ids)).status, `${group.name} fresh`).toBe("fresh");
      expect(summarizeSourceFreshness(group.ids, dueSoonAt(group.ids)), `${group.name} due-soon`).toMatchObject({ status: "due-soon", dueAt: earliestDueDay(group.ids) });
      expect(summarizeSourceFreshness(group.ids, staleAt(group.ids)).status, `${group.name} stale`).toBe("stale");
      expect(summarizeSourceFreshness(group.ids, freshAt(group.ids)).oldestVerifiedAt, `${group.name} oldest`).toBe(oldestVerificationDay(group.ids));
      expect(newestVerificationDay(group.ids) >= oldestVerificationDay(group.ids), `${group.name} order`).toBe(true);
    }
  });

  it("links every exam profile source to a current central record", () => {
    for (const profile of Object.values(examProfiles)) {
      const summary = summarizeSourceFreshness(profile.sourceRefs, freshAt(profile.sourceRefs));
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
    const now = freshAt(aiSourceIds);
    expect(getAICostDecision("gemini", "gemini-2.5-flash", now).allowed).toBe(true);
    expect(getAICostDecision("gemini", "gemini-2.5-flash-lite", now).allowed).toBe(true);
    expect(getAICostDecision("gemini", "gemini-3.1-pro-preview", now)).toMatchObject({ allowed: false, freshness: "fresh" });
  });

  it("allows only OpenRouter's free router or :free suffix", () => {
    const now = freshAt(aiSourceIds);
    expect(getAICostDecision("openrouter", "openrouter/free", now).allowed).toBe(true);
    expect(getAICostDecision("openrouter", "vendor/model:free", now).allowed).toBe(true);
    expect(getAICostDecision("openrouter", "vendor/model", now).allowed).toBe(false);
  });

  it("blocks every remote AI request after the verification window expires", () => {
    const now = staleAt(aiSourceIds);
    expect(getAICostDecision("gemini", "gemini-2.5-flash", now)).toMatchObject({ allowed: false, freshness: "stale" });
    expect(getAICostDecision("openrouter", "openrouter/free", now)).toMatchObject({ allowed: false, freshness: "stale" });
  });

  it("registers the optional browser WebGPU model as zero-cost with five governed sources", () => {
    const service=costRegistry.find((item)=>item.id==="browser-webgpu");
    expect(service).toMatchObject({mandatory:false,costStatus:"browser-local-zero-cost",paymentCardRequired:false,owner:"learner"});
    expect(service?.sourceIds).toHaveLength(5);
    const ids=service?.sourceIds ?? [];
    expect(summarizeSourceFreshness(ids,dueSoonAt(ids))).toMatchObject({status:"due-soon",dueAt:earliestDueDay(ids)});
  });

  it("registers local Whisper matching as zero-cost with five governed sources", () => {
    const service=costRegistry.find((item)=>item.id==="browser-pronunciation");
    expect(service).toMatchObject({mandatory:false,costStatus:"browser-local-zero-cost",paymentCardRequired:false,owner:"learner"});
    expect(service?.sourceIds).toHaveLength(5);
    const ids=service?.sourceIds ?? [];
    expect(summarizeSourceFreshness(ids,dueSoonAt(ids))).toMatchObject({status:"due-soon",dueAt:earliestDueDay(ids)});
  });

  it("uses blocking stale actions for all zero-cost external sources", () => {
    const externalCostSources = sourceVerificationRegistry.records.filter((record) => record.category !== "exam-format");
    expect(externalCostSources).toHaveLength(14);
    expect(externalCostSources.every((record) => record.staleAction === "block-remote-ai" || record.staleAction === "block-release")).toBe(true);
  });
});
