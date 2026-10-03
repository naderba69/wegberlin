// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { localSessionDate, studyDayKey } from "@/core/coach/session-signals";
import { localCalendarDate } from "@/core/coach/continuity";

/**
 * يوم الدراسة مفتاحٌ واحد (ADR-106 · م4 من تدقيق 2026-10-03): ما يكتبه الإنهاء وما تقرأه
 * الاستمرارية والراحة والحصّة. قبل الإصلاح كان الكِتابة بتوقيت UTC والقراءة بتوقيت المتعلم،
 * فتُحسَب مذاكرة ما بين 00:00 و00:59 محليًّا في اليوم السابق.
 */
describe("study day key is the learner's local day", () => {
  it("follows local calendar fields, not the UTC slice", () => {
    const localMidnightJustAfter = new Date(2026, 9, 4, 0, 30, 0);
    expect(studyDayKey(localMidnightJustAfter)).toBe("2026-10-04");
    expect(studyDayKey(localMidnightJustAfter)).toBe(localSessionDate(localMidnightJustAfter));
    expect(studyDayKey(localMidnightJustAfter)).toBe(localCalendarDate(localMidnightJustAfter));
    // The same instant belongs to the previous UTC day exactly when the learner is east of
    // UTC (Tunis: UTC+1). Both branches are asserted, so no zone silently skips the check.
    const minutesEastOfUtc = -localMidnightJustAfter.getTimezoneOffset();
    if (minutesEastOfUtc > 0) {
      expect(localMidnightJustAfter.toISOString().slice(0, 10)).toBe("2026-10-03");
    } else {
      expect(localMidnightJustAfter.toISOString().slice(0, 10)).toBe("2026-10-04");
    }
  });

  it("is used by every writer of studyHistory instead of an ad-hoc UTC slice", async () => {
    const writers = [
      "src/components/lesson-runner.tsx",
      "src/components/module-review.tsx",
      "src/components/mediation-lab.tsx",
      "src/components/speaking-lab.tsx",
      "src/components/writing-lab.tsx",
      "src/components/level-assessment.tsx",
      "src/components/error-notebook.tsx",
      "src/components/full-exam-simulation.tsx",
      "src/components/targeted-choice-simulation.tsx",
      "src/components/targeted-exam-simulation.tsx",
      "src/components/targeted-listening-simulation.tsx",
      "src/components/targeted-speaking-simulation.tsx",
      "src/components/information-gap-lab.tsx",
    ];
    for (const file of writers) {
      const source = await readFile(file, "utf8");
      const sites = [...source.matchAll(/studyHistory/gu)].map((match) => source.slice(match.index, match.index + 260));
      if (sites.length === 0) continue;
      expect(sites.join("\n"), `${file} must book study days with the shared local key`).toContain("studyDayKey");
      for (const site of sites) {
        expect(site, `${file} must not book a study day from a UTC slice`).not.toMatch(/toISOString\(\)\.slice\(\s*0,\s*10\s*\)/u);
      }
    }
  });
});
