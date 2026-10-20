# حالة إنتاج صوت الامتحان

Sync batch: v253 · 2026-10-20 · تدقيق دروس B1 وB2 الباقية (ADR-144): قُرئت بطاقات الدروس الـ43 التي لم تُدقَّق بعد (451 بطاقة)، فوُحّد 59 معنى كان مختلفًا بين صفحة المفردات والبطاقة، وتُرجمت جمل درس b2-19 الـ18 بعد أن كانت تصف النبرة فقط، وأُكمل أو صُحّح 46 مثالًا (منها 19 مثالًا ناقصًا ينتهي بـ«…» ومثال لا علاقة له بكلمته). الحارس الدائم يغطي الآن الدروس الـ96 كلها. لم يُرفع أي سقف.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

New longer-input bank: 8 device-TTS-only tasks; 0 new MP3 or human recordings. Existing 96 lesson / 80 library / 96 exam MP3 files remain synthetic with review pending.

آخر تحديث: 2026-09-20 مقابل `v138`. القسم التاريخي أدناه يبقى كما قيس يومها، وتلي جدولَ الحالة طبقةُ totals المقيسة الآن.

## تحديث v224 (2026-10-17): عشرة مقاطع استماع في المحاكاة الكاملة السادسة مصحّحة بصوت مُعاد توليده

- **Goethe 06:**
  - `g6-h1-1` إلى `g6-h1-5`: أُكملت الأدوات والأفعال الناقصة («Freitag um elf im Raum vier» ⇒ «am Freitag um elf Uhr in Raum vier»، «nicht in Süd; nutzen Sie Bus acht» ⇒ «nicht am Bahnhof Süd; nutzen Sie bitte die Buslinie acht»، «Anmeldung bis Mittwoch» ⇒ «anmelden kann man sich bis Mittwoch»).
  - `g6-h2`: أسئلة المذيع كانت كلمة واحدة («Auswahl?»، «Problem?»، «Erfolg?»)، فصارت أسئلة كاملة، وصار الجواب الأخير جملة تامة.
  - `g6-h3`: قُدّم المتحدثان بجملة كاملة، و«Pflege» ⇒ «die Pflege»، و«Überleben und Schatten» ⇒ «das Überleben der Bäume und der Schatten».
- **telc 06:**
  - `t6-h1`: كانت الأخبار مختصرة («Drittens ist der Kurs kostenlos mit Anmeldung.»)، فصارت أخبارًا كاملة.
  - `t6-h2`: كان الحوار برقيًا («B: Abends? A: Nach neuer Werbung stärker.»)، فصار حوارًا طبيعيًا بين Sara وBen. الحقائق والإجابات لم تتغير.
  - `t6-h3-3`: «im Raum neun» ⇒ «in Raum neun». الإعلانات الأربعة الأخرى سليمة فبقيت بصوتها القديم.
- `g6-h4` سليم نحويًا فبقي بصوته.
- صُحّح النص أولًا، ثم وُلّدت منه 20 ملفًا (10 MP3 و10 Opus) بالصوت نفسه الذي اختاره المالك في v221 (`german-educational-feminine-06`، `Arena.ai speech synthesis`)، بتاريخ `generatedAt` `2026-10-17`. وأُضيفت المعرّفات العشرة إلى `regeneratedFileIdsV221` في المولّد.
- الإجمالي المقيس: 544 ملف MP3+Opus / **54,036,433** بايتًا (كان 53,832,960)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 2.3–50.0 ثانية، ونحو 15 حرفًا في الثانية، والمتوسط بين −19.7 و−20.4 dB، ولا صمت يتجاوز 1.5 ثانية. الاستماع البشري مفتوح.

## تحديث v223 (2026-10-17): ستة مقاطع استماع في المحاكاة الكاملة الخامسة مصحّحة بصوت مُعاد توليده

- **Goethe 05:**
  - `g5-h1-3`: «Nach Zentrum fahren Sie…» ⇒ «Ins Zentrum fahren Sie mit der Linie sechs weiter.».
  - `g5-h2`: أسئلة المذيع كانت برقية («Wer prüft?»، «Häufigster Fehler?»، «Was messen Sie?»)، فصارت أسئلة كاملة، وصار الجواب الأخير جملة تامة («Wir zählen nicht nur verteilte Blätter, sondern auch …»).
  - `g5-h3`: أُكملت الأدوات الناقصة («Im Pilot sanken Beschwerden» ⇒ «Im Pilotversuch sanken die Beschwerden»، «besser als Ausschluss» ⇒ «besser als ein Ausschluss»، «Personal muss …» ⇒ «Das Personal muss …»)، وقُدّم المتحدثان بجملة كاملة.
  - `g5-h4`: «erfüllt Sicherheit, Orientierung und Gestaltung» ⇒ «dient der Sicherheit, der Orientierung und der Gestaltung»، و«Ein Pilot dimmte Lampen» ⇒ «In einem Pilotprojekt wurden die Lampen … gedimmt»، و«Messung … Rückmeldung» ⇒ «Messungen … Rückmeldungen».
- **telc 05:**
  - `t5-h1`: كانت الأخبار كلمات مفتاحية («Drittens ist der Kurs online.»)، فصارت جملًا خبرية كاملة.
  - `t5-h2`: كان الحوار برقيًا («B: Preis? A: Zwölf Euro monatlich.»)، فصار حوارًا طبيعيًا بين Mira وJonas. الحقائق والإجابات لم تتغير.
  - إعلانات Hörverstehen 3 الخمسة سليمة نحويًا، فبقيت بصوتها القديم؛ صُحّحت عباراتها المكتوبة فقط.
- صُحّح النص أولًا، ثم وُلّدت منه 12 ملفًا (6 MP3 و6 Opus) بالصوت نفسه الذي اختاره المالك في v221 (`german-educational-feminine-06`، `Arena.ai speech synthesis`)، بتاريخ `generatedAt` `2026-10-17`. وأُضيفت المعرّفات الستة إلى `regeneratedFileIdsV221` في المولّد.
- الإجمالي المقيس: 544 ملف MP3+Opus / **53,832,960** بايتًا (كان 53,564,348)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 5.2–51.6 ثانية، ونحو 15 حرفًا في الثانية، والمتوسط بين −20.0 و−20.2 dB، ولا صمت يتجاوز 1.2 ثانية. الاستماع البشري مفتوح.

## تحديث v222 (2026-10-17): ستة مقاطع استماع في المحاكاة الكاملة الرابعة مصحّحة بصوت مُعاد توليده

- **Goethe 04:**
  - `g4-h2`: أسئلة المذيع كانت كلمات مفردة («Warum?»، «Ergebnis?»، «Änderung?»، «Erfolg?»)، فصارت أسئلة كاملة، وصار الجواب الأخير جملة تامة.
  - `g4-h3`: «Frau König leitet Personal» ⇒ «leitet die Personalabteilung»، و«über Fortsetzung» ⇒ «über die Fortsetzung».
- **telc 04:**
  - `t4-h1`: كانت الأخبار كلمات مفتاحية («Drittens braucht der Vortrag Anmeldung.»)، فصارت جملًا خبرية كاملة.
  - `t4-h2`: كان الحوار برقيًا («B: Morgens? A: Dienstag am stärksten»)، فصار حوارًا طبيعيًا بين Lena وTom. الحقائق والإجابات لم تتغير.
  - `t4-h3-4` و`t4-h3-5`: «Das Paket braucht keinen Ausdruck, nur Code.» ⇒ «Für das Paket brauchen Sie keinen Ausdruck, nur den Code.»، و«Der Markt beginnt später um zehn.» ⇒ «Der Markt beginnt heute später, erst um zehn Uhr.». بقية إعلانات Hörverstehen 3 الثلاثة بصوتها القديم، لأن نصوصها سليمة، والإعلانات المنفصلة بأصوات مختلفة واقعية.
- صُحّح النص أولًا، ثم وُلّدت منه 12 ملفًا (6 MP3 و6 Opus) بالصوت نفسه الذي اختاره المالك في v221 (`german-educational-feminine-06`، `Arena.ai speech synthesis`)، بتاريخ `generatedAt` `2026-10-17`. وأُضيفت المعرّفات الستة إلى `regeneratedFileIdsV221` في المولّد.
- الإجمالي المقيس: 544 ملف MP3+Opus / **53,564,348** بايتًا (كان 53,339,505)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 3.2–53.5 ثانية، ونحو 15 حرفًا في الثانية، والمتوسط بين −19.5 و−20 dB، ولا صمت يتجاوز 1.2 ثانية. الاستماع البشري مفتوح.

## تحديث v221 (2026-10-17): خمسة نصوص استماع في المحاكاة الكاملة الثالثة مصحّحة بصوت مُعاد توليده

- **Goethe 03:**
  - `g3-h1-2`: كان النص يقول «vollständig» ثم يذكر دفترًا يصل لاحقًا، فصار «fast vollständig eingetroffen».
  - `g3-h2`: أسئلة المذيعة كانت كلمات مفردة («Tickets?»، «Sicherheit?»)، فصارت أسئلة كاملة. وصُحّحت أيضًا جملة «Beleuchtete Haltebereiche … sind auf Wunsch möglich».
  - `g3-h3`: «Ich brauche Schatten wichtiger als …» غير سليمة نحويًا، فصارت «Schatten ist mir wichtiger als …». وتحوّل «beobachtet» إلى صيغة Sie، لأن المتحدث يخاطب المسؤولة.
- **telc 03:**
  - `t3-h1`: كانت الأخبار كلمات مفتاحية («kostenlos, Anmeldung nötig»)، فصارت جملًا خبرية كاملة.
  - `t3-h2`: كان الحوار برقيًا («B: Preis? A: …»)، فصار حوارًا طبيعيًا بين Ben وSara، والحقائق والإجابات لم تتغير.
- صُحّح النص أولًا، ثم وُلّدت منه 10 ملفات (5 MP3 و5 Opus) بصوت جديد اختاره المالك في جولة استماع (`german-educational-feminine-06`، `Arena.ai speech synthesis`)، بتاريخ `generatedAt` `2026-10-17`. وسُجّلت المعرّفات الخمسة في المولّد (`regeneratedFileIdsV221`).
- الإجمالي المقيس: 544 ملف MP3+Opus / **53,339,505** بايتًا (كان 53,154,679؛ صار الحواران أطول لأنهما جمل كاملة)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 6.7–62.8 ثانية، ونحو 15–16 حرفًا في الثانية، والمتوسط بين −19 و−20 dB، ولا صمت يتجاوز 1.2 ثانية. الاستماع البشري مفتوح.

## تحديث v220 (2026-10-17): لا تغيير في الصوت

- رُوجعت نصوص استماع المحاكاة الكاملة الثانية الثمانية سطرًا سطرًا، ولم يلزم تصحيح نص، فلم يُعَد توليد أي ملف. الإجمالي بلا تغيير: 544 ملف MP3+Opus / **53,154,679** بايتًا.
- مؤجّل وموثّق: «braucht kalibrierendes Vertrauen» في `goethe-b2-full-02-listening-04` غير مألوفة لكنها مصطلح من علم التعلم ولا يعتمد عليها سؤال؛ تغييرها يستلزم إعادة توليد صوت المحاضرة.

## تحديث v219 (2026-10-17): نصّا استماع امتحانيان مصحّحان بصوت مُعاد توليده

- **الامتحان:**
  - `goethe-h4-wayfinding-lecture`، بمقاطعه الثلاثة: صُحّحت جملة غير سليمة نحويًا («die Oberseite der Karte»).
  - `telc-h2-mobility-dialogue`، بمقطعيه: «Beschäftigte aus Randzeiten» ⇒ «mit sehr frühen oder späten Arbeitszeiten».
  - صُحّح النص أولًا، ثم وُلّدت منه 10 ملفات (5 MP3 و5 Opus) بالصوت الذي اختاره المالك (`german-educational-feminine-05`، `Arena.ai speech synthesis`)، بتاريخ `generatedAt` `2026-10-17`.
- الإجمالي المقيس بعد البناء: 544 ملف MP3+Opus / **53,154,679** بايتًا (كان 53,190,199)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 44–55 ثانية لكل مقطع، و15.6–17.6 حرفًا في الثانية، والمتوسط نحو −20 dB، ولا صمت طويل. الاستماع البشري مفتوح.
- صار مولّد مانيفست الامتحان يحفظ تاريخ إعادة التوليد والوسم. ما زال لا يكتب حقول Opus، فحُدّثت البنود الخمسة مباشرة.

## تحديث v218 (2026-10-16): نص استماع مكتبة مصحّح بصوت مُعاد توليده

- المكتبة: `lib-l-b2-09`، وفيه «beide Ausgangswerte» ⇒ «Ausgangs- und Endwert». صُحّح النص أولًا، ثم وُلّد منه ملفان (MP3 وOpus) بصوت اختاره المالك في اختبار صوتي جديد (`Arena.ai speech synthesis`).
  - وُسم `voiceProfile` بـ`german-educational-feminine-05`، لأنه قد يختلف عن صوت بنود المكتبة الـ79 الأخرى (`-01`).
  - `generatedAt` هو `2026-10-16`.
- الإجمالي المقيس بعد البناء: 544 ملف MP3+Opus / **53,190,199** بايتًا (كان 53,181,499)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط: 16.99 ثانية، ونحو 15 حرفًا في الثانية، والمتوسط −20.4 dB، ولا صمت طويل. الاستماع البشري مفتوح.
- قيد قائم: مولّد مانيفست المكتبة لا يكتب حقول Opus، فحُدّث البند في المانيفست مباشرة.

## تحديث v214 (2026-10-16): ثمانية نصوص استماع أخرى مصحّحة بصوت مُعاد توليده

- الدروس: `a2-02` و`b2-11` و`b2-15` و`b2-16` و`b2-18` و`b2-22` و`b2-23` و`b2-24`، بعد مراجعة سطرًا سطرًا لكل نصوص الاستماع الـ 96. صُحّح النص أولًا ثم وُلّد الصوت منه (16 ملفًا: 8 MP3 و8 Opus) بالصوت نفسه `german-educational-feminine-04` (`Arena.ai speech synthesis`)، ضمن دفعة المانيفست 2026-10-16.
- الإجمالي المقيس بعد البناء: 544 ملف MP3+Opus / **53,181,499** بايتًا (كان 53,193,753)، تحت السقف الآمن 59,500,000.
- الفحص آلي فقط (المدة، كثافة 15–17 حرفًا/ثانية، لا صمت طويل، المتوسط نحو −20 dB). الاستماع البشري مفتوح.

## تحديث v212 (2026-10-16): سبعة نصوص استماع مصحّحة بصوت مُعاد توليده

- الدروس: `a1-12` و`a1-17` و`b2-14` و`b2-17` و`b2-20` و`b2-21` و`b2-24`. صُحّح النص المكتوب أولًا، ثم وُلّد الصوت من النص المصحّح نفسه (14 ملفًا: 7 MP3 و7 Opus) بالصوت `german-educational-feminine-04` (`Arena.ai speech synthesis`) الذي اختاره المالك في المحادثة.
- الإجمالي المقيس بعد البناء: 544 ملف MP3+Opus / **53,193,753** بايتًا (كان 52,943,843)، تحت السقف الآمن 59,500,000.
- فحص آلي فقط (المدة، كثافة الحروف، الصمت، مستوى الصوت). الاستماع البشري ما زال مفتوحًا لهذه الملفات كما لبقية الصوت.

## الحالة الحالية

- مهام الاستماع الكلية: 42.
- التدريبات المستهدفة المكتملة بملفات MP3: 7/7.
- مهام المحاكاة الكاملة المكتملة بملفات MP3: 35/35.
- مهام المحاكاة الكاملة المتبقية: 0.
- ملفات MP3 الحالية: 96.
- المقاطع المنطقية المغطاة: 90/90.
- المقاطع المنطقية المتبقية: 0.
- الملفات الفيزيائية المتبقية: 0.

اكتمل الصوت الاصطناعي لكل مهام الاستماع المستهدفة ولكل مهام المحاكاة الكاملة لدى Goethe وtelc. تتضمن الملفات الفيزيائية الستة الزائدة على عدد المقاطع المنطقية Segments مرتبة للمقاطع الطويلة.

## الطبقات الصوتية الثلاث عند v138 (قيس 2026-09-20)

ملفات MP3 في `public/audio` = 272، ومقابلها 272 بديل Ogg Opus، أي 544 ملفًا و52,943,843 بايتًا أصلية و937,466 بايتًا gzip للمنهاج الصوتي. التوزيع: 96 للامتحان و96 للدروس و80 للمكتبة. السقف 70 ميغابايت بقرار ADR-076 وADR-077، والهامش المحترم الآن 15%.

هذه الطبقات كلها مولَّدة وآلية التحقق من البنية (طول، تسلسل مقاطع، checksum، كثافة كلمات)؛ ولا تعني أن الاستماع البشري وقع. بند «مراجعة صوتية بشرية» ما زال مفتوحًا، ولا يُقفل إلا بتوقيع مسمًّى.

## سرعات الاستماع التعليمية

يوحّد `learning-playback-speed-v1` السرعات 0.75×/1×/1.15× في التهيئة والتشخيص والدروس والمكتبة والتدريب الامتحاني الموجّه وShadowing، مع طلب `preservesPitch=true` وتمرير السرعة نفسها إلى Browser TTS والمقاطع الامتحانية المتسلسلة. تبقى البروفة الزمنية المتصلة على 1×، ولا تتغير تسجيلات المتعلم.

هذا تنفيذ تقني مختبر آليًا، وليس حكمًا بأن التبطئة والتسريع خاليان من التشويه على كل جهاز وصوت. تُفحص السرعات فعليًا ضمن المراجعة الصوتية النهائية.

## مراحل الإغلاق المتبقية

1. **مراجعة صوتية بشرية:** وضوح النطق، الأرقام، الأسماء، الوقفات، وسلامة مطابقة الصوت للنص، إضافة إلى تشويه 0.75× و1.15× على أجهزة وأصوات TTS ممثلة. الملفات الحالية اصطناعية وأحادية المتحدث وليست صوت امتحان رسميًا.
2. **إنتاج/مراجعة متعدد المتحدثين إن توفر مورد مجاني مرخّص:** خصوصًا الحوارات والمقابلات؛ ليس شرطًا لتشغيل التطبيق الحالي لكنه مهم لجودة الاستعداد السمعي.
3. **مراجعة أكاديمية مستقلة:** مستوى CEFR، دقة الشرح العربي، ومفاتيح الإجابة.
4. **مراجعة حقوق التوزيع:** ملفات المشروع موسومة `generated-for-project-review-required` ولا يجوز افتراض صلاحية التوزيع التجاري قبل مراجعة شروط مزود التوليد.
5. **GitHub وVercel:** الكود مهيأ، لكن الرفع والنشر الفعليان يحتاجان مستودعًا وحسابات/صلاحيات المستخدم.

## حدود ليست منجزة ولا يُدّعى وجودها

- لا توجد تسجيلات بشرية أو صوت رسمي من Goethe أو telc.
- لا يوجد شريك محادثة حي.
- لا توجد درجة نطق صوتية موثقة.
- لا توجد مراقبة امتحان رسمية أو Browser lockdown كامل.
- لا توجد مراجعة بشرية مستقلة مكتملة حتى الآن.

## User-reported Full 02 truncation audit — 2026-09-02

The speech-generation UI excerpts for several Full 02 clips appeared visually truncated (notably `t2-h2` after “aber nur” and `g2-h1-4` after “Wer”). The committed files are present and materially longer than those excerpts:

```text
g2-h1-1  13.848 s
g2-h1-2  13.632 s
g2-h1-3  14.328 s
g2-h1-4  12.720 s — source ends “eine Erstattung beantragen.”
g2-h1-5  12.648 s
g2-h2     81.192 s — source ends “warum etwas übrig bleibt.”
g2-h3     60.768 s — source ends “die Jugendlichen selbst.”
g2-h4    100.632 s across 2 ordered segments — source ends “Leistung nach einem Abstand.”
t2-h1     25.032 s — source ends “bis Montag möglich.”
t2-h2     48.552 s — source ends “Nutzung ohne Onlinekonto.”
```

Automated checks now enforce, for every one of the 90 logical exam clips:

- complete physical segment chain;
- MP3 frame-chain, byte-size, duration, checksum, and payload variation;
- transcript-character and word density within conservative speech bounds;
- explicit source-ending assertions for the reported Full 02 clips.

This makes a grossly truncated file fail CI. It does **not** prove by itself that every final word is pronounced correctly: exact content equivalence still needs independent human listening or a validated speech-to-text alignment review. The files remain synthetic, single-speaker, and `examGrade: false`.
