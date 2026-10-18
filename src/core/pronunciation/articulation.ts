import type { FullLesson } from "@/types/lesson-content";
import type { PronunciationContrastAttempt } from "@/types/learning";
import { articulationProfileByLesson } from "@/data/articulation-profile-assignments";

export const ARTICULATION_CONTRAST_POLICY = "articulation-contrast-practice-v1" as const;
export const PRONUNCIATION_EVIDENCE_BOUNDARY = "synthetic-discrimination-only-no-pronunciation-or-mastery-score" as const;

export type ArticulationZone = "lips" | "lip-teeth" | "ridge" | "palate" | "vowel-space" | "throat" | "rhythm" | "velum";
export type ArticulationProfileId = "onsetH" | "lipTeeth" | "lipClosure" | "affricates" | "clusters" | "palate" | "achLaut" | "rounded" | "vowelLength" | "wordStress" | "prosody";
export type PronunciationContrastKind = "minimal-pair" | "meaningful-sound-contrast" | "meaningful-prosody-contrast";
export type PronunciationContrastSide = { de: string; ipa: string; ar: string };
export type PronunciationContrastPair = {
  id: string;
  kind: PronunciationContrastKind;
  target: string;
  left: PronunciationContrastSide;
  right: PronunciationContrastSide;
  noteAr: string;
};
export type ArticulationGuide = {
  policyVersion: typeof ARTICULATION_CONTRAST_POLICY;
  profileId: string;
  zone: ArticulationZone;
  titleDe: string;
  titleAr: string;
  mouthAr: string;
  tongueAr: string;
  airflowAr: string;
  diagramAltAr: string;
  pairs: [PronunciationContrastPair, PronunciationContrastPair];
};

const pairCatalog = {
  onsetH: [
    { id:"h-eis-heiss",kind:"minimal-pair",target:"[h]",left:{de:"Eis",ipa:"[aɪ̯s]",ar:"مثلجات"},right:{de:"heiß",ipa:"[haɪ̯s]",ar:"ساخن"},noteAr:"وجود النفس في البداية يغيّر المعنى." },
    { id:"h-alt-halt",kind:"minimal-pair",target:"[h]",left:{de:"alt",ipa:"[alt]",ar:"قديم/كبير في السن"},right:{de:"halt",ipa:"[halt]",ar:"قف/توقف"},noteAr:"ابدأ الكلمة الثانية بنفَس مسموع دون إغلاق الحلق." },
  ],
  lipTeeth: [
    { id:"fv-vier-wir",kind:"minimal-pair",target:"[f] – [v]",left:{de:"vier",ipa:"[fiːɐ̯]",ar:"أربعة"},right:{de:"wir",ipa:"[viːɐ̯]",ar:"نحن"},noteAr:"الموضع متقارب؛ الفرق أن [v] مصحوب باهتزاز الصوت." },
    { id:"fv-fein-wein",kind:"minimal-pair",target:"[f] – [v]",left:{de:"fein",ipa:"[faɪ̯n]",ar:"ناعم/دقيق"},right:{de:"Wein",ipa:"[vaɪ̯n]",ar:"نبيذ"},noteAr:"ضع أصابعك على الحنجرة: الاهتزاز يظهر في Wein." },
  ],
  lipClosure: [
    { id:"pb-packen-backen",kind:"minimal-pair",target:"[p] – [b]",left:{de:"packen",ipa:"[ˈpakn̩]",ar:"يحزم/يعبّئ"},right:{de:"backen",ipa:"[ˈbakn̩]",ar:"يخبز"},noteAr:"ضع ورقة أمام فمك: مع packen تخرج نفخة هواء واضحة عند فتح الشفتين، ومع backen يكون الفتح أهدأ بلا نفخة؛ النفخة هي ما يميز [p] عن [b]." },
    { id:"pf-pfund-fund",kind:"minimal-pair",target:"[pf] – [f]",left:{de:"Pfund",ipa:"[pfʊnt]",ar:"رطل/نصف كيلو تقريبًا"},right:{de:"Fund",ipa:"[fʊnt]",ar:"اكتشاف/شيء عُثر عليه"},noteAr:"ابدأ Pfund بإغلاق الشفتين [p] ثم افتحه مباشرة إلى [f]." },
  ],
  affricates: [
    { id:"ts-zeit-seit",kind:"meaningful-sound-contrast",target:"[ts] – [z]",left:{de:"Zeit",ipa:"[tsaɪ̯t]",ar:"وقت"},right:{de:"seit",ipa:"[zaɪ̯t]",ar:"منذ"},noteAr:"في Zeit يبدأ الصوت بإغلاق قصير ثم احتكاك؛ في seit يبدأ الصوت مجهورًا." },
    { id:"ts-ziege-siege",kind:"minimal-pair",target:"[ts] – [z]",left:{de:"Ziege",ipa:"[ˈtsiːɡə]",ar:"عنزة"},right:{de:"Siege",ipa:"[ˈziːɡə]",ar:"انتصارات"},noteAr:"ابدأ Ziege بإغلاق قصير لطرف اللسان ثم احتكاك؛ أما Siege فتبدأ بصوت مجهور مستمر بلا إغلاق." },
  ],
  clusters: [
    { id:"cluster-stein-schein",kind:"minimal-pair",target:"[ʃt] – [ʃ]",left:{de:"Stein",ipa:"[ʃtaɪ̯n]",ar:"حجر"},right:{de:"Schein",ipa:"[ʃaɪ̯n]",ar:"ورقة نقدية/شهادة"},noteAr:"في Stein يلتصق [t] مباشرة بصوت [ʃ] دون حركة بينهما؛ إذا سقط [t] صارت الكلمة Schein." },
    { id:"cluster-platte-palette",kind:"meaningful-sound-contrast",target:"[pl] – [pal]",left:{de:"Platte",ipa:"[ˈplatə]",ar:"لوح/صفيحة"},right:{de:"Palette",ipa:"[paˈlɛtə]",ar:"منصّة نقل/لوح ألوان"},noteAr:"إضافة حركة قصيرة بين [p] و[l] تصنع كلمة أخرى هي Palette؛ والقاعدة نفسها في sprechen و Straße: لا حركة بين الصوامت." },
  ],
  palate: [
    { id:"ch-kirche-kirsche",kind:"minimal-pair",target:"[ç] – [ʃ]",left:{de:"Kirche",ipa:"[ˈkɪʁçə]",ar:"كنيسة"},right:{de:"Kirsche",ipa:"[ˈkɪʁʃə]",ar:"كرزة"},noteAr:"في [ç] يقترب وسط اللسان من الحنك؛ في [ʃ] يتجه الاحتكاك إلى الأمام." },
    { id:"ch-licht-list",kind:"minimal-pair",target:"[ç] – [s]",left:{de:"Licht",ipa:"[lɪçt]",ar:"ضوء"},right:{de:"List",ipa:"[lɪst]",ar:"حيلة"},noteAr:"لا تحول ich-Laut إلى سين؛ راقب مكان الاحتكاك في وسط الفم." },
  ],
  achLaut: [
    { id:"ach-buch-buecher",kind:"meaningful-sound-contrast",target:"[x] – [ç]",left:{de:"Buch",ipa:"[buːx]",ar:"كتاب"},right:{de:"Bücher",ipa:"[ˈbyːçɐ]",ar:"كتب"},noteAr:"بعد الحركة الخلفية u يُنطق ch في الخلف [x]، وبعد ü الأمامية ينتقل إلى وسط اللسان [ç]." },
    { id:"ach-dach-daecher",kind:"meaningful-sound-contrast",target:"[x] – [ç]",left:{de:"Dach",ipa:"[dax]",ar:"سقف"},right:{de:"Dächer",ipa:"[ˈdɛçɐ]",ar:"أسقف"},noteAr:"الكتابة واحدة ch، لكن الحركة قبلها تحدد الموضع: a خلفية فيأتي [x]، وä أمامية فيأتي [ç]." },
  ],
  rounded: [
    { id:"yu-tuer-tour",kind:"minimal-pair",target:"[yː] – [uː]",left:{de:"Tür",ipa:"[tyːɐ̯]",ar:"باب"},right:{de:"Tour",ipa:"[tuːɐ̯]",ar:"جولة"},noteAr:"استعمل وضع اللسان الأمامي لـ[i] مع تدوير الشفتين للحصول على [yː]." },
    { id:"oe-schon-schoen",kind:"minimal-pair",target:"[oː] – [øː]",left:{de:"schon",ipa:"[ʃoːn]",ar:"بالفعل"},right:{de:"schön",ipa:"[ʃøːn]",ar:"جميل"},noteAr:"الشفتان مدورتان في الكلمتين، لكن اللسان يتقدم في schön." },
  ],
  vowelLength: [
    { id:"length-stadt-staat",kind:"minimal-pair",target:"قصير – طويل",left:{de:"Stadt",ipa:"[ʃtat]",ar:"مدينة"},right:{de:"Staat",ipa:"[ʃtaːt]",ar:"دولة"},noteAr:"لا تضف مقطعًا؛ مد الحركة وحدها في Staat." },
    { id:"length-offen-ofen",kind:"meaningful-sound-contrast",target:"[ɔ] – [oː]",left:{de:"offen",ipa:"[ˈɔfn̩]",ar:"مفتوح"},right:{de:"Ofen",ipa:"[ˈoːfn̩]",ar:"فرن"},noteAr:"offen أقصر وأكثر انفتاحًا، وOfen أطول وأكثر إغلاقًا." },
  ],
  wordStress: [
    { id:"stress-umfahren",kind:"meaningful-prosody-contrast",target:"UMfahren – umFAHren",left:{de:"Er fährt das Schild um.",ipa:"[eːɐ̯ fɛːɐ̯t das ʃɪlt ˈʊm]",ar:"يصدم اللافتة فيُسقطها."},right:{de:"Er umfährt das Schild.",ipa:"[eːɐ̯ ʊmˈfɛːɐ̯t das ʃɪlt]",ar:"يلتفّ حول اللافتة متجنبًا إياها."},noteAr:"في الفعل المنفصل تحمل البادئة um النبر وتنتقل إلى آخر الجملة؛ وفي غير المنفصل يقع النبر على الجذر ويتغير المعنى." },
    { id:"stress-kaffee-cafe",kind:"meaningful-sound-contrast",target:"[ˈ…] am Anfang – am Ende",left:{de:"Kaffee",ipa:"[ˈkafe]",ar:"قهوة (المشروب)"},right:{de:"Café",ipa:"[kaˈfeː]",ar:"مقهى (المكان)"},noteAr:"في النطق الألماني المعياري يقع نبر Kaffee على المقطع الأول، ونبر Café على الأخير بحركة طويلة؛ نقل النبر يغيّر الكلمة." },
  ],
  prosody: [
    { id:"prosody-kommen",kind:"meaningful-prosody-contrast",target:"Aussage – Frage",left:{de:"Sie kommen heute.",ipa:"[↘]",ar:"سيأتون اليوم."},right:{de:"Sie kommen heute?",ipa:"[↗]",ar:"سيأتون اليوم؟"},noteAr:"الكلمات نفسها، لكن اتجاه النغمة يغير الوظيفة التواصلية." },
    { id:"prosody-moeglich",kind:"meaningful-prosody-contrast",target:"sicher – rückfragend",left:{de:"Das ist möglich.",ipa:"[↘]",ar:"هذا ممكن."},right:{de:"Das ist möglich?",ipa:"[↗]",ar:"هل هذا ممكن؟"},noteAr:"اسمع هبوط النغمة في الخبر وصعودها في سؤال التأكد." },
  ],
} as const satisfies Record<string, readonly [PronunciationContrastPair, PronunciationContrastPair]>;

/** Fallback for lessons outside the authored map (ADR-125); every curriculum lesson is mapped explicitly. */
function profileFor(focus: string): ArticulationProfileId {
  const value = focus.toLocaleLowerCase("de-DE");
  if (value.includes("[ç]") || value.includes("[ʃ]") || value.includes("[ʃp]") || value.includes("[ʃt]") || value.includes("[çts]")) return "palate";
  if (value.includes("[pf]") || value.includes("[ts]")) return "affricates";
  if (value.includes("[f]") || value.includes("[v]") || value.includes("w=[v]") || value.includes("v=[")) return "lipTeeth";
  if (value.includes("[y") || value.includes("[ʏ") || value.includes("[ø") || value.includes("[œ") || /ä ö ü|a→ä|o→ö|u→ü/u.test(value)) return "rounded";
  if (value.includes("[h]") || /^h(?:\s|\/)/u.test(value)) return "onsetH";
  if (/\[[aeiouɛɔ][^\]]*\]\s*\/|\[oː\]|\[uː\]|\[ɛː\]/u.test(value)) return "vowelLength";
  return "prosody";
}

export function getArticulationProfileId(lesson: FullLesson): ArticulationProfileId {
  return articulationProfileByLesson[lesson.id] ?? profileFor(lesson.pronunciation.focus);
}

export function getArticulationGuide(lesson: FullLesson): ArticulationGuide {
  const profile = getArticulationProfileId(lesson);
  if (profile === "onsetH") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"throat",titleDe:"Luft am Wortanfang",titleAr:"نفَس بداية الكلمة",mouthAr:"افتح الفم بحسب الحركة التالية دون ضغط.",tongueAr:"اترك اللسان مستعدًا للحركة التالية؛ لا يصنع [h] إغلاقًا.",airflowAr:"مرّر نفَسًا خفيفًا من الحنجرة قبل الحركة.",diagramAltAr:"مقطع جانبي مبسط يبرز الحنجرة ومسار الهواء المفتوح.",pairs:[...pairCatalog.onsetH] };
  if (profile === "lipTeeth") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"lip-teeth",titleDe:"Unterlippe und obere Zähne",titleAr:"الشفة السفلى والأسنان العليا",mouthAr:"المس الشفة السفلى بالأسنان العليا لمسًا خفيفًا.",tongueAr:"اللسان مرتاح ولا يغلق مجرى الهواء.",airflowAr:"دع الهواء يحتك؛ أضف اهتزاز الحنجرة في [v].",diagramAltAr:"مقطع جانبي مبسط يبرز تماس الشفة السفلى بالأسنان العليا.",pairs:[...pairCatalog.lipTeeth] };
  if (profile === "lipClosure") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"lips",titleDe:"Lippenverschluss: [p], [b], [pf]",titleAr:"إغلاق الشفتين",mouthAr:"أغلق الشفتين إغلاقًا كاملًا ثم افتحهما مرة واحدة.",tongueAr:"اللسان مرتاح في قاع الفم؛ العمل كله للشفتين، ومع [pf] تنتقل الشفة السفلى إلى الأسنان العليا.",airflowAr:"مع [p] تخرج نفخة هواء قصيرة عند الفتح؛ ومع [pf] يتبع الإغلاقَ احتكاكُ [f] مباشرة دون حركة بينهما.",diagramAltAr:"مقطع جانبي مبسط يبرز الشفتين المغلقتين ونفخة الهواء عند فتحهما.",pairs:[...pairCatalog.lipClosure] };
  if (profile === "clusters") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"ridge",titleDe:"Konsonanten ohne Zwischenvokal",titleAr:"صوامت متجاورة بلا حركة بينها",mouthAr:"ابدأ مباشرة بالصامت الأول دون همزة أو حركة قبله.",tongueAr:"مع [ʃt] ينتقل طرف اللسان من وضع الشين إلى الحافة خلف الأسنان العليا لصنع [t] دون أن ينفصل الصوتان.",airflowAr:"أخرج الصوامت المتجاورة في نفَس واحد، ولا تفتح الفم للحركة إلا بعد آخر صامت.",diagramAltAr:"مقطع جانبي مبسط يبرز طرف اللسان عند الحافة خلف الأسنان العليا ومسار الهواء بلا حركة فاصلة.",pairs:[...pairCatalog.clusters] };
  if (profile === "affricates") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"ridge",titleDe:"Kurzer Verschluss, dann Reibung",titleAr:"إغلاق قصير ثم احتكاك",mouthAr:"ابدأ بإغلاق قصير ثم افتحه مباشرة.",tongueAr:"مع [ts] يقترب طرف اللسان من الحافة خلف الأسنان؛ مع [pf] يبدأ الإغلاق بالشفتين.",airflowAr:"لا تضف حركة بين الجزأين؛ أخرجهما كصوت واحد.",diagramAltAr:"مقطع جانبي مبسط يبرز حافة اللثة والشفتين ومسار الهواء المتصل.",pairs:[...pairCatalog.affricates] };
  if (profile === "palate") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"palate",titleDe:"Zungenmitte und Gaumen",titleAr:"وسط اللسان والحنك",mouthAr:"افتح الشفتين قليلًا دون تدوير مبالغ.",tongueAr:"ارفع وسط اللسان قريبًا من الحنك من غير إغلاق كامل لصوت [ç].",airflowAr:"مرّر الهواء في الممر الضيق بلطف؛ لا تحوله إلى كاف.",diagramAltAr:"مقطع جانبي مبسط يبرز اقتراب وسط اللسان من الحنك ومسار الهواء.",pairs:[...pairCatalog.palate] };
  if (profile === "achLaut") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"velum",titleDe:"Hinterzunge und weicher Gaumen",titleAr:"مؤخرة اللسان والحنك الرخو",mouthAr:"افتح الفم بحسب الحركة الخلفية قبله: a أو o أو u أو au.",tongueAr:"ارفع مؤخرة اللسان نحو الحنك الرخو دون إغلاق؛ وبعد الحركات الأمامية ارجع إلى وسط اللسان لصوت [ç].",airflowAr:"احتكاك مستمر في الخلف قريب من الخاء؛ لا تجعله حلقيًا عميقًا ولا تستعمله بعد i أو e أو ü.",diagramAltAr:"مقطع جانبي مبسط يبرز اقتراب مؤخرة اللسان من الحنك الرخو ومسار الهواء.",pairs:[...pairCatalog.achLaut] };
  if (profile === "wordStress") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"rhythm",titleDe:"Wortakzent",titleAr:"نبر الكلمة",mouthAr:"انطق المقطع المنبور أطول وأوضح قليلًا، واجعل المقاطع الأخرى أخف.",tongueAr:"لا يتغير موضع اللسان بالنبر؛ تتغير المدة والوضوح وارتفاع الصوت.",airflowAr:"ادفع نفَسًا أقوى قليلًا في المقطع المنبور وحده، ولا تضغط كل المقاطع بالقوة نفسها.",diagramAltAr:"مخطط جانبي مبسط مع موجة إيقاع تبرز مقطعًا واحدًا أقوى من غيره.",pairs:[...pairCatalog.wordStress] };
  if (profile === "rounded") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"vowel-space",titleDe:"Vordere Zunge, gerundete Lippen",titleAr:"لسان أمامي وشفتان مدورتان",mouthAr:"دوّر الشفتين كما في [u] دون دفعهما بقوة.",tongueAr:"أبقِ اللسان في الأمام كما في [i] أو [e] للحصول على الحركة الأمامية المدورة.",airflowAr:"الهواء مستمر بلا احتكاك أو إغلاق.",diagramAltAr:"مقطع جانبي مبسط يبرز تجويف الحركة الأمامي مع تدوير الشفتين.",pairs:[...pairCatalog.rounded] };
  if (profile === "vowelLength") return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"vowel-space",titleDe:"Vokalraum und Länge",titleAr:"مساحة الحركة وطولها",mouthAr:"حافظ على شكل الحركة ولا تضف حركة ثانية.",tongueAr:"غيّر موضع اللسان والمدة كما يوضح IPA، لا مستوى الصوت.",airflowAr:"مد الهواء بسلاسة في الحركة الطويلة واقصره في القصيرة.",diagramAltAr:"مقطع جانبي مبسط يبرز مساحة الحركات ومسار الهواء المفتوح.",pairs:[...pairCatalog.vowelLength] };
  return { policyVersion:ARTICULATION_CONTRAST_POLICY,profileId:profile,zone:"rhythm",titleDe:"Akzent und Melodie",titleAr:"النبر والنغمة",mouthAr:"قسّم العبارة إلى مجموعة كلام واحدة مريحة.",tongueAr:"لا يوجد موضع لسان واحد؛ أبرز الكلمة الحاملة للمعلومة دون ضغط كل المقاطع.",airflowAr:"وزّع النفس حتى نهاية المجموعة، واترك النغمة تهبط أو تصعد حسب المقصد.",diagramAltAr:"مخطط جانبي مبسط لمسار الهواء مع موجة تمثل النبر والنغمة.",pairs:[...pairCatalog.prosody] };
}

export function createPronunciationContrastAttempt(input: {
  lessonId: string;
  pairId: string;
  targetSide: "left" | "right";
  selectedSide: "left" | "right";
  now?: Date;
}): PronunciationContrastAttempt {
  if (!input.lessonId.trim() || !input.pairId.trim()) throw new Error("Pronunciation contrast attempt requires lesson and pair IDs.");
  return {
    id: `pronunciation-contrast:${input.lessonId}:${input.pairId}:${input.targetSide}`,
    policyVersion: ARTICULATION_CONTRAST_POLICY,
    lessonId: input.lessonId,
    pairId: input.pairId,
    targetSide: input.targetSide,
    selectedSide: input.selectedSide,
    correct: input.targetSide === input.selectedSide,
    stimulusSource: "browser-tts-synthetic",
    evidenceBoundary: PRONUNCIATION_EVIDENCE_BOUNDARY,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}

export function upsertPronunciationContrastAttempt(attempts: PronunciationContrastAttempt[], next: PronunciationContrastAttempt) {
  const index = attempts.findIndex((attempt) => attempt.id === next.id);
  if (index < 0) return [...attempts, next];
  return attempts.map((attempt, currentIndex) => currentIndex === index ? next : attempt);
}
