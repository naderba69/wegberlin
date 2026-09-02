# رفع wegberlin إلى GitHub من Termux

المالك: `naderba69`  
المستودع: `wegberlin`  
البريد المستخدم في Git commits: `balinader@gmail.com`

> لا تضع GitHub Token داخل المشروع أو داخل رابط Remote. استخدم `gh auth login` فقط.

## 1. تثبيت أدوات Termux

```bash
pkg update -y
pkg install -y git gh unzip
termux-setup-storage
```

وافق على إذن الملفات عند ظهوره، ثم ضع الملف `wegberlin.zip` في مجلد Downloads في الهاتف.

## 2. فحص ZIP وفكّه في مجلد نظيف

```bash
cd ~/storage/downloads
unzip -t wegberlin.zip

rm -rf ~/wegberlin
mkdir -p ~/wegberlin
unzip wegberlin.zip -d ~/wegberlin
cd ~/wegberlin
```

## 3. إعداد Git بالاسم والبريد المطلوبين

```bash
git init
git branch -M main
git config user.name "naderba69"
git config user.email "balinader@gmail.com"

git add .
git status
git commit -m "Initial release: Der Weg nach Berlin A1-B2"
```

## 4. تسجيل الدخول الآمن إلى GitHub

```bash
gh auth login --hostname github.com --git-protocol https --web
```

سيعرض Termux رمزًا ورابطًا. افتح الرابط في المتصفح، أدخل الرمز، ووافق. لا تكتب كلمة مرور GitHub في `git remote`.

تحقق:

```bash
gh auth status
```

## 5. إنشاء المستودع أو استعمال الموجود ثم الرفع

انسخ الكتلة كاملة:

```bash
if gh repo view naderba69/wegberlin >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin https://github.com/naderba69/wegberlin.git
  else
    git remote add origin https://github.com/naderba69/wegberlin.git
  fi
  git push -u origin main
else
  gh repo create naderba69/wegberlin \
    --public \
    --description "Guidance-first German learning platform for Arabic speakers, A1 to B2" \
    --source=. \
    --remote=origin \
    --push
fi
```

الرابط المتوقع بعد النجاح:

```text
https://github.com/naderba69/wegberlin
```

افتحه:

```bash
gh repo view naderba69/wegberlin --web
```

## إذا ظهر رفض non-fast-forward

هذا يعني أن المستودع الموجود يحتوي Commit سابقًا (مثل README أنشأه GitHub). لا تستخدم `--force` مباشرة. نفّذ:

```bash
git fetch origin main
git pull --rebase origin main --allow-unrelated-histories
# إذا ظهر تعارض: عدّل الملف، ثم git add FILE && git rebase --continue
git push -u origin main
```

إذا كان المستودع التجريبي لا يحتوي شيئًا مهمًا وتريد استبداله بالكامل، راجع محتواه على GitHub أولًا قبل التفكير في `--force-with-lease`.

## الرفع بعد التطوير لاحقًا

```bash
cd ~/wegberlin
git status
git add .
git commit -m "Describe the completed change"
git push
```

## ملاحظات مهمة

- لا ترفع `.dwnb` أو `.env` أو API keys أو تسجيلاتك الشخصية.
- `.gitignore` يمنع `node_modules` و`.next` ونتائج الاختبار وملفات ZIP وDWNB ولقطات Debug.
- ملفات MP3 المولدة جزء من المشروع وحجم المستودع الحالي مناسب لـGitHub، ولا يحتاج Git LFS حاليًا.
- GitHub Actions سيشغّل فحوص Ubuntu بعد الرفع. تشغيل Next.js وPlaywright مباشرة على Android/Termux قد يواجه قيود binary/browser، لذلك فشل تشغيل محلي على الهاتف لا يعني أن CI على Ubuntu سيفشل.
- لا تحذف `package-lock.json`؛ فهو يثبت نسخ الحزم في CI وVercel.
