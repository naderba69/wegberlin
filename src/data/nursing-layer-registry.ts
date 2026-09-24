import type { CEFRLevel } from "@/types/learning";
import type { NursingLayerUnit, NursingLayerTrack, NursingSafetyCluster } from "@/types/nursing-layer";

/** Owner contract v152 / ADR-080. Removing this registry must leave the general B2 path complete. */
export const NURSING_LAYER_VERSION = "nursing-layer-v1" as const;

/** Present on every unit and rendered on every card; the audit fails if a single unit loses it. */
export const NURSING_LAYER_DISCLAIMER_AR = "هذه صياغات لغوية لا إرشاد سريري" as const;

export const NURSING_LAYER_TRACK_LABEL_AR: Record<NursingLayerTrack, string> = {
  gewuerz: "توابل — إعادة صياغة مادة المستوى في سياق الرعاية",
  "zweiter-teller": "طبق ثانٍ — مفردات مهنية تُحفظ وتُراجَع",
};

/** The three strict rules, shown to the learner and asserted by the audit. */
export const NURSING_LAYER_RULES_AR = [
  "لا تدخل الطبقة قاعدة نحوية جديدة: كل وحدة تعيد استعمال مادة مستواها، والمشهد الذي يحتاج لغة أعلى يُرحَّل إلى مستواه ولا يُخفَّف شرحه.",
  "لا يعتمد الجواب في تمرين لغوي على معرفة سريرية: الفعل المقبول دائمًا فعلٌ لغوي (تعرّف، تأكيد، سؤال، توثيق) ولا يكون تنفيذًا على جسم أو جرعة.",
  "الطبقة طفيلية لا حاملة: إن حُذفت بقي مسار B2 العام كاملًا، ولكل مستوى ميزانية معلنة من الكلمات المضافة، وقاطع رجوع يقيس أداء مهام الامتحان العام.",
] as const;

/** Declared budget of new professional words per level. A1/A2 may add none. */
export const NURSING_LAYER_WORD_BUDGET: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 4, B2: 4 };

/**
 * Rollback breaker (rule c). This is a policy statement with a measurable trigger: if the layer is
 * followed by a measured drop in general exam-shape task accuracy, the layer is reduced and the
 * certificate path keeps priority. The audit proves the two preconditions that make the breaker
 * actionable: zero layer words inside exam tasks, and zero layer coupling to gates/mastery.
 */
export const NURSING_ROLLBACK_BREAKER = {
  version: "nursing-layer-rollback-v1",
  metric: "general exam-shape task accuracy (goethe-b2 + telc-deutsch-b2 simulations)",
  windowDays: 14,
  ifDropsPercentagePoints: 5,
  actionAr: "تُخفَّض الطبقة (إخفاء الوحدات ووقف إضافة كلمات) وتُقدَّم الشهادة العامة، ولا يُبرَّر الانخفاض بأنه «تعمّق مهني».",
  layerRemovable: true,
} as const;

/** B1+ professional vocabulary; A1/A2 German text is scanned against exactly this list. */
export const NURSING_PROFESSIONAL_WORDS = [
  "Übergabe",
  "Dienstplan",
  "Zuständigkeit",
  "Bewohnerin",
  "Dokumentation",
  "Rückfrage",
  "Angabe",
  "Vermerk",
] as const;

const unit = (value: NursingLayerUnit): NursingLayerUnit => value;

export const nursingLayerUnits: NursingLayerUnit[] = [
  unit({
    id: "a1-01-nurse", lessonId: "a1-01", level: "A1", track: "gewuerz", cluster: "recognition",
    titleDe: "Begrüßung und Name", titleAr: "التحية والاسم في أول لقاء",
    situationAr: "أنت في مكان عملك وتُقدَّم إلى شخص جديد. المطلوب لغويًّا: أن تسمع الاسمَ كما قيل فعلًا لا كما تتوقّعه.",
    reusedTheoryIds: ["a1-01-t1", "a1-01-t2"],
    targetDe: "Guten Morgen, ich bin Hamza.",
    safetyTask: {
      stimulusDe: "Guten Morgen, ich bin Hamza.",
      promptAr: "ما الذي سمعته بالضبط؟",
      options: [
        { textDe: "Guten Morgen, ich bin Hamza.", kind: "recognize", reasonAr: "تطابق حرفي مع ما قيل: الاسمُ والتحية كما سمعتهما، ولا شيء فيهما من عندك." },
        { textDe: "Guten Abend, ich bin Hamza.", kind: "guess", reasonAr: "الحرف الأول تغيّر: Abend ليست Morgen. البيئة ترفض التخمين لأن الفرق حرفي لا معنوي." },
        { textDe: "Ich bin Hamza und wohne hier.", kind: "guess", reasonAr: "زادت جملة لم تُقَل. الجملة صحيحة ألمانيًّا لكنها ليست ما سمعته." },
        { textDe: "Guten Morgen, ich heiße anders.", kind: "silent-agreement", reasonAr: "قول «غير ذلك» يلغي الاسم المسموع، وهو عكس التعرّف المطلوب." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a1-07-nurse", lessonId: "a1-07", level: "A1", track: "gewuerz", cluster: "recognition",
    titleDe: "Uhrzeit und Person", titleAr: "الساعة والاسم معًا",
    situationAr: "يُعلَن موعدٌ مع اسم. المطلوب لغويًّا: أن تفصل الساعةَ عن الاسم دون خلط، لا أن تحفظ موعدًا.",
    reusedTheoryIds: ["a1-07-t1", "a1-07-t2"],
    targetDe: "Um sieben Uhr kommt Frau Yilmaz.",
    safetyTask: {
      stimulusDe: "Um sieben Uhr kommt Frau Yilmaz.",
      promptAr: "أيّ جملةٍ تطابق ما قيل؟",
      options: [
        { textDe: "Um sieben Uhr kommt Frau Yilmaz.", kind: "recognize", reasonAr: "الساعة والاسم كما قيلا حرفيًّا." },
        { textDe: "Um halb sieben kommt Frau Yilmaz.", kind: "guess", reasonAr: "halb sieben نصف السابعة لا السابعة؛ الفرق في التعبير عن الوقت نفسه." },
        { textDe: "Um sieben Uhr kommt Frau Bauer.", kind: "guess", reasonAr: "الاسم تبدّل: القالب صحيح والاسم لا." },
        { textDe: "Gestern um sieben Uhr kam Frau Yilmaz.", kind: "guess", reasonAr: "أضفت زمنًا لم يُقل وحوّلت الجملة إلى الماضي." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a1-22-nurse", lessonId: "a1-22", level: "A1", track: "gewuerz", cluster: "recognition",
    titleDe: "Welches Körperteil?", titleAr: "أيّ جزء من الجسم؟",
    situationAr: "قال شخصٌ جملةً قصيرة عن جسمه. المطلوب لغويًّا: أن تعيد الجزءَ المذكور؛ ولا يُطلب منك أي قرار صحي.",
    reusedTheoryIds: ["a1-22-t1", "a1-22-t2"],
    targetDe: "Der Arm tut weh.",
    safetyTask: {
      stimulusDe: "Der Arm tut weh.",
      promptAr: "ما الجزء الذي قيل إنه يؤلم؟",
      options: [
        { textDe: "Der Arm tut weh.", kind: "recognize", reasonAr: "الجملة كما قيلت: Arm هو المذكور." },
        { textDe: "Das Bein tut weh.", kind: "guess", reasonAr: "الاسم تبدّل من Arm إلى Bein مع بقاء القالب." },
        { textDe: "Der Arm ist frei.", kind: "guess", reasonAr: "عكست المعنى: frei نفي للألم ولم تُقَل." },
        { textDe: "Ich habe nichts gehört.", kind: "silent-agreement", reasonAr: "إعلان عدم السماع ليس تعرّفًا؛ والجملة كانت قصيرة وواضحة." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a1-23-nurse", lessonId: "a1-23", level: "A1", track: "gewuerz", cluster: "recognition",
    titleDe: "Termin und Tag", titleAr: "الموعد واليوم",
    situationAr: "تُنقل معلومة موعدٍ في مكان يتكرر فيه الاسم. المطلوب لغويًّا: ضبط اليوم والاسم، لا الحكم على الموعد.",
    reusedTheoryIds: ["a1-23-t1", "a1-23-t2"],
    targetDe: "Herr Bauer hat am Dienstag einen Termin.",
    safetyTask: {
      stimulusDe: "Herr Bauer hat am Dienstag einen Termin.",
      promptAr: "أيّ جملةٍ لا تزيد على ما قيل ولا تنقص؟",
      options: [
        { textDe: "Herr Bauer hat am Dienstag einen Termin.", kind: "recognize", reasonAr: "اليوم والاسم كما قيلا." },
        { textDe: "Herr Bauer hat am Mittwoch einen Termin.", kind: "guess", reasonAr: "Mittwoch غير Dienstag؛ تبديل يومٍ يبدّل ترتيبًا كاملًا." },
        { textDe: "Frau Bauer hat am Dienstag einen Termin.", kind: "guess", reasonAr: "الاسم تحوّل من Herr إلى Frau." },
        { textDe: "Herr Bauer hat keinen Termin.", kind: "guess", reasonAr: "أضفت نفيًا غير موجود في الجملة." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a2-05-nurse", lessonId: "a2-05", level: "A2", track: "gewuerz", cluster: "confirmation",
    titleDe: "Anweisung bestätigen", titleAr: "تأكيد التعليمات قبل التنفيذ",
    situationAr: "سُمعت تعليمة من خطوتين. المطلوب لغويًّا: إعادةُ قولها للتأكيد؛ والبيئة تُفشل التنفيذَ الصامت وتُنجح التأكيد.",
    reusedTheoryIds: ["a2-05-t3"],
    targetDe: "Ich wiederhole: Tür schließen, Schlüssel abgeben. Ist das so richtig?",
    safetyTask: {
      stimulusDe: "Bitte die Tür schließen und den Schlüssel abgeben.",
      promptAr: "ما أولُ فعلٍ لغويٍّ تفعله؟",
      options: [
        { textDe: "Ich wiederhole: «Tür schließen, Schlüssel abgeben.» — Ist das so richtig?", kind: "confirm", reasonAr: "أعدتَ الخطوتين ثم طلبت تأكيدًا، فيظهر أيُّ خطوةٍ اختلطت قبل التنفيذ." },
        { textDe: "Ich mache es sofort, ohne zu antworten.", kind: "act-now", reasonAr: "التنفيذ بلا تأكيد لا يُظهر سوءَ فهم، والبيئة ترفضه لأن الخطوة الثانية قد تُنسى." },
        { textDe: "Ja, ja.", kind: "silent-agreement", reasonAr: "«نعم» لا تعيد الخطوتين ولا تكشف ما فهمته فعلًا." },
        { textDe: "Es ist bestimmt die zweite Tür.", kind: "guess", reasonAr: "أضفت تفصيلًا لم يُقَل؛ البيئة ترفض التخمين لأنه يبني على معلومة غائبة." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a2-09-nurse", lessonId: "a2-09", level: "A2", track: "gewuerz", cluster: "confirmation",
    titleDe: "Nachricht am Telefon", titleAr: "رسالة هاتفية تُعاد",
    situationAr: "رسالة هاتفية قصيرة باسمٍ ووقت. المطلوب لغويًّا: أن تُعيد الاسمَ والوقتَ ثم تسأل؛ لا أن تفسّر سبب الاتصال.",
    reusedTheoryIds: ["a2-09-t1", "a2-09-t2"],
    targetDe: "Ich wiederhole: Frau Reuter, heute Nachmittag. Und wer hat angerufen?",
    safetyTask: {
      stimulusDe: "Bitte richten Sie Frau Reuter aus: heute Nachmittag zurückrufen.",
      promptAr: "كيف تنقل الرسالة نقلاً أمينًا؟",
      options: [
        { textDe: "Ich wiederhole: Frau Reuter, heute Nachmittag. Und wer hat angerufen?", kind: "confirm", reasonAr: "أعدتَ الاسم والوقت وسألت عن المصدر؛ هكذا يبقى النقل بلا إضافة." },
        { textDe: "Ich sage nur: «Alles klar.»", kind: "silent-agreement", reasonAr: "لا إعادةَ ولا سؤالًا، فلا يظهر الاسمُ أو الوقت إن اختلطا." },
        { textDe: "Ich rate: es ging um einen Termin.", kind: "guess", reasonAr: "الموضوع لم يُذكَر؛ التخمين يُدخل معلومة ليست في الرسالة." },
        { textDe: "Ich rufe sofort zurück, ohne zu schreiben.", kind: "act-now", reasonAr: "التنفيذ قبل نقل الرسالة يُسقط إعادةَ الاسم والوقت." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a2-12-nurse", lessonId: "a2-12", level: "A2", track: "gewuerz", cluster: "confirmation",
    titleDe: "Störung melden", titleAr: "الإبلاغ عن عطل بصياغة هادئة",
    situationAr: "قيلت جملة عن عطل متكرر. المطلوب لغويًّا: إعادةُ القول ثم سؤالٌ عن الخطوة التالية بصيغة غير متصاعدة.",
    reusedTheoryIds: ["a2-12-t3"],
    targetDe: "Ich wiederhole: der Aufzug ist wieder kaputt. Was soll ich jetzt machen?",
    safetyTask: {
      stimulusDe: "Der Aufzug ist wieder kaputt.",
      promptAr: "أيّ جوابٍ ينقل المشكلة بدقة ويسأل عن الخطوة؟",
      options: [
        { textDe: "Ich wiederhole: der Aufzug ist wieder kaputt. Was soll ich jetzt machen?", kind: "confirm", reasonAr: "إعادة + سؤال مباشر: القول صار قابلًا للتحقق، والسؤال صار واضحًا." },
        { textDe: "Ich sage nichts, ich habe es verstanden.", kind: "silent-agreement", reasonAr: "الصمت يُبقي «ماذا أفعل؟» بلا جواب." },
        { textDe: "Es ist bestimmt der zweite Aufzug.", kind: "guess", reasonAr: "حدّدت أيَّ مصعدٍ بلا معلومة؛ التخمين يوجّه العمل في الاتجاه الخطأ." },
        { textDe: "Ich rufe sofort jemanden an, ohne zu fragen.", kind: "act-now", reasonAr: "مكالمة بلا سؤال تُضيع تفصيلًا سُئل عنه صراحةً." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "a2-15-nurse", lessonId: "a2-15", level: "A2", track: "gewuerz", cluster: "confirmation",
    titleDe: "Text auf der Packung wiederholen", titleAr: "إعادة نصّ العبوة بلا تفسير",
    situationAr: "عبارةٌ مكتوبة تُنقل شفهيًّا. المطلوب لغويًّا: إعادةُ نصّ العبارة حرفيًّا وسؤالُ الشخص عن تأكيدها؛ والتطبيق لا يفسّر ولا يوصي.",
    reusedTheoryIds: ["a2-15-t3"],
    targetDe: "Ich lese vor: «Packung in den Schrank stellen.» — Habe ich das richtig verstanden?",
    safetyTask: {
      stimulusDe: "Packung in den Schrank stellen.",
      promptAr: "ما الفعل اللغوي الصحيح تجاه هذه العبارة؟",
      options: [
        { textDe: "Ich lese vor: «Packung in den Schrank stellen.» — Habe ich das richtig verstanden?", kind: "confirm", reasonAr: "قراءة حرفية + سؤال تأكيد: لا تفسير ولا زيادة، والمسؤول عن المعنى يبقى المتكلّم الأصلي." },
        { textDe: "Ich erkläre: das bedeutet …", kind: "guess", reasonAr: "الشرح إضافةٌ من عندك؛ الطبقة لا تشرح ولا توصي." },
        { textDe: "Ich lege sie irgendwohin.", kind: "act-now", reasonAr: "تنفيذٌ قبل التأكيد يبني على فهم غير مُتحقَّق منه." },
        { textDe: "Ich sage: «Das ist klar.»", kind: "silent-agreement", reasonAr: "«واضح» لا تُعيد النصّ ولا تسأل، فلا يُكتشف أيُّ كلمةٍ قُرئت خطأً." },
      ],
    },
    reviewWords: [],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b1-04-nurse", lessonId: "b1-04", level: "B1", track: "zweiter-teller", cluster: "questioning",
    titleDe: "Rückfrage statt Annahme", titleAr: "سؤال يمنع الافتراض",
    situationAr: "في التسليم يقول زميلٌ جملةً مفتوحة عن وقتٍ ناقص. المطلوب لغويًّا: سؤالٌ دقيق يسمّي المجهول بدل أن تفترضه.",
    reusedTheoryIds: ["b1-04-t1", "b1-04-t3"],
    targetDe: "Was genau braucht heute mehr Zeit — und bis wann?",
    safetyTask: {
      stimulusDe: "In der Übergabe sagt eine Kollegin: «Zimmer 12 braucht heute mehr Zeit.»",
      promptAr: "أيّ فعلٍ لغويٍّ يمنع الخطأ القادم من الافتراض؟",
      options: [
        { textDe: "Nachfragen: «Was genau braucht mehr Zeit — und bis wann?»", kind: "ask", reasonAr: "سؤالٌ يسمّي المجهولين: «ما بالضبط» و«إلى متى»، بلا إضافة معلومة." },
        { textDe: "Annehmen: «Dann übernehme ich das später.»", kind: "guess", reasonAr: "افتراضٌ يبني قرارًا على معلومة غائبة؛ البيئة ترفضه." },
        { textDe: "Sofort handeln, ohne zu fragen.", kind: "act-now", reasonAr: "التنفيذ قبل السؤال يثبّت الفهمَ الخاطئ بدل أن يكشفه." },
        { textDe: "Nicken und weitergehen.", kind: "silent-agreement", reasonAr: "الإيماء يُسجّل موافقةً لا يعرف أحدٌ مضمونها." },
      ],
    },
    reviewWords: [
      { de: "die Übergabe", ar: "التسليم (نقل المعلومات بين العاملين)", exampleDe: "In der Übergabe sagt eine Kollegin: …" },
      { de: "der Dienstplan", ar: "جدول المداومة", exampleDe: "Der Dienstplan hängt am Schwarzen Brett." },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b1-19-nurse", lessonId: "b1-19", level: "B1", track: "zweiter-teller", cluster: "questioning",
    titleDe: "Nachfragen, wer genau", titleAr: "سؤال: مَن بالضبط؟",
    situationAr: "جملةٌ ناقصة تُحيل على شخصٍ غير مسمّى. المطلوب لغويًّا: طلبُ الاسم صراحةً قبل أي عمل.",
    reusedTheoryIds: ["b1-19-t3"],
    targetDe: "Wer genau? Bitte den Namen — dann frage ich nach.",
    safetyTask: {
      stimulusDe: "Eine Kollegin sagt: «Das macht heute jemand anderes.»",
      promptAr: "ما الجملة التي تُخرج الغموض بلغةٍ لا تفسير فيها؟",
      options: [
        { textDe: "Nachfragen: «Wer genau? Bitte den Namen — dann frage ich nach.»", kind: "ask", reasonAr: "طلبُ الاسم مباشرةً يحوّل «شخص آخر» إلى شخصٍ معروف." },
        { textDe: "Annehmen, dass ich gemeint bin.", kind: "guess", reasonAr: "افتراضٌ لا سند له في الجملة." },
        { textDe: "«Alles klar», und nichts weiter tun.", kind: "silent-agreement", reasonAr: "قبولٌ بلا معنى يحفظ الغموض ويؤخّر العمل." },
        { textDe: "Die Aufgabe sofort selbst beginnen.", kind: "act-now", reasonAr: "البدء قبل معرفة صاحب المهمة يخلق عملًا مزدوجًا." },
      ],
    },
    reviewWords: [
      { de: "die Zuständigkeit", ar: "الاختصاص/المسؤولية", exampleDe: "Wer hat heute diese Zuständigkeit?" },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b1-20-nurse", lessonId: "b1-20", level: "B1", track: "zweiter-teller", cluster: "questioning",
    titleDe: "Vorschlag statt Anweisung", titleAr: "اقتراح قابل للقياس لا أمر",
    situationAr: "مطلوب منك رأيٌ تنظيمي. المطلوب لغويًّا: اقتراحٌ محدَّد يذكر منفّذًا ووقتًا، بصيغة لا تفرض نفسها.",
    reusedTheoryIds: ["b1-20-t2", "b1-20-t3"],
    targetDe: "Wir könnten die Übergabe auf 14 Uhr legen — passt das dir?",
    safetyTask: {
      stimulusDe: "Eine Kollegin fragt: «Wann machen wir die Übergabe?»",
      promptAr: "أيّ جوابٍ اقتراحٌ لا أمر؟",
      options: [
        { textDe: "Wir könnten die Übergabe auf 14 Uhr legen — passt das dir?", kind: "ask", reasonAr: "Konjunktiv II يقدّم الاقتراح، والسؤال في النهاية يفتح باب الاتفاق." },
        { textDe: "Die Übergabe ist um 14 Uhr.", kind: "act-now", reasonAr: "صيغة إخبارية تُثبّت القرار بلا اتفاق، وهي أقرب إلى الأمر." },
        { textDe: "Irgendwann nach der Pause.", kind: "guess", reasonAr: "زمن غامض لا يمكن التحقق منه ولا متابعته." },
        { textDe: "Mir ist das egal.", kind: "silent-agreement", reasonAr: "الحياد يترك القرار معلّقًا ويُنقل عبؤه إلى غيرك." },
      ],
    },
    reviewWords: [
      { de: "die Bewohnerin", ar: "المقيمة (في سياق سكني أو رعائي)", exampleDe: "Eine Bewohnerin wartet auf den Termin." },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b2-04-nurse", lessonId: "b2-04", level: "B2", track: "zweiter-teller", cluster: "documentation",
    titleDe: "Verstehen und rückfragen", titleAr: "فهمٌ يُعلن ثم سؤالٌ رسمي",
    situationAr: "طلبٌ رسمي طويل. المطلوب لغويًّا: إعلانُ ما فُهم وطلبُ تأكيدٍ مهيكل بصيغة رسمية، بلا تفسير ولا التزام.",
    reusedTheoryIds: ["b2-04-t1", "b2-04-t3"],
    targetDe: "Ich halte fest, was ich verstanden habe: eine Angabe, eine Rückfrage, keine Zusage.",
    safetyTask: {
      stimulusDe: "Bitte koordinieren Sie das bis Freitag und melden Sie den Stand zurück.",
      promptAr: "أيّ صياغةٍ رسمية تُثبّت الفهم دون أن تَعِد بما لم يُتّفق عليه؟",
      options: [
        { textDe: "«Ich habe verstanden: Koordination bis Freitag, Rückmeldung über den Stand. Eine Zusage trifft das nicht.»", kind: "document", reasonAr: "جملةٌ تفصل الفهم عن الالتزام: ما فُهم مذكور، وما لم يُتّفق عليه مُستثنى صراحةً." },
        { textDe: "«Kein Problem, ich mache alles fertig.»", kind: "act-now", reasonAr: "وعدٌ بما لم يُطلب ولم يُحدَّد." },
        { textDe: "«Ich denke, es wird Freitag klappen.»", kind: "guess", reasonAr: "توقّعٌ شخصي يُقرأ كالتزام." },
        { textDe: "Schweigen und später antworten.", kind: "silent-agreement", reasonAr: "الصمت لا يوثّق شيئًا ولا يفتح تنبيهًا مبكرًا." },
      ],
    },
    reviewWords: [
      { de: "die Rückfrage", ar: "سؤال استيضاح", exampleDe: "Ich habe eine Rückfrage zum Umfang." },
      { de: "die Angabe", ar: "المعطى/البيان", exampleDe: "Eine Angabe fehlt noch im Vermerk." },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b2-05-nurse", lessonId: "b2-05", level: "B2", track: "zweiter-teller", cluster: "documentation",
    titleDe: "Beobachtung ohne Deutung", titleAr: "ملاحظة بلا تفسير",
    situationAr: "أمامك ملاحظةٌ وبيانات مسجّلة. المطلوب لغويًّا: صياغةٌ تنقل ما سُجّل فقط، وتفصل الارتباط عن السبب.",
    reusedTheoryIds: ["b2-05-t2", "b2-05-t3"],
    targetDe: "Notiert wurde: «Um 14:00 Uhr hat die Kollegin die Angabe ergänzt.»",
    safetyTask: {
      stimulusDe: "Im Vermerk steht: «Um 14:00 Uhr hat die Kollegin die Angabe ergänzt.»",
      promptAr: "أيّ جملةٍ تُنقل الملاحظة بلا زيادة تفسير؟",
      options: [
        { textDe: "Ich notiere: «Um 14:00 Uhr ergänzt.» — ohne Deutung.", kind: "document", reasonAr: "نقلُ ما سُجّل مع تنصيص على ترك التفسير؛ الارتباط لا يصبح سببًا." },
        { textDe: "«Das war bestimmt ein Fehler.»", kind: "guess", reasonAr: "حكمٌ لا يسنده النصّ المسجّل." },
        { textDe: "«Alles in Ordnung, kein Problem.»", kind: "silent-agreement", reasonAr: "طمأنةٌ لا تُنقل من نصٍّ ولا تُسجَّل." },
        { textDe: "«Ich weiß es nicht, ich war nicht da.»", kind: "guess", reasonAr: "جوابٌ صحيح لغويًّا لكنه لا يؤدّي المهمة: النقل من الملاحظة لا من الحضور." },
      ],
    },
    reviewWords: [
      { de: "der Vermerk", ar: "المذكّرة/الملاحظة المسجّلة", exampleDe: "Der Vermerk ist kurz und sachlich." },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
  unit({
    id: "b2-10-nurse", lessonId: "b2-10", level: "B2", track: "zweiter-teller", cluster: "documentation",
    titleDe: "Dokumentation wörtlich weitergeben", titleAr: "نقلُ التوثيق بدرجة يقينه",
    situationAr: "تُنقل معلومةٌ موثّقة إلى شخص آخر. المطلوب لغويًّا: حفظُ درجة اليقين عند النقل حتى لا يصير الاحتمالُ حقيقة.",
    reusedTheoryIds: ["b2-10-t1", "b2-10-t2"],
    targetDe: "In der Dokumentation steht: «laut Angabe» — nicht: «es ist bewiesen».",
    safetyTask: {
      stimulusDe: "In der Dokumentation steht: «laut Angabe der Kollegin».",
      promptAr: "أيّ نقلٍ يحفظ درجة اليقين كما في الأصل؟",
      options: [
        { textDe: "«Laut Angabe der Kollegin — nachweislich ist das nicht.»", kind: "document", reasonAr: "نقلٌ يفصل المصدر («لaut Angabe») عن الدليل («nachweislich»)، فيبقى اليقين كما كان." },
        { textDe: "«Es ist nachweislich so.»", kind: "guess", reasonAr: "رفعُ الاحتمال إلى يقين يغيّر المعنى عند النقل." },
        { textDe: "«Vielleicht, ich habe es nicht gelesen.»", kind: "guess", reasonAr: "إعلان الجهل لا ينقل ما هو مكتوب." },
        { textDe: "«Wird schon stimmen.»", kind: "silent-agreement", reasonAr: "موافقة عامة تمحو مصدر المعلومة." },
      ],
    },
    reviewWords: [
      { de: "die Dokumentation", ar: "التوثيق", exampleDe: "In der Dokumentation steht: «laut Angabe»." },
    ],
    disclaimerAr: NURSING_LAYER_DISCLAIMER_AR,
    reviewStatus: "authored-review-pending",
    professionalReview: "pending-nursing-professional",
    reviewerId: "independent-german-reviewer",
    ownerId: "content-owner",
    sourceVersion: NURSING_LAYER_VERSION,
  }),
];

export const nursingLayerUnitsForLesson = (lessonId: string): NursingLayerUnit[] =>
  nursingLayerUnits.filter((item) => item.lessonId === lessonId);

export const nursingLayerTrackFor = (level: CEFRLevel): NursingLayerTrack =>
  level === "A1" || level === "A2" ? "gewuerz" : "zweiter-teller";

export const nursingLayerClusters: NursingSafetyCluster[] = ["recognition", "confirmation", "questioning", "documentation"];

/** TSV in the exact header of the existing personal-vocabulary import, so B1+ words stay reviewable. */
export const nursingReviewWordsTsv = (units: NursingLayerUnit[]): string => {
  const rows = units.flatMap((item) => item.reviewWords.map((word) => [word.de, word.ar, word.exampleDe, `nursing-layer-${item.level}`].join("\t")));
  return ["German\tArabic\tExample\tTags", ...rows].join("\n");
};
