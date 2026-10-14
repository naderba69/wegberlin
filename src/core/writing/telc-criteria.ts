/**
 * معايير telc للكتابة (B2) — تقييم ذاتي يقوم به المتعلم بجانب المراجعة البشرية.
 *
 * المصدر: كتيب telc «Tipps zur Prüfungsvorbereitung Deutsch B2» (الطبعة 6، 2020)، قسم
 * «Schriftlicher Ausdruck»: ثلاثة معايير I–III، ولكل معيار مستويات A–D.
 * الأوصاف العربية هنا صياغة مختصرة لا ترجمة حرفية؛ المرجع الرسمي هو الكتيب نفسه.
 *
 * القواعد:
 * - لا تُجمع المستويات في درجة امتحان ولا في نسبة نجاح، فلا توجد دالة مجموع في هذا الملف.
 * - التقييم الذاتي لا يحل محل المراجعة البشرية؛ الحكم النهائي للمراجع.
 * - الحفظ محلي على النسخة نفسها فقط، ولا يُرسل إلى أي خدمة خارجية.
 */

export const TELC_CRITERIA_POLICY_VERSION = "telc-criteria-self-assessment-v1" as const;

export const TELC_CRITERION_IDS = ["aufgabenbewaeltigung", "kommunikative-gestaltung", "formale-richtigkeit"] as const;
export type TelcCriterionId = (typeof TELC_CRITERION_IDS)[number];

export const TELC_LEVELS = ["A", "B", "C", "D"] as const;
export type TelcLevel = (typeof TELC_LEVELS)[number];

export interface TelcCriterion {
  id: TelcCriterionId;
  /** الاسم الرسمي كما ورد في كتيب telc. */
  nameDe: string;
  nameAr: string;
  /** السؤال الذي يساعد المتعلم على الحكم. */
  questionAr: string;
  levels: Record<TelcLevel, string>;
}

export const TELC_CRITERIA: readonly TelcCriterion[] = [
  {
    id: "aufgabenbewaeltigung",
    nameDe: "Aufgabenbewältigung",
    nameAr: "إنجاز المطلوب",
    questionAr: "هل عالجتُ النقاط المطلوبة بعمق كافٍ، ومن منظور المرسل إليه؟",
    levels: {
      A: "غطّيت المهمة كاملة: ثلاث نقاط (أو نقطتان ونقطة إضافية تخصّ الموقف) بمعالجة مناسبة لمستوى B2.",
      B: "غطّيت المهمة في معظمها: نقطتان بمعالجة مناسبة، والثالثة ناقصة أو سطحية.",
      C: "غطّيت المهمة جزئيًا: نقطة واحدة فقط بمعالجة مناسبة.",
      D: "لم تغطِّ المهمة: لا توجد نقطة معالجة بشكل مناسب، أو النص بعيد عن الموقف.",
    },
  },
  {
    id: "kommunikative-gestaltung",
    nameDe: "Kommunikative Gestaltung",
    nameAr: "البناء والتواصل",
    questionAr: "هل النص مرتّب ومترابط، وهل الأسلوب والمفردات مناسبة للرسالة الرسمية؟",
    levels: {
      A: "أسلوب رسمي وغير رسمي مقنع حسب الموقف، ومفردات واسعة، وروابط متنوعة تبيّن العلاقات بين الأفكار.",
      B: "أسلوب واضح ومفردات كافية، وروابط محدودة تجعل النص متماسكًا؛ مع تنويع مقبول للصياغة.",
      C: "كتابة عن موضوعات مألوفة بجمل متتالية أكثر منها نصًّا مترابطًا؛ روابط بسيطة ومفردات محدودة.",
      D: "أدوات أساسية فقط، وروابط قليلة جدًا، ولا يوجد ترتيب واضح للأفكار.",
    },
  },
  {
    id: "formale-richtigkeit",
    nameDe: "Formale Richtigkeit",
    nameAr: "الصحة الشكلية",
    questionAr: "هل القواعد والإملاء وعلامات الترقيم صحيحة بما يكفي حتى لا يتعطل الفهم؟",
    levels: {
      A: "قواعد جيدة، وأخطاء منهجية نادرة، والإملاء وعلامات الترقيم صحيحة إلى حد كبير.",
      B: "قواعد جيدة نسبيًا، وأخطاء منهجية قليلة لا تضرّ بالفهم.",
      C: "قواعد كافية مع تأثير واضح للغة الأم، وأخطاء منهجية متعددة لكن المعنى يبقى واضحًا في الغالب.",
      D: "بعض التراكيب صحيحة، لكن الأخطاء الأساسية كثيرة، مثل خلط الأزمنة أو نسيان مطابقة الفاعل بالفعل.",
    },
  },
];

/** ملاحظات رسمية تُعرض مع الشبكة كما هي في الكتيب، بصياغة عربية مختصرة. */
export const TELC_CRITERIA_NOTES_AR: readonly string[] = [
  "إذا لم يتعلق النص بالمهمة أصلًا (موضوع خاطئ) تُعطى المستويات D في كل المعايير.",
  "إذا كان المحتوى ناقصًا بشكل واضح يُخفَّض معيار إنجاز المطلوب، ولا يُعوَّض ذلك بلغة جميلة.",
  "قد يُعطى معيار الصحة الشكلية D بينما تبقى المعايير الأخرى أعلى؛ كل معيار يُقرأ على حدة.",
];

export interface TelcCriteriaSelfAssessment {
  policyVersion: typeof TELC_CRITERIA_POLICY_VERSION;
  assessedAt: string;
  levels: Record<TelcCriterionId, TelcLevel>;
}

export function isTelcLevel(value: unknown): value is TelcLevel {
  return typeof value === "string" && (TELC_LEVELS as readonly string[]).includes(value);
}

/** هل اختار المتعلم مستوى لكل معيار؟ لا يُحفظ التقييم الجزئي. */
export function isTelcSelectionComplete(levels: Partial<Record<TelcCriterionId, TelcLevel>>): levels is Record<TelcCriterionId, TelcLevel> {
  return TELC_CRITERION_IDS.every((id) => isTelcLevel(levels[id]));
}
