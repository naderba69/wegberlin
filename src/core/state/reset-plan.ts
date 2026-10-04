import { defaultState } from "@/core/portability/db";
import type { LearningState, ResetEventRecord } from "@/types/learning";

/**
 * معالج إعادة التهيئة (P2-24، ADR-088).
 *
 * القاعدة الوحيدة التي لا تُفاوض: إعادة التهيئة تُصفّر **التقدّم المشتقّ** ولا تمسّ
 * **سجل الأدلة** الذي أنتجه المتعلّم. لذلك كل حقل في الحالة مصنَّف صراحةً إلى واحدة من
 * أربع سلال، والتصنيف مغطّى بالكامل: لا يبقى حقل واحد بلا سلة (اختبار وحدة يفشل لو أُضيف
 * حقل جديد إلى `defaultState` بلا تصنيف). ومحو سجل المحاولات مرفوض بدالة مُختبرة، لا بوعد.
 */
export const RESET_PLAN_POLICY = "reset-wizard-keeps-attempt-log-v1" as const;

/** رسالة رفض محو سجل المحاولات: تُعرض كما هي بدل صمتٍ يترك المتعلّم يظنّ أنها نُفِّذت. */
export const attemptLogDeletionRefusalAr = "رفضت إعادة التهيئة: سجل المحاولات لا يُحذف ولا يُعدَّل.";

/** الإقرار المكتوب في الواجهة قبل التنفيذ (نص واحد للحقيقة). */
export const RESET_ACKNOWLEDGEMENT_AR = "أُقرّ بأن التقدّم المشتقّ سيُصفَّر وأن أدلّتي ستبقى.";

/** كلمة التأكيد المكتوبة قبل التنفيذ (إقرار + كلمة تأكيد، لا زرّ واحد). */
export const RESET_CONFIRMATION_WORD = "إعادة";

export type ResetFieldBucket = "progress" | "evidence" | "settings" | "identity";

export type ResetFieldRow = {
  field: keyof LearningState;
  bucket: ResetFieldBucket;
  rationaleAr: string;
};

/**
 * التصنيف الإلزامي: 65 حقلًا = 19 تقدّمًا يُصفَّر · 24 سجل أدلة يبقى قبل=بعد ·
 * 12 إعدادًا يبقى · 10 حقول هوية تبقى. السلة «progress» هي الوحيدة التي تُصفَّر.
 */
export const RESET_FIELD_POLICIES: readonly ResetFieldRow[] = [
  { field: "schemaVersion", bucket: "identity", rationaleAr: "إصدار المخزن: لا يُمسّ في تهيئة تعلّمية." },
  { field: "curriculumVersion", bucket: "identity", rationaleAr: "بصمة المنهج المشحون: تعود من المنهج لا من المتعلّم." },
  { field: "profile", bucket: "identity", rationaleAr: "هوية الملف: الاسم والهدف وتاريخ الامتحان تبقى." },
  { field: "learningContracts", bucket: "identity", rationaleAr: "عقود المتعلّم المكتوبة بيده تبقى." },
  { field: "contentNotes", bucket: "identity", rationaleAr: "دفتر المتعلّم الذي كتبه بنفسه يبقى." },
  { field: "learnerAlignmentMap", bucket: "identity", rationaleAr: "خريطة مواءمة المتعلّم الخاصة بفهرس يملكه تبقى: كتبها بيده." },
  { field: "personalVocabulary", bucket: "identity", rationaleAr: "قائمة مفردات المتعلّم التي أنشأها بنفسه تبقى." },
  { field: "weeklyReflections", bucket: "identity", rationaleAr: "تأمّلات المتعلّم الأسبوعية بقلمه تبقى." },
  { field: "lastBackupAt", bucket: "identity", rationaleAr: "مؤشّر آخر نسخة: لا يحمل تقدّمًا ولا أدلة." },
  { field: "updatedAt", bucket: "identity", rationaleAr: "ختم الزمن يُعاد كتابته بحفظ التهيئة نفسها." },

  { field: "diagnosticResult", bucket: "progress", rationaleAr: "نتيجة التحديد الأولي تُصفَّر لأنها تقود المسار." },
  { field: "diagnosticSessionDraft", bucket: "progress", rationaleAr: "مسوّدة جلسة تحديد جارية: تقدّم غير مكتمل." },
  { field: "skillDiagnosticAttempts", bucket: "progress", rationaleAr: "عينات تحديد مهاري أنشأها التطبيق للتوجيه لا المتعلّم للتدريب." },
  { field: "pinnedLearningTask", bucket: "progress", rationaleAr: "تثبيت مهمّة جارٍ: اختيار لحظي لا دليل." },
  { field: "completedBlockIds", bucket: "progress", rationaleAr: "كتل اليوم المكتملة: تقدّم مشتقّ." },
  { field: "completedLessonIds", bucket: "progress", rationaleAr: "الدروس المكتملة: تقدّم مشتقّ." },
  { field: "currentLessonId", bucket: "progress", rationaleAr: "موضع الدرس الحالي يعود إلى درس البداية المشحون." },
  { field: "currentStage", bucket: "progress", rationaleAr: "مرحلة الدرس تعود إلى الصفر." },
  { field: "lessonProgress", bucket: "progress", rationaleAr: "تقدّم الدروس لكل درس يُصفَّر." },
  { field: "dueReviews", bucket: "progress", rationaleAr: "عدّاد المراجعات المستحقة مشتقّ من الجدول المُصفَّر." },
  { field: "mastery", bucket: "progress", rationaleAr: "الإتقان المشتقّ يُصفَّر لأن أحداث دليله أُفرغت." },
  { field: "masteryEvidenceEvents", bucket: "progress", rationaleAr: "أحداث الدليل المشتقّ تُفرَّغ مع إتقانها في هذه التهيئة." },
  { field: "errors", bucket: "progress", rationaleAr: "بنك الأخطاء المشتقّ من محاولات التمرين يُصفَّر." },
  { field: "errorClinicAttempts", bucket: "progress", rationaleAr: "جلسات عيادة الخطأ المشتقّة تُصفَّر." },
  { field: "reviewItems", bucket: "progress", rationaleAr: "جدول التكرار المتباعد يُصفَّر." },
  { field: "dailySessions", bucket: "progress", rationaleAr: "سجلّات جلسات اليوم (توقّف/استئناف) تُصفَّر." },
  { field: "examSessions", bucket: "progress", rationaleAr: "جلسات محاكاة الامتحان الجارية/المحفوظة تُصفَّر." },
  { field: "contentErrorReports", bucket: "progress", rationaleAr: "بلاغات المحتوى صفوفُ مراجعة عابرة عندنا، لا دليل تعلّم." },
  { field: "trainingInteractionEvents", bucket: "progress", rationaleAr: "أحداث تفاعل التدريب تقود التكييف وتُعاد بناؤها." },

  { field: "exerciseAttempts", bucket: "evidence", rationaleAr: "سجل المحاولات نفسه: يبقى قبل=بعد مهما كان عدد صفوفه." },
  { field: "reviewEvents", bucket: "evidence", rationaleAr: "أحداث المراجعة تبقى." },
  { field: "writingSubmissions", bucket: "evidence", rationaleAr: "نصوص الكتابة تبقى." },
  { field: "writingRepairAttempts", bucket: "evidence", rationaleAr: "محاولات إصلاح الكتابة تبقى." },
  { field: "writingAIReviews", bucket: "evidence", rationaleAr: "مراجعات الكتابة تُحفظ كأدلة تبقى." },
  { field: "externalEvaluatorNotes", bucket: "evidence", rationaleAr: "ملاحظات المراجع الخارجي التي جلبها المتعلّم تبقى." },
  { field: "externalEvaluationVerifications", bucket: "evidence", rationaleAr: "سجل فحوص اللصق الخارجي (بما فيه المرفوض) يبقى للتدقيق." },
  { field: "mediationSubmissions", bucket: "evidence", rationaleAr: "نصوص الوساطة تبقى." },
  { field: "speakingAttempts", bucket: "evidence", rationaleAr: "محاولات الكلام تبقى." },
  { field: "tutorInteractions", bucket: "evidence", rationaleAr: "تفاعلات المعلّم الآلي تبقى." },
  { field: "studyHistory", bucket: "evidence", rationaleAr: "سجل أيام الدراسة يبقى." },
  { field: "dictationAttempts", bucket: "evidence", rationaleAr: "محاولات الإملاء تبقى." },
  { field: "branchingConversationAttempts", bucket: "evidence", rationaleAr: "المحادثات المتشعّبة تبقى." },
  { field: "collocationNetworkAttempts", bucket: "evidence", rationaleAr: "شبكات المتلازمات تبقى." },
  { field: "cohesionRewriteAttempts", bucket: "evidence", rationaleAr: "محاولات إعادة الصياغة المتماسكة تبقى دليلًا على التدريب." },
  { field: "supportUsageEvents", bucket: "evidence", rationaleAr: "أحداث استخدام المساندة تبقى." },
  { field: "listeningProcessEvents", bucket: "evidence", rationaleAr: "أحداث عملية الاستماع تبقى." },
  { field: "listeningUsageEvents", bucket: "evidence", rationaleAr: "أحداث استخدام الاستماع تبقى." },
  { field: "pronunciationContrastAttempts", bucket: "evidence", rationaleAr: "محاولات النطق التقابلي تبقى." },
  { field: "prosodyRhythmAttempts", bucket: "evidence", rationaleAr: "محاولات النبر والإيقاع تبقى." },
  { field: "comprehensibilityChecks", bucket: "evidence", rationaleAr: "أحكام قابلية الفهم على مهام حقيقية تبقى." },
  { field: "practicalDayAttempts", bucket: "evidence", rationaleAr: "الأيام العملية تبقى." },
  { field: "readingBenchmarkAttempts", bucket: "evidence", rationaleAr: "قياسات القراءة تبقى." },
  { field: "writingBenchmarkAttempts", bucket: "evidence", rationaleAr: "قياسات الكتابة تبقى." },
  { field: "delayedTransferTasks", bucket: "evidence", rationaleAr: "مهامّ النقل المؤجّل: جدولها وإنتاجها الجديد دليلٌ يُحفظ." },
  { field: "resetEvents", bucket: "evidence", rationaleAr: "سجل إعادة التهيئة نفسه يبقى: التهيئة تُوثّق ولا تمحو توثيقها." },

  { field: "planningIntensity", bucket: "settings", rationaleAr: "شدّة التخطيط اختارها المتعلّم: تبقى." },
  { field: "studyRoutineMode", bucket: "settings", rationaleAr: "نمط الروتين اليومي يبقى." },
  { field: "libraryInterestPreferences", bucket: "settings", rationaleAr: "اهتمامات المكتبة تبقى." },
  { field: "speechPreferences", bucket: "settings", rationaleAr: "تفضيلات الصوت تبقى." },
  { field: "dataUsagePreferences", bucket: "settings", rationaleAr: "تفضيلات البيانات تبقى (وإلا شُغّل تنزيل لم يطلبه)." },
  { field: "sessionRitualPreferences", bucket: "settings", rationaleAr: "طقس الجلسة يبقى." },
  { field: "quietHours", bucket: "settings", rationaleAr: "ساعات الهدوء تبقى." },
  { field: "reviewReminderSettings", bucket: "settings", rationaleAr: "تنبيهات المراجعة تبقى." },
  { field: "accessibilityPreferences", bucket: "settings", rationaleAr: "تفضيلات الوصول تبقى: صفرها يضرّ المتعلّم." },
  { field: "motivationPreferences", bucket: "settings", rationaleAr: "تفضيلات التحفيز تبقى." },
  { field: "languageHistoryPreferences", bucket: "settings", rationaleAr: "تفضيل إثراء التاريخ اللغوي تبقى كما اختارها المتعلّم." },
  { field: "aiSettings", bucket: "settings", rationaleAr: "إعدادات الذكاء الاصطناعي (ومفتاح الجلسة خارج الحالة) تبقى." },
] as const;

export type ClearedField =
  | "diagnosticResult"
  | "diagnosticSessionDraft"
  | "skillDiagnosticAttempts"
  | "pinnedLearningTask"
  | "completedBlockIds"
  | "completedLessonIds"
  | "currentLessonId"
  | "currentStage"
  | "lessonProgress"
  | "dueReviews"
  | "mastery"
  | "masteryEvidenceEvents"
  | "errors"
  | "errorClinicAttempts"
  | "reviewItems"
  | "dailySessions"
  | "examSessions"
  | "contentErrorReports"
  | "trainingInteractionEvents";

export const RESET_CLEARED_FIELDS: readonly (keyof LearningState)[] = RESET_FIELD_POLICIES.filter(
  (row) => row.bucket === "progress",
).map((row) => row.field);

export const RESET_EVIDENCE_FIELDS: readonly (keyof LearningState)[] = RESET_FIELD_POLICIES.filter(
  (row) => row.bucket === "evidence",
).map((row) => row.field);

/**
 * القيم الافتراضية المشحونة للحقول المُصفَّرة (19). لا تُكتب هنا يدويًا كنسخة ثانية من
 * الحقيقة: اختبار الوحدة يقارن كل قيمة منها بـ`defaultState` ويعتبر أي اختلاف فشلًا.
 */
export const RESET_CLEARED_DEFAULTS: Pick<LearningState, ClearedField> = {
  diagnosticResult: defaultState.diagnosticResult,
  diagnosticSessionDraft: defaultState.diagnosticSessionDraft,
  skillDiagnosticAttempts: defaultState.skillDiagnosticAttempts,
  pinnedLearningTask: defaultState.pinnedLearningTask,
  completedBlockIds: defaultState.completedBlockIds,
  completedLessonIds: defaultState.completedLessonIds,
  currentLessonId: defaultState.currentLessonId,
  currentStage: defaultState.currentStage,
  lessonProgress: defaultState.lessonProgress,
  dueReviews: defaultState.dueReviews,
  mastery: defaultState.mastery,
  masteryEvidenceEvents: defaultState.masteryEvidenceEvents,
  errors: defaultState.errors,
  errorClinicAttempts: defaultState.errorClinicAttempts,
  reviewItems: defaultState.reviewItems,
  dailySessions: defaultState.dailySessions,
  examSessions: defaultState.examSessions,
  contentErrorReports: defaultState.contentErrorReports,
  trainingInteractionEvents: defaultState.trainingInteractionEvents,
};

export type ResetCoverage = {
  policyVersion: typeof RESET_PLAN_POLICY;
  totalClassified: number;
  progressCleared: number;
  evidencePreserved: number;
  settingsPreserved: number;
  identityPreserved: number;
  unclassifiedFields: string[];
};

export function classifyResetCoverage(state: LearningState): ResetCoverage {
  const classified = new Map(RESET_FIELD_POLICIES.map((row) => [row.field as string, row.bucket]));
  const unclassifiedFields = Object.keys(state).filter((field) => !classified.has(field));
  return {
    policyVersion: RESET_PLAN_POLICY,
    totalClassified: RESET_FIELD_POLICIES.length,
    progressCleared: countBucket("progress"),
    evidencePreserved: countBucket("evidence"),
    settingsPreserved: countBucket("settings"),
    identityPreserved: countBucket("identity"),
    unclassifiedFields,
  };
}

function countBucket(bucket: ResetFieldBucket) {
  return RESET_FIELD_POLICIES.filter((row) => row.bucket === bucket).length;
}

function evidenceFootprint(state: LearningState) {
  return RESET_EVIDENCE_FIELDS.map((field) => {
    const value = state[field];
    const size = Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value).length : 0;
    return { field: field as string, size };
  });
}

export type LearningResetPlan = {
  policyVersion: typeof RESET_PLAN_POLICY;
  coverage: ResetCoverage;
  clearedFields: string[];
  preservedEvidence: { field: string; size: number }[];
  attemptLogCount: number;
  before: { dueReviews: number; completedLessonCount: number; masteryCount: number; currentLessonId: string; currentStage: number };
};

/** الاسم الموثَّق: خطة التهيئة تُبنى قبل أي كتابة وتُعرض على المتعلّم. */
export function buildResetPlan(state: LearningState): LearningResetPlan {
  return planLearningReset(state);
}

export function planLearningReset(state: LearningState): LearningResetPlan {
  return {
    policyVersion: RESET_PLAN_POLICY,
    coverage: classifyResetCoverage(state),
    clearedFields: RESET_CLEARED_FIELDS.map((field) => field as string),
    preservedEvidence: evidenceFootprint(state),
    attemptLogCount: state.exerciseAttempts.length,
    before: {
      dueReviews: state.dueReviews,
      completedLessonCount: state.completedLessonIds.length,
      masteryCount: Object.keys(state.mastery).length,
      currentLessonId: state.currentLessonId,
      currentStage: state.currentStage,
    },
  };
}

/**
 * محو سجل المحاولات مرفوض هنا — بدالة، لا بوعد. أي خطة (أو نداء مستقبلي) يحاول تقليص
 * سجل المحاولات أو تغييره يفشل بصوت عالٍ قبل أن يُكتب شيء.
 */
export function assertAttemptLogPreserved(before: LearningState, after: LearningState): void {
  const kept = after.exerciseAttempts;
  const original = before.exerciseAttempts;
  const identical =
    kept.length === original.length &&
    kept.every((attempt, index) => {
      const source = original[index];
      return (
        attempt.id === source.id &&
        attempt.createdAt === source.createdAt &&
        attempt.exerciseId === source.exerciseId &&
        attempt.answer === source.answer
      );
    });
  if (!identical) throw new Error(attemptLogDeletionRefusalAr);
}

export function buildResetEvent(plan: LearningResetPlan, state: LearningState, now: Date): ResetEventRecord {
  return {
    id: `reset-event:${now.getTime()}`,
    policyVersion: RESET_PLAN_POLICY,
    createdAt: now.toISOString(),
    clearedFields: [...plan.clearedFields],
    preservedEvidenceFields: plan.preservedEvidence.map((row) => row.field),
    keptAttemptCount: state.exerciseAttempts.length,
    preservedEvidenceCounts: plan.preservedEvidence.map((row) => ({ field: row.field, count: row.size })),
    confirmationWord: RESET_CONFIRMATION_WORD,
    boundary: "reset-clears-derived-progress-keeps-evidence-and-attempt-log",
  };
}

export type LearningResetOutcome = {
  state: LearningState;
  event: ResetEventRecord;
  clearedFieldCount: number;
  preservedEvidenceFieldCount: number;
  attemptLogCount: number;
  before: LearningResetPlan["before"];
  after: LearningResetPlan["before"];
};

/**
 * التنفيذ: يُصفَّر كل حقل تقدّم إلى القيمة الافتراضية المشحونة، وتبقى السلال الثلاث
 * الأخرى كما هي بالمرجع نفسه، ويُضاف حدث تدقيق واحد (`resetEvents`) ولا يُستبدل.
 */
export function applyLearningReset(state: LearningState, now: Date = new Date()): LearningResetOutcome {
  const plan = planLearningReset(state);
  if (plan.coverage.unclassifiedFields.length > 0) {
    throw new Error(`رفضت إعادة التهيئة: حقول بلا تصنيف (${plan.coverage.unclassifiedFields.join(", ")}).`);
  }
  const cleared = { ...state, ...RESET_CLEARED_DEFAULTS } as LearningState;
  const event = buildResetEvent(plan, state, now);
  const next: LearningState = {
    ...cleared,
    resetEvents: [...(state.resetEvents ?? []), event],
    updatedAt: now.toISOString(),
  };
  assertAttemptLogPreserved(state, next);
  return {
    state: next,
    event,
    clearedFieldCount: plan.clearedFields.length,
    preservedEvidenceFieldCount: plan.preservedEvidence.length,
    attemptLogCount: next.exerciseAttempts.length,
    before: plan.before,
    after: {
      dueReviews: next.dueReviews,
      completedLessonCount: next.completedLessonIds.length,
      masteryCount: Object.keys(next.mastery).length,
      currentLessonId: next.currentLessonId,
      currentStage: next.currentStage,
    },
  };
}

/** يُطلب في الواجهة: إقرار صريح + كلمة التأكيد المكتوبة، وإلا لا تنفيذ. */
export function canExecuteReset(input: { acknowledged: boolean; confirmation: string }): {
  allowed: boolean;
  reasonAr: string;
} {
  if (!input.acknowledged) return { allowed: false, reasonAr: "الإقرار مطلوب: التهيئة تُصفّر التقدّم المشتقّ." };
  if (input.confirmation.trim() !== RESET_CONFIRMATION_WORD) {
    return { allowed: false, reasonAr: `اكتب كلمة التأكيد (${RESET_CONFIRMATION_WORD}) حرفيًا.` };
  }
  return { allowed: true, reasonAr: "" };
}
