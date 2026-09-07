import { buildNounEntries, buildVerbFrames, groupByLesson } from "./lexical-grammar-build";
import type { FrameSeed, NounSeed } from "./lexical-grammar-build";
import type { LexicalSourceVersion } from "@/types/lexical-grammar";

const sourceVersion: LexicalSourceVersion = "b2-lexical-grammar-v1";

/**
 * دفعة B2 البنيوية (`b2-lexical-grammar-v1`).
 * كل درس B2 منشور يملك أربع مراسي اسمية وإطارين؛ الإطارات هنا تحمل تراكيب رسمية من مستوى B2،
 * بما في ذلك حروف الجر التي تطلب Genitiv مثل angesichts وhinsichtlich في b2-04.
 * سجل الاسم ما زال يحفظ Nominativ/Akkusativ/Dativ فقط؛ صيغة Genitiv الاسمية ليست مؤلفة بعد.
 */
const nounSeeds: Record<string, readonly NounSeed[]> = {
  "b2-01": [["Standpunkt", "masculine", "Standpunkte", "وجهة النظر"], ["These", "feminine", "Thesen", "الأطروحة"], ["Argument", "neuter", "Argumente", "الحجة"], ["Einwand", "masculine", "Einwände", "الاعتراض"]],
  "b2-02": [["Debatte", "feminine", "Debatten", "المناظرة"], ["Kernpunkt", "masculine", "Kernpunkte", "النقطة الجوهرية"], ["Schlussfolgerung", "feminine", "Schlussfolgerungen", "الاستنتاج"], ["Position", "feminine", "Positionen", "الموقف"]],
  "b2-03": [["Arbeitsmodell", "neuter", "Arbeitsmodelle", "نموذج العمل"], ["Erreichbarkeit", "feminine", null, "إمكانية التواصل"], ["Kernarbeitszeit", "feminine", "Kernarbeitszeiten", "وقت العمل الأساسي"], ["Ausstattung", "feminine", "Ausstattungen", "التجهيز"]],
  "b2-04": [["Leistungsumfang", "masculine", null, "نطاق الخدمة"], ["Kapazitätsgrenze", "feminine", "Kapazitätsgrenzen", "حد الطاقة الاستيعابية"], ["Zusage", "feminine", "Zusagen", "التعهد"], ["Eskalation", "feminine", "Eskalationen", "التصعيد"]],
  "b2-05": [["Anteil", "masculine", "Anteile", "الحصة"], ["Verteilung", "feminine", "Verteilungen", "التوزيع"], ["Durchschnitt", "masculine", "Durchschnitte", "المتوسط"], ["Zuwachs", "masculine", "Zuwächse", "الزيادة"]],
  "b2-06": [["Fachbegriff", "masculine", "Fachbegriffe", "المصطلح المتخصص"], ["Definition", "feminine", "Definitionen", "التعريف"], ["Messung", "feminine", "Messungen", "القياس"], ["Verfahren", "neuter", "Verfahren", "الإجراء / الطريقة"]],
  "b2-07": [["Teilhabe", "feminine", null, "المشاركة"], ["Barriere", "feminine", "Barrieren", "العائق"], ["Anhörung", "feminine", "Anhörungen", "جلسة استماع"], ["Stimmrecht", "neuter", "Stimmrechte", "حق التصويت"]],
  "b2-08": [["Primärquelle", "feminine", "Primärquellen", "المصدر الأولي"], ["Pressemitteilung", "feminine", "Pressemitteilungen", "البيان الصحفي"], ["Belegkette", "feminine", "Belegketten", "سلسلة الأدلة"], ["Reichweite", "feminine", null, "مدى الانتشار"]],
  "b2-09": [["Lesart", "feminine", "Lesarten", "التأويل"], ["Zuschreibung", "feminine", "Zuschreibungen", "الإسناد"], ["Kontext", "masculine", "Kontexte", "السياق"], ["Verallgemeinerung", "feminine", "Verallgemeinerungen", "التعميم"]],
  "b2-10": [["Handlungsabsicht", "feminine", "Handlungsabsichten", "قصد الإجراء"], ["Nachfrist", "feminine", "Nachfristen", "مهلة إضافية"], ["Einzelfallprüfung", "feminine", "Einzelfallprüfungen", "فحص كل حالة على حدة"], ["Ausschreibung", "feminine", "Ausschreibungen", "الإعلان الرسمي"]],
  "b2-11": [["Arbeitsauftrag", "masculine", "Arbeitsaufträge", "تكليف العمل"], ["Gewichtung", "feminine", "Gewichtungen", "التوزين"], ["Verweiskette", "feminine", "Verweisketten", "سلسلة الإحالات"], ["Umfang", "masculine", null, "الحجم / المدى"]],
  "b2-12": [["Generalprobe", "feminine", "Generalproben", "البروفة العامة"], ["Evidenzspur", "feminine", "Evidenzspuren", "مسار الأدلة"], ["Lücke", "feminine", "Lücken", "الفجوة"], ["Bedingung", "feminine", "Bedingungen", "الشرط"]],
};

const frameSeeds: Record<string, readonly FrameSeed[]> = {
  "b2-01": [
    { infinitive: "hinausgehen", preposition: "über", governedCase: "accusative", chunkDe: "über die Daten hinausgehen", meaningAr: "يتجاوز ما تقوله البيانات", exampleDe: "Diese Schlussfolgerung geht über die Daten hinaus.", contrastAr: "التجاوز المجازي بعد über يأخذ Akkusativ أيضًا." },
    { infinitive: "ausgehen", preposition: "von", governedCase: "dative", chunkDe: "von einer Annahme ausgehen", meaningAr: "ينطلق من افتراض", exampleDe: "Ich gehe von einer überprüfbaren Annahme aus.", contrastAr: "ausgehen von تطلب Dativ: von einer Annahme. الفعل منفصل." },
  ],
  "b2-02": [
    { infinitive: "sich abgrenzen", preposition: "von", governedCase: "dative", chunkDe: "sich von einer Position abgrenzen", meaningAr: "يميز موقفه عن موقف آخر", exampleDe: "Ich grenze mich von dieser Position ab, ohne sie zu verkürzen.", contrastAr: "sich abgrenzen von تطلب Dativ: von dieser Position." },
    { infinitive: "einwenden", preposition: "gegen", governedCase: "accusative", chunkDe: "etwas gegen einen Vorschlag einwenden", meaningAr: "يعترض على اقتراح", exampleDe: "Was wenden Sie gegen den Vorschlag ein?", contrastAr: "einwenden gegen تطلب Akkusativ: gegen den Vorschlag." },
  ],
  "b2-03": [
    { infinitive: "sich auswirken", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf die Betreuung auswirken", meaningAr: "يؤثر على الرعاية", exampleDe: "Das Modell wirkt sich unterschiedlich auf die Betreuung aus.", contrastAr: "المتأثر بعد auf يأخذ Akkusativ: auf die Betreuung." },
    { infinitive: "einhergehen", preposition: "mit", governedCase: "dative", chunkDe: "mit mehr Flexibilität einhergehen", meaningAr: "يصاحبه مرونة أكبر", exampleDe: "Ortsunabhängiges Arbeiten geht mit mehr Flexibilität einher.", contrastAr: "einhergehen mit تطلب Dativ؛ والفعل منفصل." },
  ],
  "b2-04": [
    { infinitive: "entscheiden", preposition: "angesichts", governedCase: "genitive", chunkDe: "angesichts der Frist entscheiden", meaningAr: "يقرّر بالنظر إلى المهلة", exampleDe: "Wir haben uns angesichts der Frist für den Kernumfang entschieden.", contrastAr: "angesichts حرف جر رسمي يطلب Genitiv: angesichts der Frist، وليست حالة مكانية." },
    { infinitive: "priorisieren", preposition: "hinsichtlich", governedCase: "genitive", chunkDe: "hinsichtlich des Umfangs priorisieren", meaningAr: "يرتّب الأولويات من حيث الحجم", exampleDe: "Wir haben die Aufgaben hinsichtlich des Umfangs priorisiert.", contrastAr: "hinsichtlich تطلب Genitiv: hinsichtlich des Umfangs. تسجيل الأثر الرسمي لا يعني استشارة قانونية." },
  ],
  "b2-05": [
    { infinitive: "schließen", preposition: "aus", governedCase: "dative", chunkDe: "aus den Daten schließen", meaningAr: "يستنتج من البيانات", exampleDe: "Aus diesen Daten schließe ich nur einen Trend, keine Ursache.", contrastAr: "aus تطلب Dativ: aus diesen Daten." },
    { infinitive: "verwechseln", preposition: "mit", governedCase: "dative", chunkDe: "Korrelation mit Kausalität verwechseln", meaningAr: "يخلط بين الارتباط والسببية", exampleDe: "Wir verwechseln Korrelation leicht mit Kausalität.", contrastAr: "الطرف الثاني بعد mit يبقى Dativ: mit Kausalität." },
  ],
  "b2-06": [
    { infinitive: "verstehen", preposition: "unter", governedCase: "dative", chunkDe: "unter einem Begriff verstehen", meaningAr: "يفهم من مصطلح كذا", exampleDe: "Unter diesem Begriff versteht man ein einfaches Messverfahren.", contrastAr: "unter في التعريفات تأخذ Dativ: unter diesem Begriff." },
    { infinitive: "erklären", preposition: "trotz", governedCase: "genitive", chunkDe: "trotz der Fachbegriffe erklären", meaningAr: "يشرح رغم كثرة المصطلحات", exampleDe: "Der Text erklärt das Verfahren trotz der vielen Fachbegriffe verständlich.", contrastAr: "trotz تطلب Genitiv: trotz der vielen Fachbegriffe. التبسيط لا يعني حذف المعنى أو اختلاق يقين." },
  ],
  "b2-07": [
    { infinitive: "einwirken", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Entscheidung einwirken", meaningAr: "يؤثر على قرار", exampleDe: "Die Gruppe will auf die Entscheidung einwirken, nicht nur mitreden.", contrastAr: "الهدف بعد auf يأخذ Akkusativ: auf die Entscheidung." },
    { infinitive: "hindern", preposition: "an", governedCase: "dative", chunkDe: "jemanden an der Teilnahme hindern", meaningAr: "يمنع شخصًا من المشاركة", exampleDe: "Fehlende Übersetzungen hindern viele an der Teilnahme.", contrastAr: "hindern an تطلب Dativ: an der Teilnahme." },
  ],
  "b2-08": [
    { infinitive: "absehen", preposition: "von", governedCase: "dative", chunkDe: "von einer Bewertung absehen", meaningAr: "يمتنع عن إصدار حكم", exampleDe: "Ich sehe von einer Bewertung ab, bis die Quelle klar ist.", contrastAr: "absehen von تطلب Dativ؛ والفعل منفصل." },
    { infinitive: "zurückgehen", preposition: "auf", governedCase: "accusative", chunkDe: "auf eine Pressemitteilung zurückgehen", meaningAr: "يرجع إلى بيان صحفي", exampleDe: "Die Meldung geht auf eine Pressemitteilung zurück.", contrastAr: "الأصل بعد auf يأخذ Akkusativ: auf eine Pressemitteilung." },
  ],
  "b2-09": [
    { infinitive: "urteilen", preposition: "über", governedCase: "accusative", chunkDe: "über eine Situation urteilen", meaningAr: "يحكم على موقف", exampleDe: "Ich urteile nicht zu schnell über die Situation.", contrastAr: "موضوع الحكم بعد über يأخذ Akkusativ." },
    { infinitive: "zurückführen", preposition: "auf", governedCase: "accusative", chunkDe: "ein Verhalten auf den Kontext zurückführen", meaningAr: "يردّ سلوكًا إلى السياق", exampleDe: "Man sollte das Verhalten zuerst auf den Kontext zurückführen.", contrastAr: "المرجَع بعد auf يبقى Akkusativ؛ والفعل منفصل." },
  ],
  "b2-10": [
    { infinitive: "sich richten", preposition: "nach", governedCase: "dative", chunkDe: "sich nach der Zielgruppe richten", meaningAr: "يتكيّف مع الجمهور المستهدف", exampleDe: "Die Auswahl richtet sich nach der Zielgruppe.", contrastAr: "sich richten nach تطلب Dativ: nach der Zielgruppe." },
    { infinitive: "sich aussprechen", preposition: "für", governedCase: "accusative", chunkDe: "sich für eine sinngemäße Wiedergabe aussprechen", meaningAr: "يؤيد نقل المعنى لا الحرف", exampleDe: "Ich spreche mich für eine sinngemäße Wiedergabe aus.", contrastAr: "الخيار بعد für يأخذ Akkusativ؛ والفعل منفصل." },
  ],
  "b2-11": [
    { infinitive: "sich beziehen", preposition: "auf", governedCase: "accusative", chunkDe: "sich auf einen Aspekt beziehen", meaningAr: "يرجع إلى جانب محدد", exampleDe: "Ich beziehe mich auf einen Aspekt des Arbeitsauftrags.", contrastAr: "sich beziehen auf تطلب Akkusativ: auf einen Aspekt." },
    { infinitive: "sich auseinandersetzen", preposition: "mit", governedCase: "dative", chunkDe: "sich mit einem Einwand auseinandersetzen", meaningAr: "يتعامل مع اعتراض بالتحليل", exampleDe: "Ich setze mich mit dem Einwand im zweiten Absatz auseinander.", contrastAr: "sich auseinandersetzen mit تطلب Dativ: mit dem Einwand." },
  ],
  "b2-12": [
    { infinitive: "priorisieren", preposition: "nach", governedCase: "dative", chunkDe: "nach Wirkung priorisieren", meaningAr: "يرتّب الأولويات حسب الأثر", exampleDe: "Ich priorisiere die Aufgaben nach ihrer Wirkung.", contrastAr: "المعيار بعد nach يبقى Dativ: nach ihrer Wirkung." },
    { infinitive: "ableiten", preposition: "aus", governedCase: "dative", chunkDe: "eine Bedingung aus dem Text ableiten", meaningAr: "يستخلص شرطًا من النص", exampleDe: "Ich leite die Bedingung direkt aus dem Text ab.", contrastAr: "المصدر بعد aus يأخذ Dativ؛ والفعل منفصل." },
  ],
};

export const b2NounGrammarEntries = Object.entries(nounSeeds).flatMap(([lessonId, seeds]) => buildNounEntries(lessonId, seeds, sourceVersion, "B2"));
export const b2VerbPrepositionFrames = Object.entries(frameSeeds).flatMap(([lessonId, frames]) => buildVerbFrames(lessonId, frames, sourceVersion));

export const b2NounsByLesson = groupByLesson(b2NounGrammarEntries);
export const b2VerbFramesByLesson = groupByLesson(b2VerbPrepositionFrames);
