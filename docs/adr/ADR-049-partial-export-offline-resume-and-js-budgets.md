# ADR-049 — Selective review export, resumable Offline staging, and JavaScript budgets

- Status: accepted
- Date: 2026-09-08
- Scope: P1-235, P1-246, P1-247, P1-248

## Decision

`partial-study-sections-export-v1` exports only learner-selected review sections (`progress`, `srs`, `writing`, `speaking`, or audio metadata). It is JSON marked `restorable:false`; the complete `.dwnb` archive remains the only restoration format. Secrets and audio Blob bytes are excluded, and speaking media IDs are removed from the speaking section.

`offline-recovery-page-v1` adds `/offline` to the shell and every level pack. Navigation failure falls back to that recovery page before `/today`, where the learner can reopen cached routes and manage a pack without a network request.

The service worker keeps an isolated staging cache and a versioned checkpoint containing the completed path and SHA-256 for each resource. A retry reuses only a matching staged response, keeps staging after an interruption, deletes the checkpoint before atomic promotion, and never claims byte-range resume. Resume is resource-level only.

`js-budget-v1` runs after every production build. It records deterministic Gzip bytes for emitted JavaScript chunks and fails above 2,500,000 total bytes or 750,000 bytes for the largest chunk.

## Boundaries

- Selective JSON is for review or transfer, not restore.
- A checkpoint proves only validated resource completion, not that a browser survived every possible service-worker termination.
- Offline recovery does not trigger an automatic download.
- Gzip budgets are build guardrails, not runtime performance measurements on physical devices.

## Evidence

- `src/core/exports/partial-study-export.ts`
- `src/app/offline/page.tsx`
- `public/sw.js`
- `scripts/audit-js-budgets.mjs`
- `tests/unit/offline-recovery-partial-export.test.ts`
- `tests/unit/offline-pack-controls.test.ts`
- `tests/e2e/critical-flows.spec.ts`
