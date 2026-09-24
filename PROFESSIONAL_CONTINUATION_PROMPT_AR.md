# برومبت الاستمرار الاحترافي الاحتياطي — Der Weg nach Berlin

Sync batch: v161 · 2026-09-23 · صُودق على هذه الوثيقة كاملة مقابل دفعة `dwnb-full-pack-v161`.

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

**عقد المالك (v152 · ADR-080) — ثوابت لا تُكسر:**

- **تسعون دقيقة يوميًا** هي الميزانية: 50 عمودًا فقريًا (درس + استرجاع مؤجَّل)، 25 إنتاج شفهي مُسجَّل (تظليل ← إعادة قول ← إعادة المقطع الصعب وحده)، 15 شكل امتحان بوقته، 10 دفتر أخطاء في آخر الأسبوع. السبت محاكاة (كاملة كل أسبوعين، مهارية في غيرها)، والأحد راحة أو استرجاع خفيف **يُقرّره التطبيق بحسب الإنهاك** لا مكافأةً ولا عقابًا.
- **الشهادة عامة**: B2 من Goethe أو telc أو ÖSD، ولا صلات لها بالتمريض. الجهة **لم تُحسم** عند المالك ⇒ تُعتمد `telc` افتراضًا في قالب محاكاة السبت، ولا تُثبَّت صيغةُ الورقة إلا بتحقق من الصفحة الرسمية مع تاريخ ورابط؛ التبديل إلى جهة أخرى يغيّر قالب المحاكاة لا المنهج.
- **مسار التمريض طبقة منسوجة لا منهجٌ ثانٍ**: «توابل» في A1 وA2 (لا كلمة مهنية تدخل استرجاعًا ولا امتحانًا؛ تُعاد صياغة مادة المستوى في سياق الرعاية وحدها)، و«طبقٌ ثانٍ» من B1.
- **ثلاث قواعد للطبقة**: (أ) لا تُدخل الطبقة قاعدةً نحوية جديدة — مشهدٌ يحتاج لغةً أعلى من مستواه **يُرحَّل** ولا يُخفَّف شرحه؛ (ب) لا يجوز أن يتوقف الجواب الصحيح في تمرين لغوي على **معرفة سريرية** — تمرينٌ يحتاج قرارًا طبيًا ليُحلّ فاسدٌ عندنا يُصلَح أو يُلغى؛ (ج) الطبقة **بارasitasية**: إن حُذفت بقي مسار B2 العام كاملًا، ولكل دفعة ميزانيةُ كلماتٍ معلنة، و**قاطعُ رجوع**: إن انخفض أداء مهام الامتحان العام تُخفَّض الطبقة وتُقدَّم الشهادة، لا العكس.
- **الأمان المهني عادةٌ لا قائمة**: عناقيد الجرعة والطريقة والتوقيت وتأكيد الأمر المسموع والسؤال قبل الأمر المبهم تُبنى بأن **تُفشِل بيئةُ التمرين التخمينَ وتُنجِح التأكيد**، لا بقواعد تُحفظ وتُمتحَن؛ وكل وحدة تمريضية تحمل صراحةً: **«هذه صياغات لغوية لا إرشاد سريري»**.
- **لا تجميل في الأرقام**: لا تخفيف سقف، ولا توسيع `normalizeGermanText`، ولا بدائل `acceptedAnswers` تختلف عن المفتاح بحرف كبير أو علامة ترقيم؛ البوابة التي تخرج 1 تُبلَّغ خروجَها 1، وبندٌ لم يُغلق بأخضر الاختبارات وحده لا يُنقل من `not-implemented`.

**عقد التسليم والرفع (v153 · ADR-082) — أُضيف بعد خطأ وقع فعلاً:** الحزمة التسليمية **مسطّحة**: ملفات المشروع ومجلداته في جذر الـZIP مباشرةً (بلا مجلد ظرف `der-weg-nach-berlin/`)، لأن أداة الرفع الموثوقة في المستودع `TERMUX_REPLACE_REPO.sh` تُستخرج بالاسم المجرّد (`unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh`) وتكتشف جذر المشروع من `package.json`؛ مع جذر ظرف يفشل الاستخراج بـ`caution: filename not matched` (خروج 11، قِيس) فيلجأ المستخدم إلى أمر مرتجل فينتهي بدفع مجلّد الظرف كثيفةٍ وحيدة في `main`. والرفع يكون بالأمر الموثّق في `TERMUX_ONE_COMMAND.txt` (استنساخ المستودع الحالي، حذف ملفات المشروع مع الإبقاء على `.git`، نسخ الجذر المكتشف بما فيه الملفات المخفية، تنظيف المولَّد/الخاص،`audit-secrets`، دفع عادي بدون `--force`)؛ **ممنوع** ارتجال `git init` + `git add -A` من مجلد يحوي غلافًا، وممنوع تمرير PAT داخل رابط الدفع في الأمر الموصى به (وثيقة `TERMUX_GITHUB_UPLOAD.md` تنصّ على ذلك).

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
B2: 24/24
Total lessons: 96 منشورًا من 96 مجدولة — B2 اكتمل عدديًا
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
Unit/Integrity tests: 1,019/1,019
Test files: 155/155
Playwright desktop + mobile: 82 tests (41 each). Reference green full run 82/82 is documented for v135; in v136 the two-core box measured 80/82 in-suite with the full-pack install test green in isolation (26.9s phone / 27.8s desktop). Re-measure before claiming 82/82.
Playwright browser channel: chromium (full new-headless; local retries remain 0)
Static/SSG pages: 321
Offline routes: 318/318
Search entries: 3,360
Official source records: 18/18
Offline cache: dwnb-full-pack-v161
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
- أُغلق P0-242/243: خمس حزم Offline مستقلة 58/58/58/219/318، و`offline-size-manifest` يتجدد بعد كل Production Build ويعرض Gzip للصفحات وNext قبل التنزيل مع بصمة Build؛ القيم الدقيقة تؤخذ من Manifest لا من رقم ثابت في البرومبت.
- خطة أسبوعية وحدود Recovery دون مضاعفة اليوم التالي؛ الأحد راحة صفرية افتراضيًا، وتظهر جلسة اختيارية محدودة فقط بعد Check-in صريح في يوم الراحة.
- ترتيب المدرب: تشخيص، SRS متراكم، أخطاء مؤجلة، عيادة أخطاء، دروس/بوابات، أضعف وحدة امتحان، ثم التقدم.

### الدروس والأدلة

- 85 درسًا كاملًا بالمراحل الـ14.
- Evidence gate بأربعة شروط.
- خمس فئات تمارين.
- واجهة تمرين German-first مع دعم عربي، لا تعرض IDs داخلية: أسماء أنواع مفهومة، German stem ظاهر، وخانة مرئية للفراغ بدل `___` غير الواضحة.
- `docs/CONTENT_COMPLETENESS_AUDIT.md`: صفر نصوص runtime مؤلفة فارغة، 588 سطح تمرين، 924 سؤال درس ألماني، 320 سؤال مكتبة ألماني، و150 مهمة امتحان مدققة بنيويًا.
- 16 عائلة Zod صارمة تتحقق عند `prebuild` من 4,156 كائنًا أكاديميًا علويًا وبنيته المتداخلة، ومنها 1,220 سجل اسم و126 إطارات فعل/حرف جر و17 سجل دعم تونسي لـA1–B2؛ تغيير المحتوى دون إعادة توليد التقارير يفشل Build.
- تقرير إجابة موحد: 2,729 عنصرًا مغلقًا مرتبطًا بالجواب والدليل + 372 مهمة إنتاجية بلا جواب وحيد، صفر تسريب غير معتمد وثلاثة إعفاءات تواصلية/تحريرية موثقة.
- تقرير هدف بنيوي قابل للقراءة: 369/369 هدفًا يملك مواضع تدريس وتدريب وMini-Test، مع حد صريح أنه لا يساوي تدقيقًا دلاليًا بشريًا لكل عنصر.
- `meaning-first-case-v1`: 18 عقدًا تعرض Bedeutung→Rolle→Form قبل النظرية، مرتبطة بـ22 نظرية و55 تدريبًا و42 Mini-Test؛ `case:audit` يعمل في `prebuild` ويكشف أي إشارة حالة صريحة غير مملوكة.
- طبقات A1–B2 البنيوية مع إضافات مطوية خلف `Weitere Zielnomen`: 1,297 اسمًا موزعة 280/269/321/427، و126 إطارًا موزعة 25/30/31/40. الجرد: 4,685 إشارة اسم (1,376 covered / 89 pending-human / 3,220 context-only)، و1,180 إشارة إطار (134 covered / 4 pending-human / 1,042 not-target). A1/A2/B1/B2 noun pending = 0/0/0/89؛ تبقى ثمانية استبعادات `authored-review-pending` والمراجعة الألمانية المستقلة.
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

- 260/261 ملف MP3 يمر بفحص MPEG frame chain والمدة والحجم وتغير payload.
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
- Offline Manifest v2: حزم مستقلة A1/A2/B1/B2/full بعدد 58/58/58/219/318 مسارًا.
- الصوت Opt-in ومفلتر حسب الحزمة: 40/48/48/131/267 ملفًا.
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
98  توجد 1,220 مرساة وA1/A2/B1/B2 pending=0/0/0/0؛ المتبقي مراجعة مستقلة
99  توجد 124 إطارًا و0 مرشح غير مصنف؛ 8 استبعادات بنيوية تنتظر تأكيدًا ألمانيًا مستقلًا
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

## 8. حالة P1 — تدقيق رسمي لـ135 اقتراحًا

أُنشئ `P1_AUDIT.md` في 2026-09-07 وصُنفت كل البنود بندًا بندًا مع دليل ومتطلب متبقٍ:

```text
Total P1: 135
Implemented: 128
Partial: 4
Not implemented: 3
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

أُغلق P1-293/295 عبر `content-near-duplicate-v1` و`content-review-state-v1`: جرى فحص 3,020 Prompt عبر 4,622,320 زوجًا، وأصلحت 24 صياغة عابرة للسياقات، وبقيت 10 أزواج داخل السياق نفسه موثقة و0 Issues. لكل كائن حالات german/arabic/cefr/copyright منفصلة؛ كل بعد 3,020 automated-pass-human-pending و0 مستقل. P1-92 جزئي فقط لأن authorized external corpora = 0 وCopyright clearance معلّق، ولا يُخزن نص Menschen/Hueber أو نص امتحان رسمي للمقارنة.

أُغلق P1-53/281/339/340 عبر `local-study-exports-v1`: Preview يختار الخطة/الأدلة/الاسم Opt-in، ثم ICS IANA، طباعة HTML دلالية، PDF Canvas/JPEG محلي، وAnki TSV UTF-8+BOM مع Formula-injection guard. لا وسائط ولا مفاتيح ولا نصوص إنتاج حر؛ DWNB وحده للاستعادة. 10 اختبارات وحدة وDesktop/Mobile Downloads حقيقية تثبت MIME/الأسماء والبنية، مع حد أن PDF صوري غير Tagged.

أُغلق P1-20/32/54 عبر `fourteen-day-learning-contract-v1` و`single-skill-diagnostic-v1` و`quiet-hours-local-v1`: عقود 14 يومًا append-only تظهر على Today، وإعادة مهارة واحدة بأربعة أسئلة A1–B2 وصيغة بديلة دون تغيير التشخيص/المستوى، ونوافذ هدوء ليلية/نهارية تخفي Nudge غير الضروري مع Deadline safety exception. لا Push ولا Notification API ولا mastery/gate مزيف؛ Zod/DWNB/Merge و11 اختبار وحدة ودورة Desktop/Mobile تغطيها.

أُغلق P1-223/330 عبر `ai-resilient-fallback-v1`: AbortController بمهلة 12 ثانية وتصنيف 429/Timeout/Network/HTTP/Malformed عبر Gemini/OpenRouter/Ollama. بعد Consent ومحاولة واحدة فاشلة يعود Tutor/Follow-up المحلي الحتمي مع Provenance ولا يحدث إرسال ثانٍ؛ Retry يحتاج موافقة جديدة. 17 اختبارًا تشمل Matrix من 12 حالة وHTTP503 وOpenRouter success وSpeaking fallback، مع Desktop/Mobile 429 فعلي Mock.

أُغلق P1-210/222/224 عبر `tutor-follow-up-command-v1` و`ai-provider-capability-matrix-v1`: أزرار Einfacher/Noch ein Beispiel/Auf Arabisch ترتبط بآخر جواب وهدف الدرس؛ Disabled يعمل عبر `local-rules-command-v1` بلا شبكة، وكل Gemini/OpenRouter/Ollama يحتاج Consent جديدًا ولا يرسل أخطاء نشطة أو Answer key. تحفظ Zod/DWNB نوع الأمر وparent/provider/model/consent تحت `support-only-no-answer-key-no-mastery-or-correctness`. تعرض Settings خمسة مزودات مع model/feature/setup/network/privacy/quota/0 USD/source/fallback وتصرح بأن الحصة اللحظية غير قابلة للقراءة. Mocks النجاح تغطي Tutor/command/typed-Speaking لكل مزود موصول وWorker WebGPU لمساره المحدود؛ ADR-042 يصل مراجعة الكتابة الاستشارية بـGemini وحده عند الشك، ويبقي بقية المزودات غير موصولة لهذا المسار.

أُغلق P1-139/150/151 عبر `three-pass-listening-sequence-v1` و`articulation-contrast-practice-v1`: في 84/85 درسًا يثبت المتعلم هدفًا German-first قبل ظهور المشغل، ثم سؤال الفكرة بعد بدء MP3/TTS، ثم أسئلة التفاصيل، ولا يفتح النص حتى تثبيت الجميع. مراحل العملية deduplicated تحت no-score/no-mastery ومتوافقة مع المحاولات القديمة وقابلة للحذف/DWNB/Merge. مرحلة النطق تعرض SVG أصليًا Inline للفم/الأسنان/اللسان/الحنك/الهواء مع نص بديل، وستة ملفات حركة على الأقل، وزوجين موسومين كـminimal/sound/prosody contrast. تحدي TTS المخفي يحفظ مطابقة العينة الاصطناعية فقط، لا نطق المتعلم أو طلاقته أو CEFR.

أُغلق P1-175/186 عبر `writing-error-micro-practice-v1` و`practice-law-language-boundary-v1`: سبعة أنماط حتمية ضيقة تبني حتى ثلاثة تمارين Korrigieren Sie من مقتطف فعلي في النسخة المقدمة، مع تصحيح مؤجل وربط submission/version/task/pattern دون mastery/gate، وZod/DWNB/Merge وحذف الكتابة والعلاج معًا. `hybrid-writing-review-v1` ينفذ قرار المالك: المنصة هي المعلّم الذاتي الأساسي والصادق، مع الفحص المحلي أولًا وإظهار شك المعنى/الطبيعية/الحجة، ثم Gemini BYOK وحده كمراجعة استشارية بطلب وConsent مستقل لكل نسخة. الحمولة نص النسخة الموافق عليه فقط، والعقد يفرض اقتباسًا حرفيًا لكل Issue وConfidence/Unresolved، ويحفظ SHA-256/provider/model/prompt دون مفتاح أو Score/mastery، ولا يدعي مصححًا كاملًا أو بديلًا مضمونًا عن مدرس. كل مرحلة Rule في 84/85 درسًا تفصل Sprachregel المؤلفة وÜbliche Praxis السياقية وOffizielle Vorgabe/Gesetz غير المدعاة.

أُغلق P1-271/272 عبر `evidence-derived-achievement-v1` و`gamification-visibility-v1`: ستة إنجازات تعاد اشتقاقها من درس مكتمل أو أربعة Reviews مؤجلة فريدة أو Revision مرتبطة أو Speaking listen-back/reflection أو 24 درس A1 أو Full simulation كاملة؛ لا فتح صفحة/نقر/دقائق خام ولا Badge مخزنة أو mastery/CEFR/reward. Settings يوفر واجهة تحفيزية أو هادئة بالكامل؛ الهادئة تخفي الإنجازات والسلسلة والمدح والزخرفة، وتستبدل الرسائل المختلطة بصياغة وظيفية مع إبقاء المهام والبوابات والنتائج والساعات والتحذيرات. Root/old-v3/DWNB/Merge/Reset مغطاة بلا حذف دليل.

أُغلق P1-338/341 عبر `review-keyboard-shortcuts-v1` و`local-content-note-v1`: Review يعرض Space و1/3/4/5 مع ARIA، يمنع Grade قبل الكشف ويتجاهل Repeat/Modifiers وحقول الإدخال/الأزرار/الروابط، ويمر عبر `applyReviewGrade` مع قفل حدث مزدوج. سجل 394 مرجعًا صالحًا يغطي 85 درسًا و160 مادة مكتبة و150 مهمة امتحان؛ الدروس والمكتبة توفر Bookmark وملاحظة 600 حرف منزوعة Bidi controls، وSettings يدير فتح السياق والحذف الفردي/الكامل. strict Zod/old-v3/DWNB/latest-merge بلا Answer key تلقائي أو search/AI/mastery.

أُغلق P1-344/366 عبر `personal-vocabulary-import-v1` و`local-content-error-report-v1`: TSV Preview-first بعقد German/Arabic/Example/Tags وحد 256 KB/500 صف يرفض Formula/HTML/shape/language/tags/duplicates وينظف Bidi بتحذير، ثم يستورد المقبول فقط إلى قائمة محلية بلا SRS/mastery/CEFR مع حذف وold-v3/Zod/DWNB/Merge. بلاغ المحتوى يربط kind/ID/route/title/version عبر سجل 394 مرجعًا، يعرض Preview metadata-only ثم يحفظ `local-draft-not-submitted` ويتيح نسخ/تنزيل JSON يدويًا؛ لا Network/GitHub API ولا Answer key/progress/key، مع Manager وحذف.

أُغلق P1-17/41/43/44 عبر `prior-experience-context-v1` و`equivalent-mission-alternative-v1` و`automatic-load-reduction-offer-v1` و`today-session-offline-readiness-v1`: Onboarding يجمع اختياريًا مصادر الدراسة واسم كتاب/دورة بأي لغة والعوائق دون تحديد CEFR أو كتابة ألمانية للمبتدئ. Today يقدم بديلًا مستقلًا يحافظ على الهدف ونوع الدليل والدقائق ولا يكمل الأصل. بعد Check-in يعد LearningProvider زمن النشاط المرئي عبر كل المسارات، ويعرض اقتراح تخفيف واحدًا بعد ثلاث أخطاء متتالية أو تجاوز فعلي؛ القبول/الرفض للمتعلم ولا يحذف دليلًا أو mastery. Service Worker المتحكم يفحص مسارات وصوت الجلسة داخل Shell/pack Cache v118، ويعرض الناقص ورابط تنزيل يدوي فقط. العقود Strict nested Zod وschema-v3/DWNB/Merge واختبارات Unit/Desktop/Mobile.

أُغلق P1-91/101/102/103 عبر `module-recycling-ratio-v1` و`lexical-strategy-registry-v1`: كل مراجعة وحدة عشرة أسئلة فريدة بنسبة قديم 0% لأول وحدة ثم 20% في A1 و30% في A2/B1 و40% في B2، وتمزج المفردات والبنية من وحدات أقدم مع Prompt ألماني أولًا؛ النسبة لا تصنع mastery/CEFR. مستكشف Search يعرض 32 عائلة و128 عضوًا بعلاقة base/derivation/compound/semantic-relative صريحة، و32 مثال سجل موزعة مرتين لكل formal/neutral/colloquial/professional في كل مستوى، و24 مربكًا للعرب (6 لكل مستوى) مع `notUniversal:true`. `lexical-strategy-audit-v1` Strict وفاشل عند الانحراف داخل prebuild؛ 30/30 خطط وصفر Issues.

أُغلق P1-113/114/115/125 عبر `grammar-progression-map-v1` و`comprehension-question-taxonomy-v1`: خريطة `/path` تعرض 24 قاعدة محورية و31 prerequisite بلا دورات، ستًا لكل مستوى. كل قاعدة تملك Theory فعليًا وتمرينين مضبوطين ومهمة إنتاج من الدرس وشرح alignment، وطبقات الآن/الحد/المؤجل وحدين واستثناء. مرحلة Rule تعرض العقد دون IDs أو mastery. صُنفت 504/504 أسئلة القراءة والاستماع مرة واحدة إلى gist/detail/stance/inference/structure؛ كل مستوى يملك الخمسة مع Detail ≤72% وGist 12–30%، وQuestionQuiz ألماني أولًا. `learning-architecture-audit-v1` Strict وفاشل في prebuild؛ التصنيف الحتمي لا يدعي مراجعة بشرية دلالية أو Score.

أُغلق P1-127/128/137/138 عبر `easy-vs-exam-reading-v1` و`unknown-word-and-compound-strategy-v1` و`unified-listening-usage-evidence-v1` و`prosody-rhythm-progression-v1`: وضعي Easy/Exam المنفصلين، و63 تحدي كلمة مجهولة بمعنى مؤلف، وسجل Listening موحد عبر سبعة أسطح، و16 خطوة Prosody تغطي أربع وظائف لكل مستوى. سجل الاستماع strict Zod وIndexedDB/DWNB/Merge، ولا يحمل correctness أو mastery؛ عينات النبر Browser TTS اصطناعية ولا تقيس المتعلم.

أُغلق P1-140/152/162/163 عبر `local-rms-pause-estimate-v1` و`learner-attributed-language-vs-device-v1` و`central-redemittel-function-register-v1`: تقدير طاقة/صمت محلي مع زمن التحضير والكلام، وتصنيف صعوبة يختاره المتعلم، وبنك 32 عبارة حسب ثماني وظائف وأربعة سجلات. لا STT أو فونيمات أو تشخيص جهاز أو درجة طلاقة.

أُغلق P1-173/185/187/200 عبر `visible-writing-version-diff-v1` و`practical-context-registry-v1` و`training-interaction-log-v1`: Diff كلمات مرئي، و16 ملاحظة ثقافية مؤرخة بلا تعميم، و20 نموذجًا/إشعارًا، وسجل pause/resume/change بلا نص جواب أو correctness/mastery.

أُغلق P1-235/246/247/248 عبر `partial-study-sections-export-v1` و`offline-recovery-page-v1` وChecksum staging resume و`js-budget-v1`: تصدير انتقائي غير قابل للاستعادة، صفحة Offline مستقلة، استئناف موارد متحقق SHA-256، وميزانيات Gzip تفشل Build.

أُغلق P1-282/284/318/365 عبر `weekly-planned-actual-no-blame-v1` و`evidence-velocity-readiness-range-v1` و`vercel-csp-headers-v1` و`dwnb-deprecation-policy-v1`: Today يقارن الوقت المنقضي بالدقائق المسجلة دون عقوبة أو دين، ومركز الامتحان يعرض نطاق أسابيع أو insufficient-data دون Pass date. CSP مركزية تمنع wildcard وgeneric unsafe-eval وتسمح فقط بأصول AI/WebGPU/loopback المدققة. v1 مدعوم بتحذير حتى 2027-03-31 ثم يرفض قبل mutation؛ v2/v3 حاليان. انظر ADR-050.

أُغلق P1-367/368/389 عبر `independent-curriculum-version-v1` و`content-accountability-lifecycle-v1`: نسخة المنهج مستقلة في State/DWNB/Merge، و3,020 سجلًا/16 عائلة/18 مصدرًا/12 Risk تملك owner/reviewer ودورة Draft→Validated→Published. أضيف 12 Claim قنصليًا/قانونيًا عامًا و18 بند نطق محتملًا للعرب؛ تبقى P1-377/380 جزئية لأن المراجعة المختصة/الفونيتية الفعلية معلقة و7 بنود نطق guided-only. انظر ADR-051.

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

## 9. حالة P2 — تدقيق رسمي لـ142 اقتراحًا

أُنشئ `P2_AUDIT.md` في 2026-09-10 وصُنفت كل البنود بندًا بندًا:

```text
Total P2: 142
Implemented: 118
Partial: 2
Not implemented: 22
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

القائمة مرتّبة بالقياس لا بالانطباع؛ أرقامها من `reports/lesson-quality-audit.json` بعد دفعة v154 (وكل رقم هنا قِيس بعد الكتابة لا قبلها):

1. **صوت المعلّم: الشرح تحت 60 حرفًا — والاختيار من جماعة الوسيط (وهو يعمل مرتين).** ‏`feedback.allUnder60Chars` ‏**1,178 من 1,733** و`under40Chars` ‏**971 من 1,250** و`allMedianChars` ‏**31** (تحرك عند v154) و`explanationMedianChars` ‏**26** (تحرك عند v155). على مستوى تمارين A2 بقي **24** تحت 60 وA1 ‏167، والباقي **987** في أسئلة القراءة/الاستماع و`miniTest` (‏24 + 167 + 987 = 1,178 ✓). المسافة إلى الوسيط 60 مقيسة بـ`docs/run-logs/2026-09-20-a2-explanations-4/distance-to-close.ts`: **414 بندًا = 18 دفعة** بواقع 24، والدليل أن الطريقة صائبة: دفعة v153 (من قائمة التدقيق الأوسع) حرّكت المسافة **2 فقط**، ودفعتا v154 وv155 (من `tmp/pick_median.ts`) حرّكتاها **24 + 24**: ‏462 ⇒ 438 ⇒ **414**، وارتفع وسيطُ الجماعة 25 ⇒ **26**. تبقّى في جماعة الوسيط **1,039** بندًا تحت الستين، وأقصرُها الآن **14 حرفًا** (‏a2-01-m3، a2-03-lq3، a2-05-m1).
2. **بناء طبقة «التوابل» (لم يبدأ بعد)** — لم تُكتب أي سجلّات أو نصوص أو أصوات تمريضية حتى v155؛ العقد موثّق في ADR-080. أول دفعة بناء تكون في A1: موادُ القراءة والاستماع والإنتاج تُعاد صياغتها في سياق الوردية **بلا كلمة جديدة تدخل الاسترجاع**، ثم تُقاس الميزانية المعلنة، ويُتحقّق أن أداء مهام الامتحان العام لم ينخفض (قاطع الرجوع).
3. **P1-398 قرارُ تعريف عند المالك، لا شغلُ تأليف** — 197 تمرينًا إنتاجيًا بسلسلة مقبولة واحدة من 387 (= **50.9%** مقابل سقف 25%)، و`npm run lessons:variant-worklist` يرجع **0 قابلة للإضافة بثقة** (159 فراغًا بكلمة واحدة و36 ترتيبًا و2 تصحيح)؛ ورفعُ البنود الـ38 كلها يترك **41.1%**. لا يُمَسّ السقف ولا المُطبِّع قبل الجواب، **والحارس المضادّ للحشو (بدائل تختلف بحرف كبير أو علامة ترقيم) لم يُكتب بعد** — وهو الجزء الوحيد الذي يُبنى دون انتظار القرار.
4. **P1-397 مفتوح رغم بلوغ السقف** — القرينة **39.28%** (491 من 1,250) تحت ≤500 و≤40% منذ `v149`، لكن البوابة المشتركة `lesson:quality:audit` تخرج **1** بملاحظتين (50.9% ووسيط 25)، فلا يُنقل السطر إلى `partial`/`implemented`؛ ولا تُلْمَس أطوالُ الخيارات لمّا تُصلَح الشروح.
5. **قوالب الامتحان** — ملفّا صيغة مُثبَّتان بـ35 واقعة مسمَّرة (24 متقاطعة) و0 مشاكل أدلّة و**فجران معلنان**؛ الجهة النهائية غير محسومة، فلا يُعلَن «مطلوب قانونيًا» ولا «مقبول لدى كل الولايات»، ويُثبَّت تاريخُ التحقق مع كل تحديث.
6. **المراجعة البشرية** — 0 من 3,277؛ الحزمة جاهزة في `reports/review-packet/` ولا تُقلب رقميةً بقرار آلي. طبقة التوابل **تزيد هذا الدين** مراجعةً مهنية، ولا تخفضه.
7. **المتصفح** — لا قياس متصفح لـv154؛ آخر مرجعي أخضر **v143** (40 من 42) ⇒ لا يُدَّعى **82/82** لأي جيلٍ لم يُشغَّل فيه المتصفح.
8. **بنية الحزمة والرفع** — التغليف **مسطّح** دائمًا بحارسه `tmp/checkflat154.py`، والرفع بـ`TERMUX_ONE_COMMAND.txt` ← `TERMUX_REPLACE_REPO.sh` لا بأمر مرتجل (ADR-082): فحزمةٌ بمجلد ظرف تُعطِل استخراج السكربت (`caution: filename not matched`، خروج 11 مقيَّس) وتنتهي بـ`main` ذي مجلد واحد.

الترتيب الآلي داخل كل دفعة: `tsc` ← `lint` ← البوابات ← `lesson:quality` (يكتب بـ`--write`) ← `bash /home/user/tmp/writes.sh` (كل التوليد، **قبل** البناء لأن `prebuild` يرفض التقارير الأقدم) ← `build` ← `handoff:check` ← مسح الوثائق ← تغليف ZIP مسطّح ← فاحص الحزمة.
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

10. **التغليف ثم الرفع (قاعدة v153):** ابنِ الحزمة **مسطّحة** من داخل جذر المشروع: `cd /home/user/der-weg-nach-berlin && zip -qr "$OUT" . -x './node_modules/*' -x './.next/*' -x './.git/*' -x './test-results/*' -x './playwright-report/*' -x './out/*' -x './coverage/*' -x '*.tsbuildinfo' -x './.env*' -x '*.dwnb'`، ثم **أعِد تشغيل فاحص البنية** (`tmp/checkflat153.py`) الذي يعدّ المدخلات ويقارن الملفات بالبايت ويعيد اكتشاف جذر المشروع كما تفعل أداة الرفع؛ لا يُقبَل أن يبدأ أيّ مدخل بـ`der-weg-nach-berlin/`. وللرفع على Termux استعمل `TERMUX_ONE_COMMAND.txt`/`TERMUX_REPLACE_REPO.sh` لا أمرًا مرتجلًا.
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
P2: 118/140 منجز، 2 جزئي، 20 غير منجز، 0 متوقف وفق P2_AUDIT.md

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

بعد قراءة الملفات والتحقق من الأعداد، لا تطلب خطة جديدة إذا كان المطلوب «واصل». P0 القابل للبناء مكتمل و`P1_AUDIT.md` يصنف 132/132 بلا بنود `not-implemented`؛ الباقي P1-92/331/377/380 يحتاج Corpus أو قارئات شاشة أو مراجعة مختصة فعلية. `P2_AUDIT.md` يصنف 140/140، وكل البنود الجزئية البرمجية أُغلقت؛ يبقى P2-264/384 للجولة اليدوية/البشرية النهائية. إذا توفر Push فتحقق من CI وPR Preview لإغلاق P0-302/301. اترك المراجعات البشرية وتثبيت WebGPU الحقيقي على أجهزة ممثلة للجولة النهائية وفق قرار المالك.

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
96/96 lessons
30/30 modules and projects
2/2 exam profiles
24/24 targeted simulations
12/12 full simulations
272 physical MP3 files + 272 physical Opus files
318/318 Offline routes
996/996 unit/integrity tests across 152/152 files
82/82 desktop+mobile browser tests
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

أُغلق P2-142 عبر `adaptive-partial-full-dictation-v1`. المسار `/practice/dictation` يضم 16 مهمة أصلية بواقع 4 لكل مستوى: A1 جزئي، A2 ثلاث مهام جزئية ثم كاملة، B1 تمهيد جزئي ثم ثلاث كاملة، وB2 كامل. دورة `Vorbereiten → Hören → Schreiben → Vergleichen` تقفل النموذج وحقل الكتابة قبل طلب السماع، ثم تقارن نقص/زيادة/استبدال الكلمات وتفصل المطابقة اللفظية عن فرق الحروف الكبيرة والترقيم، وتسمح بإخفاء النموذج وإعادة المحاولة بلا عقوبة. `dictationAttempts` محفوظ في Zod/IndexedDB/DWNB/Merge ويحتوي ملخص الشكل وعدد التشغيل فقط، لا نص المتعلم ولا النموذج ولا keystrokes ولا mastery. Browser TTS اصطناعي تابع للجهاز، `examGrade:false`، ولا يرسل النص/الصوت إلى AI. أضيف المسار لكل حزم Offline، فأصبحت 58/58/58/219/318 وCache الحالية `dwnb-full-pack-v122`. المرجع `src/data/dictation-bank.ts` و`src/core/listening/dictation.ts` و`src/components/dictation-lab.tsx` و`tests/unit/adaptive-dictation.test.ts` وADR-064.

## مسارات المحادثة المحلية — ADR-065

أُغلق P2-354 عبر `offline-branching-conversation-v1`. المسار `/practice/conversation-paths` يضم 8 أشجار أصلية، اثنتين لكل A1/A2/B1/B2: مخبزة/تعارف، موعد/سكن، Feedback/مشروع، وتفاوض/حوار مدني. تعرض كل شجرة دور المتعلم والهدف التواصلي German-first قبل القرار؛ كل Choice يغير عاقبة الشريك ومسار إكمال/إصلاح/جزئي/إعادة فعليًا. الوضع `guided` يعرض مقصد الرد بالعربية قبل الاختيار، و`challenge` يؤجله؛ بعد Terminal تظهر مهمة Transfer بلا خيارات. `validateBranchingScenario` يمنع Cycle والعقد المفقودة/غير القابلة للوصول والنتائج الناقصة، و`createBranchingConversationAttempt` يعيد التحقق من سلسلة Choice قبل قبول Outcome. `branchingConversationAttempts` يحفظ معرفات الخيارات والنتيجة وعدد فتح الدعم فقط في Zod/IndexedDB/DWNB/Merge: لا نص حر، لا صوت، لا fetch/WebSocket/AI، لا شريك حي، ولا mastery/CEFR. Browser TTS اختياري واصطناعي تابع للجهاز. أضيف المسار لكل حزم Offline، فأصبحت 58/58/58/219/318 وCache الحالية `dwnb-full-pack-v122`. المرجع `src/data/branching-conversations.ts` و`src/core/speaking/branching-conversation.ts` و`src/components/branching-conversation-lab.tsx` و`tests/unit/offline-branching-conversation.test.ts` وADR-065.

## شبكات التراكيب السياقية — ADR-066

أُغلق P2-108 عبر `contextual-collocation-network-v1`. المسار `/practice/collocations` يضم 16 شبكة أصلية و48 وصلة فعل–اسم، 4 شبكات لكل A1/A2/B1/B2. كل وصلة لها معنى وسياق German-first ودعم عربي وسجل ومثال وحد يشرح لماذا لا تصلح الوصلة الأخرى للمقصد نفسه. يجب فتح الوصلات الثلاث في `Netz erkunden` قبل `Kontext wählen` من 3 سياقات، ثم تظهر `Übertragen`؛ وضع `guided` يعرض معنى السياق، و`challenge` يؤجله. `collocationNetworkAttempts` يحفظ IDs المستكشفة/المستهدفة/المختارة والعدد فقط عبر Zod/IndexedDB/DWNB/Merge، لا نص حر أو keystrokes أو SRS تلقائي أو AI/mastery/CEFR. المحرك يرفض ID خارج الشبكة أو استكشافًا/تغطية ناقصة أو correctness مزورًا. أضيف المسار للحزم فأصبحت 58/58/58/213/312 وCache الحالية `dwnb-full-pack-v122`. المرجع `src/data/collocation-networks.ts` و`src/core/vocabulary/collocation-network.ts` و`src/components/collocation-network-lab.tsx` و`tests/unit/contextual-collocation-network.test.ts` وADR-066.

## الخصائص التوليدية الحتمية — ADR-067

أُغلق P2-335 عبر `deterministic-generative-properties-v1`. الملف `tests/helpers/deterministic-property.ts` يوفر Harness بلا Dependency خارجية يعيد Seed نفسه ويطبع run/counterexample ويطبق Shrink اختياريًا حتى 100 خطوة. `tests/unit/deterministic-property-invariants.test.ts` يشغل 8 اختبارات و8,301 حالة مولدة/معادة عبر Idempotence التطبيع، Equivalence المقارنة المسموح، Splice لكل `ä ö ü ß Ä Ö Ü`، Merge union/max/unique/idempotence، عدادات Collocation من IDs، ومسارات محادثة عشوائية حتى Terminal مع Zod. أول تشغيل كشف `Straße→STRASSE`؛ بقي ß/ss strict وأُضيف Assertion للحد بدل إرخاء المقارنة. هذه ليست برهانًا رياضيًا أو Fuzzing أمنيًا غير محدود ولا تغلق المراجعات البشرية.

## تخطي Vercel للتوثيق فقط — ADR-068

أُغلق P2-310 عبر `vercel-docs-only-build-skip-v1`. يربط `vercel.json.ignoreCommand` السكربت `scripts/vercel-ignore-docs-only.mjs`: Exit 0 فقط إذا كانت كل الملفات Markdown في الجذر أو `docs/` غير `docs/generated`؛ أي `src/public/scripts/tests/package/workflow/config/generated` يعيد Exit 1 ويُبقي Build. Diff فارغ/غير متاح، Git error/timeout، ومسار absolute/traversal/backslash كلها fail-open إلى Build. يستخدم SHA الحالي/السابق من Vercel وإلا `HEAD^..HEAD`. main يبقى مفعّلًا، ولا ندعي أن الإعداد البعيد تغير قبل Push. ستة اختبارات تغطي العقد.

## Release Candidate — ADR-069
أُغلق P2-369 عبر `pre-production-release-candidate-v1`: `.github/workflows/release-candidate.yml` يدوي، يشغل secret history وcheck وكامل E2E، ثم يولد Attestation باسم RC وSHA كامل ويرفعها 14 يومًا. لا Deploy أو `--prod`؛ الحالة candidate-not-promoted والترقية فعل بشري منفصل. لا تدع Run بعيدًا قبل Push.

## مقارنة الحزمة — ADR-070
أُغلق P2-345 عبر `pre-update-curriculum-pack-diff-v2`: واجهة Offline تعرض curriculumVersion والبصمة والنطاق والمسارات المثبتة→المرشحة قبل التثبيت، وتعامل حزمة قديمة مكتملة بلا curriculumVersion كـ`unknown-installed-curriculum` وتحديث منهج بدل طمأنة build-only. Metadata فقط، لا semantic diff أو تثبيت تلقائي. Cache الحالية v119.

---

## 19. سجل التسليم الاحتياطي — دفعة `b2-19` (2026-09-16)

هذا القسم هو نقطة الاستئناف الموثقة. كل رقم فيه من تشغيل فعلي؛ لا يُنقل إلى دفعة جديدة دون إعادة قياس.

### حالة المنهج بعد هذه الدفعة

```text
A1 24/24 · A2 24/24 · B1 24/24 · B2 19/24 (5 دروس متبقية)
الدروس المنشورة: 91 · مراجعة/مشروع لكل وحدة: 30/30 · بوابة المستوى: 4/4
أهداف التدريس↔التدريب↔التقييم: 364/364 مع 0 فجوة بنيوية (B2 76/76)
سجلات المحتوى المحكومة: 3,167 — المستقلة البشرية منها: 0
عقد تعليم الحالة (meaning-first-case-v1): 18 عقدًا / 18 درسًا / 22 نظرية / 55 تدريبًا / 42 تقييمًا
خطوات دليل تقييم الفونيم: 0 من 9 · صوت بشري: 0 من 91 مقطع درس
```

### الدفعة التالية المقصودة: `b2-20`

- **قاعدة اختيار الموضوع قبل الكتابة**: افحص الفجوة بـ`grep` على `src/data/lessons-*.ts`. إن كان الموضوع مُدرَّسًا في مستوى أدنى (مثال مرفوض فعليًا: `Pronominaladverbien` في `b1-24`) فابحث عن غيره؛ لا تكرّر بناءً بنيويًا فقط لأن الصياغة مختلفة — فحص التشابه يقارن الألفاظ لا ملكية المنهج.
- **البنية القياسية المطبّقة في `b2-19`**: 4 أهداف · 18 عبارة · 4 كتل نظرية لكل منها `trickAr` · 7 تمارين تغطي الأنواع الخمسة · قراءة ≤200 كلمة + 10 مفردات + 3 أسئلة · استماع بنص ≤1,300 حرفًا + 3 أسئلة (أولها الفكرة العامة بالوضع) · 6 عناصر نطق بـIPA · كتابة بنطاق كلمات محدّد + نموذج داخل النطاق · تحدث · وساطة · 5 أخطاء · `miniTest` من 5 · 12 بطاقة.
- **القيود الصارمة التي يفرضها الـschema**: `TheoryBlock` وكتلة النطق تستلزم `trickAr`؛ `schemas.ts` بـ`.strict()` فأي مفتاح زائد يفشل؛ إطار واحد فقط داخل الدرس (`frameSeeds`) والزيادة إلى `additionalFrameSeeds`.
- **لا تفتح عقد حالة إلا بملكية كاملة**: إن لم تكن النظرية والتمارين والـMini-Test تُسمّي الحالة صراحةً، لا تُضِف عقدًا — الدروس 17 و18 و19 اختارت ذلك عمدًا وبقي التدقيق عند 18.

### تسلسل الدفعة كما نُفِّذ (بالأمر، لا بالوصف)

```text
1) splice في ملف دروس الوحدة  ←  2) curriculum: publishedLessonLocalOrder + seed  ←  3) node_modules/.bin/tsc --noEmit
4) src/data/lexical-grammar-<level>.ts: ابذر الأسماء/الإطارات المشتقة بالكشّاف الحقيقي، ولا تخترع lemma
5) npm run content:audit:write  ←  6) بقية :write audits  ←  7) GOVERNED_CONTENT_RECORD_COUNT في content-governance-registry.ts
8) صوت الدرس: توليد ثم تطابق نصي بالبايت قبل الترميز → libopus 24k/48k/mono → copy إلى public/audio/lessons وaudio-sidecar
9) node scripts/generate-lesson-audio-manifest.mjs  ←  10) npm run offline:manifest  ←  11) npm run phoneme:lexicon:generate
12) Sweep الدبابيس في الاختبارات (تغيير موجّه لكل ملف بعدد تحقق منه)  ←  13) npm test
14) الوثائق: أسطر مؤرخة للدفعة + تصحيح الأرقام الحية فقط  ←  15) حلقة for i in 1..8 لـhandoff:check مع تعديل الشظية المسماة وحدها
16) rm -rf test-results playwright-report && npm run check  ←  17) E2E  ←  18) ZIP ثم handoff:check أخيرًا
```

### قياسات يجب أن تظهر في أي دفعة تالية (وليس أرقامًا منسوخة)

```text
npm test            → 996/996 عبر 152 ملفًا (عدد الاختبارات يرتفع فقط عند إضافة اختبار حقيقي)
npm run check       → exit 0، lint نظيف، typecheck، source audit 18/18 fresh، handoff:check أخضر
build               → 316 صفحة static/SSG (= مسارات Offline 313 + 3)
media:budget        → 534 ملفًا (267 MP3 + 267 Opus) / 50,355,565 بايتًا / curriculum gzip 828,302
js:budget           → 107 chunks؛ القيمة الإجمالية ترتبط بـbuildId فلا تُقارن عبر البناءات
offline:size        → البصمة تتغير مع كل Build لأنها تُشتق من مسارات تحتوي buildId؛ لا تعتبرها بصمة محتوى
E2E                 → 41 سطح مكتب + 41 موبايل؛ لا تُضخّم الميزانيات لشراء لون أخضر: قِس ووثّق
```

### خطر البيئة المقيس: رجوع لقطة مساحة العمل

خلال هذا التسليم أعادت اللقطة **أربع مرات** ملفات `public/audio/**` و`node_modules` و`.next` و`~/.cache/ms-playwright`. العَرَض موثوق: `lesson audio count drifted`، أو `sh: 1: tsx: not found`، أو `libnspr4.so: cannot open shared library` مع 82 فشلًا. الإصلاح بالترتيب:

```text
cp /home/user/audio-sidecar/<lesson>.{mp3,opus} public/audio/lessons/   # إن وُجدت النسخة الدائمة
node scripts/generate-lesson-audio-manifest.mjs && npm run offline:manifest
npm ci && npx playwright install chromium && npx playwright install-deps chromium
ss -ltnp | grep 3100   # اقتل next-server العالق بالـPID قبل أي تشغيل Playwright
```

احفظ نسخة من صوت أي درس جديد في `audio-sidecar` **فور** توليده؛ الملفات النصية تبقى والثنائيات لا تبقى.

### ما يبقى مفتوحًا عمدًا (لا يُغلق آليًا)

```text
P0-98/99        مراجعة ألمانية مستقلة لـ1,297 سجل اسم و134 إطارًا وقرارات الاستبعاد الثمانية
P0-124          تحويل الاقتباسات الآلية إلى شهادات مؤلَّفة مراجعة
P0-135/255/373/376  أدلة بشرية/يدوية (سرعة التشغيل، قارئ الشاشة، الدعم التونسي)
P0-301/302      Push فعلي + PR Preview + تشغيل CI
P1-92           Corpus خارجي مصرّح به لفحص التشابه
P1-331/377/380  قارئ شاشة، سياقات قنصلية/قانونية، مراجعة النطق
P2-264/384     جولة WCAG يدوية ومراجعة عربية تونسية
telc            توزيع النقاط 225/75 وعتبات 135/45 و`Sprachbausteine` المشترك 90 دقيقة — غير مثبّت
خمس دروس B2     البنية + نماذج الكتابة الخمسة المتبقية
```


### قواعد وزن مساحة العمل — مقيسة في 2026-09-16 ومُحَدَّثة 2026-09-17

سقف لقطة مساحة العمل نحو 128 MB و10,000 ملف، والقطع عند السقف يُسقط ذيل القائمة — وهذا يفسّر رجوع الثنائيات: بعد خمس دورات متتالية اختفت أزواج `b2-17/b2-18/b2-19` الصوتية من `public/audio/lessons/` بينما بقيت الملفات النصية.

```text
1) لا تُبقِ wegberlin-full.zip في مساحة العمل بعد التنزيل:
   bash /home/user/make-zip.sh   ← البناء عند الحاجة فقط (≈6 ثوانٍ)
   rm -f /home/user/wegberlin-full.zip /home/user/wegberlin-full.zip.sha256   ← قبل نهاية الدفعة
2) لا تُبقِ test-results/ ولا playwright-report/ بعد أي تشغيل E2E (هما غير مستثنَيين من اللقطة).
3) node_modules و.next غير محسوبين في اللقطة؛ لا تحذفهما للترفيه، لكنهما يضيعان مع أي رجوع:
   npm ci --cache /tmp/npm-cache && npx playwright install chromium && npx playwright install-deps chromium
   (npm ci الافتراضي يبني .npm/_cacache داخل مساحة العمل — قيس 199 MB و949 ملفًا في دفعة واحدة)
4) نسخة audio-sidecar/ أحيلت للتقاعد بعد أن ثبتت مطابقتها الحرفية (6 ملفات، 0 اختلاف بالـSHA256 عن نسخ
   المستودع): الاحتياط الذي يعيش داخل المساحة يزن في عدّادها. عند الرجوع: نفّذ make-zip.sh، وإن ضاق /tmp
   احذف node_modules أولًا، ثم فكّ أزواج الدروس الحديثة إلى public/audio/lessons/ عبر وسيط في /tmp
   (لا عبر tar داخل الشجرة — القاعدة 11)، وبعده node scripts/generate-lesson-audio-manifest.mjs
   && npm run offline:manifest، وتحقّق بالـSHA والحجم لكل أصل — المرجع الأخضر: 96 أصلًا و0 اختلاف.
5) الوزن المرجعي بعد التنظيف: 102 MB و1,311 ملفًا (الشجرة 101 MB: صوت 48 + vendor 26 + reports 18 + src 6).
6) .npm يظهر عند كل تشغيل npm (سجلات debug، 5–48 KB)؛ احذفه بنهاية الدفعة مع بقية الأثر:
   rm -rf /home/user/.npm /home/user/wegberlin-full.zip*
      /home/user/der-weg-nach-berlin/{test-results,playwright-report,tsconfig.tsbuildinfo}
   ولا تُنشئ نسخة احتياطية داخل المساحة (audio-sidecar حُذف 2026-09-17 بعد التحقق من التطابق حرفيًا)
7) ما لا يُمسّ (كله محمول الاختبارات، مُتحقَّق منه): public/audio نحو 51 MB (لا يولّده شيء — scripts فيه
   generate-*-audio-manifest.mjs للـmanifest فقط)؛ public/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm
   26,101,073 بايتًا (بصمته ae61141f8fbf… في scripts/verify-continuation-handoff.mjs:959)؛
   reports/ 18 MB و17 ملفًا (11 يولّدها :audit:write في ≈27 ثانية مطابقة حرفيًا، و6 يكتبها مسار البناء فقط،
   وبحذفه يسقط handoff:check بـENOENT وينزل npm run check إلى 971/972 مع 147/149 ملفًا).
8) مخزن /tmp ضيق ولا يصلح جهة حفظ وحيدة: سعته 993 MB يستهلك node_modules منها 751 MB، فلا يسع
   أرشيف الصوت (49.5 MB) والتثبيت معًا، وكل ما فيه يضيع مع أي رجوع للقطه.
9) الحذف لا يُعدّ آمنًا حتى يُشغَّل بعده: npm run --silent handoff:check ثم npm test
   (المرجع الأخضر: 996/996 في 152 ملفًا) وفحص SHA/الحجم لكل أصل صوتي (91 درسًا و80 مكتبة و96 امتحانًا).
10) العدّاد يعيار بوقت الكتابة لا بالمحتوى: بعد رجوع اللقطة الخامسة أعيدت كتابة الشجرة كلها فصارت mtimes
    كلها «الآن»، فحُسب 104 MB كلها كأنها من إنشاء الجلسة مع أن مخلفات الجلسة صفر. المسطرة المقيسة:
    توحيد mtime للملفات التي لم يتغير محتواها (os.utime إلى 2026-09-15 12:00 على 29,982 ملفًا) أنزل
    المحسوب إلى 17 ملفًا و4.3 MB. الاستثناءات الواجبة: أزواج b2-16..19 الصوتية، audio-sidecar/،
    make-zip.sh، DELIVERY_b2-19.txt، وهذا البرومت. لا يقرأ أي اختبار أو سكربت mtime
    (grep -rln "mtimeMs|st_mtime" tests scripts src → فارغ) وتدقيق طراوة المصادر يعتمد lastVerifiedAt وحده.
11) ممنوع نقل المجلدات الكبرى عبر tar أو cp -a داخل الشجرة: النقل يحدّث أختام كل ملف ويعيده إلى
    عداد الجلسة. عند الاسترجاع استرجِع الملفات المتغيرة فقط، أو طبّق القاعدة 10.
12) لا تُشغَّل الحزمة الكاملة (npm test ≈ 148 ثانية) للتطمين؛ مرّة واحدة بنهاية الدفعة وقبل التسليم،
    وبعدها اختبارات مستهدفة: node_modules/.bin/vitest run tests/unit/<name>.test.ts
13) لافتة «هذا الجلسة أنشأ 187.0 MB» لا تنقص بالحذف من داخل الصندوق؛ المخرج الحقيقي جلسة جديدة تبدأ
    من حزمة التسليم أو من المستودع بعد الدفعة (TERMUX_REPLACE_REPO.sh). لا تُهدر جولات في إرضائها.
```
### محظورات الادعاء (تُذكر في كل تقرير)

لا «محتوى رسمي معتمد»، ولا «ضمان اجتياز B2»، ولا equality بين صوت تركيبي وصوت امتحان، ولا شريك محادثة حي، ولا تصحيح نطق/طلاقة آلي موثوق، ولا تقييم بشري لكتابة المتعلم، ولا «أتمتة = مراجعة خبيرة»، ولا «تركيز المتصفح = قفل للواجهة»، ولا «HTTP 200 يثبت أن بنية الامتحان لم تتغير». Gemini يبقى مستشارًا اختياريًا خلف موافقة صريحة لكل إرسال، ولا يُرفع التسجيل إليه أبدًا ولا مسار دفع بديل.

### التقرير بعد الدفعة

أرقام من مخرجات التشغيل فقط، مع فصل واضح بين «نُفِّذ وقِيس» و«لم يُدَّعَ». إن تعذّر تشغيل بوابة، يُقال ما هي ولماذا، بدل وصف ما سيفعله المرء.

## 20. سجل التسليم الاحتياطي — دفعة `b2-20` (2026-09-17)

### حالة المنهج بعد هذه الدفعة

```text
A1 24/24 · A2 24/24 · B1 24/24 · B2 20/24 (4 دروس متبقية)
الدروس المنشورة: 92 · مراجعة/مشروع لكل وحدة: 30/30 · بوابة المستوى: 4/4
أهداف التدريس↔التدريب↔التقييم: 369/369 مع 0 فجوة بنيوية (B2 81/81)
سجلات المحتوى المحكومة: 3,189 — المستقلة البشرية منها: 0
المراسات المعجمية: 1,297 اسمًا (1,381 covered / 89 pending-human / 3,375 context-only)
              و134 إطار فعل/حرف جر (134 covered / 4 pending-human / 1,042 not-target)
التشابه: 3,189 كائنًا عبر 5,083,266 زوجًا — 0 مشكلة غير معفاة
خطوات دليل تقييم الفونيم: 0 من 9 · صوت بشري: 0 من 92 مقطع درس
```

### قياسات البوابات في هذه الدفعة (من مخرجات التشغيل، لا من التقدير)

```text
npm run build            → exit 0 (type-check مدمج، Compiled في 27.8s، 317/317 صفحة)
npm test                 → 996/996 عبر 152 ملفًا
media:budget             → 536 ملفًا / 50,924,459 بايتًا تحت سقف 51,000,000 (هامش 15%)
js:budget                → 107 مقاطع / 1,616,188 gzip / أقصى ملف 567,361
offline:size             → بصمة 8482c50a44c4 (a1 2,279,638 · a2 2,344,738 · b1 2,377,883 · b2 3,601,524 · full 5,272,729) — تتجدد بعد كل Production Build
handoff:check            → exit 0
Playwright desktop       → 40/41 في 17.1 دقيقة (المتعثر: سقف 360s لتثبيت الحزمة مع الصوت)
Playwright mobile        → 40/41 في 14.0 دقيقة (المتعثر: سقف 30s لصوت المكتبة)
تشغيل معزول للضحيتين      → Passed (1.2 دقيقة للمجموعة) — لم تُخفَّف أي عبارة تحقّق
```

إصلاحان نتجا عن القياس لا عن التخمين: `.collocation-steps ol` صار عمودًا واحدًا تحت 380 بكسل
(كان يدفع scrollWidth إلى 330 مقابل 320)، وفحص «خارج الشاشة» في مصفوفة حجم الخط اشترط حالة
الرسم الحقيقي لأن Chromium 151 يبقي مقاييس أطفال `details` المغلقة. وثبّت اختبار المتصفح على
314 مسارًا بدل 313.

### الدروس التقنية المكتسبة (تُطبَّق على كل دفعة درس جديدة)

1. الصوت مُلزَم بسقف الحجم: 24 kHz mono 32 kb/s MP3 + Opus 24k. ترميز 128k لدرس واحد خرق
   السقف وأسس فشل `media:budget`؛ إن حذفت أصوات المؤقت فلا رجوع — استعمل نفس الوصفة.
2. `GOVERNED_CONTENT_RECORD_COUNT` في `src/config/content-governance-registry.ts` هو المُثبِّت
   الحقيقي: بدونه يفشل `governance:audit:write` عند كل إضافة. بدّلته أولًا، صار السجل 3,189.
3. كل درس يحرّك سلسلة pins كاملة: `reports/*.json` ← `verify-continuation-handoff.mjs` ←
   اختبارات الوحدة ← `tests/e2e/critical-flows.spec.ts` ← `PROJECT_STATUS.md`/`README.md`/
   `P0_AUDIT.md`/`P1_AUDIT.md`/البرومت نفسه. الترتيب: أعد توليد التقارير، ثم اقرأ الأرقام من
   JSON المولّد، ثم ثبِّتها؛ لا تخمِن عددًا واحدًا قط.
4. أدوات فحص الانحراف: انسخ `scripts/verify-continuation-handoff.mjs` إلى `/tmp` وحوّل
   `fail` إلى تجميع رسائل (نفس cwd)، فتحصل على قائمة الانحرافات كلها في تشغيل واحد بدل
   تشغيل لكل انحراف. لا تشغّله والمساحة ممتلئة: `next build` و`tsc` معًا يقتلان الـ2 GB.
5. تحرير `src/data/lexical-grammar-b2.ts`: سطر كامل لكل درس، مفتاح = معرّف الدرس وحده،
   فاصلة بعد السابق ولا فاصلة على الأخير، ثم `node_modules/.bin/tsc --noEmit` فورًا.
6. لا تُسلسِل تعديلات متعددة في سكربت واحد بلا كتابة بينهما: assertion فاشل واحد كان يُلغي
   بقية التعديلات بصمت (حدث هذا في دفعة b2-20 وأضاع دورة تدقيق كاملة).

### الدفعة التالية المقصودة: `b2-21`

- الدروس الأربعة الباقية في `B2-Prüfungsreife` (21–24): اختر الموضوع بـ`grep` على
  `src/data/lessons-*.ts` أولًا، ثم اكتب الدرس كاملاً بعقود `FullLesson` (≥5 أهداف، ≥12 عبارة،
  ≥7 تمارين على ≥5 أنواع، ≥10 بطاقات، ≥10 مفردات وكل `surfaceForm` داخل النص، نص استماع
  1,100–1,600 حرفًا، ≥4 أخطاء مع ≥5 `trickAr`، ≥12 `trickAr` نظريًا، Mini-Test ≥5،
  SRS 16–24 فريدة، `lessonInteractiveItemCount` ≥18).
- مع كل درس: 4 مرساة اسم على الأقل وإطار فعل واحد (حدّ `validate-academic-content.ts:229`)،
  أصوات بنفس الوصفة (32k/24kHz mono)، ثم `content:audit:write` و`similarity:audit:write`
  و`governance:audit:write` و`learning:architecture:audit:write`، فرفع `GOVERNED_CONTENT_RECORD_COUNT`،
  فإعادة تثبيت الأرقام في كل ما ورد في البند 3 أعلاه، وأخيرًا `npm test` ثم `npm run build`.
- لا يُغلَق P0-98/99 ولا P1-380 آليًا: المراجعة الألمانية المستقلة وقرارات الاستبعاد الثمانية
  بانتظار إنسان مسمّى.

## 21. سجل التسليم — دفعة إكمال `B2-Prüfungsreife` (`b2-21`…`b2-24`)، 2026-09-17

### حالة المنهج بعد هذه الدفعة

```text
A1 24/24 · A2 24/24 · B1 24/24 · B2 24/24
الدروس المنشورة: 96 · مراجعة/مشروع لكل وحدة: 30/30 · بوابة المستوى: 4/4
سجلات المحتوى المحكومة: 3,277 — المراجعات البشرية المستقلة المكتملة: 0
قوائم انتظار المراجعة البشرية: 89 مرشح اسم + 4 مرشحات إطار فعل — لا شيء أُغلق آليًا
خطوات دليل تقييم الفونيم: 0 من 9 · صوت بشري: 0 من 96 مقطع درس — كل الصوت توليد آلي
```

### الدروس الأربعة كما كُتبت — أرقام مقيسة من الملفات، لا من الوصف

| الدرس | العنوان | نص الاستماع | كلمات نموذج الكتابة | MP3 | Opus |
|---|---|---|---|---|---|
| `b2-21` | Sich auf einen Vermerk berufen | 1,139 حرفًا | 172 | 278,829 | 201,433 |
| `b2-22` | Bescheid und Nachfrist umformen | 1,161 | 196 | 286,509 | 208,229 |
| `b2-23` | Genitivketten und Komposita | 1,333 | 182 | 324,621 | 233,982 |
| `b2-24` | Kommasetzung bei Relativ- und Infinitivgruppen | 1,181 | 185 | 281,709 | 204,072 |

لكل درس: 5 أهداف، 18 عبارة، 4 كتل نظرية، 8 تمارين موزعة على الأنواع الخمسة، 3 أسئلة قراءة +
3 أسئلة استماع، 6 عناصر `ipa`، 5 أخطاء شائعة، Mini-Test من 5 عناصر، و12 بطاقة SRS. أُضيف إطارا
فعل لكل درس (8 أطر: `berufen auf`/`abstellen auf`، `abweichen von`/`stammen aus`،
`absehen von`/`führen zu`، `achten auf`/`schließen an`)، ول`b2-23` أُضيف عقد Genitiv إلى
`src/data/case-teaching-registry.ts` لأن سجلّاته صارت تحمل كلمة «Genitiv» صراحةً.

### قياسات البوابات في هذه الدفعة

```text
content:audit     → 4,345 جذرًا / 16 عائلة / 0 فشل؛ الإجابات 2,805 مغلقة + 384 إنتاجية / 3 إعفاءات / 0 تسريب
                    الأهداف 389/389. فجوات المعجم — الأسماء: 4,874 مرشحًا، 1,381 covered،
                    89 pending-human، 3,404 context-only (إجمالي الأهداف المكتوبة 1,470).
                    أطر الأفعال: 1,257 مرشحًا، 134 covered، 4 unclassified، 1,119 not-target.
governance:audit  → 3,277 سجلًا / 16 عائلة / 18 مصدرًا / 12 خطرًا / 12 ادعاءً / 18 سطر نطق
similarity:audit  → 3,277 كائنًا عبر 5,367,726 زوجًا — 0 مشكلة — 0 مرجع خارجي مفحوص
case:audit        → 19 عقدًا / 23 نظرية / 57 تحكميًا / 44 تقويميًا / 0 فجوات
language:audit    → 179 ملف TSX / 6,990 وسمًا / 399 مقطعًا ألمانيًا / 45 مقيّدًا / 233 مختلطًا / 0 مشكلة
tunisian:audit    → 17 ملاحظة / 17 درسًا / 17 مرجعًا نظريًا / 17 بانتظار مراجعة مستقلة / 0 فجوات
phoneme lexicon   → 213 سطرًا على مستوى الكلمة / 190 تهجئة / 96 درسًا
npm test          → 996/996 عبر 152 ملفًا — لا إخفاق، ولم يُحذف أو يُعطَّل أي اختبار؛ الأرقام أُعيد تثبيتها
npm run build     → exit 0 (فحص الأنواع مدمج) — 321/321 صفحة ثابتة/SSG
offline:size      → بصمة 3247e5347958 — a1 2,326,077 · a2 2,391,247 · b1 2,424,375 · b2 3,770,022 · full 5,443,225 (تتجدد بعد كل Build لأنها تُشتق من مسارات تحتوي buildId)
js:budget         → 107 مقاطع / 1,661,159 بايت gzip / أكبر ملف 609,588
media:budget      → 544 ملف MP3+Opus / 52,943,843 بايتًا تحت سقف آمن 59,500,000 (70,000,000 × 0.85 بعد ADR-077) (هامش 606,157)
handoff:check     → 0 انحراف
secret:audit      → 0 نتيجة · source:audit --strict → 18 سجلًا طازجة / 0 استحقاق / 0 متقادم
Playwright        → 82/82 عبر مشروعَي سطح المكتب والهاتف في 17.0 دقيقة على البناء الجديد — 0 إخفاق، ولا تُخفَّف أي عبارة
```

### الترميم بعد رجوع اللقطة (حصل في هذه الدفعة، ويُروى كما هو)

رجعت لقطة مساحة العمل أثناء الدفعة فأُفقدت ثمانية ملفات صوت جديدة و`public/audio/lessons/manifest.json`، واختفت
`node_modules` و`.next` و`~/.cache/ms-playwright`. الترتيب الذي أعاد الأخضر: `npm ci` (363 حزمة، خروج 0) → إعادة توليد
الصوت بنفس الوصفة المُثبتة (`piper-tts 1.8.0` + صوت `de_DE-ramona-low`، ‏24 kHz mono، ‏32 kb/s MP3 و24 kb/s Opus) →
`generate-lesson-audio-manifest.mjs` (96 أصلًا) → `offline:manifest` → كتابة أربعة تقارير تدقيق → `npm run build` →
`npx vitest run` (996/996) → `npx playwright test` (82/82). تحذير عملي مُقاس: **توليد Piper ليس تكرارًا بايتيًا** —
أحجام الملفات أعادت القياس إلى 1,171,668 بايتًا للـMP3 و847,716 للـOpus (مجموع 2,019,384 بدل 1,958,495 أول مرة)،
وارتفع الإجمالي إلى 52,943,843 من أصل 53,550,000 آنذاك (هامش 606,157؛ صار 6,556,157 بعد ADR-077)، فكل رقم حجم يجب أن يُعاد قياسه من القرص لا من
السجل. كما أن `apt-get download` + `dpkg-deb -x` إلى `/home/user/.pwlibs/root/usr/lib/x86_64-linux-gnu` مع
`LD_LIBRARY_PATH` هو ما أعاد Chromium للعمل بلا صلاحيات root (11 مكتبة ناقصة: nss/nspr/atk/atk-bridge/atspi/cups/
xdamage/xkbcommon/asound + avahi).

### قراران في هذه الدفعة موثَّقان بدل تغيير صامت

- **سقف صوت الدروس**: رُفع من 60 MB إلى 63 MB في `scripts/audit-media-pack-budgets.mjs` مع
  `docs/adr/ADR-076-lesson-audio-media-budget-raise.md`، بدل إعادة ترميز 92 ملفًا مُسلَّمًا من
  32 kbps إلى 24 kbps. البديل المحسوب (نحو 7 MB) بقي موثقًا في الـADR لمَن يفضّل الرجوع.
- **كاش الحِزم**: ترقّية يدوية `dwnb-full-pack-v122` → `v123` (و`staging`/`previous` إلى `v122`) لأن
  محتوى الحِزم تغيّر؛ طُبِّقت في `public/sw.js` وفي الاختبارات المثبِّتة لها وفي الحارس نفسه.

### ما يبقى مفتوحًا عمدًا بعد اكتمال العدد

- `P0-98` و`P0-99` و`P1-380`: المراجعة الألمانية المستقلة لـ3,277 سجلًا لم تبدأ بشخص مسمّى، وقرارات
  استبعاد أطر الأفعال الثمانية ما زالت معلّقة. 24/24 درسًا ≠ محتوى مُراجَع.
- telc: توزيع النقاط وحدّا 225/75 و135/45 غير مثبَّتَين بمصدر رسمي مقروء.
- `P1-92` (المرجع الخارجي للتشابه)، `P1-331` و`P2-264` (قارئ الشاشة الفعلي)، `P2-384` (لاتينية داخل
  سطور عربية)، `P1-377` (السياقات القانونية)، و`P0-255` و`P0-301/302` كما هي في `P0_AUDIT.md`.
- تقييم النطق: 0 من 9 خطوات دليل؛ لا تُقلَب أي راية جاهزية بدونه، ولا يُرسل التسجيل إلى Gemini أبدًا.

### الدفعة التالية المقصودة

- جولة مراجعة بشرية منظمة (مولّد قوائم + سجل قرارات) على 3,277 سجلًا، أو تثبيت telc عند توفر مصدر
  رسمي. لا دفعة محتوى جديدة: النقص الآن في الأدلة والمراجعة، لا في عدد الدروس.


### نقائص مقيسة في الدروس — مسبار جودة مستقل (2026-09-17، سُجِّلت كبنود)

المسبار (`docs/LESSON-QUALITY-FINDINGS-2026-09-17.md`) يقيس ما لا تقيسه البوابات الخضراء:
(1) **81 من 96** نموذج كتابة أقصر من العدد المذكور في مطلوبه (B2: 13؛ `b2-01` ‏128 كلمة مقابل «200–230 Wörter»، و‏a1-01 ‏26 مقابل «30–40»)؛
(2) انحياز الموضع: **A 466 · B 665 · C 114 · D 5** من 1,250 بندًا، و**91 من 96** درسًا لا تستخدم D أبدًا؛
(3) الخيار الأطول هو الصحيح في **55.2%** إجمالًا و**76.4%** في B2؛
(4) **201 من 387** تمرينًا إنتاجيًا يقبل سلسلة واحدة حرفيًا (B2: 55)، و`normalizeGermanText` لا يطي الأوملاوت/ß؛
(5) وسيط طول الشرح التصحيحي في B2 ‏**31 حرفًا** (234 من 314 بندًا أقل من 40)؛
(6) وسيط الاستماع في B2 ‏**147 كلمة ≈ 50 ثانية** (A1 ‏74 ≈ 25 ث) — دون مدى امتحان؛
(7) كلمات غير مغطاة بمعجم المستوى+القاموس في قراءة B2: وسيط **30.5%** (تعريف v2: معجم A1+B1+B2 مجتمعتًا، بعد إصلاح المطابقة)؛ أقصى مستوى 42.4% في `b1-23`، ولا نص فوق 45%؛
(8) **19** هدفًا بلا أثر في التمارين (A1 12 · A2 4 · B1 3 · **B2 0**)؛
(9) تغطية نطق **33%** من عبارات B2 (6 عناصر `ipa` مقابل 18 عبارة).
سُجِّلت كـ P1-397/398/399 وP2-400/401 (صارت P1 ‏135 وP2 ‏142)، كلها `not-implemented` ولا تُغلَق آليًا.

**القياس عند v134 (2026-09-19)**: البند (4) صار **197 من 387** (= 50.9%) بعد إضافة 5 بدائل
مصرَّح بها إلى 4 تمارين (ADR-078)، ولم يُمَسّ المصحِّح ولا السقف؛ والبند (7) بتعريف v2 التراكمي
وسيطه **29.8%** ولا نص فوق 45%. البنود (1)(2)(3)(5)(6)(8)(9) لم تتغير أرقامها في هذه الدفعة.
ثلاثة أمور بادت أنها نقائص ثم استُبعدت بعد الفحص: «خيارات مكررة» في `b2-23-e2`/`b1-13-e1`/`a2-04-m5`
(تباين حالة/تقطيع عمدًا لتدريب الإملاء)، و«بطاقات بلا الكلمة المفتاحية» (جذر مستخرج خطأً في المسبار)،
و«سلاسل لاتينية في العربية» داخل الدروس (مصطلحات ألمانية مقصودة).
إطالة الاستماع (6) تحتاج قرار حجم: الهامش **606,157 بايتًا** تحت سقف ADR-076 لا يتسع لها.


## 22. سجل دفعة `b2-25` — تقوية جودة الدروس (2026-09-18)

### ما قِيس ثم أُصلح

بوابة جديدة `scripts/generate-lesson-quality-audit.ts` (‏`npm run lesson:quality` تقرير، `lesson:quality:audit` صارم)
تقيس تسعة أبعاد لا تغطيها بوابات البنية. أول إصلاحين نُفِّذا بالكامل:

1. **مواضع الإجابة**: 1,250 بند اختيار؛ جُمِّد 60 بندًا حمايةً للمعنى (32 شرحها يشير إلى موضع أو حرف، 18 خياراتها
   مرتّبة زمنيًا، 10 رقمية)، وأُعيد ترتيب 931 بندًا ببذرة FNV محسوبة لكل درس لا على مستوى المشروع كله ⇒
   A 25.92% · B 23.84% · C 24.40% · D 25.84%، والدروس التي لا تستخدم D أبدًا من 91 إلى 3.
2. **نماذج الكتابة**: أُعيد تأليف 4 نماذج B2 داخل النطاق الذي يذكره مطلوبها (‏b2-01 ‏227، b2-02 ‏215، b2-03 ‏231،
   b2-04 ‏224 كلمة مقابل 200–250) ⇒ المخالفات انخفضت من 81 إلى 77 على مستوى A1–B2.

### ما بقي مفتوحًا (مقيسًا، لا مقدَّرًا)

نمط «الأطول هو الأصح» ‏55.2% (يتطلب تحرير المُشتَّتات، لا تدويرًا) · 201 تمرينًا إنتاجيًا بإجابة وحيدة (51.94%) —
الإصلاح في `acceptedAnswers` لا في المُصحِّح، لأن رفض البدائل غير المصرَّح بها سياسة مُختبَرة في
`tests/unit/content-integrity.test.ts:77-78` وتحتاج ADRًا · وسيط الشرح 23 حرفًا و1,134 من 1,250 بندًا أقل من 40 ·
37 هدفًا غير متتبَّع (A1 19 · A2 11 · B1 6 · B2 1 وهو من `b2-22`) · 77 نموذج كتابة · مدى الاستماع (وسيط 93 كلمة) ·
تغطية النطق 33%.

### قرار ملكي وبوابة

ADR-077: `totalAudioBytes` ‏63,000,000 → 70,000,000 (سقف آمن 59,500,000 مقابل 52,943,843 مقيسًا؛ المنهج 890,892 gzip)
لتُمَدَّد مقاطع الاستماع؛ التسجيل الصارم `lesson:quality:audit` غير موصَّل بـ `npm run check` حتى يخضرّ، لأن بوابة
حمراء ثابتة تُعلِّم الفريق تعطيل البوابات.

### البوابات بعد الدفعة

`npx tsc --noEmit` بلا أخطاء · `npx vitest run` ‏996/996 عبر 152 ملفًا · `npm run build` خروج 0 مع 321/321 صفحة وبصمة
offline ‏272715df140a وjs ‏107/1,662,356/610,785 · `media:budget` يمرّ · `handoff:check` بـ0 انحراف ·
`npx playwright test` ‏82/82 (12.6 د) على بناء ما بعد إعادة التوزيع، ثم 81/82 (17.2 د) بعد تعديل النماذج مع استنفاد
اختبار تثبيت الحزمة الكاملة لميزانيته 360 ث على الهاتف (ضحية زمن معروفة؛ نجح معزولًا في 26.6 ث).

### انزياح مقاس وأُعيد تثبيته بشهادة القياس

مرشحات الأسماء 4,389→4,414→4,445 و‏2,981→3,006→3,037 سياقًا فقط؛ أطر الفعل 1,090→1,104→1,118 و‏952→966→980. `pending-human` لم يتغير
(89 اسمًا، 4 أطر) فلا نمو في طابور المراجعة البشرية. البصمة: content SHA ‏f6786127ff6bcb37990c8fd7bb1cec8ddc2c2d985e200febb89ede6be43037d3.

### ما لم تُدَّعِه هذه الدفعة

لا مراجعة بشرية (0 من 3,277 — والحزمة جاهزة في `reports/review-packet/`)، ولا صوت بشري (0 من 96)، ولا دليل فونيم
(0 من 9)، ولا اعتماد من telc/Goethe، ولا «معلّم رسمي وحيد». لا يُغلق P0-98/P0-99/P1-380 ولا أي بند آليًا.

## 23) دفعة b2-26 — بصمات الحالة عند الإغلاق (مقيسة، لا تُقلَّب بلا قياس)

- content SHA-256 ‏eb97707d6fc775fc61047b1f2fb46884fb93c1e5eea74ed2e1a1a09cba83a0d2 · `offline:size` ‏b69d77e3b0d4 ( packs gzip: a1 2,328,699 · a2 2,393,854 · b1 2,426,999 · b2 3,778,142 · full 5,451,053)
- `js:budget` ‏107/1,663,940/612,369 · media ‏544 ملفًا/52,943,843 بايت تحت 59,500,000 وcurriculum ‏892,780 gzip · كاش الحزمة `dwnb-full-pack-v129` (staging/previous ‏v124)
- الاختبارات: vitest ‏996/996 في 152 ملفًا · Playwright ‏81/82 في 20.1 دقيقة (الفشل الوحيد مهلة تثبيت الحزمة الكاملة؛ نجح معزولًا في 59.9 ثانية على المشروعين) · `npm run lint` خروج 0 · `npx tsc --noEmit` صفر · `handoff:check` verified · مرشحات المعجم 4,445/3,037 وأطر الأفعال 1,118/980 وpending-human 89/4.
- بوابة الجودة: مخالفات نطاق الكتابة **68** (B2 = 0) · `objective review-prompts` **19** (غير معالَجة؛ 8 فُحصت يدويًا فكلها مغطاة) · مؤشر الأطول 55.2% ما زال مفتوحًا (P1-397) · explanations وسيط 23.
- المتبقي بصدق: شروحات تحت 60 حرفًا ‏**1,322** من ‏1,733 (تمارين: B1 ‏0 · B2 ‏0 · A2 ‏120 · A1 ‏167، والباقي 1,035 في أسئلة المراحل)، تلميح «الأطول=الأصح» ‏55.2%، ‏21 بديلًا يدويًا وفق ADR-078، تمديد الاستماع داخل هامش ‏6,556,157 بايت، ومراجعة بشرية ‏0/3,277. نماذج الكتابة: 0 خارج النطاق.

## 24) دفعة b2-27 — بصمات الحالة ومقياس أوسع للتغذية الراجعة

- content SHA-256 ‏6865b7f3cbce1dbf22d91df3511c690e834db24ad066f29e76e1dd50fd400983 · `offline:size` ‏5b076556032b (full 5,610,993) · js ‏110/1,713,173/245,019 · media ‏52,943,843 وcurriculum ‏933,289 gzip · كاش `dwnb-full-pack-v135` (staging/previous ‏v134).
- بوابة الجودة: ‏1,250 بند اختيار · وسيط شرح 23 و1,118 تحت 40 · **ولكل البنود: 1,733 وسيط 25 و1,614 تحت 60 و0 بدون شرح** · مخالفات نطاق الكتابة 68 (B2 ‏0) · مؤشر الأطول 55.2% · مؤشرات الأهداف للمراجعة 19 (غير معالَجة).
- العمل القادم بالترتيب: ‏72 بقايا تمارين B1 ثم ‏76 في B2 ثم A2 ثم A1 ثم أسئلة المراحل ⇒ ثم البدائل الـ21 ⇒ ثم تحرير المشتتات لأكبر 10 دروس ⇒ ثم الاستماع داخل الهامش المقاس.
- قاعدة تحريرية مكتسبة: لا تُدخل أسماء حالات إعرابية (Akkusativ/Dativ/Genitiv) في شرح تمرين لدرس بلا عقد حالة؛ `case:audit` يُفشل البوابة بـ«unowned case exercise». إمّا أن تُبقي الشرح بلا تسمية الحالة، أو تضيف العقد للدرس.

- دفعة 2026-09-19 (v136) حمل القراءة 2: 53 ترجمة في `reading.glossary` على عشرة دروس من النطاق
  القريب من 25% (a1-12 · a1-17 · a1-20 · a1-21 · a1-22 · a2-04 · a2-11 · a2-14 · a2-19 · a2-24) بلا أي اسم
  فجرى بلا مرسى وبلا سطر `pending-human`. الوسيط: A1 ‏21.6 وA2 ‏19.0 (**المعيار مُغلق**)، B1 ‏29.7 وB2 ‏28.6
  (مفتوحان)، أعلى نص 41.2 (`b1-23`)، لا نص فوق 45%. رُفض تليين المقياس (إعفاء الأعلام، أو مطابقة جذر
  فضفاضة تعطى 27.1/30.8/29.5، أو توسيع الوعاء ليشمل نصوص التمارين) لأن ذلك يُخضرّ البوابة بلا تعليم.
  أضيف للتقرير `reading.unknownByLesson`. الأرقام: `tsc` 0 · `lint` 0 · بناء 321/321 · بصمة `offline:size`
  ‏10e6f1fe9fd3 · الحزمة الكاملة `full 5,613,982` · `js:budget` ‏1,714,162 · المنهاج الصوتي 934,300 · فهرس البحث
  ‏3,750 · `npm test` ‏996/996 · البوابة ما تزال `fail` بالإنذارات الثلاثة (55.2% تلميحًا، 50.9% أحاديةً،
  وسيط شرح 24 حرفًا). السجل: `docs/run-logs/2026-09-19-reading-load-2/README.md` والجزء §1k من
  `docs/LESSON-QUALITY-FINDINGS-2026-09-17.md`.

## 25) دفعة حمل القراءة 3 — أُغلق معيار القراءة على المستويات الأربعة (v137)

- 76 ترجمة جديدة في `reading.glossary` على ستة عشر درسًا قريبًا من عتبة 25% (ثماني في B1 وثماني في B2)،
  كلها أفعال وصفات وظروف وضمائر: لا اسم، فلا مرسى ولا سطر pending-human؛ الفجوات المعجمية بقيت
  ‏4,685 مرشحًا / ‏1,376 مغطى / ‏89 pendingHuman / ‏3,220 سياقًا، مطابقةً حرفيًا لحالة v135.
- الوسيط التراكمي: A1 ‏21.6 · A2 ‏19.0 · **B1 23.9 · B2 23.3** ⇒ الشرط (وسيط ≤25% ولا نص فوق 45%) مُغلق على
  المستويات الأربعة. أعلى نص 39.1 (b2-07)؛ دروس فوق 25%: ‏10 في A1 و9 في A2 و11 في B1 و11 في B2.
- بصمة `offline:size` ‏126440b5affb (‏a1 2,387,871 · a2 2,464,233 · b1 2,526,595 · b2 3,873,967 ·
  الحزمة الكاملة `full 5,618,591`) · `js:budget` ‏110/1,715,785/245,771 · المنهاج الصوتي 936,143 ·
  كاش `dwnb-full-pack-v137` (staging/previous ‏v136) · فهرس البحث 3,750 · بصمة المحتوى be475d82….
- تصحيح لتعليل سابق: بصمة المحتوى ليست عمياء عن نصوص الدروس — هي خلاصة لكنها تتضمن صفوف الفجوات
  المعجمية، ولهذا تحرّكت في v137 ولم تتحرك في v136.
- الأداة: ألغينا سقف 16 درسًا في `reading.unknownByLesson`؛ التقرير يسرد الآن كل درس فوق العتبة (57 صفًا)،
  لأن الدفعة تعمل على النطاق القريب من 25% لا على الذيل.
- البيئة: نواتان و1,984 ميجابايت؛ `next build` كان يُقتل داخل فحص الأنواع (heap OOM عند 768/1024/1400 ميجابايت
  بلا مبادلة). فُعِّل ملف مبادلة 4 غيغابايت ثم نجح البناء 321/321. لا عتبة عُدِّلت ولا فحص أُسكِت.
- اختبار المتصفح: 81/82 داخل الحزمة (20.4 دقيقة)؛ الفشل الواحد هو اختبار الحزمة الكاملة على chromium الذي انتظر
  سطر الاكتمال 360 ثانية، بينما ينجح منفردًا في 38.7 ثانية وينجح على mobile داخل الحزمة — ضغط زمن/ذاكرة لا نقص
  حزمة. أول محاولتين في هذه الجلسة كانتا 82 فشلًا لأن chromium ومكتباته كانا غائبين عن الصورة؛ أُعيد تجهيزهما
  (تفصيل ذلك في السجل). لا ندّعي 82/82 لهذه الحالة؛ آخر تشغيل كامل نظيف يبقى v135.
- البوابة `lesson:quality:audit --strict` ما تزال fail بالإنذارات الثلاثة (تلميح 55.2%، أحادية البديل 50.9%،
  وسيط شرح 24 حرفًا). لا شيء أُغلق من شروط الجاهزية.
- الذيل المتبقي اختياريًا: b2-07 ‏39.1 وb2-01 ‏38.2 وb1-23 ‏36.5 وb1-12 ‏35.4 وb2-12 ‏35.0 وa1-04 ‏35.2 —
  أسماء ومركبات، لا تُخفض إلا بقرار مراسي موثق.

## 26) دفعة توازي الخيارات 1 — كسر قرينة الطول (v138)

- 39 عنصرًا في b1-15 وb2-01 وb2-02: 117 مشتتة أُعيدت كتابتها ألمانيةً كاملةً على وزن المفتاح، فزالت قرينة «الأطول هو الصواب» دون لمس نص المفتاح أو موضعه. القاعدة المطبَّقة: المفتاح لا يكون الأطول وحده ولا الأقصر وحده، وفارق الأطوال ≤25 حرفًا، ومجموعة الخيارات بلغة واحدة.
- القياس: قرينة الخيار الأطول ‏55.2% ⇒ **52.08%** (‏651 من 1,250). الحد 40% ولم يُبلغ عنه إغلاق؛ الحاجة نحو اثني عشر درسًا آخر، والأداة جاهزة: `python3 /home/user/scratch/cuefix.py --batch <json> [--write]` (تعديل آمن بالأقواس، يرفض أي خرق، ويُبقي المفتاح حرفيًا).
- حارس مُضاف: `tests/unit/mcq-option-parallelism.test.ts` (‏4 اختبارات) يفرض القاعدة على الدروس المحوَّلة ويمسح الخيارات كلها من الحروف غير العربية/اللاتينية؛ أزال كلمة عبرية كانت في b1-15-lq3.
- أثر جانبي موثق: تعداد الفجوات المعجمية يتأثر بنصوص الخيارات لأن المُرشِّحات تقرأ المحتوى كله — الأسماء ‏4,717 (‏1,377 مغطى / ‏3,251 سياقًا / ‏1,466 هدفًا) وأطر الأفعال ‏1,200، بينما **pending-human بقي 89 و4** والمراسي ‏1,297/134 وصفر قرار بشري جديد.
- البناء والبصمات: content SHA ‏e9c471b4046a · `offline:size` ‏76fdf8813342  *(أرقام بناء هذه الدفعة خاصة ببناية `v138`؛ الجاري منها في §29)* (الحزمة الكاملة `full 5,623,333`) · ‏`js:budget` ‏110/1,717,045/246,712 · المنهاج الصوتي 937,466 · 321/321 صفحة · vitest ‏1,002/1,002 في 154/154 · كاش ‏`dwnb-full-pack-v141` (staging/previous ‏v140) · `handoff:check` خروج 0.
- المتصفح: **‏82/82 نجاحًا في 13.8 دقيقة** على v138 (`PLAYWRIGHT_EXIT=0`)، وهو آخر تشغيل كامل نظيف؛ لم تُخفَّ عتبة ولم
  يُسقَط اختبار، والسجل `e2e-v138-full-run2.log` مرفق. المحاولة الأولى قبله انتهت بـ82 فشلًا لأن مشغّل chromium ومكتباته
  غابا مع إعادة تجهيز الصندوق؛ خامها محفوظ في `e2e-v138-missing-binary.log` ولا يُعدّ نتيجة تطبيق.
- درس بيئي: رسالة «Failed to type check.» لا تعني دائمًا نفاد الذاكرة — هنا كانت خطأ نوع حقيقيًا في اختباري الجديد (`promptDe` اختياري في التمرين وإلزامي في `Question`)؛ شُخِّصت بـ `tsc --noEmit` المستقل في 28 ثانية. وفي الوقت نفسه لا يزال البناء يحتاج مبادلة 4 غيغابايت على هذا الصندوق، وتُفقد الصورة `node_modules` ومشغّل chromium عند كل حد جلسة، فيفيدها `npm ci` ثم `npx playwright install chromium` ثم فك مكتبات at-spi/nss/cups/avahi إلى `~/.pwlibs`.

## 27) قاعدة مزامنة الوثائق بعد كل دفعة (ADR-079، من `v138`)

الوثائق الثلاث عشرة التالية تحمل سطرًا في أول اثني عشر سطرًا بصيغة `Sync batch: v<NNN>`: `AGENTS.md` و
`PROJECT_STATUS.md` و`P0_AUDIT.md` و`P1_AUDIT.md` و`P2_AUDIT.md` و`IDEA_BACKLOG.md` و`DECISIONS.md` و`ZERO_COST.md` و
`docs/MASTER_SPEC.md` و`docs/CONTENT_COMPLETENESS_AUDIT.md` و`docs/AUDIO_PRODUCTION_BACKLOG.md` و
`docs/SOURCE_FRESHNESS.md` وهذا الملف نفسه. عند رفع جيل الحزمة تُعاد قراءة كل وثيقة وتُحدَّث أرقامها البائتة ثم
يُرفَق السطر بالجيل الجديد؛ `npm run --silent handoff:check` يفشل إن غاب السطر أو بقي على جيل أقدم، ولا يُصلَح
الفشل بحذفه. القياس الذي أوجب القاعدة: وثيقتان كانتا تحملان جردًا معجميًا 4,389 مقابل 4,717 الحقيقي، وبند 397 كان لا يزال يُعلن 55.2% بينما الواقع 52.08%.

## 28) دفعة مزامنة الوثائق — ADR-079 (2026-09-20، جيل `v138`)

- القاعدة النافذة: سطر `Sync batch: v<NNN>` في أول اثني عشر سطرًا من ثلاث عشرة وثيقة قائمة، و`handoff:check` يرفض
  إن غاب السطر أو تأخر جيلًا. الميثاق في `docs/adr/ADR-079-documentation-sync-marker.md`.
- الأرقام البائتة التي صُحِّحت: الجرد المعجمي كان مكتوبًا 1,244 مرساة و4,389 إشارة و1,090 إطارًا (952 خارج الهدف) في
  `docs/CONTENT_COMPLETENESS_AUDIT.md` و`P0_AUDIT.md`، والواقع المطبوع في `reports/academic-content-audit.json` هو
  1,297 و4,802 (1,380 مغطى / 89 pending / 3,333 سياقًا) و1,233 إطارًا (134 مغطى / 4 pending / 1,062 خارج الهدف).
  وسطر البند 397 في `P1_AUDIT.md` كان عند 55.2% وأُرفِق به 52.08% (651 من 1,250) مع ذكر أن السقف 40% أي 500 بند.
- رأس `PROJECT_STATUS.md` كان «Last updated: 2026-09-13» ورأس `IDEA_BACKLOG.md` كان يعلن 396 وهو 401 بندًا مرقمًا؛
  صُحِّحَا، وأُضيفت أربعة بنود مؤجَّلة موثَّقة (402–405) بوسم `مؤجَّل موثَّق` لا بوسم أولوية، لأن سجل الأولويات
  124 و135 و142 يثبّته الفاحص ولا يُبدَّل بتسجيل مؤجَّل.
- البوابات في هذه الدفعة: `tsc --noEmit` صفر · vitest ‏154/154 ملفًا وكلها نجاح · lint صفر · بناء Next ‏321/321 ·
  `content:audit --check` صفر · `handoff:check` صفر مع سطر `doc sync: 13 standing documents` · `js:budget`
  110/1,717,045/246,712 · `media:budget` ‏544 ملفًا و52,943,843 بايت والمنهاج 937,466 · البصمة الجارية
  `offline:size` ‏f85aea1e3118 بـ `full 5,622,695` (a1 2,389,039 · a2 2,465,399 · b1 2,528,529 · b2 3,877,433).
- لم يُشغَّل المتصفح في هذه الدفعة: لا شيفرة منتج ولا بيانات متعلم تغيّرت، فآخر تشغيل كامل يبقى ‏82/82 على `v138`
  بتاريخ 2026-09-19. هذا تأجيل معلن لا إغلاق.
- لم يتغير جيل الكاش: `dwnb-full-pack-v141` يبقى، لأن بصمة المحتوى ما تزال
  e9c471b4046a5c9f3fa4b3a4a3b68e9d376d0032225db5c6d13e4080ada20d90، فلا يُرهَق الدارس بإعادة تنزيل بلا سبب.

## 29) دفعة نقاء النصوص و`v139` — عيب حرفين صينيين في b2-13 (2026-09-20)

- ما وُجد: مسح `src/**` ببصمة الحروف الشرق آسيوية وجد نصًا واحدًا ملوثًا من أصل 39,540 نصًا مؤلَّفًا في 96 درسًا:
  `b2-13.exercises[4].explanationAr` كان يحوي حرفين شرق آسيويين محل «تفاوض» من «ما لا يُتفاوض عليه» (وهما حرفان لا يُنطقان في جملة عربية) مع مسافة زائدة بعد واو
  «و معيار الفشل». موضعه في الملف الخام خادع: السطر 460 من `src/data/lessons-b2-module6.ts` يقع بصريا بعد معرّفات
  b2-12، بينما السجل المجمَّع يقول b2-13؛ القراءة من `academicLessonList` هي المرجع لا ترتيب الملف.
- التصحيح: «ما لا يُتفاوض عليه» و«ومعيار الفشل». لا تغير في أي مفتاح إجابة ولا في أي خيار ولا في أي موضع صواب.
- حارس جديد: `tests/unit/lesson-text-purity.test.ts` يمشي على كل ورقة نصية في المنهاج ويرفض العبرية والشرق آسيوية
  والكيريلية (اختباران)، لأن الحارس القديم كان يمسح الخيارات فقط ولا يرى الشروح.
- البوابة: `lesson:quality` أعاد التقرير وبقيت القرينة 52.08% (1,250 عنصرًا) كما هي، و`content:audit --check` مرّ بعد
  إعادة توليد التقارير، والعدادات المعجمية لم تتحرك (1,297 مراسي و4,717 إشارة أسماء و1,200 إطارًا)، واحتياطي البشر
  89 و4 بلا تغيير.
- البوابات: tsc صفر · vitest **1,002/1,002** عبر **154/154** · lint صفر · بناء 321/321 · `offline:size` بصمة
  `f85aea1e3118` و full ‏5,622,695 (a1 2,389,039 · a2 2,465,399 · b1 2,528,529 · b2 3,877,433) · `js:budget`
  110/1,717,045/246,712 · `media:budget` ‏544 ملفًا و52,943,843 بايت والمنهاج 937,466 · `handoff:check` صفر.
- الكاش رُفع إلى `dwnb-full-pack-v141` (staging/previous ‏v140) لأن نصًا في بيانات الدرس تغيّر؛ وسطر المصادقة في
  الوثائق الثلاث عشرة رُفع معه إلى `v139` فمرّ حارس ADR-079 على رفع جيل حقيقي أول مرة.
- المتصفح: لم يُشغَّل في هذه الدفعة (لا مسار واجهة تغيّر). آخر تشغيل كامل **82/82** يبقى المنسوب إلى `v138` بتاريخ
  2026-09-19، ولا يُدّعى لـ`v139`. هذا تأجيل معلن. السجل: `docs/run-logs/2026-09-20-b2-13-text-purity-1/README.md`.

## 30) دفعة v140 — موازة الخيارات الثانية وتثبيت العدادات المعجمية (2026-09-20)

- **العينة**: 49 عنصر اختيار من متعدد في ‏`b2-12` (‏13 من 13) و‏`b1-05` (‏12 من 13) و‏`b2-07` (‏12) و‏`b2-08` (‏12).
  لكل عنصر كُتب تشتيت ألماني جديد: واحد أطول من المفتاح بحرفين إلى أربعة، وواحد أقصر كذلك، والثالث داخل نافذة تباعد ‏≤25 حرفًا،
  وكلها جمل تامة. لم يُمسّ المفتاح ولا الإجابة ولا موضعها.
- **البوابة**: قرينة «الأطول = الأصح» ‏**52.08% ⇒ 48.16%** (‏602 من 1,250). السقف ≤40% ⇒ يبقى **102 بندًا ≈ 9 دروس**،
  أولها ‏`b2-11` (‏13 من 13) ثم ‏`b1-20` و‏`b1-07`.
- **درس حارس**: بإدراج درس في ‏`PARALLELISED` يفحص ‏`tests/unit/mcq-option-parallelism.test.ts` **كل** عناصره، فظهر خللان
  لم يورده مسبار القرينة: تباعد ‏32 حرفًا في ‏`b2-07-m2` (خُفّض إلى 16) وكلمة عربية ملتصقة بخيار ألماني في ‏`b2-08-m2`
  (بُدّل بتشتيت ألماني). لم يُخفَّف الحارس؛ أُصلح الخللان. ‏154/154 ملفًا و‏1,006/1,006 اختبارًا أخضر.
- **الأرقام المعجمية تحرّكت (تثبيت إلزامي)**: ‏4,802 اسمًا = ‏1,380 covered / ‏89 pending-human / ‏3,333 context-only
  (الأهداف المكتوبة 1,469)، وأطر الأفعال ‏1,233 = ‏134 covered / ‏4 unclassified / ‏1,095 not-target، والمراسي ‏1,297.
  أُعيد التثبيت في ‏`tests/unit/lexical-target-gap.test.ts` و‏`tests/unit/academic-content-governance.test.ts:114`
  و‏`scripts/verify-continuation-handoff.mjs:658` وما بعده، وفي كل الوثائق الجارية (الدفعة السابقة كانت قد ثبّتت ‏4,717/1,377/3,251/1,062).
- **البوابات**: tsc صفر · lint صفر · ‏1,006/1,006 · بناء ‏321/321 · `offline:size` ‏3bd784b8622f مع ‏`full 5,630,874`
  (a1 2,392,098 · a2 2,468,457 · b1 2,532,279 · b2 3,884,862) · `js:budget` ‏110/1,720,034/249,350 ·
  `media:budget` ‏544 ملفًا و52,943,843 بايتًا و‏`curriculumSourceGzipBytes` ‏939,473 · بصمة المحتوى ‏`e9c471b4046a`.
- **الكاش**: `dwnb-full-pack-v141`، وstaging/previous على ‏v139، وقشرة `dwnb-shell-v4`. قياس المتصفح في هذه الدفعة: مشروع chromium الكامل ‏40 من 41 في ‏13.3 دقيقة، وبند واحد فشل لأنه انتظار تثبيت الحزمة الكاملة (سقفه ‏360 ثانية) تحت حِمل ‏3.2 وذاكرة شبه نفدت؛ أُعيد البند نفسه معزولًا على صندوق فارغ فأخضر في ‏35.5 ثانية. مشروع mobile لم يُشغَّل. آخر نظيف للحزمتين معًا يبقى ‏82/82 عند ‏v138.

## 31) دفعة v141 — ترطيب /settings وحارس قيم الجهاز (2026-09-20)

- السبب: `useState(() => sessionStorage.getItem("dwnb-ai-key"))` كان يجعل أول رسم للعميل يختلف عن HTML الخادم متى حمل التبويب قيمة.
- الحل: `src/components/device-value.ts` فيه `useDeviceValue` و`useMounted` فوق `useSyncExternalStore`؛ لا كتابة حالة داخل أثر
  لأن قاعدة `react-hooks/set-state-in-effect` تمنعها في هذا المشروع.
- المواقع المُصلَحة: settings-view، review-reminder-control (منطقة الوقت + إذن الإشعار)، planning-preferences-control (تاريخ اليوم)،
  continuous-exam-session (ساعة الجلسة تبدأ من `session.startedAt` حتى الترطيب).
- المواقع المؤجَّلة المسماة في الحارس: review-reminder-coordinator، app/review/page، study-export-control.
- القياس: 155/155 ملفًا و1,011/1,011 اختبارًا · tsc صفر · lint صفر · الكاش `dwnb-full-pack-v141` (staging/previous ‏v140).
- القياس بعد البناء: tsc صفر · lint صفر · 155/155 و1,011/1,011 · 321 صفحة · `offline:size` e3dc08f4f415 مع `full 5,630,769`
  (a1 2,392,186 · a2 2,468,538 · b1 2,532,349 · b2 3,884,824 · full 5,630,769) · `js:budget` 110/1,720,162/249,350 · `media:budget` 544 ملفًا و52,943,843 بايتًا و939,473 gzip ·
  الكاش dwnb-full-pack-v141. وأُصلح عطل وضع التطوير في next.config.ts بافتراض تقسيم الحزم كائنًا.
- الصراحة: حزمة المتصفح لم تُشغَّل؛ chromium نُصِّب لكن ست مكتبات نظام ناقصة وapt متعذر لانفجار مساحة /var،
  فبند الترطيب المضاف (العدد 42 لكل مشروع) غير مقاس، ولا يُذكر أي رقم متصفح باسم v141.

## 32) دفعة v142 — إغلاق البند 406: حصر قراءة قيم الجهاز في الرسم الأول (2026-09-20)

- المواقع الثلاثة المؤجَّلة صارت مأسورة: `review-reminder-coordinator.tsx` (دقّة التذكير)، `src/app/review/page.tsx`
  (منطقة الوقت والساعة)، `study-export-control.tsx` (ساعة التصدير ومنطقة الوقت في ملف ICS). النمط المستعمل:
  `const EPOCH = new Date(0);` على مستوى الوحدة، و`const deviceNow = useDeviceValue(() => Date.now(), 0);`،
  ثم `const now = useMemo(() => epochOr(deviceNow), [deviceNow]);` حيث `epochOr` دالة على مستوى الوحدة —
  بهذا يبقى `now` ثابت الهوية فلا تفقد ذاكرات `useMemo` جدواها، ولا يُنادى أي خطاف داخل شرط.
- كشف الحارس ما لم يكن مسجلًا: في `study-export-control.tsx` كانت `const timeZone=useMemo(()=>Intl.DateTimeFormat()...`
  تقرأ منطقة الوقت في أول رسم؛ صارت `useDeviceValue(...,"UTC")`. لم يكن هذا في البند 406، ولولاه ما أزيل الملف من القائمة.
- `tests/unit/no-storage-in-render-init.test.ts`: أفرغت `deferred` وصار الاسم `const deferred: string[] = [];`؛
  الاختبار الخامس يُقرأ الآن «لا مواقع مؤجَّلة — الدين أُغلق». الحارس لم يُضعَّف: لم تُضف استثناءات، ولم تغيَّر الأنماط.
- رُفع جيل الكاش إلى `dwnb-full-pack-v142` (staging/previous v141) في `public/sw.js` وستة ملفات اختبار والحارس.
- القياس بعد البناء: tsc صفر · `npm run lint` صفر مشاكل (صفر تحذيرات في الملفات الثلاثة) · vitest **155/155** ملفًا
  و**1,011/1,011** اختبارًا · بناء **321 صفحة** · بصمة `offline:size` **51316cb18282** مع `full 5,631,189`
  (a1 2,392,468 · a2 2,468,817 · b1 2,532,642 · b2 3,885,365) · `js:budget` 110/1,720,720/249,350 ·
  `media:budget` 544 ملفًا / 52,943,843 بايتًا / 939,473 gzip · `handoff:check` صفر · الكاش `dwnb-full-pack-v142`.
- الصراحة المطلوبة: حزمة المتصفح ما تزال غير مشغَّلة على هذا الصندوق (ست مكتبات نظام ناقصة لـ chromium)، فبنـد الترطيب
  في `tests/e2e/critical-flows.spec.ts` غير مقاس، وآخر قياس كامل معروف يبقى **82/82 عند v138**. لا رقم متصفح باسم v142.
- التالي المفتوح: المرحلة 3C — 102 عنصرًا ≈ 9 دروس إلى ≤40% (602/1,250 = 48.16%)، يقودها `b2-11` (13/13) ثم `b1-20`،
  ثم الشروحات عند مستوى التمرين في A2 (120) فA1 (167).

## 33) دفعة v143 — كسر قرينة «الأطول = الأصح» في `b2-11` و`b1-20` (2026-09-20)

- الدرسان الأعلى انحرافًا حُوِّلا كاملين: ‏`b2-11` كان 13 من 13 عنصرا بقرينة (100%) وصفر، و‏`b1-20` كان 12 من 13
  (92.3%) وصفر. مؤلِّف الاشتتات: `scripts/cue-batch.py` ثم `scripts/parallelise-options.py --batch … --write`؛
  75 مشتتًا ألمانيًا مكتوبًا يدويًا، والمفتاح بقي حرفيًا كما هو في موضعه.
- القرينة المقيسة: ‏**602 من 1,250 = 48.16%** صارت ‏**577 من 1,250 = 46.16%** (تقرير
  `reports/lesson-quality-audit.json`، البوابة 40% وما تزال **فوقها** — لا يُغلق البند P1-397 بهذه الدفعة).
- توزّع الإجابات لم يتحرك: A 324 · B 298 · C 305 · D 323، لأن `parallelise-options.py` لا يمس `correctIndex`؛
  وبقيت 3 دروس بلا خيار في الموضع D كما هي.
- القواعد المطبَّقة على كل عنصر: المفتاح ليس الأطول وحده ولا الأقصر وحده، توسيع الأطوال ≤ 25 حرفًا،
  مجموعة واحدة بلغة واحدة (سبع مجموعات كانت ألمانية بمشتتات عربية فصارت ألمانية نقية)، ولا تكرار بعد طيّ
  الحالة وأوملاوت والنقط النهائية. الحارس `tests/unit/mcq-option-parallelism.test.ts` توسّع من 7 دروس إلى 9
  وصار 10 اختبارات، ولذلك ارتفع عدد الاختبارات إلى ‏**1,013** في ‏**155** ملفًا.
- العدادات المعجمية تحرّكت مع النص الجديد وأُعيد تثبيتها في الاختبار والحارس والوثائق: الأسماء ‏4,802 ⇒ ‏4,823
  مرشحًا (مغطى 1,380 ⇒ 1,381، سياقًا 3,333 ⇒ 3,353، مؤلَّف 1,469 ⇒ 1,470)، وأطر الأفعال ‏1,233 ⇒ ‏1,240
  (سياقًا 1,095 ⇒ 1,102). **ولم تتحرك أرقام pending-human: 89 و4**، والمراسي 1,297/134 كما هي، لأن
  التأليف لم يُنشئ أهدافًا معجمية جديدة. بصمة المحتوى ‏`412c24028a46…` (كانت ‏e9c471b4046a).
- البند المفتوح التالي بالقياس: يحتاج ‏**77** عنصرًا آخر للنزول إلى ≤40% (577 − 500). السبعة دروس التالية
  بالتحديد تغطيها: `b1-07` · `b1-12` · `b1-16` · `b1-22` · `b2-05` · `b2-13` · `b2-17`، كلٌّ منها 11 عنصرًا.
- البناء المقاس بعد الدفعة: 321 صفحة · بصمة `offline:size` **333d680928d8** مع `full 5,633,491`
  (a1 2,393,332 · a2 2,469,670 · b1 2,534,274 · b2 3,886,856) · `js:budget` 110 مقاطع / 1,721,357 gzip /
  أكبر ملف 249,865 · `media:budget` 544 ملفًا / 52,943,843 بايتًا / المنهاج 940,491 gzip · ترقية الكاش إلى
  `dwnb-full-pack-v143` (staging/previous v142) · `handoff:check` صفر. بصمة المحتوى `412c24028a46…`.
- المتصفح: شُغِّل مشروع chromium كاملاً على هذا الصندوق بعد تثبيت مكتباته: بند الترطيب في
  `tests/e2e/critical-flows.spec.ts` مرّ في 12.5 ثانية (أول قياس له منذ أُضيف عند v141)، والمشروع كله 40 من 42
  في جري واحد، والفشلان (لوحة جهوزية الامتحان وحزمة الأوفلاين الكاملة) مرّا عند إفرادهما في 1.1 دقيقة و31.2
  ثانية — تذبذب زمن لا كسر محتوى. مشروع الهاتف (Pixel 7) لم يُشغَّل، ولا يُدّعى 82/82 باسم v143.

## 34) دفعة v144 — `b1-07` و`b1-12`: القرينة إلى 44.4% (2026-09-20)

- حُوِّل الدرسان بالكامل: `b1-07` كان 11 من 13 عنصرا بقرينة الأطول و`b1-12` كان 11 من 13؛ صار صفرًا في الاثنين.
  22 عنصرًا و66 مشتتًا ألمانيًا، كلُّها من `scripts/cue-batch.py` ثم `scripts/parallelise-options.py --write`.
- كشف إضافي يستحق التسجيل: `b1-12-m5` لم يكن عنصر قرينة (المفتاح لم يكن الأطول) لكنه كان **مجموعة مختلطة**:
  ثلاثة مشتتات عربية بجانب مفتاح ألماني. الحارس Level-wise (كل عناصر الدرس) هو الذي كشفه عند إضافة الدرس إلى
  القائمة، فأُصلح هو الآخر عبر الأداة نفسها (3 مشتتات ألمانية، أطوال 28/26/17 حول مفتاح طوله 20). العدد الكلي
  للمجموعات المعاد تأليفها في الدفعة: **23**.
- القرينة المقيسة: ‏577 من 1,250 = 46.16% ⇒ **555 من 1,250 = 44.4%**. السقف 40% أي ≤500: يلزم **55** عنصرًا،
  وتغطيه خمسة دروس بالضبط: `b1-16` · `b1-22` · `b2-05` · `b2-13` · `b2-17` (11 لكلٍّ). **P1-397 يبقى مفتوحًا**
  و`lesson:quality:audit` ما يزال exit 1 (ثلاث ملاحظات: الطول 44.4%، الإنتاجية أحادية السلسلة 50.9%، وسيط الشرح 24).
- حارس الموازة صار على **11** درسًا محوَّلًا، فعدد الاختبارات **1,015** في **155** ملفًا · tsc صفر · lint صفر.
- العدادات المعجمية بعد إعادة التوليد: الأسماء ‏4,823 ⇒ ‏4,833 (سياقًا 3,353 ⇒ 3,363، مغطى 1,381 ومؤلف 1,470
  بلا حركة)، أطر الأفعال ‏1,240 ⇒ ‏1,242 (سياقًا 1,102 ⇒ 1,104). **pending-human لم تتحرك: 89 و4**.
  التدقيق اللغوي: 179 TSX / 6991 وسمًا / 399 ألمانيًا / 45 نطاقًا / 233 مختلطًا ساكنًا / صفر مشاكل.
  بصمة المحتوى `cfbffc605825…`، والكاش `dwnb-full-pack-v144` (staging/previous v143).
- عيب بيئة سُجّل لا أُخفي: نسخة المستودع كانت مرجَّعة عن v142/v143 في ملفات الاختبار والمكوّنات، فاستُعيدت من
  أرشيف v143 المسلَّم قبل أي قياس؛ وأول محاولة بناء فشلت بـ exit 1 لأن `prebuild` رأى `docs/generated/*` عتيقًا
  بعد إصلاح `m5` — فأُعيد توليد كل التقارير ثم بُني. القياس النهائي أدناه بعد البناء.
- المتصفح: مشروع chromium لم يُعَد تشغيله على هذا البناء؛ آخر قياس متصفح مُسجَّل يبقى ما ثُبّت عند v143
  (40 من 42 في المشروع الكامل، والبندان الفاشلان مرّا منفردَين، وبند الترطيب نجح في 12.5 ثانية). مشروع الهاتف
  لم يُشغَّل إطلاقًا على هذا الصندوق.
- البناء المقاس بعد الدفعة: **321 صفحة** · بصمة `offline:size` **5920fa8f1432** مع `full 5,635,555`
  (a1 2,393,854 · a2 2,470,196 · b1 2,536,008 · b2 3,887,581) · `js:budget` 110 مقاطع / 1,721,819 gzip /
  أكبر ملف 249,865 · `media:budget` 544 ملفًا / 52,943,843 بايتًا / المنهاج 940,949 gzip · بصمة المحتوى
  `cfbffc605825…` · `handoff:check` صفر.


## 35) دفعة v145 — `b1-16` و`b1-22`: القرينة إلى 42.8% (2026-09-20)

- حُوِّل **20** عنصر قرينة (10 في كل درس) وأُعيد تأليف **60** مشتتًا ألمانيًا، كلها عبر `scripts/cue-batch.py` ثم
  `scripts/parallelise-options.py --write`؛ لم يُمَسّ نصّ المفتاح ولا `correctIndex` في أي عنصر، ولم تُحرَّر أي مجموعة يدويًا.
- القرينة المقيسة بـ`scripts/probe-option-cue.ts`: ‏555 من 1,250 = 44.4% ⇒ **535 من 1,250 = 42.8%**. البوابة
  `lesson:quality:audit` ما تزال exit 1 بثلاث ملاحظات: الطول 42.8% (السقف 40%)، الإنتاجية أحادية السلسلة 50.9%،
  وسيط الشرح 24 حرفًا (الأدنى 60). **P1-397 يبقى مفتوحًا.**
- قيد أداة سُجِّل ولم يُخفَ: `cue-batch.py` ترفض مجموعة خيارات ليست ألمانية نقية، فبقي `b1-16-e6` و`b1-22-e6`
  (مفتاحهما عربي) عنصري قرينة. لم تُرخَّ القاعدة ولم يُكتب العربية يدويًا؛ ولأن الحارس Level-wise يفرض قاعدته على كل
  عناصر الدرس المدرَج، لم يُضف أيٌّ من الدرسين إلى `PARALLELISED` ⇒ بقيت **11** دروسًا، فبقي عدد الاختبارات
  **1,015** في **155** ملفًا ولم تُحرَّك أرقام التثبيت.
- الحساب التالي مقاس: السقف ≤40% أي ≤500 عنصرًا، فيلزم **35**. ثلاثة دروس بقياد 11 عنصرًا (`b2-05` · `b2-13` ·
  `b2-17`) تعطي 33 ولا تكفي؛ يلزم رابع (`b2-19`، 11) أو فتح الأداة لمجموعات عربية نقية لعنصرَي `b1-16-e6` و`b1-22-e6`.
- العدادات المعجمية بعد إعادة التوليد: الأسماء ‏4,833 ⇒ **4,845** (مغطى 1,381 · مؤلف 1,470 بلا حركة، وسياقي 3,363 ⇒
  **3,375**) وأطر الأفعال ‏1,242 ⇒ **1,245** (مغطى 134 · سياقًا 1,104 ⇒ **1,107**). **pending-human لم تتحرك: 89 و4**،
  والمراسي 1,297 و134. التدقيق اللغوي: 179 TSX / 6991 وسمًا / 399 ألمانيًا / 45 نطاقًا / 233 مختلطًا ساكنًا / 0 مشاكل،
  وبصمة تقرير اللغة `9da1a2e19f1e`. بصمة المحتوى `f2c6e0eae623…`، والكاش `dwnb-full-pack-v145` (staging/previous v144).
- عيبا بيئة سُجّلا: الشجرة كانت مرجَّعة إلى ما قبل v143 (7 دروس موازة و602 عنصر قرينة) فاستُعيدت كاملة من أرشيف v144
  المسلَّم قبل أي قياس؛ و`/home/user/.swapfile` كان مفقودًا فمات أول بناء عند SSG تحت حمل 11+، وأُعيدت المبادلة
  (‏1,500 MB) ثم بُني بحاجز ذاكرة 1,200 ميغابايت.
- البوابات: tsc صفر · lint صفر · vitest **155/155** ملفًا و**1,015/1,015** اختبارًا · `handoff:check` صفر.
- البناء المقاس بعد الدفعة: **321 صفحة** · بصمة `offline:size` **998d868001ba** مع `full 5,637,516`
  (a1 2,394,405 · a2 2,470,747 · b1 2,537,779 · b2 3,888,205) · 318 مسارًا offline (حُزَم 58/58/58/219/318) ·
  `js:budget` 110 مقاطع / 1,722,311 gzip / أكبر ملف 249,865 · `media:budget` 544 ملفًا / 52,943,843 بايتًا /
  المنهاج 941,492 gzip · `handoff:check` صفر.
- المتصفح: مشروع chromium لم يُعَد تشغيله على هذا البناء؛ آخر قياس مُسجَّل يبقى ما ثُبّت عند v143 (40 من 42 في
  المشروع الكامل، والفاشلان مرّا منفردَين، وبند الترطيب 12.5 ثانية). مشروع الهاتف (Pixel 7) لم يُشغَّل، فلا
  يُدَّعى **82/82** باسم v145. السجل: `docs/run-logs/2026-09-20-cue-parallelism-b1-16-b1-22/`.

## 36) دفعة v146 — `b2-05`: القرينة إلى 41.9% وحارس على 12 درسًا (2026-09-20)

- حُوِّل **11** عنصر قرينة في `b2-05` (من 13 بندًا: 85% من الدرس كان بقرينة الأطول) وأُعيد تأليف **33** مشتتًا
  ألمانيًا، كلها من `scripts/cue-batch.py` ثم `scripts/parallelise-options.py --batch … --write`. لم يُمَسّ نصّ مفتاح
  ولا `correctIndex`، ولم تُكتب أي مجموعة يدويًا داخل `src/data`. القبول الأول للأداة بلا رفض واحد.
- القرينة المقيسة: ‏535 من 1,250 = 42.8% ⇒ **524 من 1,250 = 41.92%** (التقرير يطبع 41.92، والمسبار يطبع 41.9).
  البقايا حتى السقف ≤40% (≤500 عنصرًا): **24 عنصرًا** — `b2-13` (11) + `b2-17` (11) = 22 فلا تكتفيان، ويلزم
  ثالث (`b2-19`، 11) أو السماح لـ`cue-batch.py` بمجموعات عربية نقية لعنصرَي `b1-16-e6` و`b1-22-e6` العربيّي المفتاح.
- أُضيف `b2-05` إلى `PARALLELISED` ⇒ **12** درسًا محوَّلًا، فصار الحارس **13** اختبارًا في ملفه وعدد الاختبارات
  **1,016** في **155** ملفًا · tsc صفر · lint صفر. البندان غير القرينيين في الدرس (‏`b2-05-lq1` و`b2-05-m2`، مقيسان: 13 بندًا و0 قرينة) مرا
  على قواعد الحارس بلا إصلاح، فاستُغني عن أي كتابة زائدة.
- توزيع مقاس بعد الدفعة (`scripts/probe-option-cue.ts`): ex 80/194 (41.2%) · rd 163/288 (56.6%) ·
  ls 133/288 (46.2%) · mt 148/480 (30.8%)؛ وبالمستوى A1 82/312 (26.3%) · A2 147/312 (47.1%) · B1 142/312 (45.5%) ·
  **B2 153/314 (48.7%)** — الفرق كله في B2 (164 ⇒ 153). المواضع لم تتحرك: A 324 · B 298 · C 305 · D 323
  (25.92/23.84/24.4/25.84) و3 دروس بلا D.
- العدادات المعجمية بعد إعادة التوليد: الأسماء ‏4,845 ⇒ **4,857** (سياقي 3,375 ⇒ **3,387**، مغطى 1,381 ومؤلف 1,470
  بلا حركة)، أطر الأفعال ‏1,245 ⇒ **1,249** (سياقي 1,107 ⇒ **1,111**). **pending-human لم تتحرك: 89 و4**، والمراسي
  1,297 و134. التدقيق اللغوي: 179 TSX / 6991 وسمًا / 399 ألمانيًا / 45 نطاقًا / 233 مختلطًا ساكنًا / 0 مشاكل.
  بصمة المحتوى `6c915e187d4b…`، والكاش `dwnb-full-pack-v146` (staging/previous v145).
- `lesson:quality:audit` **خروجه 1** بثلاث ملاحظات: الطول 41.9% (سقف 40)، الإنتاجية أحادية السلسلة 50.9% (سقف 25)،
  وسيط الشرح 24 حرفًا (أدنى 60) ⇒ **P1-397 يبقى مفتوحًا** ولا يُغلق بأخضر الاختبارات.
- عيوب بيئة سُجّلت: الشجرة كانت مرجَّعة مرة ثالثة (7 دروس موازة، قرينة 602 = 48.2%، `deferred` غير فارغة) مع
  `sw.js` على v145؛ استُعيدت كاملة من أرشيف v145 ثم تحقّق بالقياس (535 ⇒ ثم 524 بعد الدفعة). و`/home/user/.swapfile`
  كان مفقودًا فأُعيد (1,500 MB) قبل البناء، و`node_modules` كان محذوفًا فـ`npm ci` (471 حزمة في 23 ثانية).
- البناء المقاس بعد الدفعة: **321 صفحة** في 9.5 ثانية · بصمة `offline:size` **c1d47e97c82c** مع `full 5,638,437`
  (a1 2,394,711 · a2 2,471,067 · b1 2,538,107 · b2 3,889,201) · 318 مسارًا offline (حُزَم 58/58/58/219/318) ·
  `js:budget` 110 مقاطع / 1,722,656 gzip / أكبر ملف 250,210 · `media:budget` 544 ملفًا / 52,943,843 بايتًا /
  المنهاج 942,038 gzip · `handoff:check` صفر.
- المتصفح: لم يُعَد تشغيله على هذا البناء؛ آخر قياس مُسجَّل يبقى ما ثُبّت عند v143 (40 من 42 في مشروع chromium،
  والفاشلان مرّا منفردَين، وبند الترطيب 12.5 ثانية). مشروع الهاتف (Pixel 7) لم يُشغَّل، فلا يُدَّعى **82/82** باسم
  v146. السجل: `docs/run-logs/2026-09-20-cue-parallelism-b2-05/`.

## 37) دفعة v147 — `b2-13`: القرينة إلى 41.04% وحارس على 13 درسًا (2026-09-20)

- حُوِّل **11** عنصر قرينة في `b2-13` (كان 11 من 13 بندًا = 85%) وأُعيد تأليف **33** مشتتًا ألمانيًا عبر
  `scripts/cue-batch.py` ثم `scripts/parallelise-options.py --write`؛ المفتاح و`correctIndex` لم يُمَسّا، ولم ترفض
  الأداة أي صياغة (قُبلت الدفعة من أول محاولة بعد فحص أطوال داخلي: كل مشتت داخل ‏[K−12, K+18]، واحد أطول من المفتاح
  وواحد أقصر، توسيع ≤25، ولا تكرار بعد طيّ الترقيم).
- القرينة المقيسة: ‏524 من 1,250 = 41.92% ⇒ **513 من 1,250 = 41.04%** (التقرير يطبع 41.04 والمسبار 41.0).
  بالتوزيع: ex ‏78 من 194 (40.2%) · rd ‏160 من 288 (55.6%) · ls ‏131 من 288 (45.5%) · mt ‏144 من 480 (30.0%)؛
  وبالمستوى A1 ‏82 (26.3%) · A2 ‏147 (47.1%) · B1 ‏142 (45.5%) · **B2 ‏142 من 314 (45.2%)**. المواضع لم تتحرك:
  A 324 · B 298 · C 305 · D 323 (25.92/23.84/24.4/25.84) و3 دروس بلا D.
- الحارس: أُدرج `b2-13` ⇒ **13** درسًا محوَّلًا، فملف الحارس **14** اختبارًا والإجمالي **155** ملفًا و**1,017** اختبارًا
  · tsc صفر · lint صفر · `handoff:check` صفر. البندان غير القرينيين في الدرس، ومقيسان بعد التحويل بسكريبت مؤقّت على
  `academicLessonList`: ‏13 بندًا و0 قرينة، وغير القرينيين هما ‏`b2-13-lq2` (18 مقابل 18) و`b2-13-m5` (16 مقابل 25)؛
  مرّا على قواعد الحارس بلا تعديل. ثلاث بنود محوَّلة صارت مفتاحها **يعادل** أطول مشتت حرفيًا (‏`b2-13-lq1` 28/28،
  `b2-13-lq3` 63/63، `b2-13-m1` 49/49) وهو مقبول: القرينة تُعرَّف بأطولَ **وحده**.
- البقاء حتى السقف ≤40% (≤500): **13 عنصرًا**. القائد الآن `b2-17` (11 من 13) و`b2-19` (11 من 13) فقط؛ بعدهما
  اثنا عشر درسًا بعشرة عناصر. `b2-17` وحده يعطي 502 (فوق السقف بعنصرين)، فيُغلق إما بـ`b2-19` (⇒ 491 = 39.3%)
  أو بتحرير عنصري `b1-16-e6` و`b1-22-e6` العربيّي المفتاح (⇒ 500 بالضبط) إن سُمح للأداة بمجموعات عربية نقية.
- العدادات المعجمية بعد إعادة التوليد: الأسماء ‏4,857 ⇒ **4,864** (سياقي 3,387 ⇒ **3,394**، مغطى 1,381 ومؤلف 1,470
  بلا حركة)، أطر الأفعال ‏1,249 ⇒ **1,250** (سياقي 1,111 ⇒ **1,112**). **pending-human لم تتحرك: 89 و4**، والمراسي
  1,297 و134. التدقيق اللغوي: 179 TSX / 6991 وسمًا / 399 ألمانيًا / 45 نطاقًا / 233 مختلطًا ساكنًا / 0 مشاكل.
  بصمة المحتوى `e585e350b85e…`، والكاش `dwnb-full-pack-v147` (staging/previous v146).
- `lesson:quality:audit` **خروجه 1** بثلاث ملاحظات: الطول 41.0% (سقف 40)، الإنتاجية أحادية السلسلة 50.9% (سقف 25)،
  وسيط الشرح 24 حرفًا (أدنى 60) ⇒ **P1-397 يبقى مفتوحًا**.
- عيوب بيئة سُجّلت: رجعت الشجرة (رابع مرة في أربعة أدوار) إلى 7 دروس موازة مع `deferred` غير فارغة وتثبيت معجمي
  قديم، فاستُعيدت كاملة من أرشيف v146 بعد `sha256sum -c` (OK) وتحقّق بالقياس: قرينة 524 و`PARALLELISED` = 12 درسًا
  و`totalCandidates: 4857`؛ و`node_modules` كان محذوفًا فـ`npm ci --no-audit --no-fund` (471 حزمة)،
  و`/home/user/.swapfile` كان مفقودًا فأُعيد (1,500 MB عبر `fallocate`/`mkswap` و`/usr/sbin/swapon`)؛ بهذا خرج
  البناء 0 من أول محاولة.
- البناء المقاس بعد الدفعة: **321 صفحة** (SSG في 9.5 ثانية) · بصمة `offline:size` **1292801942bc** مع
  `full 5,639,677` (a1 2,395,104 · a2 2,471,447 · b1 2,538,482 · b2 3,890,481) · 318 مسارًا offline
  (حُزَم 58/58/58/219/318) · `js:budget` 110 مقاطع / 1,723,087 gzip / أكبر ملف 250,641 · `media:budget`
  544 ملفًا / 52,943,843 بايتًا / المنهاج 942,420 gzip.
- المتصفح: لم يُعَد تشغيله على هذا البناء؛ آخر قياس مُسجَّل يبقى ما ثُبّت عند v143 (40 من 42 في مشروع chromium،
  والفاشلان مرّا منفردَين، وبند الترطيب 12.5 ثانية). مشروع الهاتف (Pixel 7) لم يُشغَّل، فلا يُدَّعى **82/82** باسم
  v147. السجل: `docs/run-logs/2026-09-20-cue-parallelism-b2-13/`.

## 49) جيل **v156.2** (تصحيحُ محتوى، بلا وسم) — اقتباساتٌ لا يراها المتعلّم

**ما وجدناه بالقياس لا بالقراءة.** بعد استعادةِ التراجع التاسع أُعيد بناءُ `expl_detail.ts` فطبع
البندَ **ومصدرَه** معًا؛ وعند أول بندَين ظهر أن شرحَ `a2-02-m1` ينتقد صيغةً «angerruft» **ليست بين
الخيارات** (الخيارُ «angeruft»). فحصُ الدفعة العاشرة كلها آليًّا ⇒ **ثلاثةُ** اقتباساتٍ مُختلَقة،
وفحصُ المستودع كلِّه ⇒ **ثلاثةٌ أخرى من صنعنا**: إعادةُ كتابة القرينة في v156 غيّرت المشتتات
وتركت الشروحَ تُسمّي المحذوف (`b1-12-e1` · `b1-20-e1` · `b2-13-e6`).

**لماذا هذا الصنفُ خطِر:** المتعلّم لا يستطيع كشفَه. الشرحُ فصيحٌ وواثق، والخطأُ في الصيغةِ التي
يُدرِّسها بعينها، فيحفظُ المتعلّمُ شكلًا لا وجودَ له في الألمانية أو يبحث عن مشتتٍ ليس أمامه.

**الحارس:** `npx tsx scripts/audit-explanation-quotes.ts [--level a2] [--all] [--json]` — يقيس
**691** اقتباسًا ألمانيًّا داخل **1,733** شرحًا، بدرجتَي خطورة:
- **ERROR** — اقتباسٌ في بندٍ ذي خيارات: إمّا قريبٌ من خيارٍ حقيقي بمقياس ثنائيات الحروف ≥ 0.85
  (صيغةٌ مُفسَدة)، أو متعددُ الكلمات في بندٍ **يسردُ خياراتِه** ولا يطابق أيَّها (مشتتٌ غيرُ معروض).
- **note** — مثالٌ تقابليٌّ مُختلَق بلا شبيهٍ قريب: تعليمٌ مشروع، لا يُبلَّغ إلا بـ`--all`.

**الإعفاءاتُ الثلاثة مقيسة لا مُخمَّنة**، وكلٌّ منها جاء من عيّنةٍ فُحصت يدويًّا: (1) البنودُ بلا
خيارات ثابتة (`fill-blank` · `error-correction` · `word-ordering`) — اختلاقُ الصيغةِ الخاطئة
للتحذير منها هو جنسُ التمرين نفسه («ich kümmere dich»)؛ (2) الشرحُ الذي **يبني جملةً حول** خيار
(«um besser zu sprechen» ⇒ «Ich übe jeden Tag, um besser zu sprechen») — يُكتشف بورودِ كلماتِ
الخيار مرتبةً داخل الاقتباس؛ (3) إعفاءٌ **واحدٌ مُسمّى بسببه** في جدول `REVIEWED` داخل السكربت
(`b1-22-e1`: صيغةُ dass صحيحةٌ متعمَّدة للتقابل). القاعدةُ: يُسجَّل السببُ ولا يُليَّن الحدُّ حتى
يختفي البلاغ. النتيجةُ الآن **0 ERROR · 49 note**.

**اختبارُ الحارس نفسه:** أُعيد حقنُ العيوب الثلاثة في الشجرة ⇒ أُمسكت ثلاثتُها (خروج 1) ⇒ أُعيدت
الشجرة. حارسٌ لم يُرَ فاشلًا مرةً ليس حارسًا.

**البناءُ بعد إصلاح انهيار الواجهة (v156.4):** خروج **0** · **321/321** صفحة · `offline:size` **`124cea854a94`** مع **a1 2,411,857 · a2 2,523,175 · b1 2,555,204 · b2 3,908,902 · full 5,693,147**. أُصلح عطلٌ كان يُسقِط كلَّ الصفحاتِ لكلِّ متعلِّمٍ أتمَّ ٨ دروسٍ فأكثر: ساعةٌ متغيِّرةٌ (`Date.now()`) مرَّت إلى `useSyncExternalStore` فولَّدت حلقةَ رسمٍ لا نهائيَّة (React #185). العلاجُ `useDeviceEpoch`. الوحدات **1,036/1,036** · e2e سطح المكتب **42/42**.

**البناءُ بعد إصلاح Vercel (v156.3):** خروج **0** · **321/321** صفحة · `offline:size` **`d5c62c730df6`** مع **a1 2,411,635 · a2 2,522,929 · b1 2,554,966 · b2 3,908,401 · full 5,692,300** · js ‏110/1,739,689/251,312 · media ‏544/52,943,843 والمنهاج 958,943 gzip. أُنجز الفحصُ في غرفةٍ نظيفةٍ على **مسارٍ مختلف** (`/var/tmp/cleanroom`) لا على شجرةِ التأليف، لأنَّ النجاحَ محلِّيًّا لا يُثبِتُ قابليَّةَ النشر: الإيداعُ `950dd58` سقط عند فحصِ الأنواعِ بستَّةِ استيراداتٍ بمسارٍ مُطلقٍ يخصُّ الصندوق. الحارسُ `imports:portable` صار أوَّلَ خطوةٍ في `prebuild` (630 ملفًا · 0 مسار)، و`docs/run-logs` خرج من `tsconfig.json` إلى `tsconfig.probes.json` فلم يعُد سجلٌّ مؤرشفٌ قادرًا على إسقاطِ البناء. الوحدات **1,033/1,033**.

**البناءُ بعد التصحيح:** خروج **0** — Compiled **30.2s** · **321/321** صفحة (SSG 10.4s) · `offline:size` **`7da00fe019e4`** — a1 2,411,734 · a2 2,523,037 · b1 2,555,064 · b2 3,908,700 · **full 5,692,793** · `js:budget` 110 / **1,739,689** / 251,312 · `media:budget` 544 / 52,943,843 / المنهاج **958,943**.

**القياسُ بعد التصحيح:** الشروحُ الستّة أطول (191–205 ⇒ 203–249)، فلا حركةَ في الجماعة المقيسة:
وسيط **27** · تحت-60 **991** · المسافة **366 ⇒ 16 دفعة** · القرينة **39.28%** · العدادات المعجمية
ثابتة. بصمةُ المحتوى ⇒ **`5ef5c1d16037…`** (كانت `6b5b28eb3104…`). البواباتُ خضراء:
`tsc` 0 · `lint` 0 · **156/156 · 1,027/1,027** · `handoff:check` 0.

## 48) جيل **v156.1** (محتوى فقط، بلا وسم) — الدفعة العاشرة من جماعة الوسيط: المسافة 390 ⇒ 366، وتراجعٌ جزئيٌّ ثامنٌ وُزِن بالقياس (2026-09-22)

- **ما نُفِّذ.** **24 بندًا** من جماعة الوسيط في A2 (miniTest ‏10 · إصغاء 9 · قراءة 5) اخترتها
  `pick_median.ts 24 a2` لأقصرِ شروحها (15–17 حرفًا)، ورُفعت إلى **186–212**: اقتباسٌ من النصّ
  أو التسجيل + القاعدة + سببُ فشلِ كلِّ مشتت + `فحص ذاتي: …؟`. الفاحصُ هو **فاحصُ الدفعة التاسعة
  مُستعمَلٌ حرفيًّا** (`exec` لرأس `a2e9.py` — العقدُ نفسه لا نسخةٌ منه): مدى 156–212، بلا صياغةٍ
  موضعية، بلا CJK، بلا تكرار، `oldLen` من المستودع، كلمةُ الحالةِ القديمةُ تبقى، والبندُ البالغُ
  60+ يُرفض. أربعُ جولات: **21⇒5⇒2⇒1** مخالفةَ مدى ⇒ `validator: 0 violations · 24 items`.
  التطبيقُ بالحمولة `a2-explanations-payloads/a2e10.json` (جولةٌ جافّةٌ ثم كتابة) ⇒ **24/24**،
  وطابَقةٌ بايتيةٌ **24/24** مع `src/data/lessons-a2-module*.ts`، والمجموع **392 ⇒ 4,835** (+4,443).
- **المقيس بعد الكتابة.** جماعةُ الوسيط تحت 60: 1,015 ⇒ **991 من 1,250** · المسافة إلى وسيت 60
  (السقف 625): 390 ⇒ **366 = 16 دفعة** (المرشَّح بعد الحادية عشرة **342** مقيسٌ بالمنتقي) ·
  `explanationMedianChars` ‏26 ⇒ **27** · `under40Chars` ‏947 ⇒ **923** · العريض `allUnder60Chars`
  1,154 ⇒ **1,130 من 1,733** · `allMedianChars` ‏32 ⇒ **33** · `allMissing` **0** · بالمستوى: A1 ‏311
  · A2 197 ⇒ **173** · B1 ‏264 · B2 ‏243. **بلا حركةٍ كما يُتوقَّع:** القرينة **39.28%** · مزيجُ
  المواقع 25.92/23.84/24.40/25.84 · الإنتاجية **50.9%** · الاستماع **93 كلمة/32 ثانية** · القراءة
  **22.7%** · **العداداتُ المعجمية كلها** (4,874/1,381/89/3,404 · 1,257/134/4/1,119 · مراسٍ
  1,297/134 · authoredTargets 1,470) — لأن `explanationAr` نصوصٌ عربيةٌ خارجُ سطح قياس الاسم (برهانٌ
  مقيسٌ قديم: `grep -c explanationAr src/core/content-validation/lexical-target-gap.ts` = **0**).
- **التراجعُ الجزئيُّ الثامن — والوزنُ بالقياس.** وسطَ الدور تراجعَ صندوقُ اللقطة **جزئيًّا**:
  `node_modules` صفرًا · ملفاتُ b1/b2 السبعة (استعادةُ القرينة) رجعَت (القرينة قفزت 39.28% ⇒
  48.16% في `lesson:quality`) · 5 ملفاتِ حرفيةٍ (4 اختبارٍ وحدة + `critical-flows.spec.ts`) رجعت
  جيلَ v155 (فأحمرّت 4 فحوصاتٍ كاش) · ومجلدُ سجلّ v156 مُمحى. **صمدت:** ملفاتُ a2 مع شروحات
  الدفعتين 9 و10، وحرفيةُ `sw.js` والـverifier على v156، والوثائقُ الخمس، والحمولاتُ في
  `a2-explanations-payloads/`. العلاجُ بلا إعادةِ بناءٍ يدوية: `npm ci` ⇒ إعادةُ 12 حمولةَ قرينة
  (نفس 113 بندًا/7 ملفات — قفلُ «المفتاح حرفيٌّ عند `correctIndex`» يجعلُ الإعادةَ آمنة) ⇒ 9
  مواضعِ حرفيةٍ في الملفات الخمسة (staging/previous v154→v155، active v155→v156) ⇒ إعادةُ كتابة
  سجلّ v156 ⇒ إعادةُ قياسٍ كاملة. **والدرسُ الممتدّ:** التراجعُ نصفِيٌّ لا يُرى بالنظر — فقط
  `lesson:quality` (القرينة) و`distance-to-close` (الوسيط) وكاش-الحرفياتُ يفضحونه؛ وقد كان ما
  يُفضحُه هو **البيانات وحرفياتُ الاختبارات**، لا الكود ولا الوثائق.
- **البوابات (خرج الفاحص).** `npx tsc --noEmit` **0** · `npm run lint` **0** · `npx vitest run
  tests/unit` **156/156 ملفًا و1,027/1,027 اختبارًا** · `npm run handoff:check` **0** (وثلاثةَ
  عشرَ وثيقةً على v156 — الكاشُ لم يتغيَّر) · `case:audit` **0 فجوات** عند `167645dd621b…` ·
  `content:audit` ‏**`6b5b28eb3104…`** (`6b5b28eb3104e706acc408917bb347cb1c4f5fb8290b37005339b9ed905684d2`)
  — تحرّكت لأن بصمتَها تشمل الشرح · `learning-architecture` **بلا حركة** `9b57e06047aa`.
- **البناءُ أُعيد** (المحتوى تغيَّر بعد بناء v156): خروج **0** — Compiled **34.8s** · **321/321**
  صفحة (SSG 9.8s) · بصمة `offline:size` **`c71d54038559`** مع **full 5,692,835** (a1 2,411,756 ·
  a2 2,523,069 · b1 2,555,109 · b2 3,908,619) · `js:budget` ‏110/**1,739,688**/251,309 ·
  `media:budget` ‏544/52,943,843/المنهاج **958,946**. **وملاحظةُ بيئةٍ مؤكَّدةٌ للمرة الثانية:**
  علّق «Running TypeScript» ثانيةً لأن **`/home/user/.swapfile` انمحى مع صندوق اللقطة** (الفحص:
  `free -m` ⇒ صفرُ مقايضة)؛ أُعيدت بأمرٍ واحد (`fallocate 2G` → `mkswap` → `swapon`) فمرَّ البناءُ
  كاملًا. **القاعدةُ الآن:** عند افتتاح أي جلسة على هذا الصندوق، `test -e /home/user/.swapfile &&
  sudo -n swapon --show` أولُ أمرَين، قبلَ أي بناء.
- **ما لم يُفعَل.** لا ZIP ولا `sha256sum -c`: `archive:delivery` ما يزال يرفض بلا
  `src/data/{exercises,curriculum,micro-drills}` (79 ملفًا مقابل 900/30/10؛ v155 حمل 1,202) —
  انظر §47. لا متصفحَ بعد v143 · لا Vercel · المراجعةُ البشرية **0/3,277** · P1-397 ما يزال fail
  على البوابة المشتركة (50.9% و27) لا على القرينة. **الوسمُ ما يزال v156** (محتوى فقط): لا
  `bump-pack-generation.py` في هذا الجيل — الكاشُ يتغيَّر فقط مع حزمةٍ تُسلَّم.

---

## 47) جيل **v156** — استعادةُ دفعات القرينة، وإخضرارُ الحُرّاس، ووسمٌ وبناءٌ نظيف، وحزمةٌ مرفوضةٌ بعَمد (2026-09-22)

- **ما نُفِّذ.** استُعيدت **دفعاتُ خفضِ القرينة/موازاة المشتتات** من الحمولات المسلَّمة في المستودع: 12 ملف
  `*-batch.json` من `docs/run-logs/2026-09-20-cue-parallelism-*/` طُبِّقت بـ`scripts/parallelise-options.py`
  (**12 تشغيلًا `--dry-run` بلا مشكلة**، ثم 12 بـ`--write`) ⇒ **113 بندًا في 7 ملفات**؛ والحمولات الأقدم
  (2026-09-19، 41 بندًا) قِيست فوُجِد 39 منها مطابقةً و2 تحمل التصحيحَ اللاحق في الشجرة ⇒ لم تُمَسّ. لا حارسَ لُيِّن
  ولا عدادًا رُجِّع ليُطابِق: **البيانات هي التي جِيئت بها إلى حالة الحُرّاس**.
- **المقيس بعد الاستعادة.** القرينة ‏**48.16% ⇒ 39.28%** (تحت سقف 40% بفارق 0.72 نقطة) · العدادات المعجمية
  ‏**4,874 / 1,381 مغطى / 89 pending-human / 3,404 سياقًا** (من 4,802/1,380/89/3,333) · أطرُ الأفعال
  ‏**1,257/134/4/1,119** (من 1,233/134/4/1,095) · authoredTargets ‏1,469 ⇒ **1,470** · مراسٍ **1,297/134** بلا حركة ·
  **طابور المراجعة البشرية لم ينمُ: 89 و4**. بلا حركةٍ متوقَّعة: وسيطُ شرح الجماعة **26** · `allUnder60Chars`
  **1,154** من 1,733 · `under40Chars` ‏**947** · `allMedianChars` ‏**32** · الإنتاجية **50.9%** · شروحُ تمارين A2
  ‏**24** وA1 ‏**167** — فالاستعادةُ مشتتاتٌ لا شروح.
- **البوابات كلها خُضْر (خرج الفاحص):** `npx tsc --noEmit` **0** · `npm run lint` **0** ·
  `npx vitest run tests/unit` **156/156 ملفًا و1,027/1,027 اختبارًا** (كان 153/156 و1,017) · `npm run handoff:check`
  **0** (كان «noun target-gap counters drifted») · `case:audit` **0 فجوات** عند `167645dd621b…` وبالعدادات
  19/23/57/44 · `governance:audit` ‏3,277 سجلًا · `exam:format-claims` ‏`d729860a7334` و`exam:formats`
  ‏`1e61862c8a97` بلا حركة · `content:audit` يَتَحقَّق عند **`12a2542b93b3…`** (تحرّكت؛ الاستعادةُ نصوصٌ في
  `src/data`) و`learning-architecture` بقي **`9b57e06047aa`** لأن بصمته تبني على الهيكل لا على نصوص التمارين.
- **الوسمُ صار أداة.** `scripts/bump-pack-generation.py`: ‏`--from v155 --to v156 [--write]` يطبع جدولَ المواضع
  ويرفض إن بقيت حرفيةٌ قديمة أو وُجد مزدوجٌ متوقع؛ نفّذ **15 موضعًا في 7 ملفات** (`public/sw.js`:
  `v156` + `staging-v155` + `previous-v155`؛ `offline-pack-controls` · `offline-recovery-partial-export` ·
  `today-offline-readiness` · `offline-curriculum-rollback` · `tests/e2e/critical-flows.spec.ts` (3 مواضع) ·
  `scripts/verify-continuation-handoff.mjs`)، ثم وُزِنَت ثلاثَ عشرةَ وثيقةً على `Sync batch: v156` لأن المُتحقِّق يشتقّ
  الجيلَ من اسم الكاش ويُطالِب الوثائق به (ADR-079) — وبخطوةٍ منسيةٍ يسقط كلُّ شيء: `Offline cache: dwnb-full-pack-v156`
  في البرومبت شرطٌ حرفيٌّ في الفاحص.
- **البناءُ الكامل نجح، ولأول مرةٍ بلا شقّ.** `npm run build` (prebuild بـ17 تدقيقًا ⇒ `next build --webpack` ⇒
  postbuild بثلاثة تدقيقات حجم) خروج **0**: Compiled **29.3s** · **321/321** صفحة (SSG 13.8s) · بصمة `offline:size`
  **`7db270c8e04d`** مع **full 5,685,849** (a1 2,409,534 · a2 2,516,435 · b1 2,552,906 · b2 3,906,251) ·
  `js:budget` ‏110 / **1,737,576** / **251,309** · `media:budget` ‏544 / 52,943,843 / المنهاج **956,936** ·
  318 مسارًا و5 حُزَم (58/58/58/219/318). **الحيلةُ التي أنجزته:** كانت مرحلة «Running TypeScript» تعلق على
  ~20 ميغابايت متاحة و**صفر مقايضة**؛ أُنشئت `/home/user/.swapfile` بحجم 2 جيگابايت (`sudo` متاح بلا كلمة سر على هذا
  الصندوق) — وهي نفسها النصيحةُ المسجَّلة في `DECISIONS.md` بعد إخفاق v15x — فمرّت المرحلةُ دفعةً واحدة. لا تُصدِّق
  «فشل أنواع»: قِسِ الذاكرة أولًا.
- **ما لم يُفعَل ولماذا (بحرْفِيّة الفاحص):** `npm run archive:delivery` **رفض**:
  `delivery archive refused: data directory missing from the tree: src/data/exercises`، لأن حارسَ البنية يطلب
  `src/data/{exercises,curriculum,micro-drills}` **مؤلَّفةً وغيرَ فارغة** (حدّ ‏900/30/10 ملفًا؛ جيلُ v155 حمل 1,202
  ملفًا في `src/data`)، و`npm run data:recover probe` يقيس هنا **79 ملفًا** والثلاثةَ مفقودةٌ «**tree is
  INCOMPLETE**»، ولا نسخةً كاملةً على هذا الصندوق (لا مرآةَ ولا ZIP)، و`data:recover backup` **يرفض** تصويرَ شجرةٍ
  ناقصة لئلّا يُسجَّل الفقدُ ظهرًا كاملًا. ⇒ **لا ZIP ولا `sha256sum -c` ولا ادّعاءَ تسليمٍ في هذا الدور**؛ الخطوة
  عند المالك: `data:recover restore --from <wegberlin-data.zip> --apply` ثم `content:audit:write` و`archive:delivery`
  و`sha256sum -c` **عند التغليف**. كذلك: لا متصفح (آخر أخضر v143: 40 من 42) · لا Vercel مُتحقَّق منه · المراجعة
  البشرية **0/3,277** · P1-397 لم يُغلَق (البوابة المشتركة ما تزال fail عند 50.9% و26).

---

## 46) جيل v155.1 (محتوى فقط) — الدفعة التاسعة من جماعة الوسيط: المسافة 414 ⇒ 390، والحُرّاسُ يفضحون شجرةً أقدم (2026-09-21)

- **ما نُفِّذ.** 24 بندًا من جماعة الوسيط في A2 عند **14–15 حرفًا** (17 × `miniTest` + 7 × أسئلة قراءة/إصغاء)
  رُفعت إلى **165–204** بـ`a2e9.py` (المدى 156–212، منع الألفاظ الموضعية، منع CJK، منع التكرار، رفضُ ما ≥60،
  و`oldLen` مقروءٌ من المستودع). تمريران: **22** نصًّا خارج المدى ثم `a2-05-m3` عند 152 ⇒ `0 violations`.
  التطبيق `24 of 24 missing: []`، ثم **طُبِّقت الحمولات على الشجرة نفسها وقِيست**: 24/24 طولٌ مطابق، والمجموع
  **345 ⇒ 4,487 حرفًا**. السجلّ كاملٌ في `docs/run-logs/2026-09-21-a2-explanations-9/README.md`.
- **المقيس بعد الكتابة.** الجماعة تحت 60 ‏1,039 ⇒ **1,015** من 1,250 والسقف 625 ⇒ **المسافة 414 ⇒ 390 = 17 دفعة**،
  والمرشَّح بعدها **366** (مقيسٌ بالمنتقي لا محسوبًا) · القائمة الأوسع `allUnder60Chars` ‏1,178 ⇒ **1,154** من
  1,733 · `under40Chars` ‏971 ⇒ **947** · `allMedianChars` ‏31 ⇒ **32** · `explanationMedianChars` ‏**26** بلا حركة
  (ذيلُ التوزيع) · التوزيع بالنمط (مقيس): A2 ‏216/432 = تمارين **24** · `miniTest` **76** · `rq` **64** · `lq` **52**،
  وA1 ‏431/432 (تمارين **167**)، B1 ‏264/432، B2 ‏243/437 ⇒ المجموع يطابق القائمة الأوسع ✓.
- **لم يتحرّك عمدًا، وبقي مقاسًا:** القرينة **48.16%** · الخلط 25.92/23.84/24.40/25.84 · الإنتاجية **50.9%** ·
  تذكّر 89/4 · مراسٍ 1,297/134 · مراجعة بشرية **0/3,277** · شروحُ **تمارين** A2 **24** (لا 9: لا `_e` في الدفعة).
  تحرّكت بصمتان فقط: `content:audit` ‏`eca2409c0489…` ⇒ **`27d4c28626e1…`** و`learning-architecture`
  ‏`e765f8e14d80` ⇒ **`9b57e06047aa`**؛ وبقيت `case:audit` ‏`167645dd621b…` بصفر فجوات و19/23/57/44.
- **ما كشفه هذا الدور (يُقرَأ قبل أي «إصلاح» للحُرّاس).** شجرةُ `src/data` المستعادة **أقدم** من جيل الاختبارات
  والمُتحقِّق: التدقيق يقيس 4,802/1,380/3,333 بينما يُثبَّت 4,874/1,381/3,404 ⇒ `handoff:check` عند «noun
  target-gap counters drifted» + اختباران أحمرا؛ و`mcq-option-parallelism` **8 فحوصاتٍ** حمراء على
  `b1-07:e1 · b1-12:e1 · b1-20:e1 · b2-05:e1 · b2-11:e1 · b2-13:e1 · b2-17:e7 · b2-19:e7`؛ والقرينة **48.16%** بدل
  39.28% الموثَّقة. **البرهان أنه ليس من الشروح:** `explanationAr` لا يُقرأ في `lexical-target-gap.ts`
  (`grep -c` = 0) وبقي pending-human 89/4. ⇒ ما ضاع بالتراجع ليس 145 شرحًا فقط بل **سلسلةُ دفعات القرينة/الموازاة
  كلها**، وهي **مُحمَّلةٌ في المستودع**: 28 ملف JSON تحت `docs/run-logs/*cue-parallelism*/` (12 منها `*-batch.json`)
  تغطي كلَّ درسٍ مذكور في الفحوصات الحمراء. **العمل القادم الأول = استعادتها**، ثم `content:audit:write` +
  `learning:architecture:audit:write`، ثم إعادةُ تثبيت الوثائق للعدادات، وبعدها فقط وسمٌ جديد.
- **البطلان المُصحَّح.** لا «شجرة JSON مفقودة تُعطي البناءَ حجةً»: `vendor:materialize` و`runtime:materialize` و
  `offline:manifest` تنجح جميعًا وتولّد **318 مسارًا و5 حُزَم (58/58/58/219/318)**، والتدقيقان اللان كانا يرميان
  استثناءً كانا يشكو **قدامة الآثار المخزَّنة** (`artifacts are not current` / `stale`) لا انعدام البيانات —
  ويُصلَح بـ`:write`. القاعدة المُصحَّحة: **افحص رسالة الفاحص قبل أن تُسجّل عذرًا للبناء**.
- **البوابات.** `tsc --noEmit` **0** · `vitest run tests/unit` **1,017 من 1,027** في **153 من 156** ملفًا ·
  `case:audit` و`governance:audit` و`exam:format-claims:audit` خُضْر · `handoff:check` **أحمر** عند باب العدّادات
  أعلاه (لا يُليَّن) · **لا بناءَ ولا كاشَ ولا حزمة** في هذا الجيل: الرفع إلى `v156` من بياناتٍ أنقصَ من المنشور
  كان publishًا راجعًا، فالحزم مؤجَّل حتى استعادة دفعات القرينة.
- **إصلاحٌ صغير أُجري (وليس تجميلًا):** ثلاثةُ ملفات اختبار كانت تثبّت `staging/previous-v150` بينما `public/sw.js`
  على `v154` ⇒ وُظِّفت الحرفية على `v154` في `offline-curriculum-rollback` و`offline-recovery-partial-export` و
  `today-offline-readiness` ⇒ 13 فحوصًا أحمر صار **10**، والفحوصُ الثلاثة **13/13 خضراء**.
- **ديمومة الأداة.** `scripts/apply-explanation-batch.py` صار في المستودع (dry-run/رفضُ مستوى مجهول/عدّ الكتابة،
  مقيَّسًا ثلاثيًا) وحمولاتُ الدفعات العشر في `docs/run-logs/a2-explanations-payloads/` مع `README.md` للأمر
  بالترتيب — فالتعافي بعد أي تراجعٍ لم يعد يعتمد على `/home/user/tmp` ولا على `scratch/`.
- **ما لم يُتحقَّق منه:** النشر على Vercel · المتصفح منذ v143 (40 من 42) · Mراجعة البشرية 0/3,277 · P1-397 لم
  يُغلق (البوابة fail عند 48.16%) · `lesson:quality:audit` يخرج 1 بالقياس (وسيط 26 مقابل 60) وهو **غرضُ** الطابور
  لا عطلٌ يُصلَح بتخفيف الحدّ.

---
## 45) جيل v155 — الدفعة الثامنة من جماعة الوسيط: وسيطُ الجماعة يتحرّك ثانية (25 ⇒ 26) والمسافة 438 ⇒ 414 (2026-09-21)

- **ما نُفِّذ.** 24 بندًا من جماعة الوسيط أقصرُها **11 حرفًا** (miniTest + أسئلة قراءة/إصغاء في A2) رُفعت شرحُها إلى **180–212 حرفًا** بـ`tmp/a2e8.py` (يقرأ النصّ القديم من المستودع، يرفض تجاوز المدى 156–212، ويرفض العبارات الموضعية، ويطهّر soft-hyphen، ويرفض أيّ بندٍ بلغ 60 أصلًا). رُفضت مسوّدتان قبل الكتابة (227 و214 و213) وعبارة «الرسالة الأولى» و«التصريف الثالث» لأنها تعدّ ضمن الإيحاء الموضعي؛ صيغت من جديد فخرج الفاحص بـ**0 مخالفات**.
- **المقيس بعد الكتابة** (`lesson:quality` + `distance-to-close.ts`): `allUnder60Chars` ‏1,202 ⇒ **1,178** · `under40Chars` ‏995 ⇒ **971** · `explanationMedianChars` ‏25 ⇒ **26** · `allMedianChars` بقي **31** · جماعة الوسيط تحت الستين 1,063 ⇒ **1,039** · **المسافة 438 ⇒ 414 (= 18 دفعة)**. لكل مستوى (تحت 60 في الجماعة): A1 ‏311 · A2 ‏**221** (كان 245) · B1 ‏264 · B2 ‏243 · الثوابت: القرينة **39.28%** (491/1,250) · الخلط 25.92/23.84/24.40/25.84 · الإنتاجية **50.9%** · `allMissing: 0` · شروح تمارين A2 تحت 60 **24** وA1 **167** (24 + 167 + 987 = 1,178 ✓).
- **لم يتحرّك عمدًا، وبقي مقاسًا:** تذكّر 89/4 · مراسٍ 1,297/134 · مراجعة بشرية **0/3,277** · لا مفردات تمريضية في طابور المراجعة أو النجوم · مشاهد الرعاية مؤجَّلة لا مبسَّطة · لا قاعدة نحوية جديدة للطباعة · لا إجابة تعتمد على معرفة سريرية (بندُ الصيدلية أُعيد إلى «النصّ يقول» مع تنبيه أنّه تمرينٌ على عبوةٍ وهمية).
- **البوابات (خرج الفاحص، لا الذاكرة):** بناءٌ نظيف **321/321** صفحة (Compiled 9.1s، SSG 9.6s) وبصمة `offline:size` **`6ac5765f908a`** مع **full 5,680,268** (a1 2,407,735 · a2 2,510,616 · b1 2,551,110 · b2 3,904,609) · `js:budget` ‏110 / 1,735,740 / 251,309 · `media:budget` ‏544 / 52,943,843 والمنهاج **955,133** gzip · `tsc` ‏0 · `lint` ‏0 · `vitest` **156 ملفًا / 1,023 اختبارًا** · `case:audit` ‏0 فجوات عند 167645dd621b · `content:audit` ‏**eca2409c0489** · `learning-architecture` ‏**e765f8e14d80** · `handoff:check` ‏0 · `lesson:quality:audit` خروج **1** بملاحظتين (50.9% و26). الكاش `dwnb-full-pack-v155` (staging/previous ‏v154) في سبعة ملفات. والحزمةُ مسطّحةٌ بأداة المستودع: ‏**1,756 ملفًا + 161 مدخل مجلد = 1,917 مدخلًا**، 134 مدخلًا تحت `src/app/` في جذر الـZIP، وصفرٌ تحت `der-weg-nach-berlin/`، مع `wegberlin-full.zip.sha256` يُولَّد ويُتحقَّق منه آليًا.
- **حادثةُ بناءٍ جديدة (مفيدة).** `npm run build` الكامل (prebuild بـ17 تدقيقًا + webpack + فحص أنواع) **فشل** عند «Running TypeScript» بعد 20 دقيقة رغم تدفئة `.tsbuildinfo`، بينما `tsc --noEmit` منفردًا أعطى صفرًا في 8 ثوانٍ: الضغطُ من سلسلة prebuild لا من الأنواع. الحلّ المقيس: تركُ التدقيقات تُنفَّذ مرّةً واحدة (عبر `writes.sh`/`prebuild`) ثم `NODE_OPTIONS=--max-old-space-size=1200 ./node_modules/.bin/next build --webpack` (خروج 0) ثم `offline:size` و`js:budget` و`media:budget` يدويًا — لا يُستخدم `typescript.ignoreBuildErrors` ولا `--no-lint`.
- **الرجوع السابع (سابع مرة في الجلسة).** عند الافتتاح: `node_modules` و`.next` صفر، `src/data` رجع إلى 1,322/48.16%، **أرشيفُ التسليم على القرص صار البايتاتِ الملفوفة القديمة** (‏63,786,813) تحت sidecar ‏v154 ⇒ `sha256sum -c` فشل، وسجلّ ‏`2026-09-21-a2-explanations-7` مُفرَّغ، و**`tests/unit/delivery-layout.test.ts` حُذف** بينما نجت `scripts/build-delivery-archive.mjs` و`package.json` وسكربت Termux المعدَّل. الاستعادة بالتسلسل الموثَّق: `npm ci` ← `git clone --depth 1` من `main` (ما تزال عند `368d6e8` الملفوف، فلم تُدفَع بعد نسخةُ v154c) ← `cp -a …/src/data/.` ⇒ 1,274 ← إعادة `a2e5` (24/24) و`a2e5-fix1` (1/1) و`a2e6` (24/24) و`a2e7` (24/24) ⇒ **1,202** تمامًا كما سُلِّم، ثم أُعيد كتابةُ اختبار البنية (4 فحوص) ومرَّرَ الفاحصان.
- **ما لم يُتحقَّق منه:** النشر على Vercel لهذا الجذر المسطّح (لم تُدفَع بعد) · المتصفح منذ v143 (40 من 42) فلا 82/82 · بصمةُ الجذر في لوحة Vercel (Root Directory يجب أن يكون `.`).

## 44) جيل v154 — أول دفعة تُختار من «جماعة الوسيط»: الوسيط تحرّك فعلًا (30 ⇒ 31) والمسافة 462 ⇒ 438

- **الدفعة.** 24 بندًا من **جماعة الوسيط نفسها** (أسئلة إصغاء وبنود اختيارٍ قصيرة في A2 كانت شروحُها **6–11 حرفًا** فقط: «مساءً.» و«-er + als.» و«um … zu.») رُفعت إلى **176–211 حرفًا**: ‏a2-04-lq3 · a2-07-lq2 · a2-22-lq2 · a2-24-m1 · a2-10-lq1 · a2-11-lq1 · a2-19-m3 · a2-07-lq3 · a2-10-m2 · a2-22-m3 · a2-10-m1 · a2-13-m3 · a2-16-m2 · a2-19-lq2 · a2-21-lq1 · a2-23-m2 · a2-01-lq2 · a2-02-lq2 · a2-03-m4 · a2-07-m2 · a2-09-m5 · a2-11-m2 · a2-14-lq2 · a2-14-m1. طُبّقت بـ`scratch/set_expl.py a2 tmp/a2e7.json`: **applied: 24 of 24 · missing: []**.
- **الدليل على أن تصحيحَ الطريقة كان لازمًا.** المقيس بعد التوليد: `feedback.allUnder60Chars` ‏1,226 ⇒ **1,202** · `under40Chars` ‏1,019 ⇒ **995** · **`allMedianChars` ‏30 ⇒ 31** (أول حركة منذ بدء الدَّفعات) · و**المسافة إلى الوسيط 60: ‏462 ⇒ 438** (= 19 دفعة من 24) — بينما دفعة v153، المختارة من قائمة التدقيق الأوسع، حرّكت المسافة **2 فقط**. الشرح: جماعة الوسيط = `multiple-choice` + أسئلة القراءة + أسئلة الاستماع + `miniTest`؛ وقد خرج من هذه الجماعة **24 من 24** بندًا هذه المرة، لا 2 من 24.
- **لمسةٌ لم تتحرّك عمدًا:** القرينة **39.28%** (491 من 1,250) والموازنة 25.92/23.84/24.40/25.84 والإنتاجية **50.9%** و`explanationMedianChars` ‏25 وشروحُ تمارين A2 تحت 60 (‏**24** بلا حركة، لأن الدفعة من أسئلة الاستماع/الاختيار لا من تمارين `-e`) — فالدفعُ في جماعة الوسيط لا يلمس أطوالَ الخيارات ولا البدائل. الأرقامُ الثابتة أيضًا بلا حركة: 89 و4 للاسترجاع، 1,297 و134 للمراسي، 3,277 للمحتوى بمراجعة بشرية **0**.
- **الحُرّاس.** ‏`case:audit` بصفر فجوات عند `167645dd621b…` (الباني يرفض أيّ حذفٍ لإشارة إعرابية قائمة)؛ فاحصُ `tmp/a2e7.py` رفض في التمرير الأول **18 نصًّا فوق 212** و**إيهامَيْن موضعيَيْن** («الجملة الثانية»، «المركز الثاني») قبل أن تُكتب أيّ كلمة؛ ومفاتيحُ البيانات غير منقّطة فكلّ مطابقةٍ تستعمل `explanationAr"?\s*:\s*"`. البصمتان المتحرّكتان بعد التوليد: content:audit ‏966abfa90440 ⇒ **67196e878068** و learning-architecture ‏4d25c5fe7435 ⇒ **afdcd449e412**؛ والبقية ثابتة (similarity `efdb019376f3` · language `9da1a2e19f1e` · tunisian `769c3276791f` · lexical `439956b453f0` · study `1645b5caa1b0` · practical `c935b0f4ef8b` · security `eda49e1d4ad1` · exam claims `d729860a7334` · formats `1e61862c8a97`).
- **بيئةُ الدور: رجوعُ الشجرة الخامس.** عند الفتح: `sha256sum -c` **فشل** (الأرشيف على القرص بايتاتٌ أقدم تحت sidecar ‏v153)، `node_modules` = 0، `.next` = 0، `src/data` رجع إلى حالة v149 (المقيس الطازج **1,322** وقرينة **48.16%**)، وسجلّ ‏`2026-09-20-a2-explanations-6` رجع **فارغًا (0 ملفات)** بينما نجت الوثائق (v153) و`public/sw.js`. الاستعادة هذه المرة **من `main` على GitHub** — المصدر الجديد الموثَّق في ADR-082: ‏`git clone --depth 1 https://github.com/naderba69/wegberlin.git` ثم `cp -a …/src/data/. src/data/` ⇒ ‏**1,274** (حالة v151 كما هي على `main` عند `5104c2a`)، ثم أُعيدت الدفعات #5 (24/24) و#5-fix1 (1/1) و#6 (24/24) فرجع القياس **1,226 / 1,019 / 39.28% / TOTAL 24** تمامًا كما سُلِّم. ولمنع القراءة من تقريرٍ نجا أُعيد توليدُ التقارير كلها بـ`writes.sh` قبل أي استنتاج.
- **الحالة المُسلَّمة.** البناء: **321 صفحة** وبصمة `offline:size` **139eda666ff4** مع **full 5,674,113** (a1 2,405,792 · a2 2,504,249 · b1 2,549,133 · b2 3,902,771) · 318/318 · `js:budget` ‏110 / 1,733,723 / 251,309 · `media:budget` ‏544 / 52,943,843 / المنهاج 953,058 gzip. الكاش `dwnb-full-pack-v155` (staging/previous ‏v154) في **سبعة ملفات**، ومسحُ ‏15 ملفًا وثائقيًا من v153 إلى v154 مع إعادة تسمية الوثيقة الاحتياطية إلى `docs/BACKUP-RESUME-PROMPT-2026-09-21-v155-AR.md`. البوابات: `tsc` ‏0 · `lint` ‏0 · `vitest` **156 ملفًا / 1,023 اختبارًا** · `handoff:check` ‏0 · `lesson:quality:audit` خروج **1** بملاحظتين (50.9% وسيط 25) تُترَك مغلَّفة بلا تطبيع. الحزمة: **1,743 ملفًا + 160 مدخل مجلد = 1,903 مدخلًا**، ‏134 مدخلًا تحت `src/app/` في جذر الـZIP (قيس بـ`unzip -Z1` بعد البناء)، والرفعُ كما قرّره ADR-082 (سكربت المستودع، دفعٌ بلا `--force`، بلا مجلد ظرف).
- **إصلاحُ بنيةِ التسليم بعد تعثّرِ نشر Vercel (مقياسٌ، لا تفسيرٌ).** دُفع `main` من أرشيفٍ **ملفوف**، فصَار جذرُ المستودع حاويةً واحدة: `git ls-files | awk -F/ '{print $1}' | sort -u` أعاد `der-weg-nach-berlin` وحده (‏1,711 ملفًا، منها 66 تحت `src/app` **داخل** المجلد)، ورفضَ Vercel البناءَ بـ«Couldn't find any `pages` or `app` directory. Please create one under the project root» عند `368d6e8» (‏09:23، ‏Next.js 16.3.3 ‏Turbopack، مستعادةً كاشَ بناءٍ سابقًا). وعند الفتح كانت ‏`sha256sum -c` على الأرشيف **فاشلةً**: القرصُ حمل البايتاتِ القديمةَ (‏63,786,813) تحت sidecar ‏v154. فبدلَ أن يبقى الانضباطُ نصًّا وُضِعَ أداةً: (1) `scripts/build-delivery-archive.mjs` مع `npm run archive:delivery` يبني من جذر المشروع و**يرفض** أيّ عضوٍ تحت مجلد ظرفٍ أو بلا `package.json`/`src/app/page.tsx`/`src/app/layout.tsx`/`public/sw.js`/`vercel.json` في الجذر، ويكتب `wegberlin-full.zip.sha256` ويعيد التحقّقَ منه ومن `unzip -t`؛ (2) `TERMUX_REPLACE_REPO.sh` يفحصُ البنيةَ **قبل** أيّ commit ويرفض جذرًا فيه `der-weg-nach-berlin/`، ويطبع عددَ الملفات المتتبَّعة في الجذر ويذكّر بأنّ Root Directory في Vercel هو جذرُ المستودع؛ (3) `tests/unit/delivery-layout.test.ts` (**4 اختبارات**) يُثبِت ذلك كلّه، ومنه «لا نمطَ في `.gitignore` يبتلع `src` أو `app`» و«إن أُضيف `vercel-build` يومًا فيجب أن يكون `npm run build`» — وإلّا قفزَ نشرُ الإنتاج فوق تدقيقات `prebuild` السبعةَ عشرَ. وبناؤُنا الجديد قِيس بعد `rm -rf .next` ففشل صامتًا عند «Running TypeScript» حتى أُعيدَت تدفئةُ `.tsbuildinfo`؛ لا يُحذَف `.next` قبل البناء على هذا الصندوق بلا تدفئة.
- **ما لم يُفعَل.** لا متصفح (آخر أخضر v143: 40 من 42) · لا طبقة توابل (ADR-080 ينتظر «ابنِ التوابل») · P1-398 قرارُ تعريف مفتوح · لا تغيير في سقفٍ أو مُطبِّع أو أطوال خيارات.

---

## 43) جيل v153 — دفعة الشروح السادسة، وتصحيح طريقة الاختيار إلى جماعة الوسيط، ورجوع الشجرة الثالث

- ما أُنجز: **24 شرحًا** في تمارين A2 (‏32–35 حرفًا ⇒ **174–212**) لمواضيع ثابتة (ضمائر Dativ/Akkusativ، ‏`dass`، `obwohl`/`weil`/`wenn`، `können/müssen/dürfen/sollen`، عبارات الهاتف، عقد المهنة، `Buchungsbestätigung`، ملاءمة اللباس، `arbeiten/gehen/fahren`). ‏`allUnder60Chars` **1,250 ⇒ 1,226** و`under40Chars` ‏1,021 ⇒ **1,019**، وشروحُ تمارين A2 تحت 60 **48 ⇒ 24** (وA1 يبقى 167؛ ‏24 + 167 + 1,035 = 1,226 ✓).
- **تصحيح طريقة (مقيس، لا رأي).** وسيطُ التدقيق يحسب على جماعة `multiple-choice` + أسئلة القراءة + أسئلة الاستماع + `miniTest` (‏1,250 بندًا)، وقائمةُ `allUnder60Chars` أوسع (1,733 بندًا تشمل بقية أنواع التمارين)؛ فدفعةٌ جُمِعت من الأوسع رفعت 24 نصًّا ودخلت الجماعة بـ**2** فقط ⇒ المسافة إلى 60: **464 ⇒ 462**. أُضيفت `/home/user/tmp/pick_median.ts` (مؤرشفة مع سجلّ هذا الجيل) ترتّب الجماعة نفسها: أقصرُ بنودها شروحُ أسئلة إصغاء بـ**6–10 أحرف**، ورفعُ 24 منها **462 ⇒ 438** فعلًا.
- **باني الدفعة صار يقرأ من المستودع.** ‏`/home/user/tmp/a2e6.py` يجلب النصّ الحيّ لكل معرّف (فلا `oldLen` مكتوبًا باليد ولا `field:` مضلِّل)، ويطبّق `set_expl.py` على نسخة في /tmp ويقيس الفرقَ قبل الإقرار، ويرفض نصًّا **يحذف إشارة إعرابية** قائمة في القديم (‏`CASE(old) ⊆ CASE(new)`) أو يستعمل ألفاظَ موضع. كشف التمريرُ الأول 10 نصوص خارج نطاق 212 و**إيهامًا موضعيًا** واحدًا («هل هو الأخير؟» و`الأخير` خيارٌ حرفي في السؤال)؛ صُحِّحا قبل الكتابة، فبقي `case:audit` عند `167645dd621b…` بصفر فجوات ولم تتحرك بصمةُ حارسٍ أخرى.
- **قياسات بعد الكتابة.** ‏`allMissing: 0` · القرينة **39.28%** (491 من 1,250) · الموازنة 25.92/23.84/24.40/25.84 (‏A324/B298/C305/D323) · الإنتاجية **50.9%** · 26 بند مراجعة موضوعي · وسطي الإصغاء 93 كلمة (~32 ثانية). **لم تَرتفِع الأرقام الثابتة:** ‏89 و4 للاسترجاع، و1,297 و134 للمراسي، و3,277 للمحتوى بمراجعة بشرية **0**.
- **بيئة العمل: رجوع الشجرة الثالث في أربعة أدوار.** ‏`/home/user/wegberlin-full.zip` وُجِد ببايتات **v151** (63,786,813) تحت sidecar يحمل `f0f7864e…` ⇒ `sha256sum -c` هو الكاشِف؛ `node_modules` = 0 فـ`npm ci --no-audit` (خروج 0)؛ `src/data` رجع إلى حالة v149 (‏1,322 وقرينة 48.16%)؛ و`tests/*` والـverifier إلى v151/v150 بينما بقِي `sw.js` والوثيقةُ الاحتياطية على v152؛ ومجلّد `docs/run-logs/2026-09-20-a2-explanations-5/` رجع **فارغًا (0 ملفات)**. ⇒ **الرجوع جزئيّ دائمًا**، والفحص الرباعي إلزامي عند فتح أي جيل: `sha256sum -c`، وعدُّ ملفات سجلّ الجيل، و`npm run lesson:quality` طازجًا مع مقارنةِ مخرجه بالتثبيت، وتفقّد حرف الكاش في **الملفات السبعة** (قد تختلف عن `sw.js`). استُعيدت 15 ملف بيانات من الأرشيف (فارق 0 أسطر) ثم أُعيدت الدفعتان #5 و#6 على الترتيب.
- **درس مضاف لقواعد البناء.** ‏`reports/*.json` **لا يصلح دليلاً على حالة المستودع**: نجا من الرجوع بينما رجعت `src/data`، فأرقامه «خضراء قديمة»؛ الدليلُ الوحيد قياسٌ طازج من الأداة نفسها.
- **الحالة المُسلَّمة.** البناء: **321 صفحة** وبصمة `offline:size` **716ff4090bec** مع **full 5,667,256** (a1 2,403,549 · a2 2,496,896 · b1 2,546,902 · b2 3,900,865) · 318/318 · `js:budget` ‏110 / 1,731,367 / 251,309 · `media:budget` ‏544 / 52,943,843 والمنهاج 950,700 gzip. الكاش `dwnb-full-pack-v155` (staging/previous ‏v152) في سبعة ملفات، ومسحُ ‏15 ملفًا وثائقيًا من v152 إلى v153 مع إعادة تسمية الوثيقة الاحتياطية. البوابات: `tsc` ‏0 · `lint` ‏0 (صُحِّح `any` في مقاربة مؤرشفة رجع معها الرجوع) · `vitest` **155 ملفًا / 1,019 اختبارًا** · `case:audit` ‏0 فجوات · `handoff:check` ‏0 · `lesson:quality:audit` خروج **1** بملاحظتين (50.9% وسيط 25) تُترَك مغلَّفة كما هي بلا تطبيع.
- **ما لم يُفعَل.** لم يُشغَّل متصفح على هذا البناء؛ آخر مرجعي أخضر **v143** (40 من 42) ⇒ لا ادّعاء **82/82**. ولا بناءَ لطبقة التوابل: «ابنِ التوابل» ما زال معروضًا غيرَ مبتوًى، ولا P1-398 مُستجدّ.

---

## 42) جيل v152 — دفعة الشروح الخامسة في A2، واستعادة الشجرة من أرشيف v151، وعقد التعليم الموقّع من المالك

**ما جرى لهذا الجيل.** أُغلقت دفعة جديدة من صوت المعلّم: أربعةٌ وعشرون شرحًا في تمارين A2 كانت بين 29 و32 حرفًا، وصيغت بين **180 و212** حرفًا على النسق نفسه (القاعدة، ثم مثال بالألمانية، ثم مقابلُها الخاطئ، ثم «فحص ذاتي»). القياس بعد التوليد: `feedback.allUnder60Chars` من 1,274 إلى **1,250** من 1,733، و`feedback.under40Chars` من 1,031 إلى **1,021** من 1,250 (عشرة من الأربعة والعشرين بنود اختيار من متعدد)، ويبقى `allMedianChars` عند 30 و`explanationMedianChars` عند 25. شروحات تمارين A2 القصيرة نزلت من 72 إلى **48**. قرينة «أطول خيار = الجواب» لم تتحرك: **39.28%** (491 من 1,250) وتوزيع الإجابات 25.92/23.84/24.40/25.84 ومِحوَر «ثلاث دورات بلا D ‏= 3»، لأن الدفعة مكتوبة نصًّا لا هندسة خيارات. `case:audit` لم يتحرك: بصمة ‏167645dd621b و0 فجوات. **بصمة المحتوى` src/data` تحرّكت وحدها**: من ‏dac99157d91c إلى **d0c2079d038f** لأنها تُحسب على نصّ الدروس؛ أُعيد تثبيتها في كل الوثائق.

**حادثة يجب أن تُقرأ، لا أن تُنسى.** فُتِح هذا الجيل وشجرة العمل **مقلوبةٌ جزئيًا**: خمسة عشر ملف درس في `src/data` (8 ملفات A2 و5 ملفات B1 وملفّان B2) رجعوا إلى حالة أقدم، فغابت شروحات دفعتَي A2 السابقتين وعادت الموازنة القديمة لقرينة الخيارات، بينما `reports/` والوثائق على حالة v151. والكشف تم بمقارنة الأرشيف المسلَّم بالشجرة (`diff -rq` على `src/`؛ فروق الملفات الخمسة عشر، و`zip` ↔ `src` مختلفان في `lessons-a2-module7.ts`)؛ والأرقام المسلَّمة في ZIP كانت صحيحة، فالأرشيف هو المرجع، استُعيدت الملفات الخمسة عشر منه، ثم أعاد توليد التدقيق **ملفًا مطابقًا حرفيًا** لتقرير v151 المسلَّم. والقاعدة التي منعت حكمًا خاطئًا: `scripts/generate-lesson-quality-audit.ts` **لا يكتب إلا بـ `--write`**؛ تشغيله بلا علم يطبع فقط، فقرأتُ أول الأمر «تقريرًا مطابقًا» وهو في الحقيقة ملف قديم لم يُولَّد. لا تُصدّق `reports/` قبل أن ترى سطر `Wrote reports/...` أو طازَجية `mtime` مع خروج 0.

**تصحيح أُجري بسبب الحادثة، لا لأجل رقم.** بعد تطبيق الدفعة سقط `tests/unit/meaning-first-case.test.ts`: صار `discoveredSignals.controlled` تسعة عشر بدل عشرين، لأن الشرح القديم لـ `a2-04-e3` كان يحمل اسمَي الحالتين (Dativ/Akkusativ) فحذفتهما الصياغة «بالمعنى فقط». الحلّ لم يكن تخفيف الحارس ولا تحديث الرقم: أُعيد الشرح مع الحالتين مسمّيتَين داخل جملة المعنى نفسه (209 حرفًا)، فرجع العدّ عشرين وبقيت البصمة دون تحرك. **قاعدة دائمة**: إذا كان الشرح القديم في تمرين ممارسة مُتحكَّم فيها يذكر اسم حالة أو علامة تبعية صراحةً، فأنِله في الجديد مع المعنى — وإلا سرق الحارسُ إشارةً موجودة؛ والتحقق بـ `tests/unit/meaning-first-case.test.ts` لا بعدد الفجوات.

**المسافة الباقية مقيسة لا مقدَّرة.** إعادة تشغيل `docs/run-logs/2026-09-20-a2-explanations-4/distance-to-close.ts` (بُني من جديد بأنواع صريحة لأن `eslint` كان يرفض `any` في الملف المؤرشف، والآن lint صفر): من 1,250 بندًا مُقيَّمًا بقي **1,089** تحت ستين حرفًا (1,021 تحت أربعين)، ووسيطُها 25؛ ولأن الوسيط يُحسب `sorted[floor(n/2)]` يجوز أن يبقى تحت الستين 625 بندًا كحدّ أقصى ⇒ يجب رفع **464** بندًا = **20** دفعة من أربعٍ وعشرين. التوزيع: A1 ‏311 · A2 ‏271 · B1 ‏264 · B2 ‏243 — أي أن قراءة/استماع/`miniTest` في B1 وB2 هي الكتلة الأكبر رغم اكتمال تمارينها؛ فمن يظنّ أن «المحتوى انتهى ثم الشروح تابعة» يقيس خطأ. الإيقاع الذي اختاره المالك ثابت: **24 في كل جولة بالترتيب الحالي** (A2 ‏72 ثم A1 ‏167 ثم نصوص المراحل).

**قياسات هذا الجيل كما خرجت من الأدوات.** `handoff:check` صفر · `vitest run` **155 ملفًا / 1,019 اختبارًا** خروج 0 (لا اختبار جديد ولا تغيير في عدّاداته؛ لم تُكتب حلول بديلة في الاختبارات) · tsc صفر · **lint صفر بعد أن كان ثلاثة أخطاء**: الملف المؤرشف `distance-to-close.ts` كان يحمل `any` في ثلاثة مواضع فأُعيدت أنواعًا صريحة — درسٌ بأن الأرشيف يدخل `lint` ولا يُعفى لأنه «سجلّ». `case:audit` صفر فجوات ببصمة ‏167645dd621b (لم تتحرك) · بصمة محتوى `src/data` من ‏dac99157d91c إلى **d0c2079d038f** لأنها تُحسب على نصّ الدروس. البناء خروج 0: **321 صفحة** (SSG ‏9.6 ثانية، Compiled في 12.4 ثانية بعد تسخين `tsc`)، بصمة `offline:size` **c7f80adb201a** مع full 5,661,245 (a1 2,401,695 · a2 2,491,181 · b1 2,545,055 · b2 3,898,813)، و`js:budget` ‏110/1,729,585/251,309، و`media:budget` ‏544/52,943,843 والمنهاج **948,946** gzip. الكاش `dwnb-full-pack-v155` (staging/previous v151) في **سبعة** ملفات: `public/sw.js`، وأربعة اختبارات، و`tests/unit/offline-curriculum-rollback.test.ts`، و`scripts/verify-continuation-handoff.mjs`. لا متصفح لهذا الجيل؛ آخر قياس متصفح مرجعي v143 (40 من 42)، فلا يُدَّعى **82/82** قياسًا لهذا الجيل.

**درسَان تشغيليان أُضيفا لقواعد البناء.** (1) `prebuild` يسبق `next build` ويرفضه إن كانت `reports/` أو `docs/generated/` أقدَم من `src/data` برسالة `Academic audit artifacts are not current` — بعد أي كتابة على المحتوى تُشغَّل سلسلة التوليد كاملة ثم يُبنى؛ هذا أوقف أول محاولة بناء في v152. (2) إذا طلع `Running TypeScript … Failed to type check.` **بلا أي خطأ مطبوع** بينما `tsc --noEmit` المستقل يخرج صفرًا، فذاك إجهاد ذاكرة في صندوق 1,984 ميغابايت بلا swap لا فشل أنواع: يُعاد البناء بعد التدفئة ولا يُسكَت الفحص أبدًا.

**عقد التعليم الذي وقّعه المالك في هذا الجلسة، وهو مُلزِم للتصميم لا للعرض.** المالك لا يريد مدرسة ولا معلّمًا؛ الأداة وحدها تُعلّم وتُدرّب وتُرسّخ وتُؤطّر. مخرجات النقاش المُلتقاة:

1. **تسعون دقيقة يوميًا**، مقسومة: خمسون للعمود الفقري (درس + استرجاع مُؤجَّل)، وخمس وعشرون لإنتاج شفهي مُسجَّل (تظليل ثم إعادة قول ثم إعادة المقطع الصعب وحده)، وخمس عشرة لشكل الامتحان بوقت حقيقي، وعشر في آخر الأسبوع لدفتر الأخطاء؛ والسبت محاكاة (كاملة كل أسبوعين، مهارية في غيرها) والأحد راحة أو استرجاع خفيف يُقرَّره التطبيق بحسب الإنهاك.
2. **الشهادة عامة، لا مهنية**: B2 من Goethe أو telc أو ÖSD، ولا علاقة لها بالتمريض. الجهة **لم تُحسم بعد** عند المالك؛ إلى أن تُحسم تُعتمد **telc** افتراضًا في محاكاة السبت، ولا تُقرَّر صيغةُ المحاكاة برأي بل بتحقق من الصفحة الرسمية يُثبَّت بتاريخ ورابط، ويُبقي التحويل إلى جهة أخرى تغييرَ قالب ورقة لا تغييرَ منهج.
3. **الانطلاق من الصفر**، والصدق في الحساب: B1 في اثني عشر شهرًا مؤكد، وB2 عندها على حدّ الضيق — الأرجح أربع عشرة إلى ستّ عشرة شهرًا، أو اثنتا عشرة مع فترة مكثّفة بدل الزيادة اليومية. **امتحان B1 رسمي تمرينًا في الربيع** مقترحٌ معتمد في التخطيط ما لم يرفضه المالك.
4. **مسار التمريض طبقة منسوجة لا منهجًا ثانيًا**: «توابل» في A1 وA2 (لا كلمة مهنية تدخل استرجاعًا ولا امتحانًا؛ تُعاد صياغة مادة المستوى في سياق الرعاية فقط)، و«طبقٌ ثانٍ» من B1 (كلمات مهنية تُحفظ وتُراجَع). ثلاث قواعد لا تُكسر: **(أ)** الطبقة لا تُدخل قاعدة نحوية جديدة؛ مشهدٌ يحتاج لغة أعلى من المستوى يُرحَّل ولا يُخفَّف شرحه. **(ب)** لا يجوز أن يتوقّف الجواب الصحيح في تمرين لغوي على معرفة سريرية؛ تمرينٌ يحتاج قرارًا طبيًا ليُحلّ = تمرين فاسد عندنا، يُصلَح أو يُلغى. **(ج)** الطبقة **بارasitasية**: إن حُذفت بقي مسار B2 العام كاملًا لا ينقصه شيء، ولكل دفعة ميزانية معلنة من الكلمات المضافة، **وقاطع رجوع**: إن قِيس انخفاض في مهام الامتحان العام تُخفَّض الطبقة وتُقدَّم الشهادة، لا العكس.
5. **عناقيد الأمان** (أسماء الأدوية والوحدات، الطريقة والتوقيت، تأكيد الأمر المسموع بصوت عالٍ، سؤالان قبل تنفيذ أمر مبهم) تُبنى **عادةً تُفرِضها بيئة التمرين** — التخمين يفشل والتأكيد ينجح — لا «قاعدة تُحفظ وتُمتحَن»، وتُدرَّج: تعرّف في A1، تأكيد في A2، سؤال ورفض غامض في B1، توثيق وكتابة في B2. وكل وحدة تمريضية تحمل صراحةً: **هذه صياغات لغوية لا إرشاد سريري**.
6. **حدود لا تُجمَّل**: لا تصحيح نطق يُعتدّ به ولا حكم بشري على الطلاقة؛ والمحتوى **لم يراجعه بشرٌ متحدّث** (0 من 3,277) بل دُقّق آليًا، وأمانةُ الطبقة التمريضية تزيد هذا الدين مراجعةً مهنية لا تُدفن. والطريق غير اللغوي (الاعتراف بالشهادة الأجنبية، جهة الاختصاص في الولاية) ليس شغل التطبيق ولا يوقّع التطبيق نيابة عن جهة.

**ما لم يُفعَل ولم يُلغَ.** P1-398 ما يزال قرارَ تعريف عند المالك (خياراته مشروحة في §4u و`P1_AUDIT.md`؛ والأمانة أن تُذكر رفضُ الخدعة التجميلية دائمًا: لا `acceptedAnswers` تختلف عن المفتاح بحرف كبير أو علامة ترقيم، ولا تخفيف سقف 25%، ولا توسيع `normalizeGermanText`). الحارس المقترح الذي يمنع تلك الخدعة **لم يُكتب بعد**، وهو الجزء الوحيد من التوصية الذي يصلح أن يُنفَّذ دون انتظار قرار التعريف. البوابة `lesson:quality:audit` تخرج **1** بملاحظتين (50.9% مقابل 25%، ووسيط 25 مقابل 60)، فلا يُغلق P1-397 ولا P1-398 ولا P1-399، ولا يُقال «أخضر» عن بوابة تخرج 1. الطبقة التمريضية بوصفها بناءً (سجلّات، نصوص، أصوات) **لم تبدأ بعد**؛ هذا الجيل وثّق العقد فقط، وكتب الشروح.

## 41) دفعة v151 — شروحات A2 (الدفعة الرابعة): 24 بندًا ⇒ 1,274 تحت الستين، وبينة قرار P1-398 (2026-09-20)

- النطاق: **24 شرحًا** في تمارين A2 كانت بين 25 و28 حرفًا ⇒ مدى المستودع 156–212 (المطبَّق **174–212**). الأداة
  `scratch/set_expl.py a2 <spec>` أعطت **applied: 24 of 24 missing: []**؛ ولا لمس لـ`acceptedAnswers` ولا لنصّ الخيارات.
- القياس: `feedback.allUnder60Chars` ‏1,298 ⇒ **1,274** (من 1,733) · `allMedianChars` ‏29 ⇒ **30** ·
  `explanationMedianChars` ‏25 بلا حركة · `feedback.under40Chars` ‏1,035 ⇒ **1,031** (‏4 من البنود الـ24 اختيار من متعدد) ·
  تمارين A2 بشرح ≥60: ‏72/168 ⇒ **96/168**، والمتبقي **A2 ‏72 ثم A1 ‏167** و1,035 في أسئلة المراحل (‏72 + 167 + 1,035 = 1,274 ✓).
  القرينة **39.28%** (‏491 من 1,250) وحارس الدروس الموازية على **15** درسًا بلا حركة؛ `case:audit` بلا حركة
  (‏167645dd621b، صفر فجوات، و`discoveredSignals.controlled` ما يزال 20).
- **بينة قرار P1-398** (جديدة، من `npm run lessons:variant-worklist` ⇒ `reports/accepted-answer-worklist.md`):
  **197** بندًا إنتاجيًا بإجابة وحيدة، و**0 قابلة للإضافة بثقة** بحكم ADR-078؛ التوزيع بالنوع
  **159 fill-blank و36 word-ordering و2 error-correction**، وبالتبرير 147 جملة قصيرة جدًا، 32 نصّ فرعي أو مجموعة مصدر،
  14 بلا جرّة خلفية قابلة للتقديم، 4 لا تحفظ رصيد الكلمات. ولأن سقف 25% يعني ≤96 بندًا، يلزم رفع **101** بندًا؛
  فلو رُفعت الـ38 (الترتيب والتصحيح) كلها بقي الحدّ الأدنى **159 من 387 = 41.1%**. أي أن السقف لا يُبلَغ بتأليف بدائل
  وحده: إمّا إعادة تصميم بعض الفراغات لتقبل مرادفًا حقيقيًا (تغيير البند نفسه)، أو تعريف البند على أنه يستثني
  الفراغ ذا الكلمة الواحدة. **ممنوع** تخفيف العتبة أو توسيع المُصحِّح؛ فالخروج يبقى 1 حتى يقرّر المالك.
- البوابات: tsc صفر · lint صفر · **vitest 155 ملفًا / 1,019 اختبارًا** · `handoff:check` صفر ·
  `lesson:quality:audit` **خروج 1** بنفس الملاحظتين (50.9% مقابل 25%، ووسيط 25 مقابل 60). المسافة مقيسة بإعادة إنتاج
  مجتمع البوابة نفسه (`docs/run-logs/2026-09-20-a2-explanations-4/distance-to-close.ts`): من 1,250 بندًا مُصحَّحًا
  يبقى **1,099** تحت الستين، والوسيط يبلغ 60 حين لا يزيد الباقي على 625 ⇒ **رفع 474 بندًا = 20 دفعة**؛ التوزيع
  A1 ‏311 وA2 ‏281 وB1 ‏264 وB2 ‏243 — أي أن جُمَل القراءة/الاستماع و`miniTest` في B1 وB2 باقِية رغم اكتمال تمارينها.
- البناء: خروج 0 · **321 صفحة** (SSG ‏9.8 ثانية) · بصمة `offline:size` **8d3241e662dd** مع full 5,655,234 —
  a1 2,399,789 · a2 2,484,974 · b1 2,543,151 · b2 3,897,008 · `js:budget` ‏110/1,727,633/251,309 ·
  `media:budget` ‏544/52,943,843 والمنهاج **946,991** gzip · بصمة المحتوى **dac99157d91c** · بصمة `case:audit`
  ‏167645dd621b · الكاش `dwnb-full-pack-v151` (staging/previous v150) في **سبعة** ملفات.
- تسلسل البناء المُطبَّق: `npm run build` حتى `Compiled successfully` ⇒ إيقاف (توليد `.next/types`) ⇒ تدفئة tsc منفردة
  (‏24.5 ثانية، خروج 0، ‏246,523 بايتًا) ⇒ بناء كامل خروج 0 في 71 ثانية.
- متصفح الدفعة لم يُشغَّل؛ آخر قياس v143. السجل: `docs/run-logs/2026-09-20-a2-explanations-4/`. والحزمة المسلَّمة
  الآن `/home/user/wegberlin-full.zip`؛ حجمُها وبصمتها في `wegberlin-full.zip.sha256` وحدهما.

## 40) دفعة v150 — شروحات A2 (الدفعة الثالثة): 24 بندًا ⇒ 1,298 تحت الستين (2026-09-20)

- النطاق: إعادة تأليف **`explanationAr` في 24 تمرينًا من A2** كانت أقصر الشروحات (21–25 حرفًا)، بنمط المستودع:
  القاعدة مع مثال ألماني بين «»، ثم لماذا كل بديل خاطئ، ثم «فحص ذاتي: …؟». الطول المحريري **156–212 حرفًا**:
  المقيس بعد التأليف 168 إلى 210، فاق واحد لا غير. الأداة: `scratch/set_expl.py a2 <spec>` (يتحقق من الطول السابق
  حرفيًا)؛ التقرير: **applied: 24 of 24 missing: []**. لم تُمَسّ `acceptedAnswers` ولا الخيارات ولا المفاتيح.
- القرينة لم تتحرك: **39.28%** (‏491 من 1,250) كما عند v149 — لأن هذه الدفعة لا تكتب نصّ الخيارات أصلًا؛ والدرس مدرج
  أصلًا في `PARALLELISED` فالحارس يظل على **15** درسًا (‏16 اختبارًا في ملفه).
- القياس المتحرك: `feedback.allUnder60Chars` ‏1,322 ⇒ **1,298** (من 1,733؛ الفرق 24 بالضبط) · `allMedianChars` ‏28 ⇒ **29** ·
  `explanationMedianChars` ‏24 ⇒ **25** · `feedback.under40Chars` ‏1,047 ⇒ **1,035** (من 1,250؛ 12 من البنود الـ24
  اختيار من متعدد والباقي fill-blank/matching/word-ordering/error-correction) · تمارين A2 بشرح ≥60: ‏48/168 ⇒ **72/168**
  والمتبقي على مستوى التمارين **A2 ‏96 ثم A1 ‏167** والباقي **1,035** في أسئلة المراحل (96 + 167 + 1,035 = 1,298 ✓).
- **انزياح حوكمة مقصود**: `discoveredSignals.controlled` ‏21 ⇒ **20** في `reports/case-teaching-audit.json`، لأن
  شرحَي `a2-04-e1` و`a2-04-e2` كانا يسمّيان الحالة صراحةً (‏Dativ) والنمط المعتمد يذكر القاعدة والمعنى بغير تسمية
  الحالة. رُفِع التثبيت في `tests/unit/meaning-first-case.test.ts` وحده (‏21 ⇒ 20) كما فُعل عند v131 لـ`b2-09-e4`؛
  والبوابة `case:audit` تبقى 19 عقدًا / 23 نظرية / 57 مضبوطًا / 44 تقييمًا / **0 فجوات**.
- البوابات: tsc صفر · lint صفر · **vitest 155 ملفًا / 1,019 اختبارًا** (لا اختبار جديدًا: الدفعة لا تضيف حارسًا) ·
  `handoff:check` صفر · `lesson:quality:audit` **خروج 1** بملاحظتين: الإنتاجية أحادية السلسلة 50.9% (سقف 25%)
  ووسيط الشرح 25 (أدنى 60) — أي الوسيط تحرك حرفًا واحدًا ولم يُغلق البند.
- البناء: خروج 0 · **321 صفحة** (SSG ‏9.7 ثانية) · بصمة `offline:size` **90a27131fd55** (full 5,649,071 — a1 2,397,900 ·
  a2 2,478,732 · b1 2,541,239 · b2 3,895,209) · `js:budget` ‏110/1,725,725/251,309 · `media:budget` ‏544/52,943,843
  والمنهاج **945,047** gzip (نما لأن نصوص الشرح العربية تدخل في حزم المصدر) · بصمة المحتوى **99f930237c10**
  و`case:audit` ‏167645dd621b · التدقيق اللغوي بلا حركة (‏9da1a2e19f1e) · الكاش `dwnb-full-pack-v150`
  (staging/previous v149) في **سبعة** ملفات.
- **درس البيئة المُطبَّق هذه المرة من أول محاولة**: بلا سوابل (`swapon` مرفوض) لا تكفي تدفئة `tsc` قبل البناء؛
  يجب أن تجري التدفئة **بعد** وجود `.next/types/**` التي يولّدها Next نفسه (وإلا كان `.tsbuildinfo` غير مطابق
  فتعثّر «Running TypeScript» خمس دقائق مع 16 ميغابايت متاحة). التسلسل الذي نجح: بناء يوقف بعد Compiled ⇒
  `node --max-old-space-size=900 node_modules/typescript/bin/tsc --project tsconfig.json --noEmit --declarationMap false
  --emitDeclarationOnly false --tsBuildInfoFile .next/cache/.tsbuildinfo` (‏26 ثانية، خروج 0، 307,615 بايت) ⇒
  ثم `NODE_OPTIONS=--max-old-space-size=900 npm run build` ⇒ خروج 0 في 100 ثانية.
- متصفّح هذه الدفعة لم يُعَد تشغيله؛ آخر قياس v143 (40 من 42 والفاشلان مرّا منفردَين). السجل:
  `docs/run-logs/2026-09-20-a2-explanations-3/`. والحزمة المسلَّمة الآن ‏`/home/user/wegberlin-full.zip`
  (ملفات الشجرة ومدخلات المجلدات تُقاس عند التغليف؛ الحجم والبصمة في الملف الجانبي لا هنا).

## 39) دفعة v149 — `b2-19`: السقف ≤40% بلغته فعلاً (491 = 39.28%) (2026-09-20)

- حُوِّل **11 عنصر قرينة** في `b2-19` (كان 11 من 13 = 85%) بـ**33 مشتتًا ألمانيًا** مؤلَّفًا بمحاكاة منطق
  `cue-batch.py` حرفيًا قبل استدعائها (تجريد `.!?` النهائية، رفض التعادل عند الطرفين، توسيع ≤25 على الأربعة، طيّ
  `ä/ö/ü/ß`)؛ فقبلته الأداة **من المحاولة الأولى** بلا جولة تصحيح، وكتبته `parallelise-options.py --write` في ملف
  واحد (11 عنصرًا)، والمفتاح و`correctIndex` لم يُمَسّا. الدرس صار **صفر** عنصر قرينة (مقيس).
- **لم تحتاج الدفعة إلى إصلاح حارس**: بعد إدراج `b2-19` في `PARALLELISED` (**15** درسًا) مرّ ملف الحارس بـ**16**
  اختبارًا من أول مرة — العنصران غير القرينيين في الدرس كانا سليمَي الطرفين أصلًا.
- القرينة المقيسة: **502 ⇒ 491 من 1,250 = 39.28%** (المسبار يطبع 39.3، والتقرير `multipleChoice.longestOptionIsKeyPct`
  = **39.28**)، أي **تسعة عناصر تحت السقف** ≤500. ملاحظة «الأطول=الأصح» في `P1-397` **أُغلقت قياسًا**؛ ولا يُغلَق البند
  نفسه ولا تُعلَن البوابة خضراء: `lesson:quality:audit` ما يزال **خروج 1** بملاحظتين (الإنتاجية أحادية السلسلة
  50.9% مقابل سقف 25%، وسيط الشرح 24 مقابل أدنى 60).
- بالتوزيع: ex ‏76 من 194 (39.2%) · rd ‏154 من 288 (53.5%) · ls ‏125 من 288 (43.4%) · mt ‏136 من 480 (28.3%)؛
  وبالمستوى A1 ‏82 (26.3%) · A2 ‏147 (47.1%) · B1 ‏142 (45.5%) · **B2 ‏120 من 314 (38.2%)** (الفرق كله في B2: 131 ⇒ 120).
  المواضع لم تتحرك: mix ‏25.92/23.84/24.4/25.84 و3 دروس بلا D. توزيع الفجوة: ‏1→39، 2→28، 3→25، 4→25، 5→22، 6→19،
  7→18، 8→19، 9→17، 10→15، 11→14، 12→13، 13→16، 14→11، 15→11، 16→199 (مجموعها 491). القادة الآن اثنا عشر درسًا
  بعشرة عناصر (‏a2-06 · a2-12 · b1-02 · b1-09 · b1-13 · b2-06 · b2-09 · b2-10 · b2-14 · b2-16 · b2-20 ‏10 من 14 ·
  b2-21)؛ أي لا درس واحد بقي فوق العشرة، فأي دفعة قادمة اختيارية لا ضرورية لهذا البند.
- البوابات: tsc صفر · lint صفر · **vitest 155 ملفًا / 1,019 اختبارًا** · `handoff:check` صفر · البناء خروج 0
  (321 صفحة، SSG ‏8.8 ثانية) · بصمة `offline:size` **86118504e7f8** (full 5,641,870 — a1 2,395,775 · a2 2,472,113 ·
  b1 2,539,154 · b2 3,892,690) · `js:budget` ‏110/1,723,755/251,309 · `media:budget` ‏544/52,943,843 والمنهاج 943,097
  gzip · الكاش `dwnb-full-pack-v149` (staging/previous v148) والقشرة `dwnb-shell-v4`.
- العدادات بعد إعادة توليد `reports/`: الأسماء **4,874** مرشحًا / 1,381 مغطى / **3,404** context-only و1,470 هدفًا
  مؤلفًا؛ أطر الأفعال **1,257** / 134 / **1,119**؛ `pending-human` ‏**89 و4 بلا حركة** والمراسي 1,297 و134 كما هي؛
  بصمة المحتوى **464623b3d15b** والتدقيق اللغوي بلا حركة (179 TSX / 6991 وسمًا / 399 / 45 / 233 / 0،
  بصمة `9da1a2e19f1e`).
- درس بيئة (ثبَّت إجراءً): لا سوابل هذه الجلسة (`swapon` مرفوض: Operation not permitted)، فبناء بـ
  `--max-old-space-size=1200` تعثّر تسع دقائق عند «Running TypeScript» حتى قُتل. المسار الذي نجح: تدفئة ذاكرة tsc
  الزيادة أولًا بـ`node --max-old-space-size=900 node_modules/typescript/bin/tsc --project tsconfig.json --noEmit
  --tsBuildInfoFile .next/cache/.tsbuildinfo` (24 ثانية، خروج 0)، ثم البناء بنفس السقف 900 ميغابايت ⇒ خروج 0.
- متصفّح هذه الدفعة **لم يُعَد تشغيله**؛ آخر قياس مُسجَّل v143 (40 من 42 في مشروع chromium، والفاشلان مرّا منفردَين).
  السجل: `docs/run-logs/2026-09-20-cue-parallelism-b2-19/`. والحزمة المسلَّمة الآن ‏`/home/user/wegberlin-full.zip`
  (1,678 ملفًا و156 مدخل مجلد في الأرشيف؛ الحجم والبصمة في الملف الجانبي لا هنا، لأن كل تصحيح للوثائق يغيّرهما)
  وبجانبها ‏`wegberlin-full.zip.sha256`؛ ‏`sha256sum -c` منها يعيد OK.

## 38) دفعة v148 — `b2-17`: القرينة إلى 40.16% وعُنصران فوق السقف (2026-09-20)

- حُوِّل **11** عنصر قرينة في `b2-17` (كان 11 من 13 = 85%) بـ**33** مشتتًا ألمانيًا، ثم كُشفت أثناء إضافة الدرس إلى
  `PARALLELISED` مجموعة **ليست** عنصر قرينة وأخلّت بقاعدة أخرى: `b2-17-m2` كان مفتاحها ‏"einzureichen" (12 حرفًا)
  **الأقصر وحده** مقابل 13/13/18. أُصلح من خلال الأداة نفسها (دفعة مكوّنة من سطر واحد: مشتتات 10/13/13) لا بتحرير
  يدوي — فالمجموع **12** مجموعة و**36** مشتتًا. هذا ثانٍ من نوعه بعد `b1-12-m5` عند v144: الحارس Level-wise يحاكم
  كل عناصر الدرس، فلا يكفي أن تُفرَّغ قائمة القرينة.
- القرينة المقيسة: ‏513 من 1,250 = 41.04% ⇒ **502 من 1,250 = 40.16%** (التقرير يطبع 40.16 والمسبار 40.2). البوابة
  ما تزال **خروج 1** بفارق **عنصرين** فقط عن السقف (≤500). بالتوزيع: ex ‏77 من 194 (39.7%) · rd ‏157 من 288 (54.5%) ·
  ls ‏128 من 288 (44.4%) · mt ‏140 من 480 (29.2%)؛ وبالمستوى A1 ‏82 (26.3%) · A2 ‏147 (47.1%) · B1 ‏142 (45.5%) ·
  **B2 ‏131 من 314 (41.7%)**. المواضع لم تتحرك: A 324 · B 298 · C 305 · D 323 (25.92/23.84/24.4/25.84) و3 دروس بلا D.
- درس واحد بقياد كامل: `b2-19` (11 من 13) هو الوحيد فوق عشرة عناصر؛ بعده اثنا عشر درسًا بعشرة. تحويله وحده يعطي
  491 = **39.28%** فيُغلق البوابة؛ أو يُغلقها تحرير عنصري `b1-16-e6` و`b1-22-e6` العربيّي المفتاح (⇒ 500 = 40.0%
  بالضبط) إن سُمح لـ`cue-batch.py` بمجموعات عربية نقية. لا يُغلق P1-397 ولا يُعلَن بلوغ السقف قبل قياس ≤40% فعليًا.
- درس tooling سُجّل: `cue-batch.py` يقارن أطوالًا **مجرّدة من علامات الترقيم النهائية** ويرفض **التعادل** عند الطرفين
  (`lens[key] == max(lens)` أو `== min(lens)` خطأ، لا فقط «أكبر من»). لذلك وُلِّد فاحص أطوال محلي مطابق لمنطقها
  (شريط [K−12, K+18] + لا تعادل عند الحدين + توسيع ≤25 على الأربعة + طيّ `ä/ö/ü/ß`)؛ كشف ‏`b2-17-m4` قبل النداء
  بعد أن رفضته الأداة أول مرة («المفتاح ما يزال الأطول وحده (58)» بسبب تعادل 58 مع المفتاح المجرّد). الفاحص بقي في
  `TMPDIR` ولم يُضَف إلى المستودع.
- الحارس: أُدرج `b2-17` ⇒ **14** درسًا محوَّلًا، وملف الحارس **15** اختبارًا، والإجمالي **155** ملفًا و**1,018**
  اختبارًا · tsc صفر · lint صفر · `handoff:check` صفر.
- العدادات المعجمية بعد إعادة التوليد: الأسماء ‏4,864 ⇒ **4,870** (سياقي 3,394 ⇒ **3,400**، مغطى 1,381 · مؤلف 1,470
  بلا حركة)، أطر الأفعال ‏1,250 ⇒ **1,251** (سياقي 1,112 ⇒ **1,113**). **pending-human لم تتحرك: 89 و4**، والمراسي
  1,297 و134. التدقيق اللغوي: 179 TSX / 6991 وسمًا / 399 ألمانيًا / 45 نطاقًا / 233 مختلطًا ساكنًا / 0 مشاكل.
  بصمة المحتوى `9d1740170ad9…`، والكاش `dwnb-full-pack-v148` (staging/previous v147).
- ملاحظات البوابة الثلاث كما قِيست: الطول 40.2% (سقف 40) · الإنتاجية أحادية السلسلة 50.9% (سقف 25) · وسيط الشرح
  24 حرفًا (أدنى 60) ⇒ P1-397 مفتوح، ولا يُغلق بأخضر الاختبارات.
- البناء المقاس بعد الدفعة: **321 صفحة** (SSG 9.5s) · بصمة `offline:size` **e58c4c394532** مع `full 5,641,415`
  (a1 2,395,513 · a2 2,471,856 · b1 2,538,875 · b2 3,891,917) · 318 مسارًا offline (حُزَم 58/58/58/219/318) ·
  `js:budget` 110 مقاطع / 1,723,301 gzip / أكبر ملف 250,855 · `media:budget` 544 ملفًا / 52,943,843 بايتًا /
  المنهاج 942,648 gzip.
- عيوب بيئة خامس سُجّل: رجعت الشجرة (خامس دور على التوالي) إلى 7 دروس موازة وتثبيت معجمي قديم مع `sw.js` على v147؛
  استُعيدت من أرشيف v147 بعد `sha256sum -c` (OK) وتحقّق بالقياس (513، 13 درسًا، 4,864)؛ وأُعيد `/home/user/.swapfile`
  (1,500 MB) و`npm ci` (471 حزمة) قبل أي قياس.
- المتصفح: لم يُعَد تشغيله على هذا البناء؛ آخر قياس مُسجَّل يبقى ما ثُبّت عند v143 (40 من 42 في مشروع chromium،
  والفاشلان مرّا منفردَين، وبند الترطيب 12.5 ثانية). مشروع الهاتف (Pixel 7) لم يُشغَّل، فلا يُدَّعى **82/82** باسم
  v148. السجل: `docs/run-logs/2026-09-20-cue-parallelism-b2-17/`. والحزمة المسلَّمة الآن ‏`/home/user/wegberlin-full.zip` ‏(1,662 ملفًا و155 مدخل مجلد في الأرشيف؛ الحجم والبصمة في الملف الجانبي لا هنا، لأن كل تصحيح للوثائق يغيّرهما) وبجانبها ‏`wegberlin-full.zip.sha256`؛ ‏`sha256sum -c` منها يعيد OK.

## 50) جيل **v157** (2026-09-23) — الدفعة 12 من جماعة الوسيط، وحارسُ P1-398 يصير بوابةً، وحزمةٌ مسطّحة مقبولة

**ما نُفِّذ في هذا الجيل.** (1) **دفعة شروح A2 رقم 12**: 24 بندًا من جماعة الوسيط (أقصر 24 بندًا تحت 60 حرفًا: ‏19–20 ⇒ 178–209)، طُبِّقت بـ`scripts/apply-explanation-batch.py` ‏24/24 (0 skipped · 0 not found). القياس بعدها: وسيطُ الجماعة 27 ⇒ **28** · تحت-60 ‏967 ⇒ **943** · تحت-40 ‏899 ⇒ **875** · المسافة إلى وسيط 60: ‏342 ⇒ **318** (**14** دفعةً بحجم 24). فحصُ الاقتباسات: 1,733 شرحًا · **765** اقتباسًا ألمانيًا · **0 misquote** · 49 مثالًا مُختلَقًا (بلا زيادة). الباني والحراسات وملفُّ الحمولة في `docs/run-logs/2026-09-23-a2-explanations-12/` و`docs/run-logs/a2-explanations-payloads/a2e12.json`، ودفعةُ 11 (‏366 ⇒ 342) في مجلدها المجاور. (2) **حارس P1-398 المضادّ للحشو صار بوابة**: القياس على الأشكال المُطبَّعة المتمايزة، و`npm run accepted:answers` يرفض أي بديل مطابق بعد التطبيع عند **0**، والأرقام مثبَّتة في `handoff:check` وفي تقرير جودة الدروس — **338/387 = 87.3%** بسلسلةٍ واحدة، و49 موسَّعًا بحقٍّ؛ ولم يُخفَّض السقف ولم يُوسَّع `normalizeGermanText`. التصادمُ الرقميُّ صُحِّح: قرارُ العرض هو **ADR-084** في `docs/adr/` و`DECISIONS.md` (وADR-083 بقي قرار بنية التسليم). (3) **الوسم والبناء والتسليم**: `dwnb-full-pack-v157` (staging/previous ‏v156) في سبعة ملفات، و13 وثيقةً على `Sync batch: v157`.

**قياسات هذا الجيل كما خرجت من الأدوات.** `tsc` ‏0 · `lint` ‏0 · `vitest run` **159 ملفًا / 1,042 اختبارًا** خروج 0 · `secret:audit` 0 نتائج (1,221 ملفًا نصيًّا) · `source:audit --strict` ‏18/18 طازجة · `handoff:check` 0 · `lesson:quality:audit` خروج **1** بملاحظتين (87.3% مقابل 25%، ووسيط 28 مقابل 60) تُترَك كما هي بلا تطبيع. البناء خروج 0: Compiled **26.1s** · **321/321** صفحة · `offline:size` **`eaf077b202f2`** مع a1 2,414,052 · a2 2,533,149 · b1 2,557,418 · b2 3,911,137 · full 5,701,929 · `js:budget` ‏110 / **1,742,367** / 250,914 · `media:budget` ‏544 / 52,943,843 والمنهاج **961,646** gzip. الحزمةُ المسطّحة: **1,771 ملفًا + 169 مدخلَ مجلد**، 0 مدخل تحت مجلد ظرف، 0 مدخل محظور، 9/9 ملفًا حرجًا في الجذر، و2,101 حقل شرح في `src/data`. **ولا تُثبَّت البايتاتُ ولا sha256 داخل الوثيقة** لأن الحزمة تحتوي هذه الوثيقة نفسها فتتغيّر بكل تعديل؛ المرجعُ هو الـsidecar ‏`/home/user/wegberlin-full.zip.sha256` ويُتحقَّق بـ`sha256sum -c` عند التسليم.

**ما لم يُقَس.** المتصفح في هذا الجيل لم تكتمل دورتُه عند كتابة هذا السطر: آخرُ قياسٍ متصفحٍ مرجعي **v143 (40/42 سطح مكتب)**، والجولةُ الجارية تُبلَّغ بنتيجتها في `PROJECT_STATUS.md` ولا يُدَّعى **82/82** قبل أن تخرج. المراجعةُ البشرية ما زالت صفرًا (0/3,277)، وسجلُّ الأصول الصوتية واحدٌ كما كان، ولا ادعاءَ نشرٍ جديد: رفعُ الحزمة إلى GitHub/Termux يحتاج تنفيذ المالك بالأمر الموثّق.

## 51) جيل **v158** (2026-09-23) — طبقةُ التمريض المنسوجة تُبنى: 14 وحدة، ثلاث قواعد مقيسة، وقاطع رجوع

**ما نُفِّذ.** عقد المالك v152 (§4 من ADR-080) صار **مبنيًّا** لا موصوفًا: `nursing-layer-v1` بـ**14 وحدة** منسوجة (A1 4 · A2 4 · B1 3 · B2 3) داخل مرحلة «القاعدة والمقارنة» في دروس قائمة. «توابل» في A1/A2: **صفر كلمة مهنية** وإعادةُ صياغة مادة المستوى في سياق الرعاية؛ «طبق ثانٍ» من B1: **8 من 8** كلمة مهنية بالميزانية المعلنة (0/0/4/4) تُصدَّر بـTSV بترويسة «استيراد المفردات الشخصية» نفسها (`German → Arabic → Example → Tags`) ولا تكتب الطبقةُ في التخزين بنفسها.

**القواعد الثلاث صارت قياسًا لا وعدًا.** (أ) كل وحدة تُسمّي كتل القاعدة التي تعيد استعمالها ومعرّفٌ لا يُحلّ ⇒ فشلُ التدقيق. (ب) فعلٌ لغوي واحد مقبول لكل وحدة (`recognize` في A1 · `confirm` في A2 · `ask` في B1 · `document` في B2) مع **خيار تخمين إلزامي تُفشِله البيئة** (**22** خيارًا) ورفضُ أي خيار صحيح يقرأ كتعليمة على جسم أو جرعة. (ج) فحصٌ بنيوي: **5** مستوردين مُعلَنين للطبقة، و**0** ذكر لها في `src/core/{exams,lessons,evidence,review,assessment,diagnostic}` ⇒ حذفُ ملف السجل يُسقط اللوحة وحدها ويبقي مسار B2 كاملًا.

**صفر أثر على التعلّم، مقيسًا من التخزين.** `masteryEffect/evidenceEffect/gateEffect = none`، واختبار المتصفح يفتح `a1-22` فيُفشل التخمين ويقبل الفعل اللغوي ثم **يقرأ `IndexedDB` قبل التدريب وبعده ويقارن**: نفس خريطة الإتقان ونفس عددَي المحاولات والأخطاء — أي «لم يتغيّر شيء» لا «لا شيء موجود». وكل وحدة تحمل «هذه صياغات لغوية لا إرشاد سريري» (14/14) ويفشل التدقيق إن غاب من واحدة. **قاطع الرجوع** `nursing-layer-rollback-v1`: مقياس أداء مهام الامتحان العام، نافذة 14 يومًا، تشغيل عند **انخفاض 5 نقاط مئوية** ⇒ تخفيضُ الطبقة وتقديمُ الشهادة.

**بوابات.** `npm run nursing:layer` داخل `prebuild`، و`handoff:check` يثبّت هوية التدقيق وتغطية المستويات والميزانية وعدد التخمينات المُفشَلة وصفرَ الاقترانات ونصوصَ التقرير والـADR والاختبار ووسومَ تدفّق المتصفح. وأُعيد قياس حاكم اللغة/Bidi: **180 TSX / 7,046 وسمًا / 406 ألمانية / 235 مختلطًا ساكنًا / 0 مشكلة**، وأُعيد تثبيت الأرقام في اختباره وADR-019 والـverifier.

**حدود.** **0** مراجعة مهنية أو لغوية بشرية للوحدات الـ14 (`pending-nursing-professional`)، ولا شهادةَ تأهيل ولا إرشادَ سريري ولا قياسَ نطق؛ والطبقة **تزيد دَين المراجعة** ولا تُغلق بندًا بشريًا. التفاصيل: `docs/generated/NURSING_LAYER_REPORT.md` و`docs/adr/ADR-085-woven-nursing-layer.md` و`docs/run-logs/2026-09-23-nursing-layer/README.md`.

**البناء في v158.** (تجاوزه بناءا v159 ثم v160؛ البصمات في §52 و§53.) خروج **0** · **321/321** صفحة · `offline:size` **`ed3c75aebd86`** مع a1 2,422,337 · a2 2,541,422 · b1 2,565,697 · b2 3,918,897 · **full 5,709,344** (وهذه البصمة **لبناءٍ بعينه لا للمحتوى**: تبنيان لنفس المصدر قاسا 566f4883bbb8/5,710,883 ثم ed3c75aebd86/5,709,344 بفرق عشرات البايتات لأن معرّف بناء Next يسكن داخل HTML؛ الثابت هو مسار Offline: **318** مسارًا في حزم 58/58/58/219/318 وكاش `dwnb-full-pack-v161`) · `js:budget` ‏110 / **1,750,122** / 250,914 · `media:budget` ‏544 / 52,943,843 والمنهاج **969,384** gzip. الوحدات **160 ملفًا / 1,050 اختبارًا** خروج 0 · `tsc` 0 · `lint` 0 · `handoff:check` 0. **المتصفح على البناء النهائي:** سطح المكتب **43/43** في 7.6 دقيقة · الهاتف **42/43** في 12.8 دقيقة، والفشل الوحيد هو سقف 360 ثانية لتثبيت الحزمة الكاملة مع الصوت، ونجح معزولًا على الهاتف في **32.3 ثانية** على البناء نفسه؛ لم تُخفَّف عبارة تحقُّق ولم يُتخطَّ مشروع، والهاتف يصل إلى «القاعدة والمقارنة» من زر «أكملت هذه الخطوة» لأن `.lesson-steps` = `display:none` تحت 850px. والكاش `dwnb-full-pack-v161` (staging/previous ‏v157) في سبعة ملفات، و13 وثيقةً على `Sync batch: v161`.

## 52) جيل **v159** (2026-09-23) — الدفعة 13 من جماعة الوسيط: 24 شرحًا، المسافة 318 ⇒ 294

**ما نُفِّذ (محتوى لا واجهة).** أُعيد تأليف **24** شرحًا (`explanationAr`) في A2: أقصر 24 بندًا في **جماعة الوسيط** التي تحسبها البوابة نفسها (اختيار من متعدد + أسئلة القراءة + أسئلة الاستماع + `miniTest` = 1,250 بندًا) وكانت تحت 60 حرفًا. الاختيار بـ`docs/run-logs/2026-09-23-a2-explanations-13/pick_median.ts 24 a2`، والتأليف بـ`a2e13.py` بحراسات الدفعة 12 حرفيًّا (النطاق 156–212، منع الصياغة الموضعية، منع CJK، منع التكرار، والنصّ القديم وطوله يُقرآن من المستودع، وإشارةُ الإعراب القائمة في النصّ القديم يجب أن تبقى، والبند الذي بلغ 60 حرفًا يُرفض لأنه الدفعة الخطأ)، والتطبيق بـ`scripts/apply-explanation-batch.py --level a2 --payload docs/run-logs/a2-explanations-payloads/a2e13.json` ⇒ **24/24، صفر متخطّى، صفر غير موجود**.

**القياس (لم يُلمَس إلا `explanationAr`).** بنداتُ جماعة الوسيط تحت 60: **943 ⇒ 919** (السقف 625) · تحت 40: **875 ⇒ 851** · `explanationMedianChars` **28 ⇒ 29** · `allUnder60Chars` **1,082 ⇒ 1,058** من 1,733 · `allMedianChars` **34 ⇒ 35** · المسافة إلى وسيط 60: **318 ⇒ 294** (تبقّى 13 دفعة بحجم 24). ولم تتحرّك: مزيج المواضع (25.92/23.84/24.4/25.84) · قرينة «الأطول = الأصح» 39.28% · أمانة البدائل 338/387 وبصفر بديل غير قابل للوصول · مخالفات نطاق الكتابة 0 · `case:audit` عند `167645dd621b` بصفر فجوات.

**البوابات.** `npm run check` خروج **0**: lint 0 · tsc 0 · **1,050 اختبارًا في 160 ملفًا** · `handoff:check` 0 · بناء **321/321 صفحة** (تجميع 12.7 ثانية وتوليد 10.0 ثانية) · `offline:size` **`0d1b57494337`** (a1 2,424,100 · a2 2,546,714 · b1 2,567,442 · b2 3,921,106 · **full 5,715,376**) · `js:budget` ‏110/1,751,723/250,914 · `media:budget` ‏544/52,943,843 والمنهاج **970,991** gzip · الكاش `dwnb-full-pack-v161` (staging/previous ‏v158) في سبعة ملفات · و13 وثيقة على `Sync batch: v161`.

**فحص الاقتباسات.** `npx tsx scripts/audit-explanation-quotes.ts --level a2` ⇒ 432 شرحًا · 531 اقتباسًا ألمانيًا · **0 misquote** لمادة حقيقية (و23 مثالًا مُختلَقًا تُعرض كملاحظات لا أخطاء).

**المتصفح على البناء المسلَّم.** `npm run test:e2e` (بناء إنتاجي، Chromium كامل) ⇒ سطح المكتب **43/43** في 7.5 دقيقة والهاتف **43/43** في 6.9 دقيقة، خروج **0** — أوّل جولةٍ للمشروعين على جيلٍ مسلَّم بلا ضحيةٍ زمنية: تثبيتُ الحزمة الكاملة على الهاتف (318 مسارًا و272 أصلًا صوتيًا) أتمّ داخل سقفه 360 ثانية. واسم كاش الحزمة صار `dwnb-full-pack-v161` والاختبار يقرأه من `public/sw.js`.

**البوابة تبقى حمراء بشرعية.** `lesson:quality:audit` خروج **1** بملاحظتين منشورتين: الإنتاجية أحادية السلسلة **338/387 = 87.34%** مقابل سقف 25% (قرار تعريف عند المالك، P1-398)، ووسيط الشرح **29** مقابل 60 (P1-399، وبقيت 13 دفعة). **لم** يُرفع سقف، ولم تُخفَّف عبارة تحقُّق، ولم تُلمَس `acceptedAnswers`، ولم يُنقل بندٌ من `not-implemented` إلى غيره.

## 53) جيل **v160** (2026-09-23) — الدفعة 14 من جماعة الوسيط: المسافة 294 ⇒ 270، واستعادةُ الشجرة من الأرشيف

**ما نُفِّذ (محتوى لا واجهة).** 24 شرحًا آخر (`explanationAr`) في A2: أقصر 24 بندًا في جماعة الوسيط بعد الدفعة 13 (نطاق 23–25 حرفًا) ⇒ **164–206**. الاختيار بـ`docs/run-logs/2026-09-23-a2-explanations-14/pick_median.ts 24 a2`، والتأليف بـ`a2e14.py` بحراسات الدفعة 13 نفسها، والتطبيق بـ`apply-explanation-batch.py` ⇒ **24/24، صفر متخطّى، صفر غير موجود**. والباني **رفض أربع مسوّدات** قبل الهبوط: عبارتان موضعيتان (`الثاني`) وطولان فوق السقف (215 و214 مقابل 212) — القاعدة هي التي رفضت، لا المؤلّف.

**القياس (لم يُلمَس إلا `explanationAr`).** تحت-60 في الجماعة **919 ⇒ 895** (السقف 625) · تحت-40 **851 ⇒ 827** · الوسيط **29 ⇒ 30** · `allUnder60Chars` **1,058 ⇒ 1,034** من 1,733 · `allMedianChars` **35 ⇒ 36** · المسافة **294 ⇒ 270** (12 دفعة باقية). وبلا حركة: مزيج المواضع · قرينة الطول 39.28% · أمانة البدائل 338/387 · مخالفات نطاق الكتابة 0 · `case:audit` `167645dd621b`. وفحص الاقتباسات: 432 شرحًا · **565** اقتباسًا ألمانيًّا · **0 misquote**.

**المتصفح على البناء المسلَّم.** `npm run test:e2e` ⇒ سطح المكتب **43/43** في 8.6 دقيقة والهاتف **43/43** في 7.6 دقيقة، خروج **0**. وحادثتان بيئيتان مقيسَتان لا مُجمَّلتان: (1) الجولة الأولى سقط فيها **43/43** بالرسالة `Executable doesn't exist` لأن مجلد متصفح Playwright ليس داخل لقطة المساحة؛ أُعيد تنصيبه مع مكتبات النظام فنجحت الجولة، ولا علاقة للمنتج. (2) وفي الجولة الثانية سقط أوّل اختبار ثقيل (`library and exam hubs`) عند سقفه الافتراضي 30 ثانية بينما كانت أربع مجموعات تعمل على الآلة نفسها (1.9 غيغابايت)، ونجح معزولًا في 33 ثانية زمنًا كليًّا، فصار يحمل `test.setTimeout(60_000)` والقياس مكتوبًا بجانبه. ولم تُخفَّف عبارة تحقُّق واحدة.

**المتصفح على البناء المسلَّم.** `npm run test:e2e` ⇒ سطح المكتب **43/43** في 8.6 دقيقة والهاتف **43/43** في 7.6 دقيقة، خروج **0**. وحادثتان بيئيتان مقيسَتان لا مُجمَّلتان: (1) الجولة الأولى سقط فيها **43/43** بالرسالة `Executable doesn't exist` لأن مجلد متصفح Playwright ليس داخل لقطة المساحة؛ أُعيد تنصيبه مع مكتبات النظام فنجحت الجولة، ولا علاقة للمنتج. (2) وفي جولة تالية سقط أوّل اختبار ثقيل (`library and exam hubs`) عند سقفه الافتراضي 30 ثانية بينما أربع مجموعات تعمل على الآلة نفسها (1.9 غيغابايت)، ونجح معزولًا في 33 ثانية زمنًا كليًّا، فصار يحمل `test.setTimeout(60_000)` والقياس مكتوبًا بجانبه. ولم تُخفَّف عبارة تحقُّق واحدة.

**حادثة الشجرة (تُسجَّل كما هي).** فُتح هذا الجيل على شجرةٍ مقطوعة: 133 ملفًا بلا `src/`، بينما `wegberlin-full.zip` المسلَّم سليم (1,787 ملفًا). الاستعادة تمّت من الأرشيف أولًا (1,789 ملفًا، ومنها حمولة الدفعة 13) ثم `npm ci` — وهو مسار الاستعادة المكتوب في المستودع نفسه. ومجلد `.git` ليس داخل الأرشيف، فقِيست هذه الدفعة بلا مستودع git؛ ولا بوابة تعتمد عليه (`secret:audit` يفحص الشجرة وحدها + نصّ الخطاف في CI).

**البوابات.** `npm run check` خروج **0** على الشجرة المستعادة: lint 0 · tsc 0 · **1,050 اختبارًا في 160 ملفًا** · `handoff:check` 0 · بناء **321/321 صفحة** · `offline:size` **`f3930d830a6b`** (a1 2,425,731 · a2 2,552,171 · b1 2,569,078 · b2 3,922,503 · **full 5,720,385**) · `js:budget` ‏110 / 1,753,459 / 250,914 · `media:budget` ‏544/52,943,843 والمنهاج 972,676 gzip · الكاش `dwnb-full-pack-v161` (staging/previous ‏v159) في سبعة ملفات. وأوّل بناء في هذا الجيل جرى **بلا swapfile** (‏1,984 ميغابايت، والمتاح 19 فقط) فتوقّف في مرحلة TypeScript من Next؛ أُعيد إنشاء ملف تبديل 2 غيغابايت فأنهى البناء نفسه نظيفًا — قياسُ بيئةٍ لا تغييرُ شيفرة.

## 54) جيل **v161** (2026-09-24) — الدفعة 15 من جماعة الوسيط: 871 تحت الستين والوسيط 31

**ما نُفِّذ (محتوى لا واجهة).** 24 شرحًا آخر في A2: أقصر 24 بندًا في جماعة الوسيط بعد الدفعة 14 (نطاق 25–28 حرفًا) ⇒ **160–206**. الاختيار بـ`docs/run-logs/2026-09-24-a2-explanations-15/pick_median.ts 24 a2`، والتأليف بـ`a2e15.py` بحراسات الدفعة 14، والتطبيق بـ`apply-explanation-batch.py` ⇒ **24/24**. والباني **رفض خمس مسوّدات** أولًا: أربع صياغات موضعية («الموضع»، «الثاني»، «الثالث») وطولٌ فوق السقف 212.

**القياس.** تحت-60 **895 ⇒ 871** (السقف 625) · تحت-40 **827 ⇒ 803** · الوسيط **30 ⇒ 31** · `allUnder60Chars` **1,034 ⇒ 1,010** من 1,733 · `allMedianChars` **36 ⇒ 37** · المسافة **270 ⇒ 246** (11 دفعة باقية). وبلا حركة: مزيج المواضع · قرينة الطول 39.28% · أمانة البدائل 338/387 · `case:audit` `167645dd621b`. وفحص الاقتباسات: **613** اقتباسًا ألمانيًّا و**0 misquote**.

**البوابات.** `npm run check` خروج **0**: lint 0 · tsc 0 · **1,050 اختبارًا في 160 ملفًا** · `handoff:check` 0 · بناء **321/321 صفحة** (تجميع 16.8 ثانية وتوليد 10.8 ثانية) · `offline:size` **`4ae21e02c1d5`** (a1 2,427,426 · a2 2,557,347 · b1 2,570,763 · b2 3,924,380 · **full 5,725,952**) · `js:budget` 110/1,755,058/250,914 · `media:budget` ‏544/52,943,843 والمنهاج 974,225 gzip · الكاش `dwnb-full-pack-v161` (staging/previous ‏v160) في سبعة ملفات.

**المتصفح على البناء المسلَّم.** `npm run test:e2e` ⇒ سطح المكتب **43/43** في 7.9 دقيقة والهاتف **42/43** في 13.2 دقيقة. والضحية على سطح المكتب في الجولة الأولى اختبارُ وسائط (`generated exam clips …`) عند سقفه الافتراضي 30 ثانية تحت حمل الجولة الكاملة، وقد نجح معزولًا في **29.8 ثانية** زمنًا كليًّا فصار يحمل `test.setTimeout(60_000)` والقياس مكتوبًا بجانبه. والضحيةُ الوحيدة على الهاتف هي **سقف 360 ثانية المعروف** لتثبيت الحزمة الكاملة (318 مسارًا و272 أصلًا صوتيًا على آلة 1.9 غيغابايت)، وقد نجح معزولًا على هذا البناء في **34.4 ثانية**. ولم تُخفَّف عبارة تحقُّق ولم يُتخطَّ مشروع.
