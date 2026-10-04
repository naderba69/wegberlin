import { academicLessons } from "@/data/academic-lessons";
import { independentProductionTask } from "@/data/independent-production-tasks";
import type { LearningState, WritingSubmission } from "@/types/learning";

/**
 * دورة الكتابة الأسبوعية الإلزامية (البند P1-14 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: أدوات الدورة موجودة — مسودة، تحليل، نسخة منقحة، وفروق بين النسخ
 * (`writing-version-diff`) — لكنها **أدوات لا إيقاع**: لا شيء يطالب المتعلّم بإعادة كتابة
 * أسبوعية، ولا شيء يقيس أن الأسبوع مرّ بلا إعادة كتابة. الضرر: المتعلّم يكتب مسودة واحدة
 * ويظنّ أنه «كتب»، ولا يعود إلى نصّه بعد التغذية الراجعة — وهي الخطوة التي يحدث فيها التعلّم
 * الحقيقي في الكتابة.
 *
 * التنفيذ: كل أسبوع (الاثنين–الأحد) له دورة بأربع حالات صريحة، والإعادة **إلزامية** لعدّ
 * الأسبوع مُكتمل الدورة: لا تُعدّ المسودة وحدها إتمامًا، ولا تُعدّ نسخة «منقحة» بلا فرق
 * حقيقي عن أصلها إعادة كتابة. لا درجة ولا نسبة ولا ادّعاء طلاقة — هذا قياس إيقاع.
 */
export const WEEKLY_WRITING_POLICY = "weekly-writing-cycle-v1" as const;
export const WEEKLY_WRITING_BOUNDARY = "cycle-rhythm-evidence-no-grade-no-fluency-claim-and-no-mastery-effect" as const;
export const WEEKLY_WRITING_WINDOW_WEEKS = 8 as const;

export type WeeklyWritingStatus = "not-started" | "draft-only" | "awaiting-rewrite" | "cycle-complete";

export type WeeklyWritingWeek = {
  weekStart: string;
  weekEnd: string;
  labelAr: string;
  status: WeeklyWritingStatus;
  drafts: number;
  submitted: number;
  revised: number;
  /** هل النسخة المنقحة تختلف فعلًا عن أصلها؟ نسخة مطابقة لا تُعدّ إعادة كتابة. */
  revisionChangedText: boolean;
  nextActionAr: string;
  href: string;
};

export type WeeklyWritingCycle = {
  policyVersion: typeof WEEKLY_WRITING_POLICY;
  boundary: typeof WEEKLY_WRITING_BOUNDARY;
  current: WeeklyWritingWeek;
  weeks: WeeklyWritingWeek[];
  completedWeeks: number;
  weeksMeasured: number;
  currentStreak: number;
  longestGapDays: number | null;
  boundaryAr: string;
};

function atLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** حدود الأسبوع (الاثنين–الأحد) كما تُحسب في التخطيط نفسه. */
export function weekBounds(now = new Date()): { weekStart: string; weekEnd: string } {
  const value = atLocalMidnight(now);
  const day = value.getDay();
  const weekStart = addDays(value, -(day === 0 ? 6 : day - 1));
  return { weekStart: localDate(weekStart), weekEnd: localDate(addDays(weekStart, 6)) };
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** أي مهمة كتابة يخصّها هذا الأسبوع؟ مهمة المنهج التالية للدرس الحالي، أو أول مهمة مستقلة متاحة. */
export function weeklyWritingTaskId(state: LearningState): string | null {
  const nextLesson = academicLessons[state.completedLessonIds.at(-1) ?? ""] ?? undefined;
  if (nextLesson?.level) {
    const candidate = Object.values(academicLessons).find((lesson) => lesson.level === nextLesson.level && !state.completedLessonIds.includes(lesson.id));
    if (candidate) return candidate.id;
  }
  const independent = state.completedLessonIds.map((id) => independentProductionTask(id)?.sourceLessonId).find(Boolean);
  return independent ?? state.completedLessonIds.at(-1) ?? null;
}

function submissionDate(submission: WritingSubmission): string | null {
  const at = Date.parse(submission.createdAt);
  return Number.isFinite(at) ? localDate(new Date(at)) : null;
}

function withinWeek(date: string | null, weekStart: string, weekEnd: string): boolean {
  return date !== null && date >= weekStart && date <= weekEnd;
}

function revisionsChanged(submissions: WritingSubmission[]): boolean {
  for (const revision of submissions) {
    if (revision.status !== "revised") continue;
    const source = submissions.find((item) => item.version === revision.sourceVersion && item.taskId === revision.taskId);
    if (!source) continue;
    if (normalize(source.text) !== normalize(revision.text)) return true;
  }
  return false;
}

function nextAction(status: WeeklyWritingStatus): { labelAr: string; href: string } {
  switch (status) {
    case "not-started":
      return { labelAr: "اكتب المسودة الأولى هذا الأسبوع (بلا فتح النموذج قبلها).", href: "/writing" };
    case "draft-only":
      return { labelAr: "أرسل المسودة للتحليل لتحصل على تغذية راجعة محدّدة.", href: "/writing" };
    case "awaiting-rewrite":
      return { labelAr: "أعد الكتابة إلزاميًّا: اكتب نسخة منقحة تستعمل الملاحظات، ثم قارن الفرق مع الأصل.", href: "/writing" };
    case "cycle-complete":
      return { labelAr: "أتممت الدورة: مسودة ← تحليل ← إعادة كتابة ← مقارنة. الأسبوع القادم مهمة جديدة.", href: "/writing/portfolio" };
  }
}

/** يحسب الأسبوع الواحد من سجلّ التسليمات الفعلي، بلا افتراض. */
export function weeklyWritingWeek(state: LearningState, weekStart: string, weekEnd: string, now = new Date()): WeeklyWritingWeek {
  const submissions = state.writingSubmissions.filter((submission) => withinWeek(submissionDate(submission), weekStart, weekEnd));
  const drafts = submissions.filter((submission) => submission.status === "draft").length;
  const submitted = submissions.filter((submission) => submission.status === "submitted").length;
  const revised = submissions.filter((submission) => submission.status === "revised").length;
  const revisionChangedText = revisionsChanged(submissions);
  const status: WeeklyWritingStatus =
    revised > 0 && revisionChangedText ? "cycle-complete" : submitted > 0 || revised > 0 ? "awaiting-rewrite" : drafts > 0 ? "draft-only" : "not-started";
  const current = weekStart === weekBounds(now).weekStart;
  const action = nextAction(current ? status : status === "cycle-complete" ? status : "not-started");
  const labelAr = current ? `هذا الأسبوع (${weekStart} → ${weekEnd})` : `${weekStart} → ${weekEnd}`;
  return { weekStart, weekEnd, labelAr, status, drafts, submitted, revised, revisionChangedText, nextActionAr: action.labelAr, href: action.href };
}

const STATUS_LABELS_AR: Record<WeeklyWritingStatus, string> = {
  "not-started": "لم تبدأ",
  "draft-only": "مسودة فقط",
  "awaiting-rewrite": "بانتظار إعادة الكتابة",
  "cycle-complete": "دورة مكتملة",
};

export function weeklyWritingStatusLabel(status: WeeklyWritingStatus): string {
  return STATUS_LABELS_AR[status];
}

export function weeklyWritingCycle(state: LearningState, now = new Date(), windowWeeks = WEEKLY_WRITING_WINDOW_WEEKS): WeeklyWritingCycle {
  const bounds = weekBounds(now);
  const start = new Date(`${bounds.weekStart}T00:00:00`);
  const weeks: WeeklyWritingWeek[] = [];
  for (let index = windowWeeks - 1; index >= 0; index -= 1) {
    const weekStart = localDate(addDays(start, -7 * index));
    const weekEnd = localDate(addDays(new Date(`${weekStart}T00:00:00`), 6));
    weeks.push(weeklyWritingWeek(state, weekStart, weekEnd, now));
  }
  const ordered = [...weeks].sort((left, right) => left.weekStart.localeCompare(right.weekStart));
  let currentStreak = 0;
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    if (ordered[index].status === "cycle-complete") currentStreak += 1;
    else break;
  }
  const completeDates = ordered.filter((week) => week.status === "cycle-complete").map((week) => week.weekStart);
  let longestGapDays: number | null = null;
  const chain = [bounds.weekStart, ...completeDates];
  const sorted = chain.sort().reverse();
  for (let index = 0; index + 1 < sorted.length; index += 1) {
    const gap = Math.round((Date.parse(`${sorted[index]}T00:00:00`) - Date.parse(`${sorted[index + 1]}T00:00:00`)) / 86_400_000);
    longestGapDays = longestGapDays === null ? gap : Math.max(longestGapDays, gap);
  }
  return {
    policyVersion: WEEKLY_WRITING_POLICY,
    boundary: WEEKLY_WRITING_BOUNDARY,
    current: weeks[weeks.length - 1],
    weeks: ordered,
    completedWeeks: completeDates.length,
    weeksMeasured: weeks.length,
    currentStreak,
    longestGapDays,
    boundaryAr: "هذا قياس إيقاع أسبوعي من السجلّ المحلي: لا درجة كتابة، ولا ادعاء طلاقة أو مستوى، ولا أثر في الإتقان أو بوابات الانتقال. النسخة المطابقة لأصلها لا تُعدّ إعادة كتابة.",
  };
}

/** يلخّص سجل الدورة لملف الأعمال: آخر أسبوع مكتمل وعدد الأسابيع المكتملة. */
export function weeklyWritingSummary(state: LearningState, now = new Date()): { completedWeeks: number; requiredNow: boolean; statusAr: string } {
  const cycle = weeklyWritingCycle(state, now);
  return {
    completedWeeks: cycle.completedWeeks,
    requiredNow: cycle.current.status !== "cycle-complete",
    statusAr: `إيقاع ${cycle.completedWeeks}/${cycle.weeksMeasured} أسبوعًا مكتمل الدورة · هذا الأسبوع: ${weeklyWritingStatusLabel(cycle.current.status)}`,
  };
}
