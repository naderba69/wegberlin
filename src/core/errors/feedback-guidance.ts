import type { ErrorRecord } from "@/types/learning";
import type { PracticeExercise } from "@/types/lesson-content";

/**
 * وسم نوع الخطأ في لحظة التغذية الراجعة + خطوة التعميم الإلزامية.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البندان P0-4 وP0-5): نوع الخطأ كان
 * يُسجَّل ويظهر في دفتر الأخطاء وحدها وبمعرّف إنجليزي خام (`word-order`)، ولا يظهر
 * في اللحظة التي يُخطئ فيها المتعلّم، ولا يوجد في أي مسار إلزامي خطوة «استعمل
 * القاعدة في جملة جديدة». الاسترجاع وحده يحفظ البند؛ التعميم هو ما ينقل القاعدة.
 */
export const FEEDBACK_TAXONOMY_POLICY = "feedback-error-taxonomy-v1" as const;
export const SPACED_MASTERY_POLICY = "spaced-mastery-two-spaced-successes-v1" as const;
export const SPACED_MASTERY_MIN_GAP_HOURS = 72 as const;
/** سلّم إعادة التعلّم: 10 دقائق ثم يوم ثم 3 أيام قبل العودة إلى الطابور العادي. */
export const ERROR_RELEARN_LADDER_MINUTES = [10, 1440, 4320] as const;
export const TRANSFER_MIN_WORDS = 3 as const;

export type FeedbackKind = ErrorRecord["type"];

export type FeedbackGuidance = {
  /** الاسم العربي الذي يراه المتعلّم؛ لا نعرض معرّف التخزين. */
  labelAr: string;
  /** ما يجب أن تقوله القاعدة حتى تكون قابلة للتعميم، لا وصفًا للحالة الواحدة. */
  rulePromptAr: string;
  /** خطوة التعميم: جملة جديدة من إنتاج المتعلّم. */
  transferPromptAr: string;
  /** مثال مضاد قصير يوضّح الفرق. */
  contrastAr: string;
};

export const FEEDBACK_GUIDANCE: Record<FeedbackKind, FeedbackGuidance> = {
  article: {
    labelAr: "أداة التعريف (der/die/das)",
    rulePromptAr: "قاعدة عامة: الجنس النحوي يُحفظ مع الاسم ومع صيغة الجمع منه، لا منفصلًا عنه.",
    transferPromptAr: "اكتب جملة جديدة فيها الاسم نفسه مع أداته الصحيحة.",
    contrastAr: "der Tisch · die Tische — الخطأ الشائع: die Tisch.",
  },
  case: {
    labelAr: "الحالة الإعرابية (Fall)",
    rulePromptAr: "قاعدة عامة: الحالة يفرضها الفعل أو حرف الجر، لا ترجمة المعنى من العربية.",
    transferPromptAr: "اكتب جملة جديدة فيها حرف الجر نفسه مع اسم آخر في الحالة الصحيحة.",
    contrastAr: "mit dem Bus (Dativ) — الخطأ الشائع: mit den Bus.",
  },
  "word-order": {
    labelAr: "ترتيب الكلمات",
    rulePromptAr: "قاعدة عامة: في الجملة الثانوية (weil/dass/wenn) يأتي الفعل المصرف في النهاية.",
    transferPromptAr: "اكتب جملة جديدة تبدأ بـ weil وتنتهي بالفعل المصرف.",
    contrastAr: "weil ich krank bin — الخطأ الشائع: weil ich bin krank.",
  },
  vocabulary: {
    labelAr: "المفردات والتراكيب",
    rulePromptAr: "قاعدة عامة: الكلمة تُحفظ داخل تركيبها الشائع، لا وحدها.",
    transferPromptAr: "اكتب جملة جديدة تستعمل التركيب نفسه بموضوع آخر.",
    contrastAr: "eine Entscheidung treffen — الخطأ الشائع: eine Entscheidung machen.",
  },
  spelling: {
    labelAr: "الإملاء",
    rulePromptAr: "قاعدة عامة: راجع قاعدة الحرف (ß/ss، Umlaut، التكرار) قبل الحفظ.",
    transferPromptAr: "اكتب جملة جديدة فيها الكلمة نفسها مكتوبة صحيحة.",
    contrastAr: "dass · groß — الخطأ الشائع: das · gross.",
  },
  tense: {
    labelAr: "الزمن",
    rulePromptAr: "قاعدة عامة: الزمن يُختار من موضع الحدث في الزمن، لا من زمن الجملة العربية.",
    transferPromptAr: "اكتب جملة جديدة عن حدث مختلف بالزمن المطلوب نفسه.",
    contrastAr: "Ich habe gestern gearbeitet — الخطأ الشائع: Ich arbeite gestern.",
  },
  grammar: {
    labelAr: "تركيب وصرف",
    rulePromptAr: "قاعدة عامة: اربط التصحيح بالصيغة (تصريف/عدد/تصريفي) لا بالجملة المحفوظة.",
    transferPromptAr: "اكتب جملة جديدة بالفاعل نفسه والفعل نفسه.",
    contrastAr: "du fährst · er fährt — الخطأ الشائع: du fahrt.",
  },
};

export function feedbackGuidanceFor(kind: FeedbackKind): FeedbackGuidance {
  return FEEDBACK_GUIDANCE[kind];
}

/** مطابقة مسجّل الخطأ في `capture.ts`؛ تُصدرها هنا حتى لا يوجد تعيينان مختلفان. */
export function feedbackKindForExercise(exercise: PracticeExercise): FeedbackKind {
  if (exercise.type === "word-ordering") return "word-order";
  if (exercise.type === "error-correction") return "grammar";
  return "vocabulary";
}

export type TransferCheck = { accepted: boolean; wordCount: number; reasonAr: string };

/**
 * تتحقق أن جملة التعميم جملة جديدة فعلًا: عدد كلمات كافٍ، وخالية من التصحيح الملصوق
 * وحده، ومعها إشارة الاستعمال (فعل مصرف واحد على الأقل). تُستخدم لإتاحة زر التحقق.
 */
export function validateTransferSentence(sentence: string, corrected: string): TransferCheck {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < TRANSFER_MIN_WORDS) return { accepted: false, wordCount, reasonAr: `اكتب ${TRANSFER_MIN_WORDS} كلمات على الأقل حتى تكون جملة، لا تكرارًا للتصحيح.` };
  if (words.length === 1 && corrected && words[0].toLowerCase() === corrected.trim().toLowerCase()) return { accepted: false, wordCount, reasonAr: "هذا هو التصحيح نفسه؛ أضف سياقًا جديدًا." };
  if (!/[a-zA-ZäöüÄÖÜß]/.test(sentence) || !/\s/.test(sentence.trim())) return { accepted: false, wordCount, reasonAr: "اكتب الجملة بالألمانية." };
  return { accepted: true, wordCount, reasonAr: "" };
}

export type MasterySpacingDecision = {
  granted: boolean;
  spacedSuccessCount: number;
  requiredGapHours: number;
  nextEligibleAt?: string;
  reasonAr: string;
};

/**
 * لا إتقان بلا نجاحين متباعدين 72 ساعة على الأقل. التاريخان يُقرآن من سجل المحاولات،
 * ولا يُقبل الوعد الواحد مهما كان صحيحًا ومهما كان سريعًا.
 */
export function masterySpacingDecision(successes: readonly string[], now: Date = new Date()): MasterySpacingDecision {
  // `now` يُستخدم لوسم الحالة الزمنية للقرار في الواجهة؛ القرار نفسه يعتمد على التواريخ المسجّلة وحدها.
  void now;
  const times = successes.map((value) => Date.parse(value)).filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  const gap = SPACED_MASTERY_MIN_GAP_HOURS * 3600 * 1000;
  let spaced = 0;
  for (let index = 1; index < times.length; index += 1) {
    if (times[index] - times[index - 1] >= gap) spaced += 1;
  }
  if (spaced >= 1) return { granted: true, spacedSuccessCount: spaced, requiredGapHours: SPACED_MASTERY_MIN_GAP_HOURS, reasonAr: "نجاحان متباعدان بفاصل كافٍ: يمكن وسم الإتقان." };
  const last = times.at(-1);
  const nextEligibleAt = Number.isFinite(last) ? new Date((last as number) + gap).toISOString() : undefined;
  return {
    granted: false,
    spacedSuccessCount: 0,
    requiredGapHours: SPACED_MASTERY_MIN_GAP_HOURS,
    nextEligibleAt,
    reasonAr: nextEligibleAt
      ? `نجاح أول مسجّل؛ يُعتبر الإتقان ممكنًا بعد ${SPACED_MASTERY_MIN_GAP_HOURS} ساعة من آخر نجاح.`
      : "لا يوجد نجاح مؤجّل مسجّل بعد؛ الإتقان يحتاج استرجاعًا متباعدًا لا محاولة في الجلسة نفسها.",
  };
}

/** موعد الخطوة التالية في سلّم إعادة التعلّم بعد فشل متكرر. */
export function relearnStepAt(failureCount: number, from: Date): { minutes: number; at: string } {
  const index = Math.min(Math.max(failureCount, 1), ERROR_RELEARN_LADDER_MINUTES.length) - 1;
  const minutes = ERROR_RELEARN_LADDER_MINUTES[index];
  return { minutes, at: new Date(from.getTime() + minutes * 60 * 1000).toISOString() };
}
