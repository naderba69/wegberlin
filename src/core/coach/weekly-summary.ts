import type { LearningState } from "@/types/learning";
import { weeklyReflectionBounds } from "./weekly-reflection";

export const WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION = "weekly-evidence-summary-v1" as const;
export const WEEKLY_EVIDENCE_SUMMARY_BOUNDARY =
  "factual-local-counts-no-score-no-mastery-no-level-claim-no-written-or-spoken-text" as const;

/**
 * ملخص أسبوعي وقائعي يُحسب محليًا من السجلات المؤرّخة فقط.
 * لا يحوّل النشاط إلى درجة ولا إتقان ولا مستوى، ولا يعرض نص المتعلم.
 * الكتابة والكلام الحر لا يحملان توقيتًا في السجل، فلا يُحسبان أسبوعيًا، وهذا مذكور صراحةً.
 */
export interface WeeklyEvidenceSummary {
  policyVersion: typeof WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION;
  boundary: typeof WEEKLY_EVIDENCE_SUMMARY_BOUNDARY;
  weekStart: string;
  weekEnd: string;
  studyDays: number;
  activeMinutes: number;
  rescueDays: number;
  planningSignals: { tooEasy: number; tooHard: number };
  averages: { energy: number | null; difficulty: number | null; confidence: number | null };
  receptionAttempts: number;
  writingBenchmarks: number;
  reflectionSaved: boolean;
  previousWeek: { studyDays: number; activeMinutes: number };
  untimedRecords: { writingSubmissions: number; speakingAttempts: number };
}

function localDateOf(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inRange(date: string | null, start: string, end: string): boolean {
  return date !== null && date >= start && date <= end;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function sessionsIn(state: LearningState, start: string, end: string) {
  return Object.entries(state.dailySessions ?? {})
    .filter(([date]) => date >= start && date <= end)
    .map(([, record]) => record);
}

function countsAsStudyDay(record: { activeSeconds?: number; difficultyAfter?: number }): boolean {
  return (record.activeSeconds ?? 0) > 0 || record.difficultyAfter !== undefined;
}

function studyStats(state: LearningState, start: string, end: string) {
  const sessions = sessionsIn(state, start, end);
  const studied = sessions.filter(countsAsStudyDay);
  return {
    studyDays: studied.length,
    activeMinutes: Math.round(sessions.reduce((sum, record) => sum + (record.activeSeconds ?? 0), 0) / 60),
  };
}

export function buildWeeklyEvidenceSummary(state: LearningState, now = new Date()): WeeklyEvidenceSummary {
  const bounds = weeklyReflectionBounds(now);
  const { weekStart, weekEnd } = bounds;
  const previousBounds = weeklyReflectionBounds(addDays(now, -7));
  const sessions = sessionsIn(state, weekStart, weekEnd);
  const stats = studyStats(state, weekStart, weekEnd);
  const previous = studyStats(state, previousBounds.weekStart, previousBounds.weekEnd);

  const timed = (items: Array<{ createdAt?: string }>) =>
    items.filter((item) => inRange(item.createdAt ? localDateOf(item.createdAt) : null, weekStart, weekEnd)).length;

  const receptionAttempts =
    timed(state.dictationAttempts ?? []) +
    timed(state.readingBenchmarkAttempts ?? []) +
    timed(state.pronunciationContrastAttempts ?? []) +
    timed(state.prosodyRhythmAttempts ?? []);

  return {
    policyVersion: WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION,
    boundary: WEEKLY_EVIDENCE_SUMMARY_BOUNDARY,
    weekStart,
    weekEnd,
    studyDays: stats.studyDays,
    activeMinutes: stats.activeMinutes,
    rescueDays: sessions.filter((record) => record.rescueMode !== undefined).length,
    planningSignals: {
      tooEasy: sessions.filter((record) => record.planningSignal === "too-easy").length,
      tooHard: sessions.filter((record) => record.planningSignal === "too-hard").length,
    },
    averages: {
      energy: mean(sessions.map((record) => record.energyBefore)),
      difficulty: mean(sessions.flatMap((record) => (record.difficultyAfter === undefined ? [] : [record.difficultyAfter]))),
      confidence: mean(sessions.flatMap((record) => (record.confidenceAfter === undefined ? [] : [record.confidenceAfter]))),
    },
    receptionAttempts,
    writingBenchmarks: timed(state.writingBenchmarkAttempts ?? []),
    reflectionSaved: (state.weeklyReflections ?? []).some((item) => item.id === `weekly-reflection-${weekStart}`),
    previousWeek: { studyDays: previous.studyDays, activeMinutes: previous.activeMinutes },
    untimedRecords: {
      writingSubmissions: state.writingSubmissions?.length ?? 0,
      speakingAttempts: state.speakingAttempts?.length ?? 0,
    },
  };
}

/** Arabic sentence for the learner. Describes counts only; never a score or a level. */
export function weeklySummarySentence(summary: WeeklyEvidenceSummary): string {
  if (summary.studyDays === 0 && summary.receptionAttempts === 0 && summary.writingBenchmarks === 0) {
    return "لم تُسجَّل جلسات هذا الأسبوع بعد. ابدأ بأي مهمة صغيرة، ولا حاجة إلى أسبوع مثالي.";
  }
  const delta = summary.studyDays - summary.previousWeek.studyDays;
  const compare = delta > 0 ? "أكثر من الأسبوع الماضي" : delta < 0 ? "أقل من الأسبوع الماضي" : "بقدر الأسبوع الماضي";
  return `درست في ${summary.studyDays} أيام هذا الأسبوع، ${compare}. هذا عدد أيام فقط، وليس مؤشرًا على الإتقان.`;
}
