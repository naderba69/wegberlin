import type { GermanNounClass, NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

type NounSeed = readonly [lemma: string, gender: GermanNounClass, plural: string | null, meaningAr: string, obliqueSingular?: string, dativeForm?: string, pluralDativeForm?: string];
type FrameSeed = Omit<VerbPrepositionFrame, "id" | "lessonId" | "firstStructuredStage" | "sourceVersion">;

const articleByGender = { masculine: "der", feminine: "die", neuter: "das", "plural-only": "die" } as const;
const accusativeArticleByGender = { masculine: "den", feminine: "die", neuter: "das", "plural-only": "die" } as const;
const dativeArticleByGender = { masculine: "dem", feminine: "der", neuter: "dem", "plural-only": "den" } as const;

function nounEntries(lessonId: string, seeds: readonly NounSeed[]): NounGrammarEntry[] {
  return seeds.map(([lemma, gender, plural, meaningAr, obliqueSingular, dativeForm, pluralDativeForm], index) => {
    const article = articleByGender[gender];
    const oblique = obliqueSingular ?? lemma;
    const dative = dativeForm ?? oblique;
    return {
      id: `${lessonId}-noun-${index + 1}`,
      lessonId,
      lemma,
      article,
      gender,
      meaningAr,
      plural: {
        form: plural,
        noteAr: gender === "plural-only" ? `يُستعمل هنا بصيغة الجمع فقط: die ${lemma}.` : plural ? `الجمع: die ${plural}` : "لا يُستعمل له جمع عادي في هذا المعنى داخل A1.",
        ...(pluralDativeForm ? { dativeForm: pluralDativeForm } : {}),
      },
      caseForms: {
        nominative: `${article} ${lemma}`,
        accusative: `${accusativeArticleByGender[gender]} ${oblique}`,
        dative: `${dativeArticleByGender[gender]} ${dative}`,
      },
      firstStructuredStage: "vocabulary",
      sourceVersion: "a1-lexical-grammar-v1",
    };
  });
}

const nounSeeds: Record<string, readonly NounSeed[]> = {
  "a1-01": [["Name", "masculine", "Namen", "الاسم", "Namen"], ["Kurs", "masculine", "Kurse", "الدورة"], ["Lehrerin", "feminine", "Lehrerinnen", "المعلّمة"], ["Frage", "feminine", "Fragen", "السؤال"]],
  "a1-02": [["Land", "neuter", "Länder", "البلد"], ["Stadt", "feminine", "Städte", "المدينة"], ["Sprache", "feminine", "Sprachen", "اللغة"], ["Wohnort", "masculine", "Wohnorte", "مكان السكن"], ["Bild", "neuter", "Bilder", "الصورة"], ["Deutschkurs", "masculine", "Deutschkurse", "دورة تعلّم الألمانية"], ["Englisch", "neuter", null, "اللغة الإنجليزية"], ["Französisch", "neuter", null, "اللغة الفرنسية"], ["Japanisch", "neuter", null, "اللغة اليابانية"], ["Morgen", "masculine", "Morgen", "الصباح"], ["Satz", "masculine", "Sätze", "الجملة"], ["Wort", "neuter", "Wörter", "الكلمة"]],
  "a1-03": [["Buchstabe", "masculine", "Buchstaben", "الحرف", "Buchstaben"], ["Zahl", "feminine", "Zahlen", "العدد"], ["Telefonnummer", "feminine", "Telefonnummern", "رقم الهاتف"], ["E-Mail-Adresse", "feminine", "E-Mail-Adressen", "عنوان البريد الإلكتروني"]],
  "a1-04": [["Familie", "feminine", "Familien", "العائلة"], ["Mutter", "feminine", "Mütter", "الأم"], ["Vater", "masculine", "Väter", "الأب"], ["Kind", "neuter", "Kinder", "الطفل"]],
  "a1-05": [["Alter", "neuter", null, "العمر"], ["Geburtstag", "masculine", "Geburtstage", "عيد الميلاد"], ["Geburtsdatum", "neuter", "Geburtsdaten", "تاريخ الميلاد"], ["Kontakt", "masculine", "Kontakte", "وسيلة التواصل / الاتصال"]],
  "a1-06": [["Beruf", "masculine", "Berufe", "المهنة"], ["Arbeitsplatz", "masculine", "Arbeitsplätze", "مكان العمل"], ["Firma", "feminine", "Firmen", "الشركة"], ["Kollege", "masculine", "Kollegen", "الزميل", "Kollegen"]],
  "a1-07": [["Uhr", "feminine", "Uhren", "الساعة"], ["Uhrzeit", "feminine", "Uhrzeiten", "التوقيت"], ["Termin", "masculine", "Termine", "الموعد"], ["Minute", "feminine", "Minuten", "الدقيقة"]],
  "a1-08": [["Alltag", "masculine", null, "الحياة اليومية"], ["Tagesablauf", "masculine", "Tagesabläufe", "برنامج اليوم"], ["Pause", "feminine", "Pausen", "الاستراحة"], ["Abend", "masculine", "Abende", "المساء"]],
  "a1-09": [["Verabredung", "feminine", "Verabredungen", "الموعد المتفق عليه"], ["Vorschlag", "masculine", "Vorschläge", "الاقتراح"], ["Treffpunkt", "masculine", "Treffpunkte", "نقطة اللقاء"], ["Absage", "feminine", "Absagen", "الاعتذار / الإلغاء"]],
  "a1-10": [["Lebensmittel", "neuter", "Lebensmittel", "مادة غذائية"], ["Gemüse", "neuter", null, "الخضار"], ["Menge", "feminine", "Mengen", "الكمية"], ["Packung", "feminine", "Packungen", "العبوة"]],
  "a1-11": [["Preis", "masculine", "Preise", "السعر"], ["Angebot", "neuter", "Angebote", "العرض"], ["Verkäufer", "masculine", "Verkäufer", "البائع"], ["Kasse", "feminine", "Kassen", "صندوق الدفع"]],
  "a1-12": [["Speisekarte", "feminine", "Speisekarten", "قائمة الطعام"], ["Gericht", "neuter", "Gerichte", "الطبق"], ["Rechnung", "feminine", "Rechnungen", "الفاتورة"], ["Trinkgeld", "neuter", "Trinkgelder", "الإكرامية"]],
  "a1-13": [["Wohnung", "feminine", "Wohnungen", "الشقة"], ["Zimmer", "neuter", "Zimmer", "الغرفة"], ["Küche", "feminine", "Küchen", "المطبخ"], ["Bad", "neuter", "Bäder", "الحمّام"]],
  "a1-14": [["Tisch", "masculine", "Tische", "الطاولة"], ["Stuhl", "masculine", "Stühle", "الكرسي", undefined, undefined, "Stühlen"], ["Schrank", "masculine", "Schränke", "الخزانة"], ["Lampe", "feminine", "Lampen", "المصباح"]],
  "a1-15": [["Anzeige", "feminine", "Anzeigen", "الإعلان"], ["Miete", "feminine", "Mieten", "الإيجار"], ["Besichtigungstermin", "masculine", "Besichtigungstermine", "موعد المعاينة"], ["Vermieter", "masculine", "Vermieter", "المالك المؤجّر"]],
  "a1-16": [["Hobby", "neuter", "Hobbys", "الهواية"], ["Freizeit", "feminine", null, "وقت الفراغ"], ["Buch", "neuter", "Bücher", "الكتاب"], ["Sport", "masculine", null, "الرياضة"]],
  "a1-17": [["Kino", "neuter", "Kinos", "السينما"], ["Wochenende", "neuter", "Wochenenden", "نهاية الأسبوع"], ["Einladung", "feminine", "Einladungen", "الدعوة"], ["Veranstaltung", "feminine", "Veranstaltungen", "الفعالية"]],
  "a1-18": [["Wetter", "neuter", null, "الطقس"], ["Sonne", "feminine", "Sonnen", "الشمس"], ["Temperatur", "feminine", "Temperaturen", "درجة الحرارة"], ["Wolke", "feminine", "Wolken", "السحابة"]],
  "a1-19": [["Verkehrsmittel", "neuter", "Verkehrsmittel", "وسيلة النقل"], ["Bus", "masculine", "Busse", "الحافلة"], ["Bahn", "feminine", "Bahnen", "القطار / شبكة النقل"], ["Fahrrad", "neuter", "Fahrräder", "الدراجة"]],
  "a1-20": [["Weg", "masculine", "Wege", "الطريق"], ["Kreuzung", "feminine", "Kreuzungen", "التقاطع"], ["Ampel", "feminine", "Ampeln", "إشارة المرور"], ["Haltestelle", "feminine", "Haltestellen", "المحطة"]],
  "a1-21": [["Reise", "feminine", "Reisen", "الرحلة"], ["Bahnhof", "masculine", "Bahnhöfe", "محطة القطار"], ["Zug", "masculine", "Züge", "القطار"], ["Fahrkarte", "feminine", "Fahrkarten", "تذكرة السفر"]],
  "a1-22": [["Körper", "masculine", "Körper", "الجسم"], ["Kopf", "masculine", "Köpfe", "الرأس"], ["Rücken", "masculine", "Rücken", "الظهر"], ["Schmerz", "masculine", "Schmerzen", "الألم"]],
  "a1-23": [["Arzt", "masculine", "Ärzte", "الطبيب"], ["Ärztin", "feminine", "Ärztinnen", "الطبيبة"], ["Termin", "masculine", "Termine", "الموعد"], ["Medikament", "neuter", "Medikamente", "الدواء"]],
  "a1-24": [["Formular", "neuter", "Formulare", "الاستمارة"], ["Feld", "neuter", "Felder", "الخانة"], ["Unterschrift", "feminine", "Unterschriften", "التوقيع"], ["Dokument", "neuter", "Dokumente", "الوثيقة"]],
};

const additionalNounSeeds: Partial<Record<string, readonly NounSeed[]>> = {
  "a1-01": [["Karte", "feminine", "Karten", "البطاقة"]],
  "a1-02": [["Geste", "feminine", "Gesten", "الإشارة / الحركة"], ["Muttersprache", "feminine", "Muttersprachen", "اللغة الأم"], ["Pause", "feminine", "Pausen", "الاستراحة"], ["Deutsch", "neuter", null, "اللغة الألمانية؛ تأتي غالبًا دون أداة مع sprechen وlernen"]],
  "a1-03": [["Adresse", "feminine", "Adressen", "العنوان"], ["Fehler", "masculine", "Fehler", "الخطأ"], ["Formular", "neuter", "Formulare", "الاستمارة"], ["Leerzeichen", "neuter", "Leerzeichen", "الفراغ بين الكلمات"], ["Nachname", "masculine", "Nachnamen", "اسم العائلة", "Nachnamen"], ["Vorname", "masculine", "Vornamen", "الاسم الأول", "Vornamen"]],
  "a1-04": [["Bruder", "masculine", "Brüder", "الأخ"], ["Eltern", "plural-only", "Eltern", "الوالدان / الأهل"], ["Mitte", "feminine", null, "الوسط"], ["Nähe", "feminine", null, "المكان القريب / الجوار"], ["Schwester", "feminine", "Schwestern", "الأخت"], ["Sohn", "masculine", "Söhne", "الابن"], ["Sonntag", "masculine", "Sonntage", "يوم الأحد"], ["Tochter", "feminine", "Töchter", "الابنة"]],
  "a1-05": [["E-Mail-Adresse", "feminine", "E-Mail-Adressen", "عنوان البريد الإلكتروني"], ["Gruppe", "feminine", "Gruppen", "المجموعة"], ["Kontaktdaten", "plural-only", "Kontaktdaten", "بيانات الاتصال"], ["Liste", "feminine", "Listen", "القائمة"], ["Sportverein", "masculine", "Sportvereine", "النادي الرياضي"], ["Telefonnummer", "feminine", "Telefonnummern", "رقم الهاتف"], ["Übungsdaten", "plural-only", "Übungsdaten", "بيانات التمرين"]],
  "a1-06": [["Abendkurs", "masculine", "Abendkurse", "الدورة المسائية"], ["Arzt", "masculine", "Ärzte", "الطبيب"], ["Ärztin", "feminine", "Ärztinnen", "الطبيبة"], ["Ausbildung", "feminine", "Ausbildungen", "التكوين المهني / التدريب"], ["Bahnhof", "masculine", "Bahnhöfe", "محطة القطار"], ["Gast", "masculine", "Gäste", "الضيف"], ["Kunde", "masculine", "Kunden", "العميل", "Kunden"], ["Lehrer", "masculine", "Lehrer", "المعلّم"], ["Lehrerin", "feminine", "Lehrerinnen", "المعلّمة"], ["Restaurant", "neuter", "Restaurants", "المطعم"], ["Umweltfirma", "feminine", "Umweltfirmen", "شركة بيئية"], ["Verkäufer", "masculine", "Verkäufer", "البائع"], ["Verkäuferin", "feminine", "Verkäuferinnen", "البائعة"]],
  "a1-07": [["Anzeige", "feminine", "Anzeigen", "الإعلان"], ["Gleis", "neuter", "Gleise", "رصيف / مسار القطار"], ["Kalender", "masculine", "Kalender", "التقويم"], ["Kurs", "masculine", "Kurse", "الدورة"], ["Verspätung", "feminine", "Verspätungen", "التأخير"]],
  "a1-08": [["Heimweg", "masculine", "Heimwege", "طريق العودة إلى المنزل"]],
  "a1-09": [["Termin", "masculine", "Termine", "الموعد"], ["Zeit", "feminine", null, "الوقت"]],
  "a1-10": [["Apfel", "masculine", "Äpfel", "التفاحة"], ["Banane", "feminine", "Bananen", "الموزة"], ["Brot", "neuter", "Brote", "الخبز / الرغيف"], ["Brötchen", "neuter", "Brötchen", "الخبزة الصغيرة"], ["Ei", "neuter", "Eier", "البيضة"], ["Flasche", "feminine", "Flaschen", "القارورة"], ["Fleisch", "neuter", null, "اللحم"], ["Kaffee", "masculine", null, "القهوة"], ["Käse", "masculine", "Käse", "الجبن"], ["Milch", "feminine", null, "الحليب"], ["Obst", "neuter", null, "الفاكهة بوصفها مجموعة"], ["Tee", "masculine", "Tees", "الشاي"], ["Wasser", "neuter", null, "الماء"]],
  "a1-11": [["Apfel", "masculine", "Äpfel", "التفاح / التفاحة"], ["Bon", "masculine", "Bons", "وصل الشراء"], ["Flasche", "feminine", "Flaschen", "القارورة"], ["Geschäft", "neuter", "Geschäfte", "المتجر"], ["Kilo", "neuter", "Kilo", "الكيلوغرام"], ["Liste", "feminine", "Listen", "القائمة"], ["Liter", "masculine", "Liter", "اللتر"], ["Markt", "masculine", "Märkte", "السوق"], ["Packung", "feminine", "Packungen", "العبوة"], ["Regal", "neuter", "Regale", "الرف"], ["Stück", "neuter", "Stücke", "القطعة"]],
  "a1-12": [["Allergen", "neuter", "Allergene", "مادة مسببة للحساسية"], ["Fleisch", "neuter", null, "اللحم"], ["Hauptgericht", "neuter", "Hauptgerichte", "الطبق الرئيسي"], ["Mineralwasser", "neuter", "Mineralwässer", "المياه المعدنية"], ["Mittagskarte", "feminine", "Mittagskarten", "قائمة الغداء"], ["Salat", "masculine", "Salate", "السلطة"], ["Suppe", "feminine", "Suppen", "الحساء"], ["Zutat", "feminine", "Zutaten", "المكوّن الغذائي"]],
  "a1-13": [["Aufzug", "masculine", "Aufzüge", "المصعد"], ["Balkon", "masculine", "Balkone", "الشرفة"], ["Flur", "masculine", "Flure", "الرواق"], ["Gegend", "feminine", "Gegenden", "المنطقة / الحي"], ["Keller", "masculine", "Keller", "القبو"], ["Lärm", "masculine", null, "الضجيج"], ["Schlafzimmer", "neuter", "Schlafzimmer", "غرفة النوم"], ["Wohnzimmer", "neuter", "Wohnzimmer", "غرفة الجلوس"], ["Zentrum", "neuter", "Zentren", "المركز"]],
  "a1-14": [["Bett", "neuter", "Betten", "السرير"], ["Kleiderschrank", "masculine", "Kleiderschränke", "خزانة الملابس"], ["Küche", "feminine", "Küchen", "المطبخ"], ["Notizheft", "neuter", "Notizhefte", "دفتر الملاحظات"], ["Regal", "neuter", "Regale", "الرف"], ["Schale", "feminine", "Schalen", "الوعاء الصغير"], ["Schlüssel", "masculine", "Schlüssel", "المفتاح"], ["Schreibtisch", "masculine", "Schreibtische", "مكتب الكتابة"], ["Sofa", "neuter", "Sofas", "الأريكة"], ["Suche", "feminine", "Suchen", "عملية البحث"], ["Tür", "feminine", "Türen", "الباب"]],
  "a1-15": [["Hof", "masculine", "Höfe", "الفناء"], ["Kaltmiete", "feminine", "Kaltmieten", "الإيجار دون التكاليف الإضافية"], ["Mai", "masculine", null, "شهر مايو"], ["Nebenkosten", "plural-only", "Nebenkosten", "التكاليف الإضافية للسكن"], ["Warmmiete", "feminine", "Warmmieten", "الإيجار مع التكاليف الإضافية"], ["Weg", "masculine", "Wege", "الطريق"], ["Wohnung", "feminine", "Wohnungen", "الشقة"], ["Wohnungsanzeige", "feminine", "Wohnungsanzeigen", "إعلان السكن"]],
  "a1-16": [["Note", "feminine", "Noten", "العلامة / الدرجة"], ["Porträt", "neuter", "Porträts", "الصورة التعريفية"], ["Rezept", "neuter", "Rezepte", "الوصفة"], ["Tausch", "masculine", null, "التبادل"]],
  "a1-17": [["Eingang", "masculine", "Eingänge", "المدخل"], ["Fahrradtour", "feminine", "Fahrradtouren", "جولة بالدراجة"], ["Film", "masculine", "Filme", "الفيلم"], ["Gruppe", "feminine", "Gruppen", "المجموعة"]],
  "a1-18": [["Regenschirm", "masculine", "Regenschirme", "المظلة"], ["See", "masculine", "Seen", "البحيرة"], ["Technikmuseum", "neuter", "Technikmuseen", "متحف التقنية"], ["Wetterbericht", "masculine", "Wetterberichte", "النشرة الجوية"]],
  "a1-19": [["Auto", "neuter", "Autos", "السيارة"], ["Fahrkarte", "feminine", "Fahrkarten", "تذكرة النقل"], ["Nachricht", "feminine", "Nachrichten", "الرسالة"], ["S-Bahn", "feminine", "S-Bahnen", "قطار الضواحي"], ["Straßenbahn", "feminine", "Straßenbahnen", "الترام"], ["U-Bahn", "feminine", "U-Bahnen", "مترو الأنفاق"], ["Verbindung", "feminine", "Verbindungen", "وصلة النقل"], ["Verspätung", "feminine", "Verspätungen", "التأخير"], ["Zug", "masculine", "Züge", "القطار"]],
  "a1-20": [["Apotheke", "feminine", "Apotheken", "الصيدلية"], ["Ausgang", "masculine", "Ausgänge", "المخرج"], ["Bäckerei", "feminine", "Bäckereien", "المخبزة"], ["Bank", "feminine", "Banken", "المصرف"], ["Brücke", "feminine", "Brücken", "الجسر"], ["Eingang", "masculine", "Eingänge", "المدخل"], ["Hotel", "neuter", "Hotels", "الفندق"], ["Seite", "feminine", "Seiten", "الجهة / الجانب"], ["Straße", "feminine", "Straßen", "الشارع"], ["Tor", "neuter", "Tore", "البوابة"]],
  "a1-21": [["Abfahrt", "feminine", "Abfahrten", "موعد الانطلاق"], ["Änderung", "feminine", "Änderungen", "التغيير"], ["Ankunft", "feminine", "Ankünfte", "الوصول"], ["Gleis", "neuter", "Gleise", "رصيف / مسار القطار"], ["Reservierung", "feminine", "Reservierungen", "الحجز"], ["Screenshot", "masculine", "Screenshots", "لقطة الشاشة"], ["Verbindung", "feminine", "Verbindungen", "وصلة الرحلة"]],
  "a1-22": [["Arm", "masculine", "Arme", "الذراع"], ["Arztpraxis", "feminine", "Arztpraxen", "عيادة الطبيب"], ["Auge", "neuter", "Augen", "العين"], ["Bauch", "masculine", "Bäuche", "البطن"], ["Bein", "neuter", "Beine", "الساق"], ["Beschwerde", "feminine", "Beschwerden", "العَرَض / الشكوى"], ["Fuß", "masculine", "Füße", "القدم"], ["Hals", "masculine", "Hälse", "الحلق / العنق"], ["Hand", "feminine", "Hände", "اليد"], ["Kiste", "feminine", "Kisten", "الصندوق"], ["Ohr", "neuter", "Ohren", "الأذن"], ["Umzug", "masculine", "Umzüge", "الانتقال إلى منزل"]],
  "a1-23": [["Atemnot", "feminine", null, "ضيق التنفس"], ["Essen", "neuter", null, "الطعام / وقت الأكل"], ["Hausarztpraxis", "feminine", "Hausarztpraxen", "عيادة طبيب الأسرة"], ["Hinweis", "masculine", "Hinweise", "التعليمات / الملاحظة"], ["Schritt", "masculine", "Schritte", "الخطوة"], ["Tablette", "feminine", "Tabletten", "القرص الدوائي"]],
  "a1-24": [["Abgabe", "feminine", "Abgaben", "التسليم"], ["Angabe", "feminine", "Angaben", "المعلومة المطلوبة"], ["Anmeldung", "feminine", "Anmeldungen", "التسجيل"], ["Anschrift", "feminine", "Anschriften", "العنوان البريدي"], ["Bürgerbüro", "neuter", "Bürgerbüros", "مكتب خدمات المواطنين"], ["Geburtsdatum", "neuter", "Geburtsdaten", "تاريخ الميلاد"], ["Geburtsort", "masculine", "Geburtsorte", "مكان الميلاد"], ["Kopie", "feminine", "Kopien", "النسخة"], ["Lernkopie", "feminine", "Lernkopien", "نسخة التدريب"], ["Nachname", "masculine", "Nachnamen", "اسم العائلة", "Nachnamen"], ["Passnummer", "feminine", "Passnummern", "رقم جواز السفر"], ["Staatsangehörigkeit", "feminine", "Staatsangehörigkeiten", "الجنسية"], ["Vorname", "masculine", "Vornamen", "الاسم الأول", "Vornamen"]],
};

const frameSeeds: Record<string, FrameSeed> = {
  "a1-01": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach dem Namen fragen", meaningAr: "يسأل عن الاسم", exampleDe: "Ich frage nach dem Namen.", contrastAr: "احفظ nach مع Dativ: nach dem Namen." },
  "a1-02": { infinitive: "kommen", preposition: "aus", governedCase: "dative", chunkDe: "aus einem Land kommen", meaningAr: "يأتي من بلد", exampleDe: "Ich komme aus einem Land in Nordafrika.", contrastAr: "aus يطلب Dativ، حتى لو لم تظهر الأداة مع اسم بلد بلا Artikel." },
  "a1-03": { infinitive: "bitten", preposition: "um", governedCase: "accusative", chunkDe: "um Wiederholung bitten", meaningAr: "يطلب الإعادة", exampleDe: "Ich bitte um Wiederholung.", contrastAr: "bitten um يأخذ Akkusativ: um eine Wiederholung." },
  "a1-04": { infinitive: "sprechen", preposition: "über", governedCase: "accusative", chunkDe: "über die Familie sprechen", meaningAr: "يتحدث عن العائلة", exampleDe: "Wir sprechen über die Familie.", contrastAr: "über بمعنى «حول موضوع» يأتي هنا مع Akkusativ." },
  "a1-05": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach dem Alter fragen", meaningAr: "يسأل عن العمر", exampleDe: "Sie fragt nach dem Alter.", contrastAr: "لا تحفظ fragen وحده: nach + Dativ يحدد الشيء المطلوب." },
  "a1-06": { infinitive: "arbeiten", preposition: "bei", governedCase: "dative", chunkDe: "bei einer Firma arbeiten", meaningAr: "يعمل لدى شركة", exampleDe: "Er arbeitet bei einer Firma.", contrastAr: "bei يطلب Dativ: bei einer Firma." },
  "a1-07": { infinitive: "beginnen", preposition: "um", governedCase: "accusative", chunkDe: "um neun Uhr beginnen", meaningAr: "يبدأ الساعة التاسعة", exampleDe: "Der Kurs beginnt um neun Uhr.", contrastAr: "um يقدم وقتًا محددًا ويأخذ Akkusativ." },
  "a1-08": { infinitive: "beginnen", preposition: "mit", governedCase: "dative", chunkDe: "mit dem Tagesablauf beginnen", meaningAr: "يبدأ بوصف برنامج اليوم", exampleDe: "Ich beginne mit dem Tagesablauf.", contrastAr: "beginnen mit يربط البداية بشيء ويطلب Dativ." },
  "a1-09": { infinitive: "sich verabreden", preposition: "mit", governedCase: "dative", chunkDe: "sich mit Freunden verabreden", meaningAr: "يتفق على لقاء مع أصدقاء", exampleDe: "Ich verabrede mich mit Freunden.", contrastAr: "الضمير الانعكاسي يتغير، أما mit فيبقى مع Dativ." },
  "a1-10": { infinitive: "bezahlen", preposition: "für", governedCase: "accusative", chunkDe: "für Lebensmittel bezahlen", meaningAr: "يدفع ثمن المواد الغذائية", exampleDe: "Ich bezahle für die Lebensmittel.", contrastAr: "für يطلب Akkusativ: für die Lebensmittel." },
  "a1-11": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach dem Preis fragen", meaningAr: "يسأل عن السعر", exampleDe: "Ich frage nach dem Preis.", contrastAr: "nach + Dativ: nach dem Preis، لا nach den Preis." },
  "a1-12": { infinitive: "bezahlen", preposition: "mit", governedCase: "dative", chunkDe: "mit der Karte bezahlen", meaningAr: "يدفع بالبطاقة", exampleDe: "Ich bezahle mit der Karte.", contrastAr: "mit يطلب Dativ: mit der Karte." },
  "a1-13": { infinitive: "wohnen", preposition: "in", governedCase: "dative", chunkDe: "in einer Wohnung wohnen", meaningAr: "يسكن في شقة", exampleDe: "Wir wohnen in einer Wohnung.", contrastAr: "المكان الثابت مع in يأخذ Dativ هنا." },
  "a1-14": { infinitive: "stehen", preposition: "auf", governedCase: "dative", chunkDe: "auf dem Tisch stehen", meaningAr: "يوجد واقفًا على الطاولة", exampleDe: "Die Lampe steht auf dem Tisch.", contrastAr: "Wo? مكان ثابت: auf + Dativ، لذلك auf dem Tisch." },
  "a1-15": { infinitive: "sich interessieren", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Wohnung interessieren", meaningAr: "يهتم بشقة", exampleDe: "Ich interessiere mich für eine Wohnung.", contrastAr: "sich interessieren für يطلب Akkusativ." },
  "a1-16": { infinitive: "sprechen", preposition: "über", governedCase: "accusative", chunkDe: "über Hobbys sprechen", meaningAr: "يتحدث عن الهوايات", exampleDe: "Wir sprechen über unsere Hobbys.", contrastAr: "موضوع الكلام يأتي بعد über + Akkusativ." },
  "a1-17": { infinitive: "sich treffen", preposition: "mit", governedCase: "dative", chunkDe: "sich mit Freunden treffen", meaningAr: "يلتقي بالأصدقاء", exampleDe: "Ich treffe mich mit Freunden.", contrastAr: "mit يطلب Dativ؛ احفظ الفعل مع sich أيضًا." },
  "a1-18": { infinitive: "hoffen", preposition: "auf", governedCase: "accusative", chunkDe: "auf gutes Wetter hoffen", meaningAr: "يأمل بطقس جيد", exampleDe: "Wir hoffen auf gutes Wetter.", contrastAr: "hoffen auf يأخذ Akkusativ، وليس Dativ المكان." },
  "a1-19": { infinitive: "fahren", preposition: "mit", governedCase: "dative", chunkDe: "mit dem Bus fahren", meaningAr: "يركب الحافلة", exampleDe: "Ich fahre mit dem Bus.", contrastAr: "وسيلة النقل بعد mit تكون في Dativ." },
  "a1-20": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach dem Weg fragen", meaningAr: "يسأل عن الطريق", exampleDe: "Ich frage nach dem Weg.", contrastAr: "nach dem Weg: حرف الجر ثابت والحالة Dativ." },
  "a1-21": { infinitive: "warten", preposition: "auf", governedCase: "accusative", chunkDe: "auf den Zug warten", meaningAr: "ينتظر القطار", exampleDe: "Wir warten auf den Zug.", contrastAr: "warten auf يطلب Akkusativ: auf den Zug." },
  "a1-22": { infinitive: "leiden", preposition: "an", governedCase: "dative", chunkDe: "an Rückenschmerzen leiden", meaningAr: "يعاني من آلام الظهر", exampleDe: "Er leidet an Rückenschmerzen.", contrastAr: "leiden an يأتي مع Dativ في هذا المعنى." },
  "a1-23": { infinitive: "sprechen", preposition: "mit", governedCase: "dative", chunkDe: "mit dem Arzt sprechen", meaningAr: "يتحدث مع الطبيب", exampleDe: "Ich spreche mit dem Arzt.", contrastAr: "الشخص بعد mit يأتي في Dativ: mit dem Arzt." },
  "a1-24": { infinitive: "helfen", preposition: "bei", governedCase: "dative", chunkDe: "bei einem Formular helfen", meaningAr: "يساعد في استمارة", exampleDe: "Sie hilft bei einem Formular.", contrastAr: "helfen bei يربط المساعدة بالمهمة، وbei يطلب Dativ." },
};

const additionalFrameSeeds: Partial<Record<string, readonly FrameSeed[]>> = {
  "a1-11": [{ infinitive: "bezahlen", preposition: "mit", governedCase: "dative", chunkDe: "mit der Karte bezahlen", meaningAr: "يدفع بالبطاقة", exampleDe: "An der Kasse bezahle ich mit der Karte.", contrastAr: "وسيلة الدفع تأتي بعد mit + Dativ: mit der Karte، لا mit die Karte." }],
};

export const a1NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, [...seeds, ...(additionalNounSeeds[lessonId] ?? [])]));
export const a1VerbPrepositionFrames: VerbPrepositionFrame[] = Object.entries(frameSeeds).flatMap(([lessonId, frame]) =>
  [frame, ...(additionalFrameSeeds[lessonId] ?? [])].map((item, index) => ({
    id: `${lessonId}-verb-frame-${index + 1}`,
    lessonId,
    ...item,
    firstStructuredStage: "vocabulary" as const,
    sourceVersion: "a1-lexical-grammar-v1" as const,
  })),
);

function groupByLesson<T extends { lessonId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.lessonId] = [...(groups[item.lessonId] ?? []), item];
    return groups;
  }, {});
}

export const a1NounsByLesson = groupByLesson(a1NounGrammarEntries);
export const a1VerbFramesByLesson = groupByLesson(a1VerbPrepositionFrames);
