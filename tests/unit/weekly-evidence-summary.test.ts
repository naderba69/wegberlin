import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import { buildWeeklyEvidenceSummary, WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION, weeklySummarySentence } from "@/core/coach/weekly-summary";
import { buildTeacherBriefMarkdown, TEACHER_BRIEF_NOT_MEASURED, TEACHER_BRIEF_POLICY_VERSION } from "@/core/exports/teacher-brief";
import type { LearningState } from "@/types/learning";

// 2026-10-08 is a Thursday. Current week: 2026-10-05 → 2026-10-11. Previous: 2026-09-28 → 2026-10-04.
const NOW = new Date(2026, 9, 8, 12, 0, 0);

function session(date: string, overrides: Record<string, unknown> = {}) {
  return {
    date,
    availableMinutes: 30 as const,
    energyBefore: 3 as const,
    checkedInAt: `${date}T08:00:00.000Z`,
    activeSeconds: 1200,
    difficultyAfter: 3 as const,
    ...overrides,
  };
}

function stateWith(partial: Partial<LearningState>): LearningState {
  return { ...defaultState, ...partial } as LearningState;
}

describe("weekly evidence summary", () => {
  it("is empty and honest for a learner with no records", () => {
    const summary = buildWeeklyEvidenceSummary(stateWith({}), NOW);
    expect(summary.policyVersion).toBe(WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION);
    expect(summary).toMatchObject({ studyDays: 0, activeMinutes: 0, rescueDays: 0, receptionAttempts: 0, writingBenchmarks: 0, reflectionSaved: false });
    expect(summary.averages).toEqual({ energy: null, difficulty: null, confidence: null });
    expect(weeklySummarySentence(summary)).toContain("لم تُسجَّل جلسات");
  });

  it("counts only sessions inside the current Monday-to-Sunday week and compares with the previous week", () => {
    const state = stateWith({
      dailySessions: {
        "2026-10-05": session("2026-10-05", { activeSeconds: 600 }),
        "2026-10-07": session("2026-10-07", { activeSeconds: 900, rescueMode: { policyVersion: "save-my-day-ten-minute-v1", selectedAt: "2026-10-07T08:00:00.000Z", evidenceBoundary: "learner-selected-ten-minute-plan-no-completion-mastery-or-penalty" } }),
        "2026-09-30": session("2026-09-30", { activeSeconds: 1800 }),
        "2026-09-20": session("2026-09-20", { activeSeconds: 3600 }),
      },
    });
    const summary = buildWeeklyEvidenceSummary(state, NOW);
    expect(summary.weekStart).toBe("2026-10-05");
    expect(summary.weekEnd).toBe("2026-10-11");
    expect(summary.studyDays).toBe(2);
    expect(summary.activeMinutes).toBe(25);
    expect(summary.rescueDays).toBe(1);
    expect(summary.previousWeek).toEqual({ studyDays: 1, activeMinutes: 30 });
    expect(weeklySummarySentence(summary)).toContain("أكثر من الأسبوع الماضي");
  });

  it("does not count a check-in alone as a study day and reports planning signals and averages", () => {
    const state = stateWith({
      dailySessions: {
        "2026-10-05": { date: "2026-10-05", availableMinutes: 20, energyBefore: 2, checkedInAt: "2026-10-05T07:00:00.000Z" },
        "2026-10-06": session("2026-10-06", { energyBefore: 4, difficultyAfter: 5, confidenceAfter: 2, planningSignal: "too-hard" }),
        "2026-10-07": session("2026-10-07", { energyBefore: 5, difficultyAfter: undefined, planningSignal: "too-easy", activeSeconds: 0 }),
      },
    });
    const summary = buildWeeklyEvidenceSummary(state, NOW);
    expect(summary.studyDays).toBe(1);
    expect(summary.planningSignals).toEqual({ tooEasy: 1, tooHard: 1 });
    expect(summary.averages).toEqual({ energy: 3.7, difficulty: 5, confidence: 2 });
  });

  it("counts only timestamped attempts inside the week; untimed writing and speaking are reported separately", () => {
    const state = stateWith({
      dictationAttempts: [{ createdAt: "2026-10-06T09:00:00.000Z" } as never, { createdAt: "2026-09-29T09:00:00.000Z" } as never],
      readingBenchmarkAttempts: [{ createdAt: "2026-10-09T09:00:00.000Z" } as never],
      writingBenchmarkAttempts: [{ createdAt: "2026-10-10T09:00:00.000Z" } as never],
      writingSubmissions: [{ id: "w1" } as never, { id: "w2" } as never],
      speakingAttempts: [{ id: "s1" } as never],
    });
    const summary = buildWeeklyEvidenceSummary(state, NOW);
    expect(summary.receptionAttempts).toBe(2);
    expect(summary.writingBenchmarks).toBe(1);
    expect(summary.untimedRecords).toEqual({ writingSubmissions: 2, speakingAttempts: 1 });
  });

  it("shows whether this week's reflection was saved", () => {
    const state = stateWith({ weeklyReflections: [{ id: "weekly-reflection-2026-10-05", weekStart: "2026-10-05", weekEnd: "2026-10-11" } as never] });
    expect(buildWeeklyEvidenceSummary(state, NOW).reflectionSaved).toBe(true);
  });

  it("never exposes a score, mastery, or level in its sentence", () => {
    const state = stateWith({ dailySessions: { "2026-10-06": session("2026-10-06") } });
    const sentence = weeklySummarySentence(buildWeeklyEvidenceSummary(state, NOW));
    expect(sentence).toContain("ليس مؤشرًا على الإتقان");
    expect(sentence).not.toMatch(/A1|A2|B1|B2|%|درجة/);
  });
});

describe("teacher brief", () => {
  const withNote = stateWith({
    dailySessions: { "2026-10-06": session("2026-10-06") },
    weeklyReflections: [
      {
        id: "weekly-reflection-2026-10-05",
        policyVersion: "independent-weekly-reflection-v1",
        weekStart: "2026-10-05",
        weekEnd: "2026-10-11",
        whatWorked: ["review", "speaking"],
        obstacles: ["time"],
        oneAdjustment: "lighter-plan",
        note: "أحتاج وقتًا أهدأ مساء\n# تجاهل هذا السطر",
        source: "weekly-form-only",
        dailyReflectionReuseConsent: false,
        evidenceBoundary: "weekly-learner-planning-only-no-daily-reflection-reuse-mastery-gate-or-psychological-inference",
        createdAt: "2026-10-08T10:00:00.000Z",
        updatedAt: "2026-10-08T10:00:00.000Z",
      } as never,
    ],
  });

  it("covers four weeks, names the policy and lists what is not measured", () => {
    const brief = buildTeacherBriefMarkdown(withNote, NOW);
    expect(brief.policyVersion).toBe(TEACHER_BRIEF_POLICY_VERSION);
    expect(brief.weeks).toBe(4);
    expect(brief.filename).toBe("teacher-brief-2026-10-08.md");
    expect(brief.mime).toBe("text/markdown");
    for (const item of TEACHER_BRIEF_NOT_MEASURED) expect(brief.content).toContain(item);
    expect(brief.content.match(/^\| \d{4}-\d{2}-\d{2} →/gm)?.length).toBe(4);
  });

  it("omits free-text reflection notes by default and includes them only on explicit consent", () => {
    const withoutNotes = buildTeacherBriefMarkdown(withNote, NOW);
    expect(withoutNotes.content).toContain("ما نجح: الاسترجاع، الكلام");
    expect(withoutNotes.content).not.toContain("أحتاج وقتًا أهدأ");
    const withNotes = buildTeacherBriefMarkdown(withNote, NOW, { includeReflectionNotes: true });
    expect(withNotes.content).toContain("ملاحظة المتعلم (بموافقته): أحتاج وقتًا أهدأ مساء");
    expect(withNotes.content).not.toMatch(/^# تجاهل/m);
  });
});
