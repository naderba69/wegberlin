import type { CEFRLevel } from "@/types/learning";

export const DICTATION_POLICY = "adaptive-partial-full-dictation-v1" as const;
export const DICTATION_EVIDENCE_BOUNDARY = "local-form-summary-no-answer-text-cefr-mastery-or-exam-score" as const;

export type DictationMode = "partial" | "full";

export type PartialDictationSlot = {
  index: number;
  answer: string;
  focusAr: string;
};

export type DictationItem = {
  id: string;
  policyVersion: typeof DICTATION_POLICY;
  level: CEFRLevel;
  mode: DictationMode;
  titleDe: string;
  titleAr: string;
  situationAr: string;
  instructionDe: string;
  instructionAr: string;
  focusAr: string;
  canonicalText: string;
  partialTemplate?: string;
  slots?: PartialDictationSlot[];
  source: "original-authored-dictation-bank";
  audioSource: "browser-tts-synthetic";
  examGrade: false;
};

const common = {
  policyVersion: DICTATION_POLICY,
  source: "original-authored-dictation-bank",
  audioSource: "browser-tts-synthetic",
  examGrade: false,
} as const;

export const dictationBank: DictationItem[] = [
  {
    ...common, id: "dict-a1-greeting", level: "A1", mode: "partial",
    titleDe: "Begrüßung im Kurs", titleAr: "تحية في الدورة", situationAr: "تسمع متعلمة تقدم نفسها في أول لقاء.",
    instructionDe: "Hören Sie. Ergänzen Sie zwei Wörter.", instructionAr: "استمع ثم أكمل كلمتين فقط؛ لا تحتاج إلى كتابة الجملة كلها.",
    focusAr: "راقب الحرف الكبير في الاسم وكتابة ß داخل الفعل.",
    canonicalText: "Guten Tag, ich heiße Salma.", partialTemplate: "Guten {{1}}, ich {{2}} Salma.",
    slots: [{ index: 1, answer: "Tag", focusAr: "اسم يبدأ بحرف كبير" }, { index: 2, answer: "heiße", focusAr: "ß ليست ss في هذا الهدف" }],
  },
  {
    ...common, id: "dict-a1-learning", level: "A1", mode: "partial",
    titleDe: "Wohnen und Lernen", titleAr: "السكن والتعلم", situationAr: "شخص يقول أين يسكن وماذا يتعلم.",
    instructionDe: "Hören Sie. Ergänzen Sie die Verben.", instructionAr: "استمع واكتب الفعلين الناقصين.",
    focusAr: "ميز نهاية الفعل مع ich في جملتين مربوطتين بـ und.",
    canonicalText: "Ich wohne in Berlin und lerne Deutsch.", partialTemplate: "Ich {{1}} in Berlin und {{2}} Deutsch.",
    slots: [{ index: 1, answer: "wohne", focusAr: "الفعل wohnen مع ich" }, { index: 2, answer: "lerne", focusAr: "الفعل lernen مع ich" }],
  },
  {
    ...common, id: "dict-a1-bus", level: "A1", mode: "partial",
    titleDe: "Abfahrt des Busses", titleAr: "موعد الحافلة", situationAr: "إعلان قصير عن وقت انطلاق الحافلة.",
    instructionDe: "Hören Sie. Schreiben Sie Verb und Uhrzeit.", instructionAr: "استمع واكتب الفعل والوقت.",
    focusAr: "انتبه إلى Umlaut في الفعل وإلى كتابة العدد بالحروف.",
    canonicalText: "Der Bus fährt um acht Uhr.", partialTemplate: "Der Bus {{1}} um {{2}} Uhr.",
    slots: [{ index: 1, answer: "fährt", focusAr: "ä في fährt" }, { index: 2, answer: "acht", focusAr: "العدد بالحروف" }],
  },
  {
    ...common, id: "dict-a1-office", level: "A1", mode: "partial",
    titleDe: "Bitte im Amt", titleAr: "طلب في الإدارة", situationAr: "موظفة تذكر وثيقة مطلوبة.",
    instructionDe: "Hören Sie. Ergänzen Sie zwei Schlüsselwörter.", instructionAr: "أكمل كلمتي المعنى الأساسيتين بعد السماع.",
    focusAr: "راقب صيغة الطلب الرسمي وكتابة الاسم Pass بحرف كبير.",
    canonicalText: "Bitte bringen Sie Ihren Pass mit.", partialTemplate: "Bitte {{1}} Sie Ihren {{2}} mit.",
    slots: [{ index: 1, answer: "bringen", focusAr: "مصدر الفعل بعد Sie" }, { index: 2, answer: "Pass", focusAr: "اسم بحرف كبير" }],
  },
  {
    ...common, id: "dict-a2-yesterday", level: "A2", mode: "partial",
    titleDe: "Telefonat von gestern", titleAr: "مكالمة الأمس", situationAr: "شخص يروي فعلًا مكتملًا من يوم أمس.",
    instructionDe: "Hören Sie. Ergänzen Sie die Perfekt-Klammer.", instructionAr: "استمع وأكمل جزأي Perfekt حول بقية الجملة.",
    focusAr: "ابحث عن الفعل المساعد في الموضع الثاني وPartizip في النهاية.",
    canonicalText: "Gestern habe ich meine Mutter angerufen.", partialTemplate: "Gestern {{1}} ich meine Mutter {{2}}.",
    slots: [{ index: 1, answer: "habe", focusAr: "الفعل المساعد" }, { index: 2, answer: "angerufen", focusAr: "Partizip منفصل الأصل" }],
  },
  {
    ...common, id: "dict-a2-rain", level: "A2", mode: "partial",
    titleDe: "Bei Regen unterwegs", titleAr: "التنقل عند المطر", situationAr: "شخص يشرح وسيلة نقله عند المطر.",
    instructionDe: "Hören Sie. Ergänzen Sie Bedingung und Verkehrsmittel.", instructionAr: "اكتب فعل الشرط ووسيلة النقل.",
    focusAr: "لاحظ الفاصلة بعد الجملة الفرعية والشرطة في U-Bahn.",
    canonicalText: "Wenn es regnet, fahre ich mit der U-Bahn.", partialTemplate: "Wenn es {{1}}, fahre ich mit der {{2}}.",
    slots: [{ index: 1, answer: "regnet", focusAr: "فعل الجملة الفرعية" }, { index: 2, answer: "U-Bahn", focusAr: "اسم مركب بشرطة وحرفين كبيرين" }],
  },
  {
    ...common, id: "dict-a2-confirmation", level: "A2", mode: "partial",
    titleDe: "Schriftliche Bestätigung", titleAr: "تأكيد كتابي", situationAr: "متصل يطلب تأكيد الموعد كتابة.",
    instructionDe: "Hören Sie. Ergänzen Sie die höfliche Bitte.", instructionAr: "أكمل بداية الطلب المهذب وطريقة التأكيد.",
    focusAr: "انتبه إلى ö في Konjunktiv II وإلى نهاية الظرف.",
    canonicalText: "Könnten Sie mir den Termin schriftlich bestätigen?", partialTemplate: "{{1}} Sie mir den Termin {{2}} bestätigen?",
    slots: [{ index: 1, answer: "Könnten", focusAr: "بداية السؤال بحرف كبير وö" }, { index: 2, answer: "schriftlich", focusAr: "الطريقة: كتابيًا" }],
  },
  {
    ...common, id: "dict-a2-invoice", level: "A2", mode: "full",
    titleDe: "Fehler in der Rechnung", titleAr: "خطأ في الفاتورة", situationAr: "شخص يوضح ما فحصه وأين وجد الخطأ.",
    instructionDe: "Hören Sie. Schreiben Sie den ganzen Satz.", instructionAr: "في هذه المهمة الانتقالية اكتب الجملة كاملة كما سمعتها.",
    focusAr: "اكتب Perfekt والفاصلة قبل aber، ثم راقب الحرف الكبير في الأسماء.",
    canonicalText: "Ich habe die Rechnung geprüft, aber die Adresse war falsch.",
  },
  {
    ...common, id: "dict-b1-rent", level: "B1", mode: "partial",
    titleDe: "Wohnung und Arbeitsweg", titleAr: "السكن وطريق العمل", situationAr: "متحدث يقارن كلفة الشقة بقربها من العمل.",
    instructionDe: "Hören Sie. Ergänzen Sie Konnektor und Vergleichsformen.", instructionAr: "أكمل الرابط وصيغتي المقارنة قبل الانتقال إلى الإملاء الكامل.",
    focusAr: "راقب ترتيب obwohl وصيغتي höher وnäher مع Umlaut.",
    canonicalText: "Obwohl die Miete höher ist, liegt die Wohnung näher an der Arbeit.", partialTemplate: "{{1}} die Miete {{2}} ist, liegt die Wohnung {{3}} an der Arbeit.",
    slots: [{ index: 1, answer: "Obwohl", focusAr: "رابط في بداية الجملة" }, { index: 2, answer: "höher", focusAr: "صيغة مقارنة" }, { index: 3, answer: "näher", focusAr: "صيغة مقارنة" }],
  },
  {
    ...common, id: "dict-b1-analysis", level: "B1", mode: "full",
    titleDe: "Nach der Analyse", titleAr: "بعد التحليل", situationAr: "فريق يصف تغييرًا حصل بعد تحليل مشكلة.",
    instructionDe: "Hören Sie. Schreiben Sie den vollständigen Satz.", instructionAr: "اكتب الجملة كاملة، ثم قارن ترتيب الزمن والفاصلة.",
    focusAr: "توقع الفعل في نهاية nachdem ثم الفعل المصرف بعد الفاصلة.",
    canonicalText: "Nachdem wir das Problem analysiert hatten, änderten wir den Zeitplan.",
  },
  {
    ...common, id: "dict-b1-application", level: "B1", mode: "full",
    titleDe: "Vollständige Bewerbung", titleAr: "طلب توظيف مكتمل", situationAr: "نصيحة لتجنب طلب وثائق إضافية.",
    instructionDe: "Hören Sie zweimal. Schreiben Sie den vollständigen Satz.", instructionAr: "استمع مرتين إن احتجت، واكتب الجملة كاملة.",
    focusAr: "راقب المبني للمجهول مع sollte وwerden، ثم جملة damit.",
    canonicalText: "Die Bewerbung sollte vollständig sein, damit keine Unterlagen nachgereicht werden müssen.",
  },
  {
    ...common, id: "dict-b1-model", level: "B1", mode: "full",
    titleDe: "Zwei Seiten eines Modells", titleAr: "جانبان لنموذج عمل", situationAr: "متحدث يوازن فائدة نموذج جديد مع شرط نجاحه.",
    instructionDe: "Hören Sie. Notieren Sie den Satz mit beiden Konnektoren.", instructionAr: "اكتب الجملة بالرابطين المتقابلين كاملة.",
    focusAr: "تأكد من فاصلة الفصل بين Einerseits وandererseits.",
    canonicalText: "Einerseits spart das Modell Zeit, andererseits braucht das Team klare Absprachen.",
  },
  {
    ...common, id: "dict-b2-flexibility", level: "B2", mode: "full",
    titleDe: "Flexible Arbeitszeit", titleAr: "وقت العمل المرن", situationAr: "تقييم مشروط لفائدة تنظيم عمل مرن.",
    instructionDe: "Hören Sie. Rekonstruieren Sie den vollständigen Satz.", instructionAr: "أعد بناء الجملة كاملة مع الشرط والقيد، لا الكلمات المفتاحية فقط.",
    focusAr: "راقب العبارة Under bestimmten Voraussetzungen وبنية ohne … einzuschränken.",
    canonicalText: "Unter bestimmten Voraussetzungen kann eine flexible Arbeitszeit die Zufriedenheit erhöhen, ohne die Erreichbarkeit einzuschränken.",
  },
  {
    ...common, id: "dict-b2-results", level: "B2", mode: "full",
    titleDe: "Grenzen der Ergebnisse", titleAr: "حدود النتائج", situationAr: "باحثة تشرح لماذا لا يجوز تعميم نتيجة.",
    instructionDe: "Hören Sie. Schreiben Sie Aussage und Begründung vollständig.", instructionAr: "اكتب الادعاء وسببه كاملين مع علامات الترقيم.",
    focusAr: "انتبه إلى الفعل المنفصل في lassen sich verallgemeinern وقائمة الأسماء.",
    canonicalText: "Die Ergebnisse lassen sich nicht verallgemeinern, weil Branchen, Stichproben und Messmethoden erheblich voneinander abweichen.",
  },
  {
    ...common, id: "dict-b2-costs", level: "B2", mode: "full",
    titleDe: "Vorschlag unter Vorbehalt", titleAr: "اقتراح بتحفظ", situationAr: "متحدث يقبل اقتراحًا بشرط شفافية الكلفة.",
    instructionDe: "Hören Sie. Schreiben Sie den Satz mit Bedingung und Bewertung.", instructionAr: "اكتب الشرط والتقييم كما سمعتهما.",
    focusAr: "راقب sofern، المبني للمجهول، könnte وdennoch.",
    canonicalText: "Sofern die zusätzlichen Kosten transparent ausgewiesen werden, könnte der Vorschlag dennoch eine tragfähige Lösung darstellen.",
  },
  {
    ...common, id: "dict-b2-argument", level: "B2", mode: "full",
    titleDe: "Einwand und Widerspruch", titleAr: "إقرار ثم اعتراض", situationAr: "كاتبة تقر بنقطة ضعف لكنها ترفض استنتاجًا عامًا.",
    instructionDe: "Hören Sie. Schreiben Sie die vollständige Argumentationsbewegung.", instructionAr: "اكتب حركة الحجة كاملة: الإقرار ثم الاعتراض.",
    focusAr: "انتبه إلى zwar … jedoch وإلى dass في نهاية الجملة.",
    canonicalText: "Die Autorin räumt zwar Schwächen ein, widerspricht jedoch der Annahme, dass das gesamte Verfahren ungeeignet sei.",
  },
];

export function dictationItemsForLevel(level: CEFRLevel) {
  return dictationBank.filter((item) => item.level === level);
}

export function buildPartialCanonical(item: DictationItem): string {
  if (item.mode !== "partial" || !item.partialTemplate || !item.slots) throw new Error("Partial canonical text requires a template and slots.");
  return item.partialTemplate.replace(/\{\{(\d+)\}\}/gu, (_, rawIndex: string) => {
    const slot = item.slots?.find((candidate) => candidate.index === Number(rawIndex));
    if (!slot) throw new Error(`Missing dictation slot ${rawIndex}.`);
    return slot.answer;
  });
}
