import type { FullLesson, PracticeExercise, Question } from "@/types/lesson-content";
import type { AnswerConfidence, ErrorRecord } from "@/types/learning";
import { classifyErrorRecord } from "./pattern";

function exerciseExpected(exercise: PracticeExercise) {
  if (exercise.type === "multiple-choice") return exercise.options[exercise.correctIndex];
  if (exercise.type === "matching") return exercise.pairs.map((pair) => `${pair.left} → ${pair.right}`).join("; ");
  return exercise.acceptedAnswers[0];
}

function matchingCorrection(exercise: Extract<PracticeExercise, { type: "matching" }>, answer: string) {
  try {
    const selected = JSON.parse(answer) as Record<string, string>;
    const mismatch = exercise.pairs.find((pair) => selected[pair.left] !== pair.right);
    if (mismatch) return { wrong: `${mismatch.left} → ${selected[mismatch.left] || "—"}`, correct: `${mismatch.left} → ${mismatch.right}` };
  } catch {
    // Keep the readable fallback below for malformed legacy attempts.
  }
  return { wrong: answer.trim() || "—", correct: exerciseExpected(exercise) };
}

function exerciseErrorType(exercise: PracticeExercise): ErrorRecord["type"] {
  if (exercise.type === "word-ordering") return "word-order";
  if (exercise.type === "error-correction") return "grammar";
  return "vocabulary";
}

function upsertError(errors: ErrorRecord[], next: Omit<ErrorRecord, "occurrences">) {
  const existing = errors.find((error) => error.id === next.id);
  if (!existing) {
    const created = classifyErrorRecord({ ...next, occurrences: 1, highConfidenceWrongCount: next.lastConfidence === "high" ? 1 : 0, repairCount: next.repairCount ?? 0 });
    return [...errors, created];
  }
  return errors.map((error) => {
    if (error.id !== next.id) return error;
    return classifyErrorRecord({
      ...error,
      ...next,
      occurrences: error.occurrences + 1,
      highConfidenceWrongCount: (error.highConfidenceWrongCount ?? 0) + (next.lastConfidence === "high" ? 1 : 0),
      resolved: false,
      repairCount: 0,
      lastRepairedAt: undefined,
      nextReviewAt: undefined,
      confirmedAt: undefined,
    });
  });
}

export function captureLessonError(
  errors: ErrorRecord[],
  lesson: FullLesson,
  exerciseId: string,
  answer: string,
  now = new Date(),
  confidence?: AnswerConfidence,
): ErrorRecord[] {
  const exercise = lesson.exercises.find((item) => item.id === exerciseId);
  if (exercise) {
    const correction = exercise.type === "matching" ? matchingCorrection(exercise, answer) : { wrong: answer.trim() || "—", correct: exerciseExpected(exercise) };
    return upsertError(errors, {
      id: `lesson-error:${lesson.id}:${exercise.id}`,
      type: exerciseErrorType(exercise),
      wrong: correction.wrong,
      correct: correction.correct,
      explanationAr: exercise.explanationAr,
      lastSeenAt: now.toISOString(),
      sourceLessonId: lesson.id,
      sourceExerciseId: exercise.id,
      lastConfidence: confidence,
      resolved: false,
    });
  }

  const questions: Question[] = [...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest];
  const question = questions.find((item) => item.id === exerciseId);
  if (!question) return errors;
  return upsertError(errors, {
    id: `lesson-error:${lesson.id}:${question.id}`,
    type: "vocabulary",
    wrong: answer.trim() || "—",
    correct: question.options[question.correctIndex],
    explanationAr: question.explanationAr,
    lastSeenAt: now.toISOString(),
    sourceLessonId: lesson.id,
    sourceExerciseId: question.id,
    lastConfidence: confidence,
    resolved: false,
  });
}
