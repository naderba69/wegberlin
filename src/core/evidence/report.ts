import { academicLessonList } from "@/data/academic-lessons";
import type { LearningState } from "@/types/learning";
import { buildContinuityStreak } from "@/core/coach/continuity";
import { buildDueReviewQueue, eligibleReviewCards } from "@/core/srs/review-queue";
import { errorRepairState } from "@/core/errors/remediation";
import { buildErrorClinics } from "@/core/errors/clinic";
import { retentionEvidence } from "@/core/srs/review-session";
import { buildNoveltyWeightedEvidence, MASTERY_WEIGHTING_VERSION } from "./mastery-weighting";
import { classifyErrorPattern } from "@/core/errors/pattern";
import { confirmedErrorSrsCards } from "@/core/srs/error-cards";
import { evidenceFreshness, EVIDENCE_FRESHNESS_POLICY } from "./freshness";
import { summarizeSupportUsage } from "./support-usage";
import { governanceForRisk } from "@/config/content-governance-registry";
import { buildAssistanceSeparatedEvidence } from "./assistance-separation";
import { summarizeAttemptProcess } from "./attempt-process";
import { speakingAttemptIsIndependent } from "@/core/speaking/workflow";

export type EvidenceSkillKey = "reading" | "listening" | "grammar" | "writing" | "speaking";
export type EvidenceConfidence = "none" | "low" | "medium" | "high";

export type SkillEvidenceMetric = {
  key: EvidenceSkillKey;
  labelAr: string;
  score: number | null;
  confidence: EvidenceConfidence;
  baseConfidence: EvidenceConfidence;
  freshness: ReturnType<typeof evidenceFreshness>;
  evidenceCount: number;
  correctCount?: number;
  coverageCount: number;
  latestAt?: string;
  noveltyWeighting?: {
    version: typeof MASTERY_WEIGHTING_VERSION;
    novelItems: number;
    novelTransfers: number;
    retryAttempts: number;
    weightedAccuracyPercent: number | null;
  };
  detailAr: string;
  boundaryAr: string;
};

export type EvidenceRisk = {
  id: string;
  severity: "attention" | "priority";
  titleAr: string;
  reasonAr: string;
  href: string;
  governance?: ReturnType<typeof governanceForRisk>;
};

export type EvidenceAction = {
  skill: EvidenceSkillKey | "review" | "errors";
  titleAr: string;
  reasonAr: string;
  href: string;
};

type RawSkillEvidenceMetric = Omit<SkillEvidenceMetric, "baseConfidence" | "freshness">;

function applyFreshness(metric: RawSkillEvidenceMetric, now: Date): SkillEvidenceMetric {
  const freshness = evidenceFreshness(metric.latestAt, metric.confidence, now);
  return { ...metric, baseConfidence: metric.confidence, confidence: freshness.adjustedConfidence, freshness };
}

const attemptSkill = new Map<string, { skill: "reading" | "listening" | "grammar"; lessonId: string; novelty: "practice" | "transfer" }>();
for (const lesson of academicLessonList) {
  for (const exercise of lesson.exercises) attemptSkill.set(exercise.id, { skill: "grammar", lessonId: lesson.id, novelty: "practice" });
  for (const question of lesson.reading.questions) attemptSkill.set(question.id, { skill: "reading", lessonId: lesson.id, novelty: "transfer" });
  for (const question of lesson.listening.questions) attemptSkill.set(question.id, { skill: "listening", lessonId: lesson.id, novelty: "transfer" });
  for (const question of lesson.miniTest) attemptSkill.set(question.id, { skill: "grammar", lessonId: lesson.id, novelty: "transfer" });
}

function confidence(evidenceCount: number, coverageCount: number): EvidenceConfidence {
  if (evidenceCount === 0) return "none";
  if (evidenceCount < 5 || coverageCount < 2) return "low";
  if (evidenceCount < 15 || coverageCount < 5) return "medium";
  return "high";
}

function latestIso(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function latestLessonAttempts(state: LearningState) {
  const latest = new Map<string, LearningState["exerciseAttempts"][number]>();
  for (const attempt of state.exerciseAttempts) {
    const classification = attemptSkill.get(attempt.exerciseId);
    if (!classification) continue;
    const key = `${attempt.lessonId}:${attempt.exerciseId}`;
    const previous = latest.get(key);
    if (!previous || Date.parse(attempt.createdAt) >= Date.parse(previous.createdAt)) latest.set(key, attempt);
  }
  return [...latest.values()];
}

function receptiveMetric(state: LearningState, key: "reading" | "listening" | "grammar", labelAr: string): RawSkillEvidenceMetric {
  const rawAttempts = state.exerciseAttempts.filter((attempt) => attemptSkill.get(attempt.exerciseId)?.skill === key);
  const attempts = latestLessonAttempts(state).filter((attempt) => attemptSkill.get(attempt.exerciseId)?.skill === key);
  const transferIds = new Set(rawAttempts.filter((attempt) => attemptSkill.get(attempt.exerciseId)?.novelty === "transfer").map((attempt) => attempt.exerciseId));
  const novelty = buildNoveltyWeightedEvidence(rawAttempts, transferIds);
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const coverageCount = new Set(attempts.map((attempt) => attempt.lessonId)).size;
  const accuracy = attempts.length ? correctCount / attempts.length : 0;
  const coverageFactor = Math.min(1, coverageCount / 6);
  const score = attempts.length ? Math.round(accuracy * 100 * (0.7 + coverageFactor * 0.3)) : null;
  return {
    key,
    labelAr,
    score,
    confidence: confidence(attempts.length, coverageCount),
    evidenceCount: attempts.length,
    correctCount,
    coverageCount,
    latestAt: latestIso(rawAttempts.map((attempt) => attempt.createdAt)),
    noveltyWeighting: {
      version: novelty.version,
      novelItems: novelty.novelItemCount,
      novelTransfers: novelty.novelTransferCount,
      retryAttempts: novelty.retryAttemptCount,
      weightedAccuracyPercent: novelty.weightedAccuracyPercent,
    },
    detailAr: attempts.length ? `${correctCount}/${attempts.length} صحيح · ${coverageCount} دروس · ${novelty.novelItemCount} عناصر جديدة مقابل ${novelty.retryAttemptCount} إعادات بوزن منخفض` : "لا توجد إجابات محفوظة بعد",
    boundaryAr: "درجة دليل تدريبية؛ السؤال الجديد/النقل أعلى وزنًا من إعادة السؤال نفسه، ولا تعادل النتيجة مستوى CEFR أو نقاط امتحان رسمية.",
  };
}

function writingMetric(state: LearningState): RawSkillEvidenceMetric {
  const submitted = state.writingSubmissions.filter((item) => item.status !== "draft");
  const byTask = new Map<string, typeof submitted>();
  for (const item of submitted) byTask.set(item.taskId, [...(byTask.get(item.taskId) ?? []), item]);
  const coverageCount = byTask.size;
  const revisedCount = [...byTask.values()].filter((versions) => versions.length > 1 || versions.some((item) => item.status === "revised")).length;
  const nonEmptyCount = [...byTask.values()].filter((versions) => (versions.at(-1)?.wordCount ?? 0) > 0).length;
  const coverageFactor = Math.min(1, coverageCount / 6);
  const revisionFactor = coverageCount ? revisedCount / coverageCount : 0;
  const completeFactor = coverageCount ? nonEmptyCount / coverageCount : 0;
  const score = coverageCount ? Math.round((coverageFactor * 0.55 + revisionFactor * 0.25 + completeFactor * 0.2) * 100) : null;
  return {
    key: "writing",
    labelAr: "الكتابة",
    score,
    confidence: confidence(submitted.length, coverageCount),
    evidenceCount: submitted.length,
    coverageCount,
    latestAt: latestIso(submitted.map((item) => item.updatedAt)),
    detailAr: coverageCount ? `${coverageCount} مهام · ${revisedCount} منقحة · ${submitted.length} نسخ` : "لا توجد كتابة مسلّمة بعد",
    boundaryAr: "يقيس كمية الأدلة والمراجعة، لا جودة اللغة أو الحجة مثل مصحح بشري.",
  };
}

function speakingMetric(state: LearningState): RawSkillEvidenceMetric {
  const attempts = state.speakingAttempts.filter(speakingAttemptIsIndependent);
  const byTask = new Map<string, typeof attempts>();
  for (const item of attempts) byTask.set(item.taskId, [...(byTask.get(item.taskId) ?? []), item]);
  const coverageCount = byTask.size;
  const repeatedTasks = [...byTask.values()].filter((items) => items.length > 1).length;
  const durationEvidence = attempts.filter((item) => item.durationSeconds >= 30).length;
  const averageSelfScore = attempts.length ? attempts.reduce((sum, item) => sum + item.selfScore, 0) / attempts.length : 0;
  const coverageFactor = Math.min(1, coverageCount / 6);
  const repetitionFactor = coverageCount ? repeatedTasks / coverageCount : 0;
  const durationFactor = attempts.length ? durationEvidence / attempts.length : 0;
  const score = attempts.length ? Math.round((coverageFactor * 0.5 + repetitionFactor * 0.2 + durationFactor * 0.2 + (averageSelfScore / 5) * 0.1) * 100) : null;
  return {
    key: "speaking",
    labelAr: "المحادثة",
    score,
    confidence: confidence(attempts.length, coverageCount),
    evidenceCount: attempts.length,
    coverageCount,
    latestAt: latestIso(attempts.map((item) => item.createdAt)),
    detailAr: attempts.length ? `${attempts.length} محاولات مستقلة · ${coverageCount} مهام · متوسط ذاتي ${averageSelfScore.toFixed(1)}/5` : "لا توجد محاولة صوتية مستقلة محفوظة بعد",
    boundaryAr: "المحاولة ذات العبارات الظاهرة تدريب موجّه ولا تدخل هنا؛ لا يقيس النطق أو الطلاقة صوتيًا.",
  };
}

export function buildEvidenceReport(state: LearningState, now = new Date()) {
  const skills: SkillEvidenceMetric[] = [
    receptiveMetric(state, "reading", "القراءة"),
    receptiveMetric(state, "listening", "الاستماع"),
    receptiveMetric(state, "grammar", "القواعد والمفردات"),
    writingMetric(state),
    speakingMetric(state),
  ].map((metric) => applyFreshness(metric, now));
  const scored = skills.filter((skill) => skill.score !== null);
  const overallScore = scored.length >= 3 ? Math.round(scored.reduce((sum, skill) => sum + (skill.score ?? 0), 0) / scored.length) : null;
  const dueReviews = buildDueReviewQueue(state, now).length;
  const eligibleCards = eligibleReviewCards(state);
  const reviewedCardIds = new Set(state.reviewItems.map((item) => item.cardId));
  const reviewedCards = eligibleCards.filter((card) => reviewedCardIds.has(card.id)).length;
  const retention = retentionEvidence(state);
  const activeErrors = state.errors.filter((error) => !error.resolved);
  const checkedItemCount = state.exerciseAttempts.length;
  const wrongCheckedItemCount = state.exerciseAttempts.filter((attempt) => !attempt.correct).length;
  const errorsPer100CheckedItems = checkedItemCount ? Math.round((wrongCheckedItemCount / checkedItemCount) * 1000) / 10 : null;
  const errorClinics = buildErrorClinics(activeErrors);
  const dueErrorReviews = activeErrors.filter((error) => errorRepairState(error, now) === "due");
  const pendingErrorReviews = activeErrors.filter((error) => errorRepairState(error, now) === "waiting");
  const repeatedErrors = activeErrors.filter((error) => error.occurrences >= 2 && errorRepairState(error, now) !== "waiting");
  const highConfidenceErrors = activeErrors.filter((error)=>(error.highConfidenceWrongCount??0)>0&&errorRepairState(error,now)!=="waiting");
  const misconceptionRiskErrors = activeErrors.filter((error)=>(error.patternClassification??classifyErrorPattern(error.occurrences,error.highConfidenceWrongCount??0,error.failedRepairCount??0))==="misconception-risk");
  const personalErrorSrsCards = confirmedErrorSrsCards(state.errors);
  const risks: EvidenceRisk[] = [];

  if (dueReviews >= 20) risks.push({ id: "reviews", severity: "priority", titleAr: "تراكم مراجعات مستحقة", reasonAr: `${dueReviews} بطاقة مستحقة الآن؛ إضافة محتوى جديد قبلها تزيد النسيان.`, href: "/review" });
  if (dueErrorReviews.length) risks.push({ id: "error-retests", severity: "priority", titleAr: "اختبارات أخطاء مؤجلة مستحقة", reasonAr: `${dueErrorReviews.length} أخطاء نجح علاجها أوليًا وحان الآن اختبارها دون كشف.`, href: "/errors" });
  if (highConfidenceErrors.length) risks.push({ id:"high-confidence-errors", severity:"priority", titleAr:"خطأ مع ثقة عالية", reasonAr:`${highConfidenceErrors.length} إجابات خاطئة سُجلت مع ثقة عالية؛ ابدأ بها لأنها تكشف تعارضًا بين التوقع والنتيجة، لا تشخيصًا معرفيًا.`, href:"/errors" });
  if (errorClinics.length) risks.push({ id: "error-clinic", severity: "priority", titleAr: "عيادة نمط خطأ متكرر", reasonAr: `${errorClinics[0].titleAr}: تجمعت ${errorClinics[0].evidenceCount} أدلة من النوع نفسه؛ ابدأ بالقاعدة ثم تمرين النقل.`, href: "/errors" });
  if (repeatedErrors.length && !errorClinics.length) risks.push({ id: "errors", severity: "priority", titleAr: "أخطاء متكررة غير محلولة", reasonAr: `${repeatedErrors.length} أنماط تكررت مرتين أو أكثر وتحتاج إنتاج التصحيح.`, href: "/errors" });
  for (const skill of skills.filter((item) => item.evidenceCount >= 5 && (item.score ?? 100) < 60)) {
    const href = skill.key === "writing" ? "/writing" : skill.key === "speaking" ? "/speaking" : skill.key === "grammar" ? "/review" : "/library";
    risks.push({ id: `weak-${skill.key}`, severity: "attention", titleAr: `دليل ${skill.labelAr} منخفض`, reasonAr: `${skill.detailAr}. عالج عينة جديدة قبل تعميم النتيجة.`, href });
  }
  if (state.completedLessonIds.length >= 3 && skills.find((skill) => skill.key === "writing")?.evidenceCount === 0) risks.push({ id: "missing-writing", severity: "attention", titleAr: "لا توجد عينة كتابة", reasonAr: "أنجزت ثلاثة دروس أو أكثر دون نص مسلّم؛ نحتاج إنتاجًا لا اختيارات فقط.", href: "/writing" });
  if (state.completedLessonIds.length >= 3 && skills.find((skill) => skill.key === "speaking")?.evidenceCount === 0) risks.push({ id: "missing-speaking", severity: "attention", titleAr: "لا توجد عينة محادثة", reasonAr: "أنجزت ثلاثة دروس أو أكثر دون تسجيل؛ نحتاج دليلًا صوتيًا محليًا.", href: "/speaking" });

  let nextAction: EvidenceAction;
  if (dueReviews >= 20) nextAction = { skill: "review", titleAr: "أوقف تراكم النسيان", reasonAr: `ابدأ بـ${dueReviews} بطاقة مستحقة قبل درس جديد.`, href: "/review" };
  else if (dueErrorReviews.length) nextAction = { skill: "errors", titleAr: "اختبر العلاج بعد التأخير", reasonAr: `${dueErrorReviews.length} تصحيحات حان موعد استرجاعها دون كشف.`, href: "/errors" };
  else if (highConfidenceErrors.length) nextAction = { skill:"errors", titleAr:"ابدأ بالخطأ عالي الثقة", reasonAr:`كنت واثقًا في ${highConfidenceErrors[0].wrong} لكن النتيجة خالفت توقعك؛ اكتب التصحيح وفسر القاعدة قبل درس جديد.`, href:"/errors" };
  else if (errorClinics.length) nextAction = { skill: "errors", titleAr: errorClinics[0].titleAr, reasonAr: `ابدأ بالقاعدة المشتركة وتمرين نقل جديد بعد ${errorClinics[0].evidenceCount} أدلة متشابهة.`, href: "/errors" };
  else if (repeatedErrors.length) nextAction = { skill: "errors", titleAr: "عالج الخطأ المتكرر", reasonAr: `اكتب تصحيح ${repeatedErrors[0].wrong} من الذاكرة.`, href: "/errors" };
  else {
    const weakest = skills.filter((skill) => skill.score !== null).sort((left, right) => (left.score ?? 0) - (right.score ?? 0))[0];
    if (!weakest) nextAction = { skill: "grammar", titleAr: "ابدأ بجمع أول دليل", reasonAr: "أكمل أول درس وتمارينه حتى تصبح لوحة المهارات شخصية.", href: "/today" };
    else {
      const href = weakest.key === "writing" ? "/writing" : weakest.key === "speaking" ? "/speaking" : weakest.key === "grammar" ? "/review" : "/library";
      nextAction = { skill: weakest.key, titleAr: `قوِّ ${weakest.labelAr}`, reasonAr: `${weakest.detailAr}. هذه أضعف عينة حالية، وليست حكمًا نهائيًا.`, href };
    }
  }

  const continuity = buildContinuityStreak(state, now);

  return {
    skills,
    overallScore,
    overallConfidence: scored.length < 3 ? "low" as const : scored.every((skill) => skill.confidence === "high") ? "high" as const : "medium" as const,
    dueReviews,
    eligibleCards: eligibleCards.length,
    reviewedCards,
    initialReviewEvents: retention.initialReviewEvents,
    delayedReviewEvents: retention.delayedReviewEvents,
    successfulDelayedCards: retention.successfulDelayedCards,
    retentionConfirmedLessons: retention.confirmedLessonIds.length,
    activeErrors: activeErrors.length,
    checkedItemCount,
    wrongCheckedItemCount,
    errorsPer100CheckedItems,
    repeatedErrors: repeatedErrors.length,
    highConfidenceErrors: highConfidenceErrors.length,
    misconceptionRiskErrors: misconceptionRiskErrors.length,
    personalErrorSrsCards: personalErrorSrsCards.length,
    dueErrorReviews: dueErrorReviews.length,
    pendingErrorReviews: pendingErrorReviews.length,
    risks:risks.map((risk)=>({...risk,governance:governanceForRisk(risk.id)})),
    nextAction,
    studyStreakDays: continuity.studiedDays,
    streakCalendarSpanDays: continuity.calendarSpanDays,
    graceDayDate: continuity.graceDayDate,
    continuityPolicyVersion: continuity.policyVersion,
    evidenceFreshnessPolicyVersion: EVIDENCE_FRESHNESS_POLICY,
    supportUsage: summarizeSupportUsage(state.supportUsageEvents),
    assistanceSeparation:buildAssistanceSeparatedEvidence(state),
    attemptProcess:summarizeAttemptProcess(state),
    latestEvidenceAt: latestIso(skills.map((skill) => skill.latestAt)),
  };
}
