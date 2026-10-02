import type { FullLesson } from "@/types/lesson-content";
import type { LearningState } from "@/types/learning";
import { lessonEvidenceGate } from "./evidence-gate";
import { writingIsIndependent, speakingHasIndependentProvenance } from "@/core/evidence/independence";
import { retentionEvidence } from "@/core/srs/review-session";

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
    independentKnowledge: gate.independentKnowledgePassed,
    independentWriting,
    independentSpeaking,
    delayedLexicalRetention: delayedCards >= 4,
    delayedCards,
    freeProductionQuality: "unverified" as const,
    states: [
      { id: "training", labelAr: "أنهيت الأنشطة", passed: gate.passed, detailAr: legacyCompletion ? "إكمال سابق محفوظ؛ الشروط الجديدة لم تُثبت بعد، ولم نمحُ تقدمك." : gate.boundaryAr },
      { id: "independent", labelAr: "جمعت محاولة مستقلة", passed: gate.independentKnowledgePassed && independentWriting && independentSpeaking, detailAr: "استقلال المحاولة لا يعني أن الكتابة والكلام صحيحان لغويًا؛ جودة الإنتاج غير محسومة آليًا." },
      { id: "retained", labelAr: "ثبت استرجاع معجمي مؤجل", passed: delayedCards >= 4, detailAr: `${delayedCards} بطاقات فريدة نجحت بعد تأخير. لا يعادل ذلك احتفاظًا بجميع مهارات الدرس.` },
    ],
  };
}
