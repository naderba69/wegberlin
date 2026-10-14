/**
 * وحدة التماسك قبل B1 (البند P1-12 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: الروابط موزّعة مجزّأة على 31 رابطًا في عشر مستويات سنوية، والتماسك
 * (deshalb/trotzdem/obwohl/damit) لا يُتدرَّب كوحدة واحدة، فيكتب المتعلّم جملًا صحيحة
 * منفصلة ولا يربطها. الضرر: عند B1 يُطلب منه إنتاج نصّ مترابط فيترجم من العربية جملةً جملة.
 *
 * التنفيذ: 12 عنصرًا مؤلَّفًا (لا مولَّدًا) لكل عنصر: قاعدتا التركيب (موضع الفعل)، جملتان
 * لتوضيح العلاقة المنطقية، نموذجان مقبولان لإعادة الصياغة، خطأ شائع بتفسيره، وسؤال
 * «أيّهما أدقّ ولماذا؟» — وهو ما يمنع حفظ جواب واحد (يعالج أيضًا البند P1-11).
 *
 * لا تصحيح حرّ بالذكاء الاصطناعي: التحقق آلي بقواعد نحوية صريحة (موضع الفعل، وجود
 * الرابط، وجود الفكرتين، علامة الترقيم) ويُصرَّح بما لا يتحقق منه: الأسلوب والطبيعية.
 */
export const COHESION_POLICY = "cohesion-unit-v1" as const;
export const COHESION_BOUNDARY = "rule-based-rewrite-check-not-style-or-fluency-assessment" as const;
export const COHESION_MIN_LEVEL = "A2" as const;

export type CohesionKind = "reason" | "concession" | "purpose" | "consequence" | "contrast" | "addition" | "alternative" | "temporal";

export type CohesionItem = {
  id: string;
  level: "A2" | "B1";
  connectorDe: string;
  connectorAr: string;
  kind: CohesionKind;
  /** العلاقة المنطقية التي يعبّر عنها الرابط، بصياغة عربية للمتعلّم. */
  logicAr: string;
  /** قاعدة التركيب الدقيقة: أين يقف الفعل المصرف. */
  verbRuleAr: string;
  /** الجملة الأولى (السبب/الشرط/الأساس). */
  clauseA_de: string;
  clauseA_ar: string;
  /** الجملة الثانية (النتيجة/التنازل/الغرض). */
  clauseB_de: string;
  clauseB_ar: string;
  /** نماذج إعادة صياغة مقبولة: لا جواب واحد يُحفظ. */
  modelsDe: string[];
  /** الخطأ الشائع وتفسيره. */
  commonErrorDe: string;
  commonErrorAr: string;
  /** سؤال الموازنة: أيّ الصياغتين أدقّ ولماذا؟ */
  nuanceQuestionAr: string;
  nuanceAnswerAr: string;
  register?: "neutral" | "formal";
};

export const cohesionItems: CohesionItem[] = [
  {
    id: "coh-deshalb-lernen",
    level: "A2",
    connectorDe: "deshalb",
    connectorAr: "لذلك",
    kind: "consequence",
    logicAr: "النتيجة المباشرة لِما ذُكر قبله.",
    verbRuleAr: "deshalb فعل رابط يسبق الفعل المصرف: deshalb + فعل + فاعل (الجملة الثانية).",
    clauseA_de: "Ich habe morgen eine Prüfung.",
    clauseA_ar: "لديّ امتحان غدًا.",
    clauseB_de: "Ich lerne heute Abend.",
    clauseB_ar: "أدرس هذا المساء.",
    modelsDe: ["Ich habe morgen eine Prüfung, deshalb lerne ich heute Abend.", "Ich habe morgen eine Prüfung; deshalb lerne ich heute Abend."],
    commonErrorDe: "Ich habe morgen eine Prüfung, deshalb ich lerne heute Abend.",
    commonErrorAr: "الفعل بعد deshalb لا يبقى في الموضع الثاني بعد الفاعل؛ deshalb يحتلّ الموضع الأول في الجملة الثانية، فيأتي الفعل بعده مباشرة.",
    nuanceQuestionAr: "أيّ الصياغتين أدقّ: بفاصلة أم بفاصلة منقوطة؟ ولماذا؟",
    nuanceAnswerAr: "الفاصلة صحيحة وشائعة، والفاصلة المنقوطة أصرح لأن الجملتين مستقلّتان نحويًّا؛ كلاهما مقبول، والمهم أن يبقى الفعل بعد deshalb.",
  },
  {
    id: "coh-deswegen-termin",
    level: "B1",
    connectorDe: "deswegen",
    connectorAr: "لهذا السبب",
    kind: "consequence",
    logicAr: "النتيجة مع توكيد السبب؛ أقرب إلى الكتابة الرسمية من deshalb.",
    verbRuleAr: "deswegen مثل deshalb: ظرف رابط في الموضع الأول، ثم الفعل المصرف، ثم الفاعل.",
    clauseA_de: "Der Termin wurde verschoben.",
    clauseA_ar: "أُجّل الموعد.",
    clauseB_de: "Ich muss meinen Kalender ändern.",
    clauseB_ar: "يجب أن أغيّر جدولي.",
    modelsDe: ["Der Termin wurde verschoben, deswegen muss ich meinen Kalender ändern.", "Der Termin wurde verschoben; deswegen muss ich meinen Kalender ändern."],
    commonErrorDe: "Der Termin wurde verschoben, deswegen muss meinen Kalender ändern.",
    commonErrorAr: "حذف الفاعل خطأ؛ الظرف الرابط لا يلغي الفاعل، بل يزيحه إلى ما بعد الفعل.",
    nuanceQuestionAr: "لماذا deswegen أنسب في رسالة رسمية من deshalb؟",
    nuanceAnswerAr: "لأن deswegen يشدّد على السبب نفسه في سياق تفسيري، وdeshalb أخفّ وأكثر حيادًا في الكلام اليومي؛ الفرق أسلوبي لا نحوي.",
    register: "formal",
  },
  {
    id: "coh-trotzdem-regen",
    level: "A2",
    connectorDe: "trotzdem",
    connectorAr: "رغم ذلك",
    kind: "concession",
    logicAr: "نتيجة تحدث **خلافًا** لما كان متوقّعًا من الجملة الأولى.",
    verbRuleAr: "trotzdem ظرف رابط: trotzdem + فعل مصرف + فاعل.",
    clauseA_de: "Es regnet stark.",
    clauseA_ar: "المطر شديد.",
    clauseB_de: "Wir gehen spazieren.",
    clauseB_ar: "نذهب للنزهة.",
    modelsDe: ["Es regnet stark, trotzdem gehen wir spazieren.", "Es regnet stark; trotzdem gehen wir spazieren."],
    commonErrorDe: "Es regnet stark, trotzdem wir gehen spazieren.",
    commonErrorAr: "الخطأ الشائع نقل ترتيب الجملة الأولى كما هو؛ بعد trotzdem يأتي الفعل أولًا.",
    nuanceQuestionAr: "ما فرق المعنى بين «trotzdem gehen wir» و«obwohl es regnet, gehen wir»؟",
    nuanceAnswerAr: "المعنى واحد تقريبًا، لكن trotzdem يربط جملتين مستقلّتين وobwohl يجعل السبب جملة فرعية ينتقل فيها الفعل إلى النهاية؛ obwohl أدقّ في الكتابة المترابطة.",
  },
  {
    id: "coh-obwohl-zeit",
    level: "A2",
    connectorDe: "obwohl",
    connectorAr: "مع أنّ",
    kind: "concession",
    logicAr: "جملة فرعية تذكر سببًا معاكسًا للنتيجة.",
    verbRuleAr: "obwohl رابط فرعي: بعد الجملة الفرعية يأتي الفعل المصرف في **النهاية**.",
    clauseA_de: "Ich habe wenig Zeit.",
    clauseA_ar: "لديّ وقت قليل.",
    clauseB_de: "Ich helfe dir.",
    clauseB_ar: "أساعدك.",
    modelsDe: ["Obwohl ich wenig Zeit habe, helfe ich dir.", "Ich helfe dir, obwohl ich wenig Zeit habe."],
    commonErrorDe: "Obwohl ich habe wenig Zeit, helfe ich dir.",
    commonErrorAr: "بعد obwohl لا يبقى الفعل في الموضع الثاني؛ الجملة الفرعية تدفع الفعل المصرف إلى آخرها.",
    nuanceQuestionAr: "أيّ ترتيب أفضل: أن تبدأ بالجملة الفرعية أم بالرئيسية؟",
    nuanceAnswerAr: "إذا أردت التركيز على التنازل فابدأ بـ Obwohl؛ وإذا أردت التركيز على الفعل الذي قمت به فابدأ بالجملة الرئيسية. كلاهما صحيح، والاختيار بلاغي.",
  },
  {
    id: "coh-damit-deutsch",
    level: "B1",
    connectorDe: "damit",
    connectorAr: "كي",
    kind: "purpose",
    logicAr: "غرض/هدف يُذكر في جملة فرعية، ويكون فاعل الجملتين مختلفًا عادةً.",
    verbRuleAr: "damit رابط فرعي: الفعل المصرف إلى النهاية؛ ويُستعمل حين يختلف الفاعل عن الجملة الرئيسية (وإلا فـ um…zu).",
    clauseA_de: "Ich spreche langsam.",
    clauseA_ar: "أتكلّم ببطء.",
    clauseB_de: "Du verstehst mich besser.",
    clauseB_ar: "تفهمني أفضل.",
    modelsDe: ["Ich spreche langsam, damit du mich besser verstehst.", "Damit du mich besser verstehst, spreche ich langsam."],
    commonErrorDe: "Ich spreche langsam, damit du verstehst mich besser.",
    commonErrorAr: "وقوع الفعل في النهاية شرط؛ «verstehst» يجب أن تكون آخر كلمة في الجملة الفرعية.",
    nuanceQuestionAr: "متى نستعمل um…zu بدل damit؟",
    nuanceAnswerAr: "عندما يكون الفاعل نفسه في الجملتين: Ich spreche langsam, um besser verstanden zu werden. وإن اختلف الفاعل فـ damit هو الصواب.",
  },
  {
    id: "coh-sodass-bahn",
    level: "B1",
    connectorDe: "sodass",
    connectorAr: "بحيث / حتى أنّ",
    kind: "consequence",
    logicAr: "نتيجة تصل إلى درجة معيّنة نتيجةً لِما سبق.",
    verbRuleAr: "sodass رابط فرعي: الفعل المصرف إلى النهاية، ويُفصل بفاصلة عن الجملة الرئيسية.",
    clauseA_de: "Der Zug fiel aus.",
    clauseA_ar: "توقّف القطار.",
    clauseB_de: "Ich kam zu spät zur Arbeit.",
    clauseB_ar: "وصلت متأخرًا إلى العمل.",
    modelsDe: ["Der Zug fiel aus, sodass ich zu spät zur Arbeit kam.", "Der Zug fiel aus, sodass ich nicht pünktlich zur Arbeit kam."],
    commonErrorDe: "Der Zug fiel aus, sodass ich kam zu spät zur Arbeit.",
    commonErrorAr: "الخلط بين sodass وdeshalb؛ sodass يفتح جملة فرعية فينتقل الفعل إلى آخرها، أما deshalb فيُبقي الفعل مباشرة بعده.",
    nuanceQuestionAr: "ما الفرق بين «deshalb kam ich zu spät» و«sodass ich zu spät kam»؟",
    nuanceAnswerAr: "deshalb يقدّم النتيجة كقرار/حدث مستقل، وsodass يقدّمها كنتيجة مباشرة ملتصقة بالسبب ضمن جملة واحدة؛ sodass أدقّ في السرد السببي.",
  },
  {
    id: "coh-waehrend-arbeit",
    level: "B1",
    connectorDe: "während",
    connectorAr: "بينما",
    kind: "temporal",
    logicAr: "حدثان متزامنان؛ وقد يعني أيضًا التقابل (في مقابل ذلك).",
    verbRuleAr: "während رابط فرعي: الفعل المصرف إلى النهاية في الجملة الفرعية.",
    clauseA_de: "Ich arbeite.",
    clauseA_ar: "أنا أعمل.",
    clauseB_de: "Meine Schwester studiert.",
    clauseB_ar: "أختي تدرس.",
    modelsDe: ["Während ich arbeite, studiert meine Schwester.", "Meine Schwester studiert, während ich arbeite."],
    commonErrorDe: "Während ich arbeite, meine Schwester studiert.",
    commonErrorAr: "بعد الجملة الفرعية يأتي الفعل المصرف للجملة الرئيسية أولًا (studierte meine Schwester)؛ لا يجوز ترك الفاعل في الموضع الأول.",
    nuanceQuestionAr: "متى تعني während «بينما» الزمنية ومتى تعني «في مقابل ذلك»؟",
    nuanceAnswerAr: "الزمنية تربط حدثين متزامنين، والتقابلية تقارن وضعين مختلفين؛ السياق هو الفيصل، وكلتاهما بنفس التركيب النحوي.",
  },
  {
    id: "coh-bevor-termin",
    level: "A2",
    connectorDe: "bevor",
    connectorAr: "قبل أن",
    kind: "temporal",
    logicAr: "ترتيب زمني: الجملة الفرعية تحدث لاحقًا، والرئيسية قبلها.",
    verbRuleAr: "bevor رابط فرعي: الفعل المصرف إلى النهاية، والترتيب المنطقي عكس ترتيب الكلام.",
    clauseA_de: "Ich rufe dich an.",
    clauseA_ar: "أتصل بك.",
    clauseB_de: "Ich komme vorbei.",
    clauseB_ar: "أمرّ عليك.",
    modelsDe: ["Bevor ich vorbeikomme, rufe ich dich an.", "Ich rufe dich an, bevor ich vorbeikomme."],
    commonErrorDe: "Bevor ich komme vorbei, rufe ich dich an.",
    commonErrorAr: "الفعل المصرف «komme» يجب أن يكون في نهاية الجملة الفرعية، لا في وسطها.",
    nuanceQuestionAr: "أيّ الجملتين تحدث أولًا في «Bevor ich vorbeikomme, rufe ich an»؟",
    nuanceAnswerAr: "الاتصال يحدث أولًا؛ الجملة الفرعية بـbevor تصف ما يأتي لاحقًا، لذلك ترتيب الكلام معاكس لترتيب الأحداث.",
  },
  {
    id: "coh-nachdem-abschluss",
    level: "B1",
    connectorDe: "nachdem",
    connectorAr: "بعد أن",
    kind: "temporal",
    logicAr: "حدث في الماضي البسيط/التام يسبق حدثًا آخر؛ مع nachdem يُستعمل Perfekt أو Plusquamperfekt مرتّبًا.",
    verbRuleAr: "nachdem رابط فرعي + الفعل إلى النهاية؛ ولا يجوز نفس الزمن في الجملتين: الأسبق يأخذ Plusquamperfekt (أو Perfekt للسياق الماضي).",
    clauseA_de: "Ich habe die Prüfung bestanden.",
    clauseA_ar: "نجحت في الامتحان.",
    clauseB_de: "Ich habe eine Stelle gefunden.",
    clauseB_ar: "وجدت وظيفة.",
    modelsDe: ["Nachdem ich die Prüfung bestanden hatte, fand ich eine Stelle.", "Nachdem ich die Prüfung bestanden habe, habe ich eine Stelle gefunden."],
    commonErrorDe: "Nachdem ich habe die Prüfung bestanden, fand ich eine Stelle.",
    commonErrorAr: "خطآن في سطر واحد: الفعل المصرف «habe» ليس في نهاية الجملة الفرعية، والزمن غير متمايز (nachdem تحتاج Plusquamperfekt: bestanden hatte). الصواب: Nachdem ich die Prüfung bestanden hatte, fand ich eine Stelle.",
    nuanceQuestionAr: "لماذا لا نستعمل nachdem مع نفس الزمن في الجملتين؟",
    nuanceAnswerAr: "لأن وظيفة nachdem إظهار الترتيب الزمني؛ فإذا تساوى الزمنان ضاع الترتيب، فالمتعارف عليه تمايز الزمنين (Plusquamperfekt ثم Perfekt/Präteritum).",
  },
  {
    id: "coh-entweder-oder",
    level: "A2",
    connectorDe: "entweder … oder",
    connectorAr: "إمّا … أو",
    kind: "alternative",
    logicAr: "خيارَان لا يجتمعان؛ الرابط مزدوج ويعمل على مستوى الجملة/العنصر.",
    verbRuleAr: "entweder…oder رابط مزدوج لا ينقل الفعل: في الجملتين يبقى الترتيب كما هو، والاختيار بينهما.",
    clauseA_de: "Ich fahre mit dem Fahrrad.",
    clauseA_ar: "أركب الدراجة.",
    clauseB_de: "Ich nehme den Bus.",
    clauseB_ar: "آخذ الحافلة.",
    modelsDe: ["Entweder fahre ich mit dem Fahrrad oder ich nehme den Bus.", "Entweder ich fahre mit dem Fahrrad, oder ich nehme den Bus."],
    commonErrorDe: "Entweder fahre ich mit dem Fahrrad.",
    commonErrorAr: "إسقاط الفرع الثاني يجعل الجملة ناقصة: entweder تنتظر oder. إمّا أن تذكر البديلين، أو تحذف entweder كليًّا: Ich fahre entweder mit dem Fahrrad oder mit dem Bus.",
    nuanceQuestionAr: "هل يجوز «Entweder ich fahre …, oder ich nehme …»؟",
    nuanceAnswerAr: "نعم، وهي صياغة شائعة في الكلام؛ الفرق أن الموضع الأول في النمط الأول للفعل (fahre ich) والثاني للفاعل (ich fahre) — الانتباه مطلوب فقط لاتساق النمط.",
  },
  {
    id: "coh-sowohl-als-auch",
    level: "B1",
    connectorDe: "sowohl … als auch",
    connectorAr: "سواء … أو/و",
    kind: "addition",
    logicAr: "جمع بين عنصرين لا إثبات واحد ونفي الآخر.",
    verbRuleAr: "رابط مزدوج يعمل على العنصر (المسند/المفعول)، ولا يغيّر موضع الفعل المصرف.",
    clauseA_de: "Ich spreche Arabisch.",
    clauseA_ar: "أتكلّم العربية.",
    clauseB_de: "Ich spreche Französisch.",
    clauseB_ar: "أتكلّم الفرنسية.",
    modelsDe: ["Ich spreche sowohl Arabisch als auch Französisch.", "Ich spreche sowohl Arabisch als auch Französisch und Englisch."],
    commonErrorDe: "Ich spreche sowohl Arabisch und auch Französisch.",
    commonErrorAr: "الشريك الثاني ثابت: «als auch» بكلمتين، لا «und auch»؛ الخطأ يخلط مع both…and الإنجليزية.",
    nuanceQuestionAr: "ما فرق المعنى بين «sowohl … als auch» و«nicht nur … sondern auch»؟",
    nuanceAnswerAr: "sowohl…als auch يجمع بحياد، وnicht nur…sondern auch يضيف تدرّجًا وتأكيدًا (ليس فقط… بل أيضًا).",
  },
  {
    id: "coh-je-desto",
    level: "B1",
    connectorDe: "je … desto",
    connectorAr: "كلّما … كلّما",
    kind: "consequence",
    logicAr: "علاقة تناسب: زيادة في الأول تعني زيادة في الثاني.",
    verbRuleAr: "je يفتح جملة فرعية (فعل إلى النهاية)، وبعد desto يأتي + صفة تفضيلية + الفعل المصرف + الفاعل.",
    clauseA_de: "Ich lerne mehr Vokabeln.",
    clauseA_ar: "أحفظ مفردات أكثر.",
    clauseB_de: "Ich spreche fließender.",
    clauseB_ar: "أتكلّم بطلاقة أكبر.",
    modelsDe: ["Je mehr Vokabeln ich lerne, desto fließender spreche ich.", "Je mehr ich übe, desto besser verstehe ich die Prüfungssprache."],
    commonErrorDe: "Je mehr Vokabeln ich lerne, desto fließender ich spreche.",
    commonErrorAr: "بعد desto يجب أن يتقدّم الفعل المصرف على الفاعل؛ «desto fließender spreche ich» هو الصواب.",
    nuanceQuestionAr: "لماذا نقول «je mehr … desto besser» ولا نقول «je mehr … besser»؟",
    nuanceAnswerAr: "لأن desto جزء لازم من التركيب الذي يعبّر عن التناسب، وبقياس رسمي واحد في الجملتين (desto + تفضيل).",
    register: "formal",
  },
];

export const cohesionItemById = new Map(cohesionItems.map((item) => [item.id, item]));

export type CohesionRewriteInput = {
  item: CohesionItem;
  /** صياغة المتعلّم. */
  text: string;
  /** هل المطلوب أن يبدأ بـ obwohl/damit (البديل: النموذج الثاني)؟ */
  formIndex?: number;
};

export type CohesionCheck = {
  ok: boolean;
  connectorPresent: boolean;
  verbFinal: boolean;
  verbSecond: boolean;
  bothClausesPresent: boolean;
  punctuation: boolean;
  issuesAr: string[];
  boundaryAr: string;
};

/**
 * مواصفة الفحص لكل عنصر: صريحة ومؤلفة، لا استنتاج لغوي عام.
 * - `groups`: مجموعات بدائل؛ كل مجموعة يجب أن يظهر أحد أفرادها (sodass/so dass، sowohl/als auch…).
 * - `rule`: أي قاعدة موضع نتحقق منها.
 * - `finalVerb`: تعبير الفعل الذي يجب أن يختم الجملة الفرعية (للروابط الفرعية).
 * - `keysA/keysB`: كلمات دلالية من الفكرتين لضمان أن الجواب ليس الرابط وحده.
 */
type CohesionSpec = {
  groups: string[][];
  rule: "verb-second" | "verb-final" | "element-connector";
  finalVerb?: RegExp;
  afterVerbSubject?: boolean;
  /** je … desto: بعد desto يجب أن يتقدّم الفعل المصرف على الفاعل. */
  afterDestoVerbBeforeSubject?: boolean;
  /** الجملة الرئيسية بعد الجملة الفرعية المتقدّمة تبدأ بالفعل المصرف. */
  mainClauseMustStartWithVerb?: boolean;
  keysA: string[];
  keysB: string[];
};

const SUBJECT_TOKENS = new Set(["ich", "du", "er", "sie", "es", "wir", "ihr", "man", "meine", "mein", "der", "die", "das", "niemand"]);

const SPECS: Record<string, CohesionSpec> = {
  "coh-deshalb-lernen": { groups: [["deshalb"]], rule: "verb-second", keysA: ["prüfung", "pruefung"], keysB: ["lerne", "lern"] },
  "coh-deswegen-termin": { groups: [["deswegen"]], rule: "verb-second", afterVerbSubject: true, keysA: ["termin"], keysB: ["kalender"] },
  "coh-trotzdem-regen": { groups: [["trotzdem"]], rule: "verb-second", keysA: ["regnet", "regen"], keysB: ["spazieren"] },
  "coh-obwohl-zeit": { mainClauseMustStartWithVerb: true, groups: [["obwohl"]], rule: "verb-final", finalVerb: /(habe|hat|hatte|haben)$/u, keysA: ["zeit"], keysB: ["helfe", "helf"] },
  "coh-damit-deutsch": { mainClauseMustStartWithVerb: true, groups: [["damit"]], rule: "verb-final", finalVerb: /(verstehst|versteht|verstehe|verstehen)$/u, keysA: ["langsam"], keysB: ["versteh"] },
  "coh-sodass-bahn": { mainClauseMustStartWithVerb: true, groups: [["sodass", "so dass"]], rule: "verb-final", finalVerb: /(kam|kamen|komme|kommt|war|waren)$/u, keysA: ["zug", "fiel", "ausfiel"], keysB: ["spät", "spaet", "arbeit", "pünktlich", "puenktlich"] },
  "coh-waehrend-arbeit": { mainClauseMustStartWithVerb: true, groups: [["während", "waehrend"]], rule: "verb-final", finalVerb: /(arbeite|arbeitet|arbeiten|studiert|studiere|studieren)$/u, keysA: ["arbeite", "arbeit"], keysB: ["schwester", "studiert", "studiere"] },
  "coh-bevor-termin": { mainClauseMustStartWithVerb: true, groups: [["bevor"]], rule: "verb-final", finalVerb: /(vorbeikomme|vorbeikommt|vorbeikommen|komme|kommt|anrufe|rufe)$/u, keysA: ["rufe", "ruf", "anruf"], keysB: ["vorbei", "komm"] },
  "coh-nachdem-abschluss": { mainClauseMustStartWithVerb: true, groups: [["nachdem"]], rule: "verb-final", finalVerb: /(hatte|hatte|habe|hat|haben)$/u, keysA: ["prüfung", "pruefung"], keysB: ["stelle", "gefunden", "gefunden"] },
  "coh-entweder-oder": { groups: [["entweder"], ["oder"]], rule: "element-connector", keysA: ["fahrrad"], keysB: ["bus"] },
  "coh-sowohl-als-auch": { groups: [["sowohl"], ["als auch"]], rule: "element-connector", keysA: ["arabisch"], keysB: ["französisch", "franzoesisch"] },
  "coh-je-desto": { groups: [["je"], ["desto"]], rule: "verb-final", finalVerb: /(lerne|lern|übe|uebe|arbeite|arbeite|studiere)$/u, afterDestoVerbBeforeSubject: true, keysA: ["vokabeln", "übe", "uebe"], keysB: ["fließender", "fliessender", "besser"] },
};

function normalize(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

function tokensOf(text: string): string[] {
  return normalize(text).toLocaleLowerCase("de-DE").replace(/[^a-zäöüß\s]/giu, " ").split(/\s+/).filter(Boolean);
}

/** مقطع الجملة الفرعية: من الرابط حتى أول فاصلة/منقوطة/نقطة بعده، أو إلى آخر النص. */
function subordinateSegment(lower: string, connector: string): string {
  const at = lower.indexOf(connector);
  if (at < 0) return "";
  const rest = lower.slice(at + connector.length);
  const stop = rest.search(/[.,;]/u);
  return (stop >= 0 ? rest.slice(0, stop) : rest).trim();
}

/**
 * فحص قاعدة إعادة الصياغة. لا يدّعي تقييم الأسلوب أو الطلاقة: يتحقق فقط من وجود الرابط،
 * وموضع الفعل المصرف، ووجود الفكرتين، وعلامة الترقيم — ويُصرّح بالباقي.
 */
export function checkCohesionRewrite(input: CohesionRewriteInput): CohesionCheck {
  const text = normalize(input.text);
  const lower = text.toLocaleLowerCase("de-DE");
  const spec = SPECS[input.item.id];
  if (!spec) throw new Error(`No cohesion check spec for ${input.item.id}`);
  const tokens = tokensOf(text);

  const connectorPresent = spec.groups.every((group) => group.some((form) => lower.includes(form.toLocaleLowerCase("de-DE"))));
  const bothClausesPresent = spec.keysA.some((key) => lower.includes(key)) && spec.keysB.some((key) => lower.includes(key));
  const punctuation = /[.,;]/u.test(text) && tokens.length >= 5;

  let verbFinal = true;
  let verbSecond = true;
  const anchor = spec.groups[0].find((form) => lower.includes(form.toLocaleLowerCase("de-DE"))) ?? "";
  const anchorAt = lower.indexOf(anchor.toLocaleLowerCase("de-DE"));

  if (spec.rule === "verb-final") {
    const segment = subordinateSegment(lower, anchor.toLocaleLowerCase("de-DE"));
    const segmentTokens = segment.replace(/[^a-zäöüß\s]/giu, " ").split(/\s+/).filter(Boolean);
    verbFinal = Boolean(spec.finalVerb && spec.finalVerb.test(segmentTokens.at(-1) ?? ""));
  } else if (spec.rule === "verb-second" && anchorAt >= 0) {
    const after = lower.slice(anchorAt + anchor.length).replace(/^[\s,;]+/u, "");
    const first = after.split(/\s+/)[0] ?? "";
    const second = after.split(/\s+/)[1] ?? "";
    // الخطأ الشائع: الفاعل فورًا بعد الرابط بدل الفعل المصرف.
    verbSecond = first.length > 0 && !(SUBJECT_TOKENS.has(first) && !/^(ich|du|er|sie|es|wir|ihr|man)$/u.test(first) === false && false) && !SUBJECT_TOKENS.has(first);
    if (verbSecond && spec.afterVerbSubject) {
      // يجب أن يلي الفعل المصرف فاعل صريح: deshalb muss **ich** meinen Kalender ändern.
      verbSecond = second.length > 0 && (SUBJECT_TOKENS.has(second) || /^[a-zäöüß]{3,}/u.test(second) === false);
    }
  }

  // je … desto: بعد desto يجب أن يتقدّم الفعل المصرف على الفاعل (يُفحص خارج فرعي القاعدة لأنه يخصّ الجملة الرئيسية).
  if (spec.afterDestoVerbBeforeSubject) {
    const destoAt = lower.indexOf("desto");
    const tail = destoAt >= 0 ? tokensOf(lower.slice(destoAt + "desto".length)) : [];
    const destoVerbs = new Set(["spreche", "verstehe", "lerne", "arbeite", "studiere", "bin", "habe", "kann", "muss", "werde", "fühle", "fuehle"]);
    const verbIndex = tail.findIndex((token) => destoVerbs.has(token));
    const subjectIndex = tail.findIndex((token) => SUBJECT_TOKENS.has(token));
    verbSecond = verbIndex >= 0 && (subjectIndex < 0 || verbIndex < subjectIndex);
  }

  // الجملة الرئيسية بعد جملة فرعية متقدّمة تبدأ بالفعل المصرف، لا بالفاعل.
  if (spec.mainClauseMustStartWithVerb) {
    const firstGroupForm = spec.groups[0].find((form) => lower.startsWith(form.toLocaleLowerCase("de-DE")));
    if (firstGroupForm) {
      const commaAt = lower.indexOf(",");
      const afterComma = commaAt >= 0 ? tokensOf(lower.slice(commaAt + 1)) : [];
      verbSecond = afterComma.length > 0 && !SUBJECT_TOKENS.has(afterComma[0]);
    }
  }

  const issuesAr: string[] = [];
  if (!connectorPresent) issuesAr.push(`الرابط «${input.item.connectorDe}» غير موجود في صياغتك.`);
  if (!bothClausesPresent) issuesAr.push("إحدى الفكرتين مفقودة: أعد كتابة الجملتين معًا، لا جملة واحدة.");
  if (spec.rule === "verb-final" && !verbFinal) issuesAr.push("الفعل المصرف في الجملة الفرعية يجب أن يكون في النهاية.");
  if (spec.rule === "verb-second" && !verbSecond) issuesAr.push("بعد الظرف الرابط يأتي الفعل المصرف مباشرة، ثم الفاعل.");
  if (spec.mainClauseMustStartWithVerb && !verbSecond) issuesAr.push("الجملة الرئيسية بعد الجملة الفرعية المتقدّمة تبدأ بالفعل المصرف، لا بالفاعل.");
  if (spec.afterDestoVerbBeforeSubject && !verbSecond) issuesAr.push("بعد desto يتقدّم الفعل المصرف على الفاعل: desto + صفة تفضيلية + فعل + فاعل.");
  if (!punctuation) issuesAr.push("ناقص الترقيم أو الصياغة قصيرة جدًّا: اكتب جملتين كاملتين مع فاصلة.");

  return {
    ok: issuesAr.length === 0,
    connectorPresent,
    verbFinal,
    verbSecond,
    bothClausesPresent,
    punctuation,
    issuesAr,
    boundaryAr: COHESION_BOUNDARY,
  };
}

export type CohesionCoverage = {
  policyVersion: typeof COHESION_POLICY;
  items: number;
  a2: number;
  b1: number;
  models: number;
  withCommonError: number;
  withNuance: number;
  kinds: CohesionKind[];
};

export function summarizeCohesionCoverage(items: readonly CohesionItem[] = cohesionItems): CohesionCoverage {
  return {
    policyVersion: COHESION_POLICY,
    items: items.length,
    a2: items.filter((item) => item.level === "A2").length,
    b1: items.filter((item) => item.level === "B1").length,
    models: items.reduce((sum, item) => sum + item.modelsDe.length, 0),
    withCommonError: items.filter((item) => item.commonErrorDe && item.commonErrorAr).length,
    withNuance: items.filter((item) => item.nuanceQuestionAr && item.nuanceAnswerAr).length,
    kinds: [...new Set(items.map((item) => item.kind))],
  };
}
