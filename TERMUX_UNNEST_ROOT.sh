#!/data/data/com.termux/files/usr/bin/bash
# Un-nest a repository whose project lives one folder too deep.
#
# Why this exists (measured 2026-09-21): https://github.com/naderba69/wegberlin `main` was pushed
# from a WRAPPED archive, so the repository root holds exactly one entry — `der-weg-nach-berlin/` —
# and `package.json` / `src/app/page.tsx` answer 404 at the root while returning 200 one level
# down. Vercel then fails with:
#   Couldn't find any `pages` or `app` directory. Please create one under the project root
# This script lifts the project to the repository root in ONE normal commit (no force push, full
# history kept) and refuses to touch anything that is already flat.
#
# Usage in Termux (nothing is downloaded, so it also works with a stale ZIP in Downloads):
#   GITHUB_USER=naderba69 REPOSITORY=wegberlin bash TERMUX_UNNEST_ROOT.sh
# Optional environment:
#   WORKDIR (default "$HOME/wegberlin-unnest") · SKIP_PUSH=1 to inspect without publishing
set -euo pipefail

GITHUB_USER="${GITHUB_USER:-naderba69}"
REPOSITORY="${REPOSITORY:-wegberlin}"
WRAPPER="${WRAPPER:-der-weg-nach-berlin}"
REPO_URL="${REPO_URL:-https://github.com/${GITHUB_USER}/${REPOSITORY}.git}"
WORKDIR="${WORKDIR:-$HOME/wegberlin-unnest}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Move the project to the repository root (fix nested-root layout)}"

for command in git unzip find; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing command: $command"; exit 1; }
done

if [ "${SKIP_PUSH:-0}" != "1" ]; then
  command -v gh >/dev/null 2>&1 || { echo "Missing command: gh (pkg install gh)"; exit 1; }
  printf "GitHub PAT (input hidden, used once via askpass, never stored): "
  IFS= read -rs GITHUB_PAT
  echo
  [ -n "$GITHUB_PAT" ] || { echo "Token cannot be empty."; exit 1; }
  TOKEN_USER="$(GH_TOKEN="$GITHUB_PAT" gh api user --jq .login)"
  if [ "$TOKEN_USER" != "$GITHUB_USER" ]; then
    unset GITHUB_PAT
    echo "The key belongs to ${TOKEN_USER}, expected ${GITHUB_USER}."
    exit 1
  fi
  ASKPASS_SCRIPT="${HOME}/.wegberlin-git-askpass"
  cat > "$ASKPASS_SCRIPT" <<'ASKPASS'
#!/data/data/com.termux/files/usr/bin/bash
case "$1" in
  *Username*) printf '%s\n' "$GITHUB_USER" ;;
  *Password*) printf '%s\n' "$GITHUB_PAT" ;;
  *) printf '\n' ;;
esac
ASKPASS
  chmod 700 "$ASKPASS_SCRIPT"
  trap 'rm -f "$ASKPASS_SCRIPT"; unset GITHUB_PAT' EXIT
else
  echo "SKIP_PUSH=1 — no authentication, nothing will be published."
fi

echo "Cloning ${REPO_URL} (main)…"
rm -rf "$WORKDIR"
git clone --depth 5 "$REPO_URL" "$WORKDIR" >/dev/null
cd "$WORKDIR"
git checkout main >/dev/null 2>&1 || git checkout -b main >/dev/null

echo "Root before: $(find . -mindepth 1 -maxdepth 1 ! -name .git | wc -l) entry/entries"
if [ -f package.json ] && [ -d src/app ]; then
  echo "Already flat: package.json and src/app are at the repository root. Nothing to do."
  exit 0
fi
if [ ! -f "${WRAPPER}/package.json" ]; then
  echo "Refusing: neither package.json at the root nor ${WRAPPER}/package.json exists."
  echo "This is not the nested layout this script repairs — stop and upload the delivery archive instead."
  exit 1
fi
if [ -f package.json ] || [ -d src ] || [ -d public ]; then
  echo "Refusing: the root is partially populated ($(ls -A | tr '\n' ' ')); a mixed layout needs a human decision."
  exit 1
fi

echo "Lifting ${WRAPPER}/ to the repository root with git mv (rename history preserved)…"
git -c core.quotepath=off ls-files -- "${WRAPPER}" > "${TMPDIR:-/tmp}/unnest-files.txt"
moved=0
while IFS= read -r path; do
  target="${path#${WRAPPER}/}"
  mkdir -p "$(dirname "$target")"
  git mv -f "$path" "$target"
  moved=$((moved + 1))
done < "${TMPDIR:-/tmp}/unnest-files.txt"
rm -f "${TMPDIR:-/tmp}/unnest-files.txt"
find "${WRAPPER}" -depth -type d -exec rmdir {} + 2>/dev/null || true
echo "Moved ${moved} tracked files up one level."

# Same deployability contract the uploader guard enforces: refuse to publish a root Next cannot build.
for required in package.json package-lock.json next.config.ts vercel.json src/app/page.tsx src/app/layout.tsx public/sw.js; do
  [ -e "$required" ] || { echo "Refusing to commit: $required is missing at the repository root."; exit 1; }
done
if [ -d "${WRAPPER}" ]; then
  echo "Refusing to commit: ${WRAPPER}/ still exists at the root with content: $(find "${WRAPPER}" -type f | wc -l) file(s)."
  exit 1
fi

data_tracked=$(git ls-files src/data/exercises src/data/curriculum src/data/micro-drills | wc -l)
echo "Authored data files tracked after un-nest: ${data_tracked}"
if [ "$data_tracked" -eq 0 ]; then
  echo "WARNING: the remote tracks no files under src/data/{exercises,curriculum,micro-drills}."
  echo "Un-nesting repairs the layout only — the content still must be pushed from a complete tree"
  echo "(generate it with 'npm run archive:delivery' and upload with TERMUX_REPLACE_REPO.sh)."
fi

git config user.name "${GITHUB_USER}"
git config user.email "${GITHUB_EMAIL:-${GITHUB_USER}@users.noreply.github.com}"
git add -A
# NB: never pipe a long-running producer into `head` here — with `set -o pipefail` the producer
# dies of SIGPIPE (141) and the script aborts before the commit.
echo "staged changes: $(git diff --cached --name-only | wc -l)"
if git diff --cached --quiet; then echo "Nothing staged — the tree already matches."; exit 0; fi
git commit -q -m "$COMMIT_MESSAGE"
echo "committed: $(git log -1 --pretty=%h)"

echo "Root after: $(git ls-files | awk -F/ '{print $1}' | sort -u | tr '\n' ' ')"
echo "src/app files at root: $(git ls-files src/app | wc -l) · package.json at root: $(git ls-files package.json | wc -l)"
if [ "${SKIP_PUSH:-0}" = "1" ]; then
  echo "SKIP_PUSH=1 — the commit exists locally at $WORKDIR (git log -1). Re-run without it to publish."
  exit 0
fi
GIT_ASKPASS="$ASKPASS_SCRIPT" GIT_TERMINAL_PROMPT=0 GITHUB_USER="$GITHUB_USER" GITHUB_PAT="$GITHUB_PAT" \
  git push origin main
echo "Published. https://github.com/${GITHUB_USER}/${REPOSITORY} — now set Vercel Root Directory to '.' and redeploy."
echo "The PAT was not stored by this script."
