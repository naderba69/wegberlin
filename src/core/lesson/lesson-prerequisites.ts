import { academicLessons } from "@/data/academic-lessons";
import { LESSON_PREREQUISITE_POLICY, lessonPrerequisiteLinks, type LessonPrerequisiteLink } from "@/data/lesson-prerequisite-links";

export { LESSON_PREREQUISITE_POLICY };

export type ResolvedLessonPrerequisite = LessonPrerequisiteLink & {
  lessonId: string;
  lessonTitleAr: string;
  lessonTitleDe: string;
  theoryTitleAr: string;
  theoryTitleDe: string;
};

const LEVEL_ORDER = ["a1", "a2", "b1", "b2"] as const;
const LATIN = /[A-Za-zÄÖÜäöüß]/u;
export const PREREQUISITE_REASON_MIN_CHARS = 40;
export const PREREQUISITE_REASON_MAX_CHARS = 160;

/** Curriculum position: level first, then lesson number. Unknown IDs sort as NaN and fail validation. */
export function curriculumPosition(lessonId: string): number {
  const match = lessonId.match(/^(a1|a2|b1|b2)-(\d{2})$/u);
  if (!match) return Number.NaN;
  return LEVEL_ORDER.indexOf(match[1] as (typeof LEVEL_ORDER)[number]) * 100 + Number(match[2]);
}

export function lessonIdOfTheory(theoryId: string): string {
  return theoryId.replace(/-t\d+$/u, "");
}

export function resolveLessonPrerequisites(lessonId: string): ResolvedLessonPrerequisite[] {
  return (lessonPrerequisiteLinks[lessonId] ?? []).flatMap((link) => {
    const sourceId = lessonIdOfTheory(link.theoryId);
    const source = academicLessons[sourceId];
    const theory = source?.theory.find((block) => block.id === link.theoryId);
    if (!source || !theory) return [];
    return [{ ...link, lessonId: sourceId, lessonTitleAr: source.titleAr, lessonTitleDe: source.titleDe, theoryTitleAr: theory.titleAr, theoryTitleDe: theory.titleDe }];
  });
}

export function validateLessonPrerequisiteLinks(links: Readonly<Record<string, readonly LessonPrerequisiteLink[]>> = lessonPrerequisiteLinks): string[] {
  const issues: string[] = [];
  for (const [lessonId, rows] of Object.entries(links)) {
    if (!academicLessons[lessonId]) { issues.push(`${lessonId}: unknown lesson`); continue; }
    if (rows.length < 1 || rows.length > 2) issues.push(`${lessonId}: needs 1–2 links, has ${rows.length}`);
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.theoryId)) issues.push(`${lessonId}: duplicate link ${row.theoryId}`);
      seen.add(row.theoryId);
      const sourceId = lessonIdOfTheory(row.theoryId);
      const source = academicLessons[sourceId];
      if (!source || !source.theory.some((block) => block.id === row.theoryId)) { issues.push(`${lessonId}: unknown theory block ${row.theoryId}`); continue; }
      if (!(curriculumPosition(sourceId) < curriculumPosition(lessonId))) issues.push(`${lessonId}: ${row.theoryId} is not from an earlier lesson`);
      const reason = row.reasonAr.trim();
      if (reason.length < PREREQUISITE_REASON_MIN_CHARS || reason.length > PREREQUISITE_REASON_MAX_CHARS) issues.push(`${lessonId}: reason for ${row.theoryId} has ${reason.length} chars`);
      if (LATIN.test(reason)) issues.push(`${lessonId}: reason for ${row.theoryId} contains Latin letters`);
    }
  }
  return issues;
}
