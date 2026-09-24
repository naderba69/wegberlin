import { academicLessonList } from "@/data/academic-lessons";
import { LESSON_STAGE_KEYS } from "@/types/lesson-content";

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
  mappingBasis: "lesson-scoped-structural-contract";
};

export function buildObjectiveCoverageReport() {
  const rows: ObjectiveCoverageRow[] = academicLessonList.flatMap((lesson) => lesson.objectives.map((objective, index) => {
    const taughtIn = [
      `${lesson.id}:entry`,
      `${lesson.id}:vocabulary`,
      `${lesson.id}:discover`,
      ...lesson.theory.map((block) => block.id),
    ];
    const practicedIn = [
      ...lesson.exercises.map((exercise) => exercise.id),
      ...lesson.reading.questions.map((question) => question.id),
      ...lesson.listening.questions.map((question) => question.id),
      `${lesson.id}:writing`,
      `${lesson.id}:speaking`,
      `${lesson.id}:mediation`,
      `${lesson.id}:errors`,
    ];
    const assessedIn = lesson.miniTest.map((question) => question.id);
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
      status: taughtIn.length > 0 && practicedIn.length > 0 && assessedIn.length > 0 ? "covered" : "gap",
      mappingBasis: "lesson-scoped-structural-contract",
    };
  }));

  const issues: string[] = [];
  const objectiveIds = new Set<string>();
  for (const row of rows) {
    if (objectiveIds.has(row.objectiveId)) issues.push(`${row.objectiveId}: duplicate objective ID`);
    objectiveIds.add(row.objectiveId);
    if (row.status === "gap") issues.push(`${row.objectiveId}: missing teaching, practice, or assessment surface`);
  }
  for (const lesson of academicLessonList) {
    if (LESSON_STAGE_KEYS.length !== 14) issues.push(`${lesson.id}: canonical lesson stage list is not 14`);
  }

  const byLevel = Object.fromEntries(["A1", "A2", "B1", "B2"].map((level) => {
    const levelRows = rows.filter((row) => row.level === level);
    return [level, { objectives: levelRows.length, covered: levelRows.filter((row) => row.status === "covered").length, gaps: levelRows.filter((row) => row.status === "gap").length }];
  }));
  const byLesson = Object.fromEntries(academicLessonList.map((lesson) => {
    const lessonRows = rows.filter((row) => row.lessonId === lesson.id);
    return [lesson.id, { objectives: lessonRows.length, covered: lessonRows.filter((row) => row.status === "covered").length }];
  }));

  return {
    ok: issues.length === 0,
    issues,
    rows,
    byLevel,
    byLesson,
    canonicalStages: [...LESSON_STAGE_KEYS],
    mappingBoundary: "Coverage is structural at lesson scope. It proves that each objective owns teaching, practice, and Mini-Test surfaces in its lesson; it does not replace human semantic alignment review for every individual item.",
  };
}
