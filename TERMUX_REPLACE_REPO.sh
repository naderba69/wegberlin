#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

GITHUB_USER="naderba69"
GITHUB_EMAIL="balinader@gmail.com"
REPOSITORY="wegberlin"
REPO_URL="https://github.com/${GITHUB_USER}/${REPOSITORY}.git"
ARCHIVE="${1:-${HOME}/storage/downloads/wegberlin-full.zip}"
WORKDIR="${HOME}/wegberlin-clean-upload"
COMMIT_MESSAGE="${2:-Update audited WegBerlin learning platform}"

for command in git gh unzip sha256sum node npm; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing command: $command"; exit 1; }
done

[ -f "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }
unzip -t "$ARCHIVE" >/dev/null
ARCHIVE_LIST="$(unzip -Z1 "$ARCHIVE")"
PACKAGE_ENTRY="$(printf '%s\n' "$ARCHIVE_LIST" | grep -E '(^|/)package\.json$' | head -n 1 || true)"
[ -n "$PACKAGE_ENTRY" ] || { echo "ZIP contains no package.json at any folder depth."; exit 1; }
PROJECT_PREFIX="${PACKAGE_ENTRY%package.json}"
# Membership test for the ZIP listing. Never `printf … | grep -q`: grep exits at the first match,
# the writer then dies on SIGPIPE, and `set -o pipefail` turns that into status 141 — measured on
# 2026-09-21, where a valid flat archive was refused with "ZIP project root is missing
# package-lock.json" (and a `.git/` presence check could silently pass). A here-string loop has no
# pipe, so neither false refusal nor false acceptance is possible.
zip_has_entry() {
  local want="$1" entry
  while IFS= read -r entry; do
    if [ "$entry" = "$want" ]; then return 0; fi
  done <<< "$ARCHIVE_LIST"
  return 1
}
zip_has_any_entry_matching() {
  local pattern="$1" entry
  while IFS= read -r entry; do
    case "$entry" in $pattern) return 0 ;; esac
  done <<< "$ARCHIVE_LIST"
  return 1
}
if zip_has_any_entry_matching "*/.git" || zip_has_any_entry_matching "*/.git/*" || zip_has_any_entry_matching ".git/*"; then
  echo "Refusing ZIP that contains a .git directory."
  exit 1
fi
for required in package.json package-lock.json README.md PROFESSIONAL_CONTINUATION_PROMPT_AR.md; do
  zip_has_entry "${PROJECT_PREFIX}${required}" || { echo "ZIP project root is missing $required"; exit 1; }
done

echo "ZIP structure: OK"
echo "Detected project root inside ZIP: ${PROJECT_PREFIX:-<archive-root>}"
CHECKSUM_FILE="${ARCHIVE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
else
  echo "Warning: ${CHECKSUM_FILE} not found; only ZIP structure was checked."
fi

# Extract into a staging directory first so both a root ZIP and a ZIP wrapped
# in wegberlin/ or der-weg-nach-berlin/ are handled correctly.
STAGING_DIR="${HOME}/.wegberlin-archive-staging"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
unzip -q "$ARCHIVE" -d "$STAGING_DIR"
PROJECT_ROOT="${STAGING_DIR}/${PROJECT_PREFIX%/}"
[ -f "$PROJECT_ROOT/package.json" ] || { echo "Detected project root is invalid: $PROJECT_ROOT"; exit 1; }
# Deployability guard (2026-09-21: a Vercel build of a pushed tree failed with
# "Couldn't find any `pages` or `app` directory. Please create one under the project root").
# A repository root that is only a folder named der-weg-nach-berlin/ is a valid git repo and an
# invalid Next.js project, so the structure is checked here before anything is committed.
for required in src/app/page.tsx src/app/layout.tsx public/sw.js PROFESSIONAL_CONTINUATION_PROMPT_AR.md; do
  [ -e "${PROJECT_ROOT}/${required}" ] || {
    echo "Archive is undeployable: ${required} is missing at the project root (${PROJECT_ROOT})."
    echo "Rebuild the delivery archive with: npm run archive:delivery"
    exit 1
  }
done

# Content guard: a flat, buildable-looking tree with no authored drill data is as undeliverable as
# a wrapped one (measured 2026-09-21: the remote tracks 0 files under src/data/{exercises,curriculum}).
for data_dir in src/data/exercises src/data/curriculum src/data/micro-drills; do
  # NB: `find` on a missing path exits 2, and under `set -o pipefail` that status propagates through
  # the pipeline into the assignment, aborting the script silently before the message below is ever
  # printed (measured in the lab with bash -x). Test the directory first.
  if [ -d "${PROJECT_ROOT}/${data_dir}" ]; then
    data_count=$(find "${PROJECT_ROOT}/${data_dir}" -type f | wc -l)
  else
    data_count=0
  fi
  if [ "$data_count" -eq 0 ]; then
    echo "Archive is undeployable: ${data_dir} holds no files in the staged tree."
    echo "The authored content is missing — regenerate it in the project and run: npm run archive:delivery"
    exit 1
  fi
  echo "  staged ${data_dir}: ${data_count} files"
done

# Only now is a token needed: an archive that cannot be deployed never reaches the network.
printf "GitHub fine-grained/classic PAT (input hidden): "
IFS= read -rs GITHUB_PAT
echo
[ -n "$GITHUB_PAT" ] || { echo "Token cannot be empty."; exit 1; }

# Verify the key without storing it in gh auth, the remote URL, or shell history.
# GH_TOKEN works with fine-grained PATs and does not require the broad read:org scope.
TOKEN_USER="$(GH_TOKEN="$GITHUB_PAT" gh api user --jq .login)"
if [ "$TOKEN_USER" != "$GITHUB_USER" ]; then
  unset GITHUB_PAT
  echo "The supplied key belongs to ${TOKEN_USER}, expected ${GITHUB_USER}."
  exit 1
fi

echo "Authenticated GitHub account: ${TOKEN_USER}"

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
cleanup_secret() {
  rm -f "$ASKPASS_SCRIPT"
  unset GITHUB_PAT
}
trap cleanup_secret EXIT

# Clone the existing repository to preserve its remote and history (the staged tree is already validated).
rm -rf "$WORKDIR"
git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"
git checkout main

# Delete EVERY project file from the worktree, while preserving only .git,
# then copy the detected project root including hidden files.
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$PROJECT_ROOT"/. .
rm -rf "$STAGING_DIR"

# Generated/private files must never be uploaded.
rm -rf node_modules .next test-results playwright-report coverage
rm -f .env .env.local .env.production tsconfig.tsbuildinfo
find . -name '*.dwnb' -delete
# The audited Transformers browser bundle is reconstructed by npm ci/prebuild
# from a checksum-pinned packed payload. Never commit its false-positive plaintext.
git rm --cached --ignore-unmatch public/vendor/webgpu/transformers.web.min.js >/dev/null 2>&1 || true
# Agent workspaces may not persist newly created workflow files. Materialize all
# audited deployment templates inside the real clean Git worktree.
mkdir -p .github/workflows
for workflow in deployment/deployment-smoke.yml deployment/release-candidate.yml deployment/release.yml; do
  [ -f "$workflow" ] || { echo "Missing deployment workflow template: $workflow"; exit 1; }
  cp "$workflow" ".github/workflows/$(basename "$workflow")"
done

git config user.name "$GITHUB_USER"
git config user.email "$GITHUB_EMAIL"
git remote set-url origin "$REPO_URL"
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
node scripts/audit-secrets.mjs --working-tree --history --require-history

# The repository root must stay the project root: refuse a nested layout and stale build output.
if [ -d der-weg-nach-berlin ]; then echo "Refusing to commit: repo root contains a der-weg-nach-berlin/ wrapper."; exit 1; fi
[ -d src/app ] || { echo "Refusing to commit: no src/app at the repo root."; exit 1; }
[ -f package.json ] || { echo "Refusing to commit: no package.json at the repo root."; exit 1; }

git add -A
tracked_data=$(git ls-files src/data/exercises src/data/curriculum src/data/micro-drills | wc -l)
if [ "$tracked_data" -eq 0 ]; then
  echo "Refusing to commit: git tracks 0 files under the authored data directories."
  echo "Either the ZIP lost them or an ignore rule swallowed them — fix that before pushing."
  exit 1
fi
echo "Authored data files now tracked: ${tracked_data}"
echo "Changes that will be committed:"
git status --short
echo "Repo root after replacement: $(git ls-tree HEAD --name-only 2>/dev/null | wc -l) tracked top-level entries; app directory: $(git ls-files src/app | wc -l) files."

if git diff --cached --quiet; then
  echo "Repository already matches the ZIP; nothing to upload."
else
  git commit -m "$COMMIT_MESSAGE"
  GIT_ASKPASS="$ASKPASS_SCRIPT" GIT_TERMINAL_PROMPT=0 GITHUB_USER="$GITHUB_USER" GITHUB_PAT="$GITHUB_PAT" git push origin main
fi

echo "Clean replacement completed: https://github.com/${GITHUB_USER}/${REPOSITORY}"
echo "Vercel: the project Root Directory must be the repository root ('.'), because package.json and src/app live there."
echo "The PAT was not stored by the script."
