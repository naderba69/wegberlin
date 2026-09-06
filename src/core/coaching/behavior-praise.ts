/**
 * P0-267: قاموس مدح سلوكي موحّد — مدح يسمي الفعل المقيس، لا صفة عامة.
 *
 * المشكلة: «أحسنت» و«أداء جيد» و«رائع» لا تقول للمتعلم **ما الذي فعله** حتى
 * يعيده، ولا تقيس شيئًا يمكن التحقق منه. المطلوب في الفكرة: مدح السلوك المحدد
 * (إعادة الكتابة بعد الملاحظة، الاسترجاع عند الموعد بعد تأجيل، إنهاء كتل اليوم
 * كما خُططت) لا عبارات عامة.
 *
 * القاعدة هنا: كل مدخل في القاموس يسمي (1) الفعل المرصود، و(2) القياس الذي جعله
 * مدحًا (عدد، مدة، فاصل، نسخة). وما لا يقابله سلوك مقيس لا يُقال — الدالة تعيد
 * `null` فيُعرض بدلها توجيه محايد لا مدح.
 *
 * الحدود المُعلنة: هذا قاموس تحريري لا تقييم تربوي مستقل. المدح هنا لا يرفع
 * الإتقان ولا يغيّر جدول SM-2؛ وظيفته تسمية السلوك القابل للتكرار فقط.
 */

export const BEHAVIOR_PRAISE_VERSION = "behavior-praise-v1" as const;

export type BehaviorPraiseSurface = "today" | "review" | "exam" | "writing" | "speaking";

export type BehaviorPraise = {
  id: string;
  surface: BehaviorPraiseSurface;
  /** الفعل المرصود بوصف قابل للتحقق (لا صفة). */
  behavior: string;
  /** النص المعروض: يسمي الفعل والقياس معًا. */
  ar: string;
};

const ARABIC_LETTER = "\\u0621-\\u064A\\u0640";

/**
 * عبارات المدح العام الممنوعة. الرصد بحدود حروف عربية لا `\b`، لأن `\b` في
 * JavaScript لا يعرف العربية (`\w` لاتيني فقط) فيفلت الكلمة العربية كلها.
 */
export const GENERIC_PRAISE_PHRASES: readonly string[] = [
  "ما شاء الله",
  "استمر هكذا",
  "أداء ممتاز",
  "أداء رائع",
  "أداء جيد",
  "تقدم ممتاز",
  "تقدم رائع",
  "عمل ممتاز",
  "عمل رائع",
  "عمل جيد",
  "أحسنتم",
  "أحسنت",
  "ممتازة",
  "ممتاز",
  "رائعة",
  "رائع",
  "عبقري",
  "موهوب",
  "بطل",
];

/** أطول العبارات أولًا حتى لا يبتلع «رائع» عبارة «عمل رائع» من أول حرف. */
const sortedPhrases = [...GENERIC_PRAISE_PHRASES].sort((a, b) => b.length - a.length);

export const GENERIC_PRAISE_RE = new RegExp(
  `(?<![${ARABIC_LETTER}])(?:${sortedPhrases.join("|")})(?![${ARABIC_LETTER}])`,
  "gu",
);

/** هل هذا النص مدح عام بلا سلوك مقيس؟ */
export function isGenericPraise(text: string): boolean {
  GENERIC_PRAISE_RE.lastIndex = 0;
  return GENERIC_PRAISE_RE.test(text);
}

type PraiseValues = Record<string, number | string>;

type PraiseEntry = {
  surface: BehaviorPraiseSurface;
  behavior: string;
  render: (values: PraiseValues) => string;
  /** قيم تمثيلية: يستخدمها الاختبار لعرض كل مدخل والتحقق منه. */
  sample: PraiseValues;
};

const ENTRIES: Record<string, PraiseEntry> = {
  "today-mission-complete": {
    surface: "today",
    behavior: "أنهى كل كتل اليوم المخططة داخل ميزانية اليوم",
    sample: { completedBlocks: 4, plannedBlocks: 4, minutes: 45 },
    render: (values) => `أنهيت ${values.completedBlocks} من ${values.plannedBlocks} كتل اليوم بميزانية ${values.minutes} دقيقة كما رتّبتها الخطة — بهذا يبنى الغد على أدلة اليوم، لا على تكرار عشوائي.`,
  },
  "review-retrieved-after-delay": {
    surface: "review",
    behavior: "استرجع البطاقة عند موعدها بعد فاصل مؤجل، لا مراجعة مبكرة",
    sample: { intervalDays: 6 },
    render: (values) => `استرجعت هذه البطاقة بعد فاصل ${values.intervalDays} يوم، أي عند موعدها لا قبلها: هذا هو التثبيت بالتأجيل، وهو السلوك الذي نريده لا كثرة المراجعة.`,
  },
  "review-graded-honestly": {
    surface: "review",
    behavior: "قيّم استرجاعه بصدق بعد نسيان أو تردد فقصر الفاصل",
    sample: { intervalDays: 1 },
    render: (values) => `قيّمت استرجاعك بصدق بدل تقديره بالتمني، فصار الفاصل التالي ${values.intervalDays} يوم بدل تضخيم ثقة لا دليل عليها.`,
  },
  "exam-answered-all-in-time": {
    surface: "exam",
    behavior: "أجاب عن كل العناصر داخل المدة المقترحة للجزء",
    sample: { answered: 20, total: 20, minutesSpent: 32, plannedMinutes: 40 },
    render: (values) => `أجبت عن ${values.answered}/${values.total} عنصرًا في ${values.minutesSpent} دقيقة داخل المدة المقترحة (${values.plannedMinutes}): التدريب بالوقت جزء من المهارة لا شرطًا إداريًا.`,
  },
  "exam-answered-all": {
    surface: "exam",
    behavior: "أكمل كل العناصر ولم يترك فراغًا بلا إجابة",
    sample: { answered: 20, total: 20 },
    render: (values) => `أكملت ${values.answered}/${values.total} عنصرًا بلا فراغ متروك: الإجابة الكاملة تعطي المدرب دليلًا على كل عنصر، لا على ما اخترته فقط.`,
  },
  "module-review-completed-mixed": {
    surface: "review",
    behavior: "أكمل مراجعة مختلطة تجمع أسئلة كل دروس الوحدة بعد إنهائها",
    sample: { score: 9, total: 10, lessons: 8 },
    render: (values) => `أجبت عن ${values.score}/${values.total} في مراجعة مختلطة تجمع ${values.lessons} دروس الوحدة: هذا قياس بعد إنهاء الوحدة كلها، لا بعد قراءة شروحها.`,
  },
  "writing-revised-after-feedback": {
    surface: "writing",
    behavior: "أعاد كتابة النص بعد الملاحظات بدل تسليم المسودة",
    sample: { version: 3, axesPassed: 4, axesTotal: 5 },
    render: (values) => `أعدت كتابة النص بعد الملاحظات (النسخة ${values.version})، فاجتاز الآن ${values.axesPassed} من ${values.axesTotal} محاور: الإعادة بعد الملاحظة هي التي تغيّر النص، لا قراءة الملاحظة وحدها.`,
  },
  "speaking-re-recorded-after-listening": {
    surface: "speaking",
    behavior: "أعاد التسجيل بعد الاستماع إلى نفسه وتحديد سبب التوقف",
    sample: { attempts: 3 },
    render: (values) => `أعدت التسجيل ${values.attempts} مرات بعد الاستماع إلى نفسك: المحاولة التالية بعد الاستماع الذاتي هي التي تكشف سبب التوقف، لا كثرة التسجيل.`,
  },
};

const build = (id: string, values: PraiseValues): BehaviorPraise => {
  const entry = ENTRIES[id];
  return { id, surface: entry.surface, behavior: entry.behavior, ar: entry.render(values) };
};

/** كل المداخل معروضة بقيم تمثيلية: للاختبار والتدقيق، لا للعرض. */
export function allBehaviorPraise(): BehaviorPraise[] {
  return Object.entries(ENTRIES).map(([id, entry]) => build(id, entry.sample));
}

/** مدح مهمة اليوم: لا يُقال إلا إن أُكملت كل الكتل المخططة. */
export function todayPraise(input: { completedBlocks: number; plannedBlocks: number; minutes: number }): BehaviorPraise | null {
  if (input.plannedBlocks === 0) return null;
  if (input.completedBlocks < input.plannedBlocks) return null;
  return build("today-mission-complete", {
    completedBlocks: input.completedBlocks,
    plannedBlocks: input.plannedBlocks,
    minutes: input.minutes,
  });
}

/**
 * مدح المراجعة: التقييم 4–5 بعد فاصل مؤجل هو الاسترجاع المطلوب. أما التقييم
 * 1–3 فمدحه على **صدق التقييم** نفسه، لأن الصدق هنا سلوك مقيس أيضًا ولا يجوز
 * تعويضه بمدح عام أو بصمت.
 */
export function reviewPraise(input: { grade: number; intervalDays: number }): BehaviorPraise | null {
  if (input.grade >= 4 && input.intervalDays > 1) return build("review-retrieved-after-delay", { intervalDays: input.intervalDays });
  if (input.grade <= 3) return build("review-graded-honestly", { intervalDays: Math.max(1, input.intervalDays) });
  return null;
}

/** مدح الامتحان: إكمال كل العناصر، وداخل المدة حين تُعرف. */
export function examPraise(input: { answered: number; total: number; minutesSpent?: number; plannedMinutes?: number }): BehaviorPraise | null {
  if (input.total === 0 || input.answered < input.total) return null;
  if (typeof input.minutesSpent === "number" && typeof input.plannedMinutes === "number" && input.minutesSpent <= input.plannedMinutes) {
    return build("exam-answered-all-in-time", {
      answered: input.answered,
      total: input.total,
      minutesSpent: input.minutesSpent,
      plannedMinutes: input.plannedMinutes,
    });
  }
  return build("exam-answered-all", { answered: input.answered, total: input.total });
}

/** مدح مراجعة الوحدة: إكمال مراجعة مختلطة بعد إنهاء دروس الوحدة. */
export function moduleReviewPraise(input: { score: number; total: number; lessons: number }): BehaviorPraise | null {
  if (input.total === 0) return null;
  return build("module-review-completed-mixed", { score: input.score, total: input.total, lessons: input.lessons });
}

/** مدح الكتابة: الإعادة بعد الملاحظات، لا تسليم المسودة الأولى. */
export function writingPraise(input: { revised: boolean; version: number; axesPassed: number; axesTotal: number }): BehaviorPraise | null {
  if (!input.revised || input.version < 2) return null;
  return build("writing-revised-after-feedback", {
    version: input.version,
    axesPassed: input.axesPassed,
    axesTotal: input.axesTotal,
  });
}

/** مدح المحادثة: إعادة التسجيل بعد الاستماع الذاتي. */
export function speakingPraise(input: { attempts: number }): BehaviorPraise | null {
  if (input.attempts < 2) return null;
  return build("speaking-re-recorded-after-listening", { attempts: input.attempts });
}

/** نص آمن للعرض: مدح السلوك إن وُجد، وإلا سطر فارغ فلا يُخترع مدح. */
export function praiseText(praise: BehaviorPraise | null): string {
  return praise?.ar ?? "";
}
