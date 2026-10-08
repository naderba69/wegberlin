# فحص مصدري لبنك A1 الأصلي (`src/data/a1-original-exercise-bank.ts`)

الحالة بتاريخ 2026-10-08. الفحص **مصدري جزئي** وليس مراجعة بشرية، ولم يكتمل بعد.

المصدر: Duden Rechtschreibung (duden.de/rechtschreibung/…). الصفحات المفحوصة: arbeiten، wohnen، sehen، fahren، kennen، öffnen، Stadt، Schwester، Tasche، Hund، Bus، Zug_Kolonne، haben_Vollverb، sprechen، helfen، Apfel، gehen، Kind، Bäckerei، Fahrkarte، abfahren، mögen، können، trinken، Dienstag، weil، Februar، sein (Hilfsverb).

صفحات لم تُفتح بالمعرّف الصحيح في Duden: lesen (lesen، lesen_Vollverb)، gefallen، Mann، halb (halb، halb_Adjektiv)، Viertel، heißen، kosten، Zug (Zug؛ Zug_Kolonne مفحوصة).

## بنود تحققت من مدخل مصدري واضح (18)

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
| haben-haben | haben: «wir haben Sonntag»، و«Zeit, Muße haben» |
| dat-auf-dem-tisch | Tisch: der (مذكر)، و«das Essen steht auf dem Tisch» (auf + Dativ للمكان) |

## بنود تحقق جزء منها فقط (10)

| المعرّف | الجزء المؤكد / غير المؤكد |
| --- | --- |
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

## بنود لم تُفحص بعد (22)

art-neuter-ein، nom-das-kind، prep-aus، sein-ist، perf-habe، perf-gelesen، neg-keine، neg-nicht، w-wie، w-wo، w-woher، w-was-kostet، num-12-8، num-3x4، time-halb-drei، time-viertel-nach-acht، adj-gross-haus، adj-kaltes-wasser، pron-sie-akk، pron-mir، pron-ihn، verb-geht-ihr

التحقق من الأعداد: 50 في الملف = 18 + 10 + 22.
