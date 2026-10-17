# التحقق المصدري لـ P0-98 وP0-99 — `source-verified-agent` (v225، 2026-10-17)

> **ما هذا وما ليس هو.** هذا تحقق أجراه الوكيل بقرار المالك (ADR-116): قارن كل سجل بمصدر خارجي مسمّى، وأصلح كل خطأ ظهر. **ليس مراجعة بشرية ألمانية مستقلة، ولا توقيعًا.** خانات المراجع في أوراق الحزمة (`reviewDecision` و`reviewerName`، إلخ) تبقى فارغة كما هي.

## الملفات

| الملف | الصفوف | المحتوى |
|---|---:|---|
| `source-verification-nouns-2026-10-17.csv` | 1,297 | كل مرساة اسم: النتيجة والمصدر والملاحظة |
| `source-verification-candidates-2026-10-17.csv` | 90 | 89 مرشحًا اسميًا + إطار واحد: الـLemma المحسوم والجنس والمصدر |
| `source-verification-frames-2026-10-17.csv` | 145 | 134 مرجع إطار (ومنها نطاق الجودة 126) + 11 استبعادًا |

## P0-98 — الأسماء (1,297)

**الطريقة:** مقابلة آلية لكل سجل (الجنس وصيغ الرفع والنصب والجر والجمع) مع WiktionaryDE عبر حزمة [`german_nouns` 1.2.5](https://pypi.org/project/german-nouns/) (CC BY-SA 4.0). وما ليس في القاموس من المركّبات قوبل بكلمته الأساسية: آخر جزء في المركّب يحدد الجنس والجمع (قاعدة Duden).

| النتيجة | العدد |
|---|---:|
| تطابق مباشر مع Wiktionary | 1,113 |
| تطابق عبر الكلمة الأساسية للمركّب | 174 |
| قاعدة اللواحق (‎-ung/-keit/-heit/-ik/-ion/-schaft/-tät‎ مؤنثة) | 8 |
| مؤكد بعد إصلاح (Erwachsene) | 1 |
| جمع تربوي مقصود (Rat ← Ratschläge بمعنى «نصيحة») | 1 |
| **غير محسوم** | **0** |

**أخطاء حقيقية أُصلحت في `src/data/lexical-grammar-b1.ts` و`lexical-grammar-b2.ts`:**

| السجل | كان | صار | الدليل |
|---|---|---|---|
| b2-16 Modalpartikel | neuter | feminine | Wiktionary f؛ نص الدرس نفسه «eine Modalpartikel»، وسجل b2-19 مؤنث |
| b2-14 Nominalcluster | neuter | masculine | Wiktionary «Cluster» m؛ نص الدرس «der/jeden Nominalcluster» |
| b1-01 Erwachsene | feminine مع نصب «die Erwachsenen» (خطأ) | masculine: der Erwachsene / den Erwachsenen / dem Erwachsenen | Wiktionary «Erwachsener» m، التصريف الضعيف |
| b2-09 Teilnehmende | feminine مع نصب «die Teilnehmenden» (خطأ) | masculine بالتصريف الضعيف نفسه | اسم مشتق من صفة مثل Erwachsener |
| b2-20 Öffnungszeiten | feminine مفرد، والجر «der Öffnungszeiten» (خطأ) | plural-only، والجر «den Öffnungszeiten» | جمع Zeit |
| b2-20 Sprachkenntnisse | feminine مفرد | plural-only | جمع Kenntnis |

أضيف إلى مولّد B2 دعم `plural-only`، مثل B1.

**المرشحون الـ89:** 66 مؤكدة في Wiktionary. و4 أخطاء من الكاشف، أداة تعود لاسم مجاور أو للجمع (Mittel وFreitag وMontag وProtokoll). و9 صيغ مصرّفة رُدّت إلى أصلها: Antrags وBescheids وAttests وKandidaten وZahlen وSeiten وUnterlagen وStudierendensekretariats وDaten. و8 مؤكدة في [DWDS](https://www.dwds.de/) (فحص 2026-10-09). و2 عبر الكلمة الأساسية: Audioaufnahme ← Aufnahme f، وFristversäumnis ← Versäumnis n، والنص يقول «trotz des Fristversäumnisses».

## P0-99 — الأطر (134 + 11 استبعادًا)

| فئة الدليل | العدد | المصادر |
|---|---:|---|
| موجود في قائمة منشورة | 81 | [QuillBot: 190 Verben mit Präpositionen](https://quillbot.com/de/blog/verben/verben-mit-praepositionen/) (مراجعة 29.06.2026)، [perfekt-deutsch](https://www.perfekt-deutsch.de/wissen/verben-mit-praepositionen/)، [aktiv-mit-deutsch B1](https://sb1bf4d6104a0d0d2.jimcontent.com/download/version/1620044354/module/11706724793/name/Liste_Verben%20Pr%C3%A4p._A2%20B1_AmD.pdf)، [deutschakademie](https://www.deutschakademie.de/online-deutschkurs/deutsche-grammatik/wortarten/verben/mit-praepositionen/) |
| حرف جر ذو حالة ثابتة (aus/bei/mit/nach/von/zu ← Dativ؛ für/um/gegen ← Akkusativ) | 24 | [korrektur.de](https://korrektur.de/uebersicht-praepositionen-und-kasus)، [Wikipedia: Präposition](https://de.wikipedia.org/wiki/Pr%C3%A4position) |
| مصدر محدد لكل فعل | 21 | [grammis IDS 3140](https://grammis.ids-mannheim.de/fragen/3140) (sich berufen auf + Akk)، [verben.de](https://www.verben.de/verben/verwendungen/eingehen.htm) (eingehen وreagieren وzurückgehen وzurückkommen وablesen وabstellen)، [grammatiktraining.de](https://grammatiktraining.de/verbenmitpr/verben-mit-praepositionen-liste.html)، [LEO](https://dict.leo.org/german-english/sich%20an%20etw.%20halten) (sich halten an + Akk، sich anschließen an + Akk)، [DWDS anknüpfen](https://www.dwds.de/wb/ankn%C3%BCpfen)، [deutschesinstitut.it](https://www.deutschesinstitut.it/verben-mit-praposition/) (übersetzen in وschreiben an + A) |
| قاعدة Wo/Wohin أو القياس | 8 | [perfekt-deutsch: Wechselpräpositionen](https://www.perfekt-deutsch.de/wissen/wechselpraepositionen/)، grammis IDS 3140 (umwandeln in + Akk) |
| استبعاد مؤكد | 11 | [DWDS vorliegen](https://www.dwds.de/wb/vorliegen)، [verbformen ausreichen](https://www.verbformen.com/conjugation/ausreichen.htm)، [lernlaterne: Funktionsverbgefüge](https://www.lernlaterne.de/deutsch/grammatik/funktionsverbgefuege)، [deutschegrammatik20](https://deutschegrammatik20.de/spezielle-verben/feste-nomen-verb-verbindungen-funktionsverbgefuege/die-bedeutung-der-nomen-verb-verbindungen-funktionsverbgefuege/) |

**أطر خاطئة أُصلحت في `src/data/lexical-grammar-b2.ts`:**

| الإطار | المشكلة | الإصلاح |
|---|---|---|
| b2-15 «sich an den eigenen Plan halten» | سُجّلت الحالة Dativ، وكانت ملاحظة التباين **تعلّم الخطأ**: «يطلب Dativ: an dem Plan، لا an den Plan» | Akkusativ، وصُحّحت الملاحظة (LEO وLangenscheidt وPONS: sich^acc an etw.^acc halten) |
| b2-20 «eine Anmerkung an die Beschlusslage angrenzen» | المثال غير نحوي («Die Anmerkung grenzt die Kommission … an»)، ونص الدرس يقول «anknüpfen» | «anknüpfen an + Akk» (DWDS: etw. an etw. knüpfen) |
| b2-20 «eine Angabe um ein Wort zählen» | ليس تركيبًا ألمانيًا («zählt man um einen Hinweis mehr») | «zu den Pflichtangaben zählen» (zählen zu + Dativ؛ zu تطلب الجر دائمًا. ملاحظة: قائمة QuillBot تضع «zählen zu» خطأً مع الأكوزاتيف) |
| b2-24 «den Satz an das Zitat schließen» | ينقصه الجزء المنفصل؛ المقصود «sich anschließen an» | «sich an das Zitat anschließen» + المثال «… schließt sich … an» (LEO) |

**أثر جانبي:** سقط إطار سياقي واحد من عدّاد الكاشف، فصارت الأطر 1,277/1,142 بدل 1,278/1,143.

## ما لا يغطيه هذا التحقق

- لا يحكم هذا التحقق على الأسلوب أو مستوى الدرس أو اختيار المفردات التعليمية. ما فُحص هو صحة القواعد: الجنس والجمع والحالة وحكم حرف الجر.
- المراجعة الألمانية المستقلة تبقى مستحسنة، لكنها لم تعد شرط إغلاق بقرار المالك.
