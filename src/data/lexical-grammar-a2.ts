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
        noteAr: plural ? `الجمع: die ${plural}` : "لا يُستعمل له جمع عادي في هذا المعنى داخل A2.",
      },
      caseForms: {
        nominative: `${article} ${lemma}`,
        accusative: `${accusativeArticleByGender[gender]} ${oblique}`,
        dative: `${dativeArticleByGender[gender]} ${oblique}`,
      },
      firstStructuredStage: "vocabulary",
      sourceVersion: "a2-lexical-grammar-v1",
    };
  });
}

const nounSeeds: Record<string, readonly NounSeed[]> = {
  "a2-01": [["Erfahrung", "feminine", "Erfahrungen", "التجربة"], ["Ereignis", "neuter", "Ereignisse", "الحدث"], ["Vergangenheit", "feminine", null, "الماضي"], ["Zeitpunkt", "masculine", "Zeitpunkte", "النقطة الزمنية"]],
  "a2-02": [["Geschichte", "feminine", "Geschichten", "القصة"], ["Anfang", "masculine", "Anfänge", "البداية"], ["Ende", "neuter", "Enden", "النهاية"], ["Reihenfolge", "feminine", "Reihenfolgen", "الترتيب"]],
  "a2-03": [["Moment", "masculine", "Momente", "اللحظة"], ["Erinnerung", "feminine", "Erinnerungen", "الذكرى"], ["Überraschung", "feminine", "Überraschungen", "المفاجأة"], ["Gefühl", "neuter", "Gefühle", "الشعور"]],
  "a2-04": [["Nachbar", "masculine", "Nachbarn", "الجار", "Nachbarn"], ["Nachbarin", "feminine", "Nachbarinnen", "الجارة"], ["Umzug", "masculine", "Umzüge", "الانتقال إلى منزل"], ["Hilfe", "feminine", "Hilfen", "المساعدة"]],
  "a2-05": [["Hausordnung", "feminine", "Hausordnungen", "نظام المنزل"], ["Regel", "feminine", "Regeln", "القاعدة"], ["Ruhezeit", "feminine", "Ruhezeiten", "وقت الهدوء"], ["Müll", "masculine", null, "النفايات"]],
  "a2-06": [["Konflikt", "masculine", "Konflikte", "الخلاف"], ["Lösung", "feminine", "Lösungen", "الحل"], ["Rücksicht", "feminine", null, "مراعاة الآخرين"], ["Vereinbarung", "feminine", "Vereinbarungen", "الاتفاق"]],
  "a2-07": [["Aufgabe", "feminine", "Aufgaben", "المهمة"], ["Abteilung", "feminine", "Abteilungen", "القسم"], ["Besprechung", "feminine", "Besprechungen", "الاجتماع"], ["Arbeitszeit", "feminine", "Arbeitszeiten", "وقت العمل"]],
  "a2-08": [["Bewerbung", "feminine", "Bewerbungen", "طلب التوظيف"], ["Lebenslauf", "masculine", "Lebensläufe", "السيرة الذاتية"], ["Stelle", "feminine", "Stellen", "الوظيفة"], ["Erfahrung", "feminine", "Erfahrungen", "الخبرة"]],
  "a2-09": [["Anruf", "masculine", "Anrufe", "المكالمة"], ["Nachricht", "feminine", "Nachrichten", "الرسالة"], ["Durchwahl", "feminine", "Durchwahlen", "الرقم الداخلي"], ["Gespräch", "neuter", "Gespräche", "المحادثة"]],
  "a2-10": [["Reiseplan", "masculine", "Reisepläne", "خطة السفر"], ["Verbindung", "feminine", "Verbindungen", "وصلة النقل"], ["Abfahrt", "feminine", "Abfahrten", "المغادرة"], ["Ankunft", "feminine", "Ankünfte", "الوصول"]],
  "a2-11": [["Unterkunft", "feminine", "Unterkünfte", "مكان الإقامة"], ["Reservierung", "feminine", "Reservierungen", "الحجز"], ["Rezeption", "feminine", "Rezeptionen", "الاستقبال"], ["Frühstück", "neuter", "Frühstücke", "وجبة الإفطار"]],
  "a2-12": [["Beschwerde", "feminine", "Beschwerden", "الشكوى"], ["Mangel", "masculine", "Mängel", "العيب / النقص"], ["Erstattung", "feminine", "Erstattungen", "استرجاع المبلغ"], ["Lösung", "feminine", "Lösungen", "الحل"]],
  "a2-13": [["Gewohnheit", "feminine", "Gewohnheiten", "العادة"], ["Ernährung", "feminine", null, "التغذية"], ["Bewegung", "feminine", "Bewegungen", "الحركة"], ["Gesundheit", "feminine", null, "الصحة"]],
  "a2-14": [["Krankmeldung", "feminine", "Krankmeldungen", "بلاغ المرض"], ["Arbeitgeber", "masculine", "Arbeitgeber", "صاحب العمل"], ["Bescheinigung", "feminine", "Bescheinigungen", "الشهادة / الإثبات"], ["Arbeitsunfähigkeit", "feminine", null, "عدم القدرة على العمل"]],
  "a2-15": [["Apotheke", "feminine", "Apotheken", "الصيدلية"], ["Medikament", "neuter", "Medikamente", "الدواء"], ["Packungsbeilage", "feminine", "Packungsbeilagen", "النشرة الداخلية"], ["Dosierung", "feminine", "Dosierungen", "الجرعة"]],
  "a2-16": [["Nachricht", "feminine", "Nachrichten", "الخبر"], ["Quelle", "feminine", "Quellen", "المصدر"], ["Meldung", "feminine", "Meldungen", "البلاغ"], ["Tatsache", "feminine", "Tatsachen", "الحقيقة"]],
  "a2-17": [["Konto", "neuter", "Konten", "الحساب"], ["Passwort", "neuter", "Passwörter", "كلمة المرور"], ["Datenschutz", "masculine", null, "حماية البيانات"], ["Bildschirm", "masculine", "Bildschirme", "الشاشة"]],
  "a2-18": [["Meinung", "feminine", "Meinungen", "الرأي"], ["Begründung", "feminine", "Begründungen", "التعليل"], ["Vorteil", "masculine", "Vorteile", "الميزة"], ["Nachteil", "masculine", "Nachteile", "العيب"]],
  "a2-19": [["Lernziel", "neuter", "Lernziele", "هدف التعلم"], ["Methode", "feminine", "Methoden", "الطريقة"], ["Fortschritt", "masculine", "Fortschritte", "التقدم"], ["Wiederholung", "feminine", "Wiederholungen", "المراجعة / التكرار"]],
  "a2-20": [["Prüfung", "feminine", "Prüfungen", "الاختبار"], ["Anmeldung", "feminine", "Anmeldungen", "التسجيل"], ["Teilnahme", "feminine", "Teilnahmen", "المشاركة"], ["Zertifikat", "neuter", "Zertifikate", "الشهادة"]],
  "a2-21": [["Plan", "masculine", "Pläne", "الخطة"], ["Ziel", "neuter", "Ziele", "الهدف"], ["Schritt", "masculine", "Schritte", "الخطوة"], ["Zukunft", "feminine", null, "المستقبل"]],
  "a2-22": [["Fest", "neuter", "Feste", "المناسبة / الحفل"], ["Einladung", "feminine", "Einladungen", "الدعوة"], ["Brauch", "masculine", "Bräuche", "العادة الاجتماعية"], ["Gast", "masculine", "Gäste", "الضيف"]],
  "a2-23": [["Ehrenamt", "neuter", "Ehrenämter", "العمل التطوعي"], ["Verein", "masculine", "Vereine", "الجمعية"], ["Unterstützung", "feminine", null, "الدعم"], ["Aufgabe", "feminine", "Aufgaben", "المهمة"]],
  "a2-24": [["Entscheidung", "feminine", "Entscheidungen", "القرار"], ["Kriterium", "neuter", "Kriterien", "المعيار"], ["Alternative", "feminine", "Alternativen", "البديل"], ["Mehrheit", "feminine", "Mehrheiten", "الأغلبية"]],
};

const additionalNounSeeds: Partial<Record<string, readonly NounSeed[]>> = {
  "a2-01": [["Änderung", "feminine", "Änderungen", "التغيير"], ["Besprechung", "feminine", "Besprechungen", "الاجتماع"], ["Bus", "masculine", "Busse", "الحافلة"], ["Tag", "masculine", "Tage", "اليوم"]],
  "a2-02": [["Band", "neuter", "Bänder", "الشريط"], ["Rucksack", "masculine", "Rucksäcke", "حقيبة الظهر"], ["Tasche", "feminine", "Taschen", "الحقيبة"]],
  "a2-03": [["Vortrag", "masculine", "Vorträge", "العرض / المحاضرة"]],
  "a2-04": [["Hausflur", "masculine", "Hausflure", "رواق المبنى"], ["Kiste", "feminine", "Kisten", "الصندوق"], ["Mehrfamilienhaus", "neuter", "Mehrfamilienhäuser", "مبنى متعدد الشقق"], ["Mülltonne", "feminine", "Mülltonnen", "حاوية القمامة"], ["Nachricht", "feminine", "Nachrichten", "الرسالة"], ["Paket", "neuter", "Pakete", "الطرد"], ["Schlüssel", "masculine", "Schlüssel", "المفتاح"], ["Treppenhaus", "neuter", "Treppenhäuser", "بيت الدرج"], ["Tür", "feminine", "Türen", "الباب"]],
  "a2-05": [["Bewohner", "masculine", "Bewohner", "الساكن"], ["Container", "masculine", "Container", "الحاوية"], ["Feier", "feminine", "Feiern", "الاحتفال"], ["Haustür", "feminine", "Haustüren", "باب المبنى"], ["Hinweis", "masculine", "Hinweise", "الملاحظة / التنبيه"], ["Notfall", "masculine", "Notfälle", "الحالة الطارئة"], ["Reparatur", "feminine", "Reparaturen", "الإصلاح"], ["Tonne", "feminine", "Tonnen", "الحاوية"], ["Treppenhaus", "neuter", "Treppenhäuser", "بيت الدرج"], ["Wohnprojekt", "neuter", "Wohnprojekte", "مشروع السكن"]],
  "a2-06": [["Kompromiss", "masculine", "Kompromisse", "الحل الوسط"], ["Problem", "neuter", "Probleme", "المشكلة"], ["Punkt", "masculine", "Punkte", "النقطة"], ["Putzplan", "masculine", "Putzpläne", "جدول التنظيف"], ["Regel", "feminine", "Regeln", "القاعدة"], ["Streit", "masculine", "Streite", "الخلاف"], ["Wohngemeinschaft", "feminine", "Wohngemeinschaften", "السكن المشترك"]],
  "a2-07": [["Anfrage", "feminine", "Anfragen", "الطلب / الاستفسار"], ["Arbeitsplatz", "masculine", "Arbeitsplätze", "مكان العمل"], ["Aufgabenliste", "feminine", "Aufgabenlisten", "قائمة المهام"], ["Feierabend", "masculine", "Feierabende", "وقت انتهاء العمل"], ["Pause", "feminine", "Pausen", "الاستراحة"], ["Problem", "neuter", "Probleme", "المشكلة"], ["Team", "neuter", "Teams", "الفريق"], ["Unterlage", "feminine", "Unterlagen", "المستند"], ["Verantwortung", "feminine", "Verantwortungen", "المسؤولية"]],
  "a2-08": [["Anforderung", "feminine", "Anforderungen", "المتطلب"], ["Anschreiben", "neuter", "Anschreiben", "رسالة التقديم"], ["Aufgabe", "feminine", "Aufgaben", "المهمة"], ["Berufserfahrung", "feminine", "Berufserfahrungen", "الخبرة المهنية"], ["Bewerbungsschluss", "masculine", "Bewerbungsschlüsse", "آخر موعد للتقديم"], ["Einarbeitung", "feminine", "Einarbeitungen", "مرحلة التهيئة للعمل"], ["Einladung", "feminine", "Einladungen", "الدعوة"], ["Kenntnis", "feminine", "Kenntnisse", "المعرفة / المهارة"], ["Pflege", "feminine", null, "الرعاية"], ["Stellenanzeige", "feminine", "Stellenanzeigen", "إعلان الوظيفة"]],
  "a2-09": [["Adressaufkleber", "masculine", "Adressaufkleber", "ملصق العنوان"], ["Bestellnummer", "feminine", "Bestellnummern", "رقم الطلب"], ["Bestellung", "feminine", "Bestellungen", "الطلبية"], ["Lager", "neuter", "Lager", "المخزن"], ["Lieferfirma", "feminine", "Lieferfirmen", "شركة التوصيل"], ["Name", "masculine", "Namen", "الاسم", "Namen"]],
  "a2-10": [["Abfahrtszeit", "feminine", "Abfahrtszeiten", "وقت الانطلاق"], ["Bus", "masculine", "Busse", "الحافلة"], ["Entscheidung", "feminine", "Entscheidungen", "القرار"], ["Fahrkarte", "feminine", "Fahrkarten", "تذكرة السفر"], ["Fernbus", "masculine", "Fernbusse", "حافلة المسافات الطويلة"], ["Möglichkeit", "feminine", "Möglichkeiten", "الإمكانية"], ["Reise", "feminine", "Reisen", "الرحلة"], ["Reisedauer", "feminine", "Reisedauern", "مدة الرحلة"], ["Sitzplatz", "masculine", "Sitzplätze", "المقعد"], ["Zug", "masculine", "Züge", "القطار"]],
  "a2-11": [["Anzahlung", "feminine", "Anzahlungen", "العربون"], ["Bad", "neuter", "Bäder", "الحمّام"], ["Buchungsbestätigung", "feminine", "Buchungsbestätigungen", "تأكيد الحجز"], ["Doppelzimmer", "neuter", "Doppelzimmer", "الغرفة المزدوجة"], ["Einzelzimmer", "neuter", "Einzelzimmer", "الغرفة الفردية"], ["Ferienwohnung", "feminine", "Ferienwohnungen", "شقة العطلة"], ["Gesamtpreis", "masculine", "Gesamtpreise", "السعر الإجمالي"], ["Jugendherberge", "feminine", "Jugendherbergen", "نُزل الشباب"], ["Stornobedingung", "feminine", "Stornobedingungen", "شرط الإلغاء"]],
  "a2-12": [["Alternative", "feminine", "Alternativen", "البديل"], ["Anhänger", "masculine", "Anhänger", "المقطورة"], ["Aufpreis", "masculine", "Aufpreise", "الرسوم الإضافية"], ["Beleg", "masculine", "Belege", "الإثبات / الإيصال"], ["Bestätigung", "feminine", "Bestätigungen", "التأكيد"], ["Buchung", "feminine", "Buchungen", "الحجز"], ["Gepäckstück", "neuter", "Gepäckstücke", "قطعة الأمتعة"], ["Problem", "neuter", "Probleme", "المشكلة"], ["Quittung", "feminine", "Quittungen", "الإيصال"], ["Zimmer", "neuter", "Zimmer", "الغرفة"]],
  "a2-13": [["Ziel", "neuter", "Ziele", "الهدف"]],
  "a2-14": [["Arbeitsbeginn", "masculine", null, "بداية العمل"], ["Arbeitsunfähigkeitsbescheinigung", "feminine", "Arbeitsunfähigkeitsbescheinigungen", "شهادة عدم القدرة على العمل"], ["Arztbesuch", "masculine", "Arztbesuche", "زيارة الطبيب"], ["Arzttermin", "masculine", "Arzttermine", "موعد الطبيب"], ["Aufgabe", "feminine", "Aufgaben", "المهمة"], ["Dauer", "feminine", null, "المدة"], ["Eingang", "masculine", "Eingänge", "الوصول / الاستلام"], ["Vertretung", "feminine", "Vertretungen", "الشخص البديل"]],
  "a2-15": [["Allergie", "feminine", "Allergien", "الحساسية"], ["Anwendung", "feminine", "Anwendungen", "طريقة الاستعمال"], ["Bestandteil", "masculine", "Bestandteile", "المكوّن"], ["Essen", "neuter", null, "الطعام / وقت الأكل"], ["Saft", "masculine", "Säfte", "العصير"], ["Salbe", "feminine", "Salben", "المرهم"], ["Tablette", "feminine", "Tabletten", "القرص الدوائي"], ["Verschlechterung", "feminine", "Verschlechterungen", "التدهور"]],
  "a2-16": [["Angabe", "feminine", "Angaben", "المعلومة"], ["Artikel", "masculine", "Artikel", "المقال"], ["Fahrspur", "feminine", "Fahrspuren", "مسار السير"], ["Meinung", "feminine", "Meinungen", "الرأي"], ["Überschrift", "feminine", "Überschriften", "العنوان"]],
  "a2-17": [["Ablenkung", "feminine", "Ablenkungen", "الإلهاء"], ["Benachrichtigung", "feminine", "Benachrichtigungen", "الإشعار"], ["Beobachtungswoche", "feminine", "Beobachtungswochen", "أسبوع الملاحظة"], ["Bildschirmzeit", "feminine", "Bildschirmzeiten", "وقت الشاشة"], ["Foto", "neuter", "Fotos", "الصورة"], ["Link", "masculine", "Links", "الرابط"], ["Meldung", "feminine", "Meldungen", "البلاغ / المنشور"], ["Nachricht", "feminine", "Nachrichten", "الرسالة"], ["Privatsphäre", "feminine", null, "الخصوصية"], ["Quelle", "feminine", "Quellen", "المصدر"], ["Zustimmung", "feminine", "Zustimmungen", "الموافقة"], ["Zwei-Faktor-Anmeldung", "feminine", "Zwei-Faktor-Anmeldungen", "تسجيل الدخول بعاملين"]],
  "a2-18": [["Argument", "neuter", "Argumente", "الحجة"], ["Vorschlag", "masculine", "Vorschläge", "الاقتراح"]],
  "a2-19": [["Antwort", "feminine", "Antworten", "الإجابة"], ["Beispiel", "neuter", "Beispiele", "المثال"], ["Lerngewohnheit", "feminine", "Lerngewohnheiten", "عادة التعلم"], ["Lücke", "feminine", "Lücken", "الفجوة"], ["Satz", "masculine", "Sätze", "الجملة"], ["Selbstversuch", "masculine", "Selbstversuche", "التجربة الذاتية"], ["Stapel", "masculine", "Stapel", "الرزمة"], ["Woche", "feminine", "Wochen", "الأسبوع"]],
  "a2-20": [["Abendkurs", "masculine", "Abendkurse", "الدورة المسائية"], ["Abschlusstest", "masculine", "Abschlusstests", "اختبار النهاية"], ["Beratungsgespräch", "neuter", "Beratungsgespräche", "جلسة الاستشارة"], ["Bildungszentrum", "neuter", "Bildungszentren", "مركز التعليم"], ["Einstufungstest", "masculine", "Einstufungstests", "اختبار تحديد المستوى"], ["Frist", "feminine", "Fristen", "المهلة"], ["Gebühr", "feminine", "Gebühren", "الرسوم"], ["Intensivkurs", "masculine", "Intensivkurse", "الدورة المكثفة"], ["Kurs", "masculine", "Kurse", "الدورة"], ["Kursdauer", "feminine", "Kursdauern", "مدة الدورة"], ["Kursgebühr", "feminine", "Kursgebühren", "رسوم الدورة"], ["Onlinekurs", "masculine", "Onlinekurse", "الدورة عبر الإنترنت"], ["Probestunde", "feminine", "Probestunden", "حصة تجريبية"], ["Sprachzertifikat", "neuter", "Sprachzertifikate", "شهادة اللغة"], ["Teilnahmebedingung", "feminine", "Teilnahmebedingungen", "شرط المشاركة"], ["Unterrichtsstunde", "feminine", "Unterrichtsstunden", "الحصة الدراسية"]],
  "a2-21": [["Fortschritt", "masculine", "Fortschritte", "التقدم"], ["Frist", "feminine", "Fristen", "المهلة"], ["Woche", "feminine", "Wochen", "الأسبوع"], ["Zwischentest", "masculine", "Zwischentests", "الاختبار المرحلي"], ["Zwischenziel", "neuter", "Zwischenziele", "الهدف المرحلي"]],
  "a2-22": [["Bedürfnis", "neuter", "Bedürfnisse", "الحاجة"], ["Familie", "feminine", "Familien", "العائلة"], ["Feier", "feminine", "Feiern", "الاحتفال"], ["Geschenk", "neuter", "Geschenke", "الهدية"], ["Menge", "feminine", "Mengen", "الكمية"], ["Nussallergie", "feminine", "Nussallergien", "حساسية المكسرات"]],
  "a2-23": [["Einführung", "feminine", "Einführungen", "المقدمة / التعريف"], ["Einsatz", "masculine", "Einsätze", "المشاركة / المهمة"], ["Gruppe", "feminine", "Gruppen", "المجموعة"], ["Helfer", "masculine", "Helfer", "المساعد"], ["Initiative", "feminine", "Initiativen", "المبادرة"], ["Nachbarschaft", "feminine", "Nachbarschaften", "الجوار"], ["Probephase", "feminine", "Probephasen", "المرحلة التجريبية"], ["Projekt", "neuter", "Projekte", "المشروع"], ["Sprachcafé", "neuter", "Sprachcafés", "مقهى اللغة"], ["Stadtteilzentrum", "neuter", "Stadtteilzentren", "مركز الحي"], ["Umgang", "masculine", null, "طريقة التعامل"]],
  "a2-24": [["Minderheit", "feminine", "Minderheiten", "الأقلية"], ["Protokoll", "neuter", "Protokolle", "المحضر"], ["Vorschlag", "masculine", "Vorschläge", "الاقتراح"]],
};

const frameSeeds: Record<string, FrameSeed> = {
  "a2-01": { infinitive: "erzählen", preposition: "von", governedCase: "dative", chunkDe: "von einer Erfahrung erzählen", meaningAr: "يروي تجربة", exampleDe: "Ich erzähle von einer Erfahrung.", contrastAr: "erzählen von يربط الرواية بموضوع ويطلب Dativ." },
  "a2-02": { infinitive: "anfangen", preposition: "mit", governedCase: "dative", chunkDe: "mit der Geschichte anfangen", meaningAr: "يبدأ بالقصة", exampleDe: "Wir fangen mit der Geschichte an.", contrastAr: "anfangen mit يطلب Dativ، والفعل منفصل في الجملة الرئيسية." },
  "a2-03": { infinitive: "sich erinnern", preposition: "an", governedCase: "accusative", chunkDe: "sich an einen Moment erinnern", meaningAr: "يتذكر لحظة", exampleDe: "Ich erinnere mich an einen besonderen Moment.", contrastAr: "sich erinnern an يطلب Akkusativ مع الضمير الانعكاسي." },
  "a2-04": { infinitive: "helfen", preposition: "bei", governedCase: "dative", chunkDe: "bei einem Umzug helfen", meaningAr: "يساعد في انتقال منزل", exampleDe: "Wir helfen bei einem Umzug.", contrastAr: "bei يربط المساعدة بالمهمة ويطلب Dativ." },
  "a2-05": { infinitive: "sich halten", preposition: "an", governedCase: "accusative", chunkDe: "sich an die Hausordnung halten", meaningAr: "يلتزم بنظام المنزل", exampleDe: "Alle halten sich an die Hausordnung.", contrastAr: "sich halten an يطلب Akkusativ، وليس Dativ المكان." },
  "a2-06": { infinitive: "sich einigen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Lösung einigen", meaningAr: "يتفق على حل", exampleDe: "Die Nachbarn einigen sich auf eine Lösung.", contrastAr: "نتيجة التفاوض تأتي بعد auf + Akkusativ." },
  "a2-07": { infinitive: "teilnehmen", preposition: "an", governedCase: "dative", chunkDe: "an einer Besprechung teilnehmen", meaningAr: "يشارك في اجتماع", exampleDe: "Ich nehme an einer Besprechung teil.", contrastAr: "teilnehmen an يطلب Dativ، والفعل منفصل." },
  "a2-08": { infinitive: "sich bewerben", preposition: "um", governedCase: "accusative", chunkDe: "sich um eine Stelle bewerben", meaningAr: "يتقدم لوظيفة", exampleDe: "Sie bewirbt sich um eine Stelle.", contrastAr: "الوظيفة المطلوبة تأتي بعد um + Akkusativ." },
  "a2-09": { infinitive: "sprechen", preposition: "mit", governedCase: "dative", chunkDe: "mit einer Kundin sprechen", meaningAr: "يتحدث مع عميلة", exampleDe: "Ich spreche mit einer Kundin.", contrastAr: "الشخص المقابل يأتي بعد mit + Dativ." },
  "a2-10": { infinitive: "sich entscheiden", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Verbindung entscheiden", meaningAr: "يختار وصلة نقل", exampleDe: "Wir entscheiden uns für eine direkte Verbindung.", contrastAr: "الخيار المختار يأتي بعد für + Akkusativ." },
  "a2-11": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach einem Zimmer fragen", meaningAr: "يسأل عن غرفة", exampleDe: "Ich frage nach einem ruhigen Zimmer.", contrastAr: "الشيء المطلوب يأتي بعد nach + Dativ." },
  "a2-12": { infinitive: "sich beschweren", preposition: "über", governedCase: "accusative", chunkDe: "sich über einen Mangel beschweren", meaningAr: "يشتكي من عيب", exampleDe: "Der Gast beschwert sich über einen Mangel.", contrastAr: "موضوع الشكوى يأتي بعد über + Akkusativ." },
  "a2-13": { infinitive: "achten", preposition: "auf", governedCase: "accusative", chunkDe: "auf gesunde Ernährung achten", meaningAr: "يهتم بتغذية صحية", exampleDe: "Ich achte auf gesunde Ernährung.", contrastAr: "achten auf يطلب Akkusativ ويعني الانتباه الواعي." },
  "a2-14": { infinitive: "informieren", preposition: "über", governedCase: "accusative", chunkDe: "über die Krankmeldung informieren", meaningAr: "يبلغ بشأن المرض", exampleDe: "Ich informiere den Arbeitgeber über die Krankmeldung.", contrastAr: "المعلومة أو الموضوع يأتي بعد über + Akkusativ." },
  "a2-15": { infinitive: "fragen", preposition: "nach", governedCase: "dative", chunkDe: "nach der Dosierung fragen", meaningAr: "يسأل عن الجرعة", exampleDe: "Ich frage nach der richtigen Dosierung.", contrastAr: "nach يطلب Dativ: nach der Dosierung." },
  "a2-16": { infinitive: "berichten", preposition: "über", governedCase: "accusative", chunkDe: "über eine Meldung berichten", meaningAr: "يقدم تقريرًا عن خبر", exampleDe: "Die Zeitung berichtet über eine Meldung.", contrastAr: "موضوع التقرير يأتي بعد über + Akkusativ." },
  "a2-17": { infinitive: "sich schützen", preposition: "vor", governedCase: "dative", chunkDe: "sich vor Datenverlust schützen", meaningAr: "يحمي نفسه من فقدان البيانات", exampleDe: "Man schützt sich mit einem Passwort vor Datenverlust.", contrastAr: "الخطر الذي نحتمي منه يأتي بعد vor + Dativ." },
  "a2-18": { infinitive: "sprechen", preposition: "über", governedCase: "accusative", chunkDe: "über Vor- und Nachteile sprechen", meaningAr: "يتحدث عن المزايا والعيوب", exampleDe: "Wir sprechen über Vor- und Nachteile.", contrastAr: "موضوع النقاش بعد über يأخذ Akkusativ." },
  "a2-19": { infinitive: "arbeiten", preposition: "an", governedCase: "dative", chunkDe: "an einem Lernziel arbeiten", meaningAr: "يعمل على هدف تعلم", exampleDe: "Ich arbeite an einem Lernziel.", contrastAr: "arbeiten an يطلب Dativ عند تطوير شيء تدريجيًا." },
  "a2-20": { infinitive: "sich anmelden", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Prüfung anmelden", meaningAr: "يسجل لامتحان", exampleDe: "Sie meldet sich für eine Prüfung an.", contrastAr: "الامتحان المقصود يأتي بعد für + Akkusativ." },
  "a2-21": { infinitive: "sich vorbereiten", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf ein Ziel vorbereiten", meaningAr: "يستعد لهدف", exampleDe: "Wir bereiten uns auf ein Ziel vor.", contrastAr: "الشيء القادم الذي نستعد له يأتي بعد auf + Akkusativ." },
  "a2-22": { infinitive: "einladen", preposition: "zu", governedCase: "dative", chunkDe: "zu einem Fest einladen", meaningAr: "يدعو إلى مناسبة", exampleDe: "Wir laden Freunde zu einem Fest ein.", contrastAr: "المناسبة تأتي بعد zu + Dativ، والفعل منفصل." },
  "a2-23": { infinitive: "sich engagieren", preposition: "für", governedCase: "accusative", chunkDe: "sich für einen Verein engagieren", meaningAr: "ينشط لصالح جمعية", exampleDe: "Sie engagiert sich für einen Verein.", contrastAr: "المجال أو القضية بعد für تكون في Akkusativ." },
  "a2-24": { infinitive: "sich entscheiden", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Alternative entscheiden", meaningAr: "يختار بديلًا", exampleDe: "Die Mehrheit entscheidet sich für eine Alternative.", contrastAr: "الخيار النهائي يأتي بعد für + Akkusativ." },
};

const additionalFrameSeeds: Partial<Record<string, readonly FrameSeed[]>> = {
  "a2-04": [{ infinitive: "klingeln", preposition: "an", governedCase: "dative", chunkDe: "an der Tür klingeln", meaningAr: "يقرع جرس الباب", exampleDe: "Die neue Nachbarin klingelt an der Tür.", contrastAr: "الموضع الثابت بعد an يأتي هنا مع Dativ: an der Tür." }],
  "a2-05": [{ infinitive: "Rücksicht nehmen", preposition: "auf", governedCase: "accusative", chunkDe: "auf andere Rücksicht nehmen", meaningAr: "يراعي الآخرين", exampleDe: "Wir nehmen auf andere Hausbewohner Rücksicht.", contrastAr: "الشخص أو الجهة التي نراعيها تأتي بعد auf + Akkusativ؛ احفظ Rücksicht nehmen كتركيب واحد." }],
  "a2-06": [{ infinitive: "sich halten", preposition: "an", governedCase: "accusative", chunkDe: "sich an eine Regel halten", meaningAr: "يلتزم بقاعدة", exampleDe: "Beide Nachbarn halten sich an die vereinbarte Regel.", contrastAr: "القاعدة الملزِمة تأتي بعد sich halten an مع Akkusativ." }],
  "a2-07": [{ infinitive: "sich kümmern", preposition: "um", governedCase: "accusative", chunkDe: "sich um eine Aufgabe kümmern", meaningAr: "يتولى مهمة ويعتني بها", exampleDe: "Ich kümmere mich um diese Aufgabe.", contrastAr: "المهمة أو الشخص بعد sich kümmern يأتي مع um + Akkusativ." }],
  "a2-15": [{ infinitive: "einnehmen", preposition: "mit", governedCase: "dative", chunkDe: "ein Medikament mit Wasser einnehmen", meaningAr: "يتناول دواءً مع الماء", exampleDe: "Nehmen Sie das Medikament mit einem Glas Wasser ein.", contrastAr: "الوسيلة أو المصاحبة بعد mit تأتي في Dativ: mit einem Glas Wasser." }],
  "a2-19": [{ infinitive: "lernen", preposition: "mit", governedCase: "dative", chunkDe: "mit Abstand lernen", meaningAr: "يراجع على فترات متباعدة", exampleDe: "Ich lerne mit zeitlichem Abstand statt alles an einem Tag.", contrastAr: "mit يصف هنا طريقة التعلم ويطلب Dativ؛ احفظ العبارة بوصفها Chunk لا ترجمة منفصلة." }],
};

export const a2NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => nounEntries(lessonId, [...seeds, ...(additionalNounSeeds[lessonId] ?? [])]));
export const a2VerbPrepositionFrames: VerbPrepositionFrame[] = Object.entries(frameSeeds).flatMap(([lessonId, frame]) =>
  [frame, ...(additionalFrameSeeds[lessonId] ?? [])].map((item, index) => ({
    id: `${lessonId}-verb-frame-${index + 1}`,
    lessonId,
    ...item,
    firstStructuredStage: "vocabulary" as const,
    sourceVersion: "a2-lexical-grammar-v1" as const,
  })),
);
