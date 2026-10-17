import { academicLessonList } from "@/data/academic-lessons";
import { OBJECTIVE_ITEM_ALIGNMENT } from "@/data/objective-item-alignment";
import { LESSON_STAGE_KEYS } from "@/types/lesson-content";
import type { FullLesson } from "@/types/lesson-content";

export type ObjectiveCoverageDimension = "taught" | "practiced" | "assessed";

export type ObjectiveCoverageRow = {
  objectiveId: string;
  lessonId: string;
  level: string;
  module: number;
  canDoDe: string;
  canDoAr: string;
  taughtIn: string[];
  practicedIn: string[];
  assessedIn: string[];
  status: "covered" | "gap";
  missing: ObjectiveCoverageDimension[];
  mappingBasis: "authored-item-alignment";
  semanticReviewStatus: "agent-authored-under-owner-delegation";
};

export type UnalignedSurface = { lessonId: string; surfaceId: string; dimension: ObjectiveCoverageDimension };

type Surface = { key: string; surfaceId: string; dimension: ObjectiveCoverageDimension; required: boolean };

/** Every surface of a lesson that the authored alignment must account for (discovery is optional). */
export function alignmentSurfaces(lesson: FullLesson): Surface[] {
  const item = (id: string, dimension: ObjectiveCoverageDimension): Surface => ({ key: id.startsWith(`${lesson.id}-`) ? id.slice(lesson.id.length + 1) : id, surfaceId: id, dimension, required: true });
  return [
    { key: "entry", surfaceId: `${lesson.id}:entry`, dimension: "taught", required: true },
    { key: "phrases", surfaceId: `${lesson.id}:vocabulary`, dimension: "taught", required: true },
    { key: "discovery", surfaceId: `${lesson.id}:discover`, dimension: "taught", required: false },
    ...lesson.theory.map((block) => item(block.id, "taught")),
    ...lesson.exercises.map((exercise) => item(exercise.id, "practiced")),
    ...lesson.reading.questions.map((question) => item(question.id, "practiced")),
    ...lesson.listening.questions.map((question) => item(question.id, "practiced")),
    { key: "writing", surfaceId: `${lesson.id}:writing`, dimension: "practiced", required: true },
    { key: "speaking", surfaceId: `${lesson.id}:speaking`, dimension: "practiced", required: true },
    { key: "mediation", surfaceId: `${lesson.id}:mediation`, dimension: "practiced", required: true },
    ...lesson.miniTest.map((question) => item(question.id, "assessed")),
  ];
}

export function buildObjectiveCoverageReport() {
  const issues: string[] = [];
  const unalignedSurfaces: UnalignedSurface[] = [];
  const rows: ObjectiveCoverageRow[] = academicLessonList.flatMap((lesson) => {
    const alignment = OBJECTIVE_ITEM_ALIGNMENT[lesson.id];
    if (!alignment) {
      issues.push(`${lesson.id}: no authored objective-item alignment`);
      return [];
    }
    const surfaces = alignmentSurfaces(lesson);
    const known = new Set(surfaces.map((surface) => surface.key));
    for (const key of Object.keys(alignment)) if (!known.has(key)) issues.push(`${lesson.id}: alignment key ${key} does not name a lesson surface`);
    for (const surface of surfaces) {
      const targets = alignment[surface.key];
      if (!targets) {
        if (surface.required) issues.push(`${lesson.id}: surface ${surface.surfaceId} is not aligned or explicitly unaligned`);
        continue;
      }
      if (targets.length === 0) unalignedSurfaces.push({ lessonId: lesson.id, surfaceId: surface.surfaceId, dimension: surface.dimension });
      for (const target of targets) {
        if (!Number.isInteger(target) || target < 1 || target > lesson.objectives.length) issues.push(`${lesson.id}: ${surface.key} names objective ${target} outside 1..${lesson.objectives.length}`);
      }
    }
    return lesson.objectives.map((objective, index) => {
      const linked = (dimension: ObjectiveCoverageDimension) => surfaces
        .filter((surface) => surface.dimension === dimension && (alignment[surface.key] ?? []).includes(index + 1))
        .map((surface) => surface.surfaceId);
      const taughtIn = linked("taught");
      const practicedIn = linked("practiced");
      const assessedIn = linked("assessed");
      const missing: ObjectiveCoverageDimension[] = [];
      if (!taughtIn.length) missing.push("taught");
      if (!practicedIn.length) missing.push("practiced");
      if (!assessedIn.length) missing.push("assessed");
      return {
        objectiveId: `${lesson.id}-objective-${index + 1}`,
        lessonId: lesson.id,
        level: lesson.level,
        module: lesson.module,
        canDoDe: objective.de,
        canDoAr: objective.ar,
        taughtIn,
        practicedIn,
        assessedIn,
        status: missing.length === 0 ? "covered" : "gap",
        missing,
        mappingBasis: "authored-item-alignment",
        semanticReviewStatus: "agent-authored-under-owner-delegation",
      } satisfies ObjectiveCoverageRow;
    });
  });

  const objectiveIds = new Set<string>();
  for (const row of rows) {
    if (objectiveIds.has(row.objectiveId)) issues.push(`${row.objectiveId}: duplicate objective ID`);
    objectiveIds.add(row.objectiveId);
  }
  for (const lessonId of Object.keys(OBJECTIVE_ITEM_ALIGNMENT)) {
    if (!academicLessonList.some((lesson) => lesson.id === lessonId)) issues.push(`${lessonId}: alignment names an unknown lesson`);
  }
  if (LESSON_STAGE_KEYS.length !== 14) issues.push("canonical lesson stage list is not 14");

  const count = (subset: ObjectiveCoverageRow[]) => ({
    objectives: subset.length,
    covered: subset.filter((row) => row.status === "covered").length,
    gaps: subset.filter((row) => row.status === "gap").length,
  });
  const byLevel = Object.fromEntries(["A1", "A2", "B1", "B2"].map((level) => [level, count(rows.filter((row) => row.level === level))]));
  const byLesson = Object.fromEntries(academicLessonList.map((lesson) => {
    const lessonRows = rows.filter((row) => row.lessonId === lesson.id);
    return [lesson.id, { objectives: lessonRows.length, covered: lessonRows.filter((row) => row.status === "covered").length }];
  }));
  const gapRows = rows.filter((row) => row.status === "gap");
  const gapsByDimension = {
    taught: gapRows.filter((row) => row.missing.includes("taught")).length,
    practiced: gapRows.filter((row) => row.missing.includes("practiced")).length,
    assessed: gapRows.filter((row) => row.missing.includes("assessed")).length,
  };

  return {
    // `ok` covers alignment integrity (every surface accounted for, every index valid).
    // Authored gaps are learning findings, reported in `gaps`, not hidden and not counted as integrity failures.
    ok: issues.length === 0,
    issues,
    rows,
    byLevel,
    byLesson,
    gaps: gapRows.map((row) => ({ objectiveId: row.objectiveId, missing: row.missing })),
    gapsByDimension,
    unalignedSurfaces,
    canonicalStages: [...LESSON_STAGE_KEYS],
    mappingBoundary: "Coverage is an authored item-level alignment: every entry, vocabulary set, theory block, exercise, reading/listening question, production task and Mini-Test item in each lesson is linked to the specific objectives it teaches, practises or assesses, or is explicitly marked unaligned (comprehension-only or off-objective). The links were authored and checked against the full item text by the agent under the owner's explicit delegation; they are not an independent human German review. Objectives without a teaching, practice or Mini-Test link are reported as gaps instead of being covered by lesson-level presence.",
  };
}
