# رفع WegBerlin الكامل من Termux إلى GitHub

آخر تدقيق: 2026-09-21 (بُنية الحزمة المسطّحة — ADR-082)

المستودع العام:

```text
https://github.com/naderba69/wegberlin
branch: main
```

## الملفات المطلوبة في Downloads

نزّل الملفين معًا:

```text
wegberlin-full.zip
wegberlin-full.zip.sha256
```

لا ترسل GitHub PAT في المحادثة، ولا تكتبه داخل رابط أو ملف أو أمر ظاهر.

**بُنية الحزمة (من v153):** `wegberlin-full.zip` **مسطّح** — `package.json` و`src/` و`public/` و`docs/` وغيرها في جذر الأرشيف مباشرةً، بلا مجلد ظرف. السكربت يكتشف الجذر من `package.json`، لذا يعمل على الحزمة المسطّحة كما على أي حزمة قديمة داخل `der-weg-nach-berlin/`؛ لكن استخراج السكربت نفسه بالأمر المختصر (`unzip -jo`) يتطلب الحزمة المسطّحة. إذا رأيتَ `caution: filename not matched` فالحزمة التي نزّلتها مغلّفة: اطلب حزمة v153 أو أحدث.

## أمر واحد: فحص ZIP ثم الاستبدال والرفع

انسخ الأمر كاملًا إلى Termux:

```bash
pkg update -y && pkg install -y git gh unzip coreutils nodejs-lts && termux-setup-storage && cd "$HOME/storage/downloads" && sha256sum -c wegberlin-full.zip.sha256 && rm -rf "$HOME/wegberlin-upload-tools" && mkdir -p "$HOME/wegberlin-upload-tools" && unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh -d "$HOME/wegberlin-upload-tools" && chmod +x "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" && "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" "$HOME/storage/downloads/wegberlin-full.zip" "Update audited WegBerlin learning platform"
```

إذا ظهر طلب صلاحية الوصول إلى الملفات بعد `termux-setup-storage`، وافق عليه ثم أعد الأمر.

## GitHub PAT المطلوب

السكربت يطلب المفتاح بإدخال مخفي. استخدم أحد الخيارين:

- Fine-grained PAT للمستودع `naderba69/wegberlin` مع:
  ```text
  Contents: Read and write
  ```
- Classic PAT بصلاحية:
  ```text
  repo
  ```

السكربت لا يستخدم `gh auth login`، لذلك لا يطلب `read:org`. يتحقق من صاحب المفتاح بواسطة:

```bash
GH_TOKEN="$GITHUB_PAT" gh api user --jq .login
```

ثم يستخدم AskPass مؤقتًا ويحذفه عند الخروج.

## ماذا يفعل السكربت؟

1. يتحقق من ZIP وSHA-256 إن وجد.
2. يرفض أي ZIP يحتوي `.git`.
3. يكتشف جذر المشروع حتى لو كان داخل مجلد متداخل.
4. يتحقق من `package.json` و`package-lock.json` وREADME والبرومبت الاحتياطي.
5. يتحقق أن PAT يعود للحساب `naderba69`.
6. يعمل Clone للمستودع ويحافظ على `.git` والتاريخ.
7. يحذف شجرة المشروع القديمة فقط ثم ينسخ الحزمة الجديدة.
8. يحذف `node_modules` و`.next` وملفات البيئة والنسخ الشخصية إن وجدت.
9. يفعّل `.githooks/pre-commit` ويفحص النص الحالي وكل Git history قبل Staging.
10. ينفذ `git add -A` وCommit وPush إلى `main` دون Force.
11. لا يخزن PAT في Remote URL أو shell history أو إعدادات `gh`.

## التحقق بعد الرفع

```bash
cd "$HOME/wegberlin-clean-upload"
git status --short
git log -1 --oneline
git ls-remote origin refs/heads/main
```

يجب أن يكون `git status --short` فارغًا، وأن يتطابق SHA المحلي مع `refs/heads/main` البعيد.

افتح أيضًا:

```text
https://github.com/naderba69/wegberlin
```

وتأكد من وجود `package.json` و`src/app/` **في جذر المستودع مباشرةً** — لا داخل مجلد `der-weg-nach-berlin/` (وجود ذلك المجلد في الجذر يعني أرشيفًا ملفوفًا ويفسد النشر)، ومن وجود:

```text
package.json
src/app/page.tsx
src/app/layout.tsx
vercel.json
PROFESSIONAL_CONTINUATION_PROMPT_AR.md
src/config/source-verification-registry.json
src/core/content-validation/schemas.ts
reports/academic-content-audit.json
src/core/evidence/mastery-weighting.ts
src/core/srs/sm2.ts
src/data/lexical-grammar-a1.ts
src/data/lexical-grammar-a2.ts
src/data/lexical-grammar-b1.ts
src/data/lexical-grammar-b2.ts
src/data/lexical-grammar-registry.ts
src/components/lexical-grammar-panel.tsx
```

## بناء أرشيف التسليم (من جهة الوكيل)

الأرشيف يُبنى دائمًا من جذر المشروع بأمرٍ واحد يتحقق من البنية بدل أن يفترضها:

```bash
cd /home/user/der-weg-nach-berlin && npm run archive:delivery   # DELIVERY_ZIP=/path/eto/target.zip للاختيار
```

يكتب الأرشيف ثم `wegberlin-full.zip.sha256` بجانبه، ويعيد التحقق من الـSHA ومن `unzip -t`، **ويرفض** أي أرشيف
يحمل مجلد ظرف `der-weg-nach-berlin/` أو يفتقد أحد تسعة ملفات حرجة للنشر في جذره (`package.json`,
`package-lock.json`, `next.config.ts`, `vercel.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `public/sw.js`,
البرومت، وهذا السكربت). لا يُثبَّت حجم الأرشيف ولا الـSHA في الوثائق؛ الأعداد الموثّقة هي عدد الملفات والمجلدات.

## أخطاء سابقة وحلولها

### Couldn't find any `pages` or `app` directory (Vercel)

حدث هذا عند `368d6e8` (2026-09-21): رُفع `main` من أرشيف **ملفوف**، فصار كل شيء تحت `der-weg-nach-berlin/`،
وبنى Vercel من جذرٍ لا يحوي `src/app` فخرج:`Couldn't find any pages or app directory. Please create one under the project root`

الحلّ بالترتيب: (1) أعد بناء الأرشيف بـ`npm run archive:delivery`؛ (2) شغّل `TERMUX_REPLACE_REPO.sh` (هو يفحص
البنية قبل الـcommit ويرفض الجذر الملفوف)؛ (3) في لوحة Vercel تأكد أن **Root Directory = `.`** (جذر المستودع)
لأن `package.json` و`src/app` صارَا فيه؛ (4) أعد Trigger Deployment وراقب السجل: يجب أن يظهر `npm run build`
(لا `vercel-build`) لأن `build` هو ما يشغّل تدقيقات `prebuild` السبعة عشر.

فحص سريع من أي جهاز بعد الرفع:

```bash
git ls-remote origin refs/heads/main
curl -sf "https://api.github.com/repos/naderba69/wegberlin/contents/src/app?ref=main" | grep -c '"name"' || echo "src/app غائب عن الجذر — الأرشيف كان ملفوفًا"
```


### ZIP contains no package.json

استخدم `TERMUX_REPLACE_REPO.sh` الموجود في الحزمة الحالية؛ فهو يكتشف `package.json` في الجذر أو داخل مجلد متداخل.

### missing required scope read:org

لا تستخدم `gh auth login --with-token` لهذا المسار. السكربت الحالي يستخدم `GH_TOKEN` مؤقتًا ولا يحتاج `read:org`.

### checksum file not found

نزّل أيضًا:

```text
wegberlin-full.zip.sha256
```

لا يمنع غياب الملف السكربت من فحص بنية ZIP، لكن التحقق بالـSHA-256 أفضل ويجب استعماله في التسليم النهائي.

### حرّاس المحتوى الجدد (2026-09-21 · الجولة الثانية)

الرفع الآن **لا يطلب الـ PAT إلا بعد أن يتحقّق من الأرشيف**، ويرفض قبل أي عملية شبكة إذا كان
المحتوى المؤلَّف مفقودًا. السلسلة بالمختبر (شجرة كاملة اصطناعية + `gh` مزيف + HOME معزول):

| الفحص | الرسالة عند الفشل | خرج |
|---|---|---|
| بنية ZIP (جذر مسطّح، لا `.git`، الملفات المطلوبة) | `ZIP structure: OK` أو `ZIP project root is missing …` | 1 |
| `src/app/page.tsx` و`layout.tsx` و`public/sw.js` و`PROFESSIONAL_CONTINUATION_PROMPT_AR.md` في جذر المشروع المستخرج | `Archive is undeployable: <file> is missing at the project root` | 1 |
| **مجلدات البيانات**: `src/data/exercises`، `src/data/curriculum`، `src/data/micro-drills` غير فارغة | `Archive is undeployable: src/data/exercises holds no files in the staged tree.` + سطر الحل `regenerate it in the project and run: npm run archive:delivery` | 1 |
| بعد `git add -A`: عدد ملفات البيانات المتتبَّعة | `Refusing to commit: git tracks 0 files under the authored data directories.` | 1 |

وعند النجاح تُطبع العدّادات قبل السؤال عن المفتاح: `staged src/data/exercises: N files` إلخ.
ملاحظة قياس: `find` على مسار غير موجود يخرج 2، وتحت `set -o pipefail` ينتقل هذا الوضع إلى الإسناد
فيوقف السكربت **صامتًا** قبل طباعة الرسالة — لذلك يُختبر وجود المجلد أولًا (`[ -d … ]`).

`scripts/build-delivery-archive.mjs` يضيف نفس العقدين على جهة التوليد: يفحص الشجرة قبل الضغط
(`delivery archive refused: data directory missing from the tree: src/data/exercises`) ثم يعاود
التحقق من الأرشيف نفسه ويطبع `authored data files: src/data/exercises=N · …`، وأي رفض **يحذف**
الأرشيف القديم والـ sidecar (هذا هو سبب بقاء `wegberlin-full.zip` ملفوفًا bytes قديمة بجانب
sidecar جديد مرتين). الاختبار المنظومي: `tests/unit/delivery-layout.test.ts` (6 حالات) يثبّت هذه
السلوكات نصيًا وترتيبيًا.

### استرجاع بيانات `src/data` من أي نسخة على الجهاز

إذا كان المستودع أو الأرشيف بلا محتوى التمارين (القياس: `main` يتتبّع 79 ملفًا تحت `src/data` فقط)،
فسّاحة العمل ليست المصدر الوحيد الممكن: أي ZIP قديم في `Downloads` قد يحويها. السكربت
`scripts/recover-src-data.mjs` يبحث، ويقيس، ويسترجع، ويترك نسخة مرآتية مضغوطة حتى لا تضيع مجددًا:

```bash
npm run data:recover probe            # يعرض كل ZIP/مجلد مرشّح وعدّاداته: exercises/curriculum/micro-drills
npm run data:recover restore --from ~/storage/downloads/wegberlin-full.zip --apply
npm run data:recover backup           # scratch/src-data-backup.tar.gz + sha
npm run data:recover verify           # عدد الشجرة == عدد المرآة
```

حدّ اللياقة المقاسة: `exercises >= 900` · `curriculum >= 30` · `micro-drills >= 10` (شجرة v155 كانت
1,202 ملفًا تحت `src/data`). الاسترجاع **لا يحذف شيئًا**: ينسخ ما ينقص فقط، ويرفض قبل أي كتابة إذا كان
المرشّح نفسه ناقصًا، ويرفض عمل backup على شجرة ناقصة حتى لا تُسجَّل الخسارة كاحتياط.

قِيس مخبريًا على شجرة وهمية كاملة وحقيقية ناقصة:
- `probe` على ZIP فيه البيانات → `exercises=901 · curriculum=31 · micro-drills=11 · members 952 · COMPLETE ✓`
- `restore --from <zip> --apply` → `after restore: … src/data total 943` ثم `backup`/`verify` → `tree 943 data files == mirror 943`
- على حالة الفقد الحقيقية → `recovery refused: no candidate holds a complete src/data …` وخروج 1
- `backup` على شجرة ناقصة → `refusing to snapshot an incomplete tree (…exercises=missing…)` وخروج 1

**لا يُختبَر هذا السكربت بحذف `src/data`**: كل عدّاداته تُطبع في رسالة الرفض، فاسترجع أولًا ثم ابنِ.

### الأمر الكامل المطلوب (فكّ الملفوف ثم ارفع `main` مباشرة): `TERMUX_UNNEST_PUSH.sh`

هذا الأمر مطابق لصيغتكم المفضّلة (unzip → إزالة المجلد العلوي → git init → push) لكنه لا يرفع إلا إذا
كان الجذر صالحًا للنشر والمحتوى موجودًا. من Termux، مع الأرشيف في `Downloads`:

انسخوه كما هو بعد استبدال الـ PAT (نفس النص حرفيًا في `TERMUX_UNNEST_PUSH.sh`):

```bash
PAT='github_pat_XXXX' bash -c '
set -e
[ -n "$PAT" ] || { echo "❌ ضع الـ PAT داخل السطر"; exit 1; }
command -v unzip >/dev/null || pkg install -y unzip
command -v git   >/dev/null || pkg install -y git
command -v sha256sum >/dev/null || pkg install -y coreutils

ZIP=""
for d in ~/storage/downloads ~/downloads ~/Downloads ~/; do
  [ -f "$d/wegberlin-full.zip" ] && ZIP="$d/wegberlin-full.zip" && break
done
[ -n "$ZIP" ] || { echo "❌ نزّل wegberlin-full.zip من الورشة أولاً (Downloads)"; exit 1; }
echo "── الأرشيف: $ZIP"
unzip -tq "$ZIP"

if [ -f "$ZIP.sha256" ]; then
  if (cd "$(dirname "$ZIP")" && sha256sum -c "$(basename "$ZIP").sha256"); then echo "── ✓ الأرشيف يطابق sidecar"; else echo "❌ الأرشيف لا يطابق sidecar — لا ترفعه"; exit 1; fi
else
  echo "⚠ لا sidecar — فُحص هيكل الأرشيف فقط"
fi

EX=$(unzip -l "$ZIP" | grep -c src/data/exercises/ || true)
CU=$(unzip -l "$ZIP" | grep -c src/data/curriculum/ || true)
echo "── محتوى الأرشيف: تمارين=$EX منهاج=$CU"
[ "$EX" -gt 0 ] || { echo "❌ الأرشيف بلا ملفات تمارين (src/data/exercises = 0) — لا ترفعه إلى main"; exit 1; }

rm -rf ~/wegberlin-push
mkdir -p ~/wegberlin-push
unzip -q "$ZIP" -d ~/wegberlin-push
cd ~/wegberlin-push

shopt -s dotglob nullglob
[ -d der-weg-nach-berlin ] && mv der-weg-nach-berlin/* . && rmdir der-weg-nach-berlin
shopt -u dotglob nullglob
[ -d der-weg-nach-berlin ] && { echo "⚠ بقايا من المجلد الملفوف"; ls -la der-weg-nach-berlin; exit 1; }

[ -f package.json ] && [ -d src/app ] && [ -f public/sw.js ] || { echo "⚠ الجذر غير صحيح:"; ls -la; exit 1; }
[ -d .github/workflows ] && echo "── ✓ سير عمل CI موجود" || echo "⚠ لا يوجد .github/workflows"
chmod +x .githooks/pre-commit 2>/dev/null || true
rm -rf node_modules .next test-results playwright-report coverage tsconfig.tsbuildinfo .env .env.local

git init -q -b main
git config user.name "naderba69"
git config user.email "naderba69@users.noreply.github.com"
git add -A
echo "── سيُدفع: $(git ls-files | wc -l) ملفًا · src/app=$(git ls-files src/app | wc -l) · بيانات=$(git ls-files src/data/exercises src/data/curriculum | wc -l)"
[ "$(git ls-files src/app | wc -l)" -gt 0 ] || { echo "❌ src/app غير متتبَّع — لا ترفع"; exit 1; }
git commit -qm "wegberlin v155 — flat root, content restored, delivery guards"

U="https://naderba69:$PAT@github.com/naderba69/wegberlin.git"
git push -f "$U" main:main
git ls-remote "$U" refs/heads/main
unset PAT U
echo "── ✓ الجذر مسطّح ورُفع إلى main — Vercel → Settings → Root Directory = . ← ثم Redeploy"
'
```

ملاحظة صياغة قِيسَت: النص داخل `bash -c '…'` لا يحتمل اقتباسًا مزدوجًا متداخلًا داخل `$( … )`
(`bash -n` على الملف لا يكشفه، لأن المتن مجرد نص حتى التنفيذ)؛ لذلك يُعدّ العدد بلا اقتباس
متداخل، ويُغطّى حفظ الملفات المخفية بـ `shopt -s dotglob` وبسطور التحقق بعدها.

ماذا يفعل وما قِيس عليه (على remote حقيقي محلي في المختبر):

| الحالة | السلوك المقاس |
|---|---|
| أرشيف ملفوف فيه بيانات | يزيل `der-weg-nach-berlin/` مع المخفي (`dotglob`)، يطبع `سيُدفع: 18 ملفًا · src/app=2 · بيانات=6` ثم `main -> main` و`git ls-remote` يعرض الـ sha (قِيس: `pre-commit` منفَّذ، `node_modules` = 0، بقايا الملفوف = 0) |
| أرشيف مسطّح أصلًا | نفس النتيجة بلا إزالة شيء (المسار الآمن لـ `set -e` مختبَر: لا يتعثر عند `[ -d … ] && mv`) |
| أرشيف بلا `src/data/exercises` | يرفض **قبل** أي كتابة: `❌ هذا الأرشيف لا يحوي ملفات التمارين … لا ترفعه إلى main` · خروج 1 |
| sidecar مطابق / مغايِر | `✓ الأرشيف يطابق sidecar` / `❌ الأرشيف لا يطابق …` وخروج 1 (الرفض قبل الرفع، لأن الأرشيف القديم المغايِر هو ما رُفع مرتين) |
| الجذر المدفوع | `package.json` · `src/` · `public/` · `.github/` · `.githooks/` · `.gitignore` في الجذر، و**0** بقايا `der-weg-nach-berlin/`، و0 من `node_modules` |

ملاحظتان: `git init` + `push -f` يستبدلان تاريخ `main` بـ commit واحد (قِيس: `1 commit(s)`)؛ إن أردتم
الحفاظ على التاريخ استخدموا `TERMUX_UNNEST_ROOT.sh` أسفله. والـ PAT يظهر في سطر عملية `git push` لحظة
واحدة ولا يُخزَّن في `remote` ولا في `.git/config` (لا `git remote add` إطلاقًا). بعد الرفع: Vercel →
Settings → **Root Directory = `.`** ثم Redeploy.

### إصلاح الجذر الملفوف في مكانه: `TERMUX_UNNEST_ROOT.sh`

إذا كان جذر المستودع على GitHub يحتوي مجلدًا واحدًا فقط (`der-weg-nach-berlin/`) ولا `package.json`
في الجذر، فالتسطيح لا يستلزم رفع أرشيف جديد: السكربت `TERMUX_UNNEST_ROOT.sh` في جذر المستودع ينقل
الملفات من المجلد الداخلي إلى الجذر في commit واحد عادي عبر `git mv` (تاريخ كامل، renames نقية،
**بدون** `push --force`).

```bash
GITHUB_USER=naderba69 REPOSITORY=wegberlin bash TERMUX_UNNEST_ROOT.sh
# لمعاينة بدون نشر: أضِف SKIP_PUSH=1
```

سلوكه مقاس مخبريًا على نسخة من `main`:

| حالة الجذر | النتيجة |
|---|---|
| ملفوف | 1,711 ملفًا إلى الجذر بـ renames (0 إدراج/حذف)، تحقق أن `package.json` و`src/app/page.tsx` و`public/sw.js` في الجذر، ثم commit ودفع عادي إلى `main` |
| مسطّح | «Already flat … Nothing to do» وخروج 0 بلا تعديل |
| مختلط (هذا وذاك) | رفض بخروج 1 — قرار بشري |
| لا هذا ولا ذاك | رفض بخروج 1 مع إحالة إلى رفع أرشيف التسليم |

**قيدا يُعرف بالقياس (2026-09-21):** `main` يتتبع 79 ملفًا فقط تحت `src/data` (`.ts` في المستوى
الأول)؛ `src/data/exercises/**` و`src/data/curriculum/**` ليست في المستودع البعيد إطلاقًا
(`git ls-files 'der-weg-nach-berlin/src/data' | wc -l` = 79 على clone نقي لـ `368d6e8`). فتسطيح
الجذر يُصلح البنية ولا يُصلح المحتوى: يجب رفع أرشيف تسليم مسطّح مولَّد من نسخة كاملة من
`src/data` (يُنشأ بـ `npm run archive:delivery`)، ثم Root Directory = `.` و Redeploy.
## قواعد أمنية

- ممنوع `git push -f`.
- ممنوع وضع PAT في `https://user:TOKEN@github.com/...`.
- ممنوع رفع `.env` أو `.dwnb` أو تسجيلات المتعلم.
- المستودع عام، لذلك راجع `git status --short` قبل الرفع.
- لا تعتبر Vercel منشورًا قبل وجود Production URL وPR Preview URL فعليين.
