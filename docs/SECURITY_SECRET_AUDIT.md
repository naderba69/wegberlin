# Credential and Git-History Secret Audit

Last verified: 2026-09-10  
Policy: `secret-audit-v1`

## Enforced paths

### Working tree

```bash
npm run secret:audit
```

This command scans tracked and non-ignored untracked text files. It skips known binary media/archive/font extensions, binary payloads containing NUL bytes, generated dependency/build directories, and text files above the explicit size guard. Findings expose only rule ID, path, line, column, and a bounded redacted fingerprint.

`npm run check` includes this working-tree gate. In a real Git worktree it also fails if the materialized `public/vendor/webgpu/transformers.web.min.js` is tracked; only its checksum-pinned packed payload may enter Git, preventing the upstream minified Mistral-key false positive without disabling Push Protection.

### Complete Git history in CI

The Quality Gate uses:

```yaml
fetch-depth: 0
```

and runs:

```bash
npm run secret:audit:history
```

The history mode scans added and removed patch lines from every reachable ref and fails if a real Git worktree with fetched history is unavailable. Generated academic JSON and binary audio are excluded from patch expansion; current text files remain covered by the working-tree pass.

### Versioned pre-commit hook

`.githooks/pre-commit` runs the working-tree audit. Activate it with:

```bash
git config core.hooksPath .githooks
```

`TERMUX_REPLACE_REPO.sh` activates the hook, performs a required full-history audit before staging, and then lets the hook run again before commit. The hook and scanner require only Node/npm already installed for the project; they do not install or contact a security SaaS.

## Detection rules

The v1 registry detects representative formats for:

- GitHub tokens;
- Google API keys;
- AWS access-key IDs;
- OpenAI-style secret keys;
- Stripe live keys;
- Slack tokens;
- Hugging Face tokens;
- long Authorization Bearer credentials;
- private-key PEM headers.

Tests assemble credential fixtures at runtime so no realistic test token is committed. The Node runtime scanner and testable TypeScript scanner must return the same findings for the fixture set. One exact historical non-secret fixture, `sk-or-v1-EXAMPLEEXAMPLEEXAMPLE`, is ignored by exact equality only because commit `08eb9d7` intentionally added it to test placeholder handling; neighboring OpenAI-style values remain findings. There is no wildcard, prefix, path-wide, or general `EXAMPLE` exemption.

## Verified public-history result

A clean public clone of `https://github.com/naderba69/wegberlin` was scanned on 2026-09-10 with the exact historical fixture rule:

```text
Head checked before the replacement commit: public `main` history
Reachable commits: 30
Changed text patch lines scanned: 49,812
Potential secret findings: 0
```

The local workspace intentionally has no `.git` directory, so `npm run check` scans its working tree while CI owns the required full-history mode. After the next push, CI will rescan the newly reachable commit and all prior history.

## Security boundary

Pattern scanning materially reduces accidental credential commits but cannot prove that every arbitrary high-entropy string is harmless. If a real credential is ever exposed, removal from Git is not sufficient: rotate/revoke it at the provider, inspect access logs, and then clean history if required. The scanner never prints a complete matched value.
