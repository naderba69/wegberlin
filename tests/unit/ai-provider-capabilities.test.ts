// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AI_PROVIDER_CAPABILITY_POLICY, getAIProviderCapabilityMatrix } from "@/core/ai/provider-capabilities";

describe("P1 unified AI provider capability matrix", () => {
  it("publishes all five honest providers with model, feature, privacy, quota, source, and free boundaries", () => {
    expect(AI_PROVIDER_CAPABILITY_POLICY).toBe("ai-provider-capability-matrix-v1");
    const rows = getAIProviderCapabilityMatrix({
      selectedProvider: "openrouter",
      selectedModel: "openrouter/free",
      hasSessionCredential: true,
      now: new Date("2026-09-08T12:00:00Z"),
    });
    expect(rows.map((row) => row.id)).toEqual(["disabled", "gemini", "openrouter", "local", "browser-webgpu"]);
    expect(rows.every((row) => row.model && row.privacyAr && row.quotaAr && row.freeBoundaryAr && row.sourceAr && row.fallbackAr)).toBe(true);
    expect(rows.every((row) => row.liveQuotaAvailable === false)).toBe(true);
    expect(rows.find((row) => row.id === "openrouter")).toMatchObject({ selected: true, setupStatus: "ready", sourceStatus: "fresh", features:{"writing-ai":{status:"not-available"}} });
    expect(rows.find((row) => row.id === "gemini")?.features["writing-ai"]).toMatchObject({status:"available"});
    expect(rows.find((row) => row.id === "browser-webgpu")?.features).toMatchObject({
      tutor: { status: "not-available" },
      "tutor-commands": { status: "not-available" },
      "speaking-follow-up": { status: "limited" },
    });
  });

  it("never claims a live quota and exposes the exact Free-only boundary", () => {
    const rows = getAIProviderCapabilityMatrix({ selectedProvider: "disabled", selectedModel: "", hasSessionCredential: false, now: new Date("2026-09-08T12:00:00Z") });
    const gemini = rows.find((row) => row.id === "gemini")!;
    const openrouter = rows.find((row) => row.id === "openrouter")!;
    expect(gemini.quotaAr).toContain("لا تستطيع المنصة قراءة الحصة اللحظية");
    expect(gemini.freeBoundaryAr).toContain("gemini-2.5-flash-lite");
    expect(openrouter.freeBoundaryAr).toContain("openrouter/free");
    expect(openrouter.freeBoundaryAr).toContain(":free");
    expect(openrouter.freeBoundaryAr).toContain("لا رصيد");
  });

  it("marks stale or unverified remote configurations blocked without hiding local capability", () => {
    const stale = getAIProviderCapabilityMatrix({ selectedProvider: "gemini", selectedModel: "gemini-2.5-flash", hasSessionCredential: true, now: new Date("2026-10-04T12:00:00Z") });
    expect(stale.find((row) => row.id === "gemini")).toMatchObject({ setupStatus: "blocked", sourceStatus: "stale" });
    expect(stale.find((row) => row.id === "disabled")).toMatchObject({ setupStatus: "ready", sourceStatus: "local" });

    const unverified = getAIProviderCapabilityMatrix({ selectedProvider: "openrouter", selectedModel: "vendor/paid", hasSessionCredential: true, now: new Date("2026-09-08T12:00:00Z") });
    expect(unverified.find((row) => row.id === "openrouter")).toMatchObject({ setupStatus: "blocked" });
  });
});
