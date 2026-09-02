import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";

const baseProfile = {
  name: "Nadia",
  targetExam: "goethe-b2" as const,
  targetDate: "2027-05-15",
  dailyMinutes: 45 as const,
  arabicSupport: "modern-standard-arabic" as const,
  currentLevel: "A1" as const,
  createdAt: "2026-08-31T10:00:00.000Z",
};

describe("P0 onboarding profile", () => {
  it("persists learner goals and the explicit device-readiness result", () => {
    const parsed = learningStateSchema.parse({
      ...defaultState,
      profile: {
        ...baseProfile,
        goals: ["exam", "work"],
        deviceReadiness: {
          audio: "ready",
          microphone: "permission-denied",
          checkedAt: "2026-08-31T10:01:00.000Z",
        },
      },
    });
    expect(parsed.profile?.goals).toEqual(["exam", "work"]);
    expect(parsed.profile?.deviceReadiness?.microphone).toBe("permission-denied");
  });

  it("keeps older profiles without the new optional fields importable", () => {
    const parsed = learningStateSchema.safeParse({ ...defaultState, profile: baseProfile });
    expect(parsed.success).toBe(true);
  });

  it("rejects an explicitly empty goal selection", () => {
    const parsed = learningStateSchema.safeParse({ ...defaultState, profile: { ...baseProfile, goals: [] } });
    expect(parsed.success).toBe(false);
  });
});
