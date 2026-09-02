import type { DailySessionRecord, LearnerProfile, LearningState, SessionNextFocus } from "@/types/learning";

export function localSessionDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function saveDailyCheckIn(
  state: LearningState,
  input: { availableMinutes: LearnerProfile["dailyMinutes"]; energyBefore: DailySessionRecord["energyBefore"] },
  now = new Date(),
): LearningState {
  const date = localSessionDate(now);
  const previous = state.dailySessions[date];
  return {
    ...state,
    dailySessions: {
      ...state.dailySessions,
      [date]: {
        ...previous,
        date,
        availableMinutes: input.availableMinutes,
        energyBefore: input.energyBefore,
        checkedInAt: now.toISOString(),
      },
    },
  };
}

export function saveDailyReflection(
  state: LearningState,
  input: {
    difficultyAfter: NonNullable<DailySessionRecord["difficultyAfter"]>;
    confidenceAfter: NonNullable<DailySessionRecord["confidenceAfter"]>;
    reflection: string;
    nextFocus: SessionNextFocus;
  },
  now = new Date(),
): LearningState {
  const date = localSessionDate(now);
  const previous = state.dailySessions[date] ?? {
    date,
    availableMinutes: state.profile?.dailyMinutes ?? 45,
    energyBefore: 3 as const,
    checkedInAt: now.toISOString(),
  };
  return {
    ...state,
    dailySessions: {
      ...state.dailySessions,
      [date]: {
        ...previous,
        difficultyAfter: input.difficultyAfter,
        confidenceAfter: input.confidenceAfter,
        reflection: input.reflection.trim().slice(0, 1000),
        nextFocus: input.nextFocus,
        reflectedAt: now.toISOString(),
      },
    },
  };
}

export function latestSessionBefore(state: LearningState, date = localSessionDate()): DailySessionRecord | undefined {
  return Object.values(state.dailySessions)
    .filter((session) => session.date < date && session.reflectedAt)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
}

export function effectiveSessionMinutes(state: LearningState, now = new Date()): LearnerProfile["dailyMinutes"] {
  const date = localSessionDate(now);
  const today = state.dailySessions[date];
  const configured = today?.availableMinutes ?? state.profile?.dailyMinutes ?? 45;
  const previous = latestSessionBefore(state, date);
  const shouldReduce = (today?.energyBefore ?? 3) <= 2 || (!today && previous?.nextFocus === "lighter");
  return (shouldReduce ? Math.min(configured, 20) : configured) as LearnerProfile["dailyMinutes"];
}

export function nextFocusLabel(focus: SessionNextFocus): string {
  return focus === "review" ? "ابدأ بالمراجعة والاسترجاع قبل محتوى جديد."
    : focus === "lighter" ? "ابدأ بجلسة أخف لا تتجاوز عشرين دقيقة ما لم تغيّر وقتك."
      : focus === "production" ? "أعطِ مهمة الكتابة أو الكلام أولوية في الجلسة التالية."
        : "واصل أول هدف غير مكتمل مع إبقاء المراجعة والإنتاج في الجلسة.";
}
