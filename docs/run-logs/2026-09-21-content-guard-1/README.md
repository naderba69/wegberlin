# 2026-09-21 · حارس المحتوى: الجذر الملفوف كان نصف المشكلة فقط

## ما قيس في هذه الجولة

| الفحص | النتيجة |
|---|---|
| `src/data` في مساحة العمل | **79 ملفًا** (كلها `.ts` في المستوى الأول) · `src/data/exercises` = 0 · `src/data/curriculum` = 0 |
| `src` بالكامل | 423 ملفًا · `src/app` = 66 (جيل v153) · لا `src/lib` |
| `main` على GitHub (clone نظيف لـ `368d6e8`) | `git ls-files '…/src/data'` = 79، `git status` نظيف، القرص حرّ 18G ⇒ الاستنساخ كامل |
| كل الأرشيفات على الجهاز | `unzip -l … | grep -c src/data/(exercises|curriculum)/` = **0** |

الخلاصة: المحتوى المؤلَّف (1,123 ملف JSON للتمارين/المنهاج) **غير موجود في المستودع البعيد ولا في أي
أرشيف على هذا الجهاز**؛ ظهر اليوم صباحًا في مساحة العمل ثم سحبته استعادة اللقطات. لذا لا يمكن
توليد أرشيف v155 كامل الآن، والتسطيح وحده يعطي مستودعًا بلا محتوى.

## ما أُنجز (أدوات، لا محتوى)

1. `scripts/build-delivery-archive.mjs`: `REQUIRED_DATA_DIRS = {exercises,curriculum,micro-drills}` +
   `MIN_DATA_FILES`؛ الفحص **قبل** الضغط، وإعادة فحص العدد داخل الأرشيف مقابل عدد الشجرة؛ وأي رفض
   يستدعي `fail()` صار **يحذف الأرشيف والـ sidecar**. قياس على شجرة اصطناعية:
   - بلا بيانات → `delivery archive refused: data directory missing from the tree: src/data/exercises` · خروج 1
   - مع بيانات → خروج 0 و`authored data files: src/data/exercises=4 · src/data/curriculum=1 · src/data/micro-drills=1` و`Vercel-critical at root: 9/9`
   - ملف قديم موجود مسبقًا (zip + sidecar) → **محذوف** بعد الرفض في المسارين (pre-zip وpost-zip)
   - جذر ملفوف → `delivery archive refused: 3 entries carry the wrapper folder "der-weg-nach-berlin/"` وحذف الأثر
2. `TERMUX_REPLACE_REPO.sh`: حرّاس الاستخراج والنشر + حرّاس المحتوى نُقلت **قبل** طلب الـ PAT و**قبل**
   `git clone`؛ وبعد `git add -A` يُرفض أي commit يتتبّع 0 ملفات بيانات. قياس بـ `gh` مزيف وHOME معزول:
   - أرشيف بلا بيانات → `Archive is undeployable: src/data/exercises holds no files in the staged tree.` · خروج 1 · لا سؤال عن مفتاح · لا `Cloning into` · لا `WORKDIR`
   - أرشيف كامل → `ZIP structure: OK` + `Detected project root inside ZIP: <archive-root>` + عدّادات `staged …` ثم يكمل إلى المصادقة
3. `TERMUX_UNNEST_ROOT.sh`: عدّاد `git ls-files src/data/{exercises,curriculum,micro-drills}` مع
   WARNING بدل الرفض (وظيفته البنية لا المحتوى).
4. فخّان أُصلحا بالقياس: `find` على مسار ناقض → خروج 2 يسري عبر `pipefail` إلى الإسناد فيوقف
   السكربت صامتًا (حُل باختبار `[ -d ]` أولًا)؛ و`git status --short | head -5` يقتل نفسه بـ SIGPIPE
   قبل الـ commit في `TERMUX_UNNEST_ROOT.sh` (حُل بعدادّ لا يترك SIGPIPE).
5. `tests/unit/delivery-layout.test.ts` أعيدت كتابته ووسّعته: **6/6 ناجح** (`npx vitest run` بعد
   `npm ci` · 471 حزمة) ويشمل الآن assertions على الترتيب (الحارس قبل الـ PAT)، وعلى `rmSync(OUT`
   داخل `fail`، وعلى ألا يبتلع `.gitignore` ملفات JSON.

## الحالة في نهاية الجولة

- `/home/user/wegberlin-full.zip`: **لا شيء** — الرفض الأول حذف الأرشيف الملفوف القديم (63,786,813 B ·
  `7f6958ae…`) الذي كان sidecar v155 يشير إليه. هذا مقصود: لا يجب أن يُرفع أي ملف لا يطابق sidecarه.
- `docs/run-logs/2026-09-21-unnest-root-1/` وأرشيف v155 المسطّح (1,756 ملفًا · 63,753,445 B ·
  `df8ab201f9ec5392f2be18a5a38dc9a9707e51028eec1560d5e2201702df6a39`) لم يعودا على القرص في هذا الجيل.
- أولوية ما يلى: استرجاع `src/data` الكامل → `npm run archive:delivery` (سيعبر الحرّاس) → فحص
  `sha256sum -c` → رفع بالتدفق المحروس → Vercel Root Directory = `.` → Redeploy. وبعدها يرجع عمل
  الدفعات (18 دفعة متبقية إلى وسيط 60).
