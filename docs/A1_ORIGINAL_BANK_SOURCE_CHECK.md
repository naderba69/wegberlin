# فحص مصدري لبنك A1 الأصلي (`src/data/a1-original-exercise-bank.ts`)

الحالة بتاريخ 2026-10-08. الفحص **مصدري جزئي** وليس مراجعة بشرية، ولم يكتمل بعد.

المصدر: Duden Rechtschreibung (duden.de/rechtschreibung/…). الصفحات المفحوصة: sprechen، helfen، Apfel، gehen، Kind، Bäckerei، Fahrkarte، abfahren، mögen، können، trinken، Dienstag، weil، Februar، sein (Hilfsverb).

صفحات لم تُفتح بالمعرّف الصحيح في Duden: lesen (lesen، lesen_Vollverb)، gefallen، Mann، halb (halb، halb_Adjektiv)، Viertel.

## بنود تحققت من مدخل مصدري واضح (15)

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
| haben-haben | haben: «wir haben Sonntag»، و«Zeit, Muße haben» |
| dat-auf-dem-tisch | Tisch: der (مذكر)، و«das Essen steht auf dem Tisch» (auf + Dativ للمكان) |

## بنود تحقق جزء منها فقط (4)

| المعرّف | الجزء المؤكد / غير المؤكد |
| --- | --- |
| verb-spreche | sprechen: «spricht»، و«du sprichst»؛ صيغة ich غير مذكورة |
| dat-meiner-mutter | helfen + Dativ («jemandem helfen»)؛ صيغة «meiner» غير مذكورة |
| prep-ins-kino | حركة مع Akkusativ («ins Ausland gehen»)؛ «Kino» غير مذكورة |
| verb-trinken | trinken: «Kaffee trinken»؛ صيغة wir (= المصدر) غير مذكورة صراحة |

## بنود لم تُفحص بعد (31)

art-neuter-ein، akk-fem-eine، akk-masc-den، dat-in-der، dat-mit-dem، nom-das-kind، neg-keinen، poss-meine، prep-in-berlin، prep-aus، verb-arbeitet، sein-ist، perf-habe، perf-gelesen، neg-keine، neg-nicht، w-wie، w-wo، w-woher، w-was-kostet، num-12-8، num-3x4، time-halb-drei، time-viertel-nach-acht، adj-gross-haus، adj-kaltes-wasser، imp-sie، pron-sie-akk، pron-mir، pron-ihn، verb-geht-ihr

التحقق من الأعداد: 50 في الملف = 15 + 4 + 31.
