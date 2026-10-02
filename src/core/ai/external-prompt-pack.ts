import type { CEFRLevel, ExamProvider } from "@/types/learning";
import { redactSensitiveText } from "@/core/security/redaction";

/**
 * P2-225 — حزمة برومبتات قابلة للنسخ إلى مساعد خارجي مجاني.
 *
 * القاعدة البنيوية: هذه الوحدة **لا تُرسل شيئًا ولا تقرأ شبكة ولا تخزينًا**.
 * تبني نصوصًا عربية جاهزة ينسخها المتعلّم بنفسه إلى مساعد خارجي يختاره.
 * وكل نص يحمل قيود المجال نفسها: لا درجة، لا ادّعاء رسمي، لا اختراع صيغة امتحان،
 * ولا أسرار: أي نص شبيه بمفتاح يُرفض قبل النسخ.
 */

export const EXTERNAL_PROMPT_PACK_POLICY = "external-prompt-pack-v1" as const;
export const EXTERNAL_PROMPT_MAX_CHARS = 1_200 as const;
export const EXTERNAL_PROMPT_PACK_MAX_CHARS = 6_000 as const;
export const EXTERNAL_PROMPT_EXTRA_MAX_CHARS = 600 as const;

/** القيود التي تُوضع في كل نص: ليست تفضيلات بل شروط استخدام. */
export const EXTERNAL_PROMPT_RULES_AR = [
  "أجب بالعربية الفصحى المبسّطة، والألمانية داخل الأمثلة فقط.",
  "لا تعطني درجة ولا نسبة ولا حكمًا باجتياز امتحان، ولا تدّع أنك جهة رسمية أو مصحّح معتمد.",
  "لا تخترع معلومات عن صيغة امتحان أو مواعيد أو رسوم؛ إن لم تكن متأكدًا فقل «لا أعرف».",
  "التزم بمستواي المذكور ولا تنتقل إلى مستوى أعلى، وإن كان سؤالي فوق مستواي فبسّطه.",
] as const;

export const externalPromptSecretRefusalAr =
  "رُفض النسخ: النصّ يحتوي ما يشبه مفتاحًا أو سرًّا (مثل مفتاح API). أزل السرّ ثم أعد المحاولة — التطبيق لا يرسل شيئًا، لكن ما تنسخه قد يُلصق خارج جهازك.";

export const EXTERNAL_PROMPT_DATA_POLICY_AR =
  "لا شيء يخرج من هذا التطبيق: لا شبكة ولا مفتاح ولا إرسال. أنت تنسخ النصّ بنفسك إلى مساعد تختاره. سياقك الإضافي تُضيفه أنت ولا يُخزَّن هنا.";

export type ExternalPromptContext = {
  level: CEFRLevel;
  targetExam: ExamProvider;
  lessonId?: string;
  lessonTitleDe?: string;
  lessonTopicAr?: string;
  /** ما يصل إلى ثلاثة أخطاء نشطة — نفس سلّم المرشد المحلي. */
  activeErrors?: string[];
  /** إضافة المتعلّم بنفسه: تُفحص ضد الأسرار ولا تُخزَّن. */
  extraContext?: string;
};

export type ExternalPromptKind =
  | "correct-writing"
  | "speak-partner"
  | "grammar-explainer"
  | "vocabulary-quiz"
  | "listening-shadowing"
  | "exam-task-practice";

export type ExternalPromptCard = {
  id: ExternalPromptKind;
  titleAr: string;
  purposeAr: string;
  text: string;
  charCount: number;
  withinCap: boolean;
};

export type ExternalPromptGuard =
  | { ok: true }
  | { ok: false; reasonAr: string };

const SECRET_PATTERNS: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{8,}\b/,
  /\b(?:api[_-]?key|apikey|access[_-]?token|bearer)\b\s*[:=]\s*\S+/i,
  /\bdwnb-ai-key\b/i,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/,
  /\b[A-Za-z0-9_-]{32,}\b/,
];

/** فحص صريح لِما يشبه السرّ: يُستخدم قبل أي نسخ، ونتيجته جزء من العقد. */
export function containsSecretLike(text: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

/** يرفض السرّ والفراغ والتجاوز، ويعيد سببًا عربيًا صريحًا. */
export function guardExternalPromptText(text: string, cap: number = EXTERNAL_PROMPT_MAX_CHARS): ExternalPromptGuard {
  if (!text.trim()) return { ok: false, reasonAr: "النصّ فارغ — لا شيء لنسخه." };
  if (containsSecretLike(text)) return { ok: false, reasonAr: externalPromptSecretRefusalAr };
  if (text.length > cap) {
    return { ok: false, reasonAr: `النصّ أطول من الحدّ المسموح (${cap.toLocaleString("en-US")} حرفًا) — قلّل السياق الإضافي.` };
  }
  return { ok: true };
}

function rulesBlockAr(): string {
  return EXTERNAL_PROMPT_RULES_AR.map((rule, index) => `${index + 1}) ${rule}`).join("\n");
}

function contextBlockAr(context: ExternalPromptContext): string {
  const lines = [`مستواي: ${context.level}`, `امتحاني المستهدف: ${context.targetExam === "goethe-b2" ? "Goethe-Zertifikat B2" : "telc Deutsch B2"}`];
  if (context.lessonId) lines.push(`الدرس الحالي: ${context.lessonId}${context.lessonTitleDe ? ` — ${context.lessonTitleDe}` : ""}`);
  if (context.lessonTopicAr) lines.push(`موضوع الدرس: ${context.lessonTopicAr}`);
  const errors = (context.activeErrors ?? []).slice(0, 3);
  if (errors.length > 0) lines.push(`أخطائي النشطة (حتى ثلاثة): ${errors.join(" · ")}`);
  const extra = context.extraContext?.trim();
  if (extra) lines.push(`سياق إضافي مني: ${extra}`);
  return lines.join("\n");
}

function templatesAr(): Record<ExternalPromptKind, { titleAr: string; purposeAr: string; bodyAr: string }> {
  return {
    "correct-writing": {
      titleAr: "تصحيح كتابة بالعربية لا بدرجة",
      purposeAr: "يصحّح نصّك الألماني ويشرح الخطأ بالعربية، ويرفض إعطاءك درجة.",
      bodyAr: `صحّح لي نصًّا ألمانيًا سأكتبه في نهاية هذه الرسالة.
المطلوب بالترتيب: (1) ثلاث ملاحظات كبرى فقط، كل ملاحظة: الصيغة الصحيحة ثم سبب لغوي بالعربية. (2) جدول صغير: خطئي ← الصحيح ← القاعدة. (3) أعد كتابة النصّ كاملًا مصحّحًا. (4) سؤال واحد لأكتب بعده جملة جديدة عن الفكرة نفسها.
لا تعطني درجة ولا تصنيفًا، ولا تدّع أن هذا تصحيح رسمي.`,
    },
    "speak-partner": {
      titleAr: "شريك حوار بجُمل قصيرة",
      purposeAr: "يحاورك بالألمانية بجمل قصيرة وبمستواك، ويصحّح بعد كل ردّ بجملة واحدة.",
      bodyAr: `كن شريك حوار بالألمانية داخل موقف واحد فقط أذكره أنا.
قواعد الحوار: جملة أو جملتان قصيرتان لكل ردّ، وسؤال واحد في كل مرة، وإذا لم أفهم فبسّط ولا تكرّر نفس الجملة حرفيًا. بعد كل ردّ لي: صحّح أبرز خطأ واحد فقط في سطر واحد بالعربية.
لا تنتقل إلى موقف آخر قبل أن أقول «الموقف التالي». لا تعطني درجة ولا حكمًا باجتياز أي مقابلة.`,
    },
    "grammar-explainer": {
      titleAr: "شرح قاعدة بأمثلة من درسي",
      purposeAr: "يشرح قاعدة واحدة بالعربية مع ثلاثة أمثلة ألمانية من موضوع درسي.",
      bodyAr: `اشرح لي قاعدة واحدة سأذكرها، بثلاثة مستويات: قاعدة في سطر واحد، ثم ثلاثة أمثلة ألمانية قصيرة من موضوع درسي، ثم خطأ شائع عند المتحدثين بالعربية في هذه القاعدة.
ثم أعطني تمرينين صغيرين فقط، وانتظر جوابي قبل التصحيح. إن كان سؤالي يخصّ قاعدة أعلى من مستواي فبسّطها ولا تتجاوزه.`,
    },
    "vocabulary-quiz": {
      titleAr: "اختبار مفردات من درس واحد",
      purposeAr: "يختبرك في كلمات درس محدد بسؤال واحد في كل مرة.",
      bodyAr: `اختبرني في مفردات درس واحد أذكره، سؤالًا واحدًا في كل مرة: مرة ألماني ← عربي، ومرة جملة ناقصة أُكملها بالكلمة الصحيحة.
بعد جوابي: صحّح في سطر واحد، وأضف مثالًا ألمانيًا واحدًا للكلمة. عند الخطأ أعد الكلمة بعد ثلاثة أسئلة لا فورًا.
لا تخرج عن مفردات الدرس المذكور ولا تعطني نسبة إتقان أو درجة.`,
    },
    "listening-shadowing": {
      titleAr: "تدريب سمع وتكرار جُملي",
      purposeAr: "يعطيك جُملًا ألمانية قصيرة لتكرارها الظلّي بلا ادّعاء تقييم نطق.",
      bodyAr: `أعطني في كل مرة جملة ألمانية واحدة قصيرة (6–10 كلمات) من موضوع درسي، مع ترجمتها العربية، واكتب معها ما أركّز عليه في النطق: مقطع واحد أو صوت واحد فقط.
انتظر تسجيلًا نصيًّا لما كرّرتُه (أكتبه بالحروف)، ثم قارنه بالجملة الأصلية في سطرين. لا تقيّم نطقي بدرجة أو نسبة، ولا تدّع أنك تقيس النطق صوتيًا — أنا أكتب ما سمعته من نفسي.`,
    },
    "exam-task-practice": {
      titleAr: "تدريب على مهمة امتحانية واحدة",
      purposeAr: "يصنع لك مهمة تدريبية على نمط المهمة التي أختارها، بلا ادعاء صيغة رسمية.",
      bodyAr: `اصنع لي مهمة تدريبية واحدة على نمط المهمة التي أسمّيها (مثال: رسالة قصيرة، وصف رسم بياني، مناقشة موقف).
المطلوب: الموقف، والتعليمات، والحدّ الزمني المقترح، ونقاط التقييم الذاتي الأربع التي أراجع بها جوابي.
تنبيه صريح: هذه مهمة تدريبية من عندك وليست نصًّا رسميًا لأي جهة امتحانية، ولا تدّع أنك تعرف الصيغة الرسمية الحالية. صحّح لي بعد أن أكتب، بالعربية، بلا درجة.`,
    },
  };
}

/** يبني نصًّا واحدًا: قيود المجال + السياق + المهمة — بهذا الترتيب الثابت. */
export function renderExternalPrompt(kind: ExternalPromptKind, context: ExternalPromptContext): string {
  const template = templatesAr()[kind];
  const extra = context.extraContext?.trim();
  if (extra && containsSecretLike(extra)) {
    throw new Error(externalPromptSecretRefusalAr);
  }
  const trimmedExtra = extra ? redactSensitiveText(extra.slice(0, EXTERNAL_PROMPT_EXTRA_MAX_CHARS)) : "";
  return [
    `# المهمّة: ${template.titleAr}`,
    "",
    "## قيود إلزامية عليك",
    rulesBlockAr(),
    "",
    "## سياقي",
    contextBlockAr({ ...context, extraContext: trimmedExtra || undefined }),
    "",
    "## المطلوب",
    template.bodyAr,
  ].join("\n");
}

const ORDER: readonly ExternalPromptKind[] = [
  "correct-writing",
  "speak-partner",
  "grammar-explainer",
  "vocabulary-quiz",
  "listening-shadowing",
  "exam-task-practice",
];

/** الحزمة كاملة: كل بطاقة نصّ جاهز للنسخ مع قياس الطول مقابل السقف. */
export function buildExternalPromptPack(context: ExternalPromptContext): ExternalPromptCard[] {
  const templates = templatesAr();
  const cards = ORDER.map((kind) => {
    const text = renderExternalPrompt(kind, context);
    return {
      id: kind,
      titleAr: templates[kind].titleAr,
      purposeAr: templates[kind].purposeAr,
      text,
      charCount: text.length,
      withinCap: text.length <= EXTERNAL_PROMPT_MAX_CHARS,
    };
  });
  const total = cards.reduce((sum, card) => sum + card.charCount, 0);
  if (total > EXTERNAL_PROMPT_PACK_MAX_CHARS) {
    throw new Error(`الحزمة أطول من السقف (${EXTERNAL_PROMPT_PACK_MAX_CHARS} حرفًا) — قلّل السياق الإضافي.`);
  }
  return cards;
}

/** فحص الحزمة قبل العرض: يمنع بطاقة بلا قيود أو بطاقة فيها سرّ أو تتجاوز السقف. */
export function assertPromptPackIntegrity(cards: readonly ExternalPromptCard[]): void {
  if (cards.length !== ORDER.length) throw new Error("الحزمة ناقصة: عدد البطاقات لا يطابق الوحدات المؤلفة.");
  for (const card of cards) {
    if (!card.withinCap) throw new Error(`البطاقة «${card.titleAr}» تتجاوز سقف ${EXTERNAL_PROMPT_MAX_CHARS} حرفًا.`);
    if (containsSecretLike(card.text)) throw new Error(externalPromptSecretRefusalAr);
    for (const rule of EXTERNAL_PROMPT_RULES_AR) {
      if (!card.text.includes(rule)) throw new Error(`البطاقة «${card.titleAr}» بلا قيد إلزامي.`);
    }
  }
}
