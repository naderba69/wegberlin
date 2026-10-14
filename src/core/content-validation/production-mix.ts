import { academicLessons } from "@/data/academic-lessons";
import type { FullLesson } from "@/types/lesson-content";

/**
 * ميزان الإنتاج مقابل الاسترجاع المغلقة.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البند P0-1 بعد تصحيح الأرقام): الادعاء الأول
 * كان «12% إنتاج» وهو خطأ قراءة؛ القياس الفعلي من البيانات: 1,346 عنصرًا مغلقًا مقابل
 * 387 تمرينًا مبنيًّا (22.3%)، و3 كتل إنتاج لكل درس (كتابة/محادثة/وساطة) = 288 كتلة.
 * فهذه الوحدة تثبّت النسبة الحقيقية كأرضية مانعة للتراجع، وتقيس **كم درسًا يحمل مهمة
 * إنتاج كاملة** (مطالبة + معيار/قائمة تحقّق + نموذج)، وهي المقاييس التي طلبها البند.
 */
export const PRODUCTION_MIX_POLICY = "production-mix-v1" as const;
export const PRODUCTION_MIX_BOUNDARY = "ratio-and-task-presence-audit-no-quality-judgement-no-cefr-claim" as const;
export const PRODUCTION_MIX_FLOORS = {
  minConstructedSharePct: 20,
  minProductionBlocks: 288,
  minLessonsWithFullWritingTask: 96,
  minLessonsWithMediation: 96,
} as const;

export type ProductionMixRow = {
  lessonId: string;
  level: FullLesson["level"];
  closed: number;
  constructed: number;
  writing: boolean;
  writingHasChecklist: boolean;
  writingHasModel: boolean;
  speaking: boolean;
  mediation: boolean;
  fullProductionTask: boolean;
};

export type ProductionMixAudit = {
  policyVersion: typeof PRODUCTION_MIX_POLICY;
  boundary: typeof PRODUCTION_MIX_BOUNDARY;
  ok: boolean;
  lessons: number;
  closed: number;
  constructed: number;
  constructedSharePct: number;
  productionBlocks: number;
  lessonsWithFullWritingTask: number;
  lessonsWithMediation: number;
  byLevel: Record<string, { lessons: number; closed: number; constructed: number; constructedSharePct: number }>;
  rows: ProductionMixRow[];
  issues: string[];
};

const CLOSED_TYPES = new Set(["multiple-choice", "matching"]);

export function buildProductionMixAudit(lessons: readonly FullLesson[] = Object.values(academicLessons)): ProductionMixAudit {
  const rows: ProductionMixRow[] = [];
  let closed = 0;
  let constructed = 0;
  let productionBlocks = 0;
  const byLevel: ProductionMixAudit["byLevel"] = {};

  for (const lesson of lessons) {
    const exercises = lesson.exercises ?? [];
    const lessonClosed = exercises.filter((exercise) => CLOSED_TYPES.has(exercise.type)).length
      + (lesson.reading?.questions?.length ?? 0)
      + (lesson.listening?.questions?.length ?? 0)
      + (lesson.miniTest?.length ?? 0);
    const lessonConstructed = exercises.filter((exercise) => !CLOSED_TYPES.has(exercise.type)).length;
    const writingHasChecklist = Boolean(lesson.writing?.checklistAr?.length);
    const writingHasModel = Boolean(lesson.writing?.modelDe?.trim());
    const writing = Boolean(lesson.writing?.promptDe?.trim() && lesson.writing?.promptAr?.trim());
    const speaking = Boolean(lesson.speaking?.promptDe?.trim());
    const mediation = Boolean(lesson.mediation?.taskAr?.trim());
    const blocks = [writing, speaking, mediation].filter(Boolean).length;
    closed += lessonClosed;
    constructed += lessonConstructed;
    productionBlocks += blocks;
    rows.push({
      lessonId: lesson.id,
      level: lesson.level,
      closed: lessonClosed,
      constructed: lessonConstructed,
      writing,
      writingHasChecklist,
      writingHasModel,
      speaking,
      mediation,
      fullProductionTask: writing && writingHasChecklist && writingHasModel,
    });
    const level = byLevel[lesson.level] ?? { lessons: 0, closed: 0, constructed: 0, constructedSharePct: 0 };
    level.lessons += 1;
    level.closed += lessonClosed;
    level.constructed += lessonConstructed;
    byLevel[lesson.level] = level;
  }

  for (const level of Object.values(byLevel)) {
    level.constructedSharePct = level.closed + level.constructed ? Math.round((level.constructed / (level.closed + level.constructed)) * 1000) / 10 : 0;
  }

  const practiceItems = closed + constructed;
  const constructedSharePct = practiceItems ? Math.round((constructed / practiceItems) * 1000) / 10 : 0;
  const lessonsWithFullWritingTask = rows.filter((row) => row.fullProductionTask).length;
  const lessonsWithMediation = rows.filter((row) => row.mediation).length;

  const issues: string[] = [];
  if (constructedSharePct < PRODUCTION_MIX_FLOORS.minConstructedSharePct) issues.push(`نسبة التمارين المبنيّة ${constructedSharePct}% تحت الأرضية ${PRODUCTION_MIX_FLOORS.minConstructedSharePct}%`);
  if (productionBlocks < PRODUCTION_MIX_FLOORS.minProductionBlocks) issues.push(`كتل الإنتاج ${productionBlocks} تحت الأرضية ${PRODUCTION_MIX_FLOORS.minProductionBlocks}`);
  if (lessonsWithFullWritingTask < PRODUCTION_MIX_FLOORS.minLessonsWithFullWritingTask) issues.push(`${lessonsWithFullWritingTask} درسًا فقط بمهمة كتابة كاملة (مطالبة + قائمة تحقّق + نموذج)`);
  if (lessonsWithMediation < PRODUCTION_MIX_FLOORS.minLessonsWithMediation) issues.push(`${lessonsWithMediation} درسًا فقط بمهمة وساطة`);

  return {
    policyVersion: PRODUCTION_MIX_POLICY,
    boundary: PRODUCTION_MIX_BOUNDARY,
    ok: issues.length === 0,
    lessons: rows.length,
    closed,
    constructed,
    constructedSharePct,
    productionBlocks,
    lessonsWithFullWritingTask,
    lessonsWithMediation,
    byLevel,
    rows,
    issues,
  };
}
