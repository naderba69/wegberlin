# دفعة A2 الأولى — 48 شرحًا (2026-09-19، الطابع `dwnb-full-pack-v132`)

النطاق: إعادة تأليف `explanationAr` (و`promptAr` عند الحاجة) في 48 تمرينًا من A2، على دفعتين من 24.
مصدر القائمة: `scratch/expl_detail.ts a2 0 24` ثم `a2 24 24` (الأقصر أولًا)، والمواصفات: `scratch/a2e1.json`، `scratch/a2e2.json`.
الأداة: `python3 /home/user/scratch/set_expl.py <level> <spec>` — تتحقق من الطول السابق حرفيًا وتتخطى أي عدم تطابق.

## القياسات من `lesson:quality`

| المقياس | قبل (v131) | بعد (v132) |
| --- | --- | --- |
| `feedback.allUnder60Chars` من 1,733 | 1,370 | **1,322** |
| `multipleChoice.under40Chars` من 1,250 | 1,062 | **1,047** |
| `allMedianChars` | 27 | 28 |
| شروحات A2 كاملة (≥60) | 0 / 168 | **48 / 168** |

المشخص على A2 بعد التطبيق: داخل النطاق 156–212 = 48 · فوق 212 = 0 · صياغات موقعية = 0 · أسماء حالات = 0 · مكرّر = 0.

## ما رُفِع

`public/sw.js` (pack v131 → v132)، `src/core/curriculum/offline-asset-manifest.ts:15`،
وخمسة ملفات اختبار ثبتت أرقام الطوابع: `tests/offline-cache-budget.test.ts`،
`tests/unit/today-offline-readiness.test.ts`، `tests/unit/offline-pack-controls.test.ts`،
`tests/unit/offline-recovery-partial-export.test.ts`، `tests/unit/offline-curriculum-rollback.test.ts`،
بالإضافة إلى ثلاث سلاسل في `tests/e2e/critical-flows.spec.ts` (1748 / 1767 / 1860)
وتثبيت `discoveredSignals.controlled` من 23 إلى 21 في `tests/unit/meaning-first-case.test.ts:13`.
خُطوط الوقائع الجارية في `AGENT_HANDOFF_PROMPT_AR.md` (نسختي الجذر و`docs/`)،
و`PROFESSIONAL_CONTINUATION_PROMPT_AR.md`، و`PROJECT_STATUS.md` (النطاق 156–212 أُضيف إلى
سطر البنية لأنه لم يكن مذكورًا)، وسطر `README.md` الخاص بالشروحات القصيرة.
سطور التاريخ في `PROJECT_STATUS.md` تُركت كما هي عمدًا (منها سطر v125 القديم عند 1,621).

## الأوامر والنتائج

- `npm ci` (غاب `node_modules` عند فتح الجلسة) → exit 0.
- `content:audit:write` ثم `lesson:quality` و`case:audit:write` و`governance:audit:write` و`similarity:audit:write` و`language:audit:write` و`lexical:strategy:audit:write` → الكل `ok: true`، والمشخصات بلا مشكلات (المحتوى 0 · الحِراك 0 · الحالات 0 · الحوكمة 12 موزونة بلا أخطاء · اللغة 0 · المعجم 0).
- `npx tsc --noEmit` → exit 0 (مرّتين: بعد الدفعة الأولى وبعد الثانية).
- `npm run build` (أولى) → **لم تكتمل**: توقفت عند «Running TypeScript» بذاكرة حرّة 14–18 ميغابايت وقُتلت؛ السجل `build.log` يبقى هنا ولا يُحذف.
- `npm run build` (إعادة بـ `NODE_OPTIONS=--max-old-space-size=768`) → exit 0: 321/321 صفحة، بصمة `0a0bfdd2c01f`، JS 110 ملفًا / 1,709,712 بايت، أكبر مقطع 243,237 · وسائط 544 / 52,943,843 · الحزمة الكاملة 5,603,006 · a2 2,456,737 (السجل `build2.log`).
- `npx vitest run` → **151 ملفًا / 988 اختبارًا نجحت** (`vitest.log` المحاولة الأولى، `vitest2.log` بعد تثبيت سطر 1,370 في `docs/run-logs/2026-09-19-b1-explanations-2/README.md` إلى 1,322).
- `npm run lint` → exit 0 · `npm run handoff:check` → exit 0 (بعد تثبيت سطر `Offline cache:` في `PROFESSIONAL_CONTINUATION_PROMPT_AR.md` وتحديث عدّاد الاختبارات في `scripts/verify-continuation-handoff.mjs` إلى 988/151).
- `npm run review:packet` → 3,277 سجلًا / 17 / 196 / 1,104 / 16.
- `npx playwright test -g "complete lesson run|writing lab enforces|absolute beginner starts A1"` → **6 نجحت** في 1.2 دقيقة (`e2e-subset.log`).
- اختبار الحزمة الكاملة (`the optional full content pack opens unvisited lessons and exam tasks offline`) → **2/2** في 56.9 ثانية (`e2e-fullpack.log`).
  محاولة أولى فشلت بـ «No tests found» لأن اسم الاختبار كان محذوفًا من الذاكرة؛ الصحيح في `tests/e2e/critical-flows.spec.ts:1733`.

## حوادث مُصلَحة أثناء الدفعة

- الدفعة الثانية كادت تُكتب بأربعة نصوص مرفوضة حارسِيًا (`a2-06-e12`، `a2-08-e12`، `a2-09-e8`، `a2-09-e11`) لأن «الأولى/الطرف الثاني» تحوي «الأول/الثاني»؛ أُعيدت الصياغة ولم يُمسَّ الحارس (`scripts/rebalance-answer-positions.ts:21`).
- نصّ واحد تجاوز النطاق (220 حرفًا) فنُصّر إلى 212 قبل التطبيق.
- تعارض في `offline-cache-budget.test.ts` ظهر فقط عند الجري الكامل لـ vitest (جري المستهدف كان يمرّ) لأنه يقرأ `docs/run-logs/2026-09-19-b1-explanations-2/README.md`؛ عُوملت وثيقة السجل لا الاختبار.

## ما لا تدّعيه هذه الدفعة

لم يُشغَّل نطاق الـ82 اختبارًا الكامل، ولا دفع إلى `origin/main`، ولا مراجعة بشرية (0/3,277)، ولا تسمية آلية على أنها قرار مصحّح.
شرط 3 (أطول قرينة 55.2% مقابل ≤40%)، وشرط telc 2026، وأثر المتعلّم الحقيقي: كلها مفتوحة.
المتبقي في مسار الشروحات: A2 120 ثم A1 167، و1,035 سلسلة مرحلة.
