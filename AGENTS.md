<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Sync batch: v183 · 2026-10-07 · Repository-only P0-99 intake check: `npm run p099:evidence:validate -- <file> [--require-complete]` now structurally checks a reviewer-returned copy of the eight exclusions — same header, same eight IDs in the authored order, a non-placeholder evidence name, all five signature fields present, ISO `reviewDate` — and prints what each row still misses. It writes nothing, and it restates `Reviewer identity authenticated: no`, `Evidence contents inspected: no`, `Review decision adequacy interpreted: no`, `P0-99 closure asserted: no`. The check reuses the presence-only slot reader, so a partial signature or a signature in a row still marked `authored-review-pending` still stops it; complete rows alone do not close P0-99 and the 126 quality targets stay pending human review. Current committed sheet: 8 exclusions, 0 complete rows, 0/40 signature cells. No evidence, decision, or signature was added; `frame-quality-targets.csv` and `reviewScope` remain unchanged. Local `npm run check` passed: 1,385/1,385 tests in 204 files, lint/typecheck/audits clean (0 warnings), 323 statically built HTML pages; build fingerprint `2e3d46704c50` (full 6,007,708 gzip), JS 128 / 2,017,616 gzip / max 262,117, media 544 / 52,943,843 bytes, curriculum 1,118,105 gzip, contrast 323 pages / 22,960 elements / 0 failures; regenerated tracked `public/offline-size-manifest.json`, `reports/js-budget-report.json`, `reports/media-pack-budget-report.json`, `reports/human-review-audit.json`, `docs/generated/HUMAN_REVIEW_LEDGER.md`, and `reports/lexical-review-packet/README.md`. Environment note: the sandbox re-cloned the repository between turns, so the local branch ref had to be re-fetched and re-based onto `origin/arena/01a106a4-wegberlin` before this batch; no pushed commit was lost. No cache generation change (v183 active/staging; v182 rollback). GitHub checks for this batch start after the push; no Production claim.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Pushed P2-352 head `b974c48` passed Quality Gate `37335158220` (64/64 Desktop + 64/64 Mobile E2E) and Vercel Preview; P0-302 is closed. PR #7 remains open, so P0-301 is partial until it is closed. Deployment Smoke was skipped by its guard; no production deployment is claimed.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

Independent evidence policy v2: bootstrap exits after real progress; never trust legacy readiness caches as new independent proof, never raise whole-lesson mastery from self-graded cards, never merge productive volume into a language score. Run fresh lesson:quality:audit and learning:integrity:audit as well as npm run check.

# Der Weg nach Berlin product rules

Read `PROFESSIONAL_CONTINUATION_PROMPT_AR.md`, `docs/MASTER_SPEC.md`, `PROJECT_STATUS.md`, `P0_AUDIT.md`, `P1_AUDIT.md`, `P2_AUDIT.md`, and `DECISIONS.md` before changing product behavior.
The primary UX is Coach/Today, not a lesson catalog. Durable learner data is local-first.
Never claim incomplete curriculum or media is complete. Run `npm run check` before reporting success.
After every batch, re-sync every standing document listed in `docs/adr/ADR-079-documentation-sync-marker.md` and update its `Sync batch: vNNN` marker; `npm run handoff:check` fails while a document lags the current pack generation.
The optional WebGPU model is Opt-in: never commit its downloaded weights, loosen pinned runtime/model hashes, add a silent WASM/paid fallback, or claim CI mocks equal physical GPU installation.
