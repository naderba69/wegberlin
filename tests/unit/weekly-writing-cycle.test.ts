// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WEEKLY_WRITING_BOUNDARY, WEEKLY_WRITING_POLICY, WEEKLY_WRITING_WINDOW_WEEKS, weekBounds, weeklyWritingCycle, weeklyWritingStatusLabel } from "@/core/writing/weekly-cycle";
import { defaultState } from "@/core/portability/db";
import type { LearningState, WritingSubmission } from "@/types/learning";

/**
 * حارس دورة الكتابة الأسبوعية (P1-14): العقد أن **الإعادة إلزامية** — المسودة وحدها لا تُكمل
 * الأسبوع، والنسخة المطابقة لأصلها ليست إعادة كتابة. والحدّ صريح: إيقاع لا درجة ولا طلاقة.
 */
function submission(id: string, createdAt: string, status: WritingSubmission["status"], patch: Partial<WritingSubmission> = {}): WritingSubmission {
  const text = patch.text ?? "Ich schreibe einen Text über meinen Tag in Berlin.";
  return {
    id,
    taskId: "a1-01-writing",
    text,
    wordCount: text.split(/\s+/u).length,
    version: 1,
    status,
    feedback: [],
    createdAt,
    updatedAt: createdAt,
    ...patch,
  };
}

function stateWith(submissions: WritingSubmission[]): LearningState {
  return { ...defaultState, writingSubmissions: submissions };
}

const now = new Date("2026-10-04T12:00:00.000Z"); // Saturday of the week 2026-09-28 … 2026-10-04
const bounds = weekBounds(now);

describe("weekly writing cycle (P1-14)", () => {
  it("runs Monday to Sunday and measures the shipped window", () => {
    expect(bounds.weekStart).toBe("2026-09-28");
    expect(bounds.weekEnd).toBe("2026-10-04");
    const cycle = weeklyWritingCycle(defaultState, now);
    expect(cycle.weeks).toHaveLength(WEEKLY_WRITING_WINDOW_WEEKS);
    expect(cycle.policyVersion).toBe(WEEKLY_WRITING_POLICY);
    expect(cycle.boundary).toBe(WEEKLY_WRITING_BOUNDARY);
    expect(cycle.weeks[0].weekStart).toBe("2026-08-10");
    expect(cycle.weeks.at(-1)!.weekStart).toBe(bounds.weekStart);
  });

  it("never completes a week on a draft or on a submitted first version alone", () => {
    const draftOnly = weeklyWritingCycle(stateWith([submission("s1", "2026-09-30T09:00:00.000Z", "draft")]), now);
    expect(draftOnly.current.status).toBe("draft-only");
    expect(draftOnly.completedWeeks).toBe(0);

    const submitted = weeklyWritingCycle(stateWith([submission("s1", "2026-09-30T09:00:00.000Z", "submitted")]), now);
    expect(submitted.current.status).toBe("awaiting-rewrite");
    expect(submitted.current.nextActionAr).toContain("أعد الكتابة إلزاميًّا");
    expect(submitted.completedWeeks).toBe(0);
  });

  it("accepts a revised version only when it actually differs from its source", () => {
    const identical = weeklyWritingCycle(
      stateWith([
        submission("s1", "2026-09-30T09:00:00.000Z", "submitted"),
        submission("s2", "2026-10-01T09:00:00.000Z", "revised", { version: 2, sourceVersion: 1, text: "Ich schreibe einen Text über meinen Tag in Berlin." }),
      ]),
      now,
    );
    expect(identical.current.revisionChangedText).toBe(false);
    expect(identical.current.status).toBe("awaiting-rewrite");
    expect(identical.completedWeeks).toBe(0);

    const changed = weeklyWritingCycle(
      stateWith([
        submission("s1", "2026-09-30T09:00:00.000Z", "submitted"),
        submission("s2", "2026-10-01T09:00:00.000Z", "revised", { version: 2, sourceVersion: 1, text: "Jeden Morgen fahre ich mit der U-Bahn zur Arbeit, deshalb stehe ich früh auf." }),
      ]),
      now,
    );
    expect(changed.current.revisionChangedText).toBe(true);
    expect(changed.current.status).toBe("cycle-complete");
    expect(changed.completedWeeks).toBe(1);
    expect(changed.currentStreak).toBe(1);
    expect(changed.longestGapDays).toBe(0);
  });

  it("counts an honest zero on the shipped state and reports the boundary in Arabic", () => {
    const cycle = weeklyWritingCycle(defaultState, now);
    expect(cycle.completedWeeks).toBe(0);
    expect(cycle.current.status).toBe("not-started");
    expect(cycle.current.nextActionAr).toContain("اكتب المسودة الأولى");
    expect(cycle.boundaryAr).toContain("لا درجة كتابة");
    expect(cycle.boundaryAr).toContain("النسخة المطابقة لأصلها لا تُعدّ إعادة كتابة");
    expect(weeklyWritingStatusLabel("cycle-complete")).toBe("دورة مكتملة");
  });

  it("is wired into the plan gate, the writing page and the generated report", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.prebuild).toContain("writing:cycle");
    expect(pkg.scripts["writing:cycle:write"]).toContain("audit-weekly-writing");
    const page = readFileSync("src/components/writing-page-client.tsx", "utf8");
    expect(page).toContain("<WeeklyWritingCyclePanel/>");
    const panel = readFileSync("src/components/weekly-writing-cycle-panel.tsx", "utf8");
    expect(panel).toContain("data-weekly-writing-policy={WEEKLY_WRITING_POLICY}");
    expect(panel).toContain("data-weekly-writing-status={status}");
    expect(panel).toContain("إعادة كتابة إلزامية");
    const report = JSON.parse(readFileSync("reports/weekly-writing-cycle.json", "utf8")) as { ok: boolean; completedWeeks: number; weeksMeasured: number; currentStatus: string };
    expect(report.ok).toBe(true);
    expect(report.completedWeeks).toBe(0);
    expect(report.weeksMeasured).toBe(WEEKLY_WRITING_WINDOW_WEEKS);
    expect(report.currentStatus).toBe("not-started");
  });
});
