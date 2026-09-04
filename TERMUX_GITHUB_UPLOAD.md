# رفع WegBerlin الكامل من Termux إلى GitHub

آخر تدقيق: 2026-09-04

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

## أمر واحد: فحص ZIP ثم الاستبدال والرفع

انسخ الأمر كاملًا إلى Termux:

```bash
pkg update -y && pkg install -y git gh unzip coreutils && termux-setup-storage && cd "$HOME/storage/downloads" && sha256sum -c wegberlin-full.zip.sha256 && rm -rf "$HOME/wegberlin-upload-tools" && mkdir -p "$HOME/wegberlin-upload-tools" && unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh -d "$HOME/wegberlin-upload-tools" && chmod +x "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" && "$HOME/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh" "$HOME/storage/downloads/wegberlin-full.zip" "Update audited WegBerlin handoff and A2 lexical grammar"
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
9. ينفذ `git add -A` وCommit وPush إلى `main` دون Force.
10. لا يخزن PAT في Remote URL أو shell history أو إعدادات `gh`.

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

وتأكد من وجود:

```text
PROFESSIONAL_CONTINUATION_PROMPT_AR.md
src/config/source-verification-registry.json
src/core/content-validation/schemas.ts
reports/academic-content-audit.json
src/core/evidence/mastery-weighting.ts
src/core/srs/sm2.ts
src/data/lexical-grammar-a1.ts
src/components/lexical-grammar-panel.tsx
```

## أخطاء سابقة وحلولها

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

## قواعد أمنية

- ممنوع `git push -f`.
- ممنوع وضع PAT في `https://user:TOKEN@github.com/...`.
- ممنوع رفع `.env` أو `.dwnb` أو تسجيلات المتعلم.
- المستودع عام، لذلك راجع `git status --short` قبل الرفع.
- لا تعتبر Vercel منشورًا قبل وجود Production URL وPR Preview URL فعليين.
