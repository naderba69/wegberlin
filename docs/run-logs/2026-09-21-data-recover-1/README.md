# 2026-09-21 · جولة ثالثة: أداة استرجاع `src/data` (لأن الفقد هو العائق، لا الكود)

## وضع بداية الجولة (مقاس، لا مستنتج)

| الفحص | النتيجة |
|---|---|
| `find src/data -type f` | **79** · `src/data/exercises` = 0 · `curriculum` = 0 · `micro-drills` = 0 |
| بحث شامل في كل القرص عن `exercises`/`curriculum`/`a2-01-m*.json` | **ولا شيء** على هذا الجهاز (خارج `node_modules`) |
| أرشيفات `/home/user/*.zip` | الذي كان موجودًا هو v154b الملفوف (63,786,813 · `7f6958ae…`) وحذفه حرّاس الجولة السابقة؛ لا بديل مكتمل |
| `node_modules` / `.next` | غائبان (استعادة اللقطات) — أُعيد `npm ci` (471 حزمة) |
| `public/sw.js` · `PROJECT_STATUS.md` | v155 ✓ · الوثائق ما زالت مثبّتة على v155 ✓ |
| `tests/` | 156 ملفًا · `delivery-layout.test.ts` موجود (كان رُجِع سابقًا وأُعيدت كتابته) |

فلا «واصل» بالمعنى المعتاد: لا يمكن تأليف/تطبيق دفعة explanations ولا توليد أرشيف، لأن ملفات التمارين
نفسها غير موجودة في هذا الجيل. العمل المُنجَز إذن هو ما يفتح الطريق لما بعدها.

## ما أُضيف: `scripts/recover-src-data.mjs` + `npm run data:recover`

أربع أوامر: `probe` / `restore [--from <zip|dir>] [--apply]` / `backup` / `verify`.
- يبحث في `HOME` و`~/storage/downloads` و`~/Downloads` وأبوة المشروع عن كل `*.zip` ومجلد مشروع، ويقيس
  عدّادات `src/data/{exercises,curriculum,micro-drills}` لكل مرشّح (من قائمة `unzip -Z1` دون فكّ، أو من
  الشجرة مباشرة)، ويفرض حدّ اللياقة: `exercises>=900 · curriculum>=30 · micro-drills>=10`.
- `restore` ينسخ من أفضل مرشّح بعد stage، و**لا يحذف شيئًا**؛ ويرفض قبل الكتابة إن كان المرشّح ناقصًا.
- `backup` يكتب `scratch/src-data-backup.tar.gz` ويرفض على شجرة ناقصة («لا نسجّل الخسارة كاحتياط»).
- `verify` يقارن عدد ملفات البيانات في الشجرة بالمرآة.

### القياسات المخبرية (على الكود المشغَّل، لا على محاكِ)

شجرة وهمية كاملة (901/31/11) + شجرة المشروع الحقيقية الناقصة، مع نسخة من السكربت في جذر بديل:

| الحالة | المخرَج الفعلي |
|---|---|
| `probe` على مجلد مرشّح | `/home/user/stage-test → exercises=901 · curriculum=31 · micro-drills=11 · COMPLETE ✓` |
| `probe` على ZIP مرشّح | `/home/user/stage-test.zip → exercises=901 · … · members 952 · COMPLETE ✓` |
| `restore` (dry) | `staged data: exercises=901 …` ثم `dry run only — pass --apply …` |
| `restore --from <zip> --apply` | `after restore: exercises=901 · curriculum=31 · micro-drills=11 · src/data total 943` |
| `backup` → `verify` | `mirror … 943 data entries · sha12 67defbb55848` ثم `verify: tree 943 data files == mirror 943` |
| على الفقد الحقيقي | `recovery refused: no candidate holds a complete src/data …` · خروج 1 |
| `backup` على شجرة ناقصة | `recovery refused: refusing to snapshot an incomplete tree (…exercises=missing…)` · خروج 1 |

### أربعة أخطاء وُجدت بالاختبار وأُصلحت في نفس الجولة

1. `find` على مسار مفقود كان يُطبع `-1` ⇒ صار `missing` عبر `show()` (الرسائل للأدمي لا للأصفار).
2. مسار المرشّح المجلّدي كان يسقط `src/data` من المسار ⇒ `probe` كان يرى كل شيء «ناقصًا»؛ صُحّح `census(base, prefix)`.
3. `cp -a <dir> <stage>` ينسخ داخل المجلد لا محتوياته ⇒ صار `<dir>/. <stage>/` ووحّدنا مسار `base = stage[/prefix]` للـ ZIP والمجلد.
4. عدّاد `tar -tzf` كان يحسب مدخلات المجلدات ⇒ `verify` رفض مرآة سليمة (949 مقابل 943)؛ صار التصفية `!l.endsWith("/")`.

## ربط وفحص

- `package.json`: أضفنا `data:recover` بعد `archive:delivery` مباشرة (61 أمرًا) — و`npm ci` بعدها نجح.
- `tests/unit/delivery-layout.test.ts`: حالة سابعة (الترابط، رسائل الرفض، تصفية `tar`، وجود القسم في
  `TERMUX_GITHUB_UPLOAD.md`) ⇒ **7/7 ناجح** بعد `npm ci`.
- `npx tsc --noEmit` → **0** (26s) · `npx eslint` على الملف الجديد والاختبار → نظيف.
- `npm run handoff:check`: أرجعنا أسماء الكاش في `tests/e2e/critical-flows.spec.ts` وثلاثة اختبارات وحدة
  إلى `dwnb-full-pack-v155` (كانت رجعت إلى v151)، فاجتاز بوابة «Playwright cache contract» وتوقف عند
  البوابة التالية: `learning architecture readable report is missing "e765f8e14d80…"` — أي أن `reports/`
  أقدم من `src/data`، ولا يُولَّد بلا البيانات. متوقع وموثَّق، لا خلل جديد.
- التوثيق: قسم «استرجاع بيانات `src/data` من أي نسخة على الجهاز» في `TERMUX_GITHUB_UPLOAD.md` (239 سطرًا).

## ما يفتح هذا الطريق إليه (بالترتيب، متى وجد ZIP فيه البيانات)

```bash
npm run data:recover probe
npm run data:recover restore --from ~/storage/downloads/wegberlin-full.zip --apply
npm run data:recover backup
npm run case:audit && npm run content:audit:write && npm run learning:architecture:audit:write
npm run archive:delivery && sha256sum -c ~/wegberlin-full.zip.sha256
```
ثم الرفع بالتدفق المحروس، وبعده ترجع الدفعات: **414 عنصرًا = 18 دفعة** إلى وسيط 60 (أرقام v155
المثبتة في الوثائق: 1,178/1,733 تحت الستين · وسيط الشرح 26 · بصمة `6ac5765f908a`).
