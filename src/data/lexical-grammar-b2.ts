import type { GermanGender, NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

type NounSeed = readonly [lemma: string, gender: GermanGender, plural: string | null, meaningAr: string, obliqueSingular?: string];
type FrameSeed = Omit<VerbPrepositionFrame, "id" | "lessonId" | "firstStructuredStage" | "sourceVersion">;

const articleByGender = { masculine: "der", feminine: "die", neuter: "das" } as const;
const accusativeArticleByGender = { masculine: "den", feminine: "die", neuter: "das" } as const;
const dativeArticleByGender = { masculine: "dem", feminine: "der", neuter: "dem" } as const;

function nounEntries(lessonId: string, seeds: readonly NounSeed[]): NounGrammarEntry[] {
  return seeds.map(([lemma, gender, plural, meaningAr, obliqueSingular], index) => {
    const article = articleByGender[gender];
    const oblique = obliqueSingular ?? lemma;
    return {
      id: `${lessonId}-noun-${index + 1}`,
      lessonId,
      lemma,
      article,
      gender,
      meaningAr,
      plural: {
        form: plural,
        noteAr: plural ? `الجمع: die ${plural}` : "لا يُستعمل له جمع عادي في هذا المعنى داخل B2.",
      },
      caseForms: {
        nominative: `${article} ${lemma}`,
        accusative: `${accusativeArticleByGender[gender]} ${oblique}`,
        dative: `${dativeArticleByGender[gender]} ${oblique}`,
      },
      firstStructuredStage: "vocabulary",
      sourceVersion: "b2-lexical-grammar-v1",
    };
  });
}

const nounSeeds: Record<string, readonly NounSeed[]> = {
  "b2-01": [["Standpunkt", "masculine", "Standpunkte", "وجهة النظر"], ["Argument", "neuter", "Argumente", "الحجة"], ["Beleg", "masculine", "Belege", "الدليل"], ["Schlussfolgerung", "feminine", "Schlussfolgerungen", "الاستنتاج"]],
  "b2-02": [["Debatte", "feminine", "Debatten", "المناظرة"], ["Einwand", "masculine", "Einwände", "الاعتراض"], ["Gegenargument", "neuter", "Gegenargumente", "الحجة المضادة"], ["Kompromiss", "masculine", "Kompromisse", "الحل الوسط"]],
  "b2-03": [["Arbeitsmodell", "neuter", "Arbeitsmodelle", "نموذج العمل"], ["Arbeitszeit", "feminine", "Arbeitszeiten", "وقت العمل"], ["Produktivität", "feminine", null, "الإنتاجية"], ["Vereinbarkeit", "feminine", null, "إمكانية التوفيق"]],
  "b2-04": [["Verhandlung", "feminine", "Verhandlungen", "التفاوض"], ["Register", "neuter", "Register", "السجل اللغوي"], ["Formulierung", "feminine", "Formulierungen", "الصياغة"], ["Missverständnis", "neuter", "Missverständnisse", "سوء الفهم"]],
  "b2-05": [["Datensatz", "masculine", "Datensätze", "مجموعة البيانات"], ["Durchschnitt", "masculine", "Durchschnitte", "المتوسط"], ["Anteil", "masculine", "Anteile", "النسبة / الحصة"], ["Tendenz", "feminine", "Tendenzen", "الاتجاه"]],
  "b2-06": [["Forschung", "feminine", "Forschungen", "البحث العلمي"], ["Studie", "feminine", "Studien", "الدراسة"], ["Ergebnis", "neuter", "Ergebnisse", "النتيجة"], ["Öffentlichkeit", "feminine", null, "الجمهور العام"]],
  "b2-07": [["Teilhabe", "feminine", null, "المشاركة المجتمعية"], ["Zugang", "masculine", "Zugänge", "إمكانية الوصول"], ["Barriere", "feminine", "Barrieren", "العائق"], ["Maßnahme", "feminine", "Maßnahmen", "الإجراء"]],
  "b2-08": [["Quelle", "feminine", "Quellen", "المصدر"], ["Darstellung", "feminine", "Darstellungen", "طريقة العرض"], ["Manipulation", "feminine", "Manipulationen", "التلاعب"], ["Glaubwürdigkeit", "feminine", null, "المصداقية"]],
  "b2-09": [["Perspektive", "feminine", "Perspektiven", "المنظور"], ["Identität", "feminine", "Identitäten", "الهوية"], ["Zugehörigkeit", "feminine", "Zugehörigkeiten", "الانتماء"], ["Erfahrung", "feminine", "Erfahrungen", "التجربة"]],
  "b2-10": [["Vermittlung", "feminine", "Vermittlungen", "الوساطة / التبسيط"], ["Zielgruppe", "feminine", "Zielgruppen", "الفئة المستهدفة"], ["Kernaussage", "feminine", "Kernaussagen", "الفكرة الأساسية"], ["Vereinfachung", "feminine", "Vereinfachungen", "التبسيط"]],
  "b2-11": [["Forumsbeitrag", "masculine", "Forumsbeiträge", "مساهمة المنتدى"], ["Präsentation", "feminine", "Präsentationen", "العرض"], ["Bewertungskriterium", "neuter", "Bewertungskriterien", "معيار التقييم"], ["Überarbeitung", "feminine", "Überarbeitungen", "المراجعة والتحرير"]],
  "b2-12": [["Generalprobe", "feminine", "Generalproben", "البروفة النهائية"], ["Zeitmanagement", "neuter", null, "إدارة الوقت"], ["Aufgabenformat", "neuter", "Aufgabenformate", "صيغة المهمة"], ["Auswertung", "feminine", "Auswertungen", "تحليل النتائج"]],
};

const additionalNounSeeds: Partial<Record<string, readonly NounSeed[]>> = {
  "b2-01":[["Beispiel","neuter","Beispiele","المثال"],["Einwand","masculine","Einwände","الاعتراض"],["Maßnahme","feminine","Maßnahmen","الإجراء"],["These","feminine","Thesen","الأطروحة"],["Voraussetzung","feminine","Voraussetzungen","الشرط المسبق"]],
  "b2-02":[["Anliegen","neuter","Anliegen","الشاغل / الطلب"],["Bindung","feminine","Bindungen","الارتباط"],["Hauptargument","neuter","Hauptargumente","الحجة الرئيسية"],["Krankenstand","masculine","Krankenstände","معدل الغياب المرضي"],["Punkt","masculine","Punkte","النقطة"],["Verkürzung","feminine","Verkürzungen","التقليص"]],
  "b2-03":[["Arbeitsverdichtung","feminine","Arbeitsverdichtungen","تكثيف العمل"],["Ausnahme","feminine","Ausnahmen","الاستثناء"],["Ausstattung","feminine","Ausstattungen","التجهيز"],["Auswertung","feminine","Auswertungen","التحليل"],["Betreuungspflicht","feminine","Betreuungspflichten","واجب الرعاية"],["Dienstleistungsunternehmen","neuter","Dienstleistungsunternehmen","شركة الخدمات"],["Erreichbarkeit","feminine","Erreichbarkeiten","إمكانية الوصول"],["Kernarbeitszeit","feminine","Kernarbeitszeiten","وقت العمل الأساسي"],["Leistungsstatistik","feminine","Leistungsstatistiken","إحصاء الأداء"],["Modell","neuter","Modelle","النموذج"],["Personalabdeckung","feminine","Personalabdeckungen","تغطية الموظفين"],["Voraussetzung","feminine","Voraussetzungen","الشرط المسبق"],["Zusatzaufgabe","feminine","Zusatzaufgaben","المهمة الإضافية"]],
  "b2-04":[["Abhängigkeit","feminine","Abhängigkeiten","الاعتماد"],["Alternative","feminine","Alternativen","البديل"],["Einigung","feminine","Einigungen","الاتفاق"],["Entscheidung","feminine","Entscheidungen","القرار"],["Eskalationsstufe","feminine","Eskalationsstufen","درجة التصعيد"],["Frist","feminine","Fristen","المهلة"],["Kapazitätsgrenze","feminine","Kapazitätsgrenzen","حد القدرة"],["Kernumfang","masculine","Kernumfänge","النطاق الأساسي"],["Lage","feminine","Lagen","الوضع"],["Leistungsumfang","masculine","Leistungsumfänge","نطاق الخدمة"],["Priorität","feminine","Prioritäten","الأولوية"],["Prüfkriterium","neuter","Prüfkriterien","معيار الفحص"],["Umfang","masculine","Umfänge","النطاق"],["Zusage","feminine","Zusagen","التعهد"]],
  "b2-05":[["Ausgangswert","masculine","Ausgangswerte","قيمة البداية"],["Aussagekraft","feminine","Aussagekräfte","قوة الدلالة"],["Lernbegleitung","feminine","Lernbegleitungen","المرافقة التعليمية"],["Nachweis","masculine","Nachweise","الإثبات"],["Prozentpunkt","masculine","Prozentpunkte","النقطة المئوية"],["Stichprobe","feminine","Stichproben","العينة"],["Übertragbarkeit","feminine","Übertragbarkeiten","قابلية التعميم"],["Unsicherheit","feminine","Unsicherheiten","عدم اليقين"],["Ursache","feminine","Ursachen","السبب"],["Veränderung","feminine","Veränderungen","التغير"],["Zusammenhang","masculine","Zusammenhänge","الارتباط"],["Zuwachs","masculine","Zuwächse","الزيادة"]],
  "b2-06":[["Beispiel","neuter","Beispiele","المثال"],["Einschränkung","feminine","Einschränkungen","القيد"],["Erfassung","feminine","Erfassungen","الجمع / الرصد"],["Fachbegriff","masculine","Fachbegriffe","المصطلح المتخصص"],["Fernerkundung","feminine","Fernerkundungen","الاستشعار عن بعد"],["Messung","feminine","Messungen","القياس"],["Methode","feminine","Methoden","الطريقة"],["Oberfläche","feminine","Oberflächen","السطح"],["Sensorik","feminine",null,"تقنية المستشعرات"],["Umbau","masculine","Umbauten","إعادة البناء"]],
  "b2-07":[["Anhörung","feminine","Anhörungen","جلسة الاستماع"],["Beteiligungskreislauf","masculine","Beteiligungskreisläufe","دورة المشاركة"],["Betreuungspflicht","feminine","Betreuungspflichten","واجب الرعاية"],["Rückmeldung","feminine","Rückmeldungen","التغذية الراجعة"],["Sitzung","feminine","Sitzungen","الجلسة"],["Stimmrecht","neuter","Stimmrechte","حق التصويت"],["Vorschlag","masculine","Vorschläge","المقترح"]],
  "b2-08":[["Autor","masculine","Autoren","المؤلف"],["Behauptung","feminine","Behauptungen","الادعاء"],["Beleg","masculine","Belege","الدليل"],["Belegkette","feminine","Belegketten","سلسلة الأدلة"],["Bericht","masculine","Berichte","التقرير"],["Gegenposition","feminine","Gegenpositionen","الموقف المقابل"],["Interessenkonflikt","masculine","Interessenkonflikte","تضارب المصالح"],["Kontext","masculine","Kontexte","السياق"],["Korrektur","feminine","Korrekturen","التصحيح"],["Onlinebefragung","feminine","Onlinebefragungen","الاستبيان الإلكتروني"],["Pressemitteilung","feminine","Pressemitteilungen","البيان الصحفي"],["Primärquelle","feminine","Primärquellen","المصدر الأولي"],["Reichweite","feminine","Reichweiten","النطاق"],["Sekundärquelle","feminine","Sekundärquellen","المصدر الثانوي"],["Überschrift","feminine","Überschriften","العنوان"],["Veröffentlichung","feminine","Veröffentlichungen","النشر"],["Zahl","feminine","Zahlen","العدد"]],
  "b2-09":[["Aussage","feminine","Aussagen","القول"],["Begleitheft","neuter","Begleithefte","الكتيب المرافق"],["Beobachtung","feminine","Beobachtungen","الملاحظة"],["Bewertung","feminine","Bewertungen","التقييم"],["Eigenschaft","feminine","Eigenschaften","الصفة"],["Gast","masculine","Gäste","الضيف"],["Gegenperspektive","feminine","Gegenperspektiven","المنظور المقابل"],["Gegenüberstellung","feminine","Gegenüberstellungen","المقارنة"],["Gruppe","feminine","Gruppen","المجموعة"],["Handlung","feminine","Handlungen","الفعل"],["Installation","feminine","Installationen","التركيب الفني"],["Kollegin","feminine","Kolleginnen","الزميلة"],["Lesart","feminine","Lesarten","وجه القراءة"],["Position","feminine","Positionen","الموقف"],["Reaktion","feminine","Reaktionen","رد الفعل"],["Sicht","feminine","Sichten","وجهة النظر"],["Situation","feminine","Situationen","الموقف"],["Sprache","feminine","Sprachen","اللغة"]],
  "b2-10":[["Anspruch","masculine","Ansprüche","الاستحقاق"],["Arbeitsbeispiel","neuter","Arbeitsbeispiele","مثال العمل"],["Ausschreibung","feminine","Ausschreibungen","إعلان الطلب"],["Einzelfallprüfung","feminine","Einzelfallprüfungen","فحص الحالة الفردية"],["Empfehlung","feminine","Empfehlungen","التوصية"],["Ergänzung","feminine","Ergänzungen","الإضافة"],["Erstattung","feminine","Erstattungen","التعويض"],["Frist","feminine","Fristen","المهلة"],["Handlungsabsicht","feminine","Handlungsabsichten","نية التصرف"],["Möglichkeit","feminine","Möglichkeiten","الإمكانية"],["Muss-Angabe","feminine","Muss-Angaben","المعلومة الإلزامية"],["Nachfrist","feminine","Nachfristen","المهلة الإضافية"],["Unklarheit","feminine","Unklarheiten","نقطة الغموض"]],
  "b2-11":[["Absatz","masculine","Absätze","الفقرة"],["Arbeitsauftrag","masculine","Arbeitsaufträge","مطلوب المهمة"],["Aspekt","masculine","Aspekte","الجانب"],["Aufgabenerfüllung","feminine","Aufgabenerfüllungen","إنجاز المهمة"],["Beispiel","neuter","Beispiele","المثال"],["Bezug","masculine","Bezüge","الإحالة"],["Faden","masculine","Fäden","الخيط"],["Gewichtung","feminine","Gewichtungen","الترجيح"],["Gliederung","feminine","Gliederungen","الهيكلة"],["Kern","masculine","Kerne","الجوهر"],["Maßnahme","feminine","Maßnahmen","الإجراء"],["Position","feminine","Positionen","الموقف"],["Punkt","masculine","Punkte","النقطة"],["Umfang","masculine","Umfänge","النطاق"],["Verweiskette","feminine","Verweisketten","سلسلة الإحالات"],["Zeitreserve","feminine","Zeitreserven","احتياطي الوقت"]],
  "b2-12":[["Anbieterform","feminine","Anbieterformen","صيغة الجهة"],["Aufgabenvertrag","masculine","Aufgabenverträge","عقد المهمة"],["Bedingung","feminine","Bedingungen","الشرط"],["Begriff","masculine","Begriffe","المصطلح"],["Bezeichnung","feminine","Bezeichnungen","التسمية"],["Einwand","masculine","Einwände","الاعتراض"],["Endurteil","neuter","Endurteile","الحكم النهائي"],["Evidenzspur","feminine","Evidenzspuren","مسار الدليل"],["Fehlerursache","feminine","Fehlerursachen","سبب الخطأ"],["Folgeübung","feminine","Folgeübungen","تمرين المتابعة"],["Lücke","feminine","Lücken","الفجوة"],["Mindestantwort","feminine","Mindestantworten","الحد الأدنى للإجابة"],["Mindestbesetzung","feminine","Mindestbesetzungen","الحد الأدنى للتغطية"],["Personalabdeckung","feminine","Personalabdeckungen","تغطية الموظفين"],["Quelle","feminine","Quellen","المصدر"],["Voraussetzung","feminine","Voraussetzungen","الشرط المسبق"]],
};

const frameSeeds: Record<string, FrameSeed> = {
  "b2-01": { infinitive: "sich stützen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf einen Beleg stützen", meaningAr: "يستند إلى دليل", exampleDe: "Der Standpunkt stützt sich auf einen überprüfbaren Beleg.", contrastAr: "الدليل الذي تستند إليه الحجة يأتي بعد auf + Akkusativ." },
  "b2-02": { infinitive: "eingehen", preposition: "auf", governedCase: "accusative", chunkDe: "auf einen Einwand eingehen", meaningAr: "يتناول اعتراضًا ويرد عليه", exampleDe: "Die Rednerin geht auf einen Einwand ein.", contrastAr: "الاعتراض الذي نتناوله يأتي بعد auf + Akkusativ." },
  "b2-03": { infinitive: "profitieren", preposition: "von", governedCase: "dative", chunkDe: "von einem Arbeitsmodell profitieren", meaningAr: "يستفيد من نموذج عمل", exampleDe: "Nicht alle Beschäftigten profitieren von demselben Arbeitsmodell.", contrastAr: "مصدر الفائدة يأتي بعد von + Dativ." },
  "b2-04": { infinitive: "verhandeln", preposition: "über", governedCase: "accusative", chunkDe: "über eine Formulierung verhandeln", meaningAr: "يتفاوض حول صياغة", exampleDe: "Beide Seiten verhandeln über eine präzise Formulierung.", contrastAr: "موضوع التفاوض يأتي بعد über + Akkusativ." },
  "b2-05": { infinitive: "sich ergeben", preposition: "aus", governedCase: "dative", chunkDe: "sich aus einem Datensatz ergeben", meaningAr: "ينتج عن مجموعة بيانات", exampleDe: "Die Tendenz ergibt sich aus dem Datensatz.", contrastAr: "مصدر النتيجة يأتي بعد aus + Dativ." },
  "b2-06": { infinitive: "hinweisen", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Grenze hinweisen", meaningAr: "يشير إلى قيد", exampleDe: "Die Studie weist auf eine wichtige Grenze hin.", contrastAr: "الشيء الذي نلفت إليه يأتي بعد auf + Akkusativ." },
  "b2-07": { infinitive: "sich beteiligen", preposition: "an", governedCase: "dative", chunkDe: "sich an einer Maßnahme beteiligen", meaningAr: "يشارك في إجراء", exampleDe: "Viele Gruppen beteiligen sich an der Maßnahme.", contrastAr: "المشروع أو الإجراء بعد sich beteiligen يأتي مع an + Dativ." },
  "b2-08": { infinitive: "zweifeln", preposition: "an", governedCase: "dative", chunkDe: "an der Glaubwürdigkeit zweifeln", meaningAr: "يشك في المصداقية", exampleDe: "Die Leserin zweifelt an der Glaubwürdigkeit der Quelle.", contrastAr: "موضوع الشك يأتي بعد an + Dativ." },
  "b2-09": { infinitive: "geprägt sein", preposition: "von", governedCase: "dative", chunkDe: "von Erfahrungen geprägt sein", meaningAr: "يكون متأثرًا بالتجارب", exampleDe: "Perspektiven sind von persönlichen Erfahrungen geprägt.", contrastAr: "العامل المؤثر يأتي بعد von + Dativ في المبني للمجهول الوصفي." },
  "b2-10": { infinitive: "sich richten", preposition: "an", governedCase: "accusative", chunkDe: "sich an eine Zielgruppe richten", meaningAr: "يتوجه إلى فئة مستهدفة", exampleDe: "Die Vermittlung richtet sich an eine breite Zielgruppe.", contrastAr: "المتلقي المقصود يأتي بعد an + Akkusativ." },
  "b2-11": { infinitive: "achten", preposition: "auf", governedCase: "accusative", chunkDe: "auf ein Bewertungskriterium achten", meaningAr: "يراعي معيار تقييم", exampleDe: "Beim Überarbeiten achte ich auf jedes Bewertungskriterium.", contrastAr: "الجانب الذي نراقبه يأتي بعد auf + Akkusativ." },
  "b2-12": { infinitive: "sich vorbereiten", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Generalprobe vorbereiten", meaningAr: "يستعد لبروفة نهائية", exampleDe: "Die Lernenden bereiten sich auf die Generalprobe vor.", contrastAr: "الحدث القادم الذي نستعد له يأتي بعد auf + Akkusativ." },
};

const additionalFrameSeeds: Partial<Record<string, readonly FrameSeed[]>> = {
  "b2-05": [{ infinitive: "steigen", preposition: "um", governedCase: "accusative", chunkDe: "um zwölf Prozent steigen", meaningAr: "يرتفع بمقدار اثني عشر بالمئة", exampleDe: "Der Anteil ist um zwölf Prozent gestiegen.", contrastAr: "مقدار التغير يأتي بعد um + Akkusativ؛ لا تخلطه مع auf الذي يذكر القيمة النهائية." }],
  "b2-07": [{ infinitive: "einladen", preposition: "zu", governedCase: "dative", chunkDe: "zu einer Sitzung einladen", meaningAr: "يدعو إلى جلسة", exampleDe: "Die Initiative lädt alle Gruppen zu einer Sitzung ein.", contrastAr: "الحدث الذي تُوجَّه إليه الدعوة يأتي بعد zu + Dativ، والفعل منفصل." }],
  "b2-08": [{ infinitive: "zurückgehen", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Pressemitteilung zurückgehen", meaningAr: "يرجع مصدره إلى بيان صحفي", exampleDe: "Die Behauptung geht auf eine Pressemitteilung zurück.", contrastAr: "المصدر الذي نرجع إليه يأتي بعد auf + Akkusativ، والفعل منفصل." }],
  "b2-09": [{ infinitive: "abhängen", preposition: "von", governedCase: "dative", chunkDe: "von der Situation abhängen", meaningAr: "يعتمد على الوضع", exampleDe: "Die passende Formulierung hängt von der Situation ab.", contrastAr: "عامل الاعتماد يأتي بعد von + Dativ، والفعل منفصل." }],
  "b2-11": [{ infinitive: "zurückkommen", preposition: "auf", governedCase: "accusative", chunkDe: "auf den Kern zurückkommen", meaningAr: "يعود إلى صلب الموضوع", exampleDe: "Am Ende komme ich auf den Kern des Arguments zurück.", contrastAr: "النقطة التي نعود إليها تأتي بعد auf + Akkusativ، والفعل منفصل." }],
  "b2-12": [{ infinitive: "priorisieren", preposition: "nach", governedCase: "dative", chunkDe: "nach Wirkung priorisieren", meaningAr: "يرتب الأولويات بحسب الأثر", exampleDe: "Nach der Generalprobe priorisieren wir die Fehler nach ihrer Wirkung.", contrastAr: "معيار الترتيب يأتي بعد nach + Dativ: nach ihrer Wirkung، لا nach ihre Wirkung." }],
};

export const b2NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, [...seeds, ...(additionalNounSeeds[lessonId] ?? [])]));
export const b2VerbPrepositionFrames: VerbPrepositionFrame[] = Object.entries(frameSeeds).flatMap(([lessonId, frame]) =>
  [frame, ...(additionalFrameSeeds[lessonId] ?? [])].map((item, index) => ({
    id: `${lessonId}-verb-frame-${index + 1}`,
    lessonId,
    ...item,
    firstStructuredStage: "vocabulary" as const,
    sourceVersion: "b2-lexical-grammar-v1" as const,
  })),
);
