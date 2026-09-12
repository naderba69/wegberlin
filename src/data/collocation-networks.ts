import type { CEFRLevel } from "@/types/learning";

export const COLLOCATION_NETWORK_POLICY = "contextual-collocation-network-v1" as const;
export const COLLOCATION_NETWORK_BOUNDARY = "structured-context-practice-no-free-text-ai-mastery-or-cefr" as const;

export type CollocationRegister = "daily" | "neutral" | "formal" | "academic";
export type CollocationNode = {
  id: string;
  phraseDe: string;
  meaningAr: string;
  contextDe: string;
  contextAr: string;
  exampleDe: string;
  exampleAr: string;
  contrastAr: string;
  register: CollocationRegister;
};
export type CollocationNetwork = {
  id: string;
  policyVersion: typeof COLLOCATION_NETWORK_POLICY;
  level: CEFRLevel;
  headwordDe: string;
  headwordAr: string;
  questionDe: string;
  guidanceAr: string;
  nodes: [CollocationNode, CollocationNode, CollocationNode];
  source: "original-authored-collocation-network";
  aiRequired: false;
};

type NodeSeed = Omit<CollocationNode, "id">;
function network(level: CEFRLevel, id: string, headwordDe: string, headwordAr: string, questionDe: string, guidanceAr: string, nodes: [NodeSeed, NodeSeed, NodeSeed]): CollocationNetwork {
  return { id, policyVersion: COLLOCATION_NETWORK_POLICY, level, headwordDe, headwordAr, questionDe, guidanceAr, nodes: nodes.map((node, index) => ({ ...node, id: `${id}-c${index + 1}` })) as CollocationNetwork["nodes"], source: "original-authored-collocation-network", aiRequired: false };
}

export const collocationNetworks: CollocationNetwork[] = [
  network("A1","coll-a1-termin","Termin","موعد","Was möchten Sie mit dem Termin machen?","لا تحفظ كلمة Termin وحدها؛ اختر الفعل بحسب ما تريد فعله بالموعد.",[
    {phraseDe:"einen Termin vereinbaren",meaningAr:"تحديد موعد",contextDe:"Sie brauchen einen neuen Termin.",contextAr:"تحتاج إلى موعد جديد.",exampleDe:"Ich möchte einen Termin vereinbaren.",exampleAr:"أريد تحديد موعد.",contrastAr:"تستعمل عند إنشاء الموعد، لا عند تغييره.",register:"neutral"},
    {phraseDe:"einen Termin verschieben",meaningAr:"تأجيل أو تغيير موعد",contextDe:"Der Termin passt nicht mehr.",contextAr:"الموعد الحالي لم يعد مناسبًا.",exampleDe:"Können wir den Termin auf Freitag verschieben?",exampleAr:"هل يمكننا نقل الموعد إلى الجمعة؟",contrastAr:"الموعد موجود ويبقى، لكن وقته يتغير.",register:"neutral"},
    {phraseDe:"einen Termin absagen",meaningAr:"إلغاء موعد",contextDe:"Sie können gar nicht kommen.",contextAr:"لا تستطيع الحضور إطلاقًا.",exampleDe:"Leider muss ich den Termin absagen.",exampleAr:"للأسف يجب أن ألغي الموعد.",contrastAr:"يختفي الموعد؛ لا تخلطه مع verschieben.",register:"neutral"},
  ]),
  network("A1","coll-a1-frage","Frage","سؤال","Was passiert mit der Frage?","الفعل يحدد هل تنشئ السؤال أو تجيب عنه أو تسمعه ثانية.",[
    {phraseDe:"eine Frage stellen",meaningAr:"طرح سؤال",contextDe:"Sie möchten etwas wissen.",contextAr:"تريد معرفة معلومة.",exampleDe:"Darf ich eine Frage stellen?",exampleAr:"هل يمكنني طرح سؤال؟",contrastAr:"الألمانية تستعمل stellen لا machen هنا.",register:"neutral"},
    {phraseDe:"eine Frage beantworten",meaningAr:"الإجابة عن سؤال",contextDe:"Jemand wartet auf Ihre Antwort.",contextAr:"شخص ينتظر جوابك.",exampleDe:"Können Sie diese Frage beantworten?",exampleAr:"هل يمكنك الإجابة عن هذا السؤال؟",contrastAr:"فاعل الجملة يعطي الجواب، لا يطرح السؤال.",register:"neutral"},
    {phraseDe:"eine Frage wiederholen",meaningAr:"إعادة السؤال",contextDe:"Sie haben die Frage nicht verstanden.",contextAr:"لم تفهم السؤال المسموع.",exampleDe:"Bitte wiederholen Sie die Frage.",exampleAr:"من فضلك أعد السؤال.",contrastAr:"تطلب نفس السؤال ثانية بدل التخمين.",register:"daily"},
  ]),
  network("A1","coll-a1-kaffee","Kaffee","قهوة","An welchem Schritt sind Sie?","اربط الاسم بخطوة الموقف: طلب، دفع، أو شرب.",[
    {phraseDe:"einen Kaffee bestellen",meaningAr:"طلب قهوة",contextDe:"Die Bedienung fragt nach Ihrem Wunsch.",contextAr:"النادل يسأل ماذا تريد.",exampleDe:"Ich möchte einen Kaffee bestellen.",exampleAr:"أريد طلب قهوة.",contrastAr:"الطلب يسبق الدفع أو الشرب.",register:"daily"},
    {phraseDe:"den Kaffee bezahlen",meaningAr:"دفع ثمن القهوة",contextDe:"Sie möchten die Rechnung begleichen.",contextAr:"تريد دفع الحساب.",exampleDe:"Wo kann ich den Kaffee bezahlen?",exampleAr:"أين يمكنني دفع ثمن القهوة؟",contrastAr:"bezahlen يتعلق بالحساب، لا بتحضير المشروب.",register:"daily"},
    {phraseDe:"Kaffee trinken",meaningAr:"شرب القهوة",contextDe:"Sie sprechen über Ihre Gewohnheit.",contextAr:"تتحدث عن عادتك.",exampleDe:"Morgens trinke ich gern Kaffee.",exampleAr:"أحب شرب القهوة صباحًا.",contrastAr:"عند الحديث العام يمكن أن يأتي Kaffee دون أداة.",register:"daily"},
  ]),
  network("A1","coll-a1-wohnung","Wohnung","شقة","In welcher Phase sind Sie?","حدد هل تبحث أو تزور أو توقع الاستئجار.",[
    {phraseDe:"eine Wohnung suchen",meaningAr:"البحث عن شقة",contextDe:"Sie haben noch keine passende Wohnung.",contextAr:"لم تجد شقة مناسبة بعد.",exampleDe:"Wir suchen eine Wohnung in Berlin.",exampleAr:"نبحث عن شقة في برلين.",contrastAr:"هذه مرحلة البحث قبل اختيار مكان محدد.",register:"daily"},
    {phraseDe:"eine Wohnung besichtigen",meaningAr:"معاينة شقة",contextDe:"Sie sehen eine konkrete Wohnung vor Ort.",contextAr:"تزور شقة محددة في المكان.",exampleDe:"Morgen besichtigen wir eine Wohnung.",exampleAr:"سنعاين شقة غدًا.",contrastAr:"المعاينة لا تعني أنك استأجرتها.",register:"neutral"},
    {phraseDe:"eine Wohnung mieten",meaningAr:"استئجار شقة",contextDe:"Sie schließen einen Mietvertrag ab.",contextAr:"ستبرم عقد إيجار.",exampleDe:"Ab Mai mieten wir diese Wohnung.",exampleAr:"سنستأجر هذه الشقة من مايو.",contrastAr:"mieten يصف علاقة الإيجار الفعلية.",register:"neutral"},
  ]),
  network("A2","coll-a2-problem","Problem","مشكلة","Was ist Ihr nächster Schritt beim Problem?","انتقل من وصف المشكلة إلى حلها أو منعها بحسب السياق.",[
    {phraseDe:"ein Problem beschreiben",meaningAr:"وصف مشكلة",contextDe:"Die andere Person kennt die Störung noch nicht.",contextAr:"الطرف الآخر لا يعرف العطل بعد.",exampleDe:"Beschreiben Sie das Problem bitte genau.",exampleAr:"صف المشكلة بدقة من فضلك.",contrastAr:"الوصف ينقل الأعراض ولا يدعي الحل.",register:"neutral"},
    {phraseDe:"ein Problem lösen",meaningAr:"حل مشكلة",contextDe:"Sie suchen eine funktionierende Lösung.",contextAr:"تبحث عن حل يعمل.",exampleDe:"Gemeinsam konnten wir das Problem lösen.",exampleAr:"استطعنا حل المشكلة معًا.",contrastAr:"lösen يعني إزالة المشكلة أو معالجتها بنجاح.",register:"neutral"},
    {phraseDe:"ein Problem vermeiden",meaningAr:"تجنب مشكلة",contextDe:"Sie handeln, bevor die Störung entsteht.",contextAr:"تتصرف قبل ظهور المشكلة.",exampleDe:"Mit einer Checkliste lässt sich das Problem vermeiden.",exampleAr:"يمكن تجنب المشكلة بقائمة تحقق.",contrastAr:"التجنب وقائي، بينما lösen يأتي بعد المشكلة.",register:"neutral"},
  ]),
  network("A2","coll-a2-antrag","Antrag","طلب إداري", "In welchem Bearbeitungsschritt ist der Antrag?","الفعل يحدد دور مقدم الطلب أو الجهة الإدارية.",[
    {phraseDe:"einen Antrag ausfüllen",meaningAr:"ملء طلب",contextDe:"Das Formular ist noch leer.",contextAr:"الاستمارة ما زالت فارغة.",exampleDe:"Bitte füllen Sie den Antrag vollständig aus.",exampleAr:"املأ الطلب كاملًا من فضلك.",contrastAr:"ausfüllen يخص إدخال البيانات في النموذج.",register:"formal"},
    {phraseDe:"einen Antrag einreichen",meaningAr:"إيداع طلب",contextDe:"Das Formular ist fertig und geht an die Behörde.",contextAr:"اكتمل النموذج وسيُرسل إلى الإدارة.",exampleDe:"Sie können den Antrag online einreichen.",exampleAr:"يمكنك إيداع الطلب إلكترونيًا.",contrastAr:"الإيداع يأتي بعد الملء ولا يعني القبول.",register:"formal"},
    {phraseDe:"einen Antrag bearbeiten",meaningAr:"معالجة طلب",contextDe:"Die zuständige Stelle prüft den eingereichten Antrag.",contextAr:"الجهة المختصة تفحص الطلب المودع.",exampleDe:"Die Behörde bearbeitet den Antrag.",exampleAr:"الإدارة تعالج الطلب.",contrastAr:"غالبًا تكون الجهة هي الفاعل، لا مقدم الطلب.",register:"formal"},
  ]),
  network("A2","coll-a2-entscheidung","Entscheidung","قرار","Was möchten Sie mit der Entscheidung tun?","ميّز صنع القرار عن تغييره أو شرح أسبابه.",[
    {phraseDe:"eine Entscheidung treffen",meaningAr:"اتخاذ قرار",contextDe:"Mehrere Möglichkeiten liegen vor.",contextAr:"لديك عدة خيارات ولم تحسم بعد.",exampleDe:"Wir müssen heute eine Entscheidung treffen.",exampleAr:"يجب أن نتخذ قرارًا اليوم.",contrastAr:"الألمانية تستعمل treffen لا machen في هذا التركيب.",register:"neutral"},
    {phraseDe:"eine Entscheidung ändern",meaningAr:"تغيير قرار",contextDe:"Neue Informationen verändern Ihre Wahl.",contextAr:"معلومات جديدة غيّرت اختيارك.",exampleDe:"Nach dem Gespräch änderte sie ihre Entscheidung.",exampleAr:"غيرت قرارها بعد الحوار.",contrastAr:"يوجد قرار سابق ثم يتغير.",register:"neutral"},
    {phraseDe:"eine Entscheidung begründen",meaningAr:"تعليل قرار",contextDe:"Andere möchten Ihre Gründe verstehen.",contextAr:"يريد الآخرون فهم أسبابك.",exampleDe:"Können Sie Ihre Entscheidung begründen?",exampleAr:"هل يمكنك تعليل قرارك؟",contrastAr:"لا يغير القرار؛ يوضح لماذا اتخذته.",register:"neutral"},
  ]),
  network("A2","coll-a2-vereinbarung","Vereinbarung","اتفاق", "Wie gehen Sie mit der Vereinbarung um?","اربط الاتفاق بإنشائه أو احترامه أو تعديله.",[
    {phraseDe:"eine Vereinbarung treffen",meaningAr:"التوصل إلى اتفاق",contextDe:"Zwei Seiten legen etwas gemeinsam fest.",contextAr:"طرفان يحددان شيئًا معًا.",exampleDe:"Wir haben eine klare Vereinbarung getroffen.",exampleAr:"توصلنا إلى اتفاق واضح.",contrastAr:"treffen هنا ينشئ الاتفاق.",register:"neutral"},
    {phraseDe:"eine Vereinbarung einhalten",meaningAr:"الالتزام باتفاق",contextDe:"Sie tun später, was vereinbart wurde.",contextAr:"تنفذ لاحقًا ما اتفقت عليه.",exampleDe:"Beide Seiten müssen die Vereinbarung einhalten.",exampleAr:"يجب أن يلتزم الطرفان بالاتفاق.",contrastAr:"einhalten يصف التنفيذ بعد الاتفاق.",register:"formal"},
    {phraseDe:"eine Vereinbarung ändern",meaningAr:"تعديل اتفاق",contextDe:"Die alte Regel passt für beide Seiten nicht mehr.",contextAr:"القاعدة القديمة لم تعد مناسبة للطرفين.",exampleDe:"Wir möchten die Vereinbarung gemeinsam ändern.",exampleAr:"نريد تعديل الاتفاق معًا.",contrastAr:"التعديل يحتاج اتفاقًا قائمًا ولا يعني تجاهله.",register:"neutral"},
  ]),
  network("B1","coll-b1-verantwortung","Verantwortung","مسؤولية","Welche Beziehung haben Sie zur Verantwortung?","التركيب يبين بدء المسؤولية أو استمرارها أو توزيعها.",[
    {phraseDe:"Verantwortung übernehmen",meaningAr:"تولي المسؤولية",contextDe:"Sie werden neu für eine Aufgabe zuständig.",contextAr:"تصبح مسؤولًا جديدًا عن مهمة.",exampleDe:"Ich übernehme die Verantwortung für die Checkliste.",exampleAr:"سأتولى مسؤولية قائمة التحقق.",contrastAr:"übernehmen يركز على بداية الالتزام.",register:"neutral"},
    {phraseDe:"Verantwortung tragen",meaningAr:"تحمل المسؤولية",contextDe:"Sie sind dauerhaft für Folgen zuständig.",contextAr:"أنت مسؤول باستمرار عن النتائج.",exampleDe:"Die Leitung trägt die Verantwortung für die Sicherheit.",exampleAr:"الإدارة تتحمل مسؤولية السلامة.",contrastAr:"tragen يصف وضع المسؤولية القائم.",register:"formal"},
    {phraseDe:"Verantwortung teilen",meaningAr:"تقاسم المسؤولية",contextDe:"Mehrere Personen sollen gemeinsam zuständig sein.",contextAr:"يجب أن يشترك عدة أشخاص في المسؤولية.",exampleDe:"Im Team teilen wir die Verantwortung.",exampleAr:"نتقاسم المسؤولية داخل الفريق.",contrastAr:"لا تعني إزالة المسؤولية، بل توزيعها.",register:"neutral"},
  ]),
  network("B1","coll-b1-ziel","Ziel","هدف","Was geschieht mit dem Ziel?","ميز التخطيط للهدف عن الوصول إليه أو عدم بلوغه.",[
    {phraseDe:"ein Ziel setzen",meaningAr:"وضع هدف",contextDe:"Sie planen ein konkretes Ergebnis.",contextAr:"تخطط لنتيجة محددة.",exampleDe:"Wir setzen uns ein realistisches Ziel.",exampleAr:"نضع لأنفسنا هدفًا واقعيًا.",contrastAr:"setzen يأتي في مرحلة التخطيط.",register:"neutral"},
    {phraseDe:"ein Ziel erreichen",meaningAr:"تحقيق هدف",contextDe:"Das geplante Ergebnis wurde verwirklicht.",contextAr:"تحققت النتيجة المخطط لها.",exampleDe:"Das Team hat sein Ziel erreicht.",exampleAr:"حقق الفريق هدفه.",contrastAr:"erreichen يثبت الوصول، لا مجرد التقدم.",register:"neutral"},
    {phraseDe:"ein Ziel verfehlen",meaningAr:"الإخفاق في بلوغ هدف",contextDe:"Das Ergebnis bleibt unter dem festgelegten Wert.",contextAr:"بقيت النتيجة دون القيمة المحددة.",exampleDe:"Wir haben das Ziel knapp verfehlt.",exampleAr:"أخفقنا في الهدف بفارق صغير.",contrastAr:"verfehlen أدق من القول إن كل العمل فشل.",register:"formal"},
  ]),
  network("B1","coll-b1-massnahme","Maßnahme","إجراء","In welcher Phase befindet sich die Maßnahme?","اختر فعل القرار أو التنفيذ أو المراجعة.",[
    {phraseDe:"eine Maßnahme ergreifen",meaningAr:"اتخاذ إجراء",contextDe:"Auf ein erkanntes Risiko soll reagiert werden.",contextAr:"يجب الرد على خطر معروف.",exampleDe:"Wir müssen sofort eine Maßnahme ergreifen.",exampleAr:"يجب أن نتخذ إجراءً فورًا.",contrastAr:"ergreifen يعلن قرار التدخل.",register:"formal"},
    {phraseDe:"eine Maßnahme umsetzen",meaningAr:"تنفيذ إجراء",contextDe:"Der beschlossene Plan wird praktisch durchgeführt.",contextAr:"تُنفذ الخطة المقررة عمليًا.",exampleDe:"Das Team setzt die Maßnahme ab Montag um.",exampleAr:"سينفذ الفريق الإجراء من الاثنين.",contrastAr:"التنفيذ يأتي بعد اتخاذ الإجراء.",register:"formal"},
    {phraseDe:"eine Maßnahme überprüfen",meaningAr:"مراجعة إجراء",contextDe:"Sie prüfen später Wirkung und Nebenfolgen.",contextAr:"تفحص الأثر والنتائج الجانبية لاحقًا.",exampleDe:"Nach drei Monaten überprüfen wir die Maßnahme.",exampleAr:"سنراجع الإجراء بعد ثلاثة أشهر.",contrastAr:"المراجعة لا تفترض مسبقًا نجاح الإجراء.",register:"formal"},
  ]),
  network("B1","coll-b1-daten","Daten","بيانات","Welche Arbeit machen Sie mit den Daten?","اربط البيانات بجمعها أو تحليلها أو حمايتها.",[
    {phraseDe:"Daten erheben",meaningAr:"جمع بيانات منهجيًا",contextDe:"Für die Untersuchung fehlen noch Beobachtungen.",contextAr:"الدراسة ما زالت تحتاج إلى ملاحظات.",exampleDe:"Wir erheben Daten in drei Teams.",exampleAr:"نجمع بيانات في ثلاثة فرق.",contrastAr:"erheben أدق من sammeln في السياق البحثي.",register:"academic"},
    {phraseDe:"Daten auswerten",meaningAr:"تحليل بيانات",contextDe:"Die erhobenen Werte sollen interpretiert werden.",contextAr:"يجب تفسير القيم المجموعة.",exampleDe:"Anschließend werten wir die Daten aus.",exampleAr:"بعد ذلك نحلل البيانات.",contrastAr:"لا يمكن auswerten قبل وجود بيانات.",register:"academic"},
    {phraseDe:"Daten schützen",meaningAr:"حماية بيانات",contextDe:"Unbefugte dürfen keinen Zugriff erhalten.",contextAr:"يجب منع وصول غير المخولين.",exampleDe:"Personenbezogene Daten müssen geschützt werden.",exampleAr:"يجب حماية البيانات الشخصية.",contrastAr:"الحماية التزام مستقل عن التحليل.",register:"formal"},
  ]),
  network("B2","coll-b2-risiko","Risiko","خطر","Wie gehen Sie mit dem Risiko um?","الميزة هنا ليست مرادفات؛ كل فعل يمثل قرارًا مختلفًا تجاه الخطر.",[
    {phraseDe:"ein Risiko einschätzen",meaningAr:"تقدير خطر",contextDe:"Wahrscheinlichkeit und Folgen sind noch unklar.",contextAr:"الاحتمال والنتائج ما زالا غير واضحين.",exampleDe:"Vor dem Pilotprojekt müssen wir das Risiko einschätzen.",exampleAr:"يجب تقدير الخطر قبل التجربة.",contrastAr:"التقدير يسبق قرار القبول أو المعالجة.",register:"formal"},
    {phraseDe:"ein Risiko minimieren",meaningAr:"تقليل خطر",contextDe:"Schutzmaßnahmen sollen die Gefahr verringern.",contextAr:"تهدف إجراءات الحماية إلى خفض الخطر.",exampleDe:"Eine Vertretungsregel kann das Risiko minimieren.",exampleAr:"يمكن لنظام البديل تقليل الخطر.",contrastAr:"minimieren لا يعني إزالة الخطر تمامًا.",register:"formal"},
    {phraseDe:"ein Risiko eingehen",meaningAr:"قبول المجازفة",contextDe:"Sie entscheiden sich trotz einer bekannten Gefahr.",contextAr:"تقرر المتابعة رغم خطر معروف.",exampleDe:"Ohne Reserve würden wir ein hohes Risiko eingehen.",exampleAr:"سنقبل مجازفة كبيرة دون احتياط.",contrastAr:"هنا الفاعل يقبل الخطر، لا يخفضه.",register:"formal"},
  ]),
  network("B2","coll-b2-annahme","Annahme","افتراض","Wie wird mit der Annahme argumentativ gearbeitet?","الأفعال الثلاثة تمثل فحصًا أو اعتراضًا أو دحضًا، وليست بدائل متساوية.",[
    {phraseDe:"eine Annahme überprüfen",meaningAr:"التحقق من افتراض",contextDe:"Noch ist offen, ob die Ausgangsidee stimmt.",contextAr:"لم يتضح بعد هل الفكرة الأساسية صحيحة.",exampleDe:"Die Studie überprüft diese Annahme mit neuen Daten.",exampleAr:"تتحقق الدراسة من الافتراض ببيانات جديدة.",contrastAr:"التحقق لا يعلن النتيجة مسبقًا.",register:"academic"},
    {phraseDe:"eine Annahme infrage stellen",meaningAr:"التشكيك في افتراض",contextDe:"Ein Gegenbeispiel schwächt die bisherige Sicht.",contextAr:"مثال مضاد يضعف الرؤية السابقة.",exampleDe:"Die Ergebnisse stellen die Annahme infrage.",exampleAr:"تشكك النتائج في الافتراض.",contrastAr:"التشكيك أضعف من إثبات الخطأ نهائيًا.",register:"academic"},
    {phraseDe:"eine Annahme widerlegen",meaningAr:"دحض افتراض",contextDe:"Belastbare Evidenz zeigt, dass die Aussage nicht stimmt.",contextAr:"دليل قوي يثبت عدم صحة الادعاء.",exampleDe:"Die Kontrollgruppe widerlegt die ursprüngliche Annahme.",exampleAr:"تدحض المجموعة الضابطة الافتراض الأصلي.",contrastAr:"widerlegen ادعاء أقوى ويحتاج دليلًا مناسبًا.",register:"academic"},
  ]),
  network("B2","coll-b2-position","Position","موقف","Was verändert sich an der Position?","اختر بين الدفاع عن الموقف أو توضيحه أو مراجعته.",[
    {phraseDe:"eine Position vertreten",meaningAr:"تبني موقف والدفاع عنه",contextDe:"Sie erklären öffentlich Ihre Sicht.",contextAr:"تشرح رؤيتك علنًا.",exampleDe:"Die Autorin vertritt eine differenzierte Position.",exampleAr:"تتبنى الكاتبة موقفًا متمايزًا.",contrastAr:"vertreten يبين الملكية الحجاجية للموقف.",register:"formal"},
    {phraseDe:"eine Position präzisieren",meaningAr:"تدقيق موقف",contextDe:"Eine Aussage war zu allgemein und braucht Grenzen.",contextAr:"كان التصريح عامًا ويحتاج إلى حدود.",exampleDe:"Im zweiten Absatz präzisiert er seine Position.",exampleAr:"يدقق موقفه في الفقرة الثانية.",contrastAr:"التدقيق لا يعني التخلي عن أصل الموقف.",register:"academic"},
    {phraseDe:"eine Position revidieren",meaningAr:"مراجعة موقف وتغييره",contextDe:"Neue Evidenz führt zu einer inhaltlichen Korrektur.",contextAr:"دليل جديد يؤدي إلى تصحيح الموقف.",exampleDe:"Nach den neuen Daten revidierte sie ihre Position.",exampleAr:"راجعت موقفها بعد البيانات الجديدة.",contrastAr:"revidieren أقوى من مجرد توضيح الصياغة.",register:"academic"},
  ]),
  network("B2","coll-b2-auswirkungen","Auswirkungen","آثار","Welche analytische Handlung ist gemeint?","السياق يحدد هل تتوقع الأثر أو تدرسه أو تدخله في القرار.",[
    {phraseDe:"Auswirkungen abschätzen",meaningAr:"تقدير آثار متوقعة",contextDe:"Vor der Entscheidung sind nur Prognosen möglich.",contextAr:"قبل القرار لا تتوفر إلا تقديرات.",exampleDe:"Zunächst müssen wir die Auswirkungen abschätzen.",exampleAr:"يجب أولًا تقدير الآثار.",contrastAr:"abschätzen يتعامل مع عدم يقين مستقبلي.",register:"formal"},
    {phraseDe:"Auswirkungen untersuchen",meaningAr:"دراسة آثار",contextDe:"Nach dem Pilotprojekt liegen beobachtbare Daten vor.",contextAr:"بعد التجربة تتوفر بيانات قابلة للملاحظة.",exampleDe:"Die Evaluation untersucht die Auswirkungen auf Teilzeitkräfte.",exampleAr:"يدرس التقييم الآثار على العاملين جزئيًا.",contrastAr:"untersuchen يحتاج موضوعًا ومنهجًا، لا انطباعًا فقط.",register:"academic"},
    {phraseDe:"Auswirkungen berücksichtigen",meaningAr:"مراعاة آثار",contextDe:"Die bekannten Folgen sollen in die Entscheidung eingehen.",contextAr:"يجب إدخال النتائج المعروفة في القرار.",exampleDe:"Der Plan muss soziale Auswirkungen berücksichtigen.",exampleAr:"يجب أن تراعي الخطة الآثار الاجتماعية.",contrastAr:"المراعاة فعل قرار، وليست جمع بيانات جديدًا.",register:"formal"},
  ]),
];

export function collocationNetworksForLevel(level: CEFRLevel) {
  return collocationNetworks.filter((item) => item.level === level);
}
