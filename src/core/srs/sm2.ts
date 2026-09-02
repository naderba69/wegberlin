import type { ReviewItem } from "@/types/learning";

export function calculateSM2(item: ReviewItem, grade: number, now = new Date()): ReviewItem {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) throw new RangeError("grade must be an integer from 0 to 5");
  let { repetitions, interval, easeFactor } = item;
  if (grade >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * easeFactor));
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + interval);
  return { ...item, repetitions, interval, easeFactor, lastGrade: grade, nextReviewDate: next.toISOString(), algorithmVersion: "sm2-v1" };
}

export function newReviewItem(cardId: string, now = new Date()): ReviewItem {
  return { id: `review-${cardId}`, cardId, repetitions: 0, interval: 0, easeFactor: 2.5, nextReviewDate: now.toISOString(), algorithmVersion: "sm2-v1" };
}
