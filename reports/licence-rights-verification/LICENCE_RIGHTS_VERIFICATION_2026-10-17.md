# التحقق من الحقوق والتراخيص — P1-92 وP2-357 (v228، 2026-10-17)

**الطبقة.** `source-verified-agent` (ADR-116 وADR-119). **ليست** مراجعة محامٍ أو جهة حقوق.

## P1-92 — المقارنة مع نماذج Menschen العامة

| المصدر | الرابط | المقاطع | الكلمات | SHA-256 (النص المؤقت) |
|---|---|---:|---:|---|
| Menschen A1.1 KB — Leseprobe (الدرس 1) | https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783193619013_Muster.pdf | 36 | 494 | `ac3da092166d…` |
| Menschen A1 KB — Leseprobe 2 (الدرس 9) | https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783192119019_Muster_2.pdf | 51 | 649 | `8dd6b7947b3d…` |
| Menschen B1 KB — Leseprobe 1 (الدرس 1) | https://shop.hueber.de/media/hueber_dateien/Internet_Muster/Red1/9783192119033_Muster_1.pdf | 90 | 845 | `c337496b42ef…` |

- **الأساس القانوني:**
  - § 44b UrhG: https://www.gesetze-im-internet.de/urhg/__44b.html
  - لم يكن في `https://www.hueber.de/robots.txt` أي تحفّظ آلي في 2026-10-17.
  - حُذفت النسخ المؤقتة من `/tmp` بعد التشغيل.
- **النتيجة:**
  - قورن 19,780 مقطعًا ألمانيًا من المشروع بـ177 مقطعًا مرجعيًا، في 849,296 زوجًا مرشحًا.
  - **0 تطابق.** أقرب زوج درجته 0.4933 (الحد 0.84)، وهو تعليمة تمرين عامة.
  - التقرير الآلي في `reports/external-reference-comparison/menschen-public-samples-2026-10-17.json` لا يحتوي أي نص من الكتاب.
- **الحدود:**
  - التغطية ثلاثة دروس نموذجية فقط (نحو 12 صفحة).
  - المقارنة بالكتاب كاملًا تحتاج نسخة يملكها المالك بصورة مشروعة: يشغّل الأداة نفسها عليها، ثم يحذف النسخة.
  - Copyright clearance يبقى معلّقًا.

## P2-357 — استيراد مصدر مفتوح مع الإسناد

| السجل | ما ظهر في الصفحة نفسها (2026-10-17) | القرار |
|---|---|---|
| OER-02 Grimm Grammar | شارة CC BY 4.0 في https://coerll.utexas.edu/gg/ وفي صفحة الاعتمادات وفهرس الموقع وصفحتي con_06 وvsub_04 | مؤهل، ومستورد كـ21 رابطًا مُسندًا |
| OER-03 Deutsch im Blick | شارة CC BY 4.0 في https://coerll.utexas.edu/dib/ | مؤهل، غير مستورد |
| OER-01 G-FOL | لا يظهر إصدار الترخيص، والأمثلة مقتبسة من DWDS | مرفوض |

- **عناوين الروابط:** منقولة من فهرس الموقع الرسمي: https://coerll.utexas.edu/gg/gr/index.html
- **المصطلحات الثلاثة غير المربوطة:** Nominalisierung وPartizipialattribut وFunktionsverbgefüge، لأنها بلا صفحة مطابقة.
- **سطر الإسناد في التطبيق:** «Zsuzsanna Abrams: „Grimm Grammar“, COERLL / The University of Texas at Austin, Lizenz CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/), geprüft am 2026-10-17».
