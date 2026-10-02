import type { CEFRLevel } from "@/types/learning";

/**
 * P2-156 — تقييم قابلية الفهم عبر مهمة حقيقية (real-task comprehensibility check).
 *
 * الفكرة المقيسة هنا: «هل أنجز المخاطَب المهمة الحقيقية بعد أن سمع كلامك؟» — لا «هل تقرأ الكلمات؟».
 * لكل مهمة سؤالُ مستمعٍ محدد وجوابٌ صحيح واحد معروف سلفًا في ورقة المتعلّم، فيكون الحكم نتيجةَ مهمة
 * (الطرف الآخر نفّذ قرارًا أو نقل معلومة) لا انطباعًا عن النطق.
 *
 * الحدود الصارمة (تُختبر آليًا):
 *  - الحكم يصدر من إنسان: متعلّمٌ يستمع لنفسه لاحقًا (تقرير ذاتي، لا تحقّق خارجي)، أو شخصٌ آخر حقيقي.
 *  - لا تحليل صوتي آلي، لا درجة نطق، لا درجة طلاقة، لا مُصحِّح آلي، لا نسبة مئوية، لا مستوى مُستنتَج.
 *  - لا لمس للإتقان ولا الأدلة ولا بوابة المستوى: هذه وحدةُ مهمةٍ تواصلية بحتة.
 *  - لا شبكة ولا تخزين من هذه الوحدة: التخزين عبر حالة التعلّم المحلية فقط.
 */

export const COMPREHENSIBILITY_POLICY_VERSION = "real-task-comprehensibility-check-v1" as const;

export const COMPREHENSIBILITY_BOUNDARY_AR =
  "حكمُ مستمعٍ على مهمةٍ حقيقية فقط. لا تحليل صوتي آلي، ولا درجة نطقٍ أو طلاقة، ولا يُمنح مستوى ولا بوابة.";

export const COMPREHENSIBILITY_EVIDENCE_BOUNDARY =
  "listener-judged-real-task-outcome-no-automatic-analysis-no-pronunciation-or-fluency-score-no-level-gate" as const;

/** سقفٌ لكل جلسة تدريب: ثلاث مهامٍ فقط كي تبقى المهمة «مهمةً» لا قائمةً تُنجَز آليًا. */
export const COMPREHENSIBILITY_MAX_PER_SESSION = 3;

/** تسجيل ذاتي ≠ تحقّق خارجي. التسمية تظهر في الواجهة وفي كل سجلّ. */
export const COMPREHENSIBILITY_MODES = ["peer-human-listener", "self-listen-back"] as const;

export type ComprehensibilityMode = (typeof COMPREHENSIBILITY_MODES)[number];

export const COMPREHENSIBILITY_OUTCOMES = [
  "task-achieved-immediately",
  "task-achieved-after-repetition",
  "task-not-achieved",
] as const;

export type ComprehensibilityOutcome = (typeof COMPREHENSIBILITY_OUTCOMES)[number];

export type ComprehensibilityTask = {
  id: string;
  level: CEFRLevel;
  titleAr: string;
  scenarioAr: string;
  speakingGoalDe: string;
  listenerInstructionAr: string;
  listenerQuestionAr: string;
  listenerOptions: Array<{ id: string; labelAr: string }>;
  correctOptionId: string;
  informationPointsAr: string[];
  durationHintSeconds: number;
  authored: true;
};

type AuthoredComprehensibilityTask = ComprehensibilityTask;

/**
 * بنكُ مهامٍ مُؤلَّف داخل المشروع (٨ مهام: مستويان لكل مستوى A1–B2).
 * الجواب الصحيح واحد، وورقة المتعلّم تعرضه له وحده؛ المستمع لا يراه.
 */
export const comprehensibilityTasks: readonly AuthoredComprehensibilityTask[] = [
  {
    id: "comp-a1-01",
    level: "A1",
    titleAr: "موعد مع الطبيبة",
    scenarioAr: "تتصل بعيادة وتطلب موعدًا؛ الشخص الآخر يجب أن يسجّل اليوم والساعة بشكل صحيح.",
    speakingGoalDe: "Guten Tag, ich brauche einen Termin. Am Dienstag um zehn Uhr, bitte.",
    listenerInstructionAr: "اسأل المستمع: أي يوم وأي ساعة طلبت؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما اليوم والساعة اللذان سُجّلا في المهمة؟",
    listenerOptions: [
      { id: "tue-10", labelAr: "الثلاثاء، العاشرة" },
      { id: "mon-10", labelAr: "الاثنين، العاشرة" },
      { id: "tue-12", labelAr: "الثلاثاء، الثانية عشرة" },
    ],
    correctOptionId: "tue-10",
    informationPointsAr: ["اليوم الصحيح", "الساعة الصحيحة"],
    durationHintSeconds: 30,
    authored: true,
  },
  {
    id: "comp-a1-02",
    level: "A1",
    titleAr: "الطريق إلى الصيدلية",
    scenarioAr: "تشرح الطريق لشخص في الشارع؛ يجب أن يصل إلى المكان الصحيح.",
    speakingGoalDe: "Gehen Sie geradeaus, dann links. Die Apotheke ist neben der Bank.",
    listenerInstructionAr: "اسأل المستمع: إلى أين وصل؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "إلى أين وصل السائل بعد الشرح؟",
    listenerOptions: [
      { id: "pharmacy", labelAr: "إلى الصيدلية" },
      { id: "bank-inside", labelAr: "إلى داخل البنك" },
      { id: "supermarket", labelAr: "إلى السوبرماركت" },
    ],
    correctOptionId: "pharmacy",
    informationPointsAr: ["اتجاه السير", "العلامة المميزة"],
    durationHintSeconds: 30,
    authored: true,
  },
  {
    id: "comp-a2-01",
    level: "A2",
    titleAr: "شكوى على هاتف معطّل",
    scenarioAr: "تشرح لمتجرٍ ما المشكلة؛ يجب أن يعرف الموظف نوع العطل وتاريخ الشراء.",
    speakingGoalDe: "Ich habe das Handy vor zwei Wochen gekauft. Der Bildschirm ist kaputt.",
    listenerInstructionAr: "اسأل المستمع: ما المشكلة ومتى تم الشراء؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما العطل وتاريخ الشراء في المهمة؟",
    listenerOptions: [
      { id: "screen-two-weeks", labelAr: "شاشة مكسورة، قبل أسبوعين" },
      { id: "battery-two-weeks", labelAr: "بطارية، قبل أسبوعين" },
      { id: "screen-two-months", labelAr: "شاشة مكسورة، قبل شهرين" },
    ],
    correctOptionId: "screen-two-weeks",
    informationPointsAr: ["نوع العطل", "تاريخ الشراء", "الطلب المتوقع"],
    durationHintSeconds: 45,
    authored: true,
  },
  {
    id: "comp-a2-02",
    level: "A2",
    titleAr: "تأكيد مشتركٍ في حدث",
    scenarioAr: "تترك رسالة صوتية لصديق عن لقاء؛ يجب أن يعرف المكان والزمن واسم المطعم.",
    speakingGoalDe: "Wir treffen uns am Freitag um sieben im Restaurant Astoria.",
    listenerInstructionAr: "اسأل المستمع: أين ومتى اللقاء؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "أين ومتى وماذا كان اللقاء؟",
    listenerOptions: [
      { id: "fri-19-astoria", labelAr: "الجمعة السابعة، مطعم أستوريا" },
      { id: "sat-19-astoria", labelAr: "السبت السابعة، مطعم أستوريا" },
      { id: "fri-19-cinema", labelAr: "الجمعة السابعة، السينما" },
    ],
    correctOptionId: "fri-19-astoria",
    informationPointsAr: ["اليوم", "الساعة", "اسم المكان"],
    durationHintSeconds: 45,
    authored: true,
  },
  {
    id: "comp-b1-01",
    level: "B1",
    titleAr: "تأجيل تسليم مشروع",
    scenarioAr: "تشرح لمديرك سبب التأجيل وتقترح موعدًا بديلًا؛ يجب أن يفهم السبب والموعد الجديد.",
    speakingGoalDe: "Leider verzögert sich das Projekt um eine Woche, weil der Lieferant fehlt. Ich schlage den zwanzigsten vor.",
    listenerInstructionAr: "اسأل المستمع: ما السبب والموعد المقترح؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما السبب والموعد الجديد للمشروع؟",
    listenerOptions: [
      { id: "delivery-20", labelAr: "تأخّر مورّد، الموعد الجديد العشرون" },
      { id: "illness-20", labelAr: "مرض، الموعد الجديد العشرون" },
      { id: "delivery-12", labelAr: "تأخّر مورّد، الموعد الجديد الثاني عشر" },
    ],
    correctOptionId: "delivery-20",
    informationPointsAr: ["السبب", "الموعد البديل", "الاقتراح الملموس"],
    durationHintSeconds: 60,
    authored: true,
  },
  {
    id: "comp-b1-02",
    level: "B1",
    titleAr: "شكوى في سكنٍ مشترك",
    scenarioAr: "تشرح للمالكة مشكلة تدفئة متكررة وتطلب إجراءً؛ يجب أن تفهم النتيجة المطلوبة.",
    speakingGoalDe: "Die Heizung fällt jede Nacht aus. Ich brauche bitte eine Reparatur in dieser Woche.",
    listenerInstructionAr: "اسأل المستمع: ما المشكلة وما الإجراء المطلوب؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما المشكلة وما الإجراء المطلوب؟",
    listenerOptions: [
      { id: "heating-repair", labelAr: "تدفئة تتوقف، إصلاح هذا الأسبوع" },
      { id: "water-repair", labelAr: "ماء ساخن أسود، إصلاح هذا الأسبوع" },
      { id: "heating-wait", labelAr: "تدفئة تتوقف، انتظار الشهر القادم" },
    ],
    correctOptionId: "heating-repair",
    informationPointsAr: ["وصف العطل", "تكراره", "المهلة المطلوبة"],
    durationHintSeconds: 60,
    authored: true,
  },
  {
    id: "comp-b2-01",
    level: "B2",
    titleAr: "دفاع عن رأي في اجتماع",
    scenarioAr: "توضح موقفك من تخفيض ساعات العمل مع حلٍّ وسط؛ يجب أن يفهم الزميل موقفك وشرطك.",
    speakingGoalDe: "Ich befürworte die kürzere Woche, allerdings nur mit einer klaren Ausgleichsregel.",
    listenerInstructionAr: "اسأل المستمع: ما موقفي وما شرطي؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما الموقف وما الشرط في المهمة؟",
    listenerOptions: [
      { id: "support-with-rule", labelAr: "مؤيد، بشرط وجود قاعدة تعويض واضحة" },
      { id: "reject", labelAr: "رافض تمامًا للأمر" },
      { id: "support-unconditional", labelAr: "مؤيد بلا أي شرط" },
    ],
    correctOptionId: "support-with-rule",
    informationPointsAr: ["الموقف", "الشرط", "المقترح العملي"],
    durationHintSeconds: 75,
    authored: true,
  },
  {
    id: "comp-b2-02",
    level: "B2",
    titleAr: "تعقيد في عقد عمل",
    scenarioAr: "تشرح لصديق بندًا غامضًا في عقد وتأثيره عليك وتطلب نصيحته؛ يجب أن يفهم الخطر وطلبه.",
    speakingGoalDe: "Die Klausel zur Probezeit ist unklar. Wenn sie so bleibt, verliere ich zwei Wochen Urlaub.",
    listenerInstructionAr: "اسأل المستمع: ما البند الغامض وما أثره؟ ثم اختر الجواب الذي نفّذته معك.",
    listenerQuestionAr: "ما البند الغامض وما أثره على المتحدث؟",
    listenerOptions: [
      { id: "probation-vacation", labelAr: "بند فترة التجربة، فقدان أسبوعين من الإجازة" },
      { id: "salary-vacation", labelAr: "بند الراتب، فقدان أسبوعين من الإجازة" },
      { id: "probation-nothing", labelAr: "بند فترة التجربة، بلا أثر" },
    ],
    correctOptionId: "probation-vacation",
    informationPointsAr: ["البند الغامض", "الأثر المحدد", "الطلب من المستمع"],
    durationHintSeconds: 75,
    authored: true,
  },
];

export const COMPREHENSIBILITY_TASK_COUNT = comprehensibilityTasks.length;

export function comprehensibilityTaskById(id: string) {
  return comprehensibilityTasks.find((task) => task.id === id);
}

export const COMPREHENSIBILITY_LEVEL_COUNTS = (["A1", "A2", "B1", "B2"] as CEFRLevel[]).map(
  (level) => [level, comprehensibilityTasks.filter((task) => task.level === level).length] as const,
);

/** الانتقاء بمستوى المتعلّم وحده، مع تقديم ما لم يُنجَز، وبسقف الجلسة المعلن. */
export function selectComprehensibilityTasks(
  level: CEFRLevel,
  completedTaskIds: readonly string[] = [],
  limit = COMPREHENSIBILITY_MAX_PER_SESSION,
) {
  const done = new Set(completedTaskIds);
  const pool = comprehensibilityTasks.filter((task) => task.level === level);
  const unseen = pool.filter((task) => !done.has(task.id));
  const seen = pool.filter((task) => done.has(task.id));
  return [...unseen, ...seen].slice(0, Math.max(1, limit));
}

export type ComprehensibilityJudgmentInput = {
  taskId: string;
  mode: ComprehensibilityMode;
  outcome: ComprehensibilityOutcome;
  listenerSelectedOptionId?: string;
  repeatedTimes: 0 | 1 | 2;
  unclearInformationPointIds: readonly string[];
  now?: Date;
  id?: string;
};

/**
 * إنشاء سجلّ حكمٍ مع تحقّق صارم: لا حكمَ بلا مستمعٍ مُعلَن، ولا «نجاح» باختيارٍ مخالفٍ للمعلومة الصحيحة.
 */
export function createComprehensibilityCheck(input: ComprehensibilityJudgmentInput) {
  const task = comprehensibilityTaskById(input.taskId);
  if (!task) throw new Error("مهمة غير معروفة: لا يمكن تسجيل حكم بلا مهمة مُؤلَّفة.");
  if (!COMPREHENSIBILITY_MODES.includes(input.mode)) throw new Error("وضع الحكم غير صالح.");
  if (!COMPREHENSIBILITY_OUTCOMES.includes(input.outcome)) throw new Error("نتيجة المهمة غير صالحة.");
  if (input.repeatedTimes !== 0 && input.repeatedTimes !== 1 && input.repeatedTimes !== 2)
    throw new Error("عدد مرات الإعادة يجب أن يكون 0 أو 1 أو 2.");
  if (input.listenerSelectedOptionId && !task.listenerOptions.some((option) => option.id === input.listenerSelectedOptionId))
    throw new Error("اختيار المستمع ليس من خيارات المهمة.");
  const unclear = input.unclearInformationPointIds.filter((point) => task.informationPointsAr.includes(point));
  if (unclear.length !== input.unclearInformationPointIds.length)
    throw new Error("نقاط غير واضحة لا تنتمي إلى هذه المهمة.");
  const matchesIntendedInfo = input.listenerSelectedOptionId ? input.listenerSelectedOptionId === task.correctOptionId : null;
  if (input.outcome === "task-achieved-immediately" && matchesIntendedInfo === false)
    throw new Error("لا يُسجَّل «أنجزت المهمة» إذا اختار المستمع معلومةً مخالفة للمقصود.");
  if (input.outcome === "task-achieved-immediately" && input.repeatedTimes !== 0)
    throw new Error("«أنجزت مباشرة» لا يقبل إعادةً مسجَّلة.");
  if (input.outcome === "task-achieved-after-repetition" && input.repeatedTimes === 0)
    throw new Error("«أنجزت بعد إعادة» يتطلب تسجيل الإعادة.");
  const now = input.now ?? new Date();
  return {
    id: input.id ?? `comp-${crypto.randomUUID()}`,
    policyVersion: COMPREHENSIBILITY_POLICY_VERSION,
    taskId: task.id,
    level: task.level,
    mode: input.mode,
    verification:
      input.mode === "peer-human-listener"
        ? ("peer-listener-reported" as const)
        : ("self-report-no-external-verification" as const),
    outcome: input.outcome,
    listenerSelectedOptionId: input.listenerSelectedOptionId ?? null,
    matchesIntendedInfo,
    repeatedTimes: input.repeatedTimes,
    unclearInformationPoints: unclear,
    evidenceBoundary: COMPREHENSIBILITY_EVIDENCE_BOUNDARY,
    createdAt: now.toISOString(),
  };
}

export type ComprehensibilityCheckRecord = ReturnType<typeof createComprehensibilityCheck>;

/**
 * ملخّص صادق: أعدادٌ ونِسَبُ إنجازٍ للمهمة فقط — ويفصل صراحةً «مستمعٌ آخر» عن «تقرير ذاتي»،
 * ولا يحوّل أيًّا منهما إلى درجة أو مستوى.
 */
export function summarizeComprehensibilityChecks(records: readonly ComprehensibilityCheckRecord[]) {
  const byLevel = (["A1", "A2", "B1", "B2"] as CEFRLevel[]).map((level) => {
    const levelRecords = records.filter((record) => record.level === level);
    const achieved = levelRecords.filter((record) => record.outcome !== "task-not-achieved").length;
    return {
      level,
      attempts: levelRecords.length,
      achieved,
      notAchieved: levelRecords.length - achieved,
      peerVerified: levelRecords.filter((record) => record.mode === "peer-human-listener").length,
      selfReported: levelRecords.filter((record) => record.mode === "self-listen-back").length,
    };
  });
  const achieved = records.filter((record) => record.outcome !== "task-not-achieved").length;
  return {
    policyVersion: COMPREHENSIBILITY_POLICY_VERSION,
    taskCount: COMPREHENSIBILITY_TASK_COUNT,
    totalAttempts: records.length,
    achieved,
    notAchieved: records.length - achieved,
    peerVerified: records.filter((record) => record.mode === "peer-human-listener").length,
    selfReported: records.filter((record) => record.mode === "self-listen-back").length,
    byLevel,
    scoring: "no-score-no-level-no-gate" as const,
    boundaryAr: COMPREHENSIBILITY_BOUNDARY_AR,
  };
}

/** تحقّق تكامل: لا سجلَّ يخالف بنك المهام أو الحدود، ولا نسبة مئوية مُدّعاة. */
export function assertComprehensibilityIntegrity(records: readonly ComprehensibilityCheckRecord[]) {
  for (const record of records) {
    const task = comprehensibilityTaskById(record.taskId);
    if (!task) throw new Error(`سجلّ قابلية فهم لمهمة غير معروفة: ${record.taskId}`);
    if (task.level !== record.level) throw new Error(`مستوى السجلّ لا يطابق المهمة ${record.taskId}`);
    if (record.policyVersion !== COMPREHENSIBILITY_POLICY_VERSION) throw new Error("إصدار سياسة غير متوافق.");
    if (record.evidenceBoundary !== COMPREHENSIBILITY_EVIDENCE_BOUNDARY) throw new Error("حدّ الدليل تغيّر في السجلّ.");
    if (record.outcome === "task-achieved-immediately" && record.matchesIntendedInfo === false)
      throw new Error("سجلّ يدّعي إنجازًا مع اختيارٍ مخالف.");
    if (record.mode === "self-listen-back" && record.verification !== "self-report-no-external-verification")
      throw new Error("تقرير ذاتي وُسم كتحقّق خارجي.");
  }
  return true;
}
