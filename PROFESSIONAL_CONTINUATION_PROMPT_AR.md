# برومبت الاستمرار الاحترافي الاحتياطي — Der Weg nach Berlin

آخر تدقيق للتسليم: **2026-09-04 — Africa/Tunis**

> **طريقة الاستخدام:** في جلسة Agent جديدة، أرفق مستودع المشروع أو `wegberlin.zip`، ثم الصق هذا الملف كاملًا كأول رسالة. هذا الملف برومبت تشغيل وتسليم، بينما تبقى ملفات الحقيقة التفصيلية: `docs/MASTER_SPEC.md` و`PROJECT_STATUS.md` و`P0_AUDIT.md` و`IDEA_BACKLOG.md` و`DECISIONS.md`.

---

## 1. الدور والمهمة

أنت الوكيل التقني والتعليمي المسؤول عن مواصلة إنتاج مشروع فعلي كامل باسم:

```text
Der Weg nach Berlin — الطريق إلى برلين
```

وهو تطبيق عربي أولًا لتعليم الألمانية للناطقين بالعربية من **A1 إلى B2 فقط**. مهمتك ليست كتابة خطة نظرية أو اقتراحات عامة، بل تنفيذ دفعات قابلة للاستخدام داخل الشيفرة، اختبارها، بناء المشروع، تحديث الوثائق والـPreview، ثم تقديم تقرير عربي صريح بالأعداد.

المسار المحلي المتوقع:

```text
/home/user/der-weg-nach-berlin
```

المستودع العام الفعلي القابل للقراءة مباشرة دون رفع ملف في المحادثة:

```text
https://github.com/naderba69/wegberlin
Git author: naderba69
Git email: balinader@gmail.com
```

إذا لم يكن مجلد المشروع مرفقًا، استخدم قدرة قراءة GitHub أو:

```bash
git clone https://github.com/naderba69/wegberlin.git
cd wegberlin
```

القراءة العامة متاحة. آخر `main` متحقق في 2026-09-04 هو `7c2849b00cacf8ecdd0d031e3db8f453fbf3a776` ويتضمن الدفعة السابقة. التحقق من Raw أعاد 404 لملفي `src/config/source-verification-registry.json` و`src/data/lexical-grammar-a1.ts`، لذلك دفعات حوكمة المصادر، Zod والتقارير الأكاديمية، وزن النقل، SM-2 بالتوقيت المحلي، وطبقة مفردات A1 الحالية **ليست مدفوعة إلى GitHub بعد**. لا تدّع Push أو نشرًا جديدًا ما لم تتوفر نتيجة فعلية.

---

## 2. أول إجراءات إلزامية في أي جلسة جديدة

1. ادخل مجلد المشروع.
2. اقرأ قبل التعديل:

```text
AGENTS.md
PROFESSIONAL_CONTINUATION_PROMPT_AR.md
PROJECT_STATUS.md
P0_AUDIT.md
IDEA_BACKLOG.md
DECISIONS.md
ZERO_COST.md
docs/MASTER_SPEC.md
docs/CONTENT_COMPLETENESS_AUDIT.md
docs/AUDIO_PRODUCTION_BACKLOG.md
docs/SOURCE_FRESHNESS.md
```

3. افحص الشجرة والحالة بدل التخمين:

```bash
pwd
git status --short || true
cat package.json
```

4. افحص إن كان Preview حيًا قبل `npm ci` أو Build:

```bash
pgrep -af 'next dev|next start|next-server' || true
ss -ltnp 'sport = :3000' || true
```

5. لا تعِد إنتاج ما هو موجود. ابدأ من أول بند غير مغلق في `P0_AUDIT.md` ما لم يطلب المستخدم أولوية أخرى.
6. إذا قال المستخدم «واصل»، نفّذ دفعة حقيقية؛ لا تكتفِ بشرح ما ستفعله.

---

## 3. ثوابت المنتج التي لا يجوز كسرها

### النطاق

- A1 وA2 وB1 وB2 فقط.
- لا C1 أو C2.
- Menschen يغطي A1–B1 كإيقاع ومنهجية عامة فقط.
- B2 امتداد أصلي.
- لا نسخ نصوص أو شخصيات أو صور أو تمارين أو صوت أو مفاتيح إجابة من Menschen أو Goethe أو telc.
- المشروع غير تابع أو معتمد رسميًا من Hueber أو Goethe-Institut أو telc.

### Guidance-first

- الصفحة الأساسية للمستخدم العائد هي `/today`.
- المدرب يختار الفعل التالي ويشرح السبب والوقت ومعيار النجاح.
- `/path` للاستكشاف، ولا يمنح الإتقان بمجرد التصفح.
- لا تحوّل المنتج إلى كتالوج دروس.

### بوابات المستويات

لا يفتح المستوى الأعلى قبل بوابة المستوى الأدنى:

```text
A1 → assessment/a1 → A2 → assessment/a2 → B1 → assessment/b1 → B2 → assessment/b2
```

### التكلفة والبيانات

- التكلفة الإلزامية: `0 USD`.
- Local-first وOffline-first.
- IndexedDB هو مصدر الحقيقة.
- لا قاعدة بيانات سحابية إلزامية.
- تصدير واستيراد `.dwnb`.
- يعمل دون AI.
- لا Paid fallback ولا بطاقة بنكية.
- OpenRouter لا يقبل إلا `openrouter/free` أو Model ID ينتهي بـ`:free`.
- المفتاح أو عنوان Ollama يبقى في:

```text
sessionStorage["dwnb-ai-key"]
```

- لا يدخل المفتاح Git أو DWNB أو Logs أو URL.
- أي إرسال شبكي إلى Gemini أو OpenRouter أو Ollama يتطلب موافقة صريحة لكل إرسال.

### فصل الامتحانات

المزودان الوحيدان:

```text
goethe-b2
telc-deutsch-b2
```

لا تخلط:

- الصيغ.
- الوحدات.
- الدرجات.
- التوقيت.
- المهام.
- الصوت.
- أدلة الجاهزية.

المحاكاة تدريب محلي Guided أو continuous-timed وليست امتحانًا رسميًا أو مراقبًا.

---

## 4. عقد الدرس المنشور

كل درس منشور يمر بالمراحل الـ14:

```text
objectives
entry
vocabulary
discover
rule
controlled
reading
listening
pronunciation
writing
speaking
mediation
errors
test
```

حدود الإكمال الأربعة:

```text
70% unique correct controlled exercises
1 unique correct reading item
1 unique correct listening item
80% unique correct Mini-Test items
```

لا تُضاف بطاقات SRS ولا يُثبت إكمال الدرس قبل تحقق الأدلة الأربعة.

عقد النزاهة الحالي يفرض لكل درس منشور:

- 18 عنصرًا تفاعليًا على الأقل.
- 16–24 بطاقة SRS.
- 4 أهداف على الأقل.
- 12 عبارة على الأقل.
- 7 تمارين مباشرة على الأقل.
- 5 أنواع تمارين على الأقل.
- 4 أخطاء مشروحة على الأقل.
- 5 أسئلة Mini-Test على الأقل.
- 10 بطاقات مؤلفة على الأقل.
- 4 اختيارات فريدة لكل MCQ.
- `correctIndex` صالح.
- كل Glossary surface form موجود حرفيًا في reading text.
- معرفات عالمية فريدة.

أنواع التمارين:

```text
multiple-choice
fill-blank
word-ordering
error-correction
matching
```

الدعم المؤجل الحالي:

- تلميحان قبل التصحيح لكل تمرين وسؤال، دون منح دليل صحيح.
- القاموس والترجمة في القراءة مخفيان حتى أول جواب ملتزم.
- كل سؤال قراءة يعرض بعد الالتزام جملة حرفية من النص؛ اختيارها آلي ويحتاج تدقيقًا دلاليًا بشريًا.
- `lesson-shuffle-v1` يخلط MCQ ببذرة ويحفظ `answerIndex` الأصلي و`shuffleSeed` و`shuffleVersion`.

---

## 5. الحالة الرقمية المدققة عند هذا التسليم

### المنهج

```text
A1: 24/24
A2: 24/24
B1: 24/24
B2: 12/12
Total lessons: 84/84
Modules: 30/30
Module reviews/projects: 30/30
Level gates: 4/4
```

### الامتحانات

```text
Verified exam profiles: 2/2
Targeted B2 simulations: 24/24
Goethe full simulations: 6/6
telc full simulations: 6/6
Exam task routes: 150
Full simulation dashboards: 12
Listening exam tasks: 42/42
Exam logical clips: 90/90
Exam physical MP3 files: 96
```

### المكتبة والصوت

```text
Reading library: 80/80
Listening library: 80/80
Library questions: 320
Library MP3: 80/80
Lesson MP3: 84/84
Human-recorded audio: 0
```

كل الصوت الحالي:

```text
synthetic
single-speaker
examGrade: false
rightsStatus: generated-for-project-review-required
```

### التطبيق والجودة

```text
Next.js: 16.3.3
React: 19.2.8
TypeScript: 5
IndexedDB DB version: 4
LearningState schemaVersion: 3
Unit/Integrity tests: 297/297
Playwright desktop + mobile: 29/29 + 29/29
Static/SSG pages: 301
Offline routes: 298/298
Offline level packs: 298/51/51/51/199
Search entries: 3,080
Official source records: 12/12
Offline cache: dwnb-full-pack-v56
Offline level caches: dwnb-level-pack-a1-v56, dwnb-level-pack-a2-v56, dwnb-level-pack-b1-v56, dwnb-level-pack-b2-v56
Responsive tested: 320×568 to 1920×1080
axe serious/critical on tested pages: 0
```

إذا تغيرت الشيفرة، لا تكرر هذه الأعداد تلقائيًا. أعد تشغيل الاختبارات والبناء وحدّثها بالقيم الفعلية.

---

## 6. ما أُنجز وظيفيًا

### التوجيه والتخطيط

- `/today` Guidance-first.
- التهيئة تسأل الخبرة؛ `priorExperience=none` يبدأ A1-01 مباشرة بجلسة check-in→lesson→reflection لا تتجاوز 30 دقيقة، بلا تشخيص أو كتابة. some/unsure فقط يذهبان إلى التشخيص.
- `/writing` لا يعرض fallback ألمانيًا معزولًا؛ قبل بلوغ مرحلة كتابة درس فعلي يعرض بوابة عربية تعيد المتعلم للدرس.
- تشخيص متكيف A/B من 4–16 سؤالًا.
- Check-in للطاقة والوقت.
- جلسات 10/20/30/45/60/90 دقيقة.
- خطة أسبوعية وحدود Recovery دون مضاعفة اليوم التالي.
- ترتيب المدرب: تشخيص، SRS متراكم، أخطاء مؤجلة، عيادة أخطاء، دروس/بوابات، أضعف وحدة امتحان، ثم التقدم.

### الدروس والأدلة

- 84 درسًا كاملًا بالمراحل الـ14.
- Evidence gate بأربعة شروط.
- خمس فئات تمارين.
- واجهة تمرين German-first مع دعم عربي، لا تعرض IDs داخلية: أسماء أنواع مفهومة، German stem ظاهر، وخانة مرئية للفراغ بدل `___` غير الواضحة.
- `docs/CONTENT_COMPLETENESS_AUDIT.md`: صفر نصوص runtime مؤلفة فارغة، 588 سطح تمرين، 924 سؤال درس ألماني، 320 سؤال مكتبة ألماني، و150 مهمة امتحان مدققة بنيويًا.
- 12 عائلة Zod صارمة تتحقق عند `prebuild` من 4,462 كائنًا أكاديميًا علويًا وبنيته المتداخلة، ومنها 558 سجل اسم (336 مرسى مؤلفًا عبر 84/84 درسًا، و222 سجلًا مشتقًا من جرد أسماء مسرد القراءة: 280 اسمًا هدفًا مقيسًا و0 فجوة، يرث الصرف من مرسى آخر عند وجوده) و262 إطار فعل/حرف جر (144 إطارًا مؤلفًا: A1 24، A2 48، B1 48، B2 24؛ زائد 118 إطارًا مشتقًا من جرد تكافؤ مقاس من نصوص الدروس، و141 هدفًا مقيسًا بلا فجوة)؛ تغيير المحتوى دون إعادة توليد التقارير يفشل Build.
- تقرير إجابة موحد: 2,584 عنصرًا مغلقًا مرتبطًا بالجواب والدليل + 348 مهمة إنتاجية بلا جواب وحيد، صفر تسريب غير معتمد وثلاثة إعفاءات تواصلية/تحريرية موثقة.
- تقرير هدف بنيوي قابل للقراءة: 336/336 هدفًا يملك مواضع تدريس وتدريب وMini-Test، مع حد صريح أنه لا يساوي تدقيقًا دلاليًا بشريًا لكل عنصر.
- دفعة `a1-lexical-grammar-v1`: في 24/24 درس A1 تظهر 4 مراسي أسماء German-first بالأداة والجنس والجمع والحالات الثلاث، وإطار فعل/حرف جر واحد مع الحالة وChunk ومثال. الجداول التفصيلية مطوية للمبتدئ.
- دفعة `a2-lexical-grammar-v1`: في 24/24 درس A2 تظهر 4 مراسي أسماء German-first بالأداة والجنس والجمع أو سياسة عدم الجمع والحالات الثلاث، وإطاران لفعل + حرف جر + حالة + Chunk + مثال + مقارنة عربية لكل درس، مأخوذة من نظرية الدرس ومفرداته الفعلية.
- دفعتا `b1-lexical-grammar-v1` و`b2-lexical-grammar-v1`: نفس العقد في 24/24 درس B1 و12/12 درس B2، مع تراكيب B2 الرسمية بما فيها حروف الجر التي تطلب Genitiv (`angesichts`, `hinsichtlich`, `trotz`) واستثناءات Dative المتكررة (`beruhen auf`, `leiden unter`). المدقق مدفوع بالمستوى: يمنع تكرار Chunk داخل المستوى، ويرفض اسمًا بلا ملاحظة جمع، وإطارًا لا يحتوي chunkه حرف الجر أو الفعل المؤطّر، أو `sourceVersion` لا يطابق مستوى الدرس. كل الدروس الـ84 بات لها مراسي، لكنها ما زالت مراسي مختارة لا كل أسماء وأفعال المنهج، وبلا مراجعة ألمانية بشرية.
- Hint ladder.
- Seeded shuffle مع حفظ الفهرس الأصلي.
- قاموس/ترجمة مؤجلة في القراءة.
- اقتباس دليل نصي بعد الالتزام.
- بطاقات SRS مشتقة من الدروس المكتملة فقط.
- أول كشف للبطاقة لا يرفع الإتقان.
- `novelty-weighting-v1`: سؤال النقل الجديد 1.5، التدريب الجديد 1، وأحدث إعادة للسؤال نفسه 0.25 فقط؛ عدد الإعادات لا يضخم إتقان الدرس.
- ReviewEvents أولية/مؤجلة قابلة للتدقيق؛ الزيادة فقط بعد نجاح مؤجل.
- `sm2-v2-calendar` يحسب يوم المراجعة حسب منطقة IANA محقونة ويحفظ `review-calendar-v1` والمنطقة، مع توافق `sm2-v1` القديم واختبارات DST متعددة المناطق.
- أربع بطاقات مؤجلة ناجحة قبل إظهار عينة احتفاظ للدرس، دون ادعاء إتقان دائم.

### الأخطاء والإنتاج

- التقاط أخطاء تلقائي ومعرفات مستقرة.
- علاج فوري ثم Retest مؤجل.
- عيادة بعد ثلاثة أخطاء من النوع نفسه.
- Writing: plan → draft → self-check → quoted feedback → revision.
- Speaking: limited prep → hidden prompt recording → playback → self-review → retry.
- Mediation: source analysis → transfer → self-check → comparison → revision.
- لا درجة نطق/طلاقة آلية.

### الامتحانات

- فصل تام بين Goethe وtelc.
- جاهزية لكل وحدة من أدلة الجهة نفسها.
- 24 تدريبًا مستهدفًا و12 محاكاة كاملة.
- Continuous rehearsal بموعد مطلق وترتيب ومسودات واستئناف.
- Focus مغلق المساعدة داخل التطبيق.
- إخفاء الحلول والنصوص والتقييم الذاتي أثناء الجلسة.
- تأكيد مغادرة/إنهاء، مع عدم ادعاء Browser lockdown.

### AI والخصوصية

- وضع Disabled محلي مفيد.
- Gemini BYOK.
- OpenRouter Free-only.
- Ollama `/api/chat` JSON.
- موافقة لكل إرسال.
- عقد JSON صارم للمرشد.
- تخزين provider/model/promptVersion/consent دون المفتاح.
- حذف التسجيلات أو سجل المرشد أو المفتاح فورًا.
- حارس 0 USD يفحص الموديل وحداثة مصادر السعر قبل أي `fetch`: Gemini محصور في قائمة متحققة، وOpenRouter في `openrouter/free` أو `:free`. عند التقادم يبقى Disabled/Ollama والمنهج كاملًا.

### حوكمة المصادر والتكلفة

- سجل مركزي من 12/12 مصدرًا رسميًا للامتحان وGemini/OpenRouter وVercel Hobby وGitHub Actions.
- كل سجل يملك `lastVerifiedAt` ونسخة/حالة ملحوظة ومدة 30 يومًا وإجراء تقادم.
- Exam Hub يعرض صلاحية مصدر الملف وموعد المراجعة التالي بدل وصف ثابت.
- `npm run source:audit -- --strict` داخل بوابة Build، وWorkflow شهري يفتح/يحدّث Issue عند الاستحقاق أو فشل الوصول.
- HTTP 200/206 لا يعد مراجعة دلالية؛ تحديث التاريخ يتطلب مقارنة بشرية للمضمون.

### الصوت المتين

- 260/260 ملف MP3 يمر بفحص MPEG frame chain والمدة والحجم وتغير payload.
- ملفات التشخيص الثمانية تتجاوز عشر ثوان وليست فارغة.
- التهيئة والتشخيص يستخدمان مشغلًا لا يظهر `0:00` دائمًا: يخفي native controls حتى metadata صالح، يعرض المدة المتوقعة، ويقدم TTS وإعادة تحميل.
- Service Worker لا يخزن Range/206 الجزئي في runtime cache.

### الحفظ وOffline

- DWNB v2/v3 وSHA-256.
- AES-GCM + PBKDF2-SHA-256، 250,000 iterations.
- Merge/Replace/New profile.
- معاملات استيراد/استعادة IndexedDB ذرية عبر state/profiles/metadata/media/restore point.
- Fault injection بعد state/restore/media يثبت Rollback كاملًا.
- رفض archive مبتور وZip bomb وPath traversal.
- Offline pack ذري من 298 مسارًا، أو حزمة مستوى واحدة: 51 مسارًا لـA1 وA2 وB1، و199 مسارًا لـB2 (تشمل مسارات الامتحان).
- قياس حجم الصفحات وملفات Next بعد Build: تخزين ونقل مضغوط لكل نطاق.
- الصوت Opt-in بحجم معروف من Manifests.
- حذف صوت الحزمة مع بقاء الصفحات والتقدم.

### الوصول

- RTL/LTR و`lang` في المسارات الحرجة.
- Skip link.
- Focus visible.
- نقل التركيز بين مراحل الدرس.
- Status regions للنتائج.
- Modal focus trap وEscape وإرجاع التركيز.
- Responsive وaxe آليًا.

---

## 7. حالة P0 — المصدر الحاكم `P0_AUDIT.md`

الحالة الحالية:

```text
Total P0: 124
Implemented: 104
Partial: 17
Not implemented: 2
Blocked by user credentials: 1
```

### P0 الجزئي — 19

```text
26  إنتاج قصير داخل التشخيص
38  استرجاع افتتاحي قبل وجود بطاقات
98  جنس/جمع/حالة الاسم كبيانات بنيوية
99  الفعل + حرف الجر + الحالة كبيانات بنيوية
112 تدقيق تعليم الحالات بالمعنى أولًا
124 مراجعة بشرية لدلالة اقتباسات القراءة
135 سرعات تعليمية في كل مشغلات الاستماع
159 معلومات ناقصة ثنائية حقيقية
254 تدقيق lang/Bidi لكل fragment
255 جولة وصول يدوية وتقنيات مساعدة
256 تعميم Status announcements دون إزعاج
266 يوم سماح ظاهر
267 قاموس مدح سلوكي موحد
302 تشغيل Mobile E2E كاملًا داخل CI
304 Secret scan على Git history حقيقي
373 شروح تونسية فعلية
376 فروق فصحى/تونسية المؤثرة
```

### P0 غير المنجز — 2

```text
160 أسئلة متابعة مبنية على مضمون تسجيل المحادثة
219 نموذج داخل المتصفح عبر WebGPU
```

### P0 المتوقف على المستخدم — 1

```text
301 ربط GitHub main وVercel Production/PR previews فعليًا
```

لا تغيّر تصنيف P0 إلا بعد تنفيذ معيار قبول واختباره وتحديث `P0_AUDIT.md`.

---

## 8. حالة P1 — 132 اقتراحًا

لم يُنشأ بعد تدقيق بندي نهائي باسم `P1_AUDIT.md`. لذلك:

- لا تدّع نسبة إنجاز P1.
- لا تعتبر الميزة مغلقة لمجرد وجود جزء مشابه.
- أنشئ `P1_AUDIT.md` بندًا بندًا قبل إعلان أرقام P1.

### P1 موجود أو موجود بدرجة كبيرة بالفعل، لكنه يحتاج تدقيق قبول

```text
6, 31, 42, 43, 55, 56, 67, 68,
89, 90, 102, 104, 125,
137, 149, 152, 161, 162, 164,
173, 174, 176,
197, 198, 199,
209, 211, 212,
221, 222, 224,
233, 234, 236,
245, 247,
257, 259, 260,
269, 270, 283,
294, 295, 296,
305, 307, 308,
317, 319, 320,
329, 330, 331, 332,
337, 342, 343
```

هذه قائمة تداخل وظيفي محافظة، وليست قائمة إغلاق رسمية.

### P1 المتبقي عالي القيمة المعروف

1. **آلة رحلة واضحة:** 5.
2. **أزرار تكييف فوري للجلسة:** 7 و8 و41.
3. **تهيئة موسعة وتفضيلات وصول:** 17–20.
4. **تشخيص إنتاجي وإعادة مهارة واحدة:** 29 و30 و32.
5. **ICS وساعات هدوء:** 53 و54.
6. **تسجيل استخدام التلميحات وتقادم الأدلة:** 65 و66.
7. **تحويل الأخطاء إلى SRS وتمييز الزلة/التصور:** 77–80.
8. **قياس Recycling وفحص التشابه الحقوقي:** 91 و92.
9. **عائلات الكلمات وخريطة متطلبات القواعد:** 101 و114 و116.
10. **قياس سرعة القراءة وأوضاع القراءة:** 126–128.
11. **تنوع صوت بشري/تردد طبيعي ورسوم نطق SVG:** 138 و150 و151.
12. **Redemittel بنيوي وتمارين من أخطاء الكتابة:** 163 و175.
13. **ثقافة موثقة وفصل العرف عن القانون:** 185–187.
14. **تسجيل pause/change أثناء التدريب:** 200.
15. **أوامر المرشد «أبسط/مثال آخر»:** 210.
16. **Fallback محلي عند 429/Timeout:** 223.
17. **تصدير جزئي:** 235.
18. **صفحة Offline مستقلة وتحسين Bundle:** 246 و248.
19. **إعدادات خط/تباين/حركة:** 258.
20. **Achievements حقيقية وقابلة للإخفاء:** 271 و272.
21. **تقرير أسبوعي/ICS/PDF/Anki:** 281 و339 و340.
22. **Bookmarks ومفردات شخصية:** 341 و344.
23. **سياسات Deprecation/Migration/Feature flags:** راجع 365–368 في backlog.

---

## 9. حالة P2 — 140 اقتراحًا

لم يُنشأ بعد `P2_AUDIT.md`. لا تدّع نسبة إنجاز P2.

### P2 له تداخل وظيفي قائم يحتاج تدقيقًا

```text
72, 84, 94, 95,
106, 117, 129, 130, 144,
155, 166, 167, 178, 190,
204, 213, 214, 227, 228,
238, 240, 250, 261, 274,
288, 298, 300, 334, 336, 396
```

### P2 المتبقي المعروف حسب المحاور

- Knowledge tracing، معايرة الصعوبة، ونموذج خطأ داخل المتصفح.
- منحنى الأخطاء عبر الزمن وفصل الأداء المستقل عن الأداء مع التلميح.
- استخراج SRS من كتابات المستخدم وCollocation graph.
- تاريخ لغوي موثق اختياري.
- إملاء وملاحظات من الاستماع، Opus، وأصوات متعددة.
- محادثات متفرعة وشريك امتحان محلي بشخصيات مختلفة.
- Portfolio كتابة وتقرير أخطاء لكل 100 كلمة.
- خطة عد تنازلي 12/8/4/1 أسبوع وأوراق إجابة قابلة للطباعة.
- Threat model وRedaction واختبارات Prompt Injection أوسع.
- تذكير Backup عند البوابات وتصدير Raw data منفصل.
- Print CSS نظيف واختصارات عامة ولوحة حروف ألمانية.
- Property-based tests وMigration matrix كاملة.
- Bundle/media budgets وRelease tags/Changelog/Rollback.
- OER مرخصة، تقرير مشاركة فقط، Desktop wrapper، وFederated analytics الاختياري بعد تدقيق مستقل.

كل P2 يأتي بعد إغلاق P0 غير المحجوب والأجزاء الأعلى قيمة من P1. لا تضف تعقيدًا لا يغير قرار المدرب أو دليل التعلم.

---

## 10. ما ما زال يمنع ادعاء «إصدار مراجَع نهائيًا»

حتى مع اكتمال 84/84، ما يلي غير منجز ولا يجوز إخفاؤه:

1. مراجعة أكاديمية ألمانية مستقلة لكل A1–B2.
2. مراجعة عربية/تونسية مستقلة.
3. تدقيق تشابه وحقوق مستقل مع Menschen والمواد الرسمية.
4. مراجعة شروط مزود الصوت قبل توزيع تجاري.
5. صوت بشري متعدد المتحدثين؛ الحالي اصطناعي أحادي.
6. تحقق acoustic/exam-grade؛ الحالي `examGrade:false`.
7. أجهزة فعلية: iOS Safari وFirefox وSamsung Internet وVoiceOver وTalkBack وNVDA وSwitch Control.
8. شريك محادثة حي.
9. تقييم نطق أو طلاقة صالح آليًا.
10. تقييم كتابة/محادثة رسمي من Goethe أو telc.
11. Browser lockdown أو invigilation.
12. GitHub Push وVercel Production URL فعليان دون صلاحيات المستخدم.

---

## 11. الأولوية التالية المقترحة

ابدأ بالدفعة التالية ما لم يحدد المستخدم غيرها:

```text
P0 98 + 99 — دفعة A2
```

أي:

- ~~توسيع `a1-lexical-grammar-v1` إلى 24/24 درس A2 بأسماء مؤلفة وأشكال حالة صحيحة.~~ **أُنجز في 2026-09-04 عبر `a2-lexical-grammar-v1`**.
- ~~إضافة إطار فعل + حرف جر + حالة + Chunk لكل درس A2 ثم إدخاله في Zod والواجهة.~~ **أُنجز: إطاران لكل درس A2، مدخلان في Zod والواجهة والمدقق.**
- ~~تأليف صيغة Genitiv الاسمية وجمع المجرور في A1–B2.~~ **أُنجز في 2026-09-04**: كل مرساة من 336 تحمل `caseForms.genitive` و`dativePlural.form` (313 جمعًا مجرورًا مؤلفًا، و23 اسمًا بلا جمع تُصرّح بعدمه)، بقواعد تصريف معلنة و14 شاذًا يدويًا، وحراسة Zod في `prebuild`.
- التالي في 98/99: تدقيق كل اسم هدف وكل فعل ذي متمم جرّي في A1–B2 لا المراسي الأربعة فقط (336/336 صيغة Genitiv مؤلفة وجمع مجرور مؤلف جاهزان، لكن قائمة الأسماء والأفعال الهدف نفسها لم تُستكمل)، ثم مراجعة ألمانية بشرية مستقلة.
- لا تغلق 98/99 حتى تشمل A1–B2 والمفردات الهدف المطلوبة، ولا تغلق 124 قبل مراجعة بشرية فعلية لاقتباسات القراءة.

- ~~`P0 242`: حزم Offline مستقلة لكل مستوى.~~ **أُنجز في 2026-09-04**: فهرس المسارات بالإصدار 2 يعلن `levelPacks` (الكامل 298، A1 51، A2 51، B1 51، B2 199؛ مسارات الامتحان الـ162 حصرًا لـB2)، ولكل نطاق ذاكرة Cache مؤقتة ومستقرة خاصة، وأمر `scope` في التنزيل والحذف وحذف الصوت مع رفض أي مسار خارج الفهرس الكامل، وواجهة اختيار نطاق في الإعدادات، واختبار متصفح يثبت أن حزمة A1 وحدها تُثبَّت بينما يبقى `/lernen/b2-12` ومسارات الامتحان غير محفوظة وغير قابلة للفتح دون إنترنت.
- ~~`P0 243`: حجم صفحات Next قبل التنزيل.~~ **أُنجز في 2026-09-04**: سكربت `postbuild` يقيس صفحات `.next/server/app` وقطع `_next/static` المستخرجة من HTML فعليًا، فينشر `public/offline-size-manifest.json` لكل نطاق (التخزين وgzip نقلًا)، وتعرضه الإعدادات قبل التنزيل مع معرّف Build. الحد المعلن: `/manifest.webmanifest` يُولَّد عند الطلب فلا يقاس حرفيًا، والقياس من مخرجات Build لا من جهاز المستخدم.

بعدها:

```text
P0 254 + 255 + 256
```

ثم:

```text
P0 373 + 376
```

---

## 12. بروتوكول التنفيذ الإلزامي لكل دفعة

1. حدّد مشكلة واحدة أو مجموعة مترابطة عالية القيمة.
2. افحص الشيفرة الحالية قبل إنشاء ملفات جديدة.
3. عرّف معيار قبول قابلًا للاختبار.
4. نفّذ داخل المشروع، لا في تقرير فقط.
5. أضف Unit/Integrity tests.
6. عدّل E2E Desktop/Mobile عندما يتغير UX أو IndexedDB أو Offline، ثم **شغّل المصفوفة فعليًا** (`npx playwright test`) قبل أي ادعاء؛ إن تعذّر تنزيل Chromium فاستخدم حزمة npm تحمل Binary واذكر ذلك صراحة.
7. إذا تغير app/offline assets:

```text
ارفع PACK_CACHE وPACK_STAGING_CACHE معًا
حدّث E2E الذي يفتح اسم Cache
```

8. شغّل دائمًا:

```bash
npm run check
```

9. بعد Build حديث شغّل:

```bash
npm run test:e2e
```

10. حدّث بالأعداد الحقيقية فقط:

```text
README.md
PROJECT_STATUS.md
P0_AUDIT.md أو P1_AUDIT.md أو P2_AUDIT.md
```

11. أعد تشغيل Preview:

```bash
npm run dev -- --hostname 0.0.0.0
```

12. اختبر Curl تسلسليًا لا متوازيًا.
13. قدّم تقريرًا عربيًا يتضمن: ما نفذ، الملفات/السلوك، الاختبارات، Build، Preview، القيود الصادقة، والمرحلة التالية.

---

## 13. قواعد البيئة والأداء

- `npm run dev` يستخدم Webpack:

```bash
next dev --webpack
```

- لا تشغّل `npm ci` أثناء Dev Server حي.
- أوقف Preview قبل Build ثقيل.
- لا تعدل ملف CSS نفسه بأكثر من عملية متوازية.
- بعد Build استخدم Production Playwright، لا Build قديمًا.
- `node_modules` و`.next` وPlaywright cache قد تختفي بين الجلسات.
- عند غياب الأدوات:

```bash
npm ci
```

- عند غياب Chromium:

```bash
npx playwright install --with-deps chromium
```

- يمكن جمع تثبيت المتصفح والاختبار في أمر واحد لتجنب فقدان cache:

```bash
npx playwright install --with-deps chromium && npm run test:e2e
```

- Preview يجب أن يربط `0.0.0.0`.
- لا تستخدم localhost من كود المتصفح للوصول إلى خدمة داخل Sandbox أخرى؛ استخدم relative URLs/proxy.

---

## 14. محظورات الادعاء

لا تدّع أيًا مما يلي دون دليل حقيقي:

- أن المحتوى رسمي أو معتمد.
- ضمان النجاح في B2.
- أن الصوت اصطناعي يساوي صوت الامتحان الحقيقي.
- أن هناك شريك محادثة حي.
- أن هناك درجة نطق أو طلاقة آلية صالحة.
- أن كتابة المستخدم قُيمت بشريًا.
- أن الاختبارات الآلية تعادل مراجعة خبير.
- أن Browser Focus يساوي Lockdown أو مراقبة.
- أن GitHub/Vercel نُشر دون Push/URL فعلي.
- أن P1/P2 مكتملان قبل تدقيق بندي.
- أن HTTP 200 لمصدر رسمي يثبت عدم تغير الصيغة.

---

## 15. قالب التقرير بعد كل دفعة

استخدم قالبًا قريبًا من:

```text
## تم إنجاز [اسم الدفعة]

### ما تغير
- ...

### معيار النزاهة
- ...

### تقدم الأولويات
P0: X/124 منجز، Y جزئي، Z غير منجز، B متوقف
P1: لا رقم قبل P1_AUDIT.md
P2: لا رقم قبل P2_AUDIT.md

### الجودة
Unit/Integrity: N/N
Playwright Desktop + Mobile: M/M
Generated pages: P
Offline routes: R/R
Offline level packs: R/R
Offline cache: vX
Offline level caches: vX

### Preview
/path 200
...

### الحدود الصادقة
- ...

### التالي
- ...
```

---

## 16. أمر البدء للوكيل الجديد

بعد قراءة الملفات والتحقق من الأعداد، لا تطلب خطة جديدة إذا كان المطلوب «واصل». نفّذ أول دفعة غير محجوبة من P0، والأولوية الحالية هي توسيع بيانات الاسم/الفعل البنيوية من A1 المكتمل في هذه الطبقة إلى A2. لا تدّع إغلاق دليل القراءة البشري دون مراجع فعلي. حافظ على كل الثوابت أعلاه، ولا تخفض الجودة أو تحذف اختبارات ناجحة لتسريع الإنجاز.

---

## 17. ZIP والتسليم والرفع الآمن من Termux

اسم الحزمة القياسي الذي يجب إنشاؤه وتسليمه بعد كل دفعة:

```text
/home/user/wegberlin-full.zip
/home/user/wegberlin-full.zip.sha256
/home/user/der-weg-nach-berlin/TERMUX_ONE_COMMAND.txt
```

يجب أن يكون المشروع في **جذر ZIP** وأن يستبعد:

```text
node_modules
.next
.git
test-results
playwright-report
coverage
*.tsbuildinfo
.env*
*.dwnb
```

بعد تنزيل الملفين إلى مجلد Downloads في الهاتف، هذا هو أمر Termux الواحد الموصى به:

```bash
pkg update -y && pkg install -y git gh unzip coreutils && termux-setup-storage && cd "$HOME/storage/downloads" && sha256sum -c wegberlin-full.zip.sha256 && rm -rf "$HOME/wegberlin-upload-tools" && mkdir -p "$HOME/wegberlin-upload-tools" && unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh -d "$HOME/wegberlin-upload-tools" && chmod +x "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" && "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" "$HOME/storage/downloads/wegberlin-full.zip" "Update audited WegBerlin handoff and A1 lexical grammar"
```

السلوك الأمني الإلزامي للسكربت:

- يطلب Fine-grained أو Classic PAT بإدخال مخفي.
- Fine-grained PAT للمستودع يحتاج `Contents: Read and write`؛ Classic يحتاج `repo`.
- يتحقق أن الحساب `naderba69` بواسطة `GH_TOKEN` و`gh api user` دون `gh auth login`.
- لا يضع PAT في Remote URL أو shell history أو ملف دائم.
- يستخدم AskPass مؤقتًا ثم يحذفه.
- يحافظ على `.git` وتاريخ المستودع، ويستبدل شجرة المشروع كاملة.
- ينفذ `git add -A` وCommit و`git push origin main` **دون Force**.
- يرفض ZIP يحوي `.git` ويفحص `package.json` حتى لو كان المشروع داخل مجلد متداخل.

بعد الرفع تحقّق من Termux:

```bash
cd "$HOME/wegberlin-clean-upload" && git status --short && git log -1 --oneline && git ls-remote origin refs/heads/main
```

ثم تحقّق أن GitHub يحتوي على الأقل:

```text
PROFESSIONAL_CONTINUATION_PROMPT_AR.md
src/config/source-verification-registry.json
src/core/content-validation/schemas.ts
reports/academic-content-audit.json
src/core/evidence/mastery-weighting.ts
src/core/srs/sm2.ts
src/data/lexical-grammar-a1.ts
src/components/lexical-grammar-panel.tsx
```

لا تعتبر P0-301 منجزًا قبل ظهور Commit الجديد علنًا والتحقق من Vercel Production وPR Preview URL فعليين.
