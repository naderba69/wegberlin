// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CEFR_GUIDED_HOURS, REVIEW_OVERHEAD_RATIO, TIME_BUDGET_POLICY, buildTimeBudget } from "@/core/planning/time-budget";
import { defaultState } from "@/core/portability/db";
import type { LearningState } from "@/types/learning";

function stateWith(patch: Partial<LearningState["profile"]>, completed: string[] = []): LearningState {
  return {
    ...defaultState,
    completedLessonIds: completed,
    mastery: {},
    profile: { ...defaultState.profile!, ...patch },
  };
}

describe("honest time budget", () => {
  it("separates finishing the lessons from reaching the level", () => {
    const budget = buildTimeBudget(stateWith({ dailyMinutes: 30, currentLevel: "B1" }));
    expect(budget.remainingLessons).toBeGreaterThan(0);
    expect(budget.lessonMinutes).toBeGreaterThan(0);
    expect(budget.curriculumMonths).toBeLessThan(budget.guidedMonths.min);
    expect(budget.guidedHours.min).toBe(CEFR_GUIDED_HOURS.B1.min - CEFR_GUIDED_HOURS.A2.min);
    expect(budget.guidedHours.max).toBe(CEFR_GUIDED_HOURS.B1.max - CEFR_GUIDED_HOURS.A2.max);
    expect(budget.gapFactor).toBeGreaterThan(1);
  });

  it("shrinks the remaining work as lessons are completed", () => {
    const full = buildTimeBudget(stateWith({ dailyMinutes: 30, currentLevel: "A1" }));
    const half = buildTimeBudget(stateWith({ dailyMinutes: 30, currentLevel: "A1" }, ["a1-01", "a1-02", "a1-03"]));
    expect(half.remainingLessons).toBe(full.remainingLessons - 3);
    expect(half.lessonMinutes).toBeLessThan(full.lessonMinutes);
  });

  it("tells the learner when the target date is not reachable with the chosen daily time", () => {
    const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const stretch = buildTimeBudget(stateWith({ dailyMinutes: 10, currentLevel: "B1", targetDate: soon }));
    expect(stretch.verdict?.feasible).toBe(false);
    expect(stretch.verdict?.requiredDailyMinutes).toBeGreaterThan(10);
    expect(stretch.verdict?.messageAr).toContain("لا نَعدك بالمستوى");

    const far = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
    const feasible = buildTimeBudget(stateWith({ dailyMinutes: 60, currentLevel: "B1", targetDate: far }));
    expect(feasible.verdict?.feasible).toBe(true);
  });

  it("never claims a level and keeps the boundary visible in the UI", () => {
    const budget = buildTimeBudget(stateWith({ dailyMinutes: 20, currentLevel: "A2" }));
    expect(budget.boundary).toContain("no-guarantee-no-cefr-award");
    expect(budget.boundaryAr).toContain("لا يمنح هذا الحساب مستوى");
    expect(REVIEW_OVERHEAD_RATIO).toBe(0.35);
    expect(TIME_BUDGET_POLICY).toBe("honest-time-budget-v1");
    const panel = readFileSync("src/components/time-budget-panel.tsx", "utf8");
    const page = readFileSync("src/app/progress/page.tsx", "utf8");
    expect(panel).toContain("data-time-budget={TIME_BUDGET_POLICY}");
    expect(panel).toContain("{budget.boundaryAr}");
    expect(page).toContain("<TimeBudgetPanel />");
  });
});
