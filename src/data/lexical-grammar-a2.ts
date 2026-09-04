import { buildNounEntries, buildVerbFrames, groupByLesson } from "./lexical-grammar-build";
import type { FrameSeed, NounSeed } from "./lexical-grammar-build";
import type { LexicalSourceVersion } from "@/types/lexical-grammar";

const sourceVersion: LexicalSourceVersion = "a2-lexical-grammar-v1";

/**
 * دفعة A2 البنيوية (`a2-lexical-grammar-v1`).
 * كل درس A2 منشور يملك أربع مراسي اسمية (أداة + جنس + جمع أو سياسة عدم الجمع + Nominativ/Akkusativ/Dativ)
 * وإطارين لفعل + حرف جر + حالة، مأخوذة من نظرية الدرس ومفرداته الفعلية لا من قائمة عامة.
 * ما زالت مراسي مختارة، لا تغطية كاملة لكل أسماء A2 ولا لكل أفعاله ذات المتمم الجرّي.
 */
const nounSeeds: Record<string, readonly NounSeed[]> = {
  "a2-01": [["Arbeitstag", "masculine", "Arbeitstage", "يوم العمل"], ["Woche", "feminine", "Wochen", "الأسبوع"], ["Einkauf", "masculine", "Einkäufe", "التسوّق / عملية الشراء"], ["Ankunft", "feminine", "Ankünfte", "الوصول"]],
  "a2-02": [["Rucksack", "masculine", "Rucksäcke", "حقيبة الظهر"], ["Tasche", "feminine", "Taschen", "الحقيبة"], ["Moment", "masculine", "Momente", "اللحظة"], ["Ende", "neuter", "Enden", "النهاية"]],
  "a2-03": [["Erlebnis", "neuter", "Erlebnisse", "تجربة معيشة"], ["Vortrag", "masculine", "Vorträge", "عرض / كلمة قصيرة"], ["Angst", "feminine", "Ängste", "الخوف"], ["Stolz", "masculine", null, "الفخر"]],
  "a2-04": [["Nachbar", "masculine", "Nachbarn", "الجار", "Nachbarn"], ["Nachbarin", "feminine", "Nachbarinnen", "الجارة"], ["Treppenhaus", "neuter", "Treppenhäuser", "مدرج العمارة"], ["Schlüssel", "masculine", "Schlüssel", "المفتاح"]],
  "a2-05": [["Hausordnung", "feminine", "Hausordnungen", "لائحة النظام في العمارة"], ["Ruhezeit", "feminine", "Ruhezeiten", "فترة الهدوء"], ["Müll", "masculine", null, "النفايات"], ["Keller", "masculine", "Keller", "القبو"]],
  "a2-06": [["Wohngemeinschaft", "feminine", "Wohngemeinschaften", "السكن المشترك"], ["Streit", "masculine", "Streitigkeiten", "الخلاف"], ["Putzplan", "masculine", "Putzpläne", "جدول التنظيف"], ["Lösung", "feminine", "Lösungen", "الحل"]],
  "a2-07": [["Abteilung", "feminine", "Abteilungen", "القسم"], ["Aufgabe", "feminine", "Aufgaben", "المهمة"], ["Verantwortung", "feminine", "Verantwortungen", "المسؤولية"], ["Team", "neuter", "Teams", "الفريق"]],
  "a2-08": [["Stellenanzeige", "feminine", "Stellenanzeigen", "إعلان الوظيفة"], ["Bewerbung", "feminine", "Bewerbungen", "طلب التوظيف"], ["Lebenslauf", "masculine", "Lebensläufe", "السيرة الذاتية"], ["Berufserfahrung", "feminine", "Berufserfahrungen", "الخبرة المهنية"]],
  "a2-09": [["Telefonat", "neuter", "Telefonate", "المكالمة الهاتفية"], ["Verbindung", "feminine", "Verbindungen", "التحويل / الاتصال"], ["Nachricht", "feminine", "Nachrichten", "الرسالة"], ["Leitung", "feminine", "Leitungen", "الخط الهاتفي"]],
  "a2-10": [["Fernbus", "masculine", "Fernbusse", "حافلة المسافات الطويلة"], ["Sitzplatz", "masculine", "Sitzplätze", "مقعد"], ["Abfahrt", "feminine", "Abfahrten", "موعد المغادرة"], ["Gepäck", "neuter", null, "الأمتعة"]],
  "a2-11": [["Unterkunft", "feminine", "Unterkünfte", "الإقامة"], ["Einzelzimmer", "neuter", "Einzelzimmer", "غرفة لشخص واحد"], ["Doppelzimmer", "neuter", "Doppelzimmer", "غرفة لشخصين"], ["Buchung", "feminine", "Buchungen", "الحجز"]],
  "a2-12": [["Problem", "neuter", "Probleme", "المشكلة"], ["Bestätigung", "feminine", "Bestätigungen", "التأكيد"], ["Erstattung", "feminine", "Erstattungen", "استرداد المبلغ"], ["Gepäckstück", "neuter", "Gepäckstücke", "قطعة أمتعة"]],
  "a2-13": [["Gewohnheit", "feminine", "Gewohnheiten", "العادة"], ["Schlaf", "masculine", null, "النوم"], ["Bewegung", "feminine", "Bewegungen", "الحركة"], ["Ernährung", "feminine", null, "التغذية"]],
  "a2-14": [["Krankmeldung", "feminine", "Krankmeldungen", "الإبلاغ عن المرض"], ["Bescheinigung", "feminine", "Bescheinigungen", "الشهادة / الإفادة"], ["Vertretung", "feminine", "Vertretungen", "البديل في العمل"], ["Arzttermin", "masculine", "Arzttermine", "موعد الطبيب"]],
  "a2-15": [["Apotheke", "feminine", "Apotheken", "الصيدلية"], ["Tablette", "feminine", "Tabletten", "الحبة / القرص"], ["Packungsbeilage", "feminine", "Packungsbeilagen", "نشرة العبوة"], ["Salbe", "feminine", "Salben", "المرهم"]],
  "a2-16": [["Meldung", "feminine", "Meldungen", "الخبر / البلاغ"], ["Quelle", "feminine", "Quellen", "المصدر"], ["Überschrift", "feminine", "Überschriften", "العنوان"], ["Artikel", "masculine", "Artikel", "المقال"]],
  "a2-17": [["Konto", "neuter", "Konten", "الحساب"], ["Passwort", "neuter", "Passwörter", "كلمة المرور"], ["Privatsphäre", "feminine", null, "الخصوصية"], ["Benachrichtigung", "feminine", "Benachrichtigungen", "الإشعار"]],
  "a2-18": [["Meinung", "feminine", "Meinungen", "الرأي"], ["Vorteil", "masculine", "Vorteile", "الميزة"], ["Nachteil", "masculine", "Nachteile", "العيب"], ["Grund", "masculine", "Gründe", "السبب"]],
  "a2-19": [["Lerngewohnheit", "feminine", "Lerngewohnheiten", "عادة التعلم"], ["Fehler", "masculine", "Fehler", "الخطأ"], ["Karteikarte", "feminine", "Karteikarten", "البطاقة التعليمية"], ["Wiederholung", "feminine", "Wiederholungen", "المراجعة"]],
  "a2-20": [["Kursgebühr", "feminine", "Kursgebühren", "رسوم الدورة"], ["Anmeldung", "feminine", "Anmeldungen", "التسجيل"], ["Einstufungstest", "masculine", "Einstufungstests", "اختبار تحديد المستوى"], ["Zertifikat", "neuter", "Zertifikate", "الشهادة"]],
  "a2-21": [["Ziel", "neuter", "Ziele", "الهدف"], ["Frist", "feminine", "Fristen", "المهلة / الأجل"], ["Fortschritt", "masculine", "Fortschritte", "التقدّم"], ["Zwischenziel", "neuter", "Zwischenziele", "هدف مرحلي"]],
  "a2-22": [["Feier", "feminine", "Feiern", "الحفلة"], ["Geschenk", "neuter", "Geschenke", "الهدية"], ["Brauch", "masculine", "Bräuche", "العرف / التقليد"], ["Gast", "masculine", "Gäste", "الضيف"]],
  "a2-23": [["Ehrenamt", "neuter", "Ehrenämter", "العمل التطوعي"], ["Initiative", "feminine", "Initiativen", "المبادرة"], ["Nachbarschaft", "feminine", "Nachbarschaften", "الجوار / الحي"], ["Spende", "feminine", "Spenden", "التبرّع"]],
  "a2-24": [["Entscheidung", "feminine", "Entscheidungen", "القرار"], ["Kriterium", "neuter", "Kriterien", "المعيار"], ["Protokoll", "neuter", "Protokolle", "محضر الاجتماع"], ["Mehrheit", "feminine", "Mehrheiten", "الأغلبية"]],
};

const frameSeeds: Record<string, readonly FrameSeed[]> = {
  "a2-01": [
    { infinitive: "sprechen", preposition: "über", governedCase: "accusative", chunkDe: "über den Arbeitstag sprechen", meaningAr: "يتحدث عن يوم العمل", exampleDe: "Ich habe mit einer Freundin über meinen Arbeitstag gesprochen.", contrastAr: "über بمعنى «عن موضوع» يأخذ Akkusativ: über meinen Arbeitstag." },
    { infinitive: "ankommen", preposition: "in", governedCase: "dative", chunkDe: "in der Stadt ankommen", meaningAr: "يصل إلى المدينة", exampleDe: "Ich bin gestern spät in der Stadt angekommen.", contrastAr: "بعد ankommen يشير in إلى مكان الوصول المستقر، فيأخذ Dativ." },
  ],
  "a2-02": [
    { infinitive: "erzählen", preposition: "von", governedCase: "dative", chunkDe: "von einer Reise erzählen", meaningAr: "يروي عن رحلة", exampleDe: "Er hat uns von seiner Reise erzählt.", contrastAr: "von يطلب Dativ دائمًا، ولا يتغير مع الفعل الماضي." },
    { infinitive: "sich verabschieden", preposition: "von", governedCase: "dative", chunkDe: "sich von der Gruppe verabschieden", meaningAr: "يودّع المجموعة", exampleDe: "Am Ende habe ich mich von der Gruppe verabschiedet.", contrastAr: "sich verabschieden von يطلب Dativ؛ الضمير الانعكاسي يتغير وvon ثابتة." },
  ],
  "a2-03": [
    { infinitive: "sich erinnern", preposition: "an", governedCase: "accusative", chunkDe: "sich an einen Moment erinnern", meaningAr: "يتذكر لحظة ما", exampleDe: "Ich erinnere mich gern an diesen Moment.", contrastAr: "sich erinnern an يطلب Akkusativ، لا Dativ." },
    { infinitive: "sich freuen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf den Vortrag freuen", meaningAr: "يتطلع بفرح إلى العرض", exampleDe: "Ich habe mich auf den Vortrag gefreut.", contrastAr: "auf مع sich freuen تعني شيئًا قادمًا وتأخذ Akkusativ." },
  ],
  "a2-04": [
    { infinitive: "sich bedanken", preposition: "für", governedCase: "accusative", chunkDe: "sich für die Hilfe bedanken", meaningAr: "يشكر على المساعدة", exampleDe: "Ich möchte mich für die Hilfe bedanken.", contrastAr: "für تطلب Akkusativ بعد sich bedanken: für die Hilfe." },
    { infinitive: "bitten", preposition: "um", governedCase: "accusative", chunkDe: "um Hilfe bitten", meaningAr: "يطلب المساعدة", exampleDe: "Ich bitte Sie um Hilfe.", contrastAr: "bitten um تأخذ Akkusativ؛ لا تستخدم für بدل um." },
  ],
  "a2-05": [
    { infinitive: "sich beschweren", preposition: "über", governedCase: "accusative", chunkDe: "sich über den Lärm beschweren", meaningAr: "يشتكي من الضجيج", exampleDe: "Wir beschweren uns über den Lärm.", contrastAr: "الشكوى من شيء بعد über تأخذ Akkusativ." },
    { infinitive: "achten", preposition: "auf", governedCase: "accusative", chunkDe: "auf die Ruhezeiten achten", meaningAr: "يراعي فترات الهدوء", exampleDe: "Bitte achten Sie auf die Ruhezeiten.", contrastAr: "achten auf تأخذ Akkusativ لأن المعنى انتباه موجّه، لا مكان." },
  ],
  "a2-06": [
    { infinitive: "sich einigen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf einen Plan einigen", meaningAr: "يتفق على خطة", exampleDe: "Wir haben uns auf einen Plan geeinigt.", contrastAr: "النتيجة بعد auf تأتي في Akkusativ: auf einen Plan." },
    { infinitive: "sich gewöhnen", preposition: "an", governedCase: "accusative", chunkDe: "sich an die Regeln gewöhnen", meaningAr: "يتعود على القواعد", exampleDe: "Ich gewöhne mich langsam an die Regeln.", contrastAr: "التغيّر والاتجاه بعد an يطلب Akkusativ: an die Regeln." },
  ],
  "a2-07": [
    { infinitive: "zuständig sein", preposition: "für", governedCase: "accusative", chunkDe: "für Termine zuständig sein", meaningAr: "يكون مسؤولًا عن المواعيد", exampleDe: "Ich bin für Termine zuständig.", contrastAr: "المجال المسؤول عنه بعد für يأتي في Akkusativ." },
    { infinitive: "sich kümmern", preposition: "um", governedCase: "accusative", chunkDe: "sich um Bestellungen kümmern", meaningAr: "يهتم بالطلبيات", exampleDe: "Ich kümmere mich um die Bestellungen.", contrastAr: "sich kümmern um تطلب Akkusativ دائمًا." },
  ],
  "a2-08": [
    { infinitive: "sich bewerben", preposition: "um", governedCase: "accusative", chunkDe: "sich um eine Stelle bewerben", meaningAr: "يتقدم لوظيفة", exampleDe: "Ich bewerbe mich um die Stelle.", contrastAr: "الشيء المطلوب بعد um يأتي في Akkusativ." },
    { infinitive: "verfügen", preposition: "über", governedCase: "accusative", chunkDe: "über Erfahrung verfügen", meaningAr: "يمتلك خبرة", exampleDe: "Ich verfüge über Erfahrung im Kundenservice.", contrastAr: "verfügen über تأخذ Akkusativ في المعنى المجازي أيضًا." },
  ],
  "a2-09": [
    { infinitive: "verbinden", preposition: "mit", governedCase: "dative", chunkDe: "jemanden mit der Abteilung verbinden", meaningAr: "يحوّل شخصًا إلى القسم", exampleDe: "Können Sie mich mit der Abteilung verbinden?", contrastAr: "الطرف الآخر بعد mit يبقى في Dativ: mit der Abteilung." },
    { infinitive: "sich melden", preposition: "bei", governedCase: "dative", chunkDe: "sich bei der Firma melden", meaningAr: "يتواصل مع الشركة", exampleDe: "Ich melde mich später bei der Firma.", contrastAr: "bei تطلب Dativ دائمًا: bei der Firma، لا bei die Firma." },
  ],
  "a2-10": [
    { infinitive: "vergleichen", preposition: "mit", governedCase: "dative", chunkDe: "den Zug mit dem Bus vergleichen", meaningAr: "يقارن القطار بالحافلة", exampleDe: "Ich vergleiche den Zug mit dem Bus.", contrastAr: "الطرف الثاني في المقارنة بعد mit يكون Dativ." },
    { infinitive: "sich entscheiden", preposition: "für", governedCase: "accusative", chunkDe: "sich für den Zug entscheiden", meaningAr: "يختار القطار", exampleDe: "Ich entscheide mich für den Zug.", contrastAr: "الخيار المختار بعد für يأتي في Akkusativ." },
  ],
  "a2-11": [
    { infinitive: "buchen", preposition: "für", governedCase: "accusative", chunkDe: "ein Zimmer für drei Nächte buchen", meaningAr: "يحجز غرفة لثلاث ليالٍ", exampleDe: "Ich buche ein Zimmer für drei Nächte.", contrastAr: "المدة أو الغاية بعد für تأخذ Akkusativ." },
    { infinitive: "sich erkundigen", preposition: "nach", governedCase: "dative", chunkDe: "sich nach den Stornobedingungen erkundigen", meaningAr: "يستعلم عن شروط الإلغاء", exampleDe: "Ich erkundige mich nach den Stornobedingungen.", contrastAr: "nach تطلب Dativ: nach den Stornobedingungen." },
  ],
  "a2-12": [
    { infinitive: "bestehen", preposition: "auf", governedCase: "dative", chunkDe: "auf einer Erstattung bestehen", meaningAr: "يصرّ على استرداد المبلغ", exampleDe: "Ich bestehe auf einer Erstattung.", contrastAr: "استثناء مهم: bestehen auf تأخذ Dativ، مع أن auf قد تأخذ Akkusativ مع الاتجاه." },
    { infinitive: "sich entschuldigen", preposition: "für", governedCase: "accusative", chunkDe: "sich für die Verspätung entschuldigen", meaningAr: "يعتذر عن التأخير", exampleDe: "Wir entschuldigen uns für die Verspätung.", contrastAr: "السبب بعد für يبقى Akkusativ بعد الفعل الانعكاسي." },
  ],
  "a2-13": [
    { infinitive: "verzichten", preposition: "auf", governedCase: "accusative", chunkDe: "auf Zucker verzichten", meaningAr: "يمتنع عن السكر", exampleDe: "Ich verzichte auf Zucker im Kaffee.", contrastAr: "verzichten auf تطلب Akkusativ: auf Zucker." },
    { infinitive: "sorgen", preposition: "für", governedCase: "accusative", chunkDe: "für genug Schlaf sorgen", meaningAr: "يهتم بتوفير نوم كافٍ", exampleDe: "Ich sorge für genug Schlaf.", contrastAr: "sorgen für تأخذ Akkusativ؛ الشخص المعتنى به قد يظهر قبله." },
  ],
  "a2-14": [
    { infinitive: "sich krankmelden", preposition: "bei", governedCase: "dative", chunkDe: "sich bei der Firma krankmelden", meaningAr: "يبلغ الشركة بمرضه", exampleDe: "Ich melde mich heute bei der Firma krank.", contrastAr: "الجهة المُبلَغة بعد bei تأتي في Dativ." },
    { infinitive: "informieren", preposition: "über", governedCase: "accusative", chunkDe: "die Kollegen über den Termin informieren", meaningAr: "يبلغ الزملاء بالموعد", exampleDe: "Ich informiere die Kollegen über den Termin.", contrastAr: "الموضوع بعد über يبقى Akkusativ مع وجود مفعول شخص قبله." },
  ],
  "a2-15": [
    { infinitive: "einnehmen", preposition: "gegen", governedCase: "accusative", chunkDe: "ein Medikament gegen die Schmerzen einnehmen", meaningAr: "يتناول دواءً ضد الألم", exampleDe: "Ich nehme ein Medikament gegen die Schmerzen ein.", contrastAr: "gegen تطلب Akkusativ دائمًا، حتى مع الفعل المنفصل." },
    { infinitive: "warnen", preposition: "vor", governedCase: "dative", chunkDe: "vor Nebenwirkungen warnen", meaningAr: "يحذّر من آثار جانبية", exampleDe: "Die Packungsbeilage warnt vor Nebenwirkungen.", contrastAr: "warnen vor تأخذ Dativ: vor Nebenwirkungen. لا تدّعِ أن هذا تشخيص طبي." },
  ],
  "a2-16": [
    { infinitive: "berichten", preposition: "über", governedCase: "accusative", chunkDe: "über einen Unfall berichten", meaningAr: "يخبر عن حادث", exampleDe: "Die Zeitung berichtet über einen Unfall.", contrastAr: "موضوع التقرير بعد über يأتي في Akkusativ." },
    { infinitive: "unterscheiden", preposition: "zwischen", governedCase: "dative", chunkDe: "zwischen Tatsache und Meinung unterscheiden", meaningAr: "يميز بين الحقيقة والرأي", exampleDe: "Ich unterscheide zwischen Tatsache und Meinung.", contrastAr: "zwischen تأخذ Dativ: zwischen Tatsache und Meinung." },
  ],
  "a2-17": [
    { infinitive: "sich schützen", preposition: "vor", governedCase: "dative", chunkDe: "sich vor Betrug schützen", meaningAr: "يحمي نفسه من الاحتيال", exampleDe: "Ich schütze mich vor Betrug im Netz.", contrastAr: "الخطر بعد vor يبقى في Dativ: vor Betrug." },
    { infinitive: "teilen", preposition: "mit", governedCase: "dative", chunkDe: "ein Foto mit Freunden teilen", meaningAr: "يشارك صورة مع أصدقاء", exampleDe: "Ich teile das Foto mit Freunden.", contrastAr: "من تُشاركه بعد mit يأتي في Dativ." },
  ],
  "a2-18": [
    { infinitive: "halten", preposition: "von", governedCase: "dative", chunkDe: "viel von dem Vorschlag halten", meaningAr: "يرى رأيًا حسنًا في الاقتراح", exampleDe: "Ich halte viel von dem Vorschlag.", contrastAr: "halten von للسؤال عن الرأي تطلب Dativ: von dem Vorschlag." },
    { infinitive: "stimmen", preposition: "für", governedCase: "accusative", chunkDe: "für den Vorschlag stimmen", meaningAr: "يصوّت لصالح الاقتراح", exampleDe: "Ich stimme für den Vorschlag.", contrastAr: "التصويت لصالح شيء بعد für يأخذ Akkusativ." },
  ],
  "a2-19": [
    { infinitive: "sich konzentrieren", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf eine Aufgabe konzentrieren", meaningAr: "يركّز على مهمة واحدة", exampleDe: "Ich konzentriere mich auf eine Aufgabe.", contrastAr: "الهدف الذهني بعد auf يطلب Akkusativ: auf eine Aufgabe." },
    { infinitive: "profitieren", preposition: "von", governedCase: "dative", chunkDe: "von Pausen profitieren", meaningAr: "يستفيد من الاستراحات", exampleDe: "Ich profitiere von Pausen beim Lernen.", contrastAr: "von تطلب Dativ مع profitieren كما مع كل استخداماتها." },
  ],
  "a2-20": [
    { infinitive: "sich anmelden", preposition: "zu", governedCase: "dative", chunkDe: "sich zu einem Kurs anmelden", meaningAr: "يسجّل في دورة", exampleDe: "Ich melde mich zu einem Kurs an.", contrastAr: "الوجهة بعد zu تأتي في Dativ: zu einem Kurs. الفعل منفصل." },
    { infinitive: "teilnehmen", preposition: "an", governedCase: "dative", chunkDe: "an der Prüfung teilnehmen", meaningAr: "يشارك في الاختبار", exampleDe: "Ich nehme an der Prüfung teil.", contrastAr: "an مع teilnehmen تطلب Dativ، لأنها حدث لا اتجاه." },
  ],
  "a2-21": [
    { infinitive: "arbeiten", preposition: "an", governedCase: "dative", chunkDe: "an einem Ziel arbeiten", meaningAr: "يعمل على هدف", exampleDe: "Ich arbeite jeden Tag an meinem Ziel.", contrastAr: "an مع العمل على شيء تأخذ Dativ: an meinem Ziel." },
    { infinitive: "sich vorbereiten", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf die Prüfung vorbereiten", meaningAr: "يتهيأ للاختبار", exampleDe: "Ich bereite mich auf die Prüfung vor.", contrastAr: "الاستعداد لشيء قادم بعد auf يطلب Akkusativ." },
  ],
  "a2-22": [
    { infinitive: "einladen", preposition: "zu", governedCase: "dative", chunkDe: "Freunde zu einer Feier einladen", meaningAr: "يدعو أصدقاء إلى حفلة", exampleDe: "Ich lade meine Freunde zu einer Feier ein.", contrastAr: "المناسبة بعد zu تبقى في Dativ: zu einer Feier." },
    { infinitive: "danken", preposition: "für", governedCase: "accusative", chunkDe: "jemandem für das Geschenk danken", meaningAr: "يشكر شخصًا على الهدية", exampleDe: "Ich danke dir für das Geschenk.", contrastAr: "danken يعطي الشخص Dativ مباشرة، أما السبب فبعد für + Akkusativ." },
  ],
  "a2-23": [
    { infinitive: "sich engagieren", preposition: "für", governedCase: "accusative", chunkDe: "sich für ein Projekt engagieren", meaningAr: "يشارك بجهد في مشروع", exampleDe: "Ich engagiere mich für ein Projekt im Stadtteil.", contrastAr: "القضية بعد für تأتي في Akkusativ: für ein Projekt." },
    { infinitive: "sammeln", preposition: "für", governedCase: "accusative", chunkDe: "Spenden für das Projekt sammeln", meaningAr: "يجمع تبرعات للمشروع", exampleDe: "Wir sammeln Spenden für das Projekt.", contrastAr: "الغاية بعد für تطلب Akkusativ حتى مع جمع الأشياء." },
  ],
  "a2-24": [
    { infinitive: "abstimmen", preposition: "über", governedCase: "accusative", chunkDe: "über den Vorschlag abstimmen", meaningAr: "يصوّت على الاقتراح", exampleDe: "Wir stimmen über den Vorschlag ab.", contrastAr: "موضوع التصويت بعد über يأخذ Akkusativ: über den Vorschlag." },
    { infinitive: "sich entscheiden", preposition: "zwischen", governedCase: "dative", chunkDe: "sich zwischen zwei Optionen entscheiden", meaningAr: "يختار بين خيارين", exampleDe: "Wir entscheiden uns zwischen zwei Optionen.", contrastAr: "zwischen تأخذ Dativ في الاختيار المكاني/المجازي: zwischen zwei Optionen." },
  ],
};

export const a2NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => buildNounEntries(lessonId, seeds, sourceVersion, "A2"));
export const a2VerbPrepositionFrames = Object.entries(frameSeeds).flatMap(([lessonId, frames]) => buildVerbFrames(lessonId, frames, sourceVersion));

export const a2NounsByLesson = groupByLesson(a2NounGrammarEntries);
export const a2VerbFramesByLesson = groupByLesson(a2VerbPrepositionFrames);
