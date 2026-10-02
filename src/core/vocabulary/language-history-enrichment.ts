/**
 * التاريخ اللغوي كإثراء اختياري موثّق (P2-119، ADR-094).
 *
 * ما هذا: ملاحظاتٌ **مؤلَّفة بأيدينا** عن تاريخ كلماتٍ وأشكالٍ ألمانية (أصلٌ لاتيني،
 * استعارات عربية/تركية/إيطالية/فرنسية، اشتقاق وتكوين كلمات، محطاتٌ في تاريخ اللغة
 * الألمانية)، تُعرض **فقط إذا فعّلها المتعلّم**، وكل ملاحظة تحمل **مرجعها المعلن**
 * و**درجة قوّتها**.
 *
 * القيود الحاكمة:
 *  1. **اختيارية بالكامل:** الافتراضيّ `enabled: false`؛ ولا تُعرض ملاحظة واحدة قبله.
 *  2. **صفر أثر على التعلّم:** لا تدخل أي حكم مستوى ولا حساب إتقان ولا حدث دليل؛
 *     ليست تمرينًا ولا سؤال امتحان، بل ملاحظة قراءة.
 *  3. **موثّقة بصدق:** لكل ملاحظة مرجع معلن، وكل ادّعاء موسوم: `documented` أو
 *     `disputed` أو `refuted-folk-etymology` (نمط «أصل شعبي» شائع وقد دُحض).
 *  4. **بصياغتنا لا نقلًا:** الملخّص مكتوب بكلماتنا؛ ولا نقل حرفيًا من مرجع.
 *  5. **صفر شبكة وصفر جلب:** الملاحظات مؤلَّفة ومشحونة؛ لا استعلام ولا `fetch`.
 */

export const LANGUAGE_HISTORY_POLICY = "optional-language-history-enrichment-v1" as const;

export const LANGUAGE_HISTORY_BOUNDARY =
  "enrichment-only-no-grading-no-mastery-no-network" as const;

export const LANGUAGE_HISTORY_OFF_NOTE_AR =
  "التاريخ اللغوي معطّل حاليًا. لا تُعرض أي ملاحظة حتى تُفعّله بنفسك — ولا شيء منه يؤثر في تقدّمك أو أدلّتك.";

export const LANGUAGE_HISTORY_BOUNDARY_AR =
  "إثراء قراءة اختياري: لا يمنح درجة ولا يعدّل إتقانًا ولا يُنشئ دليلًا، ولا يدخل أي بوابة مستوى. الملخّصات بصياغتنا من المراجع المعلنة أدناه، ولا ننقل نصًّا حرفيًّا منها؛ وحيث اختلف البحث نوسم الادّعاء صريحًا.";

export const LANGUAGE_HISTORY_DISPUTED_NOTE_AR =
  "وسم «disputed/refuted» يعني أن الرواية الشائعة عن أصل الكلمة لا تسندها المراجع المتخصّصة؛ عرضناها لأنّ معرفة الشائع الخاطئ جزء من الدرس.";

export type LanguageHistoryClaimStrength =
  | "documented"
  | "disputed"
  | "refuted-folk-etymology";

export type LanguageHistoryKind =
  | "loanword"
  | "word-formation"
  | "etymology"
  | "language-history";

export type LanguageHistoryNote = {
  noteId: string;
  /** الكلمة أو الظاهرة التي تخصّها الملاحظة. */
  headword: string;
  level: "A1" | "A2" | "B1" | "B2";
  kind: LanguageHistoryKind;
  claimStrength: LanguageHistoryClaimStrength;
  /** الملخّص — بصياغتنا نحن. */
  historyAr: string;
  /** دروس منشورة تصلح هذه الملاحظة بجانبها. */
  lessonIds: readonly string[];
  sourceKey: LanguageHistorySourceKey;
};

export type LanguageHistorySourceKey =
  | "dwds"
  | "dw-arabic-roots"
  | "dpa-alcohol"
  | "unger-arabic-words"
  | "kluge";

export type LanguageHistorySource = {
  key: LanguageHistorySourceKey;
  labelAr: string;
  labelDe: string;
  kind: "online-dictionary" | "press-feature" | "fact-check" | "print-reference";
  url?: string;
};

/** المراجع المعلنة: تُعرض كما هي مع الملاحظات، بلا ادّعاء غير ما هو مكتوب فيها. */
export const languageHistorySources: readonly LanguageHistorySource[] = [
  { key: "dwds", labelAr: "DWDS — القاموس الرقمي للغة الألمانية (مادة الكلمة)", labelDe: "DWDS — Digitales Wörterbuch der deutschen Sprache", kind: "online-dictionary", url: "https://www.dwds.de/wb/" },
  { key: "dw-arabic-roots", labelAr: "DW (دويتشه ڤيله) — «من الكحول إلى السكر: كلمات بجذور عربية»", labelDe: "Deutsche Welle — From alcohol to sugar: Words with Arabic roots", kind: "press-feature", url: "https://amp.dw.com/en/from-alcohol-to-sugar-words-with-arabic-roots/a-43680397" },
  { key: "dpa-alcohol", labelAr: "تدقيق dpa: «كلمة Alkohol تعود إلى منتج تجميلي» (ودحض أصل «الروح آكلة الجسد»)", labelDe: "dpa-Faktencheck: Das Wort «Alkohol» geht auf ein Kosmetikprodukt zurück", kind: "fact-check", url: "https://dpa-factchecking.com/germany/230605-99-948521/" },
  { key: "unger-arabic-words", labelAr: "أندرياس أونغر، «من الجبر إلى السكر — كلمات عربية في الألمانية» (كتاب مرجعي)", labelDe: "Andreas Unger, Von Algebra bis Zucker — Arabische Wörter im Deutschen", kind: "print-reference" },
  { key: "kluge", labelAr: "«كلوغه» — القاموس الاشتقاقي للألمانية (مرجع مطبوع معياري)", labelDe: "Kluge, Etymologisches Wörterbuch der deutschen Sprache", kind: "print-reference" },
];

export const languageHistorySourceMap = new Map(
  languageHistorySources.map((source) => [source.key, source]),
);

export function getLanguageHistorySource(key: LanguageHistorySourceKey): LanguageHistorySource {
  const source = languageHistorySourceMap.get(key);
  if (!source) throw new Error(`مرجع غير معلن في قائمة المصادر: ${key}`);
  return source;
}

/** أقصى عدد ملاحظات معروضة في الجلسة الواحدة — حاجزٌ ضد جدار قراءة. */
export const LANGUAGE_HISTORY_MAX_PER_SESSION = 3 as const;

/** عدد الملاحظات المؤلَّفة. */
export const languageHistoryNoteCount = 14 as const;

export const languageHistoryNotes: readonly LanguageHistoryNote[] = [
  // ── A1 ─────────────────────────────────────────────────────────────────────
  {
    noteId: "lh-fenster",
    headword: "Fenster",
    level: "A1",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Fenster» دخلت الألمانية القديمة العليا من اللاتينية fenestra («فتحة، نافذة») في زمن التماسّ مع الرومان — مثل Kaiser وWein. والكلمة اللاتينية نفسها أقدم من سلالة اللغات الرومانسية كلها، فالنافذة وصلت إلينا بلفظٍ رومانيّ لا ألمانيّ أصلي.",
    lessonIds: ["a1-05", "a1-12"],
    sourceKey: "kluge",
  },
  {
    noteId: "lh-kaffee",
    headword: "Kaffee",
    level: "A1",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Kaffee» رحلةٌ طويلة: من العربية qahwa (كانت في الأصل تسمية الخمر عند بعض القبائل) إلى التركية kahve، ثم الإيطالية caffè، ومنها إلى الألمانية في القرن السابع عشر مع بيوت القهوة. ومعنى ذلك أن الكلمة العربية وصلت إلى برلين مرّتين: مرةً بالبُنّ نفسه، ومرةً بلفظ البُنّ.",
    lessonIds: ["a1-12"],
    sourceKey: "dw-arabic-roots",
  },
  {
    noteId: "lh-zucker",
    headword: "Zucker",
    level: "A1",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Zucker» أصلها العربي as-sukkar، وهي نفسها أقدم من العربية: جاءت من السنسكريتية śarkarā بمعنى «حَصىً/حبيبات». دخلت الألمانية عبر الإيطالية zucchero. فالمفارقة أن اسم المادة كان اسم «الحَصى» قبل أن تصير حلوة في الفم.",
    lessonIds: ["a1-12"],
    sourceKey: "dw-arabic-roots",
  },

  // ── A2 ─────────────────────────────────────────────────────────────────────
  {
    noteId: "lh-ziffer",
    headword: "Ziffer / Null",
    level: "A2",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Ziffer» من العربية ṣifr («صِفر/خالٍ»)، ودخلت عبر اللاتينية cifra ومعها اسم الصفر نفسه. ولهذا تعني كلمة cipher الإنجليزية اليوم «شيفرة» و«رقم صفر» في الوقت نفسه: المعنى العامّي للعدد أوسع من معناه الرياضي.",
    lessonIds: ["a2-02", "a2-08"],
    sourceKey: "dwds",
  },
  {
    noteId: "lh-baumwolle",
    headword: "Baumwolle",
    level: "A2",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Baumwolle» ترجمةٌ حرفية لمعنىً عربي: الأصل al-quṭun دخل أوروبا مع تجارة القطن، فصار الإيطالي cotone، ولكن الألمانية راحت إلى طريقٍ آخر: بنت الكلمة من نفسها — «صوف الشجر» أن Baum + Wolle. فالقطن عندنا من نبات، وعند العرب من كلمة.",
    lessonIds: ["a2-15"],
    sourceKey: "unger-arabic-words",
  },
  {
    noteId: "lh-streik",
    headword: "Streik",
    level: "A2",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Streik» استعارةٌ فصيحة من الإنجليزية strike («يضرب» — وضربُ العمل هو المقصود)، انتشرت مع حركة العمّال في القرن التاسع عشر. أي أن كلمةً إنجليزية صارت قانونًا ألمانيًّا في مئة سنة.",
    lessonIds: ["a2-08"],
    sourceKey: "kluge",
  },

  // ── B1 ─────────────────────────────────────────────────────────────────────
  {
    noteId: "lh-magazin",
    headword: "Magazin",
    level: "B1",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Magazin» كانت في العربية al-maḫzan («المخزن»)، وصارت في الإيطالية magazzino مستودعًا، ثم في الإنجليزية magazine «مستودعًا للكتابة» — ومن هنا «المجلة». فكلمة واحدة تحمل ثلاثة أشياء: مخزنًا وسلاحًا وصفحة.",
    lessonIds: ["b1-03", "b1-09"],
    sourceKey: "unger-arabic-words",
  },
  {
    noteId: "lh-alkohol",
    headword: "Alkohol",
    level: "B1",
    kind: "etymology",
    claimStrength: "refuted-folk-etymology",
    historyAr:
      "«Alkohol» من العربية al-kuḥl: «الكُحل» — مسحوق الإثمد الذي تُزيَّن به العين. وفي القرن السادس عشر استعمل باراسيلسوس «alcohol vini» أي ما يتصفّى من الخمر بالتقطير. أما الرواية المنتشرة في الإنترنت بأنها تعني «الروح آكلة الجسد» فدحضها التدقيق: لا سند لها في المراجع، لكنها باقيةٌ لأنها أطرف من الحقيقة.",
    lessonIds: ["b1-17"],
    sourceKey: "dpa-alcohol",
  },
  {
    noteId: "lh-fernweh",
    headword: "Fernweh",
    level: "B1",
    kind: "word-formation",
    claimStrength: "documented",
    historyAr:
      "«Fernweh» كلمةٌ بنتها الألمانية في القرن التاسع عشر على مقاس «Heimweh» (حنّاء): شيئان متضادّان في القافية نفسها — شوقٌ إلى البعيد مقابل شوقٌ إلى البيت. هذه القابلية للتكوين بالتركيب هي أوسع ما يربك المتعلّم وأجمل ما يخدمه.",
    lessonIds: ["b1-03", "b1-22"],
    sourceKey: "kluge",
  },
  {
    noteId: "lh-luther",
    headword: "die Lutherbibel",
    level: "B1",
    kind: "language-history",
    claimStrength: "documented",
    historyAr:
      "ترجمة لوثر (١٥٢٢ وما بعدها) لم تكن كتابًا دينيًّا فحسب، بل مصنعًا للألمانية المعيارية: وحّدت صيغًا إقليمية، وشاعت تعبيرات ما زالت في كل جملة اليوم. ولهذا نسمّي تاريخًا لغويًّا ما يُظنّ أنه تاريخٌ كنسيّ.",
    lessonIds: ["b1-09"],
    sourceKey: "kluge",
  },

  // ── B2 ─────────────────────────────────────────────────────────────────────
  {
    noteId: "lh-buero",
    headword: "Büro",
    level: "B2",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«Büro» من الفرنسية bureau: كان أولًا «الصوف الخشن» الذي يُفرش على طاولة العدّ، ثم الطاولة، ثم الغرفة، ثم الجهاز نفسه. في العربية ما يقابل الرحلة عينها: «مكتب» منه الطاولة والغرفة والدولة.",
    lessonIds: ["b2-05"],
    sourceKey: "kluge",
  },
  {
    noteId: "lh-schadenfreude",
    headword: "Schadenfreude",
    level: "B2",
    kind: "word-formation",
    claimStrength: "documented",
    historyAr:
      "«Schadenfreude» خرجت من الألمانية إلى الإنجليزية بلا تغيير تقريبًا: أخذها المتحدثون الإنجليز كما هي لأنهم لم يجدوا بديلًا في التكوين المختصر. والدرس الأسلوبي هنا أن التركيب الألماني قد يكون أقصر بلاغيًّا من أي ترجمة.",
    lessonIds: ["b2-11"],
    sourceKey: "kluge",
  },
  {
    noteId: "lh-lautverschiebung",
    headword: "die zweite Lautverschiebung",
    level: "B2",
    kind: "language-history",
    claimStrength: "documented",
    historyAr:
      "صامتُ اللغة جرت عليه «تكبيرٌ صوتيّ» ما بين القرنين الخامس والثامن، فصار p→pf و t→ss في كثير من المواضع؛ ولهذا يقابل الإنجليزي water الألماني Wasser، وmake الألماني machen. تعليل الأصوات قبل الاستعارة يوفّر عليك حشرًا لاحقًا.",
    lessonIds: ["b2-11"],
    sourceKey: "kluge",
  },
  {
    noteId: "lh-meschugge",
    headword: "meschugge",
    level: "B2",
    kind: "loanword",
    claimStrength: "documented",
    historyAr:
      "«meschugge» («مجنون» على وجه الملاطفة لا التشخيص الطبي) دخلت الألمانية من اليديشية مشوگע، وأصلها عبريّ من «مشُغّع». تُعدّ اليوم من العامّيّات، ولهذا لا يصحّ استعمالها في رسالة رسمية. المعلومة منقولةٌ من باب اللغة، لا من باب التشخيص.",
    lessonIds: ["b2-18"],
    sourceKey: "kluge",
  },
];

export const languageHistoryClaimStrengthLabelsAr: Record<LanguageHistoryClaimStrength, string> = {
  documented: "موثّق في المراجع المعلنة",
  disputed: "محلّ خلاف بين المراجع",
  "refuted-folk-etymology": "رواية شائعة دُحضت",
};

export function getLanguageHistoryNotesForLevel(level: string): LanguageHistoryNote[] {
  return languageHistoryNotes.filter((note) => note.level === level);
}

export function getLanguageHistoryNotesForLesson(lessonId: string): LanguageHistoryNote[] {
  return languageHistoryNotes.filter((note) => note.lessonIds.includes(lessonId));
}

/** الحالة الافتراضية: معطّل. الاختيارية ليست شعارًا، بل قيمة افتراضية مُختبَرة. */
export const DEFAULT_LANGUAGE_HISTORY_ENABLED = false as const;

/** التفضيل المحفوظ في الحالة: معطّل افتراضيًّا. */
export const DEFAULT_LANGUAGE_HISTORY_PREFERENCES = {
  policyVersion: LANGUAGE_HISTORY_POLICY,
  enabled: DEFAULT_LANGUAGE_HISTORY_ENABLED,
} as const;

/** هل التفضيل ما زال على الافتراضيّ؟ (يُستعمل في عدّادات الواجهة بلا تفسير) */
export function languageHistoryPreferencesAreDefault(
  preferences: { policyVersion: string; enabled: boolean },
) {
  return preferences.policyVersion === LANGUAGE_HISTORY_POLICY && preferences.enabled === DEFAULT_LANGUAGE_HISTORY_ENABLED;
}

export type LanguageHistorySessionSelection = {
  /** معرّفات الملاحظات المعروضة في هذه الجلسة، بترتيب الظهور. */
  noteIds: string[];
  truncated: boolean;
};

/**
 * اختيار ملاحظات الجلسة: بحدّ أقصى معلن، ومن مستوى المتعلّم فقط — ولا شيء حين
 * يكون الإثراء معطّلًا. الدالة نقية: لا حالة ولا تخزين ولا أثر جانبي.
 */
export function selectLanguageHistorySession(input: {
  enabled: boolean;
  level: string;
  limit?: number;
  alreadySeen?: readonly string[];
}): LanguageHistorySessionSelection {
  if (!input.enabled) return { noteIds: [], truncated: false };
  const limit = input.limit ?? LANGUAGE_HISTORY_MAX_PER_SESSION;
  const seen = new Set(input.alreadySeen ?? []);
  const candidates = getLanguageHistoryNotesForLevel(input.level).filter((note) => !seen.has(note.noteId));
  const chosen = candidates.slice(0, Math.max(0, limit));
  return { noteIds: chosen.map((note) => note.noteId), truncated: candidates.length > chosen.length };
}

export class LanguageHistoryGuardError extends Error {}

/**
 * سلامة الإثراء: كل ملاحظة لها مرجع معلن ومستوى منشور ومرحلة صحيحة، والملاحظات
 * المعطّلة لا تُعرض. تُستخدم في اختبار الوحدة وفي مُتحقّق الحالة.
 */
export function assertLanguageHistoryIntegrity(input: {
  enabled: boolean;
  selection: LanguageHistorySessionSelection;
}): void {
  for (const note of languageHistoryNotes) {
    getLanguageHistorySource(note.sourceKey);
    if (!note.historyAr.trim()) throw new LanguageHistoryGuardError(`ملاحظة بلا نصّ: ${note.noteId}`);
    if (note.lessonIds.length === 0) throw new LanguageHistoryGuardError(`ملاحظة بلا درس مرتبط: ${note.noteId}`);
  }
  if (!input.enabled && input.selection.noteIds.length > 0) {
    throw new LanguageHistoryGuardError("إثراء معطّل لكنه يعرض ملاحظات — مرفوض.");
  }
  for (const noteId of input.selection.noteIds) {
    if (!languageHistoryNotes.some((note) => note.noteId === noteId)) {
      throw new LanguageHistoryGuardError(`ملاحظة غير معروفة في الاختيار: ${noteId}`);
    }
  }
}

/** العدّادات الصريحة للواجهة: من بيانات مشحونة، لا من وعد. */
export function languageHistorySummary() {
  const byLevel = (["A1", "A2", "B1", "B2"] as const).map((level) => ({
    level,
    notes: getLanguageHistoryNotesForLevel(level).length,
  }));
  return {
    notes: languageHistoryNotes.length,
    sources: languageHistorySources.length,
    disputed: languageHistoryNotes.filter((note) => note.claimStrength !== "documented").length,
    byLevel,
    defaultEnabled: DEFAULT_LANGUAGE_HISTORY_ENABLED,
  };
}
