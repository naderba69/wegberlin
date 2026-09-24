import type { PracticeExercise, Question } from "@/types/lesson-content";

export const LESSON_SHUFFLE_VERSION = "lesson-shuffle-v1" as const;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPermutation(length: number, seed: string) {
  if (!Number.isInteger(length) || length < 0) throw new RangeError("length must be a non-negative integer");
  const order = Array.from({ length }, (_, index) => index);
  const random = randomFromSeed(hashSeed(`${LESSON_SHUFFLE_VERSION}:${seed}`));
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  if (length > 1 && order.every((value, index) => value === index)) order.push(order.shift()!);
  return order;
}

export function shuffledQuestionOptions(question: Question, contextSeed = question.id) {
  const order = seededPermutation(question.options.length, `${contextSeed}:${question.id}`);
  const options = order.map((originalIndex) => ({ label: question.options[originalIndex], originalIndex }));
  return { options, correctPosition: options.findIndex((option) => option.originalIndex === question.correctIndex) };
}

export function shuffledExerciseOptions(exercise: Extract<PracticeExercise, { type: "multiple-choice" }>, contextSeed = exercise.id) {
  const order = seededPermutation(exercise.options.length, `${contextSeed}:${exercise.id}`);
  const options = order.map((originalIndex) => ({ label: exercise.options[originalIndex], originalIndex }));
  return { options, correctPosition: options.findIndex((option) => option.originalIndex === exercise.correctIndex) };
}
