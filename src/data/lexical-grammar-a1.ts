import { buildNounEntries, buildVerbFrames, groupByLesson } from "./lexical-grammar-build";
import type { NounSeed, FrameSeed } from "./lexical-grammar-build";
import type { LexicalSourceVersion } from "@/types/lexical-grammar";

const sourceVersion: LexicalSourceVersion = "a1-lexical-grammar-v1";

const nounSeeds: Record<string, readonly NounSeed[]> = {
  "a1-01": [["Name", "masculine", "Namen", "الاسم", "Namen"], ["Kurs", "masculine", "Kurse", "الدورة"], ["Lehrerin", "feminine", "Lehrerinnen", "المعلّمة"], ["Frage", "feminine", "Fragen", "السؤال"]],
  "a1-02": [["Land", "neuter", "Länder", "البلد"], ["Stadt", "feminine", "Städte", "المدينة"], ["Sprache", "feminine", "Sprachen", "اللغة"], ["Wohnort", "masculine", "Wohnorte", "مكان السكن"]],
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
  "a1-14": [["Tisch", "masculine", "Tische", "الطاولة"], ["Stuhl", "masculine", "Stühle", "الكرسي"], ["Schrank", "masculine", "Schränke", "الخزانة"], ["Lampe", "feminine", "Lampen", "المصباح"]],
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

export const a1NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => buildNounEntries(lessonId, seeds, sourceVersion, "A1"));
export const a1VerbPrepositionFrames = Object.entries(frameSeeds).flatMap(([lessonId, frame]) => buildVerbFrames(lessonId, [frame], sourceVersion));

export const a1NounsByLesson = groupByLesson(a1NounGrammarEntries);
export const a1VerbFramesByLesson = groupByLesson(a1VerbPrepositionFrames);
