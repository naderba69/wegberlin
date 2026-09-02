import type { LearningState, ReviewEvent } from "@/types/learning";
import type { QueuedReviewCard } from "./review-queue";
import { buildDueReviewQueue } from "./review-queue";
import { calculateSM2, newReviewItem } from "./sm2";

export const DELAYED_RETENTION_CARD_THRESHOLD = 4;

function lessonIdOf(queueItem: QueuedReviewCard) {
  return queueItem.card.tags.find((tag) => /^[ab][12]-\d{2}$/i.test(tag)) ?? queueItem.card.tags[1] ?? "unknown";
}

export function applyReviewGrade(state: LearningState, queued: QueuedReviewCard, grade: number, now = new Date(), eventId = `review-event-${crypto.randomUUID()}`) {
  const previous = queued.review ?? newReviewItem(queued.card.id, now);
  const nextReview = calculateSM2(previous, grade, now);
  const delayed = !queued.isNew && Date.parse(queued.dueAt) <= now.getTime();
  const masteryDelta = delayed && grade >= 3 ? 4 : 0;
  const lessonId = lessonIdOf(queued);
  const event: ReviewEvent = {
    id: eventId,
    cardId: queued.card.id,
    lessonId,
    grade,
    evidenceKind: delayed ? "delayed" : "initial",
    scheduledFor: queued.dueAt,
    reviewedAt: now.toISOString(),
    masteryDelta,
  };
  const withReview: LearningState = {
    ...state,
    reviewItems: [...state.reviewItems.filter((item) => item.cardId !== queued.card.id), nextReview],
    reviewEvents: [...state.reviewEvents, event],
    mastery: masteryDelta ? { ...state.mastery, [lessonId]: Math.min(100, (state.mastery[lessonId] ?? 0) + masteryDelta) } : state.mastery,
  };
  return {
    state: { ...withReview, dueReviews: buildDueReviewQueue(withReview, now).length },
    nextReview,
    event,
  };
}

function latestDelayedByCard(events: ReviewEvent[]) {
  const latest = new Map<string, ReviewEvent>();
  for (const event of events.filter((item) => item.evidenceKind === "delayed")) {
    const previous = latest.get(event.cardId);
    if (!previous || Date.parse(event.reviewedAt) >= Date.parse(previous.reviewedAt)) latest.set(event.cardId, event);
  }
  return latest;
}

export function retentionEvidence(state: LearningState) {
  const delayedLatest = latestDelayedByCard(state.reviewEvents);
  const successfulDelayed = [...delayedLatest.values()].filter((event) => event.grade >= 3);
  const byLesson = new Map<string, Set<string>>();
  for (const event of successfulDelayed) {
    const cards = byLesson.get(event.lessonId) ?? new Set<string>();
    cards.add(event.cardId);
    byLesson.set(event.lessonId, cards);
  }
  return {
    initialReviewEvents: state.reviewEvents.filter((event) => event.evidenceKind === "initial").length,
    delayedReviewEvents: state.reviewEvents.filter((event) => event.evidenceKind === "delayed").length,
    successfulDelayedCards: successfulDelayed.length,
    confirmedLessonIds: [...byLesson.entries()].filter(([, cards]) => cards.size >= DELAYED_RETENTION_CARD_THRESHOLD).map(([lessonId]) => lessonId),
    delayedCardsByLesson: Object.fromEntries([...byLesson.entries()].map(([lessonId, cards]) => [lessonId, cards.size])),
  };
}

export function lessonRetentionStatus(state: LearningState, lessonId: string) {
  if (!state.completedLessonIds.includes(lessonId)) return { status: "not-completed" as const, delayedCards: 0, required: DELAYED_RETENTION_CARD_THRESHOLD };
  const evidence = retentionEvidence(state);
  const delayedCards = evidence.delayedCardsByLesson[lessonId] ?? 0;
  if (delayedCards >= DELAYED_RETENTION_CARD_THRESHOLD) return { status: "delayed-confirmed" as const, delayedCards, required: DELAYED_RETENTION_CARD_THRESHOLD };
  if (state.reviewEvents.some((event) => event.lessonId === lessonId)) return { status: "building" as const, delayedCards, required: DELAYED_RETENTION_CARD_THRESHOLD };
  return { status: "initial-only" as const, delayedCards, required: DELAYED_RETENTION_CARD_THRESHOLD };
}
