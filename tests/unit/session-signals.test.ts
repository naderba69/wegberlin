import { describe, expect, it } from "vitest";
import { composeTodayMission } from "@/core/coach/coach";
import { effectiveSessionMinutes, localSessionDate, nextFocusLabel, saveDailyCheckIn, saveDailyReflection } from "@/core/coach/session-signals";
import { defaultState } from "@/core/portability/db";
import type { LearnerProfile, LearningState } from "@/types/learning";

const profile = (dailyMinutes: LearnerProfile["dailyMinutes"]): LearnerProfile => ({
  name: "Nadia", targetExam: "goethe-b2", dailyMinutes, arabicSupport: "modern-standard-arabic", currentLevel: "A1", createdAt: "2026-08-01T00:00:00Z",
});
const diagnosticResult = { estimatedLevel:"A1" as const, score:3, maxScore:4, levelScores:{A1:3,A2:0,B1:0,B2:0}, completedAt:"2026-08-31T08:00:00Z" };
const stateFor = (dailyMinutes: LearnerProfile["dailyMinutes"]): LearningState => ({ ...defaultState, profile: profile(dailyMinutes), diagnosticResult, completedLessonIds:["a1-01"] });

describe("P0 daily session check-in and reflection", () => {
  it("stores a local-date check-in and caps low-energy load at twenty minutes", () => {
    const now = new Date(2026, 7, 31, 9, 0, 0);
    const checked = saveDailyCheckIn(stateFor(60), { availableMinutes: 45, energyBefore: 2 }, now);
    const key = localSessionDate(now);
    expect(checked.dailySessions[key]).toMatchObject({ date:key, availableMinutes:45, energyBefore:2 });
    expect(effectiveSessionMinutes(checked, now)).toBe(20);
  });

  it("respects the learner's real available time when energy is sufficient", () => {
    const now = new Date(2026, 7, 31, 9, 0, 0);
    const checked = saveDailyCheckIn(stateFor(90), { availableMinutes: 60, energyBefore: 4 }, now);
    expect(effectiveSessionMinutes(checked, now)).toBe(60);
  });

  it("carries a previous lighter-load decision into the next day until a new check-in overrides it", () => {
    const firstDay = new Date(2026, 7, 30, 20, 0, 0);
    const secondDay = new Date(2026, 7, 31, 9, 0, 0);
    const reflected = saveDailyReflection(stateFor(45), { difficultyAfter:5, confidenceAfter:2, reflection:"مرهقة", nextFocus:"lighter" }, firstDay);
    expect(effectiveSessionMinutes(reflected, secondDay)).toBe(20);
    const overridden = saveDailyCheckIn(reflected, { availableMinutes:45, energyBefore:4 }, secondDay);
    expect(effectiveSessionMinutes(overridden, secondDay)).toBe(45);
  });

  it("stores bounded reflection evidence and a clear next decision", () => {
    const now = new Date(2026, 7, 31, 20, 0, 0);
    const reflected = saveDailyReflection(stateFor(45), { difficultyAfter:4, confidenceAfter:2, reflection:`  ${"x".repeat(1100)}  `, nextFocus:"review" }, now);
    const record = reflected.dailySessions[localSessionDate(now)];
    expect(record.reflection).toHaveLength(1000);
    expect(record.nextFocus).toBe("review");
    expect(nextFocusLabel(record.nextFocus!)).toContain("المراجعة");
  });

  it("builds exact 10/20/30/45/60/90-minute sessions with check-in, production, and reflection", () => {
    for (const minutes of [10,20,30,45,60,90] as const) {
      const mission = composeTodayMission(stateFor(minutes), new Date(2026,7,31,9));
      expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(minutes);
      expect(mission.some((block) => block.kind === "check-in")).toBe(true);
      expect(mission.some((block) => block.kind === "production")).toBe(true);
      expect(mission.some((block) => block.kind === "reflection")).toBe(true);
    }
  });

  it("redistributes review time before the first completed lesson instead of inventing review cards", () => {
    const state = { ...stateFor(20), completedLessonIds: [] };
    const mission = composeTodayMission(state, new Date(2026,7,31,9));
    expect(mission.some((block) => block.kind === "review")).toBe(false);
    expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(20);
  });
});
