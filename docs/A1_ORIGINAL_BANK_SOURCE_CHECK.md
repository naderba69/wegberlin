# فحص مصدري لبنك A1 الأصلي (`src/data/a1-original-exercise-bank.ts`)

الحالة بتاريخ 2026-10-08. الفحص **مصدري جزئي** وليس مراجعة بشرية، كل البنود فُحصت مرة واحدة على الأقل، و5 منها مؤكد جزئيًا فقط.

المصدر: Duden Rechtschreibung (duden.de/rechtschreibung/…). الصفحات التي فُتحت وقُرئت: nicht، was، Viertel، wie (DWDS)، Kino، kosten، öffnen، Berlin (DWDS)، eine/der (DWDS Artikel)، sprechen/trinken/gehen/spielen/meine (DWDS Flexion)، sprechen، helfen، Apfel، gehen، Kind، Bäckerei، Fahrkarte، abfahren، mögen، können، trinken، Dienstag، weil، Februar، haben_Vollverb، Tisch، kennen، sehen، fahren، arbeiten، wohnen، oeffnen، Zug_Kolonne، Schwester، Stadt، Tasche، Bus، Hund، zwanzig، zwölf، woher، wohin، Lehrerin، Wasser، Haus، Buch، Zeit، mir، ihn، aus_Praeposition، lesen_dozieren، spielen، halb_zur_Haelfte_teilweise، Film، sein_Hilfsverb، sein_Verb_Vollverb، sie، Frau. مصدر إضافي DWDS (wb/nicht، wb/was، wb/Viertel، wb/wie). الصفحات غير الموجودة في Duden (404): lesen، gefallen، Mann، halb، Viertel، heißen، kosten، Zug، wo، wie، was، aus، nicht، wie_Adverb، nicht_Adverb، was_Pronomen.

## بنود تحققت من مدخل مصدري واضح (45)

| المعرّف | ما تأكد من المصدر |
| --- | --- |
| verb-sprichst | sprechen: «du sprichst» |
| plural-aepfel | Apfel: «Genitiv des Apfels، Plural die Äpfel» |
| plural-kinder | Kind: «die Kinder» في الأمثلة، و«Kind, das» محايد |
| perf-sind | gehen: «ich bin den Weg … gegangen» مع sein |
| voc-arzt | gehen: «zum Arzt gehen» |
| voc-baeckerei | Bäckerei: مؤنث، «Betrieb, in dem Backwaren … verkauft werden» |
| voc-fahrkarte | Fahrkarte: مؤنث، «eine Fahrkarte lösen» |
| sep-faehrt | abfahren: «der Bus fährt gleich ab» (Perfekt mit ist) |
| modal-kann | können: «sie kann gut turnen»، «ich kann» |
| modal-moechte | mögen: «sie möchte Herrn Meier sprechen» |
| weekday-after-montag | Dienstag: «zweiter Tag der mit Montag beginnenden Woche» |
| month-after-januar | Februar: «zweiter Monat im Jahr» |
| conj-weil | weil: Konjunktion für Gliedsätze |
| verb-arbeitet | arbeiten: «arbeitet, arbeitete, hat gearbeitet»؛ و«in einer Fabrik arbeiten» |
| dat-in-der | wohnen: «in der Stadt wohnen»، و Stadt: die Stadt (مؤنث) |
| dat-mit-dem | Bus: der Bus (مذكر)، و«mit dem Bus fahren» |
| num-12-8 | zwanzig: Zahlwort، Ziffer 20 (Duden) |
| num-3x4 | zwölf: Zahlwort، Ziffer 12 (Duden) |
| w-woher | woher: Adverb، «woher kommt der Lärm?» (von welchem Ort) |
| adj-kaltes-wasser | Wasser: das Wasser (Neutrum)، و«kaltes Wasser» في قائمة أمثلة Duden |
| adj-gross-haus | Haus: das Haus (Neutrum)، و«ein großes ... Haus» في أمثلة Duden |
| art-neuter-ein | Buch: das Buch (Neutrum)، و«ein dickes Buch» |
| neg-keine | Zeit: die Zeit (مؤنث)، و«keine Zeit haben» |
| nom-das-kind | Kind: das Kind (Neutrum) |
| prep-aus | aus: Präposition mit Dativ، Herkunft («kommt aus Hamburg») |
| pron-mir | mir: Dativ von ich |
| perf-gelesen | lesen: «hat gelesen» (Stammformen: liest, las, hat gelesen) |
| pron-ihn | ihn: Akkusativ von er؛ Film: der Film (مذكر) |
| sein-ist | sein: Gleichsetzung 3. Person Singular («das ist die Hauptsache») |
| pron-sie-akk | sie: Akkusativ Femininum Singular («ich werde sie benachrichtigen»)؛ Frau: die Frau (مؤنث) |
| time-viertel-nach-acht | Viertel: «es ist (ein) Viertel nach, vor zehn (Uhr)» (DWDS) |
| w-wie | wie: Fragewort «wie heißen Sie?» (DWDS) |
| haben-haben | haben: «wir haben Sonntag»، و«Zeit, Muße haben» |
| dat-auf-dem-tisch | Tisch: der (مذكر)، و«das Essen steht auf dem Tisch» (auf + Dativ للمكان) |
| verb-spreche | sprechen: Präsens 1. Person Singular «spreche» (DWDS Flexion) |
| verb-trinken | trinken: Präsens 1. Person Plural «trinken» (DWDS Flexion) |
| verb-geht-ihr | gehen: Präsens 2. Person Plural «geht» (DWDS Flexion)؛ wohin: «wohin gehst du?» (Duden) |
| perf-habe | spielen: Präsensperfekt «habe gespielt» (DWDS Flexion) |
| poss-meine | meine: Possessivpronomen Nominativ Femininum Singular «meine» (DWDS Flexion)؛ Tasche: die Tasche (مؤنث) |
| akk-masc-den | der (Artikel): Akkusativ Maskulinum «den» (DWDS Flexion)؛ Mann: Substantiv Maskulinum (DWDS) |
| akk-fem-eine | ein (Artikel): Akkusativ Femininum «eine» (DWDS Flexion)؛ Schwester: die Schwester (مؤنث) |
| prep-ins-kino | Kino: das Kino (Neutrum)، و«ins Kino gehen» (DWDS) |
| neg-nicht | nicht: Adverb، «das Wetter ist nicht schön»، «er ist nicht dumm» (DWDS) |
| w-was-kostet | was: Fragepronomen («was ist das?» DWDS)؛ kosten: «kostet» 3. Person Singular (DWDS) |
| w-wo | wohnen: «wo wohnst du?» (Duden)؛ woher/wohin تفرّقان الاتجاه (Duden) |

## بنود تحقق جزء منها فقط (5)

| المعرّف | الجزء المؤكد / غير المؤكد |
| --- | --- |
| neg-keinen | Hund: der Hund (مذكر)، والإدخال Akkusativ؛ kein- Akkusativ Maskulinum: DWDS لا يملك جدول kein (404-like) |
| prep-in-berlin | wohnen + in («in der Stadt wohnen») مؤكد؛ Berlin: DWDS يذكر Neutrum ohne Artikel، ولا يذكر «in Berlin» |
| imp-sie | öffnen: «die Tür öffnen» (مؤكد)؛ صيغة Imperativ Sie غير مذكورة في جدول DWDS |
| dat-meiner-mutter | helfen + Dativ (Duden)؛ meiner Dativ Femininum (DWDS)؛ Mutter: Duden 404، جنسها غير مفحوص |
| time-halb-drei | halb: «es ist halb eins» و«es hat halb eins geschlagen» (Duden)؛ «halb drei» غير مذكورة حرفيًا |

## بنود لم تُفحص بعد (0)



التحقق من الأعداد: 50 في الملف = 45 + 5 + 0.
