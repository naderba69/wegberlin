/**
 * P2-165 — محاكاة شريك الامتحان بسرعات وشخصيات مختلفة (exam partner simulation).
 *
 * ما يفعله: يعطي المتعلّم شريكًا **مُحاكى بنصوص مؤلَّفة داخل المشروع** لتدريب المحادثة الامتحانية:
 * أربع شخصيات (بنّاء متوازن · معارض سريع · متعاون بطيء · طالب تفاصيل) وثلاث سرعات إلقاء معلَنة،
 * مع دورٍ محدد للمتعلّم بعد كل جملة شريك.
 *
 * الحدود الصارمة (تُختبر آليًا):
 *  - الشريك **نصوصٌ مؤلَّفة** تُقرأ بصوت الجهاز الاصطناعي: ليس شريكًا بشريًا، ولا تعرّفًا على الكلام،
 *    ولا يفهم ما يقوله المتعلّم، ولا يردّ على كلامه، ولا يحاكي شريك الامتحان الرسمي أو أي جهة.
 *  - لا درجة، ولا مستوى، ولا طلاقة، ولا اتصال ببيانات الإتقان أو بوابة المستوى.
 *  - لا شبكة ولا تخزين من هذه الوحدة: التشغيل الصوتي في الواجهة عبر صوت الجهاز فقط.
 *  - فصل الجهات محفوظ: كل سيناريو يُعلن أنه تدريبٌ بغرضٍ شبيه فقط (`unofficial-paraphrase`)،
 *    ولا يُنسب أي نص إلى مهمة رسمية.
 */

export const EXAM_PARTNER_POLICY_VERSION = "exam-partner-simulation-v1" as const;

export const EXAM_PARTNER_BOUNDARY_AR =
  "شريك مُحاكى بنصوص مؤلَّفة تُقرأ بصوت الجهاز: لا يفهم كلامك ولا يردّ عليه، وليس شريك الامتحان الرسمي، ولا يمنح درجة أو مستوى.";

export const EXAM_PARTNER_EVIDENCE_BOUNDARY =
  "synthetic-scripted-exam-partner-no-real-partner-no-stt-no-scoring-no-official-partner-claim" as const;

export const EXAM_PARTNER_ALIGNMENT_BASIS = "unofficial-paraphrase-of-own-discussion-goal" as const;

/** سقفٌ لكل جلسة تدريب على الشريك: ست جمل متبادلة تكفي لحوارٍ قصير بلا إفراط. */
export const EXAM_PARTNER_MAX_TURNS = 6;

export const EXAM_PARTNER_PACES = [
  { id: "slow", labelAr: "بطيء (0.80×)", rate: 0.8 },
  { id: "steady", labelAr: "عادي (1.00×)", rate: 1.0 },
  { id: "fast", labelAr: "سريع (1.15×)", rate: 1.15 },
] as const;

export type ExamPartnerPaceId = (typeof EXAM_PARTNER_PACES)[number]["id"];

export type ExamPartnerPersona = {
  id: string;
  labelAr: string;
  characterAr: string;
  defaultPace: ExamPartnerPaceId;
  voiceHintAr: string;
};

export const EXAM_PARTNER_PERSONAS: readonly ExamPartnerPersona[] = [
  {
    id: "steady-constructive",
    labelAr: "شريك متوازن بنّاء",
    characterAr: "يقترح ثم يوافق بشرط، ويترك لك مساحة كاملة بلا مقاطعة.",
    defaultPace: "steady",
    voiceHintAr: "نبرة هادئة متوسطة: تمرينٌ للانتظام لا للمواجهة.",
  },
  {
    id: "fast-contrarian",
    labelAr: "شريك سريع معارض",
    characterAr: "يعترض بسرعة ويطلب أرقامًا وأمثلة، ويضغط على الوقت.",
    defaultPace: "fast",
    voiceHintAr: "نبرة أسرع: تمرينٌ على الرد السريع المنظّم لا على الجدال.",
  },
  {
    id: "slow-supportive",
    labelAr: "شريك بطيء متعاون",
    characterAr: "يعيد صياغة ما فهمه ليساعدك، ويسأل سؤالًا بسيطًا واحدًا.",
    defaultPace: "slow",
    voiceHintAr: "نبرة أبطأ: تمرينٌ على الوضوح مع شريكٍ متعاون.",
  },
  {
    id: "clarifying-detailer",
    labelAr: "شريك يطلب التفاصيل",
    characterAr: "يسأل عن المثال والسبب والتفصيل الناقص في كل دور.",
    defaultPace: "steady",
    voiceHintAr: "نبرة متوسطة: تمرينٌ على التبرير لا على السرعة.",
  },
];

export type ExamPartnerTurn = {
  partnerLineDe: string;
  yourTurnAr: string;
  goalAr: string;
};

export type ExamPartnerScenario = {
  id: string;
  titleAr: string;
  titleDe: string;
  situationAr: string;
  practiceFocus: "goethe-b2" | "telc-deutsch-b2" | "discussion-generic";
  alignmentBasis: typeof EXAM_PARTNER_ALIGNMENT_BASIS;
  turns: Record<string, ExamPartnerTurn[]>;
};

export const EXAM_PARTNER_SCENARIOS: readonly ExamPartnerScenario[] = [
  {
    id: "school-phone-ban",
    titleAr: "حظر الهاتف في المدرسة",
    titleDe: "Handyverbot in der Schule",
    situationAr: "نقاش امتحاني شفهي: هل يُمنع الهاتف في المدرسة؟ تدريبٌ بغرضٍ شبيه بالنقاش، لا محاكاة لمهمة رسمية.",
    practiceFocus: "goethe-b2",
    alignmentBasis: EXAM_PARTNER_ALIGNMENT_BASIS,
    turns: {
      "steady-constructive": [
        { partnerLineDe: "Ich finde ein Handyverbot sinnvoll, weil sich die Klasse besser konzentriert.", yourTurnAr: "دورك: قدّم رأيك المخالف مع سببين.", goalAr: "رأي + سببان" },
        { partnerLineDe: "Das sehe ich teilweise anders, aber dein erstes Argument hat mich überzeugt.", yourTurnAr: "دورك: علّق على موافقته الجزئية ثم قدّم بديلًا.", goalAr: "تعليق + اقتراح بديل" },
        { partnerLineDe: "Könnten wir uns auf eine Regel einigen, die beide Seiten akzeptieren?", yourTurnAr: "دورك: اعرض حلًّا وسطًا بشرط واحد واضح.", goalAr: "حلّ وسط + شرط" },
        { partnerLineDe: "Gut, dann halten wir fest: Handys aus, aber Pausen erlaubt.", yourTurnAr: "دورك: لخّص الاتفاق في جملتين.", goalAr: "تلخيص" },
      ],
      "fast-contrarian": [
        { partnerLineDe: "Handyverbot? Das ist doch nur Symbolpolitik, das ändert gar nichts.", yourTurnAr: "دورك: اعترض بهدوء وقدّم دليلًا من تجربتك.", goalAr: "اعتراض مهذب + مثال" },
        { partnerLineDe: "Und was ist mit dem Notfall? Eltern müssen ihre Kinder erreichen können.", yourTurnAr: "دورك: ردّ على الحالة الاستثنائية بحل عملي.", goalAr: "ردّ على اعتراض + حل" },
        { partnerLineDe: "Ihre Idee klingt gut, aber wer kontrolliert das jeden Tag?", yourTurnAr: "دورك: بيّن مَن ينفّذ الاقتراح وكيف.", goalAr: "تنفيذ قابل للتطبيق" },
        { partnerLineDe: "In Ordnung, aber nur wenn die Pausenregelung schriftlich festgehalten wird.", yourTurnAr: "دورك: اقبل الشرط وصُغه بجملة رسمية.", goalAr: "قبول بشرط + صياغة" },
      ],
      "slow-supportive": [
        { partnerLineDe: "Lass mich zusammenfassen: Du willst weniger Handy, aber klare Ausnahmen, richtig?", yourTurnAr: "دورك: أكّد أو صحّح الفهم في جملة.", goalAr: "تأكيد أو تصحيح" },
        { partnerLineDe: "Das war gut. Kannst du noch ein Beispiel aus dem Unterricht nennen?", yourTurnAr: "دورك: أعطِ مثالًا واحدًا محددًا.", goalAr: "مثال محدد" },
        { partnerLineDe: "Ich verstehe. Möchtest du die Regel für jüngere Klassen ändern?", yourTurnAr: "دورك: وضّح موقفك للصفوف الأصغر.", goalAr: "تفصيل موقف" },
        { partnerLineDe: "Danke, das war deutlich. Wiederhole bitte den Kern deiner Meinung.", yourTurnAr: "دورك: أعد رأيك الأساسي في جملة واحدة.", goalAr: "جملة مركزية" },
      ],
      "clarifying-detailer": [
        { partnerLineDe: "Was genau stört dich am Handy im Unterricht?", yourTurnAr: "دورك: حدّد الإزعاج بدقة لا بعموميات.", goalAr: "تحديد دقيق" },
        { partnerLineDe: "Kannst du das mit einer konkreten Situation belegen?", yourTurnAr: "دورك: اروِ موقفًا قصيرًا من صفٍّ حقيقي.", goalAr: "دليل من موقف" },
        { partnerLineDe: "Für welche Altersgruppe gilt dein Vorschlag zuerst?", yourTurnAr: "دورك: حدّد الفئة والبداية.", goalAr: "نطاق التطبيق" },
        { partnerLineDe: "Und wie überzeugst du die Eltern, die dagegen sind?", yourTurnAr: "دورك: اطرح طريقة إقناع عملية.", goalAr: "طريقة إقناع" },
      ],
    },
  },
  {
    id: "car-free-sundays",
    titleAr: "أحدٌ بلا سيارات في المدينة",
    titleDe: "Autofreie Sonntage in der Innenstadt",
    situationAr: "نقاش امتحاني شفهي: يوم أحد شهري بلا سيارات في المركز. تدريبٌ بغرضٍ شبيه فقط، بلا أي نسبة إلى مهمة رسمية.",
    practiceFocus: "telc-deutsch-b2",
    alignmentBasis: EXAM_PARTNER_ALIGNMENT_BASIS,
    turns: {
      "steady-constructive": [
        { partnerLineDe: "Autofreie Sonntage wären gut für die Luft, aber schlecht für Geschäfte.", yourTurnAr: "دورك: وازن بين الفائدتين مع ترجيح.", goalAr: "موازنة + ترجيح" },
        { partnerLineDe: "Wenn wir es nur einmal im Monat machen, ist der Effekt klein, oder?", yourTurnAr: "دورك: ردّ على حجم الأثر بفكرة تدريجية.", goalAr: "ردّ + تدرّج" },
        { partnerLineDe: "Wie könnten Anwohner mit Ausnahmegenehmigung behandelt werden?", yourTurnAr: "دورك: اقترح استثناءً واضحًا ومحدودًا.", goalAr: "استثناء واضح" },
        { partnerLineDe: "Das klingt umsetzbar. Fassen wir die zwei wichtigsten Punkte zusammen.", yourTurnAr: "دورك: لخّص النقطتين في جملتين.", goalAr: "تلخيص" },
      ],
      "fast-contrarian": [
        { partnerLineDe: "Autofreie Sonntage sind reine Symbolpolitik, das bringt doch nichts.", yourTurnAr: "دورك: اعترض بلطف وقدّم مقارنة بأمثلة مدن.", goalAr: "اعتراض مهذب + مقارنة" },
        { partnerLineDe: "Und die Menschen mit Behinderung? Die brauchen das Auto wirklich.", yourTurnAr: "دورك: عالج الحالة بجدّية واقترح حكمًا خاصًا.", goalAr: "معالجة حالة خاصة" },
        { partnerLineDe: "Wer bezahlt die Verkehrswende, wenn die Stadt kein Geld hat?", yourTurnAr: "دورك: اطرح تمويلًا واقعيًا أو شراكة.", goalAr: "طرح تمويل" },
        { partnerLineDe: "Na gut, einen Versuch für drei Monate würde ich mittragen.", yourTurnAr: "دورك: صُغ التجربة المؤقتة بشروط قياس.", goalAr: "تجربة مؤقتة + قياس" },
      ],
      "slow-supportive": [
        { partnerLineDe: "Ich verstehe: Du willst es zuerst einmal im Monat testen. Habe ich das richtig verstanden?", yourTurnAr: "دورك: أكّد الفهم وزِد شرطًا واحدًا.", goalAr: "تأكيد + شرط" },
        { partnerLineDe: "Nenne bitte ein Beispiel aus einer Stadt, die das schon macht.", yourTurnAr: "دورك: اعطِ مثالًا واحدًا بلا تفاصيل زائدة.", goalAr: "مثال واحد" },
        { partnerLineDe: "Und was passiert an Regentagen, wenn alle Busse voll sind?", yourTurnAr: "دورك: اقترح حلًّا ليوم ممطر.", goalAr: "حل لحالة طارئة" },
        { partnerLineDe: "Danke, das war klar. Möchtest du deine Empfehlung wiederholen?", yourTurnAr: "دورك: أعِد توصيتك في جملة.", goalAr: "توصية مركزة" },
      ],
      "clarifying-detailer": [
        { partnerLineDe: "Welche Straßen sollen genau gesperrt werden?", yourTurnAr: "دورك: حدّد نطاقًا جغرافيًا محدودًا.", goalAr: "نطاق دقيق" },
        { partnerLineDe: "Wie viele Sonntage schlägst du konkret vor?", yourTurnAr: "دورك: أعطِ رقمًا ومدة تجربة.", goalAr: "رقم محدد" },
        { partnerLineDe: "Wie würden Lieferungen in diesem Zeitraum funktionieren?", yourTurnAr: "دورك: قدّم جدولًا زمنيًا للتوصيل.", goalAr: "حل عملي للتوصيل" },
        { partnerLineDe: "Welche Messgröße zeigt uns später, ob es funktioniert hat?", yourTurnAr: "دورك: اقترح مؤشرين قابلين للقياس.", goalAr: "مؤشران للقياس" },
      ],
    },
  },
  {
    id: "homeoffice-standard",
    titleAr: "العمل من البيت كخيار افتراضي",
    titleDe: "Homeoffice als Standard im Büro",
    situationAr: "نقاش شفهي مفتوح عن جعل العمل من البيت خيارًا افتراضيًا. تدريبٌ محلي بغرضٍ شبيه، لا محاكاةً رسمية.",
    practiceFocus: "discussion-generic",
    alignmentBasis: EXAM_PARTNER_ALIGNMENT_BASIS,
    turns: {
      "steady-constructive": [
        { partnerLineDe: "Homeoffice als Standard spart Zeit, aber der Teamgeist leidet darunter.", yourTurnAr: "دورك: وازن بين الفائدتين وقدّم حلًّا مختلطًا.", goalAr: "موازنة + حل مختلط" },
        { partnerLineDe: "Wenn drei Tage frei wählbar wären, wie würdest du die Präsenztage verteilen?", yourTurnAr: "دورك: اقترح توزيعًا محددًا مع سببه.", goalAr: "توزيع + سبب" },
        { partnerLineDe: "Für neue Kollegen ist das schwierig, findest du nicht auch?", yourTurnAr: "دورك: وافق جزئيًا واقترح استثناءً.", goalAr: "موافقة جزئية + استثناء" },
        { partnerLineDe: "Gut, fassen wir das Modell in zwei Sätzen zusammen.", yourTurnAr: "دورك: لخّص النموذج في جملتين.", goalAr: "تلخيص" },
      ],
      "fast-contrarian": [
        { partnerLineDe: "Homeoffice als Standard? Dann braucht bald niemand mehr ein Büro.", yourTurnAr: "دورك: اعترض بهدوء وقدّم دليلًا مضادًّا.", goalAr: "اعتراض + دليل" },
        { partnerLineDe: "Und die Produktivität sinkt doch nachweislich, oder nicht?", yourTurnAr: "دورك: ردّ على ادعاء الإنتاجية بمصدر عام لا مجهول.", goalAr: "رد بلا ادعاء مجهول" },
        { partnerLineDe: "Wer trägt die Kosten für Ausstattung und Strom zu Hause?", yourTurnAr: "دورك: اقترح تقسيمًا واضحًا للتكاليف.", goalAr: "حل للتكاليف" },
        { partnerLineDe: "Einverstanden, aber nur mit klaren Regelungen und Evaluation.", yourTurnAr: "دورك: صُغ قاعدتين مكتوبتين للتجربة.", goalAr: "قاعدتان مكتوبتان" },
      ],
      "slow-supportive": [
        { partnerLineDe: "Habe ich richtig verstanden, dass du erst testen willst?", yourTurnAr: "دورك: أكّد المدة وطريقة القياس.", goalAr: "تأكيد مدة + قياس" },
        { partnerLineDe: "Kannst du ein Beispiel aus deiner Arbeit nennen?", yourTurnAr: "دورك: أعطِ مثالًا واقعيًا واحدًا.", goalAr: "مثال واقعي" },
        { partnerLineDe: "Was würdest du im Team zuerst verbessern?", yourTurnAr: "دورك: اقترح تحسينًا واحدًا قابلًا للبدء فورًا.", goalAr: "تحسين قابل للبدء" },
        { partnerLineDe: "Danke, das war deutlich. Nenne bitte deinen wichtigsten Punkt.", yourTurnAr: "دورك: حدّد نقطتك الأهم في جملة.", goalAr: "نقطة واحدة" },
      ],
      "clarifying-detailer": [
        { partnerLineDe: "Welche Aufgaben eignen sich wirklich nicht für Homeoffice?", yourTurnAr: "دورك: حدّد نوعين من المهام.", goalAr: "تفصيل المهام" },
        { partnerLineDe: "Wie oft pro Woche meinst du konkret?", yourTurnAr: "دورك: أعطِ رقمًا لعدد الأيام.", goalAr: "رقم محدد" },
        { partnerLineDe: "Welche Technik braucht das Team dafür?", yourTurnAr: "دورك: اذكر متطلبين تقنيين عمليين.", goalAr: "متطلبان تقنيان" },
        { partnerLineDe: "Und wie prüfen wir, ob sich das Modell bewährt hat?", yourTurnAr: "دورك: اقترح تقييمًا بعد مدة محددة.", goalAr: "تقييم بعد مدة" },
      ],
    },
  },
];

export const EXAM_PARTNER_SCENARIO_COUNT = EXAM_PARTNER_SCENARIOS.length;
export const EXAM_PARTNER_PERSONA_COUNT = EXAM_PARTNER_PERSONAS.length;
export const EXAM_PARTNER_TURN_TOTAL = EXAM_PARTNER_SCENARIOS.reduce(
  (total, scenario) => total + Object.values(scenario.turns).reduce((sum, turns) => sum + turns.length, 0),
  0,
);

export function examPartnerScenarioById(id: string) {
  return EXAM_PARTNER_SCENARIOS.find((scenario) => scenario.id === id);
}

export function examPartnerPersonaById(id: string) {
  return EXAM_PARTNER_PERSONAS.find((persona) => persona.id === id);
}

export function examPartnerPaceById(id: ExamPartnerPaceId) {
  return EXAM_PARTNER_PACES.find((pace) => pace.id === id);
}

/** السرعة الفعلية: تفضيل الشخصية افتراضيًا، ويجوز للمتعلّم تجاوزها صراحةً. */
export function examPartnerPaceFor(personaId: string, paceOverride?: ExamPartnerPaceId) {
  const persona = examPartnerPersonaById(personaId);
  if (!persona) throw new Error("شخصية غير معروفة لشريك المحاكاة.");
  const paceId = paceOverride ?? persona.defaultPace;
  const pace = examPartnerPaceById(paceId);
  if (!pace) throw new Error("سرعة غير معروفة لشريك المحاكاة.");
  return pace;
}

export type ExamPartnerSession = {
  policyVersion: typeof EXAM_PARTNER_POLICY_VERSION;
  scenario: ExamPartnerScenario;
  persona: ExamPartnerPersona;
  pace: { id: ExamPartnerPaceId; labelAr: string; rate: number };
  paceOverridden: boolean;
  turns: ExamPartnerTurn[];
  alignmentBasis: typeof EXAM_PARTNER_ALIGNMENT_BASIS;
  boundaryAr: string;
};

/** يبني جلسة محاكاة محددة بعد سقفٍ للجمل المتبادلة، ويرفض أي مدخل غير معلوم بصوتٍ عالٍ. */
export function buildExamPartnerSession(
  scenarioId: string,
  personaId: string,
  paceOverride?: ExamPartnerPaceId,
  maxTurns = EXAM_PARTNER_MAX_TURNS,
): ExamPartnerSession {
  const scenario = examPartnerScenarioById(scenarioId);
  if (!scenario) throw new Error("سيناريو شريك غير معروف.");
  const persona = examPartnerPersonaById(personaId);
  if (!persona) throw new Error("شخصية غير معروفة لشريك المحاكاة.");
  const turns = scenario.turns[persona.id];
  if (!turns || turns.length === 0) throw new Error(`لا توجد جمل للشخصية ${persona.id} في هذا السيناريو.`);
  if (maxTurns < 1 || !Number.isInteger(maxTurns)) throw new Error("سقف الجمل المتبادلة غير صالح.");
  const pace = examPartnerPaceFor(persona.id, paceOverride);
  return {
    policyVersion: EXAM_PARTNER_POLICY_VERSION,
    scenario,
    persona,
    pace: { id: pace.id, labelAr: pace.labelAr, rate: pace.rate },
    paceOverridden: paceOverride !== undefined && paceOverride !== persona.defaultPace,
    turns: turns.slice(0, Math.min(maxTurns, EXAM_PARTNER_MAX_TURNS)),
    alignmentBasis: scenario.alignmentBasis,
    boundaryAr: EXAM_PARTNER_BOUNDARY_AR,
  };
}

/** تحقّق تكامل على بنك السيناريوهات: كل شخصية في كل سيناريو، ونصوصٌ غير فارغة، وجهاتٌ معلَنة. */
export function assertExamPartnerIntegrity() {
  const allowed = ["goethe-b2", "telc-deutsch-b2", "discussion-generic"];
  if (EXAM_PARTNER_SCENARIOS.length < 3) throw new Error("بنك السيناريوهات أقل من ثلاثة.");
  for (const scenario of EXAM_PARTNER_SCENARIOS) {
    if (!allowed.includes(scenario.practiceFocus)) throw new Error(`جهة تدريب غير معلَنة: ${scenario.practiceFocus}`);
    if (scenario.alignmentBasis !== EXAM_PARTNER_ALIGNMENT_BASIS) throw new Error("أساس النسبة تغيّر في سيناريو.");
    for (const persona of EXAM_PARTNER_PERSONAS) {
      const turns = scenario.turns[persona.id];
      if (!turns || turns.length < 4) throw new Error(`سيناريو ${scenario.id} ناقص للشخصية ${persona.id}.`);
      for (const turn of turns) {
        if (/[\u0600-\u06FF]/u.test(turn.partnerLineDe)) throw new Error(`جملة الشريك يجب أن تكون ألمانية خالصة (${scenario.id}).`);
        if (!turn.yourTurnAr.trim() || !turn.goalAr.trim()) throw new Error(`دور المتعلّم أو الهدف فارغ (${scenario.id}).`);
      }
    }
  }
  return true;
}

export const examPartnerPaceRates = EXAM_PARTNER_PACES.map((pace) => pace.rate);
