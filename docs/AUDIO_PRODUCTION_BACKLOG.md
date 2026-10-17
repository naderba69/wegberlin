# حالة إنتاج صوت الامتحان

Sync batch: v219 · 2026-10-17 · مراجعة بنك الامتحان (المهام الموجّهة الـ24 وبيانات المحاكيات) سطرًا سطرًا: 4 بنود ذات جوابين محتملين أُغلقت (من قال ذلك ×2، wenn/falls، Obwohl⇐Da)، ونصّا استماع صُحّحا وأُعيد توليد 5 مقاطع صوتية، وادعاء «Browser TTS فقط» القديم صُحّح؛ كاش v219، بناء 47c999e610bc.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

New longer-input bank: 8 device-TTS-only tasks; 0 new MP3 or human recordings. Existing 96 lesson / 80 library / 96 exam MP3 files remain synthetic with review pending.

آخر تحديث: 2026-09-20 مقابل `v138`. القسم التاريخي أدناه يبقى كما قيس يومها، وتلي جدولَ الحالة طبقةُ totals المقيسة الآن.

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
