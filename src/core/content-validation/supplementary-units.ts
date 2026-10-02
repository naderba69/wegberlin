import { academicLessonList } from "@/data/academic-lessons";
import { cefrGoalLinks, type CefrGoalLinkEvidence } from "@/data/cefr-goal-links";
import {
  CEFR_GOAL_CLAIM_BOUNDARY_AR,
  CEFR_GOAL_INVENTORY_POLICY,
  cefrGoalInventory,
  type CefrGoal,
} from "@/core/content-validation/cefr-goal-inventory";

/**
 * دورة الوحدات المكمّلة (P2-96، ADR-093).
 *
 * القاعدة التي جاء بها البند: إذا وُجد هدفٌ في المستوى **غير مغطّى** بدروسنا، تُضاف
 * **وحدة مكمّلة** له — ولا يُحشى الهدف في درسٍ قائم. هذا الملف يُنفّذ القاعدة في
 * دالتين مُختبَرتين:
 *
 *  1. `assertSupplementaryUnitId` يرفض أي وحدة ليست `supp-…` (أي محاولة جعل الدرس
 *     القائم وحدةً مكمّلة)، برسالة عربية صريحة.
 *  2. `planSupplementaryUnits` تُخرج مقترحاتٍ **مخطَّطة** لا محتوىً منسوجًا: لكل وحدة
 *     أهدافها المرتبطة، وعدد البنود المطلوبة في كل مرحلة، وبصمة الإطار. الحالة
 *     `planned` صريحة: التغطية **لا** تتغيّر بمجرّد التخطيط، فلا ندّعي سدًّا لم يُكتب.
 *
 * والقياس نفسه مقيَّد بالمستوى وبالدليل: `cefrGoalLinks` ملفٌ مؤلَّف مجمَّد يحمل لكل
 * صلة دليلها (الدرس + فهرس الهدف + الكلمة المطابقة). هدف بلا دليل = فجوة معلنة،
 * لا «موجود في مكان ما».
 */

export const SUPPLEMENTARY_UNIT_POLICY = "gap-driven-supplementary-unit-v1" as const;
export const SUPPLEMENTARY_UNIT_PREFIX = "supp-" as const;

/** الإطار الملزم للوحدة المكمّلة: 14 مرحلة كما في الدروس المنشورة. */
export const SUPPLEMENTARY_UNIT_STAGE_COUNT = 14 as const;

/** أقصى أهداف في الوحدة المكمّلة الواحدة — كي لا تتحوّل إلى «دفعة كبرى» بلا معنى. */
export const SUPPLEMENTARY_UNIT_MAX_GOALS = 3 as const;

/** البنود المطلوبة في كل محور تدريبيّ للوحدة المكمّلة. */
export const SUPPLEMENTARY_UNIT_ITEM_BUDGET = {
  readingQuestions: 4,
  listeningQuestions: 4,
  exercises: 6,
  miniTest: 5,
  writingTasks: 1,
  speakingTasks: 1,
} as const;

export const SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR =
  "رُفض الحشو: هدفٌ غير مغطّى لا يُضاف إلى درسٍ قائم؛ الطريق الوحيد هو وحدة مكمّلة بمعرّف يبدأ بـ«supp-».";

export const SUPPLEMENTARY_UNIT_BOUNDARY_AR =
  "مقترحات تخطيط فقط: لا محتوى درس منسوج آليًا، ولا تغيير في عدّادات التغطية بمجرّد التخطيط، ولا ادّعاء أن الهدف صار معلَّمًا. التغطية تتغيّر فقط حين تُكتب الوحدة فعلًا وتُقاس.";

export class SupplementaryUnitGuardError extends Error {}

const lessonIds = new Set(academicLessonList.map((lesson) => lesson.id));

/** رفض الحشو: أي محاولة لتسمية درسٍ قائم «وحدةً مكمّلة» تفشل بصوت عالٍ. */
export function assertSupplementaryUnitId(unitId: string): string {
  if (!unitId.startsWith(SUPPLEMENTARY_UNIT_PREFIX)) {
    throw new SupplementaryUnitGuardError(SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR);
  }
  if (lessonIds.has(unitId)) {
    throw new SupplementaryUnitGuardError(SUPPLEMENTARY_UNIT_STUFFING_REFUSAL_AR);
  }
  return unitId;
}

export type GoalCoverageRow = {
  goalId: string;
  level: CefrGoal["level"];
  skill: CefrGoal["skill"];
  canDoAr: string;
  canDoDe: string;
  evidence: readonly CefrGoalLinkEvidence[];
  status: "covered" | "gap";
  /** أساس القياس: صلة بكلمة معلنة داخل هدف درس بالمستوى نفسه. */
  mappingBasis: "level-scoped-keyword-evidence-v1";
};

export function buildGoalCoverage(): GoalCoverageRow[] {
  return cefrGoalInventory.map((goal) => {
    const evidence = cefrGoalLinks[goal.goalId] ?? [];
    return {
      goalId: goal.goalId,
      level: goal.level,
      skill: goal.skill,
      canDoAr: goal.canDoAr,
      canDoDe: goal.canDoDe,
      evidence,
      status: evidence.length > 0 ? "covered" : "gap",
      mappingBasis: "level-scoped-keyword-evidence-v1",
    };
  });
}

export type SupplementaryUnitProposal = {
  unitId: string;
  policyVersion: typeof SUPPLEMENTARY_UNIT_POLICY;
  level: CefrGoal["level"];
  /** أهداف المستوى غير المغطّاة التي تخطّط هذه الوحدة لسدّها. */
  closesGoalIds: string[];
  titleDe: string;
  titleAr: string;
  status: "planned";
  stageCount: typeof SUPPLEMENTARY_UNIT_STAGE_COUNT;
  itemBudget: typeof SUPPLEMENTARY_UNIT_ITEM_BUDGET;
  /** لا محتوى: بنية التخطيط فقط. */
  authoredContent: false;
};

function unitTitle(level: string, goals: GoalCoverageRow[]) {
  const skills = [...new Set(goals.map((goal) => goal.skill))];
  const skillAr: Record<string, string> = {
    listening: "استماع",
    reading: "قراءة",
    writing: "كتابة",
    speaking: "كلام",
    mediation: "وساطة",
  };
  const skillDe: Record<string, string> = {
    listening: "Hören",
    reading: "Lesen",
    writing: "Schreiben",
    speaking: "Sprechen",
    mediation: "Sprachmittlung",
  };
  return {
    titleAr: `وحدة مكمّلة ${level}: ${skills.map((skill) => skillAr[skill]).join(" + ")}`,
    titleDe: `Ergänzungseinheit ${level}: ${skills.map((skill) => skillDe[skill]).join(" + ")}`,
  };
}

/**
 * خطة الوحدات: تجميع الفجوات في وحداتٍ لا تتجاوز 3 أهداف، بترتيب المستوى ثم الهدف.
 * لا تُنشئ محتوى، ولا تُغيّر حالة أي هدف: التخطيط ليس سدًّا.
 */
export function planSupplementaryUnits(coverage: GoalCoverageRow[]): SupplementaryUnitProposal[] {
  const gapsByLevel = new Map<string, GoalCoverageRow[]>();
  for (const row of coverage) {
    if (row.status !== "gap") continue;
    const list = gapsByLevel.get(row.level) ?? [];
    list.push(row);
    gapsByLevel.set(row.level, list);
  }
  const proposals: SupplementaryUnitProposal[] = [];
  for (const level of ["A1", "A2", "B1", "B2"] as const) {
    const gaps = gapsByLevel.get(level) ?? [];
    for (let index = 0; index < gaps.length; index += SUPPLEMENTARY_UNIT_MAX_GOALS) {
      const slice = gaps.slice(index, index + SUPPLEMENTARY_UNIT_MAX_GOALS);
      const unitId = `${SUPPLEMENTARY_UNIT_PREFIX}${level.toLowerCase()}-u${Math.floor(index / SUPPLEMENTARY_UNIT_MAX_GOALS) + 1}-v1`;
      assertSupplementaryUnitId(unitId);
      const title = unitTitle(level, slice);
      proposals.push({
        unitId,
        policyVersion: SUPPLEMENTARY_UNIT_POLICY,
        level,
        closesGoalIds: slice.map((row) => row.goalId),
        titleAr: title.titleAr,
        titleDe: title.titleDe,
        status: "planned",
        stageCount: SUPPLEMENTARY_UNIT_STAGE_COUNT,
        itemBudget: SUPPLEMENTARY_UNIT_ITEM_BUDGET,
        authoredContent: false,
      });
    }
  }
  return proposals;
}

export type CoverageAfterPlan = {
  coveredBefore: number;
  gapsBefore: number;
  /** الخطة المعلنة: أهدافٌ ستُغطّى **لو** كُتبت الوحدات. ليست تغطية. */
  goalsPlannedForClosure: number;
  gapsAfterPlanAreStillGaps: number;
  units: number;
};

/**
 * إعادة القياس بعد التخطيط: تُظهر أن التغطية **لم تتغيّر**، وأن الخطة وحدها لا تسدّ.
 * هذا هو الحاجز ضدّ التجميل: الرقم لا يتحرّك بالتخطيط.
 */
export function coverageAfterPlan(coverage: GoalCoverageRow[], proposals: SupplementaryUnitProposal[]): CoverageAfterPlan {
  const coveredBefore = coverage.filter((row) => row.status === "covered").length;
  const goalsPlannedForClosure = proposals.reduce((sum, proposal) => sum + proposal.closesGoalIds.length, 0);
  const gapRows = coverage.filter((row) => row.status === "gap");
  return {
    coveredBefore,
    gapsBefore: gapRows.length,
    goalsPlannedForClosure,
    gapsAfterPlanAreStillGaps: gapRows.length,
    units: proposals.length,
  };
}

/** إغلاق **بعد كتابة محتوى حقيقي فقط**: يُستدعى بمعرّفات أهدافٍ صارت مغطّاة بأدلة. */
export function applyAuthoredGoalClosure(
  coverage: GoalCoverageRow[],
  links: Record<string, readonly CefrGoalLinkEvidence[]>,
): GoalCoverageRow[] {
  return coverage.map((row) => {
    const evidence = links[row.goalId] ?? row.evidence;
    return evidence.length > 0 ? { ...row, evidence, status: "covered" as const } : row;
  });
}

export function goalCoverageSummary(coverage: GoalCoverageRow[]) {
  const byLevel = ["A1", "A2", "B1", "B2"].map((level) => {
    const rows = coverage.filter((row) => row.level === level);
    return {
      level,
      covered: rows.filter((row) => row.status === "covered").length,
      gaps: rows.filter((row) => row.status === "gap").length,
      total: rows.length,
    };
  });
  return {
    goals: coverage.length,
    covered: coverage.filter((row) => row.status === "covered").length,
    gaps: coverage.filter((row) => row.status === "gap").length,
    evidenceRows: coverage.reduce((sum, row) => sum + row.evidence.length, 0),
    byLevel,
    policy: CEFR_GOAL_INVENTORY_POLICY,
  };
}

/** إعادة تصدير حدّ الادّعاء كي تعرضه أي واجهة من مصدر واحد. */
export const SUPPLEMENTARY_UNIT_CLAIM_BOUNDARY_AR = CEFR_GOAL_CLAIM_BOUNDARY_AR;
