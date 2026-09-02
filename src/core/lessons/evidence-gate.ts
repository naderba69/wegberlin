import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt, LearningState } from "@/types/learning";

export type LessonEvidenceCriterion = {
  id: "controlled" | "reading" | "listening" | "mini-test";
  labelAr: string;
  achieved: number;
  required: number;
  total: number;
  passed: boolean;
};

export type LessonEvidenceGate = {
  passed: boolean;
  criteria: LessonEvidenceCriterion[];
  uniqueCorrectEvidence: number;
};

function correctUnique(attempts: ExerciseAttempt[], acceptedIds: Set<string>) {
  return new Set(attempts.filter((attempt) => attempt.correct && acceptedIds.has(attempt.exerciseId)).map((attempt) => attempt.exerciseId)).size;
}

export function lessonEvidenceGate(lesson: FullLesson, state: LearningState): LessonEvidenceGate {
  const attempts = state.exerciseAttempts.filter((attempt) => attempt.lessonId === lesson.id);
  const controlledIds = new Set(lesson.exercises.map((exercise) => exercise.id));
  const readingIds = new Set(lesson.reading.questions.map((question) => question.id));
  const listeningIds = new Set(lesson.listening.questions.map((question) => question.id));
  const miniTestIds = new Set(lesson.miniTest.map((question) => question.id));
  const controlledRequired = Math.max(1, Math.ceil(lesson.exercises.length * 0.7));
  const miniTestRequired = Math.max(1, Math.ceil(lesson.miniTest.length * 0.8));

  const baseCriteria: Array<Omit<LessonEvidenceCriterion, "passed">> = [
    {
      id: "controlled",
      labelAr: "تدريب موجّه صحيح وفريد",
      achieved: correctUnique(attempts, controlledIds),
      required: controlledRequired,
      total: lesson.exercises.length,
    },
    {
      id: "reading",
      labelAr: "دليل فهم قراءة",
      achieved: correctUnique(attempts, readingIds),
      required: 1,
      total: lesson.reading.questions.length,
    },
    {
      id: "listening",
      labelAr: "دليل فهم استماع",
      achieved: correctUnique(attempts, listeningIds),
      required: 1,
      total: lesson.listening.questions.length,
    },
    {
      id: "mini-test",
      labelAr: "إجابات صحيحة في الاختبار المصغر",
      achieved: correctUnique(attempts, miniTestIds),
      required: miniTestRequired,
      total: lesson.miniTest.length,
    },
  ];
  const criteria: LessonEvidenceCriterion[] = baseCriteria.map((criterion) => ({ ...criterion, passed: criterion.achieved >= criterion.required }));

  return {
    passed: criteria.every((criterion) => criterion.passed),
    criteria,
    uniqueCorrectEvidence: new Set(attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.exerciseId)).size,
  };
}
