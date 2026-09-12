# Language and Bidi Fragment Audit

Generated: 2026-09-07  
Version: `language-boundary-audit-v1`  
Policy: `language-boundary-v1`  
Content SHA-256: `fc8df4bf20c2756b387c06b386912e58e81bda1b73c5551e8a9f2bbcb16e6ac2`

## Result

`PASS` — 172 TSX files and 6764 opening JSX tags were scanned.

| Contract | Count |
|---|---:|
| Explicit German fragments (lang=de + dir=ltr) | 384 |
| Explicit Arabic fragments (lang=ar + dir=rtl) | 4 |
| LTR tags audited | 421 |
| RTL tags audited | 4 |
| Auto-direction adaptive fragments | 2 |
| Technical/numeric/secret bidi scopes | 37 |
| Paired dynamic lang/dir expressions | 4 |
| bdi elements | 12 |
| Adaptive answer-bank consumers | 10 |
| Static Arabic + Latin text nodes under plaintext host policy | 235 |
| **Issues** | **0** |

## Enforced rules

- The application root is `<html lang="ar" dir="rtl">`.
- Every static German tag owns LTR; every static Arabic tag, including a regional tag such as `ar-TN`, owns RTL.
- Every LTR tag has either a German language or an explicit technical/numeric/secret scope.
- Dynamic language and direction expressions appear as a pair.
- Generic answer banks use `fragmentLanguageAttributes` to choose Arabic, German, mixed/auto, or technical direction from the actual string.
- Raw Unicode bidi override/isolate control characters are forbidden in TSX source.
- Arabic-host mixed static text uses a global `unicode-bidi: plaintext` paragraph boundary; explicit German/technical fragments use `isolate`.

## Mixed static fragments audited

| Source | Fragment | Policy |
|---|---|---|
| src/app/offline/page.tsx:1 | هذه صفحة إصلاح فعلية: افحص الحزمة، أعد المحاولة، أو عد إلى مورد محفوظ. لا تدعي توفر درس لم يتحقق Cache منه. | Arabic host + plaintext boundary |
| src/app/offline/page.tsx:1 | بعد الاكتمال أعد فتح Today وافحص جاهزية الجلسة. | Arabic host + plaintext boundary |
| src/app/offline/page.tsx:1 | العودة إلى Today | Arabic host + plaintext boundary |
| src/app/offline/page.tsx:1 | تقدمك في IndexedDB منفصل عن Cache المحتوى؛ إصلاح Offline لا يحذف أدلة التعلم. | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | نحفظ التقدم والمحاولات والخطة والملاحظات في IndexedDB داخل هذا المتصفح. التسجيلات المحلية في Media Store منفصل | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | أين يبقى مفتاح AI؟ | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | مفتاح Gemini أو OpenRouter وعنوان Ollama يبقى في | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | فقط. لا يدخل ملفات DWNB أو JSON ولا يرسل إلى خادم المنصة. | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | فقط عندما تختار مزودًا شبكيًا وتوافق صراحة على السؤال أو نص الكتابة الحالي. Gemini وOpenRouter وOllama قد يستق | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | استخدم `.dwnb` للاستعادة، ويمكن تشفيره بعبارة مرور. JSON الخام أو الصادرات الجزئية للقراءة والتحليل وليست للاس | Arabic host + plaintext boundary |
| src/app/privacy/page.tsx:3 | حزمة Whisper الاختيارية تطابق كلمات التسجيل محليًا فقط؛ لا نرسل Blob الصوت إلى AI ولا نحسب درجة نطق أو لهجة. | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:22 | كل مؤشر أدناه مشتق من محاولاتك الفريدة وتغطية الدروس وحداثة الدليل. لا نعرض قيم بداية ثابتة ولا نحولها إلى مست | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:38 | القيمة المعروضة Cache مشتق، وسجل الأحداث هو المرجع الجديد. | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:39 | مفاتيح قديمة بلا Event بعد | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:51 | لا نسجل ضغطات المفاتيح أو النص الوسيط أو حركة المؤشر. الزمن يستبعد مدة إخفاء الصفحة ويُحد عند 30 دقيقة، ولا يص | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:53 | الاحتفاظ لا يُثبت من كشف البطاقة لأول مرة؛ نحتاج نجاحًا بعد حلول موعد مؤجل، وأربع بطاقات مؤجلة ناجحة قبل وصف ا | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:58 | تدريجيًا بعد 30/90/180 يومًا. لا تحذف المحاولة ولا تغيّر الدرجة الخام أو mastery. | Arabic host + plaintext boundary |
| src/app/progress/page.tsx:63 | ليس حكم CEFR | Arabic host + plaintext boundary |
| src/app/review/page.tsx:57 | مراجعة SM-2 | Arabic host + plaintext boundary |
| src/app/review/page.tsx:57 | تظهر بطاقات الدروس المكتملة وبطاقات العلاج الشخصية بعد تأكيد التصحيح المؤجل، مرتبة حسب موعد SM-2. لا تدخل مفرد | Arabic host + plaintext boundary |
| src/app/review/page.tsx:59 | كشف البطاقة أول مرة لا يرفع إتقان الدرس. الزيادة لا تحدث إلا عند نجاح بطاقة درس بعد أن يحين موعدها؛ بطاقة الخط | Arabic host + plaintext boundary |
| src/components/a1-level-assessment.tsx:23 | بوابة A1 — تقييم داخلي غير رسمي | Arabic host + plaintext boundary |
| src/components/a1-level-assessment.tsx:23 | لا يفتح النظام A2 من علامة اختيارات فقط. يجب إكمال المسار وتقديم أدلة كتابة ومحادثة وتشخيص أولي. | Arabic host + plaintext boundary |
| src/components/a1-level-assessment.tsx:26 | تقييم نهاية A1 | Arabic host + plaintext boundary |
| src/components/a1-level-assessment.tsx:26 | 48 سؤالًا يغطي الوحدات الثماني. أجب دون فتح الدروس. النتيجة المعرفية لا تكفي وحدها لفتح A2. | Arabic host + plaintext boundary |
| src/components/a1-level-assessment.tsx:26 | إنهاء وحساب بوابة A1 | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:20 | بوابة A2 — تقييم داخلي غير رسمي | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:20 | تحتاج البوابة إلى نجاح معرفي، إكمال المسار، عينات كتابة ومحادثة مرتبطة بـA2، وبوابة A1 السابقة. | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:22 | نتيجة المعرفة حسب وحدة A2 | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:23 | تقييم نهاية A2 | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:23 | 48 سؤالًا متوازنًا على ثماني وحدات. بعدها تُفحص أدلة الكتابة والمحادثة وإكمال المسار قبل B1. | Arabic host + plaintext boundary |
| src/components/a2-level-assessment.tsx:23 | إنهاء وحساب بوابة A2 | Arabic host + plaintext boundary |
| src/components/accessibility-preferences-control.tsx:105 | Live-Vorschau · معاينة مباشرة | Arabic host + plaintext boundary |
| src/components/ai-provider-capability-matrix.tsx:57 | حد 0 USD | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:16 | بوابة B1 — تقييم داخلي غير رسمي | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:16 | لا يكفي اختبار الاختيارات. تُفحص بوابة A2 وإكمال 24 درسًا وخمس كتابات وخمس محاولات محادثة مرتبطة بـB1. | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:16 | نتيجة المعرفة حسب وحدة B1 | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:17 | تقييم نهاية B1 | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:17 | ثم ابدأ B2. | Arabic host + plaintext boundary |
| src/components/b1-level-assessment.tsx:17 | إنهاء وحساب بوابة B1 | Arabic host + plaintext boundary |
| src/components/b2-level-assessment.tsx:84 | بوابة B2 — تقييم تعلم داخلي غير رسمي | Arabic host + plaintext boundary |
| src/components/b2-level-assessment.tsx:108 | نتيجة المعرفة حسب وحدة B2 | Arabic host + plaintext boundary |
| src/components/b2-level-assessment.tsx:135 | تقييم نهاية B2 | Arabic host + plaintext boundary |
| src/components/b2-level-assessment.tsx:137 | 48 سؤالًا موزعة بالتساوي على الوحدات الست، مع بوابة إنتاج تمنع تحويل B2 إلى اختبار تعرّف فقط. | Arabic host + plaintext boundary |
| src/components/b2-level-assessment.tsx:143 | لا يخلط صيغة Goethe بصيغة telc ولا يمثل امتحانًا رسميًا. بعده تُراجع متطلبات الجهة التي اخترتها بصورة منفصلة. | Arabic host + plaintext boundary |
| src/components/bilingual-search-view.tsx:42 | يفتش في الدروس والعبارات والقواعد وعيادات الأخطاء والمكتبة ومهام الامتحان. يعمل دون AI ولا يرسل ما تكتبه إلى أ | Arabic host + plaintext boundary |
| src/components/bilingual-search-view.tsx:44 | من A1 إلى B2 | Arabic host + plaintext boundary |
| src/components/bilingual-search-view.tsx:77 | يمكنك الكتابة بالألمانية أو العربية، ولا يلزم استعمال الحركات أو كتابة Umlaut بدقة. | Arabic host + plaintext boundary |
| src/components/branching-conversation-lab.tsx:91 | محادثة متفرعة دون AI | Arabic host + plaintext boundary |
| src/components/branching-conversation-lab.tsx:95 | لا شخص حقيقي ولا AI يتظاهر بفهم كلامك | Arabic host + plaintext boundary |
| src/components/branching-conversation-lab.tsx:115 | الاختيار المنظم تدريب تواصلي، لا درجة كلام أو CEFR. | Arabic host + plaintext boundary |
| src/components/branching-conversation-lab.tsx:143 | نحفظ معرفات الخيارات والنتيجة وعدد فتحات الدعم فقط. لا نص حر، لا شبكة، لا AI، لا شريك حي، ولا mastery. | Arabic host + plaintext boundary |
| src/components/coach-dashboard.tsx:204 | سياسة الاستمرارية · weekly-grace-v1: | Arabic host + plaintext boundary |
| src/components/coach-dashboard.tsx:212 | تقدير تخطيط شفاف للدروس والبوابات وعينات الجهة المختارة؛ ليس احتمال نجاح أو نتيجة رسمية ولا يغيّر mastery. | Arabic host + plaintext boundary |
| src/components/collocation-network-lab.tsx:33 | محلي ودون AI | Arabic host + plaintext boundary |
| src/components/collocation-network-lab.tsx:42 | هذه نتيجة جولة محلية صغيرة، وليست حكم مفردات أو CEFR. راجع الفرق ثم استعمل تركيبًا في درس أو كتابة فعلية. | Arabic host + plaintext boundary |
| src/components/collocation-network-lab.tsx:43 | نحفظ معرفات الوصلات والعدد فقط، لا نصًا حرًا ولا نضيف بطاقات SRS تلقائيًا. | Arabic host + plaintext boundary |
| src/components/collocation-network-lab.tsx:43 | المطابقة حتمية من بنك مؤلف. لا AI، لا شبكة، لا mastery، ولا ادعاء أن هذه كل التراكيب الممكنة. | Arabic host + plaintext boundary |
| src/components/content-error-report-control.tsx:26 | يرفق النموذج العنوان والمسار ومعرف المحتوى وإصدار التطبيق فقط. لا يرفق Answer key أو تقدمك أو مفاتيحك أو نص إن | Arabic host + plaintext boundary |
| src/components/content-error-report-control.tsx:28 | نسخ JSON الآمن | Arabic host + plaintext boundary |
| src/components/content-error-report-control.tsx:28 | تنزيل JSON | Arabic host + plaintext boundary |
| src/components/content-error-reports-manager.tsx:22 | لا توجد مزامنة أو إرسال تلقائي إلى GitHub أو البريد. | Arabic host + plaintext boundary |
| src/components/content-governance-summary.tsx:6 | كل عائلة منشورة تمر عبر Draft → Validated → Published ولها مالك ودور مراجعة منفصل. | Arabic host + plaintext boundary |
| src/components/content-note-control.tsx:22 | Meine Notiz · ملاحظتي | Arabic host + plaintext boundary |
| src/components/content-notes-manager.tsx:18 | DWNB ينقل هذه السجلات مع ملفك. لا نحفظ جواب التمرين تلقائيًا ولا نرسل النص إلى مزود. | Arabic host + plaintext boundary |
| src/components/context-appropriateness-quiz.tsx:1 | اختر الصيغة الأنسب للموقف، ثم اقرأ سبب الملاءمة. لا تُمنح mastery من هذا المختبر. | Arabic host + plaintext boundary |
| src/components/daily-focus-tools.tsx:23 | ابدأ Quick Practice | Arabic host + plaintext boundary |
| src/components/daily-focus-tools.tsx:28 | صدّر DWNB الآن | Arabic host + plaintext boundary |
| src/components/data-usage-preferences-control.tsx:1 | يمنع تنزيل الصوت الاختياري ونموذج WebGPU الكبير. لا يوجد Autoplay أصلًا. | Arabic host + plaintext boundary |
| src/components/delivery-health-dashboard.tsx:24 | تجمع هذه اللوحة عقود المحتوى والأصول المبنية وقدرات المتصفح الحالية. لا تستبدل CI أو المراجعة البشرية أو المرا | Arabic host + plaintext boundary |
| src/components/delivery-health-dashboard.tsx:26 | MP3 في السجلات | Arabic host + plaintext boundary |
| src/components/delivery-health-dashboard.tsx:26 | قدرات Runtime | Arabic host + plaintext boundary |
| src/components/diagnostic-productive-sample.tsx:101 | Kurze Schreibprobe · عينة كتابة قصيرة | Arabic host + plaintext boundary |
| src/components/diagnostic-productive-sample.tsx:102 | Kurze Sprechprobe · عينة كلام اختيارية | Arabic host + plaintext boundary |
| src/components/diagnostic-productive-sample.tsx:104 | Wie selbstständig war das? · كيف كان إنتاجك؟ | Arabic host + plaintext boundary |
| src/components/diagnostic-productive-sample.tsx:107 | لا يوجد تصحيح أو تقدير CEFR لهذه العينة. | Arabic host + plaintext boundary |
| src/components/diagnostic-view.tsx:109 | الثقة تخص هذه العينة فقط، ولا تساوي حكم CEFR رسميًا. | Arabic host + plaintext boundary |
| src/components/diagnostic-view.tsx:118 | Produktionsprobe · العينة الإنتاجية | Arabic host + plaintext boundary |
| src/components/diagnostic-view.tsx:129 | استمع دون فتح النص. إن رفض جهازك MP3 يظهر بديل صوت المتصفح تلقائيًا؛ كلاهما تدريبي وغير امتحاني. | Arabic host + plaintext boundary |
| src/components/dictation-lab.tsx:144 | استمع أولًا، اكتب قدر المستوى، ثم قارن موضع الخطأ وأعد المحاولة. يبدأ A1 بفراغات محددة ويتدرج حتى جمل B2 الكام | Arabic host + plaintext boundary |
| src/components/dictation-lab.tsx:148 | 4 لكل مستوى · دون AI أو شبكة من المنصة | Arabic host + plaintext boundary |
| src/components/dictation-lab.tsx:225 | هذا تدريب إملائي محلي القواعد، وليس اختبار CEFR أو درجة استماع رسمية. لا يرسل التطبيق النص أو الصوت إلى Gemini | Arabic host + plaintext boundary |
| src/components/error-notebook.tsx:110 | دخلت بطاقة علاج شخصية إلى SRS. | Arabic host + plaintext boundary |
| src/components/error-notebook.tsx:110 | تظهر مرة واحدة بعد تأكيد العلاج المؤجل، ولا تضيف mastery عند مراجعتها. | Arabic host + plaintext boundary |
| src/components/error-notebook.tsx:111 | يبقى داخل التطبيق وملف DWNB؛ الإخفاء يخص الطباعة فقط. | Arabic host + plaintext boundary |
| src/components/evidence-achievements.tsx:8 | لا تُفتح بزيارة صفحة أو تكرار نقرة، ولا تضيف mastery أو شهادة. | Arabic host + plaintext boundary |
| src/components/exam-hub.tsx:64 | ملفا Goethe وtelc منفصلان في البنية والتوقيت والنقاط وقاعدة النجاح. كل تدريب مرتبط بمصدر رسمي وإصدار تحقق. | Arabic host + plaintext boundary |
| src/components/exam-hub.tsx:119 | بيان الصوت يدقق كل مهمة وكل مقطع؛ غير المغطى يعمل عبر Browser TTS. المحاكاة موجهة ومحفوظة محليًا، وليست جلسة م | Arabic host + plaintext boundary |
| src/components/exam-hub.tsx:163 | بوابة B2 الداخلية | Arabic host + plaintext boundary |
| src/components/exam-print-tools.tsx:1 | ورقة تدريب محلية غير رسمية · Goethe وtelc لا يختلطان. | Arabic host + plaintext boundary |
| src/components/four-skill-vocabulary-cycle.tsx:1 | القراءة ظاهرة في سياق قصير، والصوت TTS اصطناعي. تثبيت الكلام تقرير ذاتي؛ لا يستمع التطبيق ولا يمنح mastery. | Arabic host + plaintext boundary |
| src/components/grammar-progression-map.tsx:8 | 24 قاعدة محورية مرتبة بعلاقات تدريس فعلية. الأسهم تعني «تعلم هذا أولًا»، لا حكم CEFR رسميًا ولا إتقانًا بالتصف | Arabic host + plaintext boundary |
| src/components/hybrid-writing-review.tsx:24 | ليس تقييم مدرس رسميًا ولا حكم CEFR. | Arabic host + plaintext boundary |
| src/components/hybrid-writing-review.tsx:25 | للاستعانة بـGemini عند الشك، اختر Gemini BYOK من | Arabic host + plaintext boundary |
| src/components/hybrid-writing-review.tsx:26 | مراجعة Gemini استشارية | Arabic host + plaintext boundary |
| src/components/hybrid-writing-review.tsx:26 | لم يُرجع Gemini مشكلة محددة بعقده؛ لا يعني ذلك أن النص خالٍ من الأخطاء. | Arabic host + plaintext boundary |
| src/components/hybrid-writing-review.tsx:26 | لا درجة رسمية، لا mastery، ولا بديل مضمون عن مدرس بشري للحالات المعقدة. | Arabic host + plaintext boundary |
| src/components/information-gap-lab.tsx:35 | افتح بطاقة الشخص A فقط | Arabic host + plaintext boundary |
| src/components/lesson-listening-player.tsx:35 | بديل Browser TTS | Arabic host + plaintext boundary |
| src/components/lesson-listening-player.tsx:35 | المصدر وSHA-256 | Arabic host + plaintext boundary |
| src/components/lesson-listening-sequence.tsx:88 | بعد بدء MP3 أو Browser TTS يظهر سؤال الفكرة العامة. لا تحتاج إلى التقاط كل كلمة. | Arabic host + plaintext boundary |
| src/components/lexical-strategy-explorer.tsx:37 | كل مراجعة وحدة تتكون من عشرة أسئلة. النسبة محسوبة إصداريا؛ أول وحدة 0% لعدم وجود مادة سابقة، ثم 20% في A1 و30% | Arabic host + plaintext boundary |
| src/components/library-audio-player.tsx:52 | بديل Browser TTS | Arabic host + plaintext boundary |
| src/components/library-view.tsx:9 | من A1 إلى B2 | Arabic host + plaintext boundary |
| src/components/library-view.tsx:13 | Prüfungslesen: المساعدات والمعنى والاستراتيجية مخفية. | Arabic host + plaintext boundary |
| src/components/local-error-classifier.tsx:1 | نموذج Naive Bayes صغير يتدرب مؤقتًا داخل المتصفح؛ الاقتراح ليس تشخيصًا ولا مصححًا كاملًا ولا يغير mastery. | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:22 | نموذج Whisper صغير يعمل داخل Web Worker على جهازك بعد تنزيل صريح مرة واحدة. | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:25 | نحو 70–90 MB | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:25 | قد تختلف مساحة Cache الفعلية حسب المتصفح وملفات ONNX المطلوبة. | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:26 | إصدار ONNX مثبت، والتنزيل الجديد يُحظر عند تقادم التحقق. | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:30 | يطلب المتصفح أوزانًا من Hugging Face ثم يحفظها محليًا. لا يُرسل اسمك أو تقدمك أو تسجيلاتك. | Arabic host + plaintext boundary |
| src/components/local-pronunciation-model-control.tsx:35 | المطابقة تقول ما إذا استطاع ASR سماع الكلمات المتوقعة. فشل كلمة قد يكون من الضوضاء أو الميكروفون، وليس حكمًا ق | Arabic host + plaintext boundary |
| src/components/motivation-preferences-control.tsx:21 | الإخفاء فوري ومحلي ولا يحذف الأدلة ولا يخفض الإتقان أو الاستمرارية الفعلية. لا عقوبة ولا Dark pattern لإعادة ا | Arabic host + plaintext boundary |
| src/components/offline-pack-control.tsx:291 | مقارنة Metadata فقط؛ ليست Diff دلالية للمحتوى ولا تثبت الحزمة تلقائيًا. | Arabic host + plaintext boundary |
| src/components/partial-study-export.tsx:1 | اختر التقدم أو SRS أو الكتابة أو الكلام أو بيانات الصوت. | Arabic host + plaintext boundary |
| src/components/partial-study-export.tsx:1 | تنزيل JSON انتقائي | Arabic host + plaintext boundary |
| src/components/partial-study-export.tsx:1 | لا أسرار، ولا استعادة من هذا JSON. استخدم DWNB الكامل لاستعادة الحالة وملفات الصوت. | Arabic host + plaintext boundary |
| src/components/path-view.tsx:37 | اختبار وبوابة مستوى A1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الأولى A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-01–03 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الثانية A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-04–06 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الثالثة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-07–09 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الرابعة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-10–12 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الخامسة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-13–15 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة السادسة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-16–18 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة السابعة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-19–21 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | مراجعة ومشروع الوحدة الثامنة A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | الدروس A2-22–24 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:38 | اختبار وبوابة مستوى A2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الأولى B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-01–03 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الثانية B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-04–06 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الثالثة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-07–09 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الرابعة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-10–12 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الخامسة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-13–15 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة السادسة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-16–18 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة السابعة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-19–21 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | مراجعة ومشروع الوحدة الثامنة B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | الدروس B1-22–24 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:39 | اختبار وبوابة مستوى B1 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة الأولى B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-01–02 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة الثانية B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-03–04 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة الثالثة B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-05–06 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة الرابعة B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-07–08 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة الخامسة B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-09–10 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | مراجعة ومشروع الوحدة السادسة B2 | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | الدروس B2-11–12 · مكتملة | Arabic host + plaintext boundary |
| src/components/path-view.tsx:40 | بوابة الجاهزية النهائية B2 | Arabic host + plaintext boundary |
| src/components/personal-vocabulary-import.tsx:20 | TSV محلي Preview-first؛ منفصل عن المنهج وSRS والإتقان. | Arabic host + plaintext boundary |
| src/components/personal-vocabulary-import.tsx:22 | اختر ملف TSV للفحص | Arabic host + plaintext boundary |
| src/components/personal-vocabulary-import.tsx:26 | لا تصبح المفردة دليلًا أو بطاقة SRS أو جزءًا من المحتوى المنشور بمجرد الاستيراد. | Arabic host + plaintext boundary |
| src/components/phrase-recall-deck.tsx:45 | Deutsch → العربية | Arabic host + plaintext boundary |
| src/components/phrase-recall-deck.tsx:45 | العربية → Deutsch | Arabic host + plaintext boundary |
| src/components/plan-change-timeline.tsx:1 | لا نص إجابة أو ملاحظة Reflection · لا mastery · لا عقوبة · مشتق من سجلات التخطيط القابلة للحذف مع حالتها الأصل | Arabic host + plaintext boundary |
| src/components/planning-preferences-control.tsx:16 | لا رفع تلقائي: «مكثفة» لا تطبق إلا بعد اختيارك. Check-in والطاقة و«لدي وقت أقل» تستطيع دائمًا خفضها. | Arabic host + plaintext boundary |
| src/components/planning-preferences-control.tsx:16 | إشعار الموعد الامتحاني النشط يبقى Safety exception لأن ساعته لا تتوقف. | Arabic host + plaintext boundary |
| src/components/planning-preferences-control.tsx:16 | العقد وساعات الهدوء لا يغيران mastery أو correctness أو بوابات المستويات. لا يطلب التطبيق إذن Notifications ول | Arabic host + plaintext boundary |
| src/components/practical-day-mode.tsx:1 | يحفظ السجل السيناريو والخطوات وأطوال الرد فقط، لا نص المعاملة. لا إرسال ولا نتيجة لغوية ولا mastery. | Arabic host + plaintext boundary |
| src/components/pronunciation-articulation-lab.tsx:34 | vereinfachte Lernskizze · رسم تعليمي مبسط | Arabic host + plaintext boundary |
| src/components/pronunciation-articulation-lab.tsx:94 | Hörprobe starten · ابدأ عينة مخفية | Arabic host + plaintext boundary |
| src/components/pronunciation-articulation-lab.tsx:102 | النتيجة تقيس مطابقة اختيارك لعينة Browser TTS الاصطناعية فقط. لا تستمع المنصة إلى نطقك، ولا تمنح درجة نطق أو ط | Arabic host + plaintext boundary |
| src/components/prosody-progression-panel.tsx:3 | Hörprobe · عينة اصطناعية | Arabic host + plaintext boundary |
| src/components/raw-data-export.tsx:6 | نسخة JSON واحدة لكل IndexedDB Store مع مفاتيحه وقاموس يشرح محتواه. | Arabic host + plaintext boundary |
| src/components/raw-data-export.tsx:6 | يشمل الوسائط ونقاط الاستعادة كـBase64، لكنه لا يشمل Session Storage أو مفتاح API. للاستعادة استخدم `.dwnb` فقط | Arabic host + plaintext boundary |
| src/components/reading-benchmark.tsx:55 | الحد: `planning-only-no-cefr-or-mastery`. الكلمات/دقيقة تضبط وقت القراءة فقط ولا تصبح درجة لغة أو امتحان. | Arabic host + plaintext boundary |
| src/components/redemittel-bank.tsx:1 | 32 عبارة مؤلفة · formal/neutral/colloquial/professional · لا تمنح دليلًا أو mastery بمجرد عرضها. | Arabic host + plaintext boundary |
| src/components/resilient-audio-player.tsx:93 | إعادة تحميل MP3 | Arabic host + plaintext boundary |
| src/components/separated-rubrics.tsx:1 | عام وGoethe وtelc — دون خلط | Arabic host + plaintext boundary |
| src/components/session-ritual-preferences-control.tsx:4 | تفضيل محلي فقط · `optional-session-rituals-v1` · التأمل الأسبوعي مستقل عن هذا المفتاح. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:203 | تقدمك في IndexedDB. مفتاح AI أو عنوان Ollama يبقى في Session Storage ويُستبعد من النسخ الاحتياطية. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:220 | لوحة واحدة للمكتمل والناقص والفاشل في المحتوى والصوت وقدرات Runtime الحالية. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:223 | ملف محمول قابل للتحقق بـSHA-256. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:225 | التسجيلات الصوتية محفوظة في Media Store منفصل. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:228 | تصدير .dwnb | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:229 | يشمل التقدم والخطة والأخطاء والكتابة وسجل المرشد المنظم، ويمكن تضمين التسجيلات وتشفير الحمولة بـAES-GCM. عبارة | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:230 | دعم نسخ DWNB القديمة | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:230 | v1 قديم ومدعوم للاستيراد حتى 2027-03-31 مع تحذير واضح. v2 غير مشفر وv3 مشفر صيغتان حاليتان، ومضمون دعمهما على  | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:237 | عنوان Ollama المحلي | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:237 | مفتاح API | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:240 | طلب Descriptor واحد بموافقتك، بلا محتوى تعليمي. unknown تعني أن الوصف لم يصرّح، ولا نخمّن من الاسم. | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:242 | يسأل المرشد موافقتك قبل كل نص يُرسل إلى Gemini أو OpenRouter أو Ollama. Gemini مقيد بالموديلات المتحققة، وOpen | Arabic host + plaintext boundary |
| src/components/settings-view.tsx:255 | المفتاح أو عنوان Ollama المؤقت | Arabic host + plaintext boundary |
| src/components/shadowing-studio.tsx:148 | ملف MP3 متاح | Arabic host + plaintext boundary |
| src/components/shadowing-studio.tsx:148 | للتقليد دون TTS | Arabic host + plaintext boundary |
| src/components/skill-diagnostic-retest.tsx:7 | كل عينة تسأل سؤالًا واحدًا من A1 إلى B2 وتحفظ منفصلة. لا تستبدل تشخيصك العام ولا تفتح مستوى. | Arabic host + plaintext boundary |
| src/components/speaking-lab.tsx:438 | يحوّل نموذج Whisper التسجيل مؤقتًا إلى نص ألماني، ثم يبحث عن كلمات المهمة. هذه ليست درجة نطق أو لهجة. | Arabic host + plaintext boundary |
| src/components/speaking-lab.tsx:452 | رتّب بنموذج WebGPU المحلي | Arabic host + plaintext boundary |
| src/components/speech-preferences-control.tsx:1 | Hörprobe · معاينة | Arabic host + plaintext boundary |
| src/components/speech-preferences-control.tsx:1 | هذا TTS اصطناعي وليس صوت امتحان ولا تقييم نطق. الاختيار محفوظ في IndexedDB ولا يُرسل. | Arabic host + plaintext boundary |
| src/components/study-export-control.tsx:18 | تقويم ICS، تقرير أسبوعي قابل للطباعة/PDF، وبطاقات Anki TSV دون خادم. | Arabic host + plaintext boundary |
| src/components/study-export-control.tsx:20 | لا تسجيلات · لا API keys · لا كتابة أو محادثة حرة · DWNB وحده قابل للاستعادة | Arabic host + plaintext boundary |
| src/components/study-export-control.tsx:21 | تنزيل ICS | Arabic host + plaintext boundary |
| src/components/study-export-control.tsx:22 | الاسم اختياري، ولا تدخل الوسائط أو مفاتيح AI أو النصوص الحرة. TSV للدراسة فقط ولا يستعيد التقدم؛ استخدم `.dwnb | Arabic host + plaintext boundary |
| src/components/targeted-choice-simulation.tsx:77 | هذا تدريب جزئي أصلي. النتيجة لا تمثل مجموع telc الكتابي ولا تُدمج مع نظام نقاط Goethe. | Arabic host + plaintext boundary |
| src/components/targeted-listening-simulation.tsx:201 | TTS بديل | Arabic host + plaintext boundary |
| src/components/targeted-writing-simulation.tsx:122 | راجع النص بنفسك وفق النقاط قبل إنشاء نسخة ثانية. لا تعرض المنصة درجة Goethe أو telc اعتمادًا على عد الكلمات وا | Arabic host + plaintext boundary |
| src/components/targeted-writing-simulation.tsx:151 | اختر المهمة A أو B أولًا | Arabic host + plaintext boundary |
| src/components/tutor-view.tsx:230 | Zum letzten Antwort · متابعة آخر جواب | Arabic host + plaintext boundary |
| src/components/tutor-view.tsx:239 | Ich heiße أم Ich bin؟ | Arabic host + plaintext boundary |
| src/components/tutor-view.tsx:240 | مكان الفعل بعد weil | Arabic host + plaintext boundary |
| src/components/tutor-view.tsx:241 | Dativ مع mit | Arabic host + plaintext boundary |
| src/components/unified-concept-map.tsx:1 | Grammatik · القواعد | Arabic host + plaintext boundary |
| src/components/unified-concept-map.tsx:1 | Wortschatz · المفردات | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:81 | ترتيب دلالي محلي لأسئلة المتابعة عبر WebGPU، وليس معلمًا أو مصحح نطق. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:89 | نحو 130–150 MB | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:89 | الأوزان الكمية المعلنة 118 MB، ويضاف Tokenizer وRuntime. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:90 | Runtime 4.2.0 وأوزان ONNX مثبّتة الإصدار؛ التقادم يمنع تنزيلًا جديدًا. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:91 | يرتب أسئلة مؤلفة مسبقًا؛ لا يولد درجة CEFR ولا يفهم الصوت. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:94 | وضع البيانات المنخفضة مفعّل: تنزيل 130–150 MB محظور حتى توقفه صراحة من الإعدادات. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:95 | التنزيل يطلب ملفات الأوزان من Hugging Face، ثم يحفظها في Cache Storage مخصص. لا يُرسل تقدمك أو تسجيلاتك. | Arabic host + plaintext boundary |
| src/components/webgpu-model-control.tsx:109 | لا تنزيل تلقائي ولا WASM fallback صامت. عند غياب WebGPU أو فشل الذاكرة/المساحة يبقى السؤال الحتمي المحلي وOlla | Arabic host + plaintext boundary |
| src/components/weekly-reflection.tsx:12 | Wöchentlicher Rückblick · تأمل أسبوعي مستقل | Arabic host + plaintext boundary |
| src/components/writing-device-benchmark.tsx:47 | الحد: `device-input-planning-only-no-language-score`. لا تدخل السرعة في تقييم نصك أو بوابات المستوى. | Arabic host + plaintext boundary |
| src/components/writing-repair-practice.tsx:20 | محلية وحتمية: لا يُرسل نصك إلى AI، ولا يظهر التصحيح قبل تثبيت محاولة. | Arabic host + plaintext boundary |
| src/components/writing-repair-practice.tsx:30 | Ihre Korrektur · تصحيحك | Arabic host + plaintext boundary |
| src/components/writing-repair-practice.tsx:31 | Prüfen · تحقق | Arabic host + plaintext boundary |
| src/components/writing-repair-practice.tsx:31 | Noch einmal · أعد | Arabic host + plaintext boundary |
| src/components/writing-repair-practice.tsx:32 | هذا علاج شخصي ولا يرفع mastery أو بوابة المستوى. | Arabic host + plaintext boundary |

## Boundary

Static source and production DOM checks prove explicit lang/dir pairing, adaptive answer-bank classification, and bidi containment policy. They do not replace physical browser/screen-reader review of spoken order.
