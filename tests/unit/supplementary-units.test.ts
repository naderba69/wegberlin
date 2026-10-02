import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { cefrGoalLinks } from "@/data/cefr-goal-links";
import { cefrGoalInventory } from "@/core/content-validation/cefr-goal-inventory";
import {
  SUPPLEMENTARY_UNIT_BOUNDARY_AR,
  SUPPLEMENTARY_UNIT_ITEM_BUDGET,
  SUPPLEMENTARY_UNIT_MAX_GOALS,
  SUPPLEMENTARY_UNIT_POLICY,
  SUPPLEMENTARY_UNIT_PREFIX,
  SUPPLEMENTARY_UNIT_STAGE_COUNT,
  SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR,
  SupplementaryUnitGuardError,
  applyAuthoredGoalClosure,
  assertSupplementaryUnitId,
  buildGoalCoverage,
  coverageAfterPlan,
  goalCoverageSummary,
  planSupplementaryUnits,
} from "@/core/content-validation/supplementary-units";

const coverage = buildGoalCoverage();
const proposals = planSupplementaryUnits(coverage);

describe("supplementary units — فجوات الأهداف تُسدّ بوحدة مكمّلة لا بحشو درس قائم (P2-96)", () => {
  it("derives coverage from frozen, level-scoped evidence — never from a claim", () => {
    const lessonIds = new Set(academicLessonList.map((lesson) => lesson.id));
    const lessonLevel = new Map(academicLessonList.map((lesson) => [lesson.id, lesson.level] as const));
    for (const goal of cefrGoalInventory) {
      const evidence = cefrGoalLinks[goal.goalId] ?? [];
      for (const item of evidence) {
        expect(lessonIds.has(item.lessonId), item.lessonId).toBe(true);
        // التغطية مقيَّدة بالمستوى: الدليل من درس بنفس مستوى الهدف.
        expect(lessonLevel.get(item.lessonId), item.lessonId).toBe(goal.level);
        expect(item.matchedKeyword.length).toBeGreaterThan(2);
        expect(["de", "ar"]).toContain(item.matchedIn);
      }
    }
    // ولا صلة لهدفٍ غير موجود في الجرد (لا صفوف يتيمة).
    for (const goalId of Object.keys(cefrGoalLinks)) {
      expect(cefrGoalInventory.some((goal) => goal.goalId === goalId), goalId).toBe(true);
    }
  });

  it("classifies every inventory goal as covered or an explicit gap", () => {
    expect(coverage.length).toBe(cefrGoalInventory.length);
    for (const row of coverage) {
      expect(["covered", "gap"]).toContain(row.status);
      if (row.status === "covered") expect(row.evidence.length).toBeGreaterThan(0);
      else expect(row.evidence.length).toBe(0);
    }
    const summary = goalCoverageSummary(coverage);
    expect(summary.goals).toBe(coverage.length);
    expect(summary.covered + summary.gaps).toBe(summary.goals);
    expect(summary.byLevel.map((row) => row.total)).toEqual([8, 8, 8, 8]);
    expect(summary.byLevel.reduce((sum, row) => sum + row.covered + row.gaps, 0)).toBe(summary.goals);
  });

  it("refuses to turn an existing lesson into a supplementary unit (no stuffing)", () => {
    const existingLessonId = academicLessonList[0].id;
    expect(() => assertSupplementaryUnitId(existingLessonId)).toThrowError(SupplementaryUnitGuardError);
    expect(() => assertSupplementaryUnitId(existingLessonId)).toThrowError(SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR);
    expect(() => assertSupplementaryUnitId("a1-01-supp")).toThrow();
    expect(assertSupplementaryUnitId("supp-a1-u1-v1")).toBe("supp-a1-u1-v1");
    // وكل وحدة مُخطَّطة تمرّ من الحارس نفسه.
    for (const proposal of proposals) expect(proposal.unitId.startsWith(SUPPLEMENTARY_UNIT_PREFIX)).toBe(true);
  });

  it("plans bounded units only for the measured gaps — one goal set per unit, max three", () => {
    const gapIds = coverage.filter((row) => row.status === "gap").map((row) => row.goalId);
    const plannedIds = proposals.flatMap((proposal) => proposal.closesGoalIds);
    expect([...plannedIds].sort()).toEqual([...gapIds].sort());
    for (const proposal of proposals) {
      expect(proposal.closesGoalIds.length).toBeGreaterThan(0);
      expect(proposal.closesGoalIds.length).toBeLessThanOrEqual(SUPPLEMENTARY_UNIT_MAX_GOALS);
      expect(proposal.stageCount).toBe(SUPPLEMENTARY_UNIT_STAGE_COUNT);
      expect(proposal.status).toBe("planned");
      expect(proposal.authoredContent).toBe(false);
      expect(proposal.policyVersion).toBe(SUPPLEMENTARY_UNIT_POLICY);
      expect(proposal.titleAr).toContain(proposal.level);
      // أهداف الوحدة من مستوى الوحدة نفسه.
      for (const goalId of proposal.closesGoalIds) {
        const goal = cefrGoalInventory.find((entry) => entry.goalId === goalId)!;
        expect(goal.level).toBe(proposal.level);
      }
    }
    // لا وحدة لهدفٍ مغطّى.
    const coveredIds = new Set(coverage.filter((row) => row.status === "covered").map((row) => row.goalId));
    for (const goalId of plannedIds) expect(coveredIds.has(goalId)).toBe(false);
  });

  it("never moves the coverage number by planning alone", () => {
    const summary = goalCoverageSummary(coverage);
    const afterPlan = coverageAfterPlan(coverage, proposals);
    expect(afterPlan.units).toBe(proposals.length);
    expect(afterPlan.goalsPlannedForClosure).toBe(summary.gaps);
    expect(afterPlan.gapsAfterPlanAreStillGaps).toBe(summary.gaps);
    expect(afterPlan.coveredBefore).toBe(summary.covered);
    expect(SUPPLEMENTARY_UNIT_BOUNDARY_AR).toContain("بمجرّد التخطيط");
  });

  it("changes coverage only when real evidence is authored — closure is applied, not assumed", () => {
    const gapped = coverage.find((row) => row.status === "gap")!;
    const witness = { lessonId: "supp-a1-u1-v1", objectiveIndex: 0, matchedKeyword: "دليل مكتوب", matchedIn: "ar" as const };
    const closed = applyAuthoredGoalClosure(coverage, { [gapped.goalId]: [witness] });
    const closedRow = closed.find((row) => row.goalId === gapped.goalId)!;
    expect(closedRow.status).toBe("covered");
    expect(closedRow.evidence).toEqual([witness]);
    // وما لا دليل له يبقى فجوة كما هو.
    const otherGap = coverage.find((row) => row.status === "gap" && row.goalId !== gapped.goalId)!;
    expect(closed.find((row) => row.goalId === otherGap.goalId)!.status).toBe("gap");
    // ولا نسيء إلى المغطّى أصلًا.
    const covered = coverage.find((row) => row.status === "covered")!;
    expect(closed.find((row) => row.goalId === covered.goalId)!.evidence).toEqual(covered.evidence);
  });

  it("is a read-only cycle: it adds no state field and touches no storage", async () => {
    const source = await import("node:fs").then((fs) => fs.readFileSync("src/core/content-validation/supplementary-units.ts", "utf8"));
    expect(source).not.toMatch(/\bfetch\(|localStorage|indexedDB|getItem\(/);
    // الوحدة لا تعدّل أي درس منشور: لا استيراد لدروسٍ عدا عدّ المعرّفات.
    expect(source).toContain("academicLessonList");
    const stateKeys = Object.keys((await import("@/core/portability/db")).defaultState);
    expect(stateKeys.some((key) => key.includes("supplementary"))).toBe(false);
  });

  it("keeps the budget and policy literals pinned", () => {
    expect(SUPPLEMENTARY_UNIT_ITEM_BUDGET).toEqual({
      readingQuestions: 4,
      listeningQuestions: 4,
      exercises: 6,
      miniTest: 5,
      writingTasks: 1,
      speakingTasks: 1,
    });
    expect(SUPPLEMENTARY_UNIT_STAGE_COUNT).toBe(14);
    expect(SUPPLEMENTARY_UNIT_MAX_GOALS).toBe(3);
    expect(SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR).toContain("supp-");
    expect(SUPPLEMENTARY_UNIT_BOUNDARY_AR).toContain("ولا ادّعاء أن الهدف صار معلَّمًا");
  });

  it("reports the measured truth of the shipped tree without rounding up", () => {
    const summary = goalCoverageSummary(coverage);
    // أرقامٌ مقيسة على هذه الشجرة: 32 هدفًا في الجرد، والفجوات تُعلَن كما هي (لا تُخفى ولا تُجمَّل).
    expect(summary.goals).toBe(32);
    expect(summary.covered + summary.gaps).toBe(32);
    expect(summary.evidenceRows).toBeGreaterThan(0);
    expect(coverage.filter((row) => row.status === "gap").length).toBe(summary.gaps);
  });
});
