import type { FullLesson, LessonStageKey } from "@/types/lesson-content";
import { LESSON_STAGE_KEYS } from "@/types/lesson-content";
import type { ExerciseAttempt } from "@/types/learning";

/**
 * عقد الدرس: كل مرحلة تطلب عملًا لا تُغلق إلا بذاك العمل، والاختبار القصير يبقى خلف التدريب.
 *
 * هذه السياسة تُشتَقّ من الأدلة المحفوظة وحدها، فلا تُخزَّن حالة جديدة ولا تُرقِّي إتقانًا. الغاية
 * تعليمية لا عقابية: لا يدخل المتعلم تقييمًا قبل أن يدرَّب، ولا يسمّي قراءة الشرح "خطوة مكتملة".
 * الرجوع إلى الوراء يبقى حرًا دائمًا، وكل مرحلة شارحة تُفتح بلا قيد.
 */
export const LESSON_STAGE_GATE_POLICY = "lesson-stage-work-gate-v1" as const;
export const LESSON_STAGE_GATE_BOUNDARY = "stage-navigation-gate-only-no-mastery-no-completion-change" as const;

export type StageActivityRequirement = { ids: string[]; needAr: string };

const STAGE_LABELS: Record<LessonStageKey, string> = {
  objectives: "أهداف اليوم",
  entry: "موقف البداية",
  vocabulary: "العبارات",
  discover: "اكتشف النمط",
  rule: "القاعدة والمقارنة",
  controlled: "التدريب الموجّه",
  reading: "القراءة",
  listening: "الاستماع",
  pronunciation: "النطق",
  writing: "الكتابة",
  speaking: "المحادثة",
  mediation: "الوساطة",
  errors: "عيادة الأخطاء",
  test: "الاختبار القصير",
};

/** The four stages that ask the learner to produce something inside the lesson. */
export function stageActivityRequirement(lesson: FullLesson, stage: LessonStageKey): StageActivityRequirement | null {
  if (stage === "controlled") return { ids: lesson.exercises.map((item) => item.id), needAr: "تمرينًا موجّهًا واحدًا على الأقل" };
  if (stage === "reading") return { ids: lesson.reading.questions.map((item) => item.id), needAr: "سؤال قراءة واحدًا مع تثبيت الجواب" };
  if (stage === "listening") return { ids: lesson.listening.questions.map((item) => item.id), needAr: "سؤال استماع واحدًا بعد تشغيل المقطع" };
  if (stage === "test") return { ids: lesson.miniTest.map((item) => item.id), needAr: "سؤالًا واحدًا من الاختبار القصير" };
  return null;
}

export type LessonStageGate = {
  policyVersion: typeof LESSON_STAGE_GATE_POLICY;
  /** Highest stage index the learner may open right now. */
  reachLimit: number;
  advanceBlocked: boolean;
  reasonAr: string;
  missingTrainingAr: string[];
  boundary: typeof LESSON_STAGE_GATE_BOUNDARY;
};

export function lessonStageGate(lesson: FullLesson, attempts: readonly ExerciseAttempt[], stageIndex: number, lessonId = lesson.id): LessonStageGate {
  const stage = LESSON_STAGE_KEYS[stageIndex] ?? "objectives";
  const lessonAttempts = attempts.filter((attempt) => attempt.lessonId === lessonId);
  const stageAttempted = (key: LessonStageKey) => {
    const requirement = stageActivityRequirement(lesson, key);
    if (!requirement || requirement.ids.length === 0) return true;
    return lessonAttempts.some((attempt) => requirement.ids.includes(attempt.exerciseId));
  };
  const trainingStages: LessonStageKey[] = ["controlled", "reading", "listening"];
  const missingTraining = trainingStages.filter((key) => !stageAttempted(key)).map((key) => STAGE_LABELS[key]);
  const entryLocked = (key: LessonStageKey) => key === "test" && missingTraining.length > 0;
  let reachLimit = LESSON_STAGE_KEYS.length - 1;
  for (let index = 0; index < LESSON_STAGE_KEYS.length; index += 1) {
    if (entryLocked(LESSON_STAGE_KEYS[index])) {
      reachLimit = Math.min(stageIndex, index - 1);
      break;
    }
  }
  const currentRequirement = stageActivityRequirement(lesson, stage);
  const currentAttempted = stageAttempted(stage);
  const advanceBlocked = entryLocked(stage) || !currentAttempted;
  const reasonAr = entryLocked(stage)
    ? `الاختبار القصير مؤجل إلى ما بعد التدريب. أنجز أولًا: ${missingTraining.join("، ")}. لا نقيس ما لم يُدرَّب.`
    : currentRequirement && !currentAttempted
      ? `هذه المرحلة تحتاج ${currentRequirement.needAr}. الشرح مقروء؛ الآن استعمل الهدف مرة واحدة.`
      : "";
  return {
    policyVersion: LESSON_STAGE_GATE_POLICY,
    reachLimit,
    advanceBlocked,
    reasonAr,
    missingTrainingAr: missingTraining,
    boundary: LESSON_STAGE_GATE_BOUNDARY,
  };
}
