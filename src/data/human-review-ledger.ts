/**
 * سجل المراجعة البشرية: مكان واحد يُكتب فيه أن درسًا راجعه إنسان باسمه وتاريخه وبنودٍ عشر.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البند P0-9): كل المحتوى آليّ التدقيق
 * (`automated-pass-human-pending`) و`independentlyReviewed: 0`، وحزمة المراجعة موجودة
 * (`npm run review:packet`) لكن **لا شيء يسجّل نتيجة المراجعة نفسها** ولا يقيس إيقاعها.
 * هذا الملف هو السجل: يبدأ فارغًا بصدق، ويُملأ بصفحات CSV الجاهزة أو من داخل التطبيق،
 * وبوابة `human:review` تقرأه وتقول الرقم الحقيقي، ولا تجمّل صفرًا.
 */
import { auditP099ExclusionReviewSlots, P099_STRUCTURAL_EXCLUSION_COUNT } from "@/core/content-validation/lexical-review-packet";

export const HUMAN_REVIEW_POLICY = "human-review-ledger-v1" as const;
export const HUMAN_REVIEW_BOUNDARY = "reviewer-recorded-ledger-the-app-cannot-authenticate-a-reviewer" as const;
export const HUMAN_REVIEW_MONTHLY_TARGET = 8 as const;
export const HUMAN_REVIEW_LESSON_TOTAL = 96 as const;

export type HumanReviewChecklistId =
  | "german-correct"
  | "arabic-natural"
  | "cefr-level-fit"
  | "objective-aligned"
  | "answer-unambiguous"
  | "explanation-teaches-rule"
  | "audio-usable"
  | "no-cultural-harm"
  | "no-copyright-risk"
  | "transfer-task-realistic";

export type HumanReviewChecklistItem = { id: HumanReviewChecklistId; labelAr: string; noteAr: string };

export const HUMAN_REVIEW_CHECKLIST: readonly HumanReviewChecklistItem[] = [
  { id: "german-correct", labelAr: "الألمانية سليمة", noteAr: "التركيب والصرف والإملاء، مع الحالة والحرف الصحيحين." },
  { id: "arabic-natural", labelAr: "العربية طبيعية", noteAr: "لا ترجمة حرفية ولا مصطلحات تقنية في متن المتعلّم." },
  { id: "cefr-level-fit", labelAr: "المستوى في محلّه", noteAr: "المفردات والقاعدة والنصّ لا تتجاوز مستوى الدرس بلا تجهيز." },
  { id: "objective-aligned", labelAr: "الهدف يقابل التدريب", noteAr: "كل هدف معلن له تدريب وتقييم في الدرس نفسه." },
  { id: "answer-unambiguous", labelAr: "الجواب بلا التباس", noteAr: "لا خيارين صحيحين، ولا فراغ يقبل أكثر من إجابة واحدة معقولة." },
  { id: "explanation-teaches-rule", labelAr: "الشرح يعلّم قاعدة", noteAr: "يسمّي نوع الخطأ ويُعمّم، لا يكتفي بعرض الجواب." },
  { id: "audio-usable", labelAr: "الصوت صالح للاستعمال", noteAr: "واضح، ومعدّل السرعة مناسب، والنصّ يطابق التسجيل." },
  { id: "no-cultural-harm", labelAr: "لا إساءة ثقافية", noteAr: "لا صور نمطية عن العرب أو المهاجرين ولا حالات إحراج." },
  { id: "no-copyright-risk", labelAr: "لا خطر حقوق", noteAr: "لا نصّ منقول من كتاب أو امتحان محمي بلا إشارة." },
  { id: "transfer-task-realistic", labelAr: "مهمة النقل واقعية", noteAr: "المهمة تشبه استعمالًا حقيقيًا، ويمكن تنفيذها بالمعطيات المتاحة." },
];

export type HumanReviewVerdict = "accept" | "accept-with-fixes" | "block";

export type HumanReviewEntry = {
  policyVersion: typeof HUMAN_REVIEW_POLICY;
  lessonId: string;
  reviewerLabel: string;
  /** تاريخ المراجعة بصيغة YYYY-MM-DD (اليوم الذي قرأ فيه المراجع محتوى الدرس فعلًا). */
  reviewedAt: string;
  checklist: Record<HumanReviewChecklistId, boolean>;
  verdict: HumanReviewVerdict;
  /** ما تغيّر فعلًا بعد المراجعة؛ مطلوب عند `accept-with-fixes` أو `block`. */
  fixesAr?: string[];
  notesAr?: string;
};

export const VERDICT_LABELS_AR: Record<HumanReviewVerdict, string> = {
  accept: "مقبول كما هو",
  "accept-with-fixes": "مقبول بعد تصحيح",
  block: "موقوف حتى تصحيح",
};

export const humanReviewLedger: readonly HumanReviewEntry[] = [];

export type HumanReviewValidation = { ok: boolean; issuesAr: string[] };

/** تحقّق صارم: لا يُحتسب سطر ناقص، ولا مراجعة من المتعلّم لنفسه، ولا تصحيح بلا وصف. */
export function validateHumanReviewEntry(entry: HumanReviewEntry, learnerName?: string): HumanReviewValidation {
  const issues: string[] = [];
  if (!/^[ab][12]-\d{2}$/.test(entry.lessonId)) issues.push(`معرّف درس غير صالح: ${entry.lessonId}`);
  if (!entry.reviewerLabel.trim()) issues.push("لا اسم مراجع: المراجعة بلا اسم غير قابلة للتحقق.");
  else if (learnerName && entry.reviewerLabel.trim().toLocaleLowerCase("ar") === learnerName.trim().toLocaleLowerCase("ar")) issues.push("المراجع هو المتعلّم نفسه: لا تُحتسب مراجعة ذاتية.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt)) issues.push("تاريخ المراجعة غير صالح (المطلوب YYYY-MM-DD).");
  const missing = HUMAN_REVIEW_CHECKLIST.filter((item) => !(item.id in entry.checklist)).map((item) => item.labelAr);
  if (missing.length) issues.push(`بنود لم تُفحص: ${missing.join(" · ")}`);
  const unchecked = HUMAN_REVIEW_CHECKLIST.filter((item) => entry.checklist[item.id] === false).map((item) => item.labelAr);
  if (entry.verdict === "accept" && unchecked.length) issues.push(`حكم «مقبول كما هو» مع بنود غير محقّقة: ${unchecked.join(" · ")}`);
  if ((entry.verdict === "accept-with-fixes" || entry.verdict === "block") && !(entry.fixesAr?.length)) issues.push("حكم بتصحيح بلا وصف ما تغيّر.");
  return { ok: issues.length === 0, issuesAr: issues };
}

export type HumanReviewLedgerSummary = {
  policyVersion: typeof HUMAN_REVIEW_POLICY;
  boundary: typeof HUMAN_REVIEW_BOUNDARY;
  totalEntries: number;
  reviewedLessons: number;
  lessonTotal: number;
  coveragePct: number;
  monthlyTarget: number;
  months: Array<{ month: string; reviewedLessons: number; meetsTarget: boolean }>;
  lastMonthReviewed: number;
  targetMetLastMonth: boolean;
  invalidEntries: Array<{ lessonId: string; issuesAr: string[] }>;
  duplicateReviews: string[];
  boundaryAr: string;
};

export function summarizeHumanReviewLedger(entries: readonly HumanReviewEntry[], now = new Date(), learnerName?: string): HumanReviewLedgerSummary {
  const byLesson = new Map<string, HumanReviewEntry[]>();
  const invalidEntries: HumanReviewEntry[] = [];
  for (const entry of entries) {
    if (validateHumanReviewEntry(entry, learnerName).ok) byLesson.set(entry.lessonId, [...(byLesson.get(entry.lessonId) ?? []), entry]);
    else invalidEntries.push(entry);
  }
  const months = new Map<string, Set<string>>();
  for (const [lessonId, lessonEntries] of byLesson) {
    for (const entry of lessonEntries) {
      const month = entry.reviewedAt.slice(0, 7);
      months.set(month, new Set([...(months.get(month) ?? []), lessonId]));
    }
  }
  const monthRows = [...months.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([month, lessons]) => ({ month, reviewedLessons: lessons.size, meetsTarget: lessons.size >= HUMAN_REVIEW_MONTHLY_TARGET }));
  const currentMonth = now.toISOString().slice(0, 7);
  const lastMonthReviewed = months.get(currentMonth)?.size ?? 0;
  return {
    policyVersion: HUMAN_REVIEW_POLICY,
    boundary: HUMAN_REVIEW_BOUNDARY,
    totalEntries: entries.length,
    reviewedLessons: byLesson.size,
    lessonTotal: HUMAN_REVIEW_LESSON_TOTAL,
    coveragePct: Math.round((byLesson.size / HUMAN_REVIEW_LESSON_TOTAL) * 1000) / 10,
    monthlyTarget: HUMAN_REVIEW_MONTHLY_TARGET,
    months: monthRows,
    lastMonthReviewed,
    targetMetLastMonth: lastMonthReviewed >= HUMAN_REVIEW_MONTHLY_TARGET,
    invalidEntries: invalidEntries.map((entry) => ({ lessonId: entry.lessonId, issuesAr: validateHumanReviewEntry(entry, learnerName).issuesAr })),
    duplicateReviews: [...byLesson.entries()].filter(([, list]) => list.length > 1).map(([lessonId]) => lessonId),
    boundaryAr: "التطبيق لا يستطيع التحقق من هوية المراجع ولا من مؤهله؛ السجل يشهد بما سُجّل لا بما يُدّعى، ولذلك لا يمنح اعتمادًا ولا يغيّر حالة النشر تلقائيًا.",
  };
}

/**
 * ملخّص خانات P0-99 داخل تدقيق المراجعة البشرية: حضور فقط.
 * لا يُفتح دليل، ولا يُفسَّر محتوى قرار، ولا يُدّعى إغلاق؛ الاسم المسمّى خطوة فرز تبقى بعدها مراجعة بشرية مستقلة.
 */
export const HUMAN_REVIEW_P099_BOUNDARY_AR = "هذا الملخّص يعدّ حضور الخانات فقط: لا يحكم على كفاية الدليل ولا على محتوى قرار المراجع ولا يمنح اعتمادًا.";

export type HumanReviewP099SlotSummary = {
  boundary: typeof HUMAN_REVIEW_BOUNDARY;
  boundaryAr: typeof HUMAN_REVIEW_P099_BOUNDARY_AR;
  exclusionCount: number;
  namedReferenceCount: number;
  missingReferenceCount: number;
  placeholderReferenceCount: number;
  missingReferenceDecisionIds: string[];
  placeholderDecisionIds: string[];
  signatureCellsFilled: number;
  signatureCellsExpected: number;
  readyForIndependentReviewCount: number;
  pendingDecisionIds: string[];
  evidenceContentsInspected: false;
  reviewDecisionContentsInterpreted: false;
  p099ClosureAsserted: false;
};

export function summarizeP099ExclusionSlotsForHumanReview(
  content: string,
  expectedDecisionIds: readonly string[],
): HumanReviewP099SlotSummary {
  if (expectedDecisionIds.length !== P099_STRUCTURAL_EXCLUSION_COUNT) {
    throw new Error(`P0-99 human-review summary requires exactly ${P099_STRUCTURAL_EXCLUSION_COUNT} authored exclusion IDs.`);
  }
  const slots = auditP099ExclusionReviewSlots(content, expectedDecisionIds);
  return {
    boundary: HUMAN_REVIEW_BOUNDARY,
    boundaryAr: HUMAN_REVIEW_P099_BOUNDARY_AR,
    exclusionCount: slots.exclusionCount,
    namedReferenceCount: slots.namedReferenceCount,
    missingReferenceCount: slots.missingReferenceCount,
    placeholderReferenceCount: slots.placeholderReferenceCount,
    missingReferenceDecisionIds: slots.missingReferenceDecisionIds,
    placeholderDecisionIds: slots.placeholderDecisionIds,
    signatureCellsFilled: slots.signatureCellsFilled,
    signatureCellsExpected: slots.signatureCellsExpected,
    readyForIndependentReviewCount: slots.readyForIndependentReviewCount,
    pendingDecisionIds: slots.slots.filter((slot) => slot.evidenceReferenceState !== "named").map((slot) => slot.decisionId),
    evidenceContentsInspected: false,
    reviewDecisionContentsInterpreted: false,
    p099ClosureAsserted: false,
  };
}
