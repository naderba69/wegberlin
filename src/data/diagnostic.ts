import type { CEFRLevel, DiagnosticSkill, ErrorRecord } from "@/types/learning";

export type DiagnosticFormId = "A" | "B";
export type DiagnosticQuestion = {
  id: string;
  formId: DiagnosticFormId;
  level: CEFRLevel;
  skill: DiagnosticSkill;
  prompt: string;
  contextDe?: string;
  audioItemId?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  error?: Omit<ErrorRecord, "id" | "occurrences" | "lastSeenAt">;
};

type QuestionInput = Omit<DiagnosticQuestion, "id" | "formId" | "level" | "skill">;
const question = (formId: DiagnosticFormId, level: CEFRLevel, skill: DiagnosticSkill, input: QuestionInput): DiagnosticQuestion => ({
  id: `diag-${formId.toLowerCase()}-${level.toLowerCase()}-${skill}`,
  formId,
  level,
  skill,
  ...input,
});

const formA: DiagnosticQuestion[] = [
  question("A", "A1", "grammar", {
    prompt: "اختر الجملة الصحيحة للتعريف بالاسم:",
    options: ["Ich Name Ali.", "Ich heiße Ali.", "Ich bin heißen Ali.", "Ich heißt Ali."], correctIndex: 1,
    explanation: "heißen فعل مصرف: Ich heiße.",
    error: { type: "word-order", wrong: "Ich Name Ali.", correct: "Ich heiße Ali.", explanationAr: "الجملة الألمانية تحتاج فعلًا مصرفًا." },
  }),
  question("A", "A1", "vocabulary", {
    prompt: "ما الرد المناسب على Guten Morgen؟",
    options: ["Gute Nacht!", "Guten Morgen!", "Entschuldigung!", "Bitte schön!"], correctIndex: 1,
    explanation: "يمكن الرد بالتحية نفسها.",
  }),
  question("A", "A1", "reading", {
    prompt: "متى تعمل مينا؟",
    contextDe: "Mina arbeitet am Montag und am Mittwoch von acht bis zwölf Uhr. Am Freitag hat sie frei.",
    options: ["Nur am Freitag", "Montag und Mittwoch", "Jeden Abend", "Dienstag und Donnerstag"], correctIndex: 1,
    explanation: "النص يذكر Montag und Mittwoch.",
  }),
  question("A", "A1", "listening", {
    prompt: "استمع دون فتح النص: متى يفتح المتجر غدًا؟",
    audioItemId: "lib-l-a1-01",
    options: ["Um acht", "Um neun", "Um zehn", "Um zwölf"], correctIndex: 2,
    explanation: "المقطع يقول إن المتجر يفتح غدًا في العاشرة.",
  }),

  question("A", "A2", "grammar", {
    prompt: "Gestern ___ ich lange gearbeitet.",
    options: ["habe", "bin", "werde", "hat"], correctIndex: 0,
    explanation: "arbeiten يبني Perfekt مع haben.",
  }),
  question("A", "A2", "vocabulary", {
    prompt: "أي عبارة أنسب لتأجيل موعد؟",
    options: ["Ich möchte den Termin verschieben.", "Ich mache den Termin kaputt.", "Ich verliere den Termin.", "Ich stelle den Termin aus."], correctIndex: 0,
    explanation: "einen Termin verschieben عبارة صحيحة وشائعة.",
  }),
  question("A", "A2", "reading", {
    prompt: "ما الذي يجب على المشاركين إحضاره؟",
    contextDe: "Der Kurs beginnt am Donnerstag um achtzehn Uhr in Raum sieben. Bitte bringen Sie das Arbeitsbuch mit. Stifte liegen im Raum bereit.",
    options: ["Das Arbeitsbuch", "Einen Stuhl", "Einen Computer", "Getränke für alle"], correctIndex: 0,
    explanation: "التعليمات تطلب Arbeitsbuch، بينما الأقلام موجودة.",
  }),
  question("A", "A2", "listening", {
    prompt: "استمع دون نص: أي موعد أُلغي؟",
    audioItemId: "lib-l-a2-01",
    options: ["Dienstag 15 Uhr", "Mittwoch 10 Uhr", "Donnerstag 16 Uhr", "Freitag 12 Uhr"], correctIndex: 0,
    explanation: "موعد الثلاثاء في الثالثة هو الذي سيُغيّر.",
  }),

  question("A", "B1", "grammar", {
    prompt: "Das ist der Kollege, ___ mir geholfen hat.",
    options: ["den", "dem", "der", "dessen"], correctIndex: 2,
    explanation: "الضمير يعود إلى مذكر وهو فاعل: der.",
    error: { type: "case", wrong: "der Kollege, den geholfen hat", correct: "der Kollege, der geholfen hat", explanationAr: "الضمير الموصول هنا فاعل، لذلك Nominativ." },
  }),
  question("A", "B1", "vocabulary", {
    prompt: "اختر التعبير الأكثر طبيعية:",
    options: ["eine Entscheidung machen", "eine Entscheidung treffen", "eine Entscheidung tun", "eine Entscheidung bauen"], correctIndex: 1,
    explanation: "eine Entscheidung treffen تركيب ثابت.",
  }),
  question("A", "B1", "reading", {
    prompt: "متى ستقترح المجموعة خطة بديلة؟",
    contextDe: "Die Gruppe wartet bis Donnerstag auf die Bestätigung des Raums. Falls bis dahin keine Antwort kommt, reserviert sie einen kleineren Raum im Nachbarzentrum.",
    options: ["Sofort", "Nur nach einer Absage am Montag", "Wenn bis Donnerstag keine Antwort kommt", "Nach dem Kurs"], correctIndex: 2,
    explanation: "الخطة البديلة مشروطة بعدم وصول رد حتى الخميس.",
  }),
  question("A", "B1", "listening", {
    prompt: "استمع دون نص: ما المشكلة التي يذكرها بن؟",
    audioItemId: "lib-l-b1-01",
    options: ["Keine Fahrradkenntnisse", "Kein sicherer Abstellplatz", "Zu viele Busse", "Kurzer Arbeitsweg"], correctIndex: 1,
    explanation: "المشكلة هي غياب مكان آمن لوضع الدراجة.",
  }),

  question("A", "B2", "grammar", {
    prompt: "اختر الصياغة الأنسب رسميًا:",
    options: ["Trotzdem die Frist kurz ist, schaffen wir es.", "Obwohl die Frist kurz ist, schaffen wir es.", "Obwohl ist die Frist kurz, schaffen wir es.", "Trotz die Frist kurz ist, schaffen wir es."], correctIndex: 1,
    explanation: "obwohl تدخل جملة ثانوية بفعل نهائي.",
  }),
  question("A", "B2", "vocabulary", {
    prompt: "أي رابط يقدم تنازلًا مع الحفاظ على حجة مقابلة؟",
    options: ["einerseits", "allerdings", "infolgedessen", "beispielsweise"], correctIndex: 1,
    explanation: "allerdings يقيّد أو يقابل الفكرة السابقة.",
  }),
  question("A", "B2", "reading", {
    prompt: "لماذا لا تكفي النتيجة لإثبات السببية؟",
    contextDe: "Die freiwilligen Teilnehmenden der App-Gruppe erzielten bessere Werte. Sie übten jedoch auch häufiger außerhalb des Kurses. Der Bericht spricht deshalb von einem Zusammenhang, nicht von einem gesicherten Effekt der App.",
    options: ["Weil es keine Werte gab", "Weil Selbstwahl und zusätzliche Übung die Werte beeinflussen können", "Weil alle zufällig zugeteilt wurden", "Weil die App nie benutzt wurde"], correctIndex: 1,
    explanation: "الاختيار الذاتي ووقت التدريب الإضافي متغيران بديلان.",
  }),
  question("A", "B2", "listening", {
    prompt: "استمع دون نص: لماذا لم تُثبت السببية؟",
    audioItemId: "lib-l-b2-01",
    options: ["Es gab keine Ergebnisse", "Die Teilnehmenden wählten selbst", "Alle nutzten die App", "Die Studie dauerte zehn Jahre"], correctIndex: 1,
    explanation: "اختيار المشاركين بأنفسهم يمنع نسبة الفرق إلى التطبيق وحده.",
  }),
];

const formB: DiagnosticQuestion[] = [
  question("B", "A1", "grammar", {
    prompt: "___ kommst du? — Aus Tunesien.",
    options: ["Wie", "Wo", "Woher", "Was"], correctIndex: 2,
    explanation: "Woher تسأل عن الأصل أو جهة القدوم.",
  }),
  question("B", "A1", "vocabulary", {
    prompt: "أي سؤال مناسب لمعرفة السعر؟",
    options: ["Wie spät ist das?", "Wie viel kostet das?", "Woher kostet das?", "Wer heißt das?"], correctIndex: 1,
    explanation: "Wie viel kostet das? هو سؤال السعر.",
  }),
  question("B", "A1", "reading", {
    prompt: "أي يوم يكون المكتب مغلقًا؟",
    contextDe: "Das Büro ist Montag bis Donnerstag geöffnet. Am Freitag bleibt es geschlossen. Samstag und Sonntag arbeitet das Team nicht.",
    options: ["Montag", "Mittwoch", "Donnerstag", "Freitag"], correctIndex: 3,
    explanation: "يذكر النص أن المكتب مغلق الجمعة.",
  }),
  question("B", "A1", "listening", {
    prompt: "استمع دون نص: ما لون الباب؟",
    audioItemId: "lib-l-a1-02",
    options: ["Blau", "Rot", "Grün", "Schwarz"], correctIndex: 1,
    explanation: "الباب المذكور أحمر.",
  }),

  question("B", "A2", "grammar", {
    prompt: "Ich bleibe zu Hause, ___ ich krank bin.",
    options: ["denn", "weil", "aber", "oder"], correctIndex: 1,
    explanation: "weil ترسل الفعل المصرف إلى نهاية الجملة الثانوية.",
    error: { type: "word-order", wrong: "weil ich bin krank", correct: "weil ich krank bin", explanationAr: "بعد weil يأتي الفعل المصرف في نهاية الجملة الثانوية." },
  }),
  question("B", "A2", "vocabulary", {
    prompt: "أي عبارة طبيعية لطلب إبلاغك بالقرار؟",
    options: ["Geben Sie mir bitte Bescheid.", "Machen Sie mir bitte Nachricht.", "Sagen Sie mich bitte.", "Bringen Sie mir eine Entscheidung."], correctIndex: 0,
    explanation: "jemandem Bescheid geben يعني إبلاغ شخص.",
  }),
  question("B", "A2", "reading", {
    prompt: "ما الحل المؤقت قبل وصول الفني؟",
    contextDe: "Die Heizung wird morgen repariert. Bis dahin stellt die Vermieterin einen kleinen Heizlüfter bereit. Die Kosten übernimmt die Hausverwaltung.",
    options: ["Ein neues Fenster", "Ein Heizlüfter", "Ein Hotelzimmer", "Keine Heizung und keine Hilfe"], correctIndex: 1,
    explanation: "سيُوفّر Heizlüfter إلى حين الإصلاح.",
  }),
  question("B", "A2", "listening", {
    prompt: "استمع دون نص: ما العطل في الغرفة؟",
    audioItemId: "lib-l-a2-02",
    options: ["Der Aufzug", "Die Heizung", "Das Licht", "Die Tür"], correctIndex: 1,
    explanation: "التدفئة لا تعمل.",
  }),

  question("B", "B1", "grammar", {
    prompt: "Wenn ich mehr Zeit hätte, ___ ich öfter Deutsch lernen.",
    options: ["werde", "würde", "wurde", "will"], correctIndex: 1,
    explanation: "Konjunktiv II: würde + Infinitiv.",
  }),
  question("B", "B1", "vocabulary", {
    prompt: "أي تركيب يعني أن خيارًا يستحق الدراسة؟",
    options: ["etwas in Betracht ziehen", "etwas unter Tisch ziehen", "etwas in Antwort laufen", "etwas auf Entscheidung bauen"], correctIndex: 0,
    explanation: "etwas in Betracht ziehen يعني أخذ الخيار في الحسبان.",
  }),
  question("B", "B1", "reading", {
    prompt: "ما الخطر الذي لم يُحسم بعد؟",
    contextDe: "Die technischen Daten sind bereits geprüft, und die Kostenberechnung kommt am Mittwoch. Unklar bleibt der Liefertermin. Ohne Bestätigung muss das Team zwei Varianten anbieten.",
    options: ["Die technischen Daten", "Die Identität des Kunden", "Der Liefertermin", "Die Zahl der Mitarbeitenden"], correctIndex: 2,
    explanation: "موعد التسليم هو النقطة غير المؤكدة.",
  }),
  question("B", "B1", "listening", {
    prompt: "استمع دون نص: ما الذي لا يزال ناقصًا؟",
    audioItemId: "lib-l-b1-02",
    options: ["Technische Daten", "Kosten", "Kundenname", "Entwurf der Leitung"], correctIndex: 1,
    explanation: "البيانات التقنية فُحصت، بينما التكلفة لم تصل بعد.",
  }),

  question("B", "B2", "grammar", {
    prompt: "Die Maßnahme wurde eingeführt, ___ die Kosten zu senken.",
    options: ["damit", "um", "ohne", "anstatt"], correctIndex: 1,
    explanation: "um … zu عند تطابق الفاعل للتعبير عن الهدف.",
  }),
  question("B", "B2", "vocabulary", {
    prompt: "أي رابط يقابل اتجاهين مباشرةً؟",
    options: ["hingegen", "folglich", "zum Beispiel", "darüber hinaus"], correctIndex: 0,
    explanation: "hingegen يبرز المقابلة بين حالتين أو اتجاهين.",
  }),
  question("B", "B2", "reading", {
    prompt: "ما معيار التقييم العادل الذي يطلبه النص؟",
    contextDe: "Der Durchschnitt der Wartezeit sank. In zwei Außenvierteln stieg sie jedoch. Eine faire Bewertung muss deshalb nicht nur den Gesamtwert, sondern auch Zugang, Ort und betroffene Gruppen ausweisen.",
    options: ["Nur den besten Stadtteil", "Nur den Gesamtwert", "Gesamtwert und verteilte Auswirkungen", "Keine Daten nach Ort"], correctIndex: 2,
    explanation: "المتوسط وحده قد يخفي توزيع الضرر بين المناطق والفئات.",
  }),
  question("B", "B2", "listening", {
    prompt: "استمع دون نص: ما البدائل التي تبقى للحجز الرقمي؟",
    audioItemId: "lib-l-b2-02",
    options: ["Nur E-Mail", "Telefon und spontane Plätze", "Post und Fax allein", "Keine"], correctIndex: 1,
    explanation: "تبقى المواعيد الهاتفية ومقعدان تلقائيان كل ساعة.",
  }),
];

export const diagnosticForms: Record<DiagnosticFormId, DiagnosticQuestion[]> = { A: formA, B: formB };
export const allDiagnosticQuestions = [...formA, ...formB];
export const diagnosticLevels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
export const diagnosticSkills: DiagnosticSkill[] = ["grammar", "vocabulary", "reading", "listening"];
