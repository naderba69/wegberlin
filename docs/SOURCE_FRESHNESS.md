# Official-Source and Free-Tier Freshness Policy

Sync batch: v183 · 2026-10-07 · Repository-only human-review presence for the governed packet: a new `src/core/content-validation/human-review-presence.ts` reads the 17 committed review sheets (3,277 governed records, 4 signature fields = 13,108 cells) as presence only, and `npm run human:review` now publishes that block in `reports/human-review-audit.json` and `docs/generated/HUMAN_REVIEW_LEDGER.md`: 17 sheets, 3,277 rows, 0 signed, 0 cells filled, `Evidence contents inspected: no`, `Review decision contents interpreted: no`, `Human review closure asserted: no`. The reader fails closed: a partial signature (any of the four fields without the rest) stops the audit instead of being read as a finished review, duplicate content IDs and mislabelled sheet cells are refused, and the row total must match the governed-record count (3,277). The signature-field list now has one source, shared with the overwrite guard, and `handoff:check` cross-checks the packet block against the governed review-state rows and the zero-signed baseline. No sheet row, decision, name, or note was changed; 0/96 lessons and 0/3,277 records remain independently unreviewed. Local `npm run check` passed: 1,384/1,384 tests in 204 files, lint/typecheck/audits clean, 323 statically built HTML pages; build fingerprint `36df5e35da91` (full 6,006,866 gzip), JS 128 / 2,017,616 gzip / max 262,117, media 544 / 52,943,843 bytes, curriculum 1,118,105 gzip, contrast 323 pages / 22,960 elements / 0 failures; regenerated tracked `public/offline-size-manifest.json`, `reports/js-budget-report.json`, `reports/media-pack-budget-report.json`, `reports/human-review-audit.json`, `docs/generated/HUMAN_REVIEW_LEDGER.md`, and `reports/review-packet/README.md`. No cache generation change (v183 active/staging; v182 rollback). Quality Gate `37655799344` passed on `8fe04b5`: `check` 4m40s and E2E 15m32s. Vercel previews for this batch were rate-limited again (`upgradeToPro=build-rate-limit`, the same external project quota seen on `e5d285a`, `d9506da`, and `4fbfec0`), so the code-bearing revision has no preview URL of its own. A follow-up commit `8fe04b5` removed the one remaining lint warning (unused dossier column index), so `npm run lint` is now clean at 0 errors and 0 warnings. No Production claim and no merge claim; PR #7 remains open. No external source, API, or network origin changed.

Historical v182 follow-up: `/shadowing` uses a same-origin model asset and the learner recording in browser memory (≤60 seconds / ≤4 MB each), with no upload or persisted result. At that time active/staging were v182 and previous complete was v181; current caches are v183/rollback v182. No source-freshness record changed.

Batch follow-up: `/practice/test-generator` uses only authored published mini-test templates and runs locally. It adds no remote model, external corpus, learner-state field, or source-freshness obligation; all five Offline packs include its route and statically bundled template banks.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

Measured 2026-10-04 before re-verification: 19 records; fresh 1, due-soon 6, stale 12, so `npm run source:audit -- --strict` exited 1 (the 30-day window of the 2026-09-03 records ended on the Africa/Tunis day 2026-10-04). After the owner-approved re-verification: fresh 19, due-soon 0, stale 0, clock errors 0.

Re-verification record: `docs/run-logs/2026-10-04-source-reverification/README.md` — an agent-assisted reading of 18 live official sources compared with `observedState`/`claimAr`, approved by the owner; the telc mock archive was confirmed as a link only (its content was not re-opened). `manual-semantic-review` and the UI label stay as they are: the owner's approval is what makes the review human.

Last registry review: 2026-10-04 (auditor re-run 2026-10-04: 19 records, 19 fresh, 0 due-soon, 0 stale, 0 clock errors)  
Next review due: 2026-11-01 (`onnxruntime-web`, verified 2026-10-02); every other record 2026-11-03  
Calendar policy: Africa/Tunis  
Registry version: `source-freshness-v1`

## Scope

The central registry contains 19 official references:

- 5 exam-format references: Goethe overview/terms/model set and telc overview/current mock link;
- 5 remote-AI references: Gemini pricing/limits and OpenRouter free variant/router/limits;
- 7 browser-model references: Transformers.js version/license, ONNX Runtime Web WebGPU bundle/license, WebGPU guidance, multilingual MiniLM base/ONNX records, and multilingual Whisper tiny base/ONNX records;
- 1 Vercel Hobby reference;
- 1 GitHub Actions billing reference.

Every record has a stable ID, official HTTPS URL, observed version/state, exact claim used by the app, `lastVerifiedAt`, a 30-day maximum age, and a stale action.

## Status rules

- `fresh`: more than seven days remain before the 30-day deadline;
- `due-soon`: seven days or fewer remain, including the due date;
- `stale`: the deadline has passed;
- `clock-error`: the device date appears older than the stored review date.

The policy uses the Africa/Tunis calendar day so CI near UTC midnight does not falsely report a future verification date.

## Product behavior

- The Exam Hub computes freshness from the exact source IDs owned by the selected profile. A stale profile remains available for clearly labeled practice, but the UI stops calling it current and release changes to scoring/timing are blocked until review.
- Settings displays a 0 USD decision for the selected AI model before connection testing.
- Gemini accepts only the explicitly allowlisted free-tier models.
- OpenRouter accepts only `openrouter/free` or IDs ending in `:free`.
- A stale/clock-invalid AI source blocks the request before any `fetch`; Disabled and local Ollama remain available.
- A stale/clock-invalid Transformers.js/model/license source blocks a new MiniLM or Whisper model download while deterministic follow-up and record/playback remain available. Installed local inference is never presented as newly verified after expiry.
- `npm run check` includes the strict local freshness audit.

## Monthly workflow

`.github/workflows/source-freshness.yml` runs at 06:17 UTC on the first day of each month and can also be started manually. It:

1. checks registry structure and dates;
2. marks records due or stale;
3. probes URL reachability with a 15-second timeout;
4. opens/updates one maintenance Issue when attention is required;
5. closes the existing Issue after a later successful review update.

The Goethe overview and the two npmjs.com package pages (`transformers-js-runtime-4-2-0`, `onnxruntime-web-webgpu-1-26-dev-20260416`) currently return an anti-bot HTTP 403 to generic CI clients (measured from a GitHub runner on 2026-10-04, ADR-109). Their records are explicitly `manual-on-403`; the report keeps that fact visible but does not pretend CI can read the pages, and the manual review (30-day window) still applies to them. Every other record, including Goethe's official PDFs, remains machine-probed and must answer 2xx.

## Human review checklist

For every due record:

1. open the official source manually;
2. compare meaning, not only URL/status;
3. for exams, compare parts, timings, points, passing rules, versions, and provider separation;
4. for remote AI, compare free eligibility, model IDs, quotas, paid fallbacks, account/billing conditions, and privacy notes;
5. for each browser model, compare Runtime version/license, WebGPU API, MiniLM/Whisper model card and license, ONNX revision, quantized size, language/task support, and cache behavior;
6. for Vercel/GitHub, compare personal/public/free-use terms and limits;
7. update `observedState`, dependent code/docs, and only then `lastVerifiedAt`; keep `verifiedAt` in `src/data/exam-profiles.ts` equal to the oldest date of the profile's sources and regenerate the format reports (`npm run exam:formats:verify:write`);
8. run `npm run check` and relevant Playwright tests.

Tests are not edited when a source is re-verified (ADR-108): a test that is not about the window itself pins its clock with `tests/helpers/source-verification-clock.ts`, which derives the instant from the registry; the window rules are measured with explicit dates on a fixed record in `tests/unit/source-freshness.test.ts`.

## Integrity boundary

HTTP 200/206, an unchanged URL, or an unchanged filename does not establish semantic stability. The automation is a staleness/reachability alarm, not an official-format validator or legal review.

## Accountability extension — 2026-09-09

Every one of the 18 source records now has a distinct stable `ownerId` and `reviewerId`. The source schema rejects missing or identical roles, while `content-accountability-lifecycle-v1` verifies 18/18 coverage together with content and learner-risk ownership. These role IDs assign responsibility; they do not claim that a scheduled human semantic review has already occurred.
