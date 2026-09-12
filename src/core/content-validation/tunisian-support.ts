import { academicLessonList } from "@/data/academic-lessons";
import { tunisianSupportNotes } from "@/data/tunisian-support-registry";
import type { CEFRLevel } from "@/types/learning";

export const TUNISIAN_SUPPORT_AUDIT_VERSION = "tunisian-support-audit-v1" as const;
const arabicLetter = /[\u0600-\u06ff]/u;

export function buildTunisianSupportAudit() {
  const issues: string[] = [];
  const lessonById = new Map(academicLessonList.map((lesson) => [lesson.id, lesson]));
  const ids = new Set<string>();
  const ownedTheoryIds = new Set<string>();
  const lessons = new Set<string>();

  for (const item of tunisianSupportNotes) {
    if (ids.has(item.id)) issues.push(`${item.id}: duplicate note ID`);
    ids.add(item.id);
    lessons.add(item.lessonId);
    const lesson = lessonById.get(item.lessonId);
    if (!lesson) {
      issues.push(`${item.id}: unknown lesson ${item.lessonId}`);
      continue;
    }
    if (lesson.level !== item.level) issues.push(`${item.id}: level ${item.level} does not match lesson ${lesson.level}`);
    if (item.sourceVersion !== "tunisian-support-v1") issues.push(`${item.id}: unexpected source version`);
    if (item.visibleFor.length !== 1 || item.visibleFor[0] !== "tunisian-supported") issues.push(`${item.id}: note must be exclusive to tunisian-supported mode`);
    if (!arabicLetter.test(item.msaBridgeAr) || !arabicLetter.test(item.tunisianNoteAr) || !arabicLetter.test(item.differenceImpactAr)) issues.push(`${item.id}: Arabic support fields must contain Arabic script`);
    if (item.msaBridgeAr.replace(/\s+/g, " ").trim() === item.tunisianNoteAr.replace(/\s+/g, " ").trim()) issues.push(`${item.id}: Tunisian note duplicates the MSA bridge`);
    if (item.theoryIds.length === 0) issues.push(`${item.id}: missing theory reference`);
    for (const theoryId of item.theoryIds) {
      if (!lesson.theory.some((theory) => theory.id === theoryId)) issues.push(`${item.id}: unknown theory reference ${theoryId}`);
      if (ownedTheoryIds.has(theoryId)) issues.push(`${item.id}: theory reference ${theoryId} has more than one Tunisian note`);
      ownedTheoryIds.add(theoryId);
    }
    const hasReviewEvidence = Boolean(item.reviewedBy?.trim() && item.reviewedAt?.trim());
    if (item.reviewStatus === "independently-reviewed" && !hasReviewEvidence) issues.push(`${item.id}: reviewed status lacks reviewer/date evidence`);
    if (item.reviewStatus === "authored-review-pending" && hasReviewEvidence) issues.push(`${item.id}: pending status carries contradictory review evidence`);
  }

  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
  const byLevel = Object.fromEntries(levels.map((level) => [level, tunisianSupportNotes.filter((item) => item.level === level).length])) as Record<CEFRLevel, number>;
  for (const level of levels) if (byLevel[level] < 2) issues.push(`${level}: needs at least two meaningful Tunisian contrast notes`);
  const pendingReview = tunisianSupportNotes.filter((item) => item.reviewStatus === "authored-review-pending").length;
  const independentlyReviewed = tunisianSupportNotes.filter((item) => item.reviewStatus === "independently-reviewed").length;

  return {
    ok: issues.length === 0,
    version: TUNISIAN_SUPPORT_AUDIT_VERSION,
    policyVersion: "tunisian-support-v1" as const,
    noteCount: tunisianSupportNotes.length,
    lessonCount: lessons.size,
    theoryReferenceCount: ownedTheoryIds.size,
    pendingReview,
    independentlyReviewed,
    byLevel,
    categoryCount: new Set(tunisianSupportNotes.map((item) => item.category)).size,
    issues,
    notes: tunisianSupportNotes,
    boundary: "The audit proves conditional delivery, authored MSA/Tunisian separation, review-state honesty, and valid lesson/theory references. It does not count authored text as independent Tunisian linguistic review.",
  };
}
