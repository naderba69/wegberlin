import type { CEFRLevel, LearningState } from "@/types/learning";
import { academicLessonList } from "@/data/academic-lessons";

/**
 * خطة زمنية صادقة: كم يلزمك فعلًا لبلوغ مستواك الهدف، بالنظر إلى وقتك اليومي والمحتوى الباقي.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البند P0-10): المنهج 96 درسًا ≈ 70–80 ساعة
 * موجّهة، بينما الأدبيات تضع B1 عند 350–650 ساعة وB2 عند 500–700+. لا شيء في التطبيق كان
 * يقول للمتعلّم هذه الحقيقة عند اختيار وقت يومي أو تاريخ امتحان، فيَعِد نفسه بمستحيل ثم يلوم
 * نفسه. هذه الوحدة تحسب المتوقّع من بيانات الدروس نفسها، وتفصل بصراحة بين «إتمام الدروس» و
 * «بلوغ المستوى»، ولا تعطي وعدًا.
 */
export const TIME_BUDGET_POLICY = "honest-time-budget-v1" as const;
export const TIME_BUDGET_BOUNDARY = "curriculum-completion-and-guided-hour-ranges-no-guarantee-no-cefr-award" as const;
export const REVIEW_OVERHEAD_RATIO = 0.35 as const;

/** ساعات موجّهة تراكمية من الصفر إلى المستوى، من نطاقات الأدبيات الشائعة (لا وعد فردي). */
export const CEFR_GUIDED_HOURS: Record<CEFRLevel, { min: number; max: number }> = {
  A1: { min: 80, max: 120 },
  A2: { min: 180, max: 240 },
  B1: { min: 350, max: 650 },
  B2: { min: 500, max: 800 },
};

export type TargetVerdict = {
  feasible: boolean;
  daysLeft: number;
  requiredDailyMinutes: number;
  messageAr: string;
};

export type TimeBudget = {
  policyVersion: typeof TIME_BUDGET_POLICY;
  boundary: typeof TIME_BUDGET_BOUNDARY;
  dailyMinutes: number;
  weeklyMinutes: number;
  requestedLevel: CEFRLevel;
  levelAlreadyClaimed: boolean;
  remainingLessons: number;
  lessonMinutes: number;
  curriculumWeeks: number;
  curriculumMonths: number;
  guidedHours: { min: number; max: number; fromLevel: CEFRLevel | "start" };
  guidedWeeks: { min: number; max: number };
  guidedMonths: { min: number; max: number };
  gapFactor: number;
  verdict?: TargetVerdict;
  boundaryAr: string;
};

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

function priorGuidedHours(level: CEFRLevel) {
  const index = LEVEL_ORDER.indexOf(level);
  if (index <= 0) return { min: 0, max: 0 };
  return CEFR_GUIDED_HOURS[LEVEL_ORDER[index - 1]];
}

export function buildTimeBudget(state: LearningState, now = new Date()): TimeBudget {
  const profile = state.profile;
  const dailyMinutes = profile?.dailyMinutes ?? 30;
  const requestedLevel: CEFRLevel = profile?.currentLevel ?? "A1";
  const completed = new Set(state.completedLessonIds);
  const targetIndex = LEVEL_ORDER.indexOf(requestedLevel);
  const relevant = academicLessonList.filter((lesson) => LEVEL_ORDER.indexOf(lesson.level as CEFRLevel) <= targetIndex);
  const remaining = relevant.filter((lesson) => !completed.has(lesson.id));
  const lessonMinutes = remaining.reduce((sum, lesson) => sum + (lesson.estimatedMinutes ?? 0), 0);
  const weeklyMinutes = dailyMinutes * 7;
  const withOverhead = lessonMinutes * (1 + REVIEW_OVERHEAD_RATIO);

  const guidedMin = Math.max(0, CEFR_GUIDED_HOURS[requestedLevel].min - priorGuidedHours(requestedLevel).min);
  const guidedMax = Math.max(0, CEFR_GUIDED_HOURS[requestedLevel].max - priorGuidedHours(requestedLevel).max);
  const guidedWeeks = { min: Math.ceil((guidedMin * 60) / weeklyMinutes), max: Math.ceil((guidedMax * 60) / weeklyMinutes) };

  const targetDate = profile?.targetDate;
  let verdict: TargetVerdict | undefined;
  if (targetDate) {
    const daysLeft = Math.floor((Date.parse(targetDate) - now.getTime()) / 86_400_000);
    const requiredDailyMinutes = daysLeft > 0 ? Math.ceil((guidedMin * 60) / daysLeft) : Number.POSITIVE_INFINITY;
    const feasible = daysLeft > 0 && requiredDailyMinutes <= dailyMinutes;
    verdict = {
      feasible,
      daysLeft,
      requiredDailyMinutes,
      messageAr:
        daysLeft <= 0
          ? "تاريخ الهدف مضى أو اليوم نفسه؛ حدّث التاريخ في ملفك لنحسب الخطة من جديد."
          : feasible
            ? `تاريخك متسق مع الحد الأدنى الموجّه: تحتاج نحو ${requiredDailyMinutes} دقيقة يوميًا وهذه داخل وقتك المختار. تذكّر أن الساعات الموجّهة نطاق إحصائي لا وعد.`
            : `تاريخك يحتاج نحو ${requiredDailyMinutes} دقيقة يوميًا كحدٍّ أدنى موجّه، فوق وقتك الحالي (${dailyMinutes}). إمّا نمدّد التاريخ أو نرفع الوقت اليومي؛ لا نَعدك بالمستوى بالوقت الحالي.`,
    };
  }

  return {
    policyVersion: TIME_BUDGET_POLICY,
    boundary: TIME_BUDGET_BOUNDARY,
    dailyMinutes,
    weeklyMinutes,
    requestedLevel,
    levelAlreadyClaimed: (state.mastery[`level-${requestedLevel.toLowerCase()}-ready`] ?? 0) >= 100,
    remainingLessons: remaining.length,
    lessonMinutes,
    curriculumWeeks: Math.ceil(withOverhead / weeklyMinutes),
    curriculumMonths: Math.round((withOverhead / (weeklyMinutes * 4.345)) * 10) / 10,
    guidedHours: { min: guidedMin, max: guidedMax, fromLevel: requestedLevel === "A1" ? "start" : LEVEL_ORDER[LEVEL_ORDER.indexOf(requestedLevel) - 1] },
    guidedWeeks,
    guidedMonths: { min: Math.round((guidedWeeks.min / 4.345) * 10) / 10, max: Math.round((guidedWeeks.max / 4.345) * 10) / 10 },
    gapFactor: guidedMin > 0 ? Math.round((guidedMin * 60) / Math.max(withOverhead, 1) * 10) / 10 : 0,
    verdict,
    boundaryAr: "الحساب من `estimatedMinutes` لكل درس + 35% مراجعة، مقابل نطاقات ساعات موجّهة من الأدبيات. لا يمنح هذا الحساب مستوى، ولا يستبدل امتحانًا معترفًا، ولا يراعي الفروق الفردية.",
  };
}
