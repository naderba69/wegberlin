import { academicLessonList } from "@/data/academic-lessons";
import {
  NURSING_LAYER_DISCLAIMER_AR,
  NURSING_LAYER_RULES_AR,
  NURSING_LAYER_VERSION,
  NURSING_LAYER_WORD_BUDGET,
  NURSING_PROFESSIONAL_WORDS,
  NURSING_ROLLBACK_BREAKER,
  nursingLayerTrackFor,
  nursingLayerUnits,
} from "@/data/nursing-layer-registry";
import type { CEFRLevel } from "@/types/learning";
import type { NursingLayerUnit, NursingSafetyCluster } from "@/types/nursing-layer";

export const NURSING_LAYER_AUDIT_VERSION = "nursing-layer-audit-v1" as const;

/** ADR-080: safety is trained as a habit, level by level. The cluster is fixed per CEFR level. */
export const NURSING_CLUSTER_BY_LEVEL: Record<CEFRLevel, NursingSafetyCluster> = {
  A1: "recognition",
  A2: "confirmation",
  B1: "questioning",
  B2: "documentation",
};

/** The single accepted action kind per level; guessing can never be accepted. */
export const NURSING_ACCEPTED_KIND_BY_LEVEL: Record<CEFRLevel, string> = {
  A1: "recognize",
  A2: "confirm",
  B1: "ask",
  B2: "document",
};

export const NURSING_LAYER_BOUNDARY =
  "الصياغات لغوية بحتة: لا إرشاد سريري ولا قرار صحي ولا تدريب مهني معتمد، والمراجعة المهنية معلّقة (0 مراجعات) — ولا ترفع الطبقة إتقانًا ولا تؤثر في بوابة مستوى ولا في مهام الامتحان." as const;

const arabicLetter = /[\u0600-\u06ff]/u;
const wordPattern = (word: string): RegExp =>
  new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu");

export function germanSurfaces(unit: NursingLayerUnit): string[] {
  return [
    unit.titleDe,
    unit.targetDe,
    unit.safetyTask.stimulusDe,
    ...unit.safetyTask.options.map((option) => option.textDe),
    ...unit.reviewWords.map((word) => word.exampleDe),
  ];
}

export function buildNursingLayerAudit() {
  const issues: string[] = [];
  const lessonById = new Map(academicLessonList.map((lesson) => [lesson.id, lesson]));
  const ids = new Set<string>();
  const lessons = new Set<string>();
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
  const byLevel = Object.fromEntries(levels.map((level) => [level, 0])) as Record<CEFRLevel, number>;
  const usedProfessionalWords: Record<CEFRLevel, string[]> = { A1: [], A2: [], B1: [], B2: [] };

  for (const item of nursingLayerUnits) {
    if (ids.has(item.id)) issues.push(`${item.id}: duplicate unit ID`);
    ids.add(item.id);
    lessons.add(item.lessonId);
    if (!item.id.endsWith("-nurse")) issues.push(`${item.id}: unit ID must end with -nurse`);

    const lesson = lessonById.get(item.lessonId);
    if (!lesson) {
      issues.push(`${item.id}: unknown lesson ${item.lessonId}`);
      continue;
    }
    if (lesson.level !== item.level) issues.push(`${item.id}: level ${item.level} does not match lesson ${lesson.level}`);
    byLevel[item.level] += 1;

    if (item.sourceVersion !== NURSING_LAYER_VERSION) issues.push(`${item.id}: unexpected source version`);
    if (item.track !== nursingLayerTrackFor(item.level)) issues.push(`${item.id}: track ${item.track} does not match level ${item.level}`);
    if (item.cluster !== NURSING_CLUSTER_BY_LEVEL[item.level]) issues.push(`${item.id}: cluster ${item.cluster} is not the authored cluster for ${item.level}`);
    if (item.reviewStatus !== "authored-review-pending") issues.push(`${item.id}: layer must stay authored-review-pending until a named reviewer signs`);
    if (item.professionalReview !== "pending-nursing-professional") issues.push(`${item.id}: professional review debt must stay explicit and pending`);
    if (String(item.ownerId) === String(item.reviewerId)) issues.push(`${item.id}: owner and reviewer must differ`);
    if (item.disclaimerAr !== NURSING_LAYER_DISCLAIMER_AR) issues.push(`${item.id}: clinical-advice disclaimer is missing or altered`);

    if (item.reusedTheoryIds.length === 0) issues.push(`${item.id}: no reused theory reference`);
    for (const theoryId of item.reusedTheoryIds) {
      if (!lesson.theory.some((theory) => theory.id === theoryId)) issues.push(`${item.id}: unknown theory reference ${theoryId}`);
    }

    const accepted = item.safetyTask.options.filter((option) => !["guess", "act-now", "silent-agreement"].includes(option.kind));
    if (accepted.length !== 1) issues.push(`${item.id}: exactly one accepted language action is required, found ${accepted.length}`);
    if (item.safetyTask.options.length !== 4) issues.push(`${item.id}: safety task must offer four options`);
    if (!item.safetyTask.options.some((option) => option.kind === "guess")) issues.push(`${item.id}: guessing must be offered and failed explicitly`);
    if (accepted.length === 1 && accepted[0].kind !== NURSING_ACCEPTED_KIND_BY_LEVEL[item.level]) {
      issues.push(`${item.id}: accepted action ${accepted[0].kind} is not the ${item.level} cluster action ${NURSING_ACCEPTED_KIND_BY_LEVEL[item.level]}`);
    }
    for (const option of item.safetyTask.options) {
      if (option.reasonAr.trim().length < 20) issues.push(`${item.id}: option reason is too short to teach anything`);
      if (!arabicLetter.test(option.reasonAr)) issues.push(`${item.id}: option reason must be Arabic text`);
    }
    if (!arabicLetter.test(item.situationAr)) issues.push(`${item.id}: situation note must be Arabic text`);

    // Rule (b): the accepted action is a language act. It may never be an action on a body or a dose.
    if (accepted.length === 1) {
      const text = accepted[0].textDe.toLocaleLowerCase("de-DE");
      for (const forbidden of ["nehmen sie", "tablette", "tropfen", "spritze", "dosierung", "verabreichen"]) {
        if (text.includes(forbidden)) issues.push(`${item.id}: accepted action looks like a clinical instruction (${forbidden})`);
      }
    }

    const surfaces = germanSurfaces(item);
    if (item.level === "A1" || item.level === "A2") {
      if (item.reviewWords.length !== 0) issues.push(`${item.id}: ${item.level} may not carry professional review words`);
      for (const word of NURSING_PROFESSIONAL_WORDS) {
        const pattern = wordPattern(word);
        if (surfaces.some((surface) => pattern.test(surface))) issues.push(`${item.id}: professional word "${word}" is not allowed below B1`);
      }
    } else {
      for (const word of item.reviewWords) {
        if (!word.de.trim() || !arabicLetter.test(word.ar) || word.exampleDe.trim().length < 10) issues.push(`${item.id}: review word ${word.de || "?"} is incomplete`);
        const pattern = wordPattern(word.de.replace(/^die |^der |^das /u, ""));
        const seen = surfaces.some((surface) => pattern.test(surface));
        if (!seen) issues.push(`${item.id}: review word ${word.de} never appears in the unit's own German`);
        usedProfessionalWords[item.level].push(word.de);
      }
    }

    const targetLen = item.targetDe.trim().length;
    if (targetLen < 12 || targetLen > 140) issues.push(`${item.id}: read-back target is outside the authored length (12-140)`);
  }

  for (const level of levels) {
    if (byLevel[level] === 0) issues.push(`${level}: the layer must cover this level`);
    const words = [...new Set(usedProfessionalWords[level])];
    if (words.length > NURSING_LAYER_WORD_BUDGET[level]) {
      issues.push(`${level}: declared budget is ${NURSING_LAYER_WORD_BUDGET[level]} professional words, found ${words.length}`);
    }
  }
  if (NURSING_LAYER_RULES_AR.length !== 3) issues.push("The three strict rules must stay three");

  const totalProfessionalWords = levels.reduce((sum, level) => sum + [...new Set(usedProfessionalWords[level])].length, 0);
  const budgetTotal = levels.reduce((sum, level) => sum + NURSING_LAYER_WORD_BUDGET[level], 0);

  return {
    ok: issues.length === 0,
    version: NURSING_LAYER_AUDIT_VERSION,
    policyVersion: NURSING_LAYER_VERSION,
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    unitCount: nursingLayerUnits.length,
    lessonCount: lessons.size,
    byLevel,
    clusterByLevel: NURSING_CLUSTER_BY_LEVEL,
    acceptedKindByLevel: NURSING_ACCEPTED_KIND_BY_LEVEL,
    safetyTaskCount: nursingLayerUnits.length,
    acceptedOptionCount: nursingLayerUnits.reduce((sum, item) => sum + item.safetyTask.options.filter((option) => !["guess", "act-now", "silent-agreement"].includes(option.kind)).length, 0),
    failedGuessOptionCount: nursingLayerUnits.reduce((sum, item) => sum + item.safetyTask.options.filter((option) => option.kind === "guess").length, 0),
    reviewWordCount: totalProfessionalWords,
    reviewWordBudget: budgetTotal,
    reviewWordsByLevel: usedProfessionalWords,
    pendingProfessionalReview: nursingLayerUnits.length,
    professionalReviews: 0,
    rollbackBreaker: NURSING_ROLLBACK_BREAKER,
    masteryEffect: "none" as const,
    gateEffect: "none" as const,
    examEffect: "none" as const,
    boundary: NURSING_LAYER_BOUNDARY,
    issues,
  };
}
