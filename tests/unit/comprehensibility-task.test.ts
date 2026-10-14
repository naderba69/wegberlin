import { readFileSync } from "node:fs";
import { RESET_FIELD_POLICIES } from "@/core/state/reset-plan";
import { describe, expect, it } from "vitest";
import {
  COMPREHENSIBILITY_BOUNDARY_AR,
  COMPREHENSIBILITY_EVIDENCE_BOUNDARY,
  COMPREHENSIBILITY_LEVEL_COUNTS,
  COMPREHENSIBILITY_MAX_PER_SESSION,
  COMPREHENSIBILITY_POLICY_VERSION,
  COMPREHENSIBILITY_TASK_COUNT,
  assertComprehensibilityIntegrity,
  comprehensibilityTaskById,
  comprehensibilityTasks,
  createComprehensibilityCheck,
  selectComprehensibilityTasks,
  summarizeComprehensibilityChecks,
} from "@/core/pronunciation/comprehensibility-task";

const core = readFileSync("src/core/pronunciation/comprehensibility-task.ts", "utf8");
const panel = readFileSync("src/components/comprehensibility-task-panel.tsx", "utf8");
const studio = readFileSync("src/components/shadowing-studio.tsx", "utf8");

describe("P2-156 real-task comprehensibility check", () => {
  it("ships an authored bank of eight tasks, two per level, each with a listener decision and one correct option", () => {
    expect(COMPREHENSIBILITY_TASK_COUNT).toBe(8);
    expect(comprehensibilityTasks.every((task) => task.authored === true)).toBe(true);
    expect(COMPREHENSIBILITY_LEVEL_COUNTS).toEqual([["A1", 2], ["A2", 2], ["B1", 2], ["B2", 2]]);
    for (const task of comprehensibilityTasks) {
      expect(task.listenerOptions.length).toBeGreaterThanOrEqual(3);
      expect(task.listenerOptions.map((option) => option.id)).toContain(task.correctOptionId);
      expect(task.informationPointsAr.length).toBeGreaterThanOrEqual(2);
      expect(task.listenerQuestionAr.length).toBeGreaterThan(9);
      expect(task.speakingGoalDe.length).toBeGreaterThan(9);
    }
    expect(new Set(comprehensibilityTasks.map((task) => task.id)).size).toBe(8);
  });

  it("selects by the learner's level only, keeps a session cap, and prefers unseen tasks", () => {
    expect(selectComprehensibilityTasks("B1").map((task) => task.id)).toEqual(["comp-b1-01", "comp-b1-02"]);
    const withDone = selectComprehensibilityTasks("A1", ["comp-a1-01"]);
    expect(withDone[0].id).toBe("comp-a1-02");
    expect(withDone[1].id).toBe("comp-a1-01");
    const capped = selectComprehensibilityTasks("B2", [], COMPREHENSIBILITY_MAX_PER_SESSION);
    expect(capped.length).toBeLessThanOrEqual(COMPREHENSIBILITY_MAX_PER_SESSION);
    expect(COMPREHENSIBILITY_MAX_PER_SESSION).toBe(3);
  });

  it("records a peer-listener judgment with the real task outcome and keeps the honest verification label", () => {
    const record = createComprehensibilityCheck({
      taskId: "comp-a1-01",
      mode: "peer-human-listener",
      outcome: "task-achieved-after-repetition",
      listenerSelectedOptionId: "tue-10",
      repeatedTimes: 1,
      unclearInformationPointIds: ["الساعة الصحيحة"],
    });
    expect(record.policyVersion).toBe(COMPREHENSIBILITY_POLICY_VERSION);
    expect(record.level).toBe("A1");
    expect(record.verification).toBe("peer-listener-reported");
    expect(record.matchesIntendedInfo).toBe(true);
    expect(record.evidenceBoundary).toBe(COMPREHENSIBILITY_EVIDENCE_BOUNDARY);
    expect(record.unclearInformationPoints).toEqual(["الساعة الصحيحة"]);
    expect(assertComprehensibilityIntegrity([record])).toBe(true);
  });

  it("labels a self-listen-back judgment as self-report and never as external verification", () => {
    const record = createComprehensibilityCheck({
      taskId: "comp-b2-02",
      mode: "self-listen-back",
      outcome: "task-achieved-immediately",
      listenerSelectedOptionId: "probation-vacation",
      repeatedTimes: 0,
      unclearInformationPointIds: [],
    });
    expect(record.verification).toBe("self-report-no-external-verification");
    const summary = summarizeComprehensibilityChecks([record]);
    expect(summary.selfReported).toBe(1);
    expect(summary.peerVerified).toBe(0);
    expect(summary.scoring).toBe("no-score-no-level-no-gate");
    expect(summary.boundaryAr).toContain("لا يُمنح مستوى ولا بوابة");
  });

  it("refuses a success verdict when the listener picked information that contradicts the authored correct option", () => {
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-a1-01",
        mode: "peer-human-listener",
        outcome: "task-achieved-immediately",
        listenerSelectedOptionId: "mon-10",
        repeatedTimes: 0,
        unclearInformationPointIds: [],
      }),
    ).toThrow(/مخالفة للمقصود/);
    const honest = createComprehensibilityCheck({
      taskId: "comp-a1-01",
      mode: "peer-human-listener",
      outcome: "task-not-achieved",
      listenerSelectedOptionId: "mon-10",
      repeatedTimes: 1,
      unclearInformationPointIds: ["اليوم الصحيح"],
    });
    expect(honest.matchesIntendedInfo).toBe(false);
    expect(summarizeComprehensibilityChecks([honest]).notAchieved).toBe(1);
  });

  it("rejects contradictory repetition bookkeeping instead of silently normalising it", () => {
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-a2-01",
        mode: "peer-human-listener",
        outcome: "task-achieved-immediately",
        listenerSelectedOptionId: "screen-two-weeks",
        repeatedTimes: 1,
        unclearInformationPointIds: [],
      }),
    ).toThrow(/بلا إعادةٍ مسجَّلة|إعادةً مسجَّلة/);
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-a2-01",
        mode: "peer-human-listener",
        outcome: "task-achieved-after-repetition",
        listenerSelectedOptionId: "screen-two-weeks",
        repeatedTimes: 0,
        unclearInformationPointIds: [],
      }),
    ).toThrow(/يتطلب تسجيل الإعادة/);
  });

  it("rejects unknown tasks, foreign options and foreign unclear points", () => {
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-zz-99",
        mode: "peer-human-listener",
        outcome: "task-not-achieved",
        repeatedTimes: 0,
        unclearInformationPointIds: [],
      }),
    ).toThrow(/مهمة غير معروفة/);
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-a1-01",
        mode: "peer-human-listener",
        outcome: "task-not-achieved",
        listenerSelectedOptionId: "not-an-option",
        repeatedTimes: 0,
        unclearInformationPointIds: [],
      }),
    ).toThrow(/ليس من خيارات المهمة/);
    expect(() =>
      createComprehensibilityCheck({
        taskId: "comp-a1-01",
        mode: "peer-human-listener",
        outcome: "task-not-achieved",
        repeatedTimes: 0,
        unclearInformationPointIds: ["نقطة من مهمة أخرى"],
      }),
    ).toThrow(/لا تنتمي إلى هذه المهمة/);
  });

  it("never touches mastery, evidence events, level gates, network or storage from the core module", () => {
    expect(core).not.toMatch(/\.mastery\b|masteryDelta|masteryEvidence|completedLessonIds|examSessions|dueReviews|mastery:/);
    expect(core).not.toMatch(/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\./);
    expect(core).toContain("no-score-no-level-no-gate");
    expect(core).toContain("تقرير ذاتي، لا تحقّق خارجي");
  });

  it("renders the honest boundary in the panel and mounts it in the pronunciation studio", () => {
    for (const marker of [
      "data-comprehensibility-policy",
      "data-comprehensibility-task",
      "data-comprehensibility-mode",
      "data-comprehensibility-listener-question",
      "data-comprehensibility-options",
      "data-comprehensibility-outcome",
      "data-comprehensibility-summary",
      "data-comprehensibility-record",
      "data-comprehensibility-no-effect",
      "data-comprehensibility-honest-note",
      "data-comprehensibility-answer-key",
    ])
      expect(panel).toContain(marker);
    expect(panel).toContain("COMPREHENSIBILITY_BOUNDARY_AR");
    expect(panel).toContain("تقرير ذاتي لا يُعدّ تحقّقًا خارجيًا");
    expect(panel).not.toMatch(/%|نسبة|درجة نطق\s*\d/);
    expect(studio).toContain("<ComprehensibilityTaskPanel level={selected.level}/>");
    expect(COMPREHENSIBILITY_BOUNDARY_AR).toContain("لا تحليل صوتي آلي");
  });

  it("summarizes honestly per level without inventing a percentage or a level claim", () => {
    const records = [
      createComprehensibilityCheck({ taskId: "comp-a1-01", mode: "peer-human-listener", outcome: "task-achieved-immediately", listenerSelectedOptionId: "tue-10", repeatedTimes: 0, unclearInformationPointIds: [] }),
      createComprehensibilityCheck({ taskId: "comp-a2-01", mode: "peer-human-listener", outcome: "task-not-achieved", listenerSelectedOptionId: "battery-two-weeks", repeatedTimes: 2, unclearInformationPointIds: ["نوع العطل"] }),
      createComprehensibilityCheck({ taskId: "comp-b1-02", mode: "self-listen-back", outcome: "task-achieved-after-repetition", listenerSelectedOptionId: "heating-repair", repeatedTimes: 1, unclearInformationPointIds: [] }),
    ];
    const summary = summarizeComprehensibilityChecks(records);
    expect(summary.totalAttempts).toBe(3);
    expect(summary.achieved).toBe(2);
    expect(summary.notAchieved).toBe(1);
    expect(summary.byLevel.find((row) => row.level === "A2")).toMatchObject({ attempts: 1, achieved: 0, notAchieved: 1 });
    expect(summary.byLevel.find((row) => row.level === "B1")).toMatchObject({ attempts: 1, peerVerified: 0, selfReported: 1 });
    expect(JSON.stringify(summary)).not.toMatch(/percent|score\d/);
  });

  it("classifies the new evidence field in the reset plan with the documented totals", () => {
    const row = RESET_FIELD_POLICIES.find((entry) => entry.field === "comprehensibilityChecks");
    expect(row?.bucket).toBe("evidence");
    expect(RESET_FIELD_POLICIES.length).toBe(68);
    expect(RESET_FIELD_POLICIES.filter((entry) => entry.bucket === "evidence")).toHaveLength(27);
    expect(RESET_FIELD_POLICIES.filter((entry) => entry.bucket === "settings")).toHaveLength(12);
  });

  it("keeps the authored task bank grounded in the learner's own sheet, not in an official claim", () => {
    expect(core).toContain("مُؤلَّف داخل المشروع");
    expect(core).not.toMatch(/Goethe|telc|Hueber|official/i);
    const task = comprehensibilityTaskById("comp-b2-01");
    expect(task?.informationPointsAr).toEqual(["الموقف", "الشرط", "المقترح العملي"]);
  });
});
