/**
 * مسبار P2-96: يقيس تغطية أهداف المستوى والفجوات وخطة الوحدات المكمّلة.
 * التشغيل: npx tsx docs/run-logs/2026-09-28-supplementary-units/measure.ts
 *
 * لا شبكة ولا توليد محتوى: كل الأرقام من الجرد المؤلَّف وصلاته المؤلَّفة المجمَّدة.
 */
import { cefrGoalInventory } from "@/core/content-validation/cefr-goal-inventory";
import { cefrGoalLinks } from "@/data/cefr-goal-links";
import {
  SupplementaryUnitGuardError,
  assertSupplementaryUnitId,
  buildGoalCoverage,
  coverageAfterPlan,
  goalCoverageSummary,
  planSupplementaryUnits,
} from "@/core/content-validation/supplementary-units";
import { academicLessonList } from "@/data/academic-lessons";

const coverage = buildGoalCoverage();
const proposals = planSupplementaryUnits(coverage);
const summary = goalCoverageSummary(coverage);
const afterPlan = coverageAfterPlan(coverage, proposals);

console.log("inventory goals:", cefrGoalInventory.length, "(unofficial-paraphrase)");
console.log("published lessons scanned:", academicLessonList.length);
console.log("goal→lesson evidence rows:", summary.evidenceRows);
console.log("covered:", summary.covered, "· gaps:", summary.gaps, "(level-scoped)");
console.log("per level:", summary.byLevel.map((row) => `${row.level} ${row.covered}/${row.total} (gaps ${row.gaps})`).join(" · "));
console.log("planned units:", afterPlan.units, "· goals planned for closure:", afterPlan.goalsPlannedForClosure);
console.log("coverage after plan: covered", afterPlan.coveredBefore, "→ gaps", afterPlan.gapsAfterPlanAreStillGaps, "(must not move)");
console.log("schemas of links per goal:", Object.keys(cefrGoalLinks).length, "of", cefrGoalInventory.length);
console.log("first unit:", proposals[0]?.unitId, "·", proposals[0]?.titleAr, "· budget reading", proposals[0]?.itemBudget.readingQuestions);
try {
  assertSupplementaryUnitId("a1-01");
  console.log("stuffing guard: NOT ENFORCED (wrong)");
} catch (error) {
  console.log("stuffing guard on an existing lesson:", error instanceof SupplementaryUnitGuardError ? "refused as expected" : "unexpected error");
}
console.log("one sample covered goal evidence:", JSON.stringify((Object.entries(cefrGoalLinks) as Array<[string, readonly unknown[]]>).find(([, rows]) => rows.length > 0)?.[0] ?? null));
