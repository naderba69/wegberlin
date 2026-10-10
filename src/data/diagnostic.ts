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
  /** شرح عربي؛ يُضاف بعد اعتماد المسودات (قرار مراجعة). */
  explanationAr?: string;
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
    explanation: "heißen فعل مصرف: Ich heiße.", explanationAr: "الجملة الصحيحة هي «Ich heiße Ali.». مع ich نقول heiße، و«Ich Name Ali.» ناقصة لأنها بلا فعل، و«Ich heißt Ali.» فيها فعل بصيغة غير صحيحة لـ ich.",
    error: { type: "word-order", wrong: "Ich Name Ali.", correct: "Ich heiße Ali.", explanationAr: "الجملة الألمانية تحتاج فعلًا مصرفًا." },
  }),
  question("A", "A1", "vocabulary", {
    prompt: "ما الرد المناسب على Guten Morgen؟",
    options: ["Gute Nacht!", "Guten Morgen!", "Entschuldigung!", "Bitte schön!"], correctIndex: 1,
    explanation: "يمكن الرد بالتحية نفسها.", explanationAr: "الرد الصحيح هو «Guten Morgen!»، لأن التحية الصباحية تُرَدّ بالتحية نفسها. «Gute Nacht!» تُقال قبل النوم، ولا تصلح ردًا على التحية الصباحية.",
  }),
  question("A", "A1", "reading", {
    prompt: "متى تعمل مينا؟",
    contextDe: "Mina arbeitet am Montag und am Mittwoch von acht bis zwölf Uhr. Am Freitag hat sie frei.",
    options: ["Nur am Freitag", "Montag und Mittwoch", "Jeden Abend", "Dienstag und Donnerstag"], correctIndex: 1,
    explanation: "النص يذكر Montag und Mittwoch.", explanationAr: "النص يقول: «Mina arbeitet am Montag und am Mittwoch» أي أنها تعمل يوم الاثنين والأربعاء. و«Am Freitag hat sie frei» أي أنها في عطلة يوم الجمعة.",
  }),
  question("A", "A1", "listening", {
    prompt: "استمع دون فتح النص: متى يفتح المتجر غدًا؟",
    audioItemId: "lib-l-a1-01",
    options: ["Um acht", "Um neun", "Um zehn", "Um zwölf"], correctIndex: 2,
    explanation: "المقطع يقول إن المتجر يفتح غدًا في العاشرة.", explanationAr: "المقطع يقول: «Morgen öffnen wir erst um zehn Uhr»، أي أن المتجر يفتح غدًا في الساعة العاشرة.",
  }),

  question("A", "A2", "grammar", {
    prompt: "Gestern ___ ich lange gearbeitet.",
    options: ["habe", "bin", "werde", "hat"], correctIndex: 0,
    explanation: "arbeiten يبني Perfekt مع haben.", explanationAr: "الفعل arbeiten يكوّن الماضي المركّب مع haben، لذلك نقول habe مع ich. bin تُستعمل مع أفعال الحركة أو التغيير، و werde للمستقبل، و hat لـ er أو sie.",
  }),
  question("A", "A2", "vocabulary", {
    prompt: "أي عبارة أنسب لتأجيل موعد؟",
    options: ["Ich möchte den Termin verschieben.", "Ich mache den Termin kaputt.", "Ich verliere den Termin.", "Ich stelle den Termin aus."], correctIndex: 0,
    explanation: "einen Termin verschieben عبارة صحيحة وشائعة.", explanationAr: "الجواب هو «Ich möchte den Termin verschieben.» ومعناها أريد تأجيل الموعد. الخيارات الأخرى تعني كسر الموعد أو فقدانه أو إلغاءه، وهذا ليس تأجيلًا.",
  }),
  question("A", "A2", "reading", {
    prompt: "ما الذي يجب على المشاركين إحضاره؟",
    contextDe: "Der Kurs beginnt am Donnerstag um achtzehn Uhr in Raum sieben. Bitte bringen Sie das Arbeitsbuch mit. Stifte liegen im Raum bereit.",
    options: ["Das Arbeitsbuch", "Einen Stuhl", "Einen Computer", "Getränke für alle"], correctIndex: 0,
    explanation: "التعليمات تطلب Arbeitsbuch، بينما الأقلام موجودة.", explanationAr: "النص يقول: «Bitte bringen Sie das Arbeitsbuch mit.» أي يجب إحضار كتاب العمل. أما «Stifte liegen im Raum bereit» فتعني أن الأقلام موجودة في القاعة، فلا يحتاج المشارك إلى إحضارها.",
  }),
  question("A", "A2", "listening", {
    prompt: "استمع دون نص: أي موعد أُلغي؟",
    audioItemId: "lib-l-a2-01",
    options: ["Dienstag 15 Uhr", "Mittwoch 10 Uhr", "Donnerstag 16 Uhr", "Freitag 12 Uhr"], correctIndex: 0,
    explanation: "موعد الثلاثاء في الثالثة هو الذي سيُغيّر.", explanationAr: "الموعد الملغى هو «Ihr Beratungstermin am Dienstag um fünfzehn Uhr»، أي موعد الثلاثاء الساعة الثالثة بعد الظهر. المقطع يقترح موعدًا بديلًا يوم الأربعاء أو الخميس.",
  }),

  question("A", "B1", "grammar", {
    prompt: "Das ist der Kollege, ___ mir geholfen hat.",
    options: ["den", "dem", "der", "dessen"], correctIndex: 2,
    explanation: "الضمير يعود إلى مذكر وهو فاعل: der.", explanationAr: "الضمير يعود إلى «der Kollege»، وهو مذكر، وهو فاعل في الجملة الثانوية، لذلك نستعمل der. den مفعول به، و dem مفعول غير مباشر، و dessen تفيد الملكية.",
    error: { type: "case", wrong: "der Kollege, den geholfen hat", correct: "der Kollege, der geholfen hat", explanationAr: "الضمير الموصول هنا فاعل، لذلك Nominativ." },
  }),
  question("A", "B1", "vocabulary", {
    prompt: "اختر التعبير الأكثر طبيعية:",
    options: ["eine Entscheidung machen", "eine Entscheidung treffen", "eine Entscheidung tun", "eine Entscheidung bauen"], correctIndex: 1,
    explanation: "eine Entscheidung treffen تركيب ثابت.", explanationAr: "التعبير الثابت في الألمانية هو «eine Entscheidung treffen» ومعناه اتخاذ قرار. machen وtun وbauen لا تكوّن هذا التعبير.",
  }),
  question("A", "B1", "reading", {
    prompt: "متى ستقترح المجموعة خطة بديلة؟",
    contextDe: "Die Gruppe wartet bis Donnerstag auf die Bestätigung des Raums. Falls bis dahin keine Antwort kommt, reserviert sie einen kleineren Raum im Nachbarzentrum.",
    options: ["Sofort", "Nur nach einer Absage am Montag", "Wenn bis Donnerstag keine Antwort kommt", "Nach dem Kurs"], correctIndex: 2,
    explanation: "الخطة البديلة مشروطة بعدم وصول رد حتى الخميس.", explanationAr: "النص يقول: «Falls bis dahin keine Antwort kommt» أي إذا لم يصل رد حتى ذلك الوقت، فإن المجموعة تحجز قاعة أصغر. الخطة البديلة مرتبطة بشرط عدم وصول الرد حتى الخميس.",
  }),
  question("A", "B1", "listening", {
    prompt: "استمع دون نص: ما المشكلة التي يذكرها بن؟",
    audioItemId: "lib-l-b1-01",
    options: ["Keine Fahrradkenntnisse", "Kein sicherer Abstellplatz", "Zu viele Busse", "Kurzer Arbeitsweg"], correctIndex: 1,
    explanation: "المشكلة هي غياب مكان آمن لوضع الدراجة.", explanationAr: "بن يقول: «Problematisch ist der fehlende sichere Abstellplatz»، أي أن المشكلة هي غياب مكان آمن لركن الدراجة، وليس الوقت أو الطريق.",
  }),

  question("A", "B2", "grammar", {
    prompt: "اختر الصياغة الأنسب رسميًا:",
    options: ["Trotzdem die Frist kurz ist, schaffen wir es.", "Obwohl die Frist kurz ist, schaffen wir es.", "Obwohl ist die Frist kurz, schaffen wir es.", "Trotz die Frist kurz ist, schaffen wir es."], correctIndex: 1,
    explanation: "obwohl تدخل جملة ثانوية بفعل نهائي.", explanationAr: "الجملة الصحيحة تستعمل «Obwohl» ثم تضع الفعل في نهاية الجملة الثانوية. «Trotzdem» ظرف لا يربط جملتين، و«Trotz» تحتاج اسمًا لا جملة، لذلك تبقى الجملة الثانية الصحيحة هي الجواب.",
  }),
  question("A", "B2", "vocabulary", {
    prompt: "أي رابط يقدم تنازلًا مع الحفاظ على حجة مقابلة؟",
    options: ["einerseits", "allerdings", "infolgedessen", "beispielsweise"], correctIndex: 1,
    explanation: "allerdings يقيّد أو يقابل الفكرة السابقة.", explanationAr: "allerdings تقيّد الفكرة السابقة أو تقابلها. einerseits تبدأ عرض جانب واحد، و infolgedessen تعني نتيجة، و beispielsweise تعني مثالًا.",
  }),
  question("A", "B2", "reading", {
    prompt: "لماذا لا تكفي النتيجة لإثبات السببية؟",
    contextDe: "Die freiwilligen Teilnehmenden der App-Gruppe erzielten bessere Werte. Sie übten jedoch auch häufiger außerhalb des Kurses. Der Bericht spricht deshalb von einem Zusammenhang, nicht von einem gesicherten Effekt der App.",
    options: ["Weil es keine Werte gab", "Weil Selbstwahl und zusätzliche Übung die Werte beeinflussen können", "Weil alle zufällig zugeteilt wurden", "Weil die App nie benutzt wurde"], correctIndex: 1,
    explanation: "الاختيار الذاتي ووقت التدريب الإضافي متغيران بديلان.", explanationAr: "النص يقول: «Sie übten jedoch auch häufiger außerhalb des Kurses» أي أن المشاركين تدربوا أكثر خارج الدورة. ولأن المشاركين «Die freiwilligen Teilnehmenden» اختاروا بأنفسهم، لا يمكن نسب الفرق إلى التطبيق وحده.",
  }),
  question("A", "B2", "listening", {
    prompt: "استمع دون نص: لماذا لم تُثبت السببية؟",
    audioItemId: "lib-l-b2-01",
    options: ["Es gab keine Ergebnisse", "Die Teilnehmenden wählten selbst", "Alle nutzten die App", "Die Studie dauerte zehn Jahre"], correctIndex: 1,
    explanation: "اختيار المشاركين بأنفسهم يمنع نسبة الفرق إلى التطبيق وحده.", explanationAr: "المتحدثة تقول: «Die Teilnehmenden wählten selbst, ob sie die App nutzten.» أي أن المشاركين اختاروا بأنفسهم، فلا يمكن الجزم بأن التطبيق وحده هو سبب الفرق.",
  }),
];

const formB: DiagnosticQuestion[] = [
  question("B", "A1", "grammar", {
    prompt: "___ kommst du? — Aus Tunesien.",
    options: ["Wie", "Wo", "Woher", "Was"], correctIndex: 2,
    explanation: "Woher تسأل عن الأصل أو جهة القدوم.", explanationAr: "الجواب «Woher» لأنه يسأل عن المكان أو البلد الذي يأتي منه الشخص. Wo تسأل عن المكان الحالي، وWie عن الحال، وWas عن الشيء.",
  }),
  question("B", "A1", "vocabulary", {
    prompt: "أي سؤال مناسب لمعرفة السعر؟",
    options: ["Wie spät ist das?", "Wie viel kostet das?", "Woher kostet das?", "Wer heißt das?"], correctIndex: 1,
    explanation: "Wie viel kostet das? هو سؤال السعر.", explanationAr: "سؤال السعر هو «Wie viel kostet das?». «Wie spät ist das?» تسأل عن الساعة، و«Wer heißt das?» تسأل عن الاسم.",
  }),
  question("B", "A1", "reading", {
    prompt: "أي يوم يكون المكتب مغلقًا؟",
    contextDe: "Das Büro ist Montag bis Donnerstag geöffnet. Am Freitag bleibt es geschlossen. Samstag und Sonntag arbeitet das Team nicht.",
    options: ["Montag", "Mittwoch", "Donnerstag", "Freitag"], correctIndex: 3,
    explanation: "يذكر النص أن المكتب مغلق الجمعة.", explanationAr: "النص يقول: «Am Freitag bleibt es geschlossen» أي أن المكتب مغلق يوم الجمعة. الأيام الأخرى المذكورة مفتوحة أو لا تعنيها الإجابة.",
  }),
  question("B", "A1", "listening", {
    prompt: "استمع دون نص: ما لون الباب؟",
    audioItemId: "lib-l-a1-02",
    options: ["Blau", "Rot", "Grün", "Schwarz"], correctIndex: 1,
    explanation: "الباب المذكور أحمر.", explanationAr: "المقطع يقول: «bis zur roten Tür»، أي أن الباب أحمر، فالجواب Rot.",
  }),

  question("B", "A2", "grammar", {
    prompt: "Ich bleibe zu Hause, ___ ich krank bin.",
    options: ["denn", "weil", "aber", "oder"], correctIndex: 1,
    explanation: "weil ترسل الفعل المصرف إلى نهاية الجملة الثانوية.", explanationAr: "«weil» تبيّن السبب، وتُرسل الفعل bin إلى آخر الجملة الثانوية. denn تربط سببًا أيضًا لكنها لا تغيّر ترتيب الكلمات، وaber تعني تناقضًا، وoder تعني خيارًا.",
    error: { type: "word-order", wrong: "weil ich bin krank", correct: "weil ich krank bin", explanationAr: "بعد weil يأتي الفعل المصرف في نهاية الجملة الثانوية." },
  }),
  question("B", "A2", "vocabulary", {
    prompt: "أي عبارة طبيعية لطلب إبلاغك بالقرار؟",
    options: ["Geben Sie mir bitte Bescheid.", "Machen Sie mir bitte Nachricht.", "Sagen Sie mich bitte.", "Bringen Sie mir eine Entscheidung."], correctIndex: 0,
    explanation: "jemandem Bescheid geben يعني إبلاغ شخص.", explanationAr: "العبارة الطبيعية هي «Geben Sie mir bitte Bescheid.»، ومعناها أبلغني بالقرار أو أعطني خبرًا. الجمل الأخرى غير طبيعية أو لا تعني الإبلاغ.",
  }),
  question("B", "A2", "reading", {
    prompt: "ما الحل المؤقت قبل وصول الفني؟",
    contextDe: "Die Heizung wird morgen repariert. Bis dahin stellt die Vermieterin einen kleinen Heizlüfter bereit. Die Kosten übernimmt die Hausverwaltung.",
    options: ["Ein neues Fenster", "Ein Heizlüfter", "Ein Hotelzimmer", "Keine Heizung und keine Hilfe"], correctIndex: 1,
    explanation: "سيُوفّر Heizlüfter إلى حين الإصلاح.", explanationAr: "النص يقول: «stellt die Vermieterin einen kleinen Heizlüfter bereit» أي أن المؤجرة تضع مدفأة صغيرة حتى يُصلَح الجهاز. فالحل المؤقت هو المدفأة الصغيرة.",
  }),
  question("B", "A2", "listening", {
    prompt: "استمع دون نص: ما العطل في الغرفة؟",
    audioItemId: "lib-l-a2-02",
    options: ["Der Aufzug", "Die Heizung", "Das Licht", "Die Tür"], correctIndex: 1,
    explanation: "التدفئة لا تعمل.", explanationAr: "المتحدث يقول: «In meinem Zimmer funktioniert die Heizung nicht.» أي أن التدفئة في الغرفة لا تعمل، فالجواب Die Heizung.",
  }),

  question("B", "B1", "grammar", {
    prompt: "Wenn ich mehr Zeit hätte, ___ ich öfter Deutsch lernen.",
    options: ["werde", "würde", "wurde", "will"], correctIndex: 1,
    explanation: "Konjunktiv II: würde + Infinitiv.", explanationAr: "في الجملة الشرطية «Wenn ich mehr Zeit hätte» نستعمل würde مع الفعل في آخر الجملة. werde للمستقبل العادي، وwurde للماضي، وwill تعني أريد.",
  }),
  question("B", "B1", "vocabulary", {
    prompt: "أي تركيب يعني أن خيارًا يستحق الدراسة؟",
    options: ["etwas in Betracht ziehen", "etwas unter Tisch ziehen", "etwas in Antwort laufen", "etwas auf Entscheidung bauen"], correctIndex: 0,
    explanation: "etwas in Betracht ziehen يعني أخذ الخيار في الحسبان.", explanationAr: "العبارة «etwas in Betracht ziehen» تعني أن نأخذ شيئًا بعين الاعتبار أو نعتبره خيارًا. الخيارات الأخرى تركيبات غير صحيحة.",
  }),
  question("B", "B1", "reading", {
    prompt: "ما الخطر الذي لم يُحسم بعد؟",
    contextDe: "Die technischen Daten sind bereits geprüft, und die Kostenberechnung kommt am Mittwoch. Unklar bleibt der Liefertermin. Ohne Bestätigung muss das Team zwei Varianten anbieten.",
    options: ["Die technischen Daten", "Die Identität des Kunden", "Der Liefertermin", "Die Zahl der Mitarbeitenden"], correctIndex: 2,
    explanation: "موعد التسليم هو النقطة غير المؤكدة.", explanationAr: "النص يقول: «Unklar bleibt der Liefertermin» أي أن موعد التسليم غير واضح. أما البيانات التقنية فقد «sind bereits geprüft» أي تم فحصها، لذلك ليست هي الخطر غير المحسوم.",
  }),
  question("B", "B1", "listening", {
    prompt: "استمع دون نص: ما الذي لا يزال ناقصًا؟",
    audioItemId: "lib-l-b1-02",
    options: ["Technische Daten", "Kosten", "Kundenname", "Entwurf der Leitung"], correctIndex: 1,
    explanation: "البيانات التقنية فُحصت، بينما التكلفة لم تصل بعد.", explanationAr: "المتحدثة تقول: «die Kosten fehlen noch» أي أن التكلفة لم تصل بعد. أما «Die technischen Daten sind geprüft» فهي موجودة ومفحوصة.",
  }),

  question("B", "B2", "grammar", {
    prompt: "Die Maßnahme wurde eingeführt, ___ die Kosten zu senken.",
    options: ["damit", "um", "ohne", "anstatt"], correctIndex: 1,
    explanation: "um … zu عند تطابق الفاعل للتعبير عن الهدف.", explanationAr: "الجواب «um» لأن الهدف «die Kosten zu senken» ليس له فاعل جديد. damit تحتاج جملة كاملة بفاعل، أما ohne وanstatt فلا تعبّران عن الهدف.",
  }),
  question("B", "B2", "vocabulary", {
    prompt: "أي رابط يقابل اتجاهين مباشرةً؟",
    options: ["hingegen", "folglich", "zum Beispiel", "darüber hinaus"], correctIndex: 0,
    explanation: "hingegen يبرز المقابلة بين حالتين أو اتجاهين.", explanationAr: "«hingegen» تُبرز المقابلة بين حالتين أو اتجاهين. folglich تعني نتيجة، و zum Beispiel تعني مثالًا، و darüber hinaus تعني إضافة.",
  }),
  question("B", "B2", "reading", {
    prompt: "ما معيار التقييم العادل الذي يطلبه النص؟",
    contextDe: "Der Durchschnitt der Wartezeit sank. In zwei Außenvierteln stieg sie jedoch. Eine faire Bewertung muss deshalb nicht nur den Gesamtwert, sondern auch Zugang, Ort und betroffene Gruppen ausweisen.",
    options: ["Nur den besten Stadtteil", "Nur den Gesamtwert", "Gesamtwert und verteilte Auswirkungen", "Keine Daten nach Ort"], correctIndex: 2,
    explanation: "المتوسط وحده قد يخفي توزيع الضرر بين المناطق والفئات.", explanationAr: "النص يقول: «nicht nur den Gesamtwert, sondern auch Zugang, Ort und betroffene Gruppen ausweisen» أي أن التقييم العادل يذكر المعدل العام وتوزيع الأثر. المتوسط وحده يخفي أن الانتظار زاد في «In zwei Außenvierteln stieg sie jedoch».",
  }),
  question("B", "B2", "listening", {
    prompt: "استمع دون نص: ما البدائل التي تبقى للحجز الرقمي؟",
    audioItemId: "lib-l-b2-02",
    options: ["Nur E-Mail", "Telefon und spontane Plätze", "Post und Fax allein", "Keine"], correctIndex: 1,
    explanation: "تبقى المواعيد الهاتفية ومقعدان تلقائيان كل ساعة.", explanationAr: "المتحدثة تقول: «Telefontermine und zwei spontane Plätze pro Stunde» أي تبقى المواعيد الهاتفية ومقعدان عفويان في كل ساعة. الخيار «Nur E-Mail» لا يطابق ما ذُكر.",
  }),
];

export const diagnosticForms: Record<DiagnosticFormId, DiagnosticQuestion[]> = { A: formA, B: formB };
export const allDiagnosticQuestions = [...formA, ...formB];
export const diagnosticLevels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
export const diagnosticSkills: DiagnosticSkill[] = ["grammar", "vocabulary", "reading", "listening"];
