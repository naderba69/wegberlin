import { reviewCards } from "@/data/review-cards";
import type { LearningState, ReviewItem } from "@/types/learning";
import type { LessonSrsCard } from "./lesson-cards";

export type QueuedReviewCard = {
  card: LessonSrsCard;
  review: ReviewItem | undefined;
  dueAt: string;
  isNew: boolean;
};

function lessonIdOf(card: LessonSrsCard) {
  return card.tags.find((tag) => /^[ab][12]-\d{2}$/i.test(tag));
}

export function eligibleReviewCards(state: LearningState) {
  const completed = new Set(state.completedLessonIds);
  return reviewCards.filter((card) => {
    const lessonId = lessonIdOf(card);
    return Boolean(lessonId && completed.has(lessonId));
  });
}

export function buildDueReviewQueue(state: LearningState, now = new Date()): QueuedReviewCard[] {
  const reviewByCard = new Map(state.reviewItems.map((item) => [item.cardId, item]));
  return eligibleReviewCards(state)
    .map((card) => {
      const review = reviewByCard.get(card.id);
      return { card, review, dueAt: review?.nextReviewDate ?? new Date(0).toISOString(), isNew: !review };
    })
    .filter((item) => Date.parse(item.dueAt) <= now.getTime())
    .sort((left, right) => {
      if (left.isNew !== right.isNew) return left.isNew ? 1 : -1;
      return Date.parse(left.dueAt) - Date.parse(right.dueAt) || left.card.id.localeCompare(right.card.id);
    });
}

export function nextScheduledReviewDate(state: LearningState, now = new Date()) {
  const reviewByCard = new Map(state.reviewItems.map((item) => [item.cardId, item]));
  const future = eligibleReviewCards(state)
    .map((card) => reviewByCard.get(card.id)?.nextReviewDate)
    .filter((date): date is string => typeof date === "string" && Date.parse(date) > now.getTime())
    .sort((left, right) => Date.parse(left) - Date.parse(right));
  return future[0];
}
