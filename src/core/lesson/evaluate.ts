import type { PracticeExercise } from "@/types/lesson-content";

export function normalizeGermanText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("de-DE").replace(/[.!?،,:;„“"']/gu, "").replace(/\s+/gu, " ");
}

export function compareAccepted(value: string, accepted: string[]): boolean {
  const normalized = normalizeGermanText(value);
  return accepted.some((answer)=>normalizeGermanText(answer)===normalized);
}

export function evaluateExercise(exercise: PracticeExercise, answer: string | number | Record<string,string>): boolean {
  if (exercise.type === "multiple-choice") return typeof answer === "number" && answer === exercise.correctIndex;
  if (exercise.type === "matching") {
    if (typeof answer !== "object" || answer === null) return false;
    return exercise.pairs.every((pair)=>answer[pair.left]===pair.right);
  }
  if (typeof answer !== "string") return false;
  if (exercise.type === "error-correction" && exercise.orthographyPolicy) {
    const normalize = (text: string) => {
      let value = text.normalize("NFKC").trim().replace(/\s+/gu, " ");
      if (exercise.orthographyPolicy === "punctuation-sensitive") value = value.toLocaleLowerCase("de-DE");
      if (exercise.orthographyPolicy === "case-sensitive") value = value.replace(/[.!?،,:;„“"']/gu, "");
      return value;
    };
    return exercise.acceptedAnswers.some((accepted) => normalize(answer) === normalize(accepted));
  }
  return compareAccepted(answer, exercise.acceptedAnswers);
}
