import { speakingTargetSeconds } from "@/core/speaking/workflow";
import { independentProductionTask, productionTaskLevel } from "@/data/independent-production-tasks";
import type { ExerciseAttempt, LearningState, SpeakingAttempt, WritingSubmission } from "@/types/learning";
import { academicLessons } from "@/data/academic-lessons";

export const LEARNING_EVIDENCE_POLICY = "learning-independence-v2" as const;
export const PRODUCTIVE_EVIDENCE_MAX_AGE_DAYS = 30;

export function evidenceIsRecent(iso: string, now = new Date(), days = PRODUCTIVE_EVIDENCE_MAX_AGE_DAYS): boolean {
  const age = now.getTime() - Date.parse(iso);
  return Number.isFinite(age) && age >= 0 && age <= days * 86_400_000;
}

export function latestUniqueAttempts(attempts: readonly ExerciseAttempt[]): ExerciseAttempt[] {
  const latest = new Map<string, ExerciseAttempt>();
  for (const attempt of attempts) {
    const key = `${attempt.lessonId}:${attempt.exerciseId}`;
    const previous = latest.get(key);
    if (!previous || Date.parse(attempt.createdAt) >= Date.parse(previous.createdAt)) latest.set(key, attempt);
  }
  return [...latest.values()];
}

/** A successful retry is useful practice, never a first unseen success. */
export function attemptIsIndependent(attempt: ExerciseAttempt, state: LearningState): boolean {
  if (attempt.evidenceContext?.independent === false || attempt.uncertaintyKind === "guess") return false;
  const time = Date.parse(attempt.createdAt);
  if (!Number.isFinite(time)) return false;
  if (state.exerciseAttempts.some((other) => other.id !== attempt.id && other.lessonId === attempt.lessonId && other.exerciseId === attempt.exerciseId && Date.parse(other.createdAt) < time)) return false;
  return !state.supportUsageEvents.some((event) =>
    !event.afterCommit && Date.parse(event.createdAt) <= time && (
      event.contentId === attempt.exerciseId ||
      (event.lessonId === attempt.lessonId && event.kind === "listening-transcript" && /-lq\d+$/u.test(attempt.exerciseId)) ||
      (event.lessonId === attempt.lessonId && event.kind === "reading-translation" && /-rq\d+$/u.test(attempt.exerciseId))
    ));
}

export function writingIsIndependent(submission: WritingSubmission, state: LearningState, now = new Date()): boolean {
  const context = submission.evidenceContext;
  if (!context || context.policyVersion !== "productive-independence-v1" || context.supportUsedBeforeDraft || !context.firstDraft) return false;
  if (submission.status !== "submitted" || submission.sourceVersion !== undefined || !evidenceIsRecent(submission.createdAt, now)) return false;
  const independentTask = independentProductionTask(submission.taskId.replace(/-writing$/u, ""));
  const lesson = academicLessons[independentTask?.sourceLessonId ?? submission.taskId];
  const task = independentTask?.writing ?? lesson?.writing;
  if (!lesson || !task || context.taskLevel !== (independentTask?.level ?? lesson.level)) return false;
  const range = task.promptDe.match(/(\d{2,3})\s*[–-]\s*\d{2,3}\s+Wörter/iu);
  const minWords = range ? Number(range[1]) : context.taskLevel === "A1" ? 30 : context.taskLevel === "A2" ? 70 : context.taskLevel === "B1" ? 100 : 140;
  if (submission.text.trim().split(/\s+/u).length < minWords) return false;
  const normalized = (text: string) => text.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!submission.text.trim() || normalized(submission.text) === normalized(task.modelDe)) return false;
  const earlier = state.writingSubmissions.some((item) => item.id !== submission.id && item.taskId === submission.taskId && item.status !== "draft" && Date.parse(item.createdAt) < Date.parse(submission.createdAt) && (!context.draftStartedAt || Date.parse(item.createdAt)>=Date.parse(context.draftStartedAt)));
  if(independentTask&&state.writingSubmissions.some(item=>item.id!==submission.id&&item.taskId===submission.taskId&&item.status!=="draft"&&Date.parse(item.createdAt)<Date.parse(submission.createdAt)&&normalized(item.text)===normalized(submission.text)))return false;
  return !earlier && Boolean(submission.plan?.audience.trim() && submission.plan.purpose.trim()) && (submission.plan?.points.filter((point) => point.trim()).length ?? 0) >= 2 &&
    !state.supportUsageEvents.some((event) => event.contentId === `${submission.taskId}:writing-model` && event.kind === "writing-model" && Date.parse(event.createdAt) <= Date.parse(submission.createdAt) && (!context.draftStartedAt || Date.parse(event.createdAt)>=Date.parse(context.draftStartedAt)));
}

/** Missing provenance is unknown, not proof of independent speaking. */
export function speakingHasIndependentProvenance(attempt: SpeakingAttempt, now = new Date()): boolean {
  const independentTask=independentProductionTask(attempt.taskId.replace(/-speaking$/u,""));
  const lesson=academicLessons[independentTask?.sourceLessonId??attempt.taskId];
  const task=independentTask?.speaking??lesson?.speaking;
  if(!lesson||!task)return false;
  const target=speakingTargetSeconds(task.promptDe,independentTask?.level??lesson.level,{beginnerFirstLesson:attempt.taskId==="a1-01"});
  return attempt.selfReview?.supportVisibleDuringRecording === false && attempt.selfReview.listenedBack &&
    attempt.durationSeconds >= Math.max(3,target*.6) && attempt.reflection.trim().length >= 5 && evidenceIsRecent(attempt.createdAt, now);
}

export function uniqueRecentWritingTasks(state: LearningState, level: string, now = new Date()): Set<string> {
  return new Set(state.writingSubmissions.filter((item) => (productionTaskLevel(item.taskId) ?? academicLessons[item.taskId]?.level) === level && writingIsIndependent(item, state, now)).map((item) => item.taskId));
}

export function uniqueRecentSpeakingTasks(state: LearningState, level: string, now = new Date()): Set<string> {
  return new Set(state.speakingAttempts.filter((item) => (productionTaskLevel(item.taskId) ?? academicLessons[item.taskId]?.level) === level && speakingHasIndependentProvenance(item, now)).map((item) => item.taskId));
}
