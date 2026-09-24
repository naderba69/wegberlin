#!/usr/bin/env bash
# Repairs every surface that a partial snapshot revert reverts, in the order that works.
#
# This sandbox has reverted the tree ELEVEN times. The revert is partial and silent: it restores
# src/data, node_modules, the swapfile, five cache-literal files and individual docs/run-logs dirs
# to an older generation while leaving public/sw.js, scripts/ and the standing documents current.
# Diagnosing that by hand costs a whole turn, so the fix is one idempotent script.
#
# Every input it replays is IN the repo, and every step is safe to re-run:
#   - parallelise-options.py keeps the key byte-identical, so replaying rewrites identical text
#   - apply-explanation-batch.py has an oldLen lock and skips items already lifted
#   - the literal rewrite is a no-op once the files are current
#
# Usage: bash scripts/restore-generation.sh [--quiet]
# Then:  node scripts/verify-generation-state.mjs   (must print "no drift")
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1
say() { [ "$QUIET" = 1 ] || echo "$@"; }

# ── 0. seed from the delivery artifact, if one is present ──────────────────────────────────────
# The ZIP built by `npm run zip:delivery` is a verified snapshot of the whole tree, so when a
# revert deletes repo files that are not reproducible from a payload (run-log READMEs, the
# cue-explanation fix payloads, these very scripts), the artifact is the cheapest way back.
# Only files that are MISSING are restored; nothing already on disk is overwritten.
ART="${DELIVERY_ZIP:-$HOME/wegberlin-full.zip}"
if [ -f "$ART" ] && command -v unzip >/dev/null 2>&1; then
  if [ ! -f "$ART.sha256" ] || (cd "$(dirname "$ART")" && sha256sum -c "$(basename "$ART").sha256" >/dev/null 2>&1); then
    before=$(find docs/run-logs scripts -type f 2>/dev/null | wc -l)
    unzip -n -q "$ART" 'docs/run-logs/*' 'scripts/*' 'tests/unit/*' 'TERMUX_*' 2>/dev/null || true
    after=$(find docs/run-logs scripts -type f 2>/dev/null | wc -l)
    say "artifact    : restored $((after-before)) missing file(s) from $(basename "$ART")"
  else
    say "artifact    : $ART fails its sidecar — ignored"
  fi
fi

# ── 1. swap: next build hangs at "Running TypeScript" on this 1,984 MB box without it ──────────
if [ "$(awk '/SwapTotal/{print $2}' /proc/meminfo)" -eq 0 ] 2>/dev/null; then
  if sudo -n true 2>/dev/null; then
    sudo -n fallocate -l 2G /home/user/.swapfile 2>/dev/null \
      || sudo -n dd if=/dev/zero of=/home/user/.swapfile bs=1M count=2048 status=none
    sudo -n chmod 600 /home/user/.swapfile
    sudo -n mkswap /home/user/.swapfile >/dev/null
    sudo -n swapon /home/user/.swapfile
    say "swap        : created 2 GB"
  else
    say "swap        : NO sudo -n — build may hang"
  fi
else
  say "swap        : already active"
fi

# ── 2. payloads that live outside the repo snapshot ────────────────────────────────────────────
PAYDIR="docs/run-logs/a2-explanations-payloads"
mkdir -p "$PAYDIR"
[ -f "$PAYDIR/a2e10.json" ] || { [ -f /home/user/tmp/a2e10.json ] && cp /home/user/tmp/a2e10.json "$PAYDIR/a2e10.json" && say "payload     : a2e10.json restored from tmp"; }

# ── 3. cue/parallelism batches (113 items across 7 lesson files) ───────────────────────────────
n=0
for f in docs/run-logs/*cue-parallelism*/*-batch.json; do
  [ -e "$f" ] || continue
  python3 scripts/parallelise-options.py --batch "$f" --write >/dev/null 2>&1 && n=$((n+1))
done
say "cue batches : $n file(s) replayed"

# ── 4. explanation payloads, in replay order (a2eN, then a2eN-fixM which supersedes it) ────────
python3 - "$ROOT" <<'PY'
import glob, os, re, subprocess, sys
root = sys.argv[1]
def order(p):
    m = re.search(r"a2e(\d+)(?:-fix(\d+))?\.json$", p)
    return (int(m.group(1)), int(m.group(2) or 0)) if m else (10**6, 0)
files = sorted(glob.glob(os.path.join(root, "docs/run-logs/a2-explanations-payloads/a2e*.json")), key=order)
wrote = 0
for f in files:
    out = subprocess.run(["python3", "scripts/apply-explanation-batch.py", "--level", "a2", "--payload", f],
                         capture_output=True, text=True, cwd=root)
    m = re.search(r"wrote (\d+) field", out.stdout)
    wrote += int(m.group(1)) if m else 0
print(f"explanations: {wrote} field(s) written across {len(files)} payload(s)")
PY

# ── 5. cue-rewrite explanation corrections (in-repo since v156.2; tmp copies get wiped) ────────
# These fix three explanations that still named distractors the v156 cue rewrite had deleted.
# apply-explanation-batch.py refuses when oldLen disagrees, so a payload whose oldLen was recorded
# AFTER the fix silently writes nothing — that happened once. Keep oldLen = the PRE-fix length.
for lvl in b1 b2; do
  p="docs/run-logs/cue-explanation-fixes/$lvl.json"
  [ -f "$p" ] && python3 scripts/apply-explanation-batch.py --level "$lvl" --payload "$p" >/dev/null 2>&1
done

# ── 6. cache literals: sw.js is the source of truth, five files drift behind it ────────────────
python3 - <<'PY'
import io, re
sw = io.open("public/sw.js", encoding="utf-8").read()
gen = re.search(r'PACK_CACHE = "dwnb-full-pack-v(\d+)"', sw)
if gen:
    cur, prev = int(gen.group(1)), int(gen.group(1)) - 1
    files = ["tests/unit/offline-pack-controls.test.ts", "tests/unit/offline-recovery-partial-export.test.ts",
             "tests/unit/today-offline-readiness.test.ts", "tests/unit/offline-curriculum-rollback.test.ts",
             "tests/e2e/critical-flows.spec.ts"]
    total = 0
    for f in files:
        try: s = io.open(f, encoding="utf-8").read()
        except FileNotFoundError: continue
        o = s
        s = re.sub(r"dwnb-full-pack-staging-v\d+", f"dwnb-full-pack-staging-v{prev}", s)
        s = re.sub(r"dwnb-full-pack-previous-v\d+", f"dwnb-full-pack-previous-v{prev}", s)
        s = re.sub(r"dwnb-full-pack-v\d+(?![-\w])", f"dwnb-full-pack-v{cur}", s)
        if s != o:
            io.open(f, "w", encoding="utf-8").write(s)
            total += 1
    print(f"cache lits  : {total} file(s) re-pinned to v{cur}/staging-v{prev}")
PY

# ── 7. node_modules ────────────────────────────────────────────────────────────────────────────
if [ ! -x node_modules/.bin/tsx ]; then
  say "node_modules: running npm ci (this takes ~20 s)"
  npm ci --no-audit >/dev/null 2>&1 && say "node_modules: restored" || say "node_modules: npm ci FAILED"
else
  say "node_modules: present"
fi

say ""
say "now verify:  node scripts/verify-generation-state.mjs"
