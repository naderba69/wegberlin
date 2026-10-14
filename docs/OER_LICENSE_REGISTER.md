# سجل تراخيص المصادر المفتوحة (P2-357)

هذا السجل يحدد المصادر التي يُسمح بالنظر في استيرادها، مع الترخيص كما ورد في صفحة المصدر نفسها وتاريخ الفحص. التسجيل هنا **ليس استيرادًا**: لا يُضاف أي محتوى من هذه المصادر إلى الشيفرة أو الحزم، ولا يغيّر أي مسار أو درس.

قاعدة الإسناد: كل عنصر مستورد لاحقًا يجب أن يحمل اسم المؤلف وعنوان المصدر ورابط الترخيص وتاريخ الاستيراد.

| المعرّف | المصدر | الرابط الذي فُحص | الترخيص كما ورد في الصفحة | تاريخ الفحص | الإسناد المطلوب | الحالة |
| --- | --- | --- | --- | --- | --- | --- |
| OER-01 | German Frame-semantic Online Lexicon (G-FOL)، Hans Boas، COERLL / UT Austin | https://coerll.utexas.edu/coerll/materials/language/german/ | CC-BY | 2026-10-08 | Hans Boas، G-FOL، COERLL / UT Austin، مع رابط الترخيص | مسجّل، غير مستورد |
| OER-02 | Grimm Grammar، Zsuzsanna Abrams، COERLL / UT Austin | https://coerll.utexas.edu/coerll/materials/language/german/ | CC-BY | 2026-10-08 | Zsuzsanna Abrams، Grimm Grammar، COERLL / UT Austin، مع رابط الترخيص | مسجّل، غير مستورد |
| OER-03 | Deutsch im Blick، Zsuzsanna Abrams، COERLL / UT Austin | https://coerll.utexas.edu/coerll/materials/language/german/ | CC-BY | 2026-10-08 | Zsuzsanna Abrams، Deutsch im Blick، COERLL / UT Austin، مع رابط الترخيص | مسجّل، غير مستورد |
| OER-04 | Wiktionary (نصوص المداخل) | https://en.wiktionary.org/wiki/Wiktionary:Copyrights | CC BY-SA 4.0 و GFDL 1.1 (بلا أقسام ثابتة) | 2026-10-08 | اسم المساهمين وتاريخ التعديل ورابط الترخيص، مع ترخيص المشتق نفسه (ShareAlike) | مسجّل، غير مستورد |
| OER-05 | Grenzenlos Deutsch | https://oercommons.org/browse?f.keyword=german-language (قائمة؛ لم تُفتح صفحته الفردية) | CC BY-NC-SA (من قائمة OER Commons) | 2026-10-08 | غير مستورد: ترخيص غير تجاري | مستبعد افتراضيًا (NC) |
| OER-06 | German 101 وGerman 102، Rebecca Linem | https://nku.libguides.com/c.php?g=1241432&p=10871937 (قائمة؛ لم تُفتح صفحة المصدر الفردية) | CC BY (من قائمة LibGuide؛ الإصدار غير مُثبت) | 2026-10-08 | Rebecca Linem، German 101/102، مع رابط الترخيص | مسجّل، غير مستورد؛ الإصدار غير مُثبت |
| OER-07 | Let's Chat German، Crandall وآخرون | https://oercommons.org/browse?f.keyword=german (قائمة) | CC BY-NC-SA (من قائمة OER Commons) | 2026-10-08 | غير مستورد: ترخيص غير تجاري | مستبعد (NC) |
| OER-08 | Kennlernenphrasen auf Deutsch | https://oercommons.org/browse?f.keyword=german (قائمة) | CC BY-SA (من قائمة OER Commons؛ المؤلف والناشر غير مُثبتين) | 2026-10-08 | المؤلف والناشر غير مُثبتين؛ ShareAlike يحتاج قبولًا صريحًا | مسجّل، غير مستورد؛ المؤلف غير مُثبت |

## بوابة الترخيص (قرار آلي، لا استيراد)

الوحدة `src/core/oer/import-policy.ts` تقرر فقط هل يحق لسجلّ أن يدخل مرحلة مراجعة استيراد يدوية. نتائجها على السجل الحالي:

- OER-01 · OER-02 · OER-03: **مرفوضة** — `license-version-unverified:CC-BY` حتى يُثبت إصدار CC من صفحة المصدر.
- OER-04: **مرفوضة افتراضيًا** — يلزمها قبول ShareAlike صريح من المالك (`share-alike-not-accepted`)؛ عند قبوله تصبح مؤهلة لمراجعة الاستيراد فقط.
- OER-05: **مرفوضة** — `non-commercial-license`.
- OER-06: **مرفوضة** — `license-version-unverified:CC-BY`.
- OER-07: **مرفوضة** — `non-commercial-license` (مستبعد).
- OER-08: **مرفوضة افتراضيًا** — `share-alike-not-accepted`؛ والمؤلف غير مُثبت.

«مؤهل للمراجعة» لا يعني مستورَدًا ولا مرخّصًا قانونيًا؛ الحكم القانوني النهائي بشري. اختبارات الوحدة في `tests/unit/oer-import-policy.test.ts`.

## ملاحظات الحدود

- يُقرأ الترخيص من صفحة المصدر وقت الفحص فقط؛ لا يُعد الفحص رأيًا قانونيًا، ويبقى التحقق القانوني النهائي قرارًا بشريًا.
- الترخيص `CC-BY` على صفحة COERLL لا يحدد إصدار CC؛ يجب تحديد الإصدار قبل أي استيراد.
- المصادر ذات `NC` مستبعدة من الاستيراد الافتراضي. أي استثناء يحتاج قرار المالك كتابةً.
- لم يُنفَّذ بعد أي مستورد يقرأ هذا السجل؛ لذلك يبقى P2-357 **غير منفّذ**.

## نتائج البحث عن مواد الامتحانات الرسمية (2026-10-08، غير مسجّلة كمصادر مرخّصة)

لم تُضَف هذه المواد إلى الجدول أعلاه لأن شروطها لا تمنح ترخيصًا مفتوحًا. هذا توثيق للاستبعاد فقط.

- **Goethe-Institut** (A1-Modellsatz وA1-Übungssatz 01 و02 على goethe.de): المواد متاحة للتنزيل، لكن شروط الجهة تقول إن الحقوق محفوظة. الشروط العامة للدورات والامتحانات (AGB RoW، البند 8g) تمنح حق استعمال شخصي غير قابل للنقل فقط، وتمنع النسخ والنشر وإعادة الاستخدام التجاري. ولائحة الامتحانات (§23) تنص على أن جميع مواد الامتحان محمية ولا تُستعمل إلا في الامتحان.
- **telc** (Übungstest B2 وB1·B2 Beruf وA2·B1 وC1): الصفحات نفسها تقول «Alle Rechte vorbehalten» و«bedarf der schriftlichen Einwilligung des Herausgebers». التنزيل المجاني لا يعني ترخيصًا لإعادة الاستخدام.

**الخلاصة:** لا توجد حتى الآن مادة امتحان رسمية مرخّصة بترخيص مفتوح. الطريق الممكن هو طلب إذن كتابي من Goethe-Institut أو telc GmbH لكل مادة، وتسجيل الإذن كتابةً بعد استلامه فقط.
