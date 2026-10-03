import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt, LearningState } from "@/types/learning";
import { attemptIsIndependent, latestUniqueAttempts } from "@/core/evidence/independence";

export const LESSON_COMPLETION_POLICY = "lesson-activity-and-independent-evidence-v2" as const;
export type LessonEvidenceCriterion = {
  id: "controlled" | "reading" | "listening" | "mini-test" | "writing" | "speaking" | "mediation";
  labelAr: string;
  achieved: number;
  required: number;
  total: number;
  passed: boolean;
};
export type LessonEvidenceGate = {
  policyVersion: typeof LESSON_COMPLETION_POLICY;
  passed: boolean;
  basicTrainingPassed: boolean;
  /** First unaided recall inside the sitting: training evidence, not proof of independence. */
  firstUnaidedRecallPassed: boolean;
  criteria: LessonEvidenceCriterion[];
  uniqueCorrectEvidence: number;
  boundaryAr: string;
};

function correctUnique(attempts: ExerciseAttempt[], ids: Set<string>) {
  return latestUniqueAttempts(attempts).filter((attempt) => attempt.correct && ids.has(attempt.exerciseId)).length;
}

/** Completion describes activities; correctness of free production stays unverified. */
export function lessonEvidenceGate(lesson: FullLesson, state: LearningState): LessonEvidenceGate {
  const attempts = state.exerciseAttempts.filter((attempt) => attempt.lessonId === lesson.id);
  const currentlyCorrect=new Set(latestUniqueAttempts(attempts).filter(attempt=>attempt.correct).map(attempt=>attempt.exerciseId));
  const independent = attempts.filter((attempt) => currentlyCorrect.has(attempt.exerciseId)&&attemptIsIndependent(attempt, state));
  const controlledIds = new Set(lesson.exercises.map((item) => item.id));
  const readingIds = new Set(lesson.reading.questions.map((item) => item.id));
  const listeningIds = new Set(lesson.listening.questions.map((item) => item.id));
  const testIds = new Set(lesson.miniTest.map((item) => item.id));
  const controlledRequired = Math.max(1, Math.ceil(controlledIds.size * .7));
  const readingRequired = Math.max(1, Math.ceil(readingIds.size * .6));
  const listeningRequired = Math.max(1, Math.ceil(listeningIds.size * .6));
  const testRequired = Math.max(1, Math.ceil(testIds.size * .8));
  const played = state.listeningProcessEvents.some((event) => event.lessonId === lesson.id && event.event === "playback-started") ||
    state.listeningUsageEvents.some((event) => event.contentId === lesson.id && event.surface === "lesson" && event.event === "playback");
  const listeningAfterPlayback=attempts.filter(attempt=>state.listeningProcessEvents.some(event=>event.lessonId===lesson.id&&event.event==="playback-started"&&Date.parse(event.createdAt)<=Date.parse(attempt.createdAt))||state.listeningUsageEvents.some(event=>event.contentId===lesson.id&&event.surface==="lesson"&&event.event==="playback"&&Date.parse(event.createdAt)<=Date.parse(attempt.createdAt)));
  const independentListening=independent.filter(attempt=>listeningAfterPlayback.some(item=>item.id===attempt.id));
  const writingRange=lesson.writing.promptDe.match(/(\d{2,3})\s*[–-]\s*\d{2,3}\s*Wörter/iu);
  const writingMinimum=writingRange?Number(writingRange[1]):lesson.level==="A1"?30:lesson.level==="A2"?70:lesson.level==="B1"?100:140;
  const writing = state.writingSubmissions.filter((item) => item.taskId === lesson.id && item.status !== "draft" && item.text.trim().split(/\s+/u).length >= writingMinimum);
  const speaking = state.speakingAttempts.filter((item) => item.taskId === lesson.id && item.durationSeconds >= 3 && item.selfReview?.listenedBack && item.reflection.trim().length >= 5);
  const mediation = state.mediationSubmissions.filter((item) => item.taskId === lesson.id && item.status !== "draft" && item.transferAr.trim().length >= 10 && item.audience.trim() && item.purpose.trim());
  const rows: Array<Omit<LessonEvidenceCriterion, "passed">> = [
    { id: "controlled", labelAr: "التمارين الأساسية", achieved: correctUnique(attempts, controlledIds), required: controlledRequired, total: controlledIds.size },
    { id: "reading", labelAr: "فهم القراءة", achieved: correctUnique(attempts, readingIds), required: readingRequired, total: readingIds.size },
    { id: "listening", labelAr: "فهم الاستماع", achieved: played ? correctUnique(listeningAfterPlayback, listeningIds) : 0, required: listeningRequired, total: listeningIds.size },
    { id: "mini-test", labelAr: "الاختبار القصير", achieved: correctUnique(attempts, testIds), required: testRequired, total: testIds.size },
    { id: "writing", labelAr: "مسودة كتابة مسلّمة", achieved: writing.length ? 1 : 0, required: 1, total: 1 },
    { id: "speaking", labelAr: "كلام مسجّل ومراجَع ذاتيًا", achieved: speaking.length ? 1 : 0, required: 1, total: 1 },
    { id: "mediation", labelAr: "مهمة وساطة مسلّمة", achieved: mediation.length ? 1 : 0, required: 1, total: 1 },
  ];
  const criteria = rows.map((row) => ({ ...row, passed: row.achieved >= row.required }));
  const firstUnaidedRecallPassed = correctUnique(independent, controlledIds) >= controlledRequired &&
    correctUnique(independent, readingIds) >= readingRequired && played && correctUnique(independentListening, listeningIds) >= listeningRequired && correctUnique(independent, testIds) >= testRequired;
  return {
    policyVersion: LESSON_COMPLETION_POLICY,
    passed: criteria.every((row) => row.passed),
    basicTrainingPassed: criteria.slice(0, 4).every((row) => row.passed),
    firstUnaidedRecallPassed,
    criteria,
    uniqueCorrectEvidence: correctUnique(attempts, new Set([...controlledIds, ...readingIds, ...listeningIds, ...testIds])),
    boundaryAr: "إكمال الأنشطة لا يثبت جودة الكتابة أو الكلام. المحاولة المساعدة أو المعادة تدريب، وأول استدعاء بلا سند تدريبٌ أيضًا؛ الاستقلال دليلٌ مؤجل.",
  };
}
