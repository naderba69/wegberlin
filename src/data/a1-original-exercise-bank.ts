// A1 gap bank (original items, written from scratch for this repository; not copied from any book).
// Review status: automated structural check only (tests/unit/original-a1-exercise-bank.test.ts).
// No item in this file has been reviewed by a human reviewer. Grammar facts are standard A1 forms;
// per-item lookup against Duden/DWDS is not recorded here and must not be read as source verification.
export const A1_ORIGINAL_EXERCISE_POLICY_VERSION = "a1-original-gap-bank-v1" as const;
export const A1_ORIGINAL_EXERCISE_REVIEW_STATUS = "automated-structural-only" as const;

export interface A1OriginalExercise {
  id: string;
  level: "A1";
  topic: string;
  promptDe: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
}

export const a1OriginalExerciseItems: A1OriginalExercise[] = [
  {"id": "art-neuter-ein", "level": "A1", "topic": "أداة التعريف والنكرة", "promptDe": "Das ist ___ Buch.", "options": ["ein", "eine", "einen"], "correctIndex": 0, "explanationAr": "Buch كلمة محايدة (das)، والمذكر والمؤنث لا يناسبانها، لذلك «ein» هي الصحيحة."},
  {"id": "akk-fem-eine", "level": "A1", "topic": "المفعول به المؤنث", "promptDe": "Ich habe ___ Schwester.", "options": ["einen", "eine", "einer"], "correctIndex": 1, "explanationAr": "Schwester مؤنثة، وفي المفعول به (Akkusativ) يبقى المؤنث «eine» دون تغيير."},
  {"id": "akk-masc-den", "level": "A1", "topic": "المفعول به المذكر", "promptDe": "Ich sehe ___ Mann dort.", "options": ["der", "dem", "den"], "correctIndex": 2, "explanationAr": "Mann مذكر، وبعد الفعل sehen يأخذ المفعول به حالة Akkusativ: den."},
  {"id": "dat-in-der", "level": "A1", "topic": "حرف الجر in مع المكان", "promptDe": "Er wohnt in ___ Stadt.", "options": ["der", "die", "den"], "correctIndex": 0, "explanationAr": "بعد in مع سؤال «أين؟» تأتي حالة Dativ، و Stadt مؤنثة، فيكون «der»."},
  {"id": "dat-mit-dem", "level": "A1", "topic": "حرف الجر mit", "promptDe": "Wir fahren mit ___ Bus.", "options": ["der", "dem", "den"], "correctIndex": 1, "explanationAr": "حرف الجر mit يأخذ دائمًا Dativ، و Bus مذكر، فيكون «dem»."},
  {"id": "nom-das-kind", "level": "A1", "topic": "الفاعل في الجملة", "promptDe": "___ Kind spielt im Garten.", "options": ["Den", "Dem", "Das"], "correctIndex": 2, "explanationAr": "الفاعل هنا في حالة Nominativ، و Kind كلمة محايدة: «Das»."},
  {"id": "neg-keinen", "level": "A1", "topic": "النفي بـ kein", "promptDe": "Ich habe ___ Hund.", "options": ["keinen", "keine", "kein"], "correctIndex": 0, "explanationAr": "Hund مذكر، وفي Akkusativ يصبح النفي «keinen»."},
  {"id": "poss-meine", "level": "A1", "topic": "ضمير الملكية", "promptDe": "Das ist ___ Tasche.", "options": ["mein", "meine", "meinen"], "correctIndex": 1, "explanationAr": "Tasche مؤنثة ومفردة وفي Nominativ: «meine»."},
  {"id": "prep-in-berlin", "level": "A1", "topic": "حرف الجر in مع المدن", "promptDe": "Ich wohne ___ Berlin.", "options": ["an", "auf", "in"], "correctIndex": 2, "explanationAr": "مع أسماء المدن غالبًا تُستعمل «in»، كما في «in Berlin»."},
  {"id": "prep-aus", "level": "A1", "topic": "بلد الأصل", "promptDe": "Ich komme ___ Tunesien.", "options": ["aus", "von", "nach"], "correctIndex": 0, "explanationAr": "للدلالة على بلد الأصل نقول «aus»، كما في «aus Tunesien»."},
  {"id": "verb-spreche", "level": "A1", "topic": "تصريف الفعل مع ich", "promptDe": "Ich ___ Deutsch.", "options": ["sprichst", "spreche", "spricht"], "correctIndex": 1, "explanationAr": "مع «ich» تكون نهاية الفعل -e: ich spreche."},
  {"id": "verb-sprichst", "level": "A1", "topic": "تغيير الحرف في الفعل مع du", "promptDe": "Du ___ sehr gut Deutsch.", "options": ["sprichts", "sprecht", "sprichst"], "correctIndex": 2, "explanationAr": "الفعل sprechen يتغير فيه e إلى i مع du و er/sie/es، ونهاية du هي -st: sprichst."},
  {"id": "verb-arbeitet", "level": "A1", "topic": "تصريف الفعل مع er", "promptDe": "Er ___ in einer Schule.", "options": ["arbeitet", "arbeitest", "arbeiten"], "correctIndex": 0, "explanationAr": "مع «er» تكون نهاية الفعل -t، كما في arbeitet."},
  {"id": "verb-trinken", "level": "A1", "topic": "تصريف الفعل مع wir", "promptDe": "Wir ___ Kaffee.", "options": ["trinke", "trinken", "trinkt"], "correctIndex": 1, "explanationAr": "مع «wir» تساوي صيغة الفعل صيغة المصدر: trinken."},
  {"id": "sein-ist", "level": "A1", "topic": "الفعل sein مع sie", "promptDe": "Sie ___ Lehrerin.", "options": ["bist", "sind", "ist"], "correctIndex": 2, "explanationAr": "مع «sie» مفردة في الحاضر يكون الفعل sein «ist»."},
  {"id": "haben-haben", "level": "A1", "topic": "الفعل haben مع wir", "promptDe": "Wir ___ Zeit.", "options": ["haben", "habt", "hat"], "correctIndex": 0, "explanationAr": "مع «wir» يكون الفعل haben في صيغة الجمع: haben."},
  {"id": "modal-kann", "level": "A1", "topic": "الفعل الموديل können", "promptDe": "Ich ___ gut schwimmen.", "options": ["kannst", "kann", "können"], "correctIndex": 1, "explanationAr": "مع «ich» يكون الفعل الموديل «kann»."},
  {"id": "modal-moechte", "level": "A1", "topic": "الفعل الموديل möchten", "promptDe": "Er ___ Deutsch lernen.", "options": ["mag", "möchten", "möchte"], "correctIndex": 2, "explanationAr": "مع «er» تكون الصيغة möchte، ويأتي الفعل الرئيسي في آخر الجملة."},
  {"id": "perf-habe", "level": "A1", "topic": "الماضي المركب مع haben", "promptDe": "Ich ___ gestern Fußball gespielt.", "options": ["habe", "bin", "hat"], "correctIndex": 0, "explanationAr": "معظم الأفعال تأخذ haben في الماضي المركب، و spielen منها: habe."},
  {"id": "perf-sind", "level": "A1", "topic": "الماضي المركب مع sein", "promptDe": "Wir ___ nach Hause gegangen.", "options": ["haben", "sind", "sein"], "correctIndex": 1, "explanationAr": "أفعال الحركة مثل gehen تأخذ sein في الماضي المركب: sind."},
  {"id": "perf-gelesen", "level": "A1", "topic": "اسم المفعول Partizip II", "promptDe": "Er hat das Buch ___.", "options": ["lesen", "gelest", "gelesen"], "correctIndex": 2, "explanationAr": "Partizip II للفعل lesen هو gelesen."},
  {"id": "sep-faehrt", "level": "A1", "topic": "الفعل المركب القابل للفصل", "promptDe": "Der Bus ___ um acht Uhr.", "options": ["fährt … ab", "abfährt", "fährt … an"], "correctIndex": 0, "explanationAr": "في الجملة الخبرية يُفصل الفعل المركب abfahren: الجزء ab يأتي في آخر الجملة."},
  {"id": "neg-keine", "level": "A1", "topic": "النفي بـ kein مع المؤنث", "promptDe": "Ich habe ___ Zeit.", "options": ["kein", "keine", "nicht"], "correctIndex": 1, "explanationAr": "Zeit مؤنثة، وفي Akkusativ يكون النفي «keine»."},
  {"id": "neg-nicht", "level": "A1", "topic": "نفي الصفة بـ nicht", "promptDe": "Das ist ___ gut.", "options": ["kein", "keine", "nicht"], "correctIndex": 2, "explanationAr": "عند نفي صفة مثل «gut» نستعمل «nicht»، لا «kein»."},
  {"id": "w-wie", "level": "A1", "topic": "سؤال الاسم", "promptDe": "___ heißt du?", "options": ["Wie", "Wo", "Was"], "correctIndex": 0, "explanationAr": "للسؤال عن الاسم نقول «Wie heißt du?»."},
  {"id": "w-wo", "level": "A1", "topic": "سؤال المكان", "promptDe": "___ wohnst du?", "options": ["Woher", "Wo", "Wie"], "correctIndex": 1, "explanationAr": "«Wo» تسأل عن مكان الإقامة، و Woher تسأل عن مكان الانطلاق."},
  {"id": "w-woher", "level": "A1", "topic": "سؤال الأصل", "promptDe": "___ kommst du?", "options": ["Wohin", "Wo", "Woher"], "correctIndex": 2, "explanationAr": "«Woher» تسأل عن الأصل أو مكان الانطلاق."},
  {"id": "w-was-kostet", "level": "A1", "topic": "سؤال السعر", "promptDe": "___ kostet das?", "options": ["Was", "Wer", "Wo"], "correctIndex": 0, "explanationAr": "«Was» تُستعمل هنا للسؤال عن السعر: Was kostet das?"},
  {"id": "num-12-8", "level": "A1", "topic": "الأعداد: الجمع", "promptDe": "Wie viel ist 12 + 8?", "options": ["zwölf", "zwanzig", "zweiundzwanzig"], "correctIndex": 1, "explanationAr": "12 + 8 = 20، والكلمة الألمانية «zwanzig»."},
  {"id": "num-3x4", "level": "A1", "topic": "الأعداد: الضرب", "promptDe": "Wie viel ist 3 mal 4?", "options": ["sieben", "vierzehn", "zwölf"], "correctIndex": 2, "explanationAr": "3 × 4 = 12، والكلمة الألمانية «zwölf»."},
  {"id": "time-halb-drei", "level": "A1", "topic": "قراءة الساعة", "promptDe": "Es ist halb drei.", "options": ["2:30", "3:30", "2:15"], "correctIndex": 0, "explanationAr": "halb drei تعني نصف الساعة قبل الثالثة: 2:30."},
  {"id": "time-viertel-nach-acht", "level": "A1", "topic": "قراءة الساعة", "promptDe": "Es ist Viertel nach acht.", "options": ["7:45", "8:15", "8:45"], "correctIndex": 1, "explanationAr": "Viertel nach acht تعني ثمانية وربع: 8:15."},
  {"id": "weekday-after-montag", "level": "A1", "topic": "أيام الأسبوع", "promptDe": "Der Tag nach Montag ist ___.", "options": ["Sonntag", "Freitag", "Dienstag"], "correctIndex": 2, "explanationAr": "اليوم الذي يلي الاثنين هو الثلاثاء: Dienstag."},
  {"id": "month-after-januar", "level": "A1", "topic": "أشهر السنة", "promptDe": "Der Monat nach Januar ist ___.", "options": ["Februar", "März", "April"], "correctIndex": 0, "explanationAr": "الشهر الذي يلي يناير هو فبراير: Februar."},
  {"id": "adj-gross-haus", "level": "A1", "topic": "تصريف الصفة بعد ein", "promptDe": "Das ist ein ___ Haus.", "options": ["großer", "großes", "große"], "correctIndex": 1, "explanationAr": "Haus محايدة، وبعد ein في Nominativ تأخذ الصفة النهاية -es: großes."},
  {"id": "adj-kaltes-wasser", "level": "A1", "topic": "تصريف الصفة بدون أداة", "promptDe": "Ich trinke gern ___ Wasser.", "options": ["kalte", "kalter", "kaltes"], "correctIndex": 2, "explanationAr": "Wasser محايدة وبلا أداة، فتأخذ الصفة النهاية -es: kaltes."},
  {"id": "dat-meiner-mutter", "level": "A1", "topic": "الفعل helfen مع Dativ", "promptDe": "Ich helfe ___ Mutter.", "options": ["meiner", "meine", "meinen"], "correctIndex": 0, "explanationAr": "helfen يأخذ Dativ، و Mutter مؤنثة: meiner."},
  {"id": "dat-auf-dem-tisch", "level": "A1", "topic": "حرف الجر auf مع المكان", "promptDe": "Der Stift liegt auf ___ Tisch.", "options": ["den", "dem", "der"], "correctIndex": 1, "explanationAr": "auf مع سؤال «أين؟» تأخذ Dativ، و Tisch مذكرة: dem."},
  {"id": "voc-baeckerei", "level": "A1", "topic": "مفردات: الشراء", "promptDe": "Ich kaufe Brot in der ___.", "options": ["Apotheke", "Bibliothek", "Bäckerei"], "correctIndex": 2, "explanationAr": "الخبز يُشترى من المخبز: Bäckerei."},
  {"id": "voc-arzt", "level": "A1", "topic": "مفردات: الصحة", "promptDe": "Wenn ich krank bin, gehe ich zum ___.", "options": ["Arzt", "Bäcker", "Lehrer"], "correctIndex": 0, "explanationAr": "عند المرض نذهب إلى الطبيب: zum Arzt."},
  {"id": "voc-fahrkarte", "level": "A1", "topic": "مفردات: السفر", "promptDe": "Am Bahnhof kaufe ich eine ___ für den Zug.", "options": ["Brille", "Fahrkarte", "Milch"], "correctIndex": 1, "explanationAr": "تذكرة القطار هي Fahrkarte."},
  {"id": "imp-sie", "level": "A1", "topic": "الأمر بصيغة Sie", "promptDe": "___ bitte die Tür!", "options": ["Öffnest du", "Öffnet", "Öffnen Sie"], "correctIndex": 2, "explanationAr": "الأمر المهذب بصيغة Sie يبدأ بالفعل ثم الضمير: Öffnen Sie."},
  {"id": "prep-ins-kino", "level": "A1", "topic": "الحركة إلى مكان مع in", "promptDe": "Ich gehe ___ Kino.", "options": ["ins", "im", "in den"], "correctIndex": 0, "explanationAr": "الحركة إلى مكان مع in تأخذ Akkusativ، فتصبح «ins» = in das."},
  {"id": "pron-sie-akk", "level": "A1", "topic": "الضمير المفعول به المؤنث", "promptDe": "Kennst du die Frau? Ja, ich kenne ___.", "options": ["ihr", "sie", "ihn"], "correctIndex": 1, "explanationAr": "ضمير المفعول به للمؤنث هو «sie»."},
  {"id": "pron-mir", "level": "A1", "topic": "الضمير المفعول له Dativ", "promptDe": "Gibst du ___ das Buch?", "options": ["ich", "mich", "mir"], "correctIndex": 2, "explanationAr": "الإعطاء يأخذ Dativ، وضمير «أنا» في Dativ هو «mir»."},
  {"id": "pron-ihn", "level": "A1", "topic": "الضمير المفعول به المذكر", "promptDe": "Der Film ist gut. Ich finde ___ gut.", "options": ["ihn", "er", "ihm"], "correctIndex": 0, "explanationAr": "ضمير المفعول به للمذكر هو «ihn»."},
  {"id": "conj-weil", "level": "A1", "topic": "أداة السببية", "promptDe": "Ich bleibe zu Hause, ___ ich müde bin.", "options": ["wann", "weil", "ob"], "correctIndex": 1, "explanationAr": "«weil» تقدم السبب، وفي الجملة التابعة يأتي الفعل في آخرها."},
  {"id": "verb-geht-ihr", "level": "A1", "topic": "تصريف الفعل مع ihr", "promptDe": "Wohin ___ ihr am Samstag?", "options": ["gehen", "gehst", "geht"], "correctIndex": 2, "explanationAr": "مع «ihr» تكون صيغة gehen: geht."},
  {"id": "plural-aepfel", "level": "A1", "topic": "الجمع", "promptDe": "Ein Apfel, zwei ___.", "options": ["Äpfel", "Apfels", "Apfeln"], "correctIndex": 0, "explanationAr": "جمع Apfel هو Äpfel."},
  {"id": "plural-kinder", "level": "A1", "topic": "الجمع في Nominativ", "promptDe": "Viele ___ spielen im Park.", "options": ["Kinds", "Kinder", "Kindern"], "correctIndex": 1, "explanationAr": "جمع Kind هو Kinder، وفي Nominativ لا يأخذ -n."},
];
