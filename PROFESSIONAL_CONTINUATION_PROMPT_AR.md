# برومبت الاستمرار الاحترافي الاحتياطي — Der Weg nach Berlin

آخر تدقيق للتسليم: **2026-09-08 — Africa/Tunis**

> **طريقة الاستخدام:** في جلسة Agent جديدة، أرفق `wegberlin-full.zip` مع ملف التحقق `wegberlin-full.zip.sha256`، ثم الصق هذا الملف كاملًا كأول رسالة. إذا تعذر إرفاق ZIP، أعطِ الوكيل رابط المستودع العام أدناه، مع التنبيه أن مساحة العمل الاحتياطية قد تكون أحدث من `main`. هذا الملف برومبت تشغيل وتسليم، بينما تبقى ملفات الحقيقة التفصيلية: `docs/MASTER_SPEC.md` و`PROJECT_STATUS.md` و`P0_AUDIT.md` و`P1_AUDIT.md` و`IDEA_BACKLOG.md` و`DECISIONS.md`.

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

القراءة العامة متاحة. آخر `main` متحقق في 2026-09-04 هو `be56463e27ae676e82289c6b348b97c5161d7051` برسالة `Update audited WegBerlin handoff and A1 lexical grammar`. ظهرت ملفات حوكمة المصادر والتقارير وA1 عبر Raw GitHub. أعاد Vercel حالة Deployment `success`، وProduction العام يعمل على `https://wegberlin.vercel.app`. تشغيل Quality Gate رقم 3 انتهى `failure`: Job `check` وBuild نجحا، وفشل Job e2e المكتبي. لم يُنشأ PR لاختبار Preview، فلا تُغلق P0-301. مساحة العمل الحالية أحدث من `main`: تضيف دفعات A2 وB1 وB2 المعجمية، حوكمة المصادر/المحتوى والحالة واللغة، 17 ملاحظة دعم تونسي، حزم Offline v2، وتحول CI إلى Desktop+Mobile مع Retry واحد داخل CI وActions v5؛ لا تغلق P0-302 قبل Push وتشغيل بعيد أخضر.

---

## 2. أول إجراءات إلزامية في أي جلسة جديدة

1. ادخل مجلد المشروع.
2. اقرأ قبل التعديل:

```text
AGENTS.md
PROFESSIONAL_CONTINUATION_PROMPT_AR.md
PROJECT_STATUS.md
P0_AUDIT.md
P1_AUDIT.md
P2_AUDIT.md
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
Unit/Integrity tests: 868/868
Test files: 136/136
Playwright desktop + mobile: 76/76
Playwright browser channel: chromium (full new-headless; local retries remain 0)
Static/SSG pages: 306
Offline routes: 306/306
Search entries: 3,080
Official source records: 18/18
Offline cache: dwnb-full-pack-v119
Responsive tested: 320×568 to 1920×1080
axe serious/critical on tested pages: 0
```

إذا تغيرت الشيفرة، لا تكرر هذه الأعداد تلقائيًا. أعد تشغيل الاختبارات والبناء وحدّثها بالقيم الفعلية.

---

## 6. ما أُنجز وظيفيًا

### التوجيه والتخطيط

- `/today` Guidance-first.
- التهيئة تسأل الخبرة؛ `priorExperience=none` يبدأ A1-01 مباشرة بجلسة صفر check-in→lesson→reflection لا تتجاوز 30 دقيقة، بلا تشخيص أو كتابة؛ بعد بلوغ المفردات تضيف العودة استرجاعًا تمهيديًا قصيرًا. some/unsure فقط يذهبان إلى التشخيص.
- `/writing` لا يعرض fallback ألمانيًا معزولًا؛ قبل بلوغ مرحلة كتابة درس فعلي يعرض بوابة عربية تعيد المتعلم للدرس.
- تشخيص متكيف A/B من 4–16 سؤالًا، ثم `diagnostic-productive-sample-v1` لأصحاب الخبرة: كتابة قصيرة أو تسجيل محلي أو `not-yet` بلا عقوبة وبلا Score لغوي.
- Check-in للطاقة والوقت.
- جلسات 10/20/30/45/60/90 دقيقة.
- `pre-srs-retrieval-warmup-v1`: ثلاث عبارات German-first بكشف مؤجل عندما لا توجد بطاقة، دون إنشاء SRS أو إتقان وهمي.
- `weekly-grace-v1`: يوم سماح ظاهر لا يصنع دليلًا أو دين تعافٍ، ويجسر يومًا واحدًا بين يومي دراسة فعليين.
- `behavioral-praise-v1`: قاموس مركزي يمدح الاسترجاع والمراجعة والإعادة والتسليم لا الشخص أو «الروعة».
- `secret-audit-v1`: فحص النص الحالي داخل `npm run check`، وفحص History كامل إلزامي في CI، وHook إصداريا قبل Commit؛ فحص Clone عام في 2026-09-10 غطى 30 Commit و49,812 سطر Patch بلا نتائج؛ الاستثناء الوحيد مساواة صريحة للـfixture التاريخي `sk-or-v1-EXAMPLEEXAMPLEEXAMPLE` ولا يوجد Prefix/Path allowlist.
- أُغلق P0-242/243: خمس حزم Offline مستقلة 58/58/58/207/306، و`offline-size-manifest` يتجدد بعد كل Production Build ويعرض Gzip للصفحات وNext قبل التنزيل مع بصمة Build؛ القيم الدقيقة تؤخذ من Manifest لا من رقم ثابت في البرومبت.
- خطة أسبوعية وحدود Recovery دون مضاعفة اليوم التالي؛ الأحد راحة صفرية افتراضيًا، وتظهر جلسة اختيارية محدودة فقط بعد Check-in صريح في يوم الراحة.
- ترتيب المدرب: تشخيص، SRS متراكم، أخطاء مؤجلة، عيادة أخطاء، دروس/بوابات، أضعف وحدة امتحان، ثم التقدم.

### الدروس والأدلة

- 84 درسًا كاملًا بالمراحل الـ14.
- Evidence gate بأربعة شروط.
- خمس فئات تمارين.
- واجهة تمرين German-first مع دعم عربي، لا تعرض IDs داخلية: أسماء أنواع مفهومة، German stem ظاهر، وخانة مرئية للفراغ بدل `___` غير الواضحة.
- `docs/CONTENT_COMPLETENESS_AUDIT.md`: صفر نصوص runtime مؤلفة فارغة، 588 سطح تمرين، 924 سؤال درس ألماني، 320 سؤال مكتبة ألماني، و150 مهمة امتحان مدققة بنيويًا.
- 13 عائلة Zod صارمة تتحقق عند `prebuild` من 3,710 كائنًا أكاديميًا علويًا وبنيته المتداخلة، ومنها 1,044 سجل اسم و104 إطارات فعل/حرف جر و17 سجل دعم تونسي لـA1–B2؛ تغيير المحتوى دون إعادة توليد التقارير يفشل Build.
- تقرير إجابة موحد: 2,584 عنصرًا مغلقًا مرتبطًا بالجواب والدليل + 348 مهمة إنتاجية بلا جواب وحيد، صفر تسريب غير معتمد وثلاثة إعفاءات تواصلية/تحريرية موثقة.
- تقرير هدف بنيوي قابل للقراءة: 336/336 هدفًا يملك مواضع تدريس وتدريب وMini-Test، مع حد صريح أنه لا يساوي تدقيقًا دلاليًا بشريًا لكل عنصر.
- `meaning-first-case-v1`: 17 عقدًا تعرض Bedeutung→Rolle→Form قبل النظرية، مرتبطة بـ21 نظرية و54 تدريبًا و40 Mini-Test؛ `case:audit` يعمل في `prebuild` ويكشف أي إشارة حالة صريحة غير مملوكة.
- طبقات A1–B2 البنيوية مع إضافات مطوية خلف `Weitere Zielnomen`: 1,044 اسمًا موزعة 272/269/308/195، و104 إطارات موزعة 25/30/31/18. الجرد: 3,219 إشارة اسم (1,106 covered / 0 pending-human / 2,113 context-only)، و817 إشارة إطار (104 covered / 0 unclassified / 713 not-target). A1/A2/B1/B2 noun pending = 0/0/0/0؛ تبقى ستة استبعادات `authored-review-pending` والمراجعة الألمانية المستقلة.
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

- سجل مركزي من 18/18 مصدرًا رسميًا: خمسة للامتحان، خمسة لـGemini/OpenRouter، ستة لـTransformers.js/WebGPU/model/license تشمل Whisper المحلي، وVercel Hobby وGitHub Actions.
- سجلات المتصفح/النموذج مراجعة في 2026-09-07 وتستحق 2026-10-07؛ الموعد الإجمالي الأقرب يبقى 2026-10-03 للسجلات الأقدم.
- كل سجل يملك `lastVerifiedAt` ونسخة/حالة ملحوظة ومدة 30 يومًا وإجراء تقادم.
- Exam Hub يعرض صلاحية مصدر الملف وموعد المراجعة التالي بدل وصف ثابت.
- `npm run source:audit -- --strict` داخل بوابة Build، وWorkflow شهري يفتح/يحدّث Issue عند الاستحقاق أو فشل الوصول.
- HTTP 200/206 لا يعد مراجعة دلالية؛ تحديث التاريخ يتطلب مقارنة بشرية للمضمون.

### الصوت المتين

- 260/260 ملف MP3 يمر بفحص MPEG frame chain والمدة والحجم وتغير payload.
- ملفات التشخيص الثمانية تتجاوز عشر ثوان وليست فارغة.
- التهيئة والتشخيص يستخدمان مشغلًا لا يظهر `0:00` دائمًا: يخفي native controls حتى metadata صالح، يعرض المدة المتوقعة، ويقدم TTS وإعادة تحميل.
- Service Worker لا يخزن Range/206 الجزئي في runtime cache.
- `learning-playback-speed-v1`: سرعات 0.75×/1×/1.15× موحدة في خمسة أسطح استماع مؤلف؛ يطلب الحفاظ على النبرة، ويمرر السرعة إلى TTS وSegments، ويثبت البروفة المتصلة على 1×. لا تمس تسجيلات المتعلم، ولا تغلق P0-135 قبل الاستماع البشري النهائي.
- `two-party-information-gap-v1`: بطاقتا A/B خاصتان وتسليم مخفي وأربع نقلات وقرار مشترك؛ لا دليل بلا شخص ثانٍ ولا ادعاء شريك توفره المنصة.
- `content-grounded-follow-up-v1`: بعد التسجيل والاستماع يكتب المتعلم اختياريًا خلاصة ألمانية حتى 600 حرف، وهي المصدر `typed-transcript` الوحيد للمضمون. المحرك الحتمي المحلي يبني سؤالًا German-first من إشارة مكان أو عمل/دراسة أو تفضيل أو خطة/وقت أو سبب/رأي أو كلمة محتوى فعلية، ويرفض النص غير الكافي بدل سؤال مزيف. Gemini/OpenRouter Free-only/Ollama اختيارية خلف موافقة تعرض النص والوجهة قبل كل `fetch`؛ الرد الصارم يجب أن يعيد `groundingCue` موجودة حرفيًا في النص. لا يُرسل Blob الصوت ولا يوجد STT أو تحليل نطق/طلاقة. يُحفظ مقتطف محدود وSHA-256 والسؤال والمزود/الموديل/الموافقة داخل محاولة المحادثة وDWNB، ويحذف مركز الخصوصية المقتطف مع التسجيل.
- `browser-webgpu-model-v1`: نموذج `Xenova/paraphrase-multilingual-MiniLM-L12-v2` q8 عند Revision `2c4055b12046f11709e9df2c122e59ffbdc2f900` يعمل داخل Worker بـWebGPU لترتيب أربعة أسئلة مؤلفة. فحص Secure Context وAdapter و4 GB و128 MiB Buffer والمساحة يسبق Opt-in 130–150 MB. Cache `dwnb-webgpu-model-v1` لا يعلن الاكتمال قبل تهيئة Pipeline ويُحذف عند الفشل/طلب المستخدم. الأوزان غير موجودة في Git أو ZIP أو Offline pack؛ Runtime 4.2.0 وONNX Web مورّدان Browser-only مع SHA-256 وApache/MIT. لا silent WASM fallback ولا توليد حر أو STT/CEFR/acoustic scoring. Plaintext Transformers.js متولد ومُتجاهل Git؛ `prepare`/prebuild يعيدانه من Packed payload بعد SHA-256 مزدوج لتجنب False positive من GitHub دون Bypass.

### الحفظ وOffline

- DWNB v2/v3 وSHA-256.
- AES-GCM + PBKDF2-SHA-256، 250,000 iterations.
- Merge/Replace/New profile.
- معاملات استيراد/استعادة IndexedDB ذرية عبر state/profiles/metadata/media/restore point.
- Fault injection بعد state/restore/media يثبت Rollback كاملًا.
- رفض archive مبتور وZip bomb وPath traversal.
- Offline Manifest v2: حزم مستقلة A1/A2/B1/B2/full بعدد 58/58/58/207/306 مسارًا.
- الصوت Opt-in ومفلتر حسب الحزمة: 40/48/48/124/260 ملفًا.
- `offline-size-manifest` يولد بعد Build حجم Gzip للصفحات وNext قبل التنزيل وبصمة Build، مع بقاء القياس الفعلي بعد التثبيت.
- حذف صوت الحزمة مع بقاء الصفحات والتقدم.

### الوصول

- RTL/LTR و`lang` في المسارات الحرجة.
- Skip link.
- Focus visible.
- نقل التركيز بين مراحل الدرس.
- `status-announcement-v1`: عقدة Live مهذبة وذرية واحدة تفصل النص المرئي وتمنع إعلان الرسالة نفسها عند Rerender؛ معممة على التشخيص والبوابات والمختبرات والأخطاء ونتائج الامتحان.
- `language-boundary-v1`: تدقيق 138 TSX و5,284 tag و273 Fragment ألماني و185 static mixed، مع قبول `ar-TN` المقترن بـRTL؛ كل lang/dir مقترن، وبنوك الأجوبة العشرة تتكيف عربي/ألماني/mixed/technical، وصفر مشكلة.
- `tunisian-support-v1`: 17 ملاحظة اختيارية مرتبطة بـ17 Theory block، موزعة A1/A2/B1/B2 = 6/5/4/2 عبر 15 فئة فرق. تظهر فقط في `tunisian-supported` وتفصل جسر الفصحى والتقريب التونسي وخطر الفهم والمرساة الألمانية. كلها `authored-review-pending`؛ المراجعة المستقلة النهائية لم تُنفذ بعد.
- Modal focus trap وEscape وإرجاع التركيز.
- Responsive وaxe آليًا.

---

## 7. حالة P0 — المصدر الحاكم `P0_AUDIT.md`

الحالة الحالية:

```text
Total P0: 124
Implemented: 118
Partial: 9
Not implemented: 0
Blocked by user credentials: 0
```

### P0 الجزئي — 9

```text
98  توجد 1,044 مرساة وA1/A2/B1/B2 pending=0/0/0/0؛ المتبقي مراجعة مستقلة
99  توجد 104 إطارات و0 مرشح غير مصنف؛ 6 استبعادات بنيوية تنتظر تأكيدًا ألمانيًا مستقلًا
124 مراجعة بشرية لدلالة اقتباسات القراءة
135 السرعات 0.75×/1×/1.15× معممة آليًا؛ ينتظر فحص التشويه البشري
255 جولة وصول يدوية وتقنيات مساعدة
301 PR Preview فعلي؛ GitHub main وVercel Production متحققان
302 Workflow محلي يشغّل Desktop+Mobile؛ ينتظر Push وGitHub run أخضر
373 توجد 17 ملاحظة تونسية فعلية مشروطة؛ كلها تنتظر مراجعة تونسية/فصحى مستقلة
376 توجد 15 فئة فرق مؤثر مرتبطة بالنظرية؛ يلزم تدقيق التعميمات وتسجيل المراجع/التاريخ
```

### P0 غير المنجز — 0

لا توجد دورة P0 بلا تنفيذ الآن. التسعة الباقية جزئية لأنها تنتظر دليلًا بشريًا مستقلًا أو تشغيل GitHub/Vercel بعيدًا، لا لأنها غائبة عن المنتج.

أُغلق P0-160 عبر `content-grounded-follow-up-v1`: السؤال يعتمد على نص/تفريغ يكتبه المتعلم بعد الاستماع، لا على ادعاء فهم التسجيل. المحرك المحلي يعمل Offline، والمزود الاختياري يحتاج موافقة صريحة لكل إرسال، ولا يُرسل الصوت.

أُغلق P0-219 عبر `browser-webgpu-model-v1`: نموذج MiniLM متعدد اللغات q8 مثبت Revision يعمل داخل Web Worker بـ`device:webgpu` لترتيب أسئلة متابعة مؤلفة. التنزيل Opt-in بنحو 130–150 MB بعد فحص HTTPS/Adapter/ذاكرة/Buffer/مساحة، والأوزان خارج Git/ZIP/Offline pack، والفشل يعود إلى المحرك الحتمي. Cache كامل قابل للحذف، وRuntime المتصفحي مورّد فقط مع SHA-256 وتراخيص Apache/MIT؛ لا WASM أو Paid fallback صامت ولا STT/CEFR/acoustic claim.

### P0 المتوقف بالكامل — 0

لا يوجد بند متوقف بالكامل الآن. P0-301 جزئي: GitHub `main` وVercel Production يعملان، والمتبقي PR Preview فعلي ونتيجة CI نهائية.

لا تغيّر تصنيف P0 إلا بعد تنفيذ معيار قبول واختباره وتحديث `P0_AUDIT.md`.

---

## 8. حالة P1 — تدقيق رسمي لـ132 اقتراحًا

أُنشئ `P1_AUDIT.md` في 2026-09-07 وصُنفت كل البنود بندًا بندًا مع دليل ومتطلب متبقٍ:

```text
Total P1: 132
Implemented: 128
Partial: 4
Not implemented: 0
Blocked: 0
```

هذه الأعداد تخص معيار كل اقتراح، ولا تعني مراجعة ألمانية/عربية/حقوقية أو وصولًا بشريًا. البنود الجزئية لا تُحسب منجزة.

### P1 المنجز — 128

```text
5, 6, 7, 8, 17, 18, 19, 20, 29, 30, 31, 32, 41, 42, 43, 44, 53, 54,
55, 56, 65, 66, 67, 68, 77, 78, 79, 80, 89, 90, 91, 101, 102, 103, 104, 113,
114, 115, 116, 125, 126, 127, 128, 137, 138, 139, 140, 149, 150, 151, 152, 161, 162, 163,
164, 173, 174, 175, 176, 185, 186, 187, 188, 197, 198, 199, 200, 209, 210, 211, 212, 221,
222, 223, 224, 233, 234, 235, 236, 245, 246, 247, 248, 257, 258, 259, 260, 269, 270, 271,
272, 281, 282, 283, 284, 293, 294, 295, 296, 305, 306, 307, 308, 317, 318, 319, 320, 329,
330, 332, 337, 338, 339, 340, 341, 342, 343, 344, 365, 366, 367, 368, 378, 379, 389, 390,
391, 392
```

أُغلق P1-5 حديثًا عبر `journey-state-machine-v1`: خمس حالات Orientierung→Grundlage→Aufbau→Festigung→Prüfungsreife، مع نسبة وسبب وشرط انتقال وحدّ غير رسمي على `/today`. الحالة مشتقة من التهيئة والتشخيص وإكمال الدروس والبوابات وجاهزية جهة الامتحان؛ لا تتغير بالتصفح.

أُغلق P1-7/8 عبر `session-adaptation-v1`: بعد Check-in يستطيع المتعلم اختيار «لدي وقت أقل» أو «هذا سهل» أو «هذا صعب». يعيد النظام تركيب بقية الخطة بمدة صالحة ويحمي الكتل المنجزة؛ السهولة تنقل وقتًا محدودًا من guided practice إلى production، والصعوبة تخفض الحمل. يُحفظ السبب والوقت قبل/بعد والكتل المثبتة تحت `planning-signal-no-mastery-or-correctness` دون تعديل mastery أو correctness.

أُغلق P1-126 عبر `reading-comprehension-benchmark-v1`: مؤقت مرئي بعد Start، إلغاء عند إخفاء الصفحة، إخفاء النص قبل سؤالين، وعدم حفظ WPM إلا عند 2/2. النتيجة تضبط كتلة قراءة 5/6/8/10 دقائق داخل وقت الدرس نفسه ولا تصنع CEFR/mastery.

أُغلق P1-18 بعد إضافة `writing-device-benchmark-v1` داخل Writing Lab المحمي: نسخ جملة أصلية بمؤقت مرئي ومنع Paste، ولا تُحفظ WPM/CPM إلا عند 90% تشابه و80% طول. كتلة كتابة 5/8/10/12 دقيقة تُقتطع من practice/production دون زيادة الجلسة أو تقييم اللغة.

أُغلق P1-19/258 عبر `accessibility-preferences-v1`: القراءة المريحة هي Default، مع ثلاثة أحجام أصغر/مريح/أكبر عبر 34 رمز حجم داخل Settings والشريط العلوي الدائم، إضافة إلى التباين الأعلى والحركة المخفضة وPreview وReset. تطبق القيم على Root وتحفظ في IndexedDB/DWNB/Merge مع Default لسجلات schema-v3 القديمة، ويحترم CSS `prefers-reduced-motion`. اختبارات Desktop/Mobile/axe/persistence/reload/320px خضراء؛ P0-255 يبقى جزئيًا حتى اختبار قارئات الشاشة والأجهزة فعليًا.

أُغلق P1-65/66 عبر `support-usage-v1` و`evidence-freshness-v1`: التلميحات والترجمات والنصوص المفرغة ونماذج المقارنة تسجل كسياق غير عقابي مع المحتوى ومرحلة الالتزام، ويمكن حذف السجل منفصلًا. Progress يعرض العدادات ويخفض الثقة فقط بعد 30/90/180 يومًا بعوامل 1/0.85/0.65/0.4؛ الدرجة والمحاولات وmastery والتوقيت الخام لا تتغير. Zod/DWNB/Merge والتوافق القديم واختبارات Desktop/Mobile تغطي الدورة، دون ادعاء صلاحية سيكومترية.

أُغلق P1-77–80 عبر `error-pattern-classification-v1` و`confirmed-error-srs-v1`: ثقة اختيارية قبل التحقق، وتصنيف زلة محتملة/نمط ناشئ/خطر تصور، وأولوية high-confidence wrong بلا تغيير correctness. فشل علاجان يعيدان إلى Rule في درس المصدر. لا تدخل بطاقة الخطأ SRS إلا بعد نجاح أولي ومؤجل، وتُزال النسخ المكررة حسب wrong→correct؛ كل ReviewEvent شخصي يملك `masteryDelta=0` ولا يدخل عينة احتفاظ الدرس. Zod/DWNB/Merge و11 اختبار وحدة ودورة Desktop/Mobile تغطي الحدود دون ادعاء تشخيص معرفي.

أُغلق P1-293/295 عبر `content-near-duplicate-v1` و`content-review-state-v1`: جرى فحص 2,932 Prompt عبر 4,296,846 زوجًا، وأصلحت 24 صياغة عابرة للسياقات، وبقيت 10 أزواج داخل السياق نفسه موثقة و0 Issues. لكل كائن حالات german/arabic/cefr/copyright منفصلة؛ كل بعد 2,932 automated-pass-human-pending و0 مستقل. P1-92 جزئي فقط لأن authorized external corpora = 0 وCopyright clearance معلّق، ولا يُخزن نص Menschen/Hueber أو نص امتحان رسمي للمقارنة.

أُغلق P1-53/281/339/340 عبر `local-study-exports-v1`: Preview يختار الخطة/الأدلة/الاسم Opt-in، ثم ICS IANA، طباعة HTML دلالية، PDF Canvas/JPEG محلي، وAnki TSV UTF-8+BOM مع Formula-injection guard. لا وسائط ولا مفاتيح ولا نصوص إنتاج حر؛ DWNB وحده للاستعادة. 10 اختبارات وحدة وDesktop/Mobile Downloads حقيقية تثبت MIME/الأسماء والبنية، مع حد أن PDF صوري غير Tagged.

أُغلق P1-20/32/54 عبر `fourteen-day-learning-contract-v1` و`single-skill-diagnostic-v1` و`quiet-hours-local-v1`: عقود 14 يومًا append-only تظهر على Today، وإعادة مهارة واحدة بأربعة أسئلة A1–B2 وصيغة بديلة دون تغيير التشخيص/المستوى، ونوافذ هدوء ليلية/نهارية تخفي Nudge غير الضروري مع Deadline safety exception. لا Push ولا Notification API ولا mastery/gate مزيف؛ Zod/DWNB/Merge و11 اختبار وحدة ودورة Desktop/Mobile تغطيها.

أُغلق P1-223/330 عبر `ai-resilient-fallback-v1`: AbortController بمهلة 12 ثانية وتصنيف 429/Timeout/Network/HTTP/Malformed عبر Gemini/OpenRouter/Ollama. بعد Consent ومحاولة واحدة فاشلة يعود Tutor/Follow-up المحلي الحتمي مع Provenance ولا يحدث إرسال ثانٍ؛ Retry يحتاج موافقة جديدة. 17 اختبارًا تشمل Matrix من 12 حالة وHTTP503 وOpenRouter success وSpeaking fallback، مع Desktop/Mobile 429 فعلي Mock.

أُغلق P1-210/222/224 عبر `tutor-follow-up-command-v1` و`ai-provider-capability-matrix-v1`: أزرار Einfacher/Noch ein Beispiel/Auf Arabisch ترتبط بآخر جواب وهدف الدرس؛ Disabled يعمل عبر `local-rules-command-v1` بلا شبكة، وكل Gemini/OpenRouter/Ollama يحتاج Consent جديدًا ولا يرسل أخطاء نشطة أو Answer key. تحفظ Zod/DWNB نوع الأمر وparent/provider/model/consent تحت `support-only-no-answer-key-no-mastery-or-correctness`. تعرض Settings خمسة مزودات مع model/feature/setup/network/privacy/quota/0 USD/source/fallback وتصرح بأن الحصة اللحظية غير قابلة للقراءة. Mocks النجاح تغطي Tutor/command/typed-Speaking لكل مزود موصول وWorker WebGPU لمساره المحدود؛ ADR-042 يصل مراجعة الكتابة الاستشارية بـGemini وحده عند الشك، ويبقي بقية المزودات غير موصولة لهذا المسار.

أُغلق P1-139/150/151 عبر `three-pass-listening-sequence-v1` و`articulation-contrast-practice-v1`: في 84/84 درسًا يثبت المتعلم هدفًا German-first قبل ظهور المشغل، ثم سؤال الفكرة بعد بدء MP3/TTS، ثم أسئلة التفاصيل، ولا يفتح النص حتى تثبيت الجميع. مراحل العملية deduplicated تحت no-score/no-mastery ومتوافقة مع المحاولات القديمة وقابلة للحذف/DWNB/Merge. مرحلة النطق تعرض SVG أصليًا Inline للفم/الأسنان/اللسان/الحنك/الهواء مع نص بديل، وستة ملفات حركة على الأقل، وزوجين موسومين كـminimal/sound/prosody contrast. تحدي TTS المخفي يحفظ مطابقة العينة الاصطناعية فقط، لا نطق المتعلم أو طلاقته أو CEFR.

أُغلق P1-175/186 عبر `writing-error-micro-practice-v1` و`practice-law-language-boundary-v1`: سبعة أنماط حتمية ضيقة تبني حتى ثلاثة تمارين Korrigieren Sie من مقتطف فعلي في النسخة المقدمة، مع تصحيح مؤجل وربط submission/version/task/pattern دون mastery/gate، وZod/DWNB/Merge وحذف الكتابة والعلاج معًا. `hybrid-writing-review-v1` ينفذ قرار المالك: المنصة هي المعلّم الذاتي الأساسي والصادق، مع الفحص المحلي أولًا وإظهار شك المعنى/الطبيعية/الحجة، ثم Gemini BYOK وحده كمراجعة استشارية بطلب وConsent مستقل لكل نسخة. الحمولة نص النسخة الموافق عليه فقط، والعقد يفرض اقتباسًا حرفيًا لكل Issue وConfidence/Unresolved، ويحفظ SHA-256/provider/model/prompt دون مفتاح أو Score/mastery، ولا يدعي مصححًا كاملًا أو بديلًا مضمونًا عن مدرس. كل مرحلة Rule في 84/84 درسًا تفصل Sprachregel المؤلفة وÜbliche Praxis السياقية وOffizielle Vorgabe/Gesetz غير المدعاة.

أُغلق P1-271/272 عبر `evidence-derived-achievement-v1` و`gamification-visibility-v1`: ستة إنجازات تعاد اشتقاقها من درس مكتمل أو أربعة Reviews مؤجلة فريدة أو Revision مرتبطة أو Speaking listen-back/reflection أو 24 درس A1 أو Full simulation كاملة؛ لا فتح صفحة/نقر/دقائق خام ولا Badge مخزنة أو mastery/CEFR/reward. Settings يوفر واجهة تحفيزية أو هادئة بالكامل؛ الهادئة تخفي الإنجازات والسلسلة والمدح والزخرفة، وتستبدل الرسائل المختلطة بصياغة وظيفية مع إبقاء المهام والبوابات والنتائج والساعات والتحذيرات. Root/old-v3/DWNB/Merge/Reset مغطاة بلا حذف دليل.

أُغلق P1-338/341 عبر `review-keyboard-shortcuts-v1` و`local-content-note-v1`: Review يعرض Space و1/3/4/5 مع ARIA، يمنع Grade قبل الكشف ويتجاهل Repeat/Modifiers وحقول الإدخال/الأزرار/الروابط، ويمر عبر `applyReviewGrade` مع قفل حدث مزدوج. سجل 394 مرجعًا صالحًا يغطي 84 درسًا و160 مادة مكتبة و150 مهمة امتحان؛ الدروس والمكتبة توفر Bookmark وملاحظة 600 حرف منزوعة Bidi controls، وSettings يدير فتح السياق والحذف الفردي/الكامل. strict Zod/old-v3/DWNB/latest-merge بلا Answer key تلقائي أو search/AI/mastery.

أُغلق P1-344/366 عبر `personal-vocabulary-import-v1` و`local-content-error-report-v1`: TSV Preview-first بعقد German/Arabic/Example/Tags وحد 256 KB/500 صف يرفض Formula/HTML/shape/language/tags/duplicates وينظف Bidi بتحذير، ثم يستورد المقبول فقط إلى قائمة محلية بلا SRS/mastery/CEFR مع حذف وold-v3/Zod/DWNB/Merge. بلاغ المحتوى يربط kind/ID/route/title/version عبر سجل 394 مرجعًا، يعرض Preview metadata-only ثم يحفظ `local-draft-not-submitted` ويتيح نسخ/تنزيل JSON يدويًا؛ لا Network/GitHub API ولا Answer key/progress/key، مع Manager وحذف.

أُغلق P1-17/41/43/44 عبر `prior-experience-context-v1` و`equivalent-mission-alternative-v1` و`automatic-load-reduction-offer-v1` و`today-session-offline-readiness-v1`: Onboarding يجمع اختياريًا مصادر الدراسة واسم كتاب/دورة بأي لغة والعوائق دون تحديد CEFR أو كتابة ألمانية للمبتدئ. Today يقدم بديلًا مستقلًا يحافظ على الهدف ونوع الدليل والدقائق ولا يكمل الأصل. بعد Check-in يعد LearningProvider زمن النشاط المرئي عبر كل المسارات، ويعرض اقتراح تخفيف واحدًا بعد ثلاث أخطاء متتالية أو تجاوز فعلي؛ القبول/الرفض للمتعلم ولا يحذف دليلًا أو mastery. Service Worker المتحكم يفحص مسارات وصوت الجلسة داخل Shell/pack Cache v118، ويعرض الناقص ورابط تنزيل يدوي فقط. العقود Strict nested Zod وschema-v3/DWNB/Merge واختبارات Unit/Desktop/Mobile.

أُغلق P1-91/101/102/103 عبر `module-recycling-ratio-v1` و`lexical-strategy-registry-v1`: كل مراجعة وحدة عشرة أسئلة فريدة بنسبة قديم 0% لأول وحدة ثم 20% في A1 و30% في A2/B1 و40% في B2، وتمزج المفردات والبنية من وحدات أقدم مع Prompt ألماني أولًا؛ النسبة لا تصنع mastery/CEFR. مستكشف Search يعرض 32 عائلة و128 عضوًا بعلاقة base/derivation/compound/semantic-relative صريحة، و32 مثال سجل موزعة مرتين لكل formal/neutral/colloquial/professional في كل مستوى، و24 مربكًا للعرب (6 لكل مستوى) مع `notUniversal:true`. `lexical-strategy-audit-v1` Strict وفاشل عند الانحراف داخل prebuild؛ 30/30 خطط وصفر Issues.

أُغلق P1-113/114/115/125 عبر `grammar-progression-map-v1` و`comprehension-question-taxonomy-v1`: خريطة `/path` تعرض 24 قاعدة محورية و31 prerequisite بلا دورات، ستًا لكل مستوى. كل قاعدة تملك Theory فعليًا وتمرينين مضبوطين ومهمة إنتاج من الدرس وشرح alignment، وطبقات الآن/الحد/المؤجل وحدين واستثناء. مرحلة Rule تعرض العقد دون IDs أو mastery. صُنفت 504/504 أسئلة القراءة والاستماع مرة واحدة إلى gist/detail/stance/inference/structure؛ كل مستوى يملك الخمسة مع Detail ≤72% وGist 12–30%، وQuestionQuiz ألماني أولًا. `learning-architecture-audit-v1` Strict وفاشل في prebuild؛ التصنيف الحتمي لا يدعي مراجعة بشرية دلالية أو Score.

أُغلق P1-127/128/137/138 عبر `easy-vs-exam-reading-v1` و`unknown-word-and-compound-strategy-v1` و`unified-listening-usage-evidence-v1` و`prosody-rhythm-progression-v1`: وضعي Easy/Exam المنفصلين، و63 تحدي كلمة مجهولة بمعنى مؤلف، وسجل Listening موحد عبر سبعة أسطح، و16 خطوة Prosody تغطي أربع وظائف لكل مستوى. سجل الاستماع strict Zod وIndexedDB/DWNB/Merge، ولا يحمل correctness أو mastery؛ عينات النبر Browser TTS اصطناعية ولا تقيس المتعلم.

أُغلق P1-140/152/162/163 عبر `local-rms-pause-estimate-v1` و`learner-attributed-language-vs-device-v1` و`central-redemittel-function-register-v1`: تقدير طاقة/صمت محلي مع زمن التحضير والكلام، وتصنيف صعوبة يختاره المتعلم، وبنك 32 عبارة حسب ثماني وظائف وأربعة سجلات. لا STT أو فونيمات أو تشخيص جهاز أو درجة طلاقة.

أُغلق P1-173/185/187/200 عبر `visible-writing-version-diff-v1` و`practical-context-registry-v1` و`training-interaction-log-v1`: Diff كلمات مرئي، و16 ملاحظة ثقافية مؤرخة بلا تعميم، و20 نموذجًا/إشعارًا، وسجل pause/resume/change بلا نص جواب أو correctness/mastery.

أُغلق P1-235/246/247/248 عبر `partial-study-sections-export-v1` و`offline-recovery-page-v1` وChecksum staging resume و`js-budget-v1`: تصدير انتقائي غير قابل للاستعادة، صفحة Offline مستقلة، استئناف موارد متحقق SHA-256، وميزانيات Gzip تفشل Build.

أُغلق P1-282/284/318/365 عبر `weekly-planned-actual-no-blame-v1` و`evidence-velocity-readiness-range-v1` و`vercel-csp-headers-v1` و`dwnb-deprecation-policy-v1`: Today يقارن الوقت المنقضي بالدقائق المسجلة دون عقوبة أو دين، ومركز الامتحان يعرض نطاق أسابيع أو insufficient-data دون Pass date. CSP مركزية تمنع wildcard وgeneric unsafe-eval وتسمح فقط بأصول AI/WebGPU/loopback المدققة. v1 مدعوم بتحذير حتى 2027-03-31 ثم يرفض قبل mutation؛ v2/v3 حاليان. انظر ADR-050.

أُغلق P1-367/368/389 عبر `independent-curriculum-version-v1` و`content-accountability-lifecycle-v1`: نسخة المنهج مستقلة في State/DWNB/Merge، و2,932 سجلًا/13 عائلة/16 مصدرًا/12 Risk تملك owner/reviewer ودورة Draft→Validated→Published. أضيف 12 Claim قنصليًا/قانونيًا عامًا و18 بند نطق محتملًا للعرب؛ تبقى P1-377/380 جزئية لأن المراجعة المختصة/الفونيتية الفعلية معلقة و7 بنود نطق guided-only. انظر ADR-051.

### P1 الجزئي — 4

```text
92, 331, 377, 380
```

### P1 غير المنجز — 0

لا يوجد بند P1 بلا دورة مستقلة الآن. تبقى 4 بنود جزئية، وبعضها يحتاج مراجعة بشرية أو Corpus/جهازًا فعليًا.

### الأولوية P1 التالية

1. P1-377/380: اكتملت البنية الآلية؛ تبقى المراجعة القنصلية/القانونية والفونيتية المستقلة في الجولة النهائية.
2. P1-92 وP1-331 يبقيان للمراجعة الحقوقية وقارئات الشاشة الفعلية في الجولة النهائية.

المصدر الحاكم للتفاصيل والمتبقي لكل ID هو `P1_AUDIT.md`، لا هذه الخلاصة.
---

## 9. حالة P2 — تدقيق رسمي لـ140 اقتراحًا

أُنشئ `P2_AUDIT.md` في 2026-09-10 وصُنفت كل البنود بندًا بندًا:

```text
Total P2: 140
Implemented: 118
Partial: 2
Not implemented: 20
Blocked: 0
```

### P2 المنجز — 116

```text
9, 10, 11, 12, 21, 23, 33, 34, 35, 36, 45, 46, 47, 48, 57, 58, 59, 60,
69, 70, 71, 72, 81, 82, 83, 84, 94, 95, 105, 106, 107, 108, 117, 118, 120, 129, 130, 131, 132, 141, 142,
143, 144, 153, 154, 155, 166, 167, 177, 178, 179, 180, 189, 190, 191, 192, 201, 202, 203,
204, 213, 214, 226, 227, 228, 237, 238, 239, 240, 249, 250, 251, 252, 261, 262, 263, 273,
274, 275, 285, 286, 287, 288, 297, 298, 299, 300, 309, 310, 311, 321, 322, 323, 324, 333, 334, 335, 336, 345,
346, 347, 348, 351, 353, 354, 356, 358, 369, 370, 372, 381, 382, 383, 393, 394, 395, 396
```

### P2 الجزئي — 2

```text
264, 384
```

### P2 غير المنجز — 22

```text
22, 24, 93, 96, 119, 156, 165, 168, 215, 216, 225, 276, 312, 349, 350, 352, 355, 357, 359, 360, 371
```

لا تعني الأعداد أن P2 أولوية أعلى من مراجعات P0/P1 البشرية. المصدر الحاكم للدليل والمتبقي لكل بند هو `P2_AUDIT.md`.

حالة P2 بعد Sprint إغلاق البنود الجزئية:

```text
P2-273 — Reflection أسبوعي مستقل: منجز عبر independent-weekly-reflection-v1.
44 بندًا جزئيًا قابلًا للبناء انتقل إلى implemented مع دورات UI/State/Audit واختبارات.
أغلقت دفعة الإنتاج التالية P2-45/47/153/201/203/239/286/347 عبر guidance-focus-tools-v1 والصوت المحلي وورقة الجواب.
أغلقت دفعة عيادة الأخطاء P2-81/82/83/285 عبر منحنى المحاولات الفعلية ووسم الضغط وخصوصية الطباعة وTimeline مشتق بلا ادعاء سببية.
أغلقت دفعة الإملاء المتكيف P2-142 عبر 16 مهمة A1–B2 ودورة استمع→اكتب→قارن→أعد تحفظ ملخصًا بلا نص أو mastery.
أغلقت دفعة مسارات المحادثة P2-354 عبر 8 أشجار أصلية محلية، وضع موجه/تحدٍ، وعواقب إكمال/إصلاح/إعادة بلا AI أو شريك حي.
أغلقت دفعة شبكات التراكيب P2-108 عبر 16 شبكة و48 وصلة سياقية واختبار مقاصد، بدل قائمة مرادفات معزولة.
أغلقت دفعة الخصائص التوليدية P2-335 عبر Harness Seed/Shrink حتمي و8,301 حالة مقارنة وMerge وتكامل Runtime.
أغلقت P2-310 عبر Vercel ignoreCommand ضيق للتوثيق Markdown فقط مع fail-open لأي شك أو تغيير Runtime.
الأساسات المنجزة محفوظة: event-derived-mastery-v1، guided-independent-support-separation-v1، bounded-attempt-process-v1، explainable-plan-change-timeline-v1، learner-selected-intensity-presets-v1.
P2-264 يبقى لاختبار WCAG 2.2 AA اليدوي الفعلي.
P2-384 يبقى للمراجعة العربية المستقلة في تونس وبقية العالم العربي.
```

لا تغلق 264 أو 384 آليًا. P2-350/360 بقيا `not-implemented` وليسا ضمن إغلاق الجزئيات.

---

## 10. ما ما زال يمنع ادعاء «إصدار مراجَع نهائيًا»

حتى مع اكتمال 84/84، ما يلي غير منجز ولا يجوز إخفاؤه:

قرار المالك الحالي: تُستكمل الشيفرة والاختبارات الآلية أولًا، ثم تُنفذ جولة الاختبارات اليدوية الحقيقية والمراجعة البشرية على المشروع كاملًا؛ لا تُحوّل الأعمال المؤجلة إلى «منجزة» قبل تلك الجولة.

1. مراجعة أكاديمية ألمانية مستقلة لكل A1–B2.
2. مراجعة عربية/تونسية مستقلة.
3. تدقيق تشابه وحقوق مستقل مع Menschen والمواد الرسمية.
4. مراجعة شروط مزود الصوت قبل توزيع تجاري.
5. صوت بشري متعدد المتحدثين؛ الحالي اصطناعي أحادي.
6. تحقق acoustic/exam-grade؛ الحالي `examGrade:false`.
7. أجهزة فعلية: iOS Safari وFirefox وSamsung Internet وVoiceOver وTalkBack وNVDA وSwitch Control، ومنها تثبيت نموذج WebGPU الحقيقي وقياس الذاكرة/الحرارة/السرعة.
8. شريك محادثة حي توفره المنصة.
9. تقييم نطق أو طلاقة صالح آليًا.
10. تقييم كتابة/محادثة رسمي من Goethe أو telc.
11. Browser lockdown أو invigilation.
12. Vercel PR Preview فعلي لم يُختبر بعد؛ GitHub `main` وProduction العام متحققان.
13. GitHub Actions بعيد أخضر بعد دفع إصلاحات CI الحالية.

---

## 11. الأولوية التالية المقترحة

كل P0 القابل للبناء محليًا يملك دورة استخدام، و`P1_AUDIT.md` مكتمل 136/136 بلا أي بند `not-implemented`. أُغلقت P1-367/368/389، وتبقى 4 بنود P1 جزئية تحتاج دليلًا بشريًا مستقلًا. البنية الآلية لـP1-377/380 اكتملت دون ادعاء المراجعة. الأولوية البرمجية التالية:

```text
ثبّت Sprint إغلاق 44 بندًا: npm run check ثم Playwright Desktop/Mobile ثم ZIP.
بعد الرفع: GitHub Actions وPR/Vercel Preview.
```

لا تغلق P1-92/331/377/380 أو أي مراجعة بشرية بلا دليل مستقل. وإذا دفع المستخدم Snapshot إلى GitHub، تحقق بالتوازي من CI وPR Preview لإغلاق P0-302/301.
---

## 12. بروتوكول التنفيذ الإلزامي لكل دفعة

1. حدّد مشكلة واحدة أو مجموعة مترابطة عالية القيمة.
2. افحص الشيفرة الحالية قبل إنشاء ملفات جديدة.
3. عرّف معيار قبول قابلًا للاختبار.
4. نفّذ داخل المشروع، لا في تقرير فقط.
5. أضف Unit/Integrity tests.
6. عدّل E2E Desktop/Mobile عندما يتغير UX أو IndexedDB أو Offline.
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

- `npm run dev` و`npm run build` يستخدمان Webpack صراحة. قُتلت ثلاثة Builds باردة متتالية لـTurbopack داخل Sandbox ذي 2 GB، بينما نجح Webpack في المصدر نفسه وأنتج 302 صفحة:

```bash
next dev --webpack
next build --webpack
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
- أن P1 أو P2 مكتملان خلاف الأرقام والصفوف في `P1_AUDIT.md` و`P2_AUDIT.md`.
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
P1: X/132 منجز، Y جزئي، Z غير منجز وفق P1_AUDIT.md
P2: 117/140 منجز، 2 جزئي، 21 غير منجز، 0 متوقف وفق P2_AUDIT.md

### الجودة
Unit/Integrity: N/N
Playwright Desktop + Mobile: M/M
Generated pages: P
Offline routes: R/R
Offline cache: vX

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

بعد قراءة الملفات والتحقق من الأعداد، لا تطلب خطة جديدة إذا كان المطلوب «واصل». P0 القابل للبناء مكتمل و`P1_AUDIT.md` يصنف 136/136 بلا بنود `not-implemented`؛ الباقي P1-92/331/377/380 يحتاج Corpus أو قارئات شاشة أو مراجعة مختصة فعلية. `P2_AUDIT.md` يصنف 140/140، وكل البنود الجزئية البرمجية أُغلقت؛ يبقى P2-264/384 للجولة اليدوية/البشرية النهائية. إذا توفر Push فتحقق من CI وPR Preview لإغلاق P0-302/301. اترك المراجعات البشرية وتثبيت WebGPU الحقيقي على أجهزة ممثلة للجولة النهائية وفق قرار المالك.

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
pkg update -y && pkg install -y git gh unzip coreutils nodejs-lts && termux-setup-storage && cd "$HOME/storage/downloads" && sha256sum -c wegberlin-full.zip.sha256 && rm -rf "$HOME/wegberlin-upload-tools" && mkdir -p "$HOME/wegberlin-upload-tools" && unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh -d "$HOME/wegberlin-upload-tools" && chmod +x "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" && "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" "$HOME/storage/downloads/wegberlin-full.zip" "Update audited WegBerlin learning platform"
```

السلوك الأمني الإلزامي للسكربت:

- يطلب Fine-grained أو Classic PAT بإدخال مخفي.
- Fine-grained PAT للمستودع يحتاج `Contents: Read and write`؛ Classic يحتاج `repo`.
- يتحقق أن الحساب `naderba69` بواسطة `GH_TOKEN` و`gh api user` دون `gh auth login`.
- لا يضع PAT في Remote URL أو shell history أو ملف دائم.
- يستخدم AskPass مؤقتًا ثم يحذفه.
- يحافظ على `.git` وتاريخ المستودع، ويستبدل شجرة المشروع كاملة.
- يفعّل `.githooks/pre-commit` ويشغّل `secret-audit-v1` على الشجرة وكل History قبل Staging.
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
docs/generated/LEXICAL_TARGET_GAP_REPORT.md
src/core/content-validation/lexical-target-gap.ts
src/data/lexical-target-decisions.ts
src/core/evidence/mastery-weighting.ts
src/core/srs/sm2.ts
src/data/lexical-grammar-a1.ts
src/data/lexical-grammar-a2.ts
src/data/lexical-grammar-b1.ts
src/data/lexical-grammar-b2.ts
src/data/lexical-grammar-registry.ts
src/components/lexical-grammar-panel.tsx
src/data/tunisian-support-registry.ts
src/components/tunisian-support-panel.tsx
reports/tunisian-support-audit.json
docs/generated/TUNISIAN_SUPPORT_REPORT.md
src/core/audio/playback-speed.ts
src/components/audio-speed-control.tsx
docs/adr/ADR-021-educational-listening-speed-policy.md
```

GitHub `main` وVercel Production متحققان عند `be56463e`. لا تعتبر P0-301 منجزًا قبل إنشاء Pull Request والتحقق من Preview URL فعلي ثم إغلاقه.

---

## 18. بروتوكول استعادة المشروع من النسخة الاحتياطية

إذا فُقد سياق المحادثة أو تعطلت الجلسة، تعامل مع `wegberlin-full.zip` باعتباره Snapshot الشيفرة المحلية الأحدث، ومع هذا الملف باعتباره خريطة الاستمرار. نفّذ بالترتيب:

1. تحقق من البصمة قبل فك الضغط:

```bash
sha256sum -c wegberlin-full.zip.sha256
```

2. افحص سلامة الأرشيف وأن `package.json` في الجذر:

```bash
unzip -t wegberlin-full.zip
zipinfo -1 wegberlin-full.zip | grep -x 'package.json'
```

3. فكّه داخل مجلد فارغ، ولا تفكّه فوق مستودع يحوي تعديلات غير محفوظة:

```bash
mkdir -p der-weg-nach-berlin-recovered
unzip wegberlin-full.zip -d der-weg-nach-berlin-recovered
cd der-weg-nach-berlin-recovered
```

4. اقرأ ملفات الحقيقة المذكورة في القسم 2، ثم شغّل:

```bash
npm ci
npm run check
```

5. إذا تغير UX/runtime لاحقًا، ثبّت Chromium وشغّل المشروعين بلا اختصار:

```bash
npx playwright install --with-deps chromium
npx playwright test --project=chromium
npx playwright test --project=mobile-chromium
```

6. لا تعتبر غياب `.git` داخل ZIP خطأ؛ استبعاده مقصود لمنع خلط History أو أسرار الاعتماد. استخدم سكربت Termux الآمن أو Clone نظيفًا عند الرفع.
7. قارن النتيجة بهذه Snapshot قبل أي ادعاء:

```text
84/84 lessons
30/30 modules and projects
2/2 exam profiles
24/24 targeted simulations
12/12 full simulations
260 physical MP3 files + 260 physical Opus files
306/306 Offline routes
868/868 unit/integrity tests across 136/136 files
76/76 desktop+mobile browser tests
P0 = 115 implemented / 9 partial / 0 missing / 0 blocked
P1 = 128 implemented / 4 partial / 0 not implemented / 0 blocked
```

8. إذا اختلفت الأعداد بعد Build مشروع جديد، اعتمد المخرجات الجديدة المفسرة لا الأرقام القديمة، وحدّث `README.md` و`PROJECT_STATUS.md` و`P0_AUDIT.md` وهذا البرومبت وVerifier معًا.

### الملفات الأولى للعمل التالي

```text
P2-273 المنجز:
  src/core/coach/weekly-reflection.ts
  src/components/weekly-reflection.tsx
  src/components/coach-dashboard.tsx
  src/types/learning.ts
  tests/unit/weekly-reflection-target-planning.test.ts
  P2_AUDIT.md

P2-57 المنجز:
  src/core/coach/intensity-presets.ts
  src/components/planning-preferences-control.tsx
  src/core/coach/session-signals.ts
  src/core/coach/weekly-plan.ts
  tests/unit/intensity-presets.test.ts

P2-48 المنجز:
  src/core/coach/plan-change-timeline.ts
  src/components/plan-change-timeline.tsx
  src/components/coach-dashboard.tsx
  tests/unit/plan-change-timeline.test.ts

P2-33/34 المنجز:
  src/core/evidence/attempt-process.ts
  src/components/exercise-card.tsx
  src/core/evidence/report.ts
  src/app/progress/page.tsx
  tests/unit/attempt-process.test.tsx

P2-70/287 المنجز:
  src/core/evidence/assistance-separation.ts
  src/core/evidence/report.ts
  src/app/progress/page.tsx
  tests/unit/assistance-separation.test.ts

P2-72/237 المنجز:
  src/core/evidence/event-derived-mastery.ts
  src/components/learning-provider.tsx
  src/core/portability/merge.ts
  src/app/progress/page.tsx
  tests/unit/event-derived-mastery.test.ts

P1-367/368/377/380/389 المنجز/المعزز:
  src/config/curriculum-version.ts
  src/config/content-governance-registry.ts
  src/core/content-validation/content-governance.ts
  src/data/high-risk-context-claims.ts
  src/data/arabic-learner-pronunciation-inventory.ts
  scripts/generate-content-governance-audit.ts
  reports/content-governance-audit.json
  docs/adr/ADR-051-curriculum-accountability-lifecycle-claims-and-pronunciation-inventory.md

P1-282/284/318/365 المنجز:
  src/core/coach/weekly-plan.ts
  src/core/exams/readiness.ts
  src/config/security-headers.ts
  scripts/audit-security-headers.ts
  src/core/portability/deprecation.ts
  docs/DWNB_DEPRECATION_POLICY.md
  tests/unit/planning-readiness-security-deprecation.test.ts
  docs/adr/ADR-050-no-blame-time-readiness-csp-and-dwnb-deprecation.md

P1-127/128/137/138 المنجز:
  src/components/library-view.tsx
  src/components/unknown-word-strategy.tsx
  src/core/reading/unknown-word.ts
  src/core/listening/usage-evidence.ts
  src/components/learning-provider.tsx
  src/components/prosody-progression-panel.tsx
  src/data/prosody-progression.ts
  src/types/learning.ts
  src/core/portability/schema.ts
  src/core/portability/merge.ts
  scripts/generate-study-modes-audit.ts
  reports/study-modes-audit.json
  docs/generated/STUDY_MODES_REPORT.md
  tests/unit/study-modes-listening-evidence.test.tsx
  docs/adr/ADR-046-reading-modes-listening-evidence-and-prosody.md

P1-113/114/115/125 المنجز:
  src/data/grammar-progression-registry.ts
  src/core/comprehension/question-taxonomy.ts
  src/core/content-validation/learning-architecture.ts
  src/components/grammar-progression-map.tsx
  src/components/rule-progression-panel.tsx
  src/components/path-view.tsx
  src/components/lesson-runner.tsx
  src/components/lesson-listening-sequence.tsx
  src/components/exercise-card.tsx
  scripts/generate-learning-architecture-audit.ts
  reports/learning-architecture-audit.json
  docs/generated/LEARNING_ARCHITECTURE_REPORT.md
  tests/unit/learning-architecture.test.tsx
  tests/e2e/critical-flows.spec.ts
  docs/adr/ADR-045-grammar-progression-and-comprehension-taxonomy.md

P1-91/101/102/103 المنجز:
  src/data/lexical-strategy-registry.ts
  src/core/lexical-strategy/recycling.ts
  src/core/content-validation/lexical-strategy.ts
  src/components/lexical-strategy-explorer.tsx
  src/components/bilingual-search-view.tsx
  src/components/module-review.tsx
  scripts/generate-lexical-strategy-audit.ts
  reports/lexical-strategy-audit.json
  docs/generated/LEXICAL_STRATEGY_REPORT.md
  tests/unit/lexical-strategy.test.tsx
  tests/e2e/critical-flows.spec.ts
  docs/adr/ADR-044-calculated-recycling-and-lexical-strategy-registry.md

P1-17/41/43/44 المنجز:
  src/components/onboarding-panel.tsx
  src/components/coach-dashboard.tsx
  src/components/today-offline-readiness.tsx
  src/components/learning-provider.tsx
  src/core/coach/session-signals.ts
  src/core/coach/coach.ts
  src/core/offline/today-readiness.ts
  src/core/portability/schema.ts
  src/core/portability/merge.ts
  public/sw.js
  tests/unit/session-signals.test.ts
  tests/unit/onboarding-profile.test.ts
  tests/unit/today-offline-readiness.test.ts
  tests/e2e/critical-flows.spec.ts
  docs/adr/ADR-043-guided-entry-equivalent-alternatives-load-and-offline-readiness.md

P1-344/366 المنجز:
  src/core/vocabulary/personal-import.ts
  src/core/reports/content-error-report.ts
  src/components/personal-vocabulary-import.tsx
  src/components/content-error-report-control.tsx
  src/components/content-error-reports-manager.tsx
  src/components/settings-view.tsx
  src/core/portability/schema.ts
  tests/unit/personal-vocabulary-error-report.test.ts
  docs/adr/ADR-041-safe-vocabulary-import-and-local-error-reports.md

P1-338/341 المنجز:
  src/core/review/shortcuts.ts
  src/core/notes/content-notes.ts
  src/app/review/page.tsx
  src/components/content-note-control.tsx
  src/components/content-notes-manager.tsx
  src/components/lesson-runner.tsx
  src/components/library-view.tsx
  src/core/portability/schema.ts
  tests/unit/review-shortcuts-content-notes.test.ts
  docs/adr/ADR-040-review-shortcuts-and-local-content-notes.md

P1-271/272 المنجز:
  src/core/coach/achievements.ts
  src/core/coach/motivation-preferences.ts
  src/components/evidence-achievements.tsx
  src/components/motivation-preferences-control.tsx
  src/components/coach-dashboard.tsx
  src/components/app-shell.tsx
  src/app/progress/page.tsx
  src/core/portability/schema.ts
  tests/unit/achievements-gamification.test.ts
  docs/adr/ADR-039-evidence-achievements-and-optional-gamification.md

P1-175/186 المنجز:
  src/core/writing/error-practice.ts
  src/core/writing/analyze.ts
  src/core/governance/claim-boundary.ts
  src/components/writing-repair-practice.tsx
  src/components/writing-lab.tsx
  src/components/claim-boundary-panel.tsx
  src/components/lesson-runner.tsx
  src/core/portability/schema.ts
  tests/unit/writing-repair-claim-boundary.test.ts
  tests/unit/hybrid-writing-review.test.ts
  docs/adr/ADR-038-writing-error-micro-practice-and-claim-boundaries.md
  docs/adr/ADR-042-honest-primary-writing-tutor-with-gemini-doubt-review.md

P1-139/150/151 المنجز:
  src/core/listening/sequence.ts
  src/core/pronunciation/articulation.ts
  src/components/lesson-listening-sequence.tsx
  src/components/lesson-listening-player.tsx
  src/components/pronunciation-articulation-lab.tsx
  src/components/lesson-runner.tsx
  src/core/portability/schema.ts
  tests/unit/listening-pronunciation-sequence.test.ts
  docs/adr/ADR-037-three-pass-listening-and-articulation-contrasts.md

P1-210/222/224 المنجز:
  src/core/ai/client.ts
  src/core/ai/provider-capabilities.ts
  src/components/tutor-view.tsx
  src/components/ai-provider-capability-matrix.tsx
  src/components/settings-view.tsx
  src/core/portability/schema.ts
  tests/unit/ai-provider-capabilities.test.ts
  tests/unit/ai-provider-mock-matrix.test.ts
  docs/adr/ADR-036-linked-tutor-commands-and-provider-capability-matrix.md

P1-223/330 المنجز:
  src/core/ai/client.ts
  src/components/tutor-view.tsx
  src/components/speaking-lab.tsx
  tests/unit/ai-resilience.test.ts
  docs/adr/ADR-035-resilient-optional-ai-fallback.md

P1-20/32/54 المنجز:
  src/core/coach/learning-agreement.ts
  src/core/diagnostic/single-skill.ts
  src/components/planning-preferences-control.tsx
  src/components/skill-diagnostic-retest.tsx
  src/components/learning-contract-summary.tsx
  tests/unit/learning-agreement-skill-retest.test.ts
  docs/adr/ADR-034-learning-contract-skill-retest-and-quiet-hours.md

P1-53/281/339/340 المنجز:
  src/core/exports/study-exports.ts
  src/components/study-export-control.tsx
  tests/unit/study-exports.test.ts
  docs/adr/ADR-033-local-study-exports.md

P1-293/295 المنجز وP1-92 الجزئي:
  src/core/content-validation/content-similarity-review.ts
  src/config/content-originality-review-registry.ts
  scripts/generate-content-similarity-review-audit.ts
  reports/content-similarity-review-audit.json
  docs/generated/CONTENT_SIMILARITY_REVIEW_REPORT.md
  tests/unit/content-similarity-review.test.ts
  docs/adr/ADR-032-internal-similarity-and-separate-review-states.md

P1-77–80 المنجز:
  src/core/errors/capture.ts
  src/core/errors/pattern.ts
  src/core/errors/remediation.ts
  src/core/srs/error-cards.ts
  src/core/srs/review-queue.ts
  src/components/error-notebook.tsx
  src/components/exercise-card.tsx
  tests/unit/error-pattern-srs.test.ts
  docs/adr/ADR-031-confidence-aware-error-intervention-and-srs.md

P1-65/66 المنجز:
  src/core/evidence/support-usage.ts
  src/core/evidence/freshness.ts
  src/core/evidence/report.ts
  src/app/progress/page.tsx
  src/components/lesson-runner.tsx
  src/components/settings-view.tsx
  tests/unit/support-usage-freshness.test.ts
  docs/adr/ADR-030-support-use-and-evidence-freshness.md

P1-19/258 المنجز:
  src/core/accessibility/preferences.ts
  src/components/accessibility-preferences-control.tsx
  src/components/app-shell.tsx
  src/app/globals.css
  tests/unit/accessibility-preferences.test.ts
  tests/e2e/critical-flows.spec.ts
  docs/adr/ADR-029-persistent-visual-accessibility-preferences.md

P1-18/126 المنجز:
  src/core/reading/benchmark.ts
  src/components/reading-benchmark.tsx
  src/core/writing/device-benchmark.ts
  src/components/writing-device-benchmark.tsx
  tests/unit/reading-benchmark.test.ts
  tests/unit/writing-device-benchmark.test.ts
  docs/adr/ADR-027-reading-speed-requires-comprehension.md
  docs/adr/ADR-028-writing-speed-is-device-planning-only.md

P1-7/8 المنجز والمرجعي:
  src/core/coach/session-signals.ts
  src/core/coach/coach.ts
  src/components/coach-dashboard.tsx
  tests/unit/session-signals.test.ts
  docs/adr/ADR-026-immediate-session-adaptation-without-mastery.md

P1-5 المنجز والمرجعي:
  src/core/coach/journey-state.ts
  src/components/coach-dashboard.tsx
  tests/unit/journey-state.test.ts
  docs/adr/ADR-025-derived-journey-state-machine.md

P0-219 المنجز والمرجعي:
  src/config/webgpu-model-registry.ts
  src/core/ai/webgpu-model.ts
  src/components/webgpu-model-control.tsx
  public/webgpu-model-worker.js
  public/vendor/webgpu/
  tests/unit/webgpu-model.test.ts
  docs/WEBGPU_MODEL.md
  docs/adr/ADR-024-opt-in-browser-webgpu-embedding-model.md

P0-160 المنجز والمرجعي:
  src/core/speaking/content-follow-up.ts
  src/components/speaking-lab.tsx
  src/core/ai/client.ts
  tests/unit/content-follow-up.test.ts
  docs/adr/ADR-023-text-grounded-speaking-follow-up.md
```

### علامة أن الاستعادة نجحت

الاستعادة صحيحة عندما يكون `npm run check` أخضر، ويظهر `npm run handoff:check` الحالة والأعداد نفسها، ولا يوجد Secret في الفحص، ثم يمكن للوكيل متابعة بند P2 غير منجز من `P2_AUDIT.md` دون إعادة فتح P2-142 أو P1 المنجز أو إعادة بناء الإملاء/استيراد المفردات/البلاغات/الاختصارات/الملاحظات/الإنجازات، ودون كسر حدود P1-92/P0-160/P0-219.

## آخر دفعة UX فعلية بعد تجربة المتعلم — ADR-059

`beginner-readable-completion-v1` يلغي من سطح المتعلم صياغات `0/1 مطلوب` و«عالج الآن» والشرطة المبهمة، ويعرض مهمة تالية واحدة وقائمة إكمال بشرية مع إبقاء حدود 70%/1 قراءة/1 استماع/80% Mini-Test نفسها. القراءة المريحة أصبحت Default مع أصغر/مريح/أكبر من Settings والشريط العلوي. تحدث `a1-01` يبدأ بنماذج TTS اصطناعية وهدف 5–10 ثوانٍ دون مؤقت تحضير قسري، والدعم ظاهر افتراضيًا مع `guided-speaking-support-provenance-v1` حتى لا تحسب المحاولة الموجهة مستقلة. `guided-mediation-from-understanding-to-free-v1` يربط وساطة `a1-01` بهدف وخطة مصدرية مطابقة بدل حقول مجردة. أضاف ADR-060 بعد هذه الدفعة STT محليًا لمطابقة الكلمات فقط؛ المصحح الفونيمي المحلي ما زال غير موجود. راجع `docs/adr/ADR-059-beginner-readable-guided-production.md`.

## حزمة مطابقة الكلمات المحلية — ADR-060

`local-german-word-matching-v1` يثبت اختياريًا نموذج `onnx-community/whisper-tiny` متعدد اللغات q8 عند Revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7` داخل Worker WebGPU وCache `dwnb-pronunciation-model-v1`. التنزيل 70–90 MB تقريبي وصريح، محظور في Low-data أو عند فشل HTTPS/Adapter/4 GB/128 MiB/المساحة/حداثة المصادر. التسجيل القصير 0.35–20 ثانية يُفك ويخلط Mono ويعاد إلى 16 kHz محليًا؛ `local-microphone-signal-check-v1` يمنع تمرير الصمت/الصوت المنخفض/القص إلى ASR دون ادعاء تحديد مصدر الضوضاء، والعامل ينسخ بالألمانية من Cache مكتمل مع تعطيل Remote model loading وقت الاستدلال. واجهة تحدث A1-01 تطابق الكلمات المؤلفة فقط، تتجاهل الاسم الزائد، تعرض حتى ثلاث ملاحظات، وتحول كلمة غير مؤكدة إلى `local-word-repair-loop-v1`: استمع ثم سجّل واستمع لنفسك وافحص محليًا وأعد. لا يُرسل الصوت، ولا تُحفظ النتيجة، ولا توجد درجة نطق/لهجة/طلاقة/CEFR أو محاذاة فونيمية. P1-380 وP0-255 يبقيان جزئيين حتى التسجيلات العربية والمراجعة الفونيتية واختبار الأجهزة الحقيقي. راجع `docs/LOCAL_PRONUNCIATION_MODEL.md` وADR-060.

## عيادة الأخطاء المتتبعة — ADR-061

أغلقت البرمجة P2-81/82/83/285. `actual-attempt-weekly-error-trend-v1` يحسب ثمانية أسابيع Monday–Sunday من `exerciseAttempts` المؤرخة: المقام، الخاطئ، العناصر المختلفة والنسبة؛ الأسبوع الفارغ مجهول، والاتجاه وصفي لا Forecast أو أثر سببي. `learner-declared-time-pressure-error-v1` يحفظ وسم `knows-rule-under-time-pressure` يختاره المتعلم دون تشخيص/Correctness/Mastery. `learner-sensitive-error-print-redaction-v1` يبقي السجل كاملًا في التطبيق وIndexedDB/DWNB/Merge لكنه يخفي البطاقة وكل Timeline مرتبط بها تحت `@media print` فقط. `derived-error-intervention-timeline-v1` يشتق الظهور وفشل/نجاح العلاج والجدولة والتأكيد والعيادة ومراجعة البطاقة دون نص wrong/correct/explanation/answer ودون ادعاء سببية. راجع `src/core/errors/insights.ts` و`src/components/error-insights-panel.tsx` و`tests/unit/error-insights.test.ts` وADR-061.

## طبقة التنقل والهوية البصرية — ADR-062

`professional-guidance-navigation-v1` يجعل الواجهة Guidance-first بصريًا: Sidebar الحاسوب مجموعتان «التعلّم اليومي» و«المصادر والأدوات»، Topbar باسم سياق المسار الحالي لا عبارة عامة، وشريط الهاتف أربع وجهات متكررة + «المزيد». زر المزيد يفتح Bottom sheet عبر `AccessibleDialog` تضم المسارات التسعة مع نصوص وأيقونات وحالة «أنت هنا»، Close وEscape وFocus trap وعودة التركيز، وتؤكد أن التصفح لا يغير التقدم. الحركة تحترم Reduced motion، والحالة النشطة لا تعتمد اللون وحده، والمصفوفة تبقى دون Horizontal overflow من 320×568 إلى 1920×1080. المرجع `src/components/app-shell.tsx` وADR-062.

## دعم الكتابة وفهم المصطلحات — ADR-063

أُغلق P2-381/383. `virtual-german-character-keyboard-v1` مركب عالميًا لكنه يظهر فقط مع Input/Textarea قابل للتحرير و`lang=de`، ويقدم `ä ö ü ß Ä Ö Ü` ويدخل الحرف عند Selection عبر Native setter وInput event مع حفظ Focus؛ لا يقرأ القيمة أو يخزنها أو يصححها أو يرسلها ويختفي في الطباعة. `bilingual-grammar-glossary-v1` يضيف داخل Search عدد 24 مصطلحًا مؤلفًا، 6 لكل A1/A2/B1/B2، مع Term ألماني واسم/شرح عربي ومثال ألماني ومعناه؛ البحث والفلتر محليان ولا يصنعان Progress/Mastery. راجع `src/core/accessibility/german-character-input.ts` و`src/components/german-character-dock.tsx` و`src/data/grammar-glossary.ts` وADR-063.

## مختبر الإملاء المتكيف — ADR-064

أُغلق P2-142 عبر `adaptive-partial-full-dictation-v1`. المسار `/practice/dictation` يضم 16 مهمة أصلية بواقع 4 لكل مستوى: A1 جزئي، A2 ثلاث مهام جزئية ثم كاملة، B1 تمهيد جزئي ثم ثلاث كاملة، وB2 كامل. دورة `Vorbereiten → Hören → Schreiben → Vergleichen` تقفل النموذج وحقل الكتابة قبل طلب السماع، ثم تقارن نقص/زيادة/استبدال الكلمات وتفصل المطابقة اللفظية عن فرق الحروف الكبيرة والترقيم، وتسمح بإخفاء النموذج وإعادة المحاولة بلا عقوبة. `dictationAttempts` محفوظ في Zod/IndexedDB/DWNB/Merge ويحتوي ملخص الشكل وعدد التشغيل فقط، لا نص المتعلم ولا النموذج ولا keystrokes ولا mastery. Browser TTS اصطناعي تابع للجهاز، `examGrade:false`، ولا يرسل النص/الصوت إلى AI. أضيف المسار لكل حزم Offline، فأصبحت 58/58/58/207/306 وCache الحالية `dwnb-full-pack-v119`. المرجع `src/data/dictation-bank.ts` و`src/core/listening/dictation.ts` و`src/components/dictation-lab.tsx` و`tests/unit/adaptive-dictation.test.ts` وADR-064.

## مسارات المحادثة المحلية — ADR-065

أُغلق P2-354 عبر `offline-branching-conversation-v1`. المسار `/practice/conversation-paths` يضم 8 أشجار أصلية، اثنتين لكل A1/A2/B1/B2: مخبزة/تعارف، موعد/سكن، Feedback/مشروع، وتفاوض/حوار مدني. تعرض كل شجرة دور المتعلم والهدف التواصلي German-first قبل القرار؛ كل Choice يغير عاقبة الشريك ومسار إكمال/إصلاح/جزئي/إعادة فعليًا. الوضع `guided` يعرض مقصد الرد بالعربية قبل الاختيار، و`challenge` يؤجله؛ بعد Terminal تظهر مهمة Transfer بلا خيارات. `validateBranchingScenario` يمنع Cycle والعقد المفقودة/غير القابلة للوصول والنتائج الناقصة، و`createBranchingConversationAttempt` يعيد التحقق من سلسلة Choice قبل قبول Outcome. `branchingConversationAttempts` يحفظ معرفات الخيارات والنتيجة وعدد فتح الدعم فقط في Zod/IndexedDB/DWNB/Merge: لا نص حر، لا صوت، لا fetch/WebSocket/AI، لا شريك حي، ولا mastery/CEFR. Browser TTS اختياري واصطناعي تابع للجهاز. أضيف المسار لكل حزم Offline، فأصبحت 58/58/58/207/306 وCache الحالية `dwnb-full-pack-v119`. المرجع `src/data/branching-conversations.ts` و`src/core/speaking/branching-conversation.ts` و`src/components/branching-conversation-lab.tsx` و`tests/unit/offline-branching-conversation.test.ts` وADR-065.

## شبكات التراكيب السياقية — ADR-066

أُغلق P2-108 عبر `contextual-collocation-network-v1`. المسار `/practice/collocations` يضم 16 شبكة أصلية و48 وصلة فعل–اسم، 4 شبكات لكل A1/A2/B1/B2. كل وصلة لها معنى وسياق German-first ودعم عربي وسجل ومثال وحد يشرح لماذا لا تصلح الوصلة الأخرى للمقصد نفسه. يجب فتح الوصلات الثلاث في `Netz erkunden` قبل `Kontext wählen` من 3 سياقات، ثم تظهر `Übertragen`؛ وضع `guided` يعرض معنى السياق، و`challenge` يؤجله. `collocationNetworkAttempts` يحفظ IDs المستكشفة/المستهدفة/المختارة والعدد فقط عبر Zod/IndexedDB/DWNB/Merge، لا نص حر أو keystrokes أو SRS تلقائي أو AI/mastery/CEFR. المحرك يرفض ID خارج الشبكة أو استكشافًا/تغطية ناقصة أو correctness مزورًا. أضيف المسار للحزم فأصبحت 58/58/58/207/306 وCache الحالية `dwnb-full-pack-v119`. المرجع `src/data/collocation-networks.ts` و`src/core/vocabulary/collocation-network.ts` و`src/components/collocation-network-lab.tsx` و`tests/unit/contextual-collocation-network.test.ts` وADR-066.

## الخصائص التوليدية الحتمية — ADR-067

أُغلق P2-335 عبر `deterministic-generative-properties-v1`. الملف `tests/helpers/deterministic-property.ts` يوفر Harness بلا Dependency خارجية يعيد Seed نفسه ويطبع run/counterexample ويطبق Shrink اختياريًا حتى 100 خطوة. `tests/unit/deterministic-property-invariants.test.ts` يشغل 8 اختبارات و8,301 حالة مولدة/معادة عبر Idempotence التطبيع، Equivalence المقارنة المسموح، Splice لكل `ä ö ü ß Ä Ö Ü`، Merge union/max/unique/idempotence، عدادات Collocation من IDs، ومسارات محادثة عشوائية حتى Terminal مع Zod. أول تشغيل كشف `Straße→STRASSE`؛ بقي ß/ss strict وأُضيف Assertion للحد بدل إرخاء المقارنة. هذه ليست برهانًا رياضيًا أو Fuzzing أمنيًا غير محدود ولا تغلق المراجعات البشرية.

## تخطي Vercel للتوثيق فقط — ADR-068

أُغلق P2-310 عبر `vercel-docs-only-build-skip-v1`. يربط `vercel.json.ignoreCommand` السكربت `scripts/vercel-ignore-docs-only.mjs`: Exit 0 فقط إذا كانت كل الملفات Markdown في الجذر أو `docs/` غير `docs/generated`؛ أي `src/public/scripts/tests/package/workflow/config/generated` يعيد Exit 1 ويُبقي Build. Diff فارغ/غير متاح، Git error/timeout، ومسار absolute/traversal/backslash كلها fail-open إلى Build. يستخدم SHA الحالي/السابق من Vercel وإلا `HEAD^..HEAD`. main يبقى مفعّلًا، ولا ندعي أن الإعداد البعيد تغير قبل Push. ستة اختبارات تغطي العقد.

## Release Candidate — ADR-069
أُغلق P2-369 عبر `pre-production-release-candidate-v1`: `.github/workflows/release-candidate.yml` يدوي، يشغل secret history وcheck وكامل E2E، ثم يولد Attestation باسم RC وSHA كامل ويرفعها 14 يومًا. لا Deploy أو `--prod`؛ الحالة candidate-not-promoted والترقية فعل بشري منفصل. لا تدع Run بعيدًا قبل Push.

## مقارنة الحزمة — ADR-070
أُغلق P2-345 عبر `pre-update-curriculum-pack-diff-v1`: واجهة Offline تعرض curriculumVersion والبصمة والنطاق والمسارات المثبتة→المرشحة قبل التثبيت. Metadata فقط، لا semantic diff أو تثبيت تلقائي. Cache الحالية v119.
