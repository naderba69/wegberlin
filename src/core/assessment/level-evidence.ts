import { academicLessonList } from "@/data/academic-lessons";
import { levelAssessmentQuestions, type AssessmentFormId } from "@/data/level-assessment-bank";
import { uniqueRecentSpeakingTasks, uniqueRecentWritingTasks, evidenceIsRecent, attemptIsIndependent } from "@/core/evidence/independence";
import { retentionEvidence } from "@/core/srs/review-session";
import type { CEFRLevel, ExerciseAttempt, LearningState } from "@/types/learning";

export const LEVEL_GATE_POLICY = "independent-level-transition-v2" as const;
export const LEVEL_KNOWLEDGE_SHARE = .8;
const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
const productiveSamples: Record<CEFRLevel, number> = { A1: 3, A2: 4, B1: 5, B2: 6 };

export type AssessmentRun = { id: string; level: CEFRLevel; formId: AssessmentFormId; kind: "level-check" | "placement-challenge"; completedAt: string; score: number; total: number; required: number; independent: boolean; novel: boolean; delayedRetake: boolean; passed: boolean; domainScores: Record<string, { correct: number; total: number }> };

export function completedAssessmentRuns(state: LearningState, level: CEFRLevel): AssessmentRun[] {
  const groups = new Map<string, ExerciseAttempt[]>();
  for (const attempt of state.exerciseAttempts) {
    const context = attempt.evidenceContext;
    if (context?.policyVersion !== "independent-assessment-v1" || context.level !== level || context.kind === "endurance") continue;
    groups.set(context.runId, [...(groups.get(context.runId) ?? []), attempt]);
  }
  const runs: AssessmentRun[] = [];
  for (const [id, attempts] of groups) {
    const context = attempts[0].evidenceContext!;
    const questions = levelAssessmentQuestions(level, context.formId);
    const expectedIds = new Set(questions.map((item) => item.id));
    if (attempts.length !== questions.length || new Set(attempts.map((item) => item.exerciseId)).size !== questions.length || attempts.some((item) => !expectedIds.has(item.exerciseId) || item.evidenceContext?.expectedItems !== questions.length || item.evidenceContext.formId !== context.formId || item.evidenceContext.kind !== context.kind)) continue;
    const byQuestion = new Map(attempts.map((attempt) => [attempt.exerciseId, attempt]));
    const domainScores: AssessmentRun["domainScores"] = {};
    let score = 0;
    for (const question of questions) {
      const attempt = byQuestion.get(question.id)!;
      const correct = attempt.answerIndex === question.correctIndex;
      if (correct) score += 1;
      const domain = domainScores[question.domainId] ??= { correct: 0, total: 0 };
      domain.total += 1;
      if (correct) domain.correct += 1;
    }
    const independent = attempts.every((attempt) => attempt.evidenceContext?.independent === true);
    const novel=attempts.every(attempt=>attemptIsIndependent(attempt,state));
    const runTime=Math.min(...attempts.map(attempt=>Date.parse(attempt.createdAt)));
    const previousTimes=state.exerciseAttempts.filter(attempt=>attempt.evidenceContext?.level===level&&attempt.evidenceContext.formId===context.formId&&attempt.evidenceContext.runId!==id&&Date.parse(attempt.createdAt)<runTime).map(attempt=>Date.parse(attempt.createdAt));
    const delayedRetake=!novel&&previousTimes.length>0&&runTime-Math.max(...previousTimes)>=3*86_400_000;
    const required = Math.ceil(questions.length * LEVEL_KNOWLEDGE_SHARE);
    runs.push({ id, level, formId: context.formId, kind: context.kind as AssessmentRun["kind"], completedAt: attempts.map((attempt) => attempt.createdAt).sort().at(-1)!, score, total: questions.length, required, independent, novel, delayedRetake, passed: independent && (novel||delayedRetake) && score >= required && Object.values(domainScores).every((domain) => domain.correct >= Math.ceil(domain.total * .6)), domainScores });
  }
  return runs.sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
}

export function nextAssessmentForm(state: LearningState, level: CEFRLevel): AssessmentFormId {
  const latest = completedAssessmentRuns(state, level)[0];
  return latest?.formId === "A" ? "B" : "A";
}

export function diagnosticSuggestsChallenge(state: LearningState, level: CEFRLevel): boolean {
  return state.profile?.priorExperience !== "none" && Boolean(state.diagnosticResult) &&
    levels.indexOf(state.diagnosticResult!.estimatedLevel) > levels.indexOf(level);
}

export type LevelEvidenceGate = {
  policyVersion: typeof LEVEL_GATE_POLICY; level: CEFRLevel; passed: boolean; prerequisite: boolean;
  criteria: { orientation: boolean; knowledge: boolean; curriculum: boolean; writing: boolean; speaking: boolean; retention: boolean };
  latestRun: AssessmentRun | undefined; completed: number; requiredLessons: number; writing: number; speaking: number;
  requiredProductiveSamples: number; retainedLessons: number; delayedKnowledge: boolean; placement: boolean; legacyReadyUnverified: boolean; boundaryAr: string;
};
export function buildLevelEvidenceGate(state: LearningState, level: CEFRLevel, now = new Date()): LevelEvidenceGate {
  const runs = completedAssessmentRuns(state, level);
  const latestRun = runs[0];
  const knowledge = Boolean(latestRun?.passed && evidenceIsRecent(latestRun.completedAt, now));
  const lessonIds = academicLessonList.filter((lesson) => lesson.level === level).map((lesson) => lesson.id);
  const completed = new Set(state.completedLessonIds.filter((id) => lessonIds.includes(id))).size;
  const placement = Boolean(latestRun?.kind === "placement-challenge" && knowledge);
  const writing = uniqueRecentWritingTasks(state, level, now).size;
  const speaking = uniqueRecentSpeakingTasks(state, level, now).size;
  const retained = retentionEvidence(state).confirmedLessonIds.filter((id) => lessonIds.includes(id)).length;
  const passedRuns = runs.filter((run) => run.passed && evidenceIsRecent(run.completedAt, now));
  const delayedKnowledge = passedRuns.some((recent) => passedRuns.some((earlier) => recent.formId !== earlier.formId && Date.parse(recent.completedAt) - Date.parse(earlier.completedAt) >= 3 * 86_400_000));
  const orientation = Boolean(state.profile && (state.profile.priorExperience === "none" || state.diagnosticResult));
  const criteria = {
    orientation,
    knowledge,
    curriculum: completed === lessonIds.length || placement,
    writing: writing >= productiveSamples[level],
    speaking: speaking >= productiveSamples[level],
    retention: retained >= 3 || delayedKnowledge,
  };
  const index = levels.indexOf(level);
  // Earlier transition caches alone are not independent evidence.
  const prerequisite = index === 0 || levels.slice(0, index).every((previous) => {
    const previousRuns = completedAssessmentRuns(state, previous);
    return buildLevelEvidenceGate(state, previous, now).passed || (previousRuns.some((run) => run.passed) && (state.mastery[`level-${previous.toLowerCase()}-ready`] ?? 0) === 100);
  });
  return {
    policyVersion: LEVEL_GATE_POLICY,
    level,
    passed: prerequisite && Object.values(criteria).every(Boolean),
    prerequisite,
    criteria,
    latestRun,
    completed,
    requiredLessons: lessonIds.length,
    writing,
    speaking,
    requiredProductiveSamples: productiveSamples[level],
    retainedLessons: retained,
    delayedKnowledge,
    placement,
    legacyReadyUnverified: !latestRun && (state.mastery[`level-${level.toLowerCase()}-ready`] ?? 0) > 0,
    boundaryAr: "هذه بوابة انتقال داخل المنهج من معرفة مستقلة وعينات إنتاج واحتفاظ؛ جودة اللغة الحرة غير محسومة، ولا تمنح مستوى CEFR أو نتيجة امتحان.",
  };
}

export function levelTransitionIsCurrent(state: LearningState, level: CEFRLevel, now = new Date()): boolean {
  return buildLevelEvidenceGate(state, level, now).passed;
}
