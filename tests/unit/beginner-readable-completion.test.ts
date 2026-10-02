import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { lessonEvidenceGate } from "@/core/lessons/evidence-gate";
import { BEGINNER_READABLE_COMPLETION_POLICY, lessonCompletionGuidance, nextLessonCompletionGuidance } from "@/core/lessons/completion-guidance";

const criteria = lessonEvidenceGate(academicLessons["a1-01"], defaultState).criteria;

describe("beginner-readable lesson completion", () => {
  it("uses learner-facing labels instead of evidence jargon", () => {
    expect(BEGINNER_READABLE_COMPLETION_POLICY).toBe("beginner-readable-completion-v1");
    expect(criteria.map((criterion) => criterion.labelAr)).toEqual([
      "التمارين الأساسية",
      "فهم القراءة",
      "فهم الاستماع",
      "الاختبار القصير",
    ]);
  });

  it("explains reading and listening as one concrete action", () => {
    const reading = lessonCompletionGuidance(criteria.find((criterion) => criterion.id === "reading")!);
    const listening = lessonCompletionGuidance(criteria.find((criterion) => criterion.id === "listening")!);
    expect(reading.actionAr).toBe("ابدأ تمرين القراءة");
    expect(reading.detailAr).toContain("ويكفي إنجاز واحد");
    expect(listening.actionAr).toBe("ابدأ تمرين الاستماع");
    expect(listening.detailAr).toContain("استمع إلى مقطع قصير");
  });

  it("selects one next action and never exposes raw achieved/required notation", () => {
    const next = nextLessonCompletionGuidance(criteria);
    expect(next?.criterionId).toBe("controlled");
    expect(next?.detailAr).not.toMatch(/0\s*\/\s*1/u);
    expect(next?.remaining).toBe(criteria[0].required);
  });

  it("turns completed criteria into a simple success state", () => {
    const completed = lessonCompletionGuidance({ ...criteria[1], achieved: 1, passed: true });
    expect(completed.statusAr).toBe("مكتمل");
    expect(completed.remaining).toBe(0);
  });
});
