// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_ACCESSIBILITY_PREFERENCES, accessibilityPreferencesAreDefault } from "@/core/accessibility/preferences";
import { exportArchive, importArchive } from "@/core/portability/backup";
import { defaultState } from "@/core/portability/db";
import { mergeLearningStates } from "@/core/portability/merge";
import { learningStateSchema } from "@/core/portability/schema";

describe("persistent visual accessibility preferences", () => {
  it("starts with a versioned, backward-compatible default", () => {
    expect(defaultState.accessibilityPreferences).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(accessibilityPreferencesAreDefault(defaultState.accessibilityPreferences)).toBe(true);
  });

  it("adds defaults while parsing an older schema-v3 state that predates the field", () => {
    const olderV3: Record<string, unknown> = { ...defaultState };
    delete olderV3.accessibilityPreferences;
    const parsed = learningStateSchema.parse(olderV3);
    expect(parsed.accessibilityPreferences).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
  });

  it("accepts the three learner-controlled reading sizes", () => {
    for (const fontScale of ["compact", "default", "large"] as const) {
      expect(learningStateSchema.safeParse({ ...defaultState, accessibilityPreferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, fontScale } }).success).toBe(true);
    }
  });

  it("rejects unknown font-scale values instead of silently accepting corrupt state", () => {
    const parsed = learningStateSchema.safeParse({
      ...defaultState,
      accessibilityPreferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, fontScale: "huge" },
    });
    expect(parsed.success).toBe(false);
  });

  it("uses the newer snapshot for the complete preference set during merge", () => {
    const current = {
      ...defaultState,
      accessibilityPreferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, fontScale: "large" as const },
      updatedAt: "2026-09-07T08:00:00.000Z",
    };
    const incoming = {
      ...defaultState,
      accessibilityPreferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, highContrast: true, reducedMotion: true },
      updatedAt: "2026-09-07T09:00:00.000Z",
    };
    expect(mergeLearningStates(current, incoming).accessibilityPreferences).toEqual(incoming.accessibilityPreferences);
    expect(mergeLearningStates(incoming, current).accessibilityPreferences).toEqual(incoming.accessibilityPreferences);
  });

  it("round-trips all visual preferences through a DWNB archive", async () => {
    const preferences = { ...DEFAULT_ACCESSIBILITY_PREFERENCES, fontScale: "large" as const, highContrast: true, reducedMotion: true };
    const archive = await exportArchive({ ...defaultState, accessibilityPreferences: preferences }, { includeMedia: false });
    const imported = await importArchive(archive);
    expect(imported.state.accessibilityPreferences).toEqual(preferences);
  });
});
