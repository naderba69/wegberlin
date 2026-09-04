#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

GITHUB_USER="naderba69"
GITHUB_EMAIL="balinader@gmail.com"
REPOSITORY="wegberlin"
REPO_URL="https://github.com/${GITHUB_USER}/${REPOSITORY}.git"
ARCHIVE="${1:-${HOME}/storage/downloads/wegberlin-full.zip}"
WORKDIR="${HOME}/wegberlin-clean-upload"
COMMIT_MESSAGE="${2:-Update audited WegBerlin handoff and A1 lexical grammar}"

for command in git gh unzip sha256sum; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing command: $command"; exit 1; }
done

[ -f "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }
unzip -t "$ARCHIVE" >/dev/null
ARCHIVE_LIST="$(unzip -Z1 "$ARCHIVE")"
if printf '%s\n' "$ARCHIVE_LIST" | grep -qE '(^|/)\.git/'; then
  echo "Refusing ZIP that contains a .git directory."
  exit 1
fi
PACKAGE_ENTRY="$(printf '%s\n' "$ARCHIVE_LIST" | grep -E '(^|/)package\.json$' | head -n 1 || true)"
[ -n "$PACKAGE_ENTRY" ] || { echo "ZIP contains no package.json at any folder depth."; exit 1; }
PROJECT_PREFIX="${PACKAGE_ENTRY%package.json}"
for required in package.json package-lock.json README.md PROFESSIONAL_CONTINUATION_PROMPT_AR.md; do
  printf '%s\n' "$ARCHIVE_LIST" | grep -Fxq "${PROJECT_PREFIX}${required}" || { echo "ZIP project root is missing $required"; exit 1; }
done

echo "ZIP structure: OK"
echo "Detected project root inside ZIP: ${PROJECT_PREFIX:-<archive-root>}"
CHECKSUM_FILE="${ARCHIVE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
else
  echo "Warning: ${CHECKSUM_FILE} not found; only ZIP structure was checked."
fi

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

# Clone the existing repository to preserve its remote and history.
rm -rf "$WORKDIR"
git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"
git checkout main

# Extract into a staging directory first so both a root ZIP and a ZIP wrapped
# in wegberlin/ or der-weg-nach-berlin/ are handled correctly.
STAGING_DIR="${HOME}/.wegberlin-archive-staging"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
unzip -q "$ARCHIVE" -d "$STAGING_DIR"
PROJECT_ROOT="${STAGING_DIR}/${PROJECT_PREFIX%/}"
[ -f "$PROJECT_ROOT/package.json" ] || { echo "Detected project root is invalid: $PROJECT_ROOT"; exit 1; }

# Delete EVERY project file from the worktree, while preserving only .git,
# then copy the detected project root including hidden files.
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$PROJECT_ROOT"/. .
rm -rf "$STAGING_DIR"

# Generated/private files must never be uploaded.
rm -rf node_modules .next test-results playwright-report coverage
rm -f .env .env.local .env.production tsconfig.tsbuildinfo
find . -name '*.dwnb' -delete

git config user.name "$GITHUB_USER"
git config user.email "$GITHUB_EMAIL"
git remote set-url origin "$REPO_URL"

git add -A
echo "Changes that will be committed:"
git status --short

if git diff --cached --quiet; then
  echo "Repository already matches the ZIP; nothing to upload."
else
  git commit -m "$COMMIT_MESSAGE"
  GIT_ASKPASS="$ASKPASS_SCRIPT" GIT_TERMINAL_PROMPT=0 GITHUB_USER="$GITHUB_USER" GITHUB_PAT="$GITHUB_PAT" git push origin main
fi

echo "Clean replacement completed: https://github.com/${GITHUB_USER}/${REPOSITORY}"
echo "The PAT was not stored by the script."
