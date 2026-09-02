# تحديث GitHub من Termux — naderba69/wegberlin

المستودع العام موجود بالفعل:

```text
https://github.com/naderba69/wegberlin
```

لا تستخدم `git init` في مجلد جديد ولا تستخدم `--force`. الطريقة الآمنة هي Clone للمستودع الموجود، الحفاظ على `.git`، وحذف **كل ملفات شجرة المشروع القديمة** ثم فك ZIP المدقق ورفع الاستبدال كـCommit واحد. هذا يمنع خلط النسخ مع الحفاظ على تاريخ المستودع وإعداداته.

## الاستبدال الكامل باستخدام GitHub Key/PAT

يحتاج المفتاح إلى أحد الخيارين:

- Fine-grained PAT مخصص للمستودع `naderba69/wegberlin` مع `Contents: Read and write`.
- Classic PAT بصلاحية `repo`.

لا ترسل المفتاح داخل المحادثة ولا تكتبه داخل URL.

ضع `wegberlin.zip` و`wegberlin.zip.sha256` في Downloads، ثم:

```bash
pkg update -y
pkg install -y git gh unzip
termux-setup-storage

cd ~/storage/downloads
sha256sum -c wegberlin.zip.sha256
unzip -t wegberlin.zip

rm -rf ~/wegberlin-upload-tools
mkdir -p ~/wegberlin-upload-tools
unzip -j wegberlin.zip TERMUX_REPLACE_REPO.sh -d ~/wegberlin-upload-tools
chmod +x ~/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh

~/wegberlin-upload-tools/TERMUX_REPLACE_REPO.sh \
  ~/storage/downloads/wegberlin.zip \
  "Clean replacement with audited WegBerlin project"
```

سيطلب السكربت GitHub PAT بإدخال مخفي، ويتحقق أن الحساب هو `naderba69` عبر `GH_TOKEN`. لا يستعمل `gh auth login`، ولذلك لا يحتاج `read:org` ولا يخزن المفتاح. ثم يحذف كل ملفات المشروع القديمة محليًا مع إبقاء `.git` فقط، يفك ZIP، ينفذ `git add -A`، ثم Commit وPush إلى `main` عبر AskPass مؤقت يُحذف فورًا.

## الطريقة السريعة الموصى بها دون إدخال PAT يدوي كل مرة

ضع الملفين التاليين في Downloads:

```text
wegberlin.zip
wegberlin.zip.sha256
```

ثم في Termux:

```bash
pkg update -y
pkg install -y git gh unzip
termux-setup-storage

gh auth login --hostname github.com --git-protocol https --web
```

بعد نجاح تسجيل الدخول، فك ZIP مؤقتًا للحصول على سكربت التحديث ثم شغله:

```bash
cd ~/storage/downloads
sha256sum -c wegberlin.zip.sha256
unzip -t wegberlin.zip

rm -rf ~/wegberlin-upload-tools
mkdir -p ~/wegberlin-upload-tools
unzip -j wegberlin.zip TERMUX_UPDATE_GITHUB.sh -d ~/wegberlin-upload-tools
chmod +x ~/wegberlin-upload-tools/TERMUX_UPDATE_GITHUB.sh

~/wegberlin-upload-tools/TERMUX_UPDATE_GITHUB.sh \
  ~/storage/downloads/wegberlin.zip \
  "Fix beginner onboarding, writing gate, and resilient audio"
```

السكربت يقوم آليًا بـ:

1. فحص ZIP والـSHA-256 إن وجد.
2. التحقق من `gh auth`.
3. Clone أو Pull للمستودع الحالي.
4. رفض الكتابة إذا كان مجلد Git المحلي يحتوي تغييرات غير محفوظة.
5. الحفاظ على `.git` وحذف ملفات النسخة القديمة فقط.
6. فك ZIP الجديد.
7. ضبط:

```text
user.name  = naderba69
user.email = balinader@gmail.com
```

8. تنفيذ `git add -A` حتى تُسجل الملفات المحذوفة أيضًا.
9. Commit ثم Push إلى `main` دون Force.

## الطريقة اليدوية المكافئة

```bash
pkg update -y
pkg install -y git gh unzip
termux-setup-storage

gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git

cd ~/storage/downloads
sha256sum -c wegberlin.zip.sha256
unzip -t wegberlin.zip

rm -rf ~/wegberlin
git clone https://github.com/naderba69/wegberlin.git ~/wegberlin
cd ~/wegberlin

find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
unzip -q ~/storage/downloads/wegberlin.zip -d .

git config user.name "naderba69"
git config user.email "balinader@gmail.com"
git remote set-url origin https://github.com/naderba69/wegberlin.git

git add -A
git status
git commit -m "Fix beginner onboarding, writing gate, and resilient audio"
git push origin main
```

## التحقق بعد الرفع

```bash
cd ~/wegberlin
git status
git log -1 --oneline
gh repo view naderba69/wegberlin --web
```

يجب أن تكون نتيجة `git status`:

```text
nothing to commit, working tree clean
```

## تحديثات لاحقة

نزّل ZIP الأحدث إلى Downloads، ثم شغّل السكربت نفسه:

```bash
~/wegberlin-upload-tools/TERMUX_UPDATE_GITHUB.sh \
  ~/storage/downloads/wegberlin.zip \
  "Describe the audited update"
```

## ملاحظات أمنية

- لا تضع GitHub Token في رابط Remote أو داخل ملف.
- لا ترفع `.env` أو `.dwnb` أو التسجيلات الشخصية.
- ZIP يستبعد `node_modules` و`.next` ونتائج الاختبارات.
- المستودع عام؛ لا تضع فيه أي بيانات شخصية للمتعلمين.
- الوكيل الجديد يستطيع قراءة GitHub مباشرة بعد Push، دون رفع ملفات في المحادثة:

```bash
git clone https://github.com/naderba69/wegberlin.git
```
