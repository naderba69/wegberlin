import type { FullLesson, Question } from "@/types/lesson-content";
import type { ExerciseAttempt, ListeningFocusId, ListeningProcessEvent, ListeningProcessEventKind } from "@/types/learning";

export const LISTENING_SEQUENCE_POLICY = "three-pass-listening-sequence-v1" as const;
export const LISTENING_SEQUENCE_BOUNDARY = "listening-process-only-no-score-or-mastery" as const;

export const LISTENING_FOCUS_OPTIONS: ReadonlyArray<{ id: ListeningFocusId; de: string; ar: string }> = [
  { id: "people-roles", de: "Personen und Rollen", ar: "الأشخاص والأدوار" },
  { id: "place-time", de: "Ort und Zeit", ar: "المكان والوقت" },
  { id: "message-result", de: "Kernaussage oder Ergebnis", ar: "الفكرة الأساسية أو النتيجة" },
];

export type LessonListeningSequence = {
  policyVersion: typeof LISTENING_SEQUENCE_POLICY;
  lessonId: string;
  before: {
    promptDe: string;
    promptAr: string;
    strategyAr: string;
    focusOptions: typeof LISTENING_FOCUS_OPTIONS;
  };
  during: {
    promptDe: string;
    promptAr: string;
    question: Question;
  };
  after: {
    promptDe: string;
    promptAr: string;
    questions: Question[];
  };
  transcriptUnlockQuestionIds: string[];
};

export function buildLessonListeningSequence(lesson: FullLesson): LessonListeningSequence {
  const [gistQuestion, ...detailQuestions] = lesson.listening.questions;
  if (!gistQuestion || detailQuestions.length === 0) throw new Error(`Lesson ${lesson.id} needs one gist and at least one detail listening question.`);
  return {
    policyVersion: LISTENING_SEQUENCE_POLICY,
    lessonId: lesson.id,
    before: {
      promptDe: `Lesen Sie den Titel „${lesson.listening.titleDe}“. Worauf achten Sie zuerst?`,
      promptAr: "اقرأ العنوان وحدد هدفًا واحدًا قبل تشغيل الصوت. هذا توقع تخطيطي وليس سؤال علامة.",
      strategyAr: lesson.listening.strategyAr,
      focusOptions: LISTENING_FOCUS_OPTIONS,
    },
    during: {
      promptDe: "Hören Sie einmal für die Hauptidee. Beantworten Sie dann nur diese Frage.",
      promptAr: "استمع مرة للفكرة العامة، ثم التزم بجواب هذا السؤال فقط.",
      question: gistQuestion,
    },
    after: {
      promptDe: "Hören Sie noch einmal. Prüfen Sie jetzt die Details.",
      promptAr: "استمع مرة ثانية، ثم أجب عن التفاصيل. لا يظهر النص قبل تثبيت كل الأجوبة.",
      questions: detailQuestions,
    },
    transcriptUnlockQuestionIds: lesson.listening.questions.map((question) => question.id),
  };
}

const eventPhase: Record<ListeningProcessEventKind, ListeningProcessEvent["phase"]> = {
  "focus-committed": "before",
  "playback-started": "during",
  "gist-committed": "during",
  "detail-committed": "after",
};

export function createListeningProcessEvent(input: {
  lessonId: string;
  event: ListeningProcessEventKind;
  focusId?: ListeningFocusId;
  questionId?: string;
  now?: Date;
}): ListeningProcessEvent {
  if (!input.lessonId.trim()) throw new Error("Listening process event requires a lesson ID.");
  if (input.event === "focus-committed" && !input.focusId) throw new Error("A before-listening event requires a focus.");
  if ((input.event === "gist-committed" || input.event === "detail-committed") && !input.questionId) throw new Error("A committed listening answer requires a question ID.");
  if (input.event !== "focus-committed" && input.focusId) throw new Error("Only the before-listening event may carry a focus.");
  const suffix = input.event === "focus-committed" ? "focus" : input.questionId ?? input.event;
  return {
    id: `listening-process:${input.lessonId}:${input.event}:${suffix}`,
    policyVersion: LISTENING_SEQUENCE_POLICY,
    lessonId: input.lessonId,
    phase: eventPhase[input.event],
    event: input.event,
    focusId: input.focusId,
    questionId: input.questionId,
    evidenceBoundary: LISTENING_SEQUENCE_BOUNDARY,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}

export function appendListeningProcessEvent(events: ListeningProcessEvent[], next: ListeningProcessEvent) {
  if (events.some((event) => event.id === next.id)) return events;
  return [...events, next];
}

export function deriveListeningSequenceProgress(
  sequence: LessonListeningSequence,
  events: ListeningProcessEvent[],
  attempts: ExerciseAttempt[],
) {
  const lessonEvents = events.filter((event) => event.lessonId === sequence.lessonId);
  const attemptedIds = new Set(attempts.filter((attempt) => attempt.lessonId === sequence.lessonId).map((attempt) => attempt.exerciseId));
  const legacyListeningAttempt = sequence.transcriptUnlockQuestionIds.some((id) => attemptedIds.has(id));
  const focusEvent = lessonEvents.find((event) => event.event === "focus-committed");
  const preparationComplete = Boolean(focusEvent || legacyListeningAttempt);
  const playbackStarted = preparationComplete && Boolean(lessonEvents.some((event) => event.event === "playback-started") || legacyListeningAttempt);
  const gistCommitted = attemptedIds.has(sequence.during.question.id);
  const detailCommitted = sequence.after.questions.filter((question) => attemptedIds.has(question.id)).length;
  const transcriptUnlocked = sequence.transcriptUnlockQuestionIds.every((id) => attemptedIds.has(id));
  return {
    focusId: focusEvent?.focusId,
    preparationComplete,
    playbackStarted,
    gistCommitted,
    detailCommitted,
    detailTotal: sequence.after.questions.length,
    transcriptUnlocked,
  };
}
