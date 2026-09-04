import type { ReviewItem } from "@/types/learning";

export const REVIEW_CALENDAR_POLICY_VERSION = "review-calendar-v1" as const;
export type ReviewCalendarPolicy = {
  timeZone: string;
  reviewHourLocal?: number;
};
export const DEFAULT_REVIEW_CALENDAR_POLICY: Required<ReviewCalendarPolicy> = {
  timeZone: "UTC",
  reviewHourLocal: 0,
};

type CalendarParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function validatedPolicy(policy: ReviewCalendarPolicy): Required<ReviewCalendarPolicy> {
  const reviewHourLocal = policy.reviewHourLocal ?? 0;
  if (!Number.isInteger(reviewHourLocal) || reviewHourLocal < 0 || reviewHourLocal > 23) throw new RangeError("reviewHourLocal must be an integer from 0 to 23");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: policy.timeZone }).format(new Date(0));
  } catch {
    throw new RangeError(`invalid IANA timezone: ${policy.timeZone}`);
  }
  return { timeZone: policy.timeZone, reviewHourLocal };
}

export function calendarPartsAt(date: Date, timeZone: string): CalendarParts {
  const formatter = new Intl.DateTimeFormat("en-US-u-hc-h23", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function zonedDateTimeToUtc(target: CalendarParts, timeZone: string) {
  const targetAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
  let guess = targetAsUtc;
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const represented = calendarPartsAt(new Date(guess), timeZone);
    const representedAsUtc = Date.UTC(represented.year, represented.month - 1, represented.day, represented.hour, represented.minute, represented.second);
    const correction = targetAsUtc - representedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess);
}

export function scheduledReviewDate(now: Date, intervalDays: number, inputPolicy: ReviewCalendarPolicy = DEFAULT_REVIEW_CALENDAR_POLICY) {
  if (!Number.isInteger(intervalDays) || intervalDays < 1) throw new RangeError("intervalDays must be a positive integer");
  const policy = validatedPolicy(inputPolicy);
  const localNow = calendarPartsAt(now, policy.timeZone);
  const shifted = new Date(Date.UTC(localNow.year, localNow.month - 1, localNow.day + intervalDays));
  return zonedDateTimeToUtc({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: policy.reviewHourLocal,
    minute: 0,
    second: 0,
  }, policy.timeZone);
}

export function calculateSM2(item: ReviewItem, grade: number, now = new Date(), inputPolicy: ReviewCalendarPolicy = DEFAULT_REVIEW_CALENDAR_POLICY): ReviewItem {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) throw new RangeError("grade must be an integer from 0 to 5");
  const policy = validatedPolicy(inputPolicy);
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
  return {
    ...item,
    repetitions,
    interval,
    easeFactor,
    lastGrade: grade,
    nextReviewDate: scheduledReviewDate(now, interval, policy).toISOString(),
    algorithmVersion: "sm2-v2-calendar",
    calendarPolicyVersion: REVIEW_CALENDAR_POLICY_VERSION,
    calendarTimeZone: policy.timeZone,
    reviewHourLocal: policy.reviewHourLocal,
  };
}

export function newReviewItem(cardId: string, now = new Date()): ReviewItem {
  return { id: `review-${cardId}`, cardId, repetitions: 0, interval: 0, easeFactor: 2.5, nextReviewDate: now.toISOString(), algorithmVersion: "sm2-v2-calendar", calendarPolicyVersion: REVIEW_CALENDAR_POLICY_VERSION, calendarTimeZone: "UTC", reviewHourLocal: 0 };
}
