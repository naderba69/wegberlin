import type { GermanNounClass, NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

type NounSeed = readonly [lemma: string, gender: GermanNounClass, plural: string | null, meaningAr: string, obliqueSingular?: string, dativeForm?: string, pluralDativeForm?: string];
type FrameSeed = Omit<VerbPrepositionFrame, "id" | "lessonId" | "firstStructuredStage" | "sourceVersion">;

const articleByGender = { masculine: "der", feminine: "die", neuter: "das", "plural-only": "die" } as const;
const accusativeArticleByGender = { masculine: "den", feminine: "die", neuter: "das", "plural-only": "die" } as const;
const dativeArticleByGender = { masculine: "dem", feminine: "der", neuter: "dem", "plural-only": "den" } as const;

function nounEntries(lessonId: string, seeds: readonly NounSeed[], firstIndex = 0): NounGrammarEntry[] {
  return seeds.map(([lemma, gender, plural, meaningAr, obliqueSingular, dativeForm, pluralDativeForm], index) => {
    const article = articleByGender[gender];
    const oblique = obliqueSingular ?? lemma;
    const dative = dativeForm ?? oblique;
    return {
      id: `${lessonId}-noun-${firstIndex + index + 1}`,
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
  "a1-02": [["Geste", "feminine", "Gesten", "الإشارة / الحركة"], ["Muttersprache", "feminine", "Muttersprachen", "اللغة الأم"], ["Pause", "feminine", "Pausen", "الاستراحة"], ["Deutsch", "neuter", null, "اللغة الألمانية؛ تأتي غالبًا دون أداة مع sprechen و lernen"]],
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
  "a1-24": { infinitive: "helfen", preposition: "bei", governedCase: "dative", chunkDe: "bei einem Formular helfen", meaningAr: "يساعد في استمارة", exampleDe: "Sie hilft bei einem Formular.", contrastAr: "helfen bei يربط المساعدة بالمهمة، و bei يطلب Dativ." },
};

const additionalFrameSeeds: Partial<Record<string, readonly FrameSeed[]>> = {
  "a1-11": [{ infinitive: "bezahlen", preposition: "mit", governedCase: "dative", chunkDe: "mit der Karte bezahlen", meaningAr: "يدفع بالبطاقة", exampleDe: "An der Kasse bezahle ich mit der Karte.", contrastAr: "وسيلة الدفع تأتي بعد mit + Dativ: mit der Karte، لا mit die Karte." }],
};

const coreA1NounEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, [...seeds, ...(additionalNounSeeds[lessonId] ?? [])]));

/**
 * ADR-135: nouns a reading question or its keyed answer depends on, which no earlier surface and no
 * glossary had explained. Numbered after every existing entry of the lesson, so no stored ID moves.
 * They sit outside the original P0-98 review scope and carry their own review rows.
 */
const questionSupportNounSeeds: Partial<Record<string, readonly NounSeed[]>> = {
  "a1-02": [["Spanisch", "neuter", null, "اللغة الإسبانية"]],
  "a1-05": [["Nummer", "feminine", "Nummern", "الرقم"]],
  "a1-07": [["Zug", "masculine", "Züge", "القطار"]],
  "a1-09": [["Wortkarte", "feminine", "Wortkarten", "بطاقة الكلمات"]],
  "a1-10": [["Tomate", "feminine", "Tomaten", "الطماطم"]],
  "a1-11": [["Person", "feminine", "Personen", "الشخص"]],
  "a1-12": [["Tomatensuppe", "feminine", "Tomatensuppen", "حساء الطماطم"], ["Gemüsesuppe", "feminine", "Gemüsesuppen", "حساء الخضار"], ["Glas", "neuter", "Gläser", "الكأس"], ["Sahne", "feminine", null, "القشدة"]],
  "a1-14": [["Tasche", "feminine", "Taschen", "الحقيبة"], ["Buch", "neuter", "Bücher", "الكتاب"]],
  "a1-16": [["Wanderung", "feminine", "Wanderungen", "نزهة المشي"]],
  "a1-17": [["Stadtpark", "masculine", "Stadtparks", "حديقة المدينة العامة"]],
  "a1-18": [["Freitagabend", "masculine", "Freitagabende", "مساء الجمعة"]],
  "a1-20": [["Süden", "masculine", null, "الجنوب"], ["Sprachschule", "feminine", "Sprachschulen", "مدرسة اللغات"]],
  "a1-22": [["Fieber", "neuter", null, "الحمّى"]],
  "a1-24": [["Lernnotiz", "feminine", "Lernnotizen", "ملاحظة التعلّم"]],
};

/**
 * ADR-139: Goethe-Zertifikat A1 core-vocabulary nouns that the extended vocabulary phrases and cards
 * now teach. Numbered after every core and question-support entry of the lesson, so no stored ID moves.
 * They sit outside the original P0-98 review scope and carry their own review and source-verification rows.
 */
const goetheCoreNounSeeds: Partial<Record<string, readonly NounSeed[]>> = {
  "a1-01": [["Kugelschreiber", "masculine", "Kugelschreiber", "قلم الحبر الجاف", undefined, undefined, "Kugelschreibern"], ["Bleistift", "masculine", "Bleistifte", "قلم الرصاص"], ["Papier", "neuter", null, "الورق"], ["Beispiel", "neuter", "Beispiele", "المثال"], ["Text", "masculine", "Texte", "النص"], ["Test", "masculine", "Tests", "الاختبار"], ["Lösung", "feminine", "Lösungen", "الحل"], ["Hausaufgabe", "feminine", "Hausaufgaben", "الواجب المنزلي"], ["Teil", "masculine", "Teile", "الجزء"], ["Thema", "neuter", "Themen", "الموضوع"], ["Leute", "plural-only", "Leute", "الناس", undefined, "Leuten", "Leuten"]],
  "a1-02": [["Ausland", "neuter", null, "الخارج"], ["Ausländer", "masculine", "Ausländer", "الأجنبي", undefined, undefined, "Ausländern"], ["Ausländerin", "feminine", "Ausländerinnen", "الأجنبية"], ["Heimat", "feminine", null, "الوطن"], ["Welt", "feminine", "Welten", "العالم"], ["Norden", "masculine", null, "الشمال"], ["Süden", "masculine", null, "الجنوب"], ["Osten", "masculine", null, "الشرق"], ["Westen", "masculine", null, "الغرب"]],
  "a1-03": [["Million", "feminine", "Millionen", "المليون"], ["Postleitzahl", "feminine", "Postleitzahlen", "الرمز البريدي"], ["Vorwahl", "feminine", "Vorwahlen", "رمز الاتصال"], ["Anrufbeantworter", "masculine", "Anrufbeantworter", "المجيب الآلي", undefined, undefined, "Anrufbeantwortern"], ["Fax", "neuter", "Faxe", "الفاكس"], ["Drucker", "masculine", "Drucker", "الطابعة", undefined, undefined, "Druckern"]],
  "a1-04": [["Hochzeit", "feminine", "Hochzeiten", "حفل الزفاف"], ["Ehefrau", "feminine", "Ehefrauen", "الزوجة"], ["Ehemann", "masculine", "Ehemänner", "الزوج", undefined, undefined, "Ehemännern"], ["Großvater", "masculine", "Großväter", "الجد", undefined, undefined, "Großvätern"], ["Oma", "feminine", "Omas", "الجدة"], ["Opa", "masculine", "Opas", "الجد"], ["Verwandte", "masculine", "Verwandten", "القريب", "Verwandten"], ["Mädchen", "neuter", "Mädchen", "البنت"], ["Baby", "neuter", "Babys", "الرضيع"], ["Partner", "masculine", "Partner", "الشريك", undefined, undefined, "Partnern"], ["Partnerin", "feminine", "Partnerinnen", "الشريكة"], ["Kindergarten", "masculine", "Kindergärten", "روضة الأطفال", undefined, undefined, "Kindergärten"]],
  "a1-05": [["Geburtsjahr", "neuter", "Geburtsjahre", "سنة الميلاد"], ["Erwachsene", "masculine", "Erwachsenen", "البالغ", "Erwachsenen"], ["Jugendliche", "masculine", "Jugendlichen", "المراهق", "Jugendlichen"], ["Bekannte", "masculine", "Bekannten", "شخص من المعارف", "Bekannten"], ["Mann", "masculine", "Männer", "الرجل / الزوج", undefined, undefined, "Männern"], ["Information", "feminine", "Informationen", "المعلومة"]],
  "a1-06": [["Schüler", "masculine", "Schüler", "التلميذ", undefined, undefined, "Schülern"], ["Schülerin", "feminine", "Schülerinnen", "التلميذة"], ["Beamte", "masculine", "Beamten", "الموظف الحكومي", "Beamten"], ["Beamtin", "feminine", "Beamtinnen", "الموظفة الحكومية"], ["Hausfrau", "feminine", "Hausfrauen", "ربة البيت"], ["Hausmann", "masculine", "Hausmänner", "رب البيت", undefined, undefined, "Hausmännern"], ["Kollegin", "feminine", "Kolleginnen", "الزميلة"], ["Fahrer", "masculine", "Fahrer", "السائق", undefined, undefined, "Fahrern"], ["Fahrerin", "feminine", "Fahrerinnen", "السائقة"], ["Job", "masculine", "Jobs", "العمل"], ["Praktikum", "neuter", "Praktika", "التدريب العملي"], ["Doktor", "masculine", "Doktoren", "الدكتور"], ["Doktorin", "feminine", "Doktorinnen", "الدكتورة"]],
  "a1-08": [["Zigarette", "feminine", "Zigaretten", "السيجارة"]],
  "a1-09": [["Auskunft", "feminine", "Auskünfte", "الاستعلامات"]],
  "a1-10": [["Salz", "neuter", null, "الملح"], ["Öl", "neuter", null, "الزيت"], ["Birne", "feminine", "Birnen", "الإجاص"], ["Schinken", "masculine", "Schinken", "لحم مقدد (غالبًا من الخنزير)"], ["Durst", "masculine", null, "العطش"], ["Lieblingsessen", "neuter", "Lieblingsessen", "الأكلة المفضلة"]],
  "a1-11": [["Kleidung", "feminine", null, "الملابس"], ["Schuh", "masculine", "Schuhe", "الحذاء"], ["Farbe", "feminine", "Farben", "اللون"], ["Cent", "masculine", "Cent", "السنت"], ["Kiosk", "masculine", "Kioske", "الكشك"], ["Prospekt", "masculine", "Prospekte", "النشرة الإعلانية"]],
  "a1-12": [["Pommes", "plural-only", "Pommes", "البطاطا المقلية"], ["Bier", "neuter", "Biere", "الجعة"], ["Wein", "masculine", "Weine", "النبيذ"], ["Toilette", "feminine", "Toiletten", "دورة المياه"]],
  "a1-13": [["Herd", "masculine", "Herde", "الموقد"], ["Kühlschrank", "masculine", "Kühlschränke", "الثلاجة", undefined, undefined, "Kühlschränken"], ["Waschmaschine", "feminine", "Waschmaschinen", "الغسالة"], ["Maschine", "feminine", "Maschinen", "الآلة"], ["Apartment", "neuter", "Apartments", "الشقة الصغيرة"], ["Garten", "masculine", "Gärten", "الحديقة"], ["Treppe", "feminine", "Treppen", "الدرج"], ["Licht", "neuter", "Lichter", "الضوء", undefined, undefined, "Lichtern"], ["Blick", "masculine", "Blicke", "الإطلالة"]],
  "a1-14": [["Ecke", "feminine", "Ecken", "الزاوية"], ["Reparatur", "feminine", "Reparaturen", "التصليح"]],
  "a1-15": [["Dorf", "neuter", "Dörfer", "القرية", undefined, undefined, "Dörfern"], ["Hund", "masculine", "Hunde", "الكلب"]],
  "a1-16": [["Computer", "masculine", "Computer", "الحاسوب", undefined, undefined, "Computern"], ["CD", "feminine", "CDs", "القرص المضغوط"], ["Lied", "neuter", "Lieder", "الأغنية", undefined, undefined, "Liedern"], ["Disco", "feminine", "Discos", "الديسكو"], ["Schwimmbad", "neuter", "Schwimmbäder", "المسبح", undefined, undefined, "Schwimmbädern"], ["Zeitung", "feminine", "Zeitungen", "الجريدة"], ["Verein", "masculine", "Vereine", "النادي"]],
  "a1-17": [["Party", "feminine", "Partys", "الحفلة"], ["Feier", "feminine", "Feiern", "الاحتفال"], ["Geschenk", "neuter", "Geschenke", "الهدية"]],
  "a1-18": [["Frühling", "masculine", "Frühlinge", "الربيع"], ["Sommer", "masculine", "Sommer", "الصيف", undefined, undefined, "Sommern"], ["Herbst", "masculine", "Herbste", "الخريف"], ["Winter", "masculine", "Winter", "الشتاء", undefined, undefined, "Wintern"], ["Blume", "feminine", "Blumen", "الزهرة"], ["Baum", "masculine", "Bäume", "الشجرة"], ["Meer", "neuter", "Meere", "البحر"], ["Ausflug", "masculine", "Ausflüge", "النزهة"], ["Sehenswürdigkeit", "feminine", "Sehenswürdigkeiten", "المعلم السياحي"], ["Führung", "feminine", "Führungen", "الجولة مع مرشد"], ["Eintritt", "masculine", null, "رسم الدخول"]],
  "a1-19": [["Taxi", "neuter", "Taxis", "سيارة الأجرة"], ["Autobahn", "feminine", "Autobahnen", "الطريق السريع"], ["Lkw", "masculine", "Lkws", "الشاحنة"], ["Haltestelle", "feminine", "Haltestellen", "المحطة"], ["Bahnsteig", "masculine", "Bahnsteige", "رصيف المحطة"], ["Durchsage", "feminine", "Durchsagen", "الإعلان بمكبر الصوت"], ["Anschluss", "masculine", "Anschlüsse", "القطار التالي للمواصلة"]],
  "a1-20": [["Schild", "neuter", "Schilder", "اللافتة", undefined, undefined, "Schildern"], ["Halle", "feminine", "Hallen", "القاعة"]],
  "a1-21": [["Flughafen", "masculine", "Flughäfen", "المطار"], ["Flugzeug", "neuter", "Flugzeuge", "الطائرة"], ["Abflug", "masculine", "Abflüge", "الإقلاع"], ["Koffer", "masculine", "Koffer", "حقيبة السفر", undefined, undefined, "Koffern"], ["Gepäck", "neuter", null, "الأمتعة"], ["Pass", "masculine", "Pässe", "جواز السفر"], ["Zoll", "masculine", null, "الجمارك"], ["Reisebüro", "neuter", "Reisebüros", "وكالة السفر"], ["Reiseführer", "masculine", "Reiseführer", "الدليل السياحي", undefined, undefined, "Reiseführern"], ["Einzelzimmer", "neuter", "Einzelzimmer", "غرفة لشخص واحد", undefined, undefined, "Einzelzimmern"], ["Doppelzimmer", "neuter", "Doppelzimmer", "غرفة لشخصين", undefined, undefined, "Doppelzimmern"], ["Halbpension", "feminine", null, "نصف الإقامة"], ["Rezeption", "feminine", "Rezeptionen", "مكتب الاستقبال"]],
  "a1-22": [["Haar", "neuter", "Haare", "الشعر"], ["Mund", "masculine", "Münder", "الفم", undefined, undefined, "Mündern"], ["Gewicht", "neuter", "Gewichte", "الوزن"]],
  "a1-23": [["Ergebnis", "neuter", "Ergebnisse", "النتيجة"]],
  "a1-24": [["Briefmarke", "feminine", "Briefmarken", "طابع البريد"], ["Brief", "masculine", "Briefe", "الرسالة"], ["Absender", "masculine", "Absender", "المرسل", undefined, undefined, "Absendern"], ["Empfänger", "masculine", "Empfänger", "المستلم", undefined, undefined, "Empfängern"], ["Konto", "neuter", "Konten", "الحساب البنكي"], ["Polizei", "feminine", null, "الشرطة"], ["Papier", "neuter", "Papiere", "الورقة؛ وبالجمع die Papiere: الوثائق الشخصية"], ["Feuer", "neuter", "Feuer", "النار"], ["Aussage", "feminine", "Aussagen", "العبارة"]],
};

export const a1QuestionSupportNounEntries = Object.entries(questionSupportNounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, seeds ?? [], coreA1NounEntries.filter((entry) => entry.lessonId === lessonId).length));
const entriesBefore = (lessonId: string) => [...coreA1NounEntries, ...a1QuestionSupportNounEntries].filter((entry) => entry.lessonId === lessonId).length;
export const a1GoetheCoreNounEntries = Object.entries(goetheCoreNounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, seeds ?? [], entriesBefore(lessonId)));
export const a1NounGrammarEntries = [...coreA1NounEntries, ...a1QuestionSupportNounEntries, ...a1GoetheCoreNounEntries];
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
