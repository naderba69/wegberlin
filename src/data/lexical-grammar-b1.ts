import { buildNounEntries, buildVerbFrames, groupByLesson } from "./lexical-grammar-build";
import type { FrameSeed, NounSeed } from "./lexical-grammar-build";
import type { LexicalSourceVersion } from "@/types/lexical-grammar";

const sourceVersion: LexicalSourceVersion = "b1-lexical-grammar-v1";

/**
 * دفعة B1 البنيوية (`b1-lexical-grammar-v1`).
 * كل درس B1 منشور يملك أربع مراسي اسمية وإطارين لفعل + حرف جر + حالة،
 * مأخوذة من نظرية الدرس ومفرداته. تبقى مراسي مختارة لا تغطية كاملة لكل أسماء وأفعال B1.
 */
const nounSeeds: Record<string, readonly NounSeed[]> = {
  "b1-01": [["Lebensweg", "masculine", "Lebenswege", "مسار الحياة"], ["Ausbildung", "feminine", "Ausbildungen", "التكوين المهني"], ["Studium", "neuter", "Studien", "الدراسة الجامعية"], ["Abschluss", "masculine", "Abschlüsse", "الشهادة / إتمام المرحلة"]],
  "b1-02": [["Alternative", "feminine", "Alternativen", "البديل"], ["Risiko", "neuter", "Risiken", "المخاطرة"], ["Perspektive", "feminine", "Perspektiven", "الأفق / المنظور"], ["Folge", "feminine", "Folgen", "النتيجة"]],
  "b1-03": [["Wendepunkt", "masculine", "Wendepunkte", "نقطة التحول"], ["Chance", "feminine", "Chancen", "الفرصة"], ["Erfahrung", "feminine", "Erfahrungen", "التجربة"], ["Auftrag", "masculine", "Aufträge", "التكليف"]],
  "b1-04": [["Ergebnis", "neuter", "Ergebnisse", "النتيجة"], ["Abhängigkeit", "feminine", "Abhängigkeiten", "الاعتمادية"], ["Rolle", "feminine", "Rollen", "الدور"], ["Verantwortung", "feminine", "Verantwortungen", "المسؤولية"]],
  "b1-05": [["Konflikt", "masculine", "Konflikte", "النزاع"], ["Beobachtung", "feminine", "Beobachtungen", "الملاحظة"], ["Vorwurf", "masculine", "Vorwürfe", "اللوم / الاتهام"], ["Grenze", "feminine", "Grenzen", "الحد"]],
  "b1-06": [["Stärke", "feminine", "Stärken", "نقطة القوة"], ["Herausforderung", "feminine", "Herausforderungen", "التحدي"], ["Zeitdruck", "masculine", null, "ضغط الوقت"], ["Priorität", "feminine", "Prioritäten", "الأولوية"]],
  "b1-07": [["Lebensqualität", "feminine", null, "جودة الحياة"], ["Infrastruktur", "feminine", "Infrastrukturen", "البنية التحتية"], ["Kompromiss", "masculine", "Kompromisse", "الحل الوسط"], ["Großstadt", "feminine", "Großstädte", "المدينة الكبرى"]],
  "b1-08": [["Mangel", "masculine", "Mängel", "الخلل / النقص"], ["Schaden", "masculine", "Schäden", "الضرر"], ["Reparatur", "feminine", "Reparaturen", "الإصلاح"], ["Übergangslösung", "feminine", "Übergangslösungen", "حل مؤقت"]],
  "b1-09": [["Radweg", "masculine", "Radwege", "مسار الدراجات"], ["Grünfläche", "feminine", "Grünflächen", "المساحة الخضراء"], ["Barrierefreiheit", "feminine", null, "إمكانية الوصول بلا عوائق"], ["Lärmbelastung", "feminine", "Lärmbelastungen", "عبء الضجيج"]],
  "b1-10": [["Kaufentscheidung", "feminine", "Kaufentscheidungen", "قرار الشراء"], ["Lebensdauer", "feminine", null, "مدة الصلاحية"], ["Garantie", "feminine", "Garantien", "الضمان"], ["Anschaffung", "feminine", "Anschaffungen", "الاقتناء"]],
  "b1-11": [["Arbeitsweg", "masculine", "Arbeitswege", "طريق العمل"], ["Fahrgemeinschaft", "feminine", "Fahrgemeinschaften", "الركوب المشترك"], ["Emission", "feminine", "Emissionen", "الانبعاث"], ["Zuverlässigkeit", "feminine", null, "الموثوقية"]],
  "b1-12": [["Zielgruppe", "feminine", "Zielgruppen", "الفئة المستهدفة"], ["Wirkung", "feminine", "Wirkungen", "الأثر"], ["Ressource", "feminine", "Ressourcen", "المورد"], ["Kooperationspartner", "masculine", "Kooperationspartner", "شريك التعاون"]],
  "b1-13": [["Lernweg", "masculine", "Lernwege", "مسار التعلم"], ["Talent", "neuter", "Talente", "الموهبة"], ["Kategorie", "feminine", "Kategorien", "الفئة"], ["Aufnahme", "feminine", "Aufnahmen", "التسجيل"]],
  "b1-14": [["Weiterbildung", "feminine", "Weiterbildungen", "التكوين المستمر"], ["Qualifikation", "feminine", "Qualifikationen", "المؤهل"], ["Nachweis", "masculine", "Nachweise", "الإثبات / البيّنة"], ["Förderung", "feminine", "Förderungen", "الدعم"]],
  "b1-15": [["Präsentation", "feminine", "Präsentationen", "العرض التقديمي"], ["Gliederung", "feminine", "Gliederungen", "الهيكلة"], ["Beleg", "masculine", "Belege", "الدليل"], ["Zuhörer", "masculine", "Zuhörer", "المستمع"]],
  "b1-16": [["Bildschirmzeit", "feminine", null, "وقت الشاشة"], ["Unterbrechung", "feminine", "Unterbrechungen", "المقاطعة"], ["Wiedergabe", "feminine", "Wiedergaben", "التشغيل / العرض"], ["Inhalt", "masculine", "Inhalte", "المحتوى"]],
  "b1-17": [["Handlung", "feminine", "Handlungen", "الحبكة"], ["Hauptfigur", "feminine", "Hauptfiguren", "الشخصية الرئيسية"], ["Erzählperspektive", "feminine", "Erzählperspektiven", "زاوية السرد"], ["Atmosphäre", "feminine", "Atmosphären", "الأجواء"]],
  "b1-18": [["Behauptung", "feminine", "Behauptungen", "الادعاء"], ["Stichprobe", "feminine", "Stichproben", "العيّنة"], ["Methode", "feminine", "Methoden", "المنهج"], ["Untersuchung", "feminine", "Untersuchungen", "الدراسة"]],
  "b1-19": [["Missverständnis", "neuter", "Missverständnisse", "سوء الفهم"], ["Erwartung", "feminine", "Erwartungen", "التوقّع"], ["Formulierung", "feminine", "Formulierungen", "الصياغة"], ["Bedeutung", "feminine", "Bedeutungen", "المعنى"]],
  "b1-20": [["Ratschlag", "masculine", "Ratschläge", "النصيحة"], ["Einschränkung", "feminine", "Einschränkungen", "القيد"], ["Möglichkeit", "feminine", "Möglichkeiten", "الإمكانية"], ["Probephase", "feminine", "Probephasen", "مرحلة تجريبية"]],
  "b1-21": [["Beschluss", "masculine", "Beschlüsse", "المقرَّر"], ["Zuständigkeit", "feminine", "Zuständigkeiten", "الاختصاص"], ["Hindernis", "neuter", "Hindernisse", "العائق"], ["Auswertung", "feminine", "Auswertungen", "التحليل / التقييم"]],
  "b1-22": [["Frühindikator", "masculine", "Frühindikatoren", "مؤشر مبكر"], ["Ausgangswert", "masculine", "Ausgangswerte", "القيمة الأساسية"], ["Anpassungsregel", "feminine", "Anpassungsregeln", "قاعدة التعديل"], ["Puffer", "masculine", "Puffer", "الاحتياطي"]],
  "b1-23": [["Gerät", "neuter", "Geräte", "الجهاز"], ["Funktion", "feminine", "Funktionen", "الوظيفة"], ["Synchronisation", "feminine", "Synchronisationen", "المزامنة"], ["Rückfalllösung", "feminine", "Rückfalllösungen", "الحل البديل"]],
  "b1-24": [["Leitfrage", "feminine", "Leitfragen", "السؤال الموجّه"], ["Ausgangslage", "feminine", "Ausgangslagen", "الوضعية الانطلاقية"], ["Zyklus", "masculine", "Zyklen", "الدورة"], ["Rückfrage", "feminine", "Rückfragen", "استفسار لاحق"]],
};

const frameSeeds: Record<string, readonly FrameSeed[]> = {
  "b1-01": [
    { infinitive: "träumen", preposition: "von", governedCase: "dative", chunkDe: "von einem Beruf träumen", meaningAr: "يحلم بمهنة", exampleDe: "Sie träumte lange von einem Beruf im Ausland.", contrastAr: "träumen von تطلب Dativ دائمًا: von einem Beruf." },
    { infinitive: "sich ärgern", preposition: "über", governedCase: "accusative", chunkDe: "sich über eine Entscheidung ärgern", meaningAr: "يغضب من قرار", exampleDe: "Rückblickend ärgert er sich über diese Entscheidung.", contrastAr: "سبب الغضب بعد über يأتي في Akkusativ." },
  ],
  "b1-02": [
    { infinitive: "sich entscheiden", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Alternative entscheiden", meaningAr: "يختار بديلًا", exampleDe: "Ich entscheide mich für die Alternative mit weniger Risiko.", contrastAr: "الخيار المختار بعد für يبقى Akkusativ." },
    { infinitive: "sich entscheiden", preposition: "gegen", governedCase: "accusative", chunkDe: "sich gegen ein Risiko entscheiden", meaningAr: "يقرر ضد خيار محفوف بالمخاطر", exampleDe: "Wir haben uns gegen das Risiko entschieden.", contrastAr: "gegen تطلب Akkusativ دائمًا، حتى مع القرار السلبي." },
  ],
  "b1-03": [
    { infinitive: "nachdenken", preposition: "über", governedCase: "accusative", chunkDe: "über einen Wendepunkt nachdenken", meaningAr: "يتأمل نقطة تحول", exampleDe: "Ich habe lange über diesen Wendepunkt nachgedacht.", contrastAr: "موضوع التفكير بعد über يأخذ Akkusativ." },
    { infinitive: "abhängen", preposition: "von", governedCase: "dative", chunkDe: "von einer Entscheidung abhängen", meaningAr: "يتوقف على قرار", exampleDe: "Vieles hing von dieser einen Entscheidung ab.", contrastAr: "abhängen von تطلب Dativ: von dieser Entscheidung." },
  ],
  "b1-04": [
    { infinitive: "sich abstimmen", preposition: "mit", governedCase: "dative", chunkDe: "sich mit dem Team abstimmen", meaningAr: "ينسّق مع الفريق", exampleDe: "Ich stimme mich jeden Morgen mit dem Team ab.", contrastAr: "من تنسّق معه بعد mit يبقى في Dativ." },
    { infinitive: "verantwortlich sein", preposition: "für", governedCase: "accusative", chunkDe: "für ein Ergebnis verantwortlich sein", meaningAr: "يكون مسؤولًا عن نتيجة", exampleDe: "Sie ist für das Ergebnis verantwortlich, nicht für jeden Schritt.", contrastAr: "المسؤول عنه بعد für يأتي في Akkusativ. الفعل منفصل في الاستعمال." },
  ],
  "b1-05": [
    { infinitive: "reagieren", preposition: "auf", governedCase: "accusative", chunkDe: "auf einen Vorwurf reagieren", meaningAr: "يرد على لوم", exampleDe: "Er reagierte ruhig auf den Vorwurf.", contrastAr: "المثير بعد auf يأخذ Akkusativ: auf den Vorwurf." },
    { infinitive: "hinweisen", preposition: "auf", governedCase: "accusative", chunkDe: "auf ein Risiko hinweisen", meaningAr: "ينبّه إلى خطر", exampleDe: "Ich weise früh auf das Risiko hin.", contrastAr: "hinweisen auf تطلب Akkusativ، والفعل منفصل في الجملة." },
  ],
  "b1-06": [
    { infinitive: "berichten", preposition: "von", governedCase: "dative", chunkDe: "von einer Herausforderung berichten", meaningAr: "يروي عن تحدٍّ", exampleDe: "Ich berichte gern von einer konkreten Herausforderung.", contrastAr: "berichten von تطلب Dativ؛ أما berichten über فتطلب Akkusativ." },
    { infinitive: "überzeugen", preposition: "durch", governedCase: "accusative", chunkDe: "durch ein Beispiel überzeugen", meaningAr: "يقنع بمثال", exampleDe: "Ich überzeuge durch ein konkretes Beispiel aus der Praxis.", contrastAr: "durch تطلب Akkusativ دائمًا: durch ein Beispiel." },
  ],
  "b1-07": [
    { infinitive: "sich unterscheiden", preposition: "von", governedCase: "dative", chunkDe: "sich von dem Landleben unterscheiden", meaningAr: "يختلف عن حياة الريف", exampleDe: "Das Stadtleben unterscheidet sich deutlich von dem Landleben.", contrastAr: "اكتب von dem كاملة في التدريب؛ الاختصار vom لا يظهر الحالة." },
    { infinitive: "leiden", preposition: "unter", governedCase: "dative", chunkDe: "unter dem Lärm leiden", meaningAr: "يعاني من الضجيج", exampleDe: "Viele leiden unter dem Lärm der Großstadt.", contrastAr: "leiden unter تطلب Dativ: unter dem Lärm، لا Akkusativ." },
  ],
  "b1-08": [
    { infinitive: "sich wenden", preposition: "an", governedCase: "accusative", chunkDe: "sich an die Hausverwaltung wenden", meaningAr: "يتوجّه إلى إدارة العمارة", exampleDe: "Ich habe mich schriftlich an die Hausverwaltung gewendet.", contrastAr: "الجهة بعد an تأخذ Akkusativ هنا لأنها وجهة التوجّه." },
    { infinitive: "klagen", preposition: "über", governedCase: "accusative", chunkDe: "über den Lärm klagen", meaningAr: "يشتكي من الضجيج", exampleDe: "Die Nachbarn klagen seit Wochen über den Lärm.", contrastAr: "موضوع الشكوى بعد über يبقى Akkusativ." },
  ],
  "b1-09": [
    { infinitive: "mitwirken", preposition: "an", governedCase: "dative", chunkDe: "an einem Pilotprojekt mitwirken", meaningAr: "يساهم في مشروع تجريبي", exampleDe: "Anwohner wirken an dem Pilotprojekt mit.", contrastAr: "an مع المشاركة في حدث تأخذ Dativ؛ والفعل منفصل." },
    { infinitive: "beitragen", preposition: "zu", governedCase: "dative", chunkDe: "zu der Verkehrssicherheit beitragen", meaningAr: "يساهم في السلامة المرورية", exampleDe: "Der Radweg trägt zu der Verkehrssicherheit bei.", contrastAr: "zu تطلب Dativ دائمًا: zu der Verkehrssicherheit." },
  ],
  "b1-10": [
    { infinitive: "sich lohnen", preposition: "für", governedCase: "accusative", chunkDe: "sich für den Alltag lohnen", meaningAr: "يستحق ثمنه في الاستعمال اليومي", exampleDe: "Das teurere Gerät lohnt sich für den Alltag.", contrastAr: "المستفيد أو المجال بعد für يأخذ Akkusativ." },
    { infinitive: "sich verlassen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Garantie verlassen", meaningAr: "يعتمد على ضمان", exampleDe: "Ich verlasse mich nicht nur auf die Garantie.", contrastAr: "sich verlassen auf تطلب Akkusativ؛ الفعل منفصل في الجملة." },
  ],
  "b1-11": [
    { infinitive: "sich beteiligen", preposition: "an", governedCase: "dative", chunkDe: "sich an einer Fahrgemeinschaft beteiligen", meaningAr: "يشارك في ركوب مشترك", exampleDe: "Ich beteilige mich zweimal pro Woche an einer Fahrgemeinschaft.", contrastAr: "an مع المشاركة في ترتيب قائم تأخذ Dativ." },
    { infinitive: "umsteigen", preposition: "auf", governedCase: "accusative", chunkDe: "auf den Bus umsteigen", meaningAr: "ينتقل إلى الحافلة", exampleDe: "Viele steigen für den Arbeitsweg auf den Bus um.", contrastAr: "الهدف بعد auf يأخذ Akkusativ: auf den Bus." },
  ],
  "b1-12": [
    { infinitive: "suchen", preposition: "nach", governedCase: "dative", chunkDe: "nach Kooperationspartnern suchen", meaningAr: "يبحث عن شركاء تعاون", exampleDe: "Wir suchen nach Kooperationspartnern im Stadtteil.", contrastAr: "suchen nach تطلب Dativ: nach Kooperationspartnern." },
    { infinitive: "sich einsetzen", preposition: "für", governedCase: "accusative", chunkDe: "sich für ein messbares Ziel einsetzen", meaningAr: "يعمل من أجل هدف قابل للقياس", exampleDe: "Wir setzen uns für ein messbares Ziel ein.", contrastAr: "القضية بعد für تأخذ Akkusativ؛ الفعل منفصل." },
  ],
  "b1-13": [
    { infinitive: "lernen", preposition: "aus", governedCase: "dative", chunkDe: "aus Fehlern lernen", meaningAr: "يتعلم من الأخطاء", exampleDe: "Ich lerne mehr aus meinen Fehlern als aus Regeln.", contrastAr: "aus تطلب Dativ دائمًا: aus meinen Fehlern." },
    { infinitive: "sich orientieren", preposition: "an", governedCase: "dative", chunkDe: "sich an Belegen orientieren", meaningAr: "يعتمد على أدلة", exampleDe: "Ich orientiere mich an Belegen, nicht an Gefühlen.", contrastAr: "sich orientieren an تطلب Dativ: an Belegen." },
  ],
  "b1-14": [
    { infinitive: "sich informieren", preposition: "über", governedCase: "accusative", chunkDe: "sich über Fördermöglichkeiten informieren", meaningAr: "يستعلم عن إمكانيات الدعم", exampleDe: "Ich informiere mich früh über Fördermöglichkeiten.", contrastAr: "الموضوع بعد über يبقى Akkusativ مع الضمير الانعكاسي." },
    { infinitive: "sich qualifizieren", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine Stelle qualifizieren", meaningAr: "يؤهّل نفسه لوظيفة", exampleDe: "Damit qualifiziere ich mich für eine neue Stelle.", contrastAr: "الغاية بعد für تأخذ Akkusativ: für eine neue Stelle." },
  ],
  "b1-15": [
    { infinitive: "eingehen", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Frage eingehen", meaningAr: "يتناول سؤالًا بالرد", exampleDe: "Ich gehe gern auf Ihre Frage ein.", contrastAr: "eingehen auf تطلب Akkusativ: auf Ihre Frage." },
    { infinitive: "schließen", preposition: "mit", governedCase: "dative", chunkDe: "mit einer Zusammenfassung schließen", meaningAr: "يختم بخلاصة", exampleDe: "Ich schließe mit einer kurzen Zusammenfassung.", contrastAr: "mit تطلب Dativ: mit einer Zusammenfassung." },
  ],
  "b1-16": [
    { infinitive: "ablenken", preposition: "von", governedCase: "dative", chunkDe: "von der Arbeit ablenken", meaningAr: "يشتّت عن العمل", exampleDe: "Benachrichtigungen lenken mich von der Arbeit ab.", contrastAr: "ablenken von تطلب Dativ؛ والفعل منفصل في الجملة." },
    { infinitive: "sich beschränken", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Stunde beschränken", meaningAr: "يقتصر على ساعة", exampleDe: "Ich beschränke mich auf eine Stunde am Abend.", contrastAr: "الحد بعد auf يأخذ Akkusativ: auf eine Stunde." },
  ],
  "b1-17": [
    { infinitive: "handeln", preposition: "von", governedCase: "dative", chunkDe: "von einer Familiengeschichte handeln", meaningAr: "يتحدث عن قصة عائلة", exampleDe: "Der Film handelt von einer Familiengeschichte.", contrastAr: "handeln von تطلب Dativ: von einer Familiengeschichte." },
    { infinitive: "sich beschäftigen", preposition: "mit", governedCase: "dative", chunkDe: "sich mit einem Thema beschäftigen", meaningAr: "يتناول موضوعًا", exampleDe: "Der Roman beschäftigt sich mit einem schwierigen Thema.", contrastAr: "sich beschäftigen mit تطلب Dativ دائمًا." },
  ],
  "b1-18": [
    { infinitive: "sich berufen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Primärquelle berufen", meaningAr: "يستند إلى مصدر أولي", exampleDe: "Ich berufe mich auf die Primärquelle, nicht auf den Bericht.", contrastAr: "المرجع بعد auf يأخذ Akkusativ: auf die Primärquelle." },
    { infinitive: "zweifeln", preposition: "an", governedCase: "dative", chunkDe: "an einer Zahl zweifeln", meaningAr: "يشك في رقم", exampleDe: "Ich zweifle an dieser Zahl, bis ich die Methode kenne.", contrastAr: "zweifeln an تطلب Dativ: an dieser Zahl." },
  ],
  "b1-19": [
    { infinitive: "anknüpfen", preposition: "an", governedCase: "accusative", chunkDe: "an ein Gespräch anknüpfen", meaningAr: "يواصل من نقطة في حديث", exampleDe: "Ich knüpfe gern an unser letztes Gespräch an.", contrastAr: "an بمعنى الاتصال بشيء تأخذ Akkusativ: an unser Gespräch." },
    { infinitive: "beruhen", preposition: "auf", governedCase: "dative", chunkDe: "auf einer Annahme beruhen", meaningAr: "يقوم على افتراض", exampleDe: "Das Missverständnis beruht auf einer falschen Annahme.", contrastAr: "استثناء متكرر: beruhen auf تأخذ Dativ، لا Akkusativ." },
  ],
  "b1-20": [
    { infinitive: "abraten", preposition: "von", governedCase: "dative", chunkDe: "von einem Kurswechsel abraten", meaningAr: "ينصح بعدم تغيير المسار", exampleDe: "Ich rate dir von einem schnellen Kurswechsel ab.", contrastAr: "abraten von تطلب Dativ؛ والفعل منفصل." },
    { infinitive: "raten", preposition: "zu", governedCase: "dative", chunkDe: "zu einer Probephase raten", meaningAr: "ينصح بمرحلة تجريبية", exampleDe: "Ich rate zu einer kurzen Probephase.", contrastAr: "الشيء المنصوح به بعد zu يبقى في Dativ." },
  ],
  "b1-21": [
    { infinitive: "anfordern", preposition: "bei", governedCase: "dative", chunkDe: "Hilfe bei der Koordination anfordern", meaningAr: "يطلب مساعدة من جهة التنسيق", exampleDe: "Wir fordern Hilfe bei der Koordination an.", contrastAr: "الجهة المطلوب منها بعد bei تأتي في Dativ." },
    { infinitive: "weiterleiten", preposition: "an", governedCase: "accusative", chunkDe: "eine Frage an die Leitung weiterleiten", meaningAr: "يحوّل سؤالًا إلى الإدارة", exampleDe: "Ich leite die Frage an die Leitung weiter.", contrastAr: "الوجهة بعد an تأخذ Akkusativ: an die Leitung." },
  ],
  "b1-22": [
    { infinitive: "messen", preposition: "an", governedCase: "dative", chunkDe: "den Fortschritt an einem Zielwert messen", meaningAr: "يقيس التقدم على قيمة هدف", exampleDe: "Wir messen den Fortschritt an einem klaren Zielwert.", contrastAr: "المعيار بعد an يأتي في Dativ: an einem Zielwert." },
    { infinitive: "sich absichern", preposition: "gegen", governedCase: "accusative", chunkDe: "sich gegen Verzögerungen absichern", meaningAr: "يحمي نفسه من التأخيرات", exampleDe: "Wir sichern uns gegen Verzögerungen ab.", contrastAr: "gegen تطلب Akkusativ دائمًا: gegen Verzögerungen." },
  ],
  "b1-23": [
    { infinitive: "zugreifen", preposition: "auf", governedCase: "accusative", chunkDe: "auf Daten zugreifen", meaningAr: "ينفذ إلى بيانات", exampleDe: "Die App greift auf meine Daten zu.", contrastAr: "zugreifen auf تطلب Akkusativ؛ والفعل منفصل." },
    { infinitive: "bestehen", preposition: "aus", governedCase: "dative", chunkDe: "aus zwei Teilen bestehen", meaningAr: "يتكوّن من جزأين", exampleDe: "Das System besteht aus zwei Teilen.", contrastAr: "bestehen aus تأخذ Dativ؛ لا تخلطها بـ bestehen auf مع Dativ أيضًا." },
  ],
  "b1-24": [
    { infinitive: "sich stützen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf zwei Quellen stützen", meaningAr: "يستند إلى مصدرين", exampleDe: "Wir stützen uns auf zwei unabhängige Quellen.", contrastAr: "السند بعد auf يأخذ Akkusativ: auf zwei Quellen." },
    { infinitive: "zurückgehen", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Umfrage zurückgehen", meaningAr: "يرجع إلى استبيان", exampleDe: "Die Zahlen gehen auf eine eigene Umfrage zurück.", contrastAr: "الأصل بعد auf يأخذ Akkusativ: auf eine Umfrage." },
  ],
};

export const b1NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => buildNounEntries(lessonId, seeds, sourceVersion, "B1"));
export const b1VerbPrepositionFrames = Object.entries(frameSeeds).flatMap(([lessonId, frames]) => buildVerbFrames(lessonId, frames, sourceVersion));

export const b1NounsByLesson = groupByLesson(b1NounGrammarEntries);
export const b1VerbFramesByLesson = groupByLesson(b1VerbPrepositionFrames);
