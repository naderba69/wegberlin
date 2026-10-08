# فحص مصدري لبنك A1 الأصلي (`src/data/a1-original-exercise-bank.ts`)

الحالة بتاريخ 2026-10-08. الفحص **مصدري جزئي** وليس مراجعة بشرية، ولم يكتمل بعد.

المصدر: Duden Rechtschreibung (duden.de/rechtschreibung/…). الصفحات التي فُتحت وقُرئت: sprechen، helfen، Apfel، gehen، Kind، Bäckerei، Fahrkarte، abfahren، mögen، können، trinken، Dienstag، weil، Februar، haben_Vollverb، Tisch، kennen، sehen، fahren، arbeiten، wohnen، oeffnen، Zug_Kolonne، Schwester، Stadt، Tasche، Bus، Hund، zwanzig، zwölf، woher، wohin، Lehrerin، Wasser، Haus، Buch، Zeit، mir، ihn، aus_Praeposition، lesen_dozieren، spielen، halb_zur_Haelfte_teilweise، Film، sein_Hilfsverb، sein_Verb_Vollverb، sie، Frau. الصفحات غير الموجودة (404): lesen، gefallen، Mann، halb، Viertel، heißen، kosten، Zug، wo، wie، was، aus، nicht، wie_Adverb، nicht_Adverb، was_Pronomen.

صفحات لم تُفتح بالمعرّف الصحيح في Duden: lesen (lesen، lesen_Vollverb)، gefallen، Mann، halb (halb، halb_Adjektiv)، Viertel، heißen، kosten، Zug (Zug؛ Zug_Kolonne مفحوصة).

## بنود تحققت من مدخل مصدري واضح (33)

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
| num-12-8 | zwanzig: Zahlwort, Ziffer 20 (Duden) |
| num-3x4 | zwölf: Zahlwort, Ziffer 12 (Duden) |
| w-woher | woher: Adverb، «woher kommt der Lärm?» (von welchem Ort) |
| adj-kaltes-wasser | Wasser: das Wasser (Neutrum)، و«kaltes Wasser» في قائمة أمثلة Duden |
| adj-gross-haus | Haus: das Haus (Neutrum)، و«ein großes ... Haus» في أمثلة Duden |
| art-neuter-ein | Buch: das Buch (Neutrum)، و«ein dickes Buch» |
| neg-keine | Zeit: die Zeit (مؤنث)، و«keine Zeit haben» |
| nom-das-kind | Kind: das Kind (Neutrum) |
| prep-aus | aus: Präposition mit Dativ، Herkunft («kommt aus Hamburg») |
| pron-mir | mir: Dativ von ich |
| perf-gelesen | lesen: «hat gelesen» (Stammformen: liest, las, hat gelesen) |
| time-halb-drei | halb: «es ist halb eins» (halb + nächste Stunde)، و«es hat halb eins geschlagen» |
| pron-ihn | ihn: Akkusativ von er؛ Film: der Film (مذكر) |
| sein-ist | sein: Gleichsetzung 3. Person Singular («das ist die Hauptsache») |
| pron-sie-akk | sie: Akkusativ Femininum Singular («ich werde sie benachrichtigen»)؛ Frau: die Frau (مؤنث) |
| haben-haben | haben: «wir haben Sonntag»، و«Zeit, Muße haben» |
| dat-auf-dem-tisch | Tisch: der (مذكر)، و«das Essen steht auf dem Tisch» (auf + Dativ للمكان) |

## بنود تحقق جزء منها فقط (13)

| المعرّف | الجزء المؤكد / غير المؤكد |
| --- | --- |
| w-wo | woher/wohin: Duden unterscheidet «von welchem Ort» و«an welchen Ort»؛ مدخل «wo» (404) غير مفحوص |
| perf-habe | spielen: «Fußball spielen» (معنى الفعل مؤكد)؛ Perfekt mit haben غير مذكور في المدخل |
| verb-geht-ihr | gehen: «geht, ging, ist gegangen» (الصيغة الأساسية للمفرد)؛ صيغة ihr غير مذكورة صراحة |
| akk-masc-den | sehen: «den Film habe ich gesehen» (Akkusativ)؛ Mann غير مذكورة في المدخل |
| akk-fem-eine | Schwester: die Schwester (مؤنث)؛ صيغة Akkusativ «eine» غير مذكورة في المدخل |
| poss-meine | Tasche: die Tasche (مؤنث)؛ صيغة ضمير الملكية «meine» غير مذكورة |
| neg-keinen | Hund: der Hund (مذكر)، و«den Hund ausführen» (Akkusativ)؛ صيغة kein- غير مذكورة |
| prep-in-berlin | wohnen + in («in der Stadt wohnen»)؛ Berlin غير مذكورة في المدخل |
| imp-sie | öffnen: «die Tür öffnen» (متعدٍ)؛ صيغة الأمر بـSie غير مذكورة في المدخل |
| verb-spreche | sprechen: «spricht»، و«du sprichst»؛ صيغة ich غير مذكورة |
| dat-meiner-mutter | helfen + Dativ («jemandem helfen»)؛ صيغة «meiner» غير مذكورة |
| prep-ins-kino | حركة مع Akkusativ («ins Ausland gehen»)؛ «Kino» غير مذكورة |
| verb-trinken | trinken: «Kaffee trinken»؛ صيغة wir (= المصدر) غير مذكورة صراحة |

## بنود لم تُفحص بعد (4)

neg-nicht، w-wie، w-was-kostet، time-viertel-nach-acht

التحقق من الأعداد: 50 في الملف = 33 + 13 + 4.
