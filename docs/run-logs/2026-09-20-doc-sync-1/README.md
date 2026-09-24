# دفعة 2026-09-20 — مزامنة الوثائق بعد كل دفعة (ADR-079)، جيل `v138`

## لماذا هذه الدفعة

المالك قرر: «يجب أن تكون الملفات محدَّثة بعد كل دفعة». القياس قبل التنفيذ أظهر أن الفاحص يرقب أرقامًا منتقاة في
أربعة ملفات فقط، وأن عشرة ملفات وصفية خارج تلك الرقابة. هذا السجل يثبت ما وُجد وما صُحِّح وما قِيست به.

## ما وُجد مقاسًا (كل رقم من ملف تقرير مولَّد أو من أمر شُغِّل في هذه الجلسة)

| الموضع | كان مكتوبًا | الواقع المطبوع | المصدر |
|---|---|---|---|
| `docs/CONTENT_COMPLETENESS_AUDIT.md:86` | 1,244 مرساة اسم و4,389 إشارة (1,319/89/2,981) و1,090 إطارًا (134/4/952) | 1,297 و4,717 (1,377/89/3,251) و1,200 (134/4/1,062) | `reports/academic-content-audit.json` |
| `P0_AUDIT.md:23` و`:67` | 1,244 و4,389 | 1,297 و4,717 | نفسه |
| `P1_AUDIT.md:153` (البند 397) | 55.2% قياس 2026-09-17 | 52.08% = 651 من 1,250، السقف 40% أي 500، الباقي 151 | `reports/lesson-quality-audit.json` |
| رأس `PROJECT_STATUS.md` | Last updated: 2026-09-13 | 2026-09-20 | — |
| رأس `IDEA_BACKLOG.md` | 396 اقتراحًا | 401 بندًا مرقمًا (و124/135/142 بالأولوية) | عدّ في الملف |
| `docs/AGENT-HANDOFF-PROMPT-AR.md:70` | content SHA `be475d82ffb5…` | `4c4fc71b383f…` | `npm run content:audit:write` |
| خمسة تقارير في `docs/generated/` | `Generated: 2026-09-05` ثابت | `Definition date: 2026-09-05` مع الإشارة إلى أن البصمة هي المرجع | `scripts/generate-academic-audit.ts:10` |
| `docs/AUDIO_PRODUCTION_BACKLOG.md` | بلا طبقات الدروس والمكتبة ولا سقف ADR | 272 MP3 + 272 Opus = 544 ملفًا، 96 امتحان و96 درسًا و80 مكتبة، 52,943,843 بايتًا تحت 70 ميغابايت | `find public/audio` + `media:budget` |

لا حروف شرق آسيوية في أي ملف عُدِّل؛ فُحص بـ`[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]` فخرجت القائمة فارغة.

## ما نُفِّذ

1. سطر مصادقة `Sync batch: v138 · 2026-09-20` أُدرج في أول اثني عشر سطرًا من ثلاث عشرة وثيقة (اثنتا عشرة قائمة عند
   المالك + `AGENTS.md`)، مع `docs/adr/ADR-079-documentation-sync-marker.md` ميثاقًا.
2. حارس في `scripts/verify-continuation-handoff.mjs` يقرأ `PACK_CACHE` من `public/sw.js` ويستخرج جيلها، ثم يفشل إذا
   غاب السطر أو أشار إلى جيل أقدم. لا قائمة إسكات ولا استثناء.
3. تصحيح كل الأرقام البائتة أعلاه، وإضافة بنود 402–405 إلى `IDEA_BACKLOG.md` بوسم `مؤجَّل موثَّق` لا بوسم أولوية:
   الأولويات 124 و135 و142 يثبّتها الفاحص، فوسم `P0` في بند جديد كان سيغيّر السجل (ثبت ذلك فعلًا في التجربة الأولى).
4. `scripts/generate-academic-audit.ts`: تسمية رأس التاريخ في التقارير المولَّدة صارت `Definition date:` مع نص يوضح
   أن `Content SHA-256` هو المرجع؛ بقي التاريخ ثابتًا عمدًا لأن وضع `--check` يطابق الملفات المطبوعة بايت ببايت في
   `prebuild`، وجعله تاريخ التشغيل كان سيكسر البناء كل يوم.
5. حقوق إضافية في `DECISIONS.md` (ADR-079) و`PROFESSIONAL_CONTINUATION_PROMPT_AR.md` (§28) و
   `docs/AGENT-HANDOFF-PROMPT-AR.md` (§11) وخطوة سادسة عشرة في حلقة `docs/BACKUP-RESUME-PROMPT-2026-09-19-v138-AR.md`.

## انحراف البصمة: ما حدث ولماذا لم يُكذَّب أحد

`npm run --silent offline:size` أعاد توليد `public/offline-size-manifest.json` من مخرجات **البناء الجاري**، لا من
ملفات ثابتة: `scripts/generate-offline-size-manifest.mjs` يقيس HTML الصفحات المولَّدة ومقاطع `_next/static` المشار
إليها فيه. فبعد بناء هذه الدفعة صارت البصمة `e42b1af2a24a` و full ‏5,623,361 بدل ‏76fdf8813342 و 5,623,333 عند
‏v138 (a1 2,389,168 ‏· a2 2,465,523 · b1 2,528,661 · b2 3,877,915). بصمة المحتوى `4c4fc71b…` لم تتحرك، أي أن بيانات
المتعلم واحدة، فحُددت الأرقام الجارية في `PROJECT_STATUS.md` وروابط التسليم على القياس الجديد، وبقيت أرقام دفعات
السرد السابق كما قِيست يومها. لم يُرفَع جيل الكاش: `dwnb-full-pack-v138` كما هو، فلا يُرهَق الدارس بتنزيل جديد بلا سبب.

## البوابات المشغَّلة على هذه الشجرة

- `./node_modules/.bin/tsc --noEmit` → خروج 0.
- `npx vitest run` → **153/153 ملفًا** و**1,000/1,000 اختبارًا** ناجحًا في 182.20 ثانية.
- `npm run --silent lint` بعد `rm -rf test-results playwright-report` → خروج 0 بلا تحذير.
- `npm run build` (بعد `sudo fallocate` مبادلة 4G و`NODE_OPTIONS=--max-old-space-size=1400`) → خروج 0،
  **321/321** صفحة، و`content:audit --check` داخل `prebuild` مرَّ لأن التقارير وُلدت من جديد في نفس الدفعة.
- `npm run --silent js:budget` → 110 مقاطع / 1,717,048 gzip / أكبر 246,715 (بلا تغيير).
- `npm run --silent media:budget` → 544 ملفًا / 52,943,843 بايتًا / المنهاج 937,470 gzip و15% احتياط (بلا تغيير).
- `npm run --silent handoff:check` → خروج 0، ويطبع `- doc sync: 13 standing documents re-synced against dwnb-full-pack-v138 (ADR-079)`.
- اختبار الحزمة الذي يقرأ الـmanifest: `tests/unit/offline-pack-controls.test.ts` → 7/7 نجاحًا بعد إعادة التوليد.

## إثبات أن الحارس يعضّ (ليست بوابة خاملة)

- كُسِر سطر `docs/SOURCE_FRESHNESS.md` إلى `v137` → خروج 1 مع
  `docs/SOURCE_FRESHNESS.md is synced to v137 while the shipped pack is dwnb-full-pack-v138 (ADR-079)`.
- حُذف السطر من `docs/MASTER_SPEC.md` → خروج 1 مع
  `docs/MASTER_SPEC.md carries no "Sync batch: vNNN" marker (ADR-079: standing docs must be re-synced after every batch)`.
- أُعيد السطران → خروج 0. السجلان: `handoff-check-negative.log` و`handoff-check-missing-marker.log`.

## ما لم يُشغَّل وبقي مفتوحًا

- اختبار المتصفح الكامل: لا شيفرة منتج ولا بيانات متعلم تغيّرت في هذه الدفعة، فآخر تشغيل كامل يبقى **82/82** بتاريخ
  2026-09-19 (`e2e-v138-full-run2.log`). هذا تأجيل معلن، لا إغلاق ولا نتيجة لهذه الدفعة.
- المرحلة الثالثة (قرينة الطول) ما زالت مفتوحة عند 52.08%؛ الدفعة التالية `b2-12` ثم `b1-05` ثم `b2-07` ثم `b2-08`.
- المراجعة البشرية المستقلة 0 من 3,277، وتحديث صيغة telc بنداه مفتوحان، وأثر التعلّم غير موصول بأداة قياس.
- عطل React hydration ‏#418 على `/settings` ما زال بلا تشخيص، وسُجِّل في `IDEA_BACKLOG.md` بند 404.
