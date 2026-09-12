import type { LearningState } from "@/types/learning";

export const CONTINUITY_POLICY_VERSION = "weekly-grace-v1" as const;

export function localCalendarDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function atLocalMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function studiedDates(state: LearningState) {
  return new Set(state.studyHistory.filter((day) => day.minutes > 0 || day.evidenceCount > 0).map((day) => day.date));
}

export type ContinuityStreak = {
  studiedDays: number;
  calendarSpanDays: number;
  graceDayDate: string | null;
  policyVersion: typeof CONTINUITY_POLICY_VERSION;
};

export function buildContinuityStreak(state: LearningState, now = new Date()): ContinuityStreak {
  const studied = studiedDates(state);
  let cursor = atLocalMidnight(now);
  if (!studied.has(localCalendarDate(cursor))) cursor = addLocalDays(cursor, -1); // today is still open and never consumes grace
  let studiedDays = 0;
  let calendarSpanDays = 0;
  let graceDayDate: string | null = null;

  for (let scanned = 0; scanned < 366; scanned += 1) {
    const date = localCalendarDate(cursor);
    if (studied.has(date)) {
      studiedDays += 1;
      calendarSpanDays += 1;
      cursor = addLocalDays(cursor, -1);
      continue;
    }
    const previousDate = localCalendarDate(addLocalDays(cursor, -1));
    const canBridgeOneDay = studiedDays > 0 && graceDayDate === null && studied.has(previousDate);
    if (!canBridgeOneDay) break;
    graceDayDate = date;
    calendarSpanDays += 1;
    cursor = addLocalDays(cursor, -1);
  }

  return { studiedDays, calendarSpanDays, graceDayDate, policyVersion: CONTINUITY_POLICY_VERSION };
}

export function weeklyGraceCandidate(dates: Array<{ date: string; status: string }>) {
  return [...dates].reverse().find((day) => day.status === "missed")?.date ?? null;
}
