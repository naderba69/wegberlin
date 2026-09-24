# Official-Source and Free-Tier Freshness Policy

Sync batch: v161 · 2026-09-23 · re-verified in full against pack `dwnb-full-pack-v161`.

Last registry review: 2026-09-11 (auditor re-run 2026-09-20: 18 records, 18 fresh, 0 due-soon, 0 stale, 0 clock errors)  
Next review due: 2026-10-03  
Calendar policy: Africa/Tunis  
Registry version: `source-freshness-v1`

## Scope

The central registry contains 18 official references:

- 5 exam-format references: Goethe overview/terms/model set and telc overview/current mock link;
- 5 remote-AI references: Gemini pricing/limits and OpenRouter free variant/router/limits;
- 6 browser-model references: Transformers.js version/license, WebGPU guidance, multilingual MiniLM base/ONNX records, and multilingual Whisper tiny base/ONNX records;
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

The Goethe overview currently returns an anti-bot HTTP 403 to generic CI clients. Its record is explicitly `manual-on-403`; the report keeps that fact visible but does not pretend CI can read the page. Its official PDFs remain machine-probed.

## Human review checklist

For every due record:

1. open the official source manually;
2. compare meaning, not only URL/status;
3. for exams, compare parts, timings, points, passing rules, versions, and provider separation;
4. for remote AI, compare free eligibility, model IDs, quotas, paid fallbacks, account/billing conditions, and privacy notes;
5. for each browser model, compare Runtime version/license, WebGPU API, MiniLM/Whisper model card and license, ONNX revision, quantized size, language/task support, and cache behavior;
6. for Vercel/GitHub, compare personal/public/free-use terms and limits;
7. update `observedState`, dependent code/tests/docs, and only then `lastVerifiedAt`;
8. run `npm run check` and relevant Playwright tests.

## Integrity boundary

HTTP 200/206, an unchanged URL, or an unchanged filename does not establish semantic stability. The automation is a staleness/reachability alarm, not an official-format validator or legal review.

## Accountability extension — 2026-09-09

Every one of the 18 source records now has a distinct stable `ownerId` and `reviewerId`. The source schema rejects missing or identical roles, while `content-accountability-lifecycle-v1` verifies 18/18 coverage together with content and learner-risk ownership. These role IDs assign responsibility; they do not claim that a scheduled human semantic review has already occurred.
