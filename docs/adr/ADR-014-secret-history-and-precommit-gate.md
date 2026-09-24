# ADR-014 — Local, pre-commit, and full-history secret gate

Date: 2026-09-05  
Status: accepted; next pushed commit still requires its CI result

## Context

Session-only AI keys and safe Termux authentication prevented intentional persistence, but P0-304 still lacked an automated credential scan over both current files and deleted Git history. A current-tree-only grep cannot detect a key removed in a later commit, while a hosted commercial scanner would violate the mandatory 0 USD boundary.

## Decision

- Adopt `secret-audit-v1` with a dependency-free Node runtime.
- Scan current tracked and non-ignored untracked text in every `npm run check`.
- Make CI checkout full history with `fetch-depth: 0` and run `secret:audit:history --require-history` before the ordinary quality gate.
- Scan added and removed patch lines across every reachable ref. Exclude binary audio and the generated multi-megabyte academic JSON from history patch expansion; current text scanning remains independent.
- Ship `.githooks/pre-commit` and activate it in `TERMUX_REPLACE_REPO.sh` through `core.hooksPath`.
- Run the required history audit inside the Termux replacement flow before staging; the pre-commit hook scans the final staged worktree again.
- Detect stable provider credential families and private-key headers. Report only a rule ID, location, and redacted fingerprint; never print a complete match.
- Keep a testable TypeScript detector and a dependency-free Node runtime mirror, with parity tests over dynamically assembled fixtures so test credentials are not committed.

## Verification

On 2026-09-05, the public repository at `be56463e27ae676e82289c6b348b97c5161d7051` was cloned with all reachable history. The scanner inspected 15 commits and 43,401 changed text patch lines with zero findings.

## Consequences

- P0-304 has a current-tree gate, versioned pre-commit path, actual public-history evidence, and a mandatory future CI history gate.
- The scanner is zero-cost and sends no source to a third party.
- A clean result is not proof against every secret representation. Real exposure still requires provider-side revocation/rotation and incident review.
- P0-302 remains separate: the new CI configuration must still be pushed and complete remotely before that workflow item closes.
