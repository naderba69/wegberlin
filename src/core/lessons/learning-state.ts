import type { FullLesson } from "@/types/lesson-content";
import type { LearningState } from "@/types/learning";
import { lessonEvidenceGate } from "./evidence-gate";
import { writingIsIndependent, speakingHasIndependentProvenance } from "@/core/evidence/independence";
import { retentionEvidence } from "@/core/srs/review-session";

export const LEARNING_STATE_LABELS = {
  training: "أنهيت الأنشطة",
  firstUnaidedRecall: "أول استدعاء بلا سند — تدريب",
  retained: "دليل الاستقلال: استرجاع مؤجل",
} as const;

/** الاستقلال يُثبَت بمهمة جديدة مؤجلة، لا بأول استدعاء داخل نفس الجلسة. */
export const LEARNING_STATE_INDEPENDENCE_NOTE = "أول محاولة بلا شرح ولا إعادة لا تُسمّى استقلالًا. الاستقلال مهمة جديدة بعد ثلاثة أيام فأكثر؛ وجودة الكتابة والكلام تبقى غير محسومة آليًا.";

export function lessonLearningEvidence(lesson: FullLesson, state: LearningState, now = new Date()) {
  const gate = lessonEvidenceGate(lesson, state);
  const independentWriting = state.writingSubmissions.some((item) => item.taskId === lesson.id && writingIsIndependent(item, state, now));
  const independentSpeaking = state.speakingAttempts.some((item) => item.taskId === lesson.id && speakingHasIndependentProvenance(item, now));
  const delayedCards = retentionEvidence(state).delayedCardsByLesson[lesson.id] ?? 0;
  const legacyCompletion = state.completedLessonIds.includes(lesson.id) && !gate.passed;
  return {
    gate,
    trainingComplete: gate.passed,
    legacyCompletion,
    firstUnaidedRecall: gate.firstUnaidedRecallPassed,
    independentWriting,
    independentSpeaking,
    delayedLexicalRetention: delayedCards >= 4,
    delayedCards,
    freeProductionQuality: "unverified" as const,
    states: [
      { id: "training", labelAr: LEARNING_STATE_LABELS.training, passed: gate.passed, detailAr: legacyCompletion ? "إكمال سابق محفوظ؛ الشروط الجديدة لم تُثبت بعد، ولم نمحُ تقدمك." : gate.boundaryAr },
      { id: "first-unaided-recall", labelAr: LEARNING_STATE_LABELS.firstUnaidedRecall, passed: gate.firstUnaidedRecallPassed && independentWriting && independentSpeaking, detailAr: LEARNING_STATE_INDEPENDENCE_NOTE },
      { id: "retained", labelAr: LEARNING_STATE_LABELS.retained, passed: delayedCards >= 4, detailAr: `${delayedCards} بطاقات فريدة نجحت بعد تأخير. لا يعادل ذلك احتفاظًا بجميع مهارات الدرس.` },
    ],
  };
}
