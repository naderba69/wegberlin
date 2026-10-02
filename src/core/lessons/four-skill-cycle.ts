import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt } from "@/types/learning";
import { germanWords, normalizeGermanWord } from "@/core/pronunciation/word-matching";

export const FOUR_SKILL_CYCLE_POLICY = "adaptive-four-skill-cycle-v2" as const;

export type AdaptiveWritingGoal = {
  minimumWords: number;
  targetWords: string[];
  completeTargetSentence: boolean;
  instructionAr: string;
};

export type AdaptiveWritingValidation = AdaptiveWritingGoal & {
  containsTarget: boolean;
  enoughContext: boolean;
  valid: boolean;
  feedbackAr: string;
};

const levelMinimumContext: Record<FullLesson["level"], number> = {
  A1: 3,
  A2: 4,
  B1: 5,
  B2: 6,
};

export function fourSkillPhraseAttemptId(lessonId: string, phraseIndex: number) {
  return `${lessonId}:four-skill-phrase:${phraseIndex + 1}`;
}

export function completedFourSkillPhraseIndexes(
  lessonId: string,
  phraseCount: number,
  attempts: ExerciseAttempt[],
) {
  const completed = new Set<number>();
  for (let index = 0; index < phraseCount; index += 1) {
    const attemptId = fourSkillPhraseAttemptId(lessonId, index);
    if (attempts.some((attempt) => attempt.lessonId === lessonId && attempt.exerciseId === attemptId && attempt.correct)) completed.add(index);
  }
  return [...completed].sort((left, right) => left - right);
}

export function adaptiveWritingGoal(phrase: string, level: FullLesson["level"]): AdaptiveWritingGoal {
  const targetWords = germanWords(phrase);
  const completeTargetSentence = /[.!?]$/u.test(phrase.trim());
  const minimumWords = completeTargetSentence
    ? Math.max(1, targetWords.length)
    : Math.max(targetWords.length + 1, levelMinimumContext[level]);
  const instructionAr = completeTargetSentence
    ? `اكتب العبارة كاملة في موقف مناسب (${minimumWords} كلمات على الأقل).`
    : `كوّن بها سياقًا جديدًا من ${minimumWords} كلمات على الأقل.`;
  return { minimumWords, targetWords, completeTargetSentence, instructionAr };
}

function containsOrderedPhrase(sourceWords: string[], targetWords: string[]) {
  if (targetWords.length === 0 || sourceWords.length < targetWords.length) return false;
  const source = sourceWords.map(normalizeGermanWord);
  const target = targetWords.map(normalizeGermanWord);
  for (let start = 0; start <= source.length - target.length; start += 1) {
    if (target.every((word, offset) => source[start + offset] === word)) return true;
  }
  return false;
}

export function validateAdaptiveWriting(
  value: string,
  phrase: string,
  level: FullLesson["level"],
): AdaptiveWritingValidation {
  const goal = adaptiveWritingGoal(phrase, level);
  const sourceWords = germanWords(value);
  const containsTarget = containsOrderedPhrase(sourceWords, goal.targetWords);
  const enoughContext = sourceWords.length >= goal.minimumWords;
  const valid = containsTarget && enoughContext;
  const feedbackAr = !value.trim()
    ? goal.instructionAr
    : !containsTarget
      ? "أدرج العبارة الهدف كاملة وبالترتيب نفسه."
      : !enoughContext
        ? `أضف سياقًا مفيدًا؛ المطلوب ${goal.minimumWords} كلمات على الأقل.`
        : "تحقق هدف الكتابة المتكيف. انتقل إلى النطق."
  return { ...goal, containsTarget, enoughContext, valid, feedbackAr };
}
