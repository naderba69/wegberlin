# حالة إنتاج صوت الامتحان

Sync batch: v161 · 2026-09-23 · صُودق على هذه الوثيقة كاملة مقابل دفعة `dwnb-full-pack-v161`.

آخر تحديث: 2026-09-20 مقابل `v138`. القسم التاريخي أدناه يبقى كما قيس يومها، وتلي جدولَ الحالة طبقةُ totals المقيسة الآن.

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
