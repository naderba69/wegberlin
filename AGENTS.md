<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Sync batch: v183 · 2026-10-07 · Repository-only P0-99 review-slot guard: `p099:evidence:status` now separates missing references from placeholder-only names (TODO / n/a / <evidence>) and from signature cells, and refuses to read a signature cell as closure: a signed cell without a named reference, or any signature cell in a row still marked `authored-review-pending`, stops the reader. Presence only; evidence contents and decision contents are not interpreted, and P0-99 closure is not asserted. No evidence, decision, or signature was added; the independent 126-target `frame-quality-targets.csv` and `reviewScope` remain unchanged. Measured: 0/8 named, 0 placeholder-only, 0/40 signature cells, 0 slots ready for independent review. Local `npm run check` passed: 1,377/1,377 tests in 203 files, lint/typecheck/audits clean, 325/325 pages; local build fingerprint `7798856d7d79` (full 6,007,774 gzip), JS 128 / 2,017,731 / max 262,117, media 544 / 52,943,843 bytes, contrast 323 pages / 22,960 elements / 0 failures; regenerated tracked offline-size manifest and media-pack budget report. No cache generation change (v183 active/staging, v182 rollback). Quality Gate `37626304821` passed on `e0463d4`: `check` 7m43s and E2E 13m52s, desktop 65/65 and mobile 65/65 after one flaky `webgpu-runtime-resolution` attempt on mobile was retried and passed (no test or threshold was changed); Vercel Preview and comments passed. Deployment Smoke `37626713787` was skipped; no Production claim.

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
