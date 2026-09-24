#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

REPO="https://github.com/naderba69/wegberlin.git"
WORKDIR="${HOME}/wegberlin"
ARCHIVE="${1:-${HOME}/storage/downloads/wegberlin-full.zip}"
CHECKSUM="${ARCHIVE}.sha256"
COMMIT_MESSAGE="${2:-Update WegBerlin audited development state}"

for command in git gh unzip; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing command: $command"; exit 1; }
done

[ -f "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }
unzip -t "$ARCHIVE" >/dev/null
echo "ZIP integrity: OK"

if [ -f "$CHECKSUM" ]; then
  (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM")")
else
  echo "Checksum sidecar not found; ZIP structure was still verified."
fi

gh auth status >/dev/null 2>&1 || {
  echo "GitHub authentication is required. Run:"
  echo "gh auth login --hostname github.com --git-protocol https --web"
  exit 1
}
gh auth setup-git >/dev/null

if [ -d "$WORKDIR/.git" ]; then
  cd "$WORKDIR"
  if [ -n "$(git status --porcelain)" ]; then
    echo "Refusing to overwrite a dirty worktree: $WORKDIR"
    echo "Commit, stash, or remove its local changes first."
    exit 1
  fi
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
else
  rm -rf "$WORKDIR"
  git clone "$REPO" "$WORKDIR"
  cd "$WORKDIR"
fi

# Preserve .git history, replace every project file with the audited ZIP,
# and let git add -A record both updates and deletions.
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
unzip -q "$ARCHIVE" -d .

git config user.name "naderba69"
git config user.email "balinader@gmail.com"
git remote set-url origin "$REPO"

git add -A
if git diff --cached --quiet; then
  echo "No project changes to commit."
else
  git commit -m "$COMMIT_MESSAGE"
  git push origin main
fi

echo "Repository updated: https://github.com/naderba69/wegberlin"
