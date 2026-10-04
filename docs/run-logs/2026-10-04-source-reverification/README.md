# إعادة التحقق من مصادر التوثيق — 2026-10-04

**الحالة: مُقَرّ من المالك.** عُرض هذا الجدول على المالك (naderba69) في جلسة Arena بتاريخ 2026-10-04 قبل أي تسجيل، فأقرّ تسجيل 2026-10-04 للسجلّات الـ18 كلها، بما فيها سجلّ نموذج telc الذي ثبت رابطه ولم يُفتح أرشيفه وقت الإقرار (البند 1 في «ما لم يُقرأ»)؛ **ثم فُتح الأرشيف لاحقًا في اليوم نفسه من مشغّل GitHub** (القسم الأخير: «إعادة فتح أرشيف telc»). الإقرار قرار المالك لا قراءة الوكيل وحدها (ADR-108).

## لماذا الآن

عند 2026-10-03T23:00Z (منتصف ليل تونس) تجاوزت 12 سجلًّا من 19 نافذة الثلاثين يومًا (`lastVerifiedAt = 2026-09-03`)، فخرج `npm run source:audit -- --strict` بالرمز 1 وسقط `check` في CI (التفاصيل والآلية: م44 في `docs/LEARNING_REPAIRS_AR.md`). ستة سجلّات أخرى (متصفح/نماذج) تنتهي نافذتها في 2026-10-08 و2026-10-12، فلو سُجّلت الاثنا عشر وحدها لاحمرّ CI ثانيةً خلال أيام. السجلّ `onnxruntime-web-webgpu-1-26-dev-20260416` حديث (2026-10-02، يستحق 2026-11-01) ولم يُمسّ.

## الطريقة وحدّها

- أُجريت القراءة من جلسة وكيل برمجي (Arena) في 2026-10-04 بأداة جلب الويب: لكل سجلّ فُتحت الصفحة/الملف الرسمي وقورن ما فيه بـ`observedState` و`claimAr` المخزّنين، لا بحالة الرابط فقط (قائمة `docs/SOURCE_FRESHNESS.md` §Human review checklist).
- **هذه مراجعة بمساعدة وكيل، لا فتحًا يدويًا مستقلًّا لكل صفحة.** وضع السجلّ `manual-semantic-review` وتسمية الواجهة «آخر تحقق بشري» مرتبطان بمراجعة بشرية؛ فلا يُكتب التاريخ إلا إذا أقرّ المالك هذا الجدول، ومسؤولية الإقرار عليه.
- قراءة الوكيل ليست دليلًا قانونيًّا ولا اعتمادًا رسميًّا: الصفحة تثبت ما قالته وقت القراءة فقط (`Integrity boundary` في `docs/SOURCE_FRESHNESS.md`).

## ما قُرئ (18 سجلًّا)

| # | السجلّ (`id`) | المصدر | المسجَّل سابقًا (`observedState`) | المقروء في 2026-10-04 | النتيجة |
|---|---|---|---|---|---|
| 1 | `goethe-b2-overview-2026` | goethe.de · صفحة Goethe-Zertifikat B2 | أربع وحدات تُجتاز منفصلة: Lesen / Hören / Schreiben / Sprechen | الصفحة تقول: يتكوّن الامتحان من وحدات الاستماع والقراءة والكتابة والمحادثة (شفهي بمتقدّمَين اثنين)، وتُقدَّم الوحدات الأربع منفردة أو مجتمعة؛ ورابط «Terms and conditions» (`Durchfuehrungsbestimmungen_B2.pdf`) ما زال قائمًا | ✓ مطابق |
| 2 | `goethe-b2-terms-2025` | goethe.de · PDF شروط الإجراء | آخر تحديث 2025-09-01؛ القراءة 65 والاستماع ≈40 والكتابة 75 والمحادثة ≈15 دقيقة | الغلاف «Stand: 1. September 2025 / Last updated: September 1, 2025»؛ §1.1 أربع وحدات (ثلاث كتابية جماعية + شفهية بالأزواج أو استثناءً فرديّة)؛ §1.4 القراءة 65 د، الاستماع ≈40 د، الكتابة 75 د (مجموع ≈180 د)، المحادثة بالأزواج ≈15 د (الفردي ≈10 د) مع 15 د تحضير | ✓ مطابق (قُرئ §1 فقط) |
| 3 | `goethe-b2-model-2025` | goethe.de · PDF Modellsatz Erwachsene | الطبعة الثانية أغسطس 2025؛ حدّ النجاح 60/100 لكل وحدة؛ جدول الأجزاء/العناصر | «2. Auflage August 2025»؛ «maximal 100 Punkte pro Modul … Bestehensgrenze 60 Punkte (60 Prozent)»؛ جدول الأجزاء: Lesen 5 أجزاء (9+6+6+6+3 = 30 عنصرًا، 65 د)، Hören 4 أجزاء (30 عنصرًا، 40 د)، Schreiben جزءان (50+25 د)، Sprechen جزءان | ✓ مطابق |
| 4 | `telc-b2-overview-2026` | telc.net · صفحة telc Deutsch B2 | امتحان كتابي وشفهي؛ 3 قراءة، 2 عناصر لغوية، 3 استماع، 1 كتابة، 3 محادثة | جدول الصفحة: القراءة 3 أجزاء/90 د بلا فاصل، العناصر اللغوية جزءان، الاستماع 3 أجزاء ≈20 د، الكتابة جزء/30 د، المحادثة 3 أجزاء ≈15 د (بالأزواج، 20 د تحضير)؛ متاح رقميًا/هجينًا/ورقيًّا | ✓ مطابق |
| 5 | `telc-b2-mock-2019-current-link` | telc.net · أرشيف Übungstest 1 | الصفحة الرسمية ما زالت تربط إلى أرشيف النموذج المجاني (طبعة 2019) | الصفحة ما زالت تعرض «telc Deutsch B2 Übungstest 1 — download the mock examination and the corresponding audio files free of charge» بنفس الرابط `…/telc_deutsch_b2.zip` | ◐ وقت الإقرار: الرابط ✓ و**محتوى الأرشيف لم يُفتح** (TLS إلى telc.net مقطوع من البيئة، وأداة الجلب أعادت HTTP 500 للملف). ✓ **بعده فُتح من مشغّل GitHub**: الحقائق السبع حاضرة في نص الـPDF (انظر القسم الأخير) |
| 6 | `gemini-api-pricing-2026-09` | ai.google.dev · الأسعار | Gemini 2.5 Flash وFlash-Lite يعرضان طبقة مجانية للنص (إدخال/إخراج)؛ توجد طبقات مدفوعة | `gemini-2.5-flash` و`gemini-2.5-flash-lite` (Standard): الطبقة المجانية «Free of charge» إدخالًا وإخراجًا، والمدفوعة موجودة؛ `gemini-3.1-pro-preview`: «Not available» في المجانية (وهو ما يرفضه التطبيق)؛ «Used to improve our products: Yes» للمجانية (يطابق تنبيه الخصوصية). صفحة الأسعار تعرض الآن نماذج 3.5–3.8 خارج قائمة السماح، ولا أثر. صفحة الإيقاف (محدّثة 2026-10-01): لا موعد إيقاف معلن للنموذجين | ✓ مطابق |
| 7 | `gemini-api-limits-2026-09` | ai.google.dev · الحدود | تختلف الحدود بالمشروع والنموذج والطبقة؛ تُقرأ في AI Studio؛ 429 = توقّف/بديل | «Rate limits are applied per project»؛ «Limits vary depending on the specific model»؛ «View your active rate limits in AI Studio»؛ تجاوز حدّ الإنفاق يعيد `429 RESOURCE_EXHAUSTED` | ✓ مطابق |
| 8 | `openrouter-free-variant-2026-09` | openrouter.ai · متغيّر :free | المعرّفات المنتهية بـ`:free` متغيّرات مجانية بحدود أو إتاحة أدنى | «Free variants provide access to models without cost, but may have different rate limits or availability compared to paid versions» | ✓ جوهرًا؛ الصياغة «different» لا «lower» فحُدِّث `observedState` بنصّ الصفحة |
| 9 | `openrouter-free-router-2026-09` | openrouter.ai · موجّه النماذج المجانية | `openrouter/free` يختار نموذجًا مجانيًا متاحًا وقد يقلّ ثباته | «`openrouter/free` … automatically selects a free model at random from the available free models»؛ «may have different rate limits and availability … for production workloads with higher reliability requirements, consider using paid models» | ✓ مطابق |
| 10 | `openrouter-rate-limits-2026-09` | openrouter.ai · الرصيد والحدود | للمتغيّرات المجانية حدود منصّة؛ 402/429 يوقفان أو يعودان محليًّا بلا مسار شراء | حدود الرصيد → 402؛ حدود الطلبات → 429 ومنها سقف النماذج المجانية: `:free` = 20 طلبًا/د؛ 50 طلبًا/يوم لمن اشترى أقل من 10 أرصدة، و1000/يوم لمن اشترى ≥10؛ رصيد سالب قد يعطي 402 حتى للمجانية. (الرابط المسجَّل `api-reference` يُحوَّل إلى `api_reference`) | ✓ مطابق |
| 11 | `vercel-hobby-2026-09` | vercel.com · خطة Hobby | Hobby مجانية للاستعمال الشخصي غير التجاري؛ معظم الميزات تتوقف عند تجاوز الحدّ بدل التحوّل لمدفوع | «The Hobby plan is free and aimed at developers with personal projects»؛ «no billing cycles … if you exceed your usage limits … wait until 30 days have passed»؛ «restricts users to non-commercial, personal use only» | ✓ مطابق |
| 12 | `github-actions-public-2026-09` | docs.github.com · فوترة Actions | المشغّلات القياسية مجانية للمستودعات العامة؛ المشغّلات الأكبر ممنوعة في المشروع | «free for self-hosted runners and for public repositories that use standard GitHub-hosted runners»؛ المستودع `naderba69/wegberlin` عام (`private:false`) | ✓ مطابق |
| 13 | `transformers-js-runtime-4-2-0` | npm · `@huggingface/transformers@4.2.0` | الإصدار 4.2.0 برخصة Apache-2.0 ويوفّر حزمة متصفح؛ تُشحن ملفات المتصفح المُدقَّقة فقط | سجلّ npm: الإصدار موجود، `license: Apache-2.0`، غير مُهمَل (`deprecated` فارغ)؛ الأحدث الآن 4.3.0 والمشروع مثبّت على 4.2.0 عمدًا. صفحة npmjs.com نفسها تردّ 403 للعملاء الآليين فقُرئ سجلّ npm | ✓ مطابق (الإصدار والرخصة) |
| 14 | `transformers-js-webgpu-guide-2026-09` | huggingface.co/docs · WebGPU | الدليل يوثّق `device: 'webgpu'` والاستدلال في المتصفح وحدود الدعم التجريبي والأنواع المُكمَّمة | الصفحة: «setting `device: 'webgpu'`»؛ دعم WebGPU العالمي ≈85% (مارس 2026) وقد لا يعمل لبعض المستخدمين؛ «experimental nature of WebGPU, especially in non-Chromium browsers»؛ وتصل بدليل «Using quantized models (dtypes)» | ✓ مطابق |
| 15 | `multilingual-minilm-base-license-2026-09` | HF · بطاقة paraphrase-multilingual-MiniLM-L12-v2 | نموذج تضمين جمل، 384 بُعدًا، حدّ 128 رمزًا، Apache-2.0، يضم الألمانية والعربية | البطاقة: 384 بُعدًا، `max_seq_length: 128`؛ واجهة Hub: `license: apache-2.0` وقائمة اللغات تضم `de` و`ar` | ✓ مطابق |
| 16 | `multilingual-minilm-onnx-web-2026-09` | HF · Xenova/…MiniLM…/onnx | المراجعة `2c4055b1…` تعرض `model_quantized.onnx` بنحو 118 MB | عند المراجعة نفسها: `onnx/model_quantized.onnx` = 118,308,126 بايتًا | ✓ مطابق |
| 17 | `whisper-tiny-base-license-2026-09` | HF · openai/whisper-tiny | نموذج 39M متعدد اللغات يضم الألمانية، Apache-2.0 على واجهة Hub | البطاقة: tiny = 39 M (متعدد اللغات ✓)؛ واجهة Hub: `license: apache-2.0` وقائمة اللغات تضم `de` | ✓ مطابق |
| 18 | `whisper-tiny-onnx-web-2026-09` | HF · onnx-community/whisper-tiny/onnx | المراجعة `ff417702…` تعرض مُكمَّمات ONNX للمُرمِّز وفاكّ الترميز | عند المراجعة نفسها: `encoder_model*` و`decoder_model*` و`decoder_with_past_model*` بمتغيّرات (fp16 / int8 / q4 / bnb4 / quantized / uint8) | ✓ مطابق |

## ما لم يُقرأ أو قُرئ جزئيًّا

1. ~~**`telc-b2-mock-2019-current-link`**: لم يُفتح الأرشيف نفسه~~ — **أُغلق لاحقًا في اليوم نفسه**: وقت الإقرار ثبت الرابط ولم يُفتح الأرشيف (يعتمد عليه رقما telc 225/75 و135/45 في `exam-profiles.ts`)، ثم قُرئ الأرشيف من مشغّل GitHub وثبتت الحقائق السبع في نصّه (القسم الأخير).
2. **صفحة Goethe التمهيدية** تردّ 403 لعملاء CI الآليين (`probePolicy: manual-on-403`)؛ قُرئت هنا عبر أداة الجلب، لا عبر فحص CI.
3. **`goethe-b2-terms-2025`**: قُرئ §1 (الأجزاء والمدد) فقط من سبعة أجزاء؛ حدّ النجاح 60/100 قُرئ من Modellsatz لا من هذا الملف.
4. **`transformers-js-runtime-4-2-0`**: صفحة npmjs.com ترفض العملاء الآليين (403)، فقُرئ سجلّ npm نفسه (الإصدار والرخصة)؛ أما «تُشحن ملفات المتصفح المُدقَّقة فقط» فهو فحص المشروع الخاص (`vendor:materialize` و`security:audit`) لا صفحة خارجية.
5. لا يغطّي هذا الفحص خصوصية OpenRouter ولا شروط الاستعمال القانونية لأي مزوّد خارج ما ذُكر في الجدول.

## ما تغيّر في المستودع

- `lastVerifiedAt` ← `2026-10-04` للسجلّات الـ18، و`reviewedAt` ← `2026-10-04`؛ `maxAgeDays` ووضع `manual-semantic-review` بلا تغيير.
- `observedState` لسجلّ `openrouter-free-variant-2026-09` حُدِّث إلى صياغة الصفحة الحالية («different» بدل «lower»)، وسجلّ `telc-b2-mock-2019-current-link` حمل حدّه أولًا في بياناته (الأرشيف عُرف طبعة 2019 في 2026-09-03 ولم يُعَد فتحه)، ثم صار `observedState` يصف إعادة فتحه من المشغّل في 2026-10-04 بعد القراءة أدناه.
- `src/data/exam-profiles.ts`: `verifiedAt` للملفّين (لازم: `source-freshness.test.ts` يشترط أنه يساوي أقدم تاريخ للمصادر) وعبارة `specificationVersion` لـtelc («checked 2026-10-04»). `accessedAt` للمصادر الخمسة **لم يتغيّر** لأنه تاريخ جمع اللقطات المثبّتة في `exam-format-evidence.json` (لم تُجمَع لقطات جديدة).
- أُعيد توليد `reports/official-exam-formats-audit.json` و`docs/generated/OFFICIAL-EXAM-FORMAT-VERIFICATION.md` (البصمة فقط: `1e61862c8a97` ← `6d24aabcd1a1`)؛ وبصمة ادّعاءات الامتحانات `134eb2daa3e6` لم تتحرّك.
- الاستحقاق التالي: `onnxruntime-web` في 2026-11-01 (ويصير `stale` من 2026-11-02)، وبقية السجلّات في 2026-11-03 (`stale` من 2026-11-04). فتح Issue الشهري في 2026-11-01.
- الأثر على المتعلم: يعود الذكاء البعيد الاختياري (Gemini/OpenRouter) وتنزيل نماذج المتصفح إلى الإتاحة، ويعرض مركز الامتحانات «ملف الصيغة موثّق وحديث» مع «آخر تحقق بشري: 2026-10-04».
- الاختبارات: لا تُعدَّل عند إعادة التحقق بعد الآن — تُشتقّ ساعاتها من السجلّ (`tests/helpers/source-verification-clock.ts`، ADR-108).

## إعادة فتح أرشيف telc من مشغّل GitHub (إضافة لاحقة، 2026-10-04)

وقت الإقرار كان أرشيف telc بلا فتح لأن بيئة الجلسة لا تصل إلى `telc.net`. قُرئ لاحقًا على مشغّل `ubuntu-24.04` في GitHub Actions بتجربة مؤقتة على PR #6 (runs `37193849680` · `37193948575` · `37194015638`، commits `bd3abf1` · `4dc962c` · `27f2316`). الـworkflow والسكربت محذوفان من الشجرة وقابلان للاستعادة من تلك الـcommits. كل رقم أدناه قُرئ من تعليقات الـcheck-runs لتلك التشغيلات لا من الذاكرة.

| القياس | النتيجة |
| --- | --- |
| `…/telc_deutsch_b2.zip` | HTTP 200 · 16,338,339 بايتًا · `application/zip` |
| الترويسات | `Last-Modified: Mon, 27 Mar 2023 06:50:49 GMT` · `ETag: "64213cc9-f94da3"` ← لم يتغيّر الملف منذ مارس 2023، أي قبل لقطة 2026-09-15 المثبّتة بزمن طويل |
| محتوى الأرشيف | مدخلان فقط: `deutschb2_uebungstest1.mp3` و`telc_deutsch_b2_uebungstest_1.pdf` (2,016,811 بايتًا، sha256 `eb04a597536837e8df6713ebab62f58c82526980130eef7a14b0769179e1df0b`) |
| علامات الطبعة في طبقة نص الـPDF | `© telc gGmbH, Frankfurt a. M., telc Deutsch B2, 2019` ✓ · «telc Deutsch B2, Übungstest 1» ✓ · جملة «Um die Prüfung zu bestehen … jeweils 60 % der möglichen Höchstpunktzahl erreichen» ✓ |
| الحقائق السبع المثبّتة في `src/config/exam-format-evidence.json` لهذا المصدر (`checkPattern`) | **7/7 حاضرة** بـ`pdftotext -raw` بعد توحيد المسافة قبل `%` في النص والنمط معًا. بالوضعين الافتراضي و`-layout`: 6/7 (ترتيب خلايا جدول Sprachbausteine يختلف بحسب المستخرج؛ المحتوى نفسه: «Teil 1 21–30 … 15 · Teil 2 31–40 … 15 · 30 · 10 %»). بلا توحيد المسافة 3/7 في `-raw` لأن poppler يكتب «10%» بينما مستخرج لقطة 2026-09-15 كتب «10 %» |

**ما يثبته**: الأرشيف الذي ترتبط به صفحة telc الرسمية هو طبعة 2019 نفسها التي أُخذت منها الحقائق، وصفحتا النقاط والنتيجة (47–48) ما زالتا تقولان: حدّ النجاح 135 من 225 في الكتابي و45 من 75 في الشفهي، المجموع 300، حدود التقديرات الخمسة، ووزن Sprachbausteine 10 %. فيُغلق الشرط الذي علّقه الإقرار («رابط فقط»).

**ما لا يثبته**: (1) أن telc لم تعدّل قواعد امتحانها الحالي بعد 2019؛ الأرشيف نموذج تدريبي بطبعة قديمة، والمصدر الحالي هو صفحة `telc-b2-overview-2026` المقروءة في الجدول أعلاه. (2) أن النص المستخرج يطابق ما تراه العين في الملف (طبقة النص فقط، دون مقارنة بصرية). (3) سلامة ملف الصوت `.mp3` ومحتواه. المطابقة على الأنماط المثبَّتة نفسها لا قراءة جديدة بالعين، والقراءة بمساعدة وكيل كسائر هذا السجلّ.
