#!/data/data/com.termux/files/usr/bin/bash
# Paste-in-Termux flow, in the shape the owner asked for: unzip the delivery archive, lift the
# contents of `der-weg-nach-berlin/` into the repository root (dotfiles included), verify the root is
# deployable and the content is present, then publish `main`. Refuses a wrapped leftover, an archive
# with no src/data exercises, and a ZIP that does not match its sidecar.
#
#   PAT='github_pat_…' COMMIT_MESSAGE='wegberlin v155 — flat root' bash TERMUX_UNNEST_PUSH.sh
# Lab-verified 2026-09-21 against three archives (wrapped+data, flat+data, wrapped-without-data) and
# two sidecars (matching, mismatching) against a bare origin: pushed main = package.json + src/app +
# public + .github + .githooks at the root, 0 `der-weg-nach-berlin/` leftovers.
set -e
# The same code is published as a paste-ready block in TERMUX_GITHUB_UPLOAD.md (there it is wrapped
# in `PAT='…' bash -c '…'`); keep the two in step. Both were parsed by `bash -n` after the nesting fix.
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
unzip -tq "$ZIP" || { echo "❌ الأرشيف تالف"; exit 1; }

# الأرشيف الصحيح يسبقه sidecar؛ إن وُجد فلا ترفع قبل مطابقته (مطابقة فشل = أرشيف قديم/مغايِر)
if [ -f "$ZIP.sha256" ]; then
  if (cd "$(dirname "$ZIP")" && sha256sum -c "$(basename "$ZIP").sha256"); then
    echo "── ✓ الأرشيف يطابق sidecar"
  else
    echo "❌ الأرشيف لا يطابق wegberlin-full.zip.sha256 — هذا ملف قديم أو مغايِر، لا ترفعه"
    exit 1
  fi
else
  echo "⚠ لا sidecar — فُحص هيكل الأرشيف فقط"
fi

# عدّادات المحتوى قبل أي شيء: أرشيف بلا src/data يرفع مستودعًا لا يبني شيئًا
EX=$(unzip -l "$ZIP" | grep -c 'src/data/exercises/' || true)
CU=$(unzip -l "$ZIP" | grep -c 'src/data/curriculum/' || true)
echo "── محتوى الأرشيف: تمارين=$EX منهاج=$CU"
[ "$EX" -gt 0 ] || { echo "❌ هذا الأرشيف لا يحوي ملفات التمارين (src/data/exercises = 0) — لا ترفعه إلى main"; exit 1; }

rm -rf ~/wegberlin-push
mkdir -p ~/wegberlin-push
unzip -q "$ZIP" -d ~/wegberlin-push
cd ~/wegberlin-push

# إزالة المجلد العلوي der-weg-nach-berlin/ مع الملفات المخفية (.github، .gitignore، .githooks)
shopt -s dotglob nullglob
[ -d der-weg-nach-berlin ] && mv der-weg-nach-berlin/* . && rmdir der-weg-nach-berlin
shopt -u dotglob nullglob
[ -d der-weg-nach-berlin ] && { echo "⚠ بقايا من المجلد الملفوف:"; ls -la der-weg-nach-berlin; exit 1; }

[ -f package.json ] && [ -d src/app ] && [ -f public/sw.js ] || { echo "⚠ الجذر غير صحيح:"; ls -la; exit 1; }
[ -d .github/workflows ] && echo "── ✓ سير عمل CI موجود" || echo "⚠ لا يوجد .github/workflows"
chmod +x .githooks/pre-commit 2>/dev/null || true

# نظافة لا تُساوم: لا node_modules ولا .next ولا ملفات بناء في المستودع
rm -rf node_modules .next test-results playwright-report coverage tsconfig.tsbuildinfo .env .env.local

git init -q -b main
git config user.name "naderba69"
git config user.email "naderba69@users.noreply.github.com"
git add -A
echo "── سيُدفع: $(git ls-files | wc -l) ملفًا · src/app=$(git ls-files src/app | wc -l) · بيانات=$(git ls-files src/data/exercises src/data/curriculum | wc -l)"
[ "$(git ls-files src/app | wc -l)" -gt 0 ] || { echo "❌ src/app غير متتبَّع — لا ترفع"; exit 1; }
git commit -qm "$COMMIT_MESSAGE"

U="${REPO_URL:-https://naderba69:$PAT@github.com/naderba69/wegberlin.git}"
git push -f "$U" main:main
git ls-remote "$U" refs/heads/main
unset PAT U
echo "── ✓ فُكّ الضغط وسُطِّح الجذر ورُفع — افتح Vercel → Settings → Root Directory = '.' ثم Redeploy"
