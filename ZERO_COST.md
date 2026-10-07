# Zero-Cost Contract

Sync batch: v183 · 2026-10-07 · Repository-only P0-99 stage-2 worklist: the packet now also generates `docs/generated/P099_QUALITY_TARGET_REVIEW_WORKLIST.md` from the same 126 rows — per-level sections (A1 25 / A2 30 / B1 31 / B2 40) with lesson, target, verb+preposition, authored governed case, chunk, and example, plus a five-point reviewer checklist and explicit boundaries. Its stage-1 gate line is derived from the retained exclusion sheet at generation time, so it says `بوابة المرحلة الأولى ما زالت مغلقة: … 0/8` today and flips to the names-recorded wording only when all eight names exist; the header restates that a recorded name is still not a review. `handoff:check` validates 126 rows in the exact stage-2 sheet order, the per-level counts, the boundary texts, and a stage-1 counter that matches `p099:evidence:status` (verified by a negative test: forcing `1/8` into the file stops the handoff). Nothing in the generated worklist carries a decision; reviewer work is copied out and recorded by the owner. Local `npm run check` passed: 1,387/1,387 tests in 204 files, lint/typecheck/audits clean (0 warnings), 323 statically built HTML pages; build fingerprint `3b6321cd4b6e` (full 6,007,837 gzip), JS 128 / 2,017,616 gzip / max 262,117, media 544 / 52,943,843 bytes, curriculum 1,118,105 gzip, contrast 323 pages / 22,960 elements / 0 failures; regenerated tracked `public/offline-size-manifest.json`, `reports/js-budget-report.json`, `reports/media-pack-budget-report.json`, `reports/human-review-audit.json`, `docs/generated/HUMAN_REVIEW_LEDGER.md`, and `reports/lexical-review-packet/README.md`. No cache generation change (v183 active/staging; v182 rollback). Quality Gate `37674386640` passed on `98a70f9` (`check` 7m40s, E2E 19m5s) and Quality Gate `37680220802` passed on the record head `68ca634` (`check` 4m39s, E2E 19m53s; a first queued E2E was cancelled externally, so the run was re-triggered by closing and reopening PR #7 rather than by pushing a new commit). A follow-up docs-only markdown commit changes no code tree and is re-verified by the same gate. The Vercel preview for this revision hit the external project quota again (`upgradeToPro=build-rate-limit`); the last successfully built preview remains the one on `d121da0`. No Production claim and no merge claim; PR #7 remains open. No external service, AI call, analytics, product, learner-state, or Offline cache change; no new cost.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

Last registry update: 2026-09-11 (0 USD boundary re-checked 2026-09-20: 18/18 records fresh, no paid fallback path added)  
Policy: `source-freshness-v1`  
Hard mandatory budget: **0 USD**

## Non-negotiable rules

- The authored A1–B2 course, Today coach, assessments, SRS, progress, recording/playback, exam rehearsal, Offline pack, and `.dwnb` backup work without a paid service.
- IndexedDB is the learner-data source of truth. No cloud database, Vercel Blob/KV, analytics product, or server-side filesystem is mandatory.
- Unknown price means **blocked**. There is no automatic paid fallback and the app never asks for a card or recommends buying credits.
- Remote AI is optional BYOK and requires a separate consent before every educational question.
- API keys and Ollama endpoints remain only in `sessionStorage["dwnb-ai-key"]` and are excluded from Git, IndexedDB learning state, logs, URLs, and DWNB exports.
- If free-tier verification is older than 30 days, remote AI is blocked while all deterministic/local learning continues.

The machine-readable policy lives in:

```text
src/config/cost-registry.ts
src/config/source-verification-registry.json
```

## Current service registry

| Service | Mandatory | Verified zero-cost boundary | Current limit note | Failure behavior | Local/offline replacement |
|---|---|---|---|---|---|
| Core local application | Yes | No network billing path | Device/IndexedDB quota only | Keep data local and offer DWNB export | The application itself |
| Gemini BYOK | No | Only `gemini-2.5-flash` and `gemini-2.5-flash-lite`, whose text input/output were listed in Free Tier on the verification date | Exact RPM/TPM/RPD varies by project/model and is shown in AI Studio | Unknown model, stale source, or 429 blocks sending; no paid retry | Deterministic tutor / Ollama |
| OpenRouter BYOK | No | Only `openrouter/free` or a model ID ending in `:free` | Official docs listed free-model limits; availability and limits can change | 402/429 or stale verification returns to deterministic mode; never buys credits | Deterministic tutor / Ollama |
| Ollama/local endpoint | No | User-run local computation | Device capacity | Keep deterministic tutor available | Deterministic tutor |
| Browser WebGPU model | No | Public Apache-2.0 multilingual embedding weights; no API or per-token billing | Opt-in 130–150 MB first download, 4 GB conservative memory floor, browser quota/GPU limits | Delete partial cache and return to deterministic follow-up | Deterministic follow-up / Ollama |
| Vercel Hobby | No for learning; deployment target only | Personal, non-commercial Hobby use | Quotas pause features when exhausted in most cases | Local PWA/static-host escape path | Local PWA |
| GitHub Actions | No for learning; CI target only | Standard runners in a public repository | Larger runners are forbidden | Run the same commands locally | Local `npm run check` + Playwright |

## Official zero-cost sources

- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini limits: https://ai.google.dev/gemini-api/docs/rate-limits
- OpenRouter free variants: https://openrouter.ai/docs/guides/routing/model-variants/free
- OpenRouter free router: https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground
- OpenRouter limits: https://openrouter.ai/docs/api-reference/limits
- Transformers.js 4.2.0: https://www.npmjs.com/package/@huggingface/transformers/v/4.2.0
- Transformers.js WebGPU guide: https://huggingface.co/docs/transformers.js/guides/webgpu
- Multilingual MiniLM base model and license: https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- Transformers.js ONNX files: https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/tree/main/onnx
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions

## Important provider boundaries

### Gemini

The pricing page also contains paid tiers and paid capabilities. The app therefore allowlists only the two text models above, does not send Grounding/Search/Maps/image/TTS requests, and never falls back to another Gemini SKU. The learner must use a Free Tier project without enabled billing; the browser cannot independently inspect the Google Cloud billing relationship of an API key. If that status is uncertain, use Disabled or Ollama mode.

### OpenRouter

The app checks the model identifier before `fetch`. A generic or paid ID is rejected even if the learner has credits. The free router or `:free` suffix can still be unavailable or rate-limited; that is handled as loss of an optional accelerator, not a reason to purchase credit.

### Browser WebGPU

The browser model has no API key or paid endpoint. A learner must opt in after seeing the model ID, pinned revision, Apache/MIT license notices, conservative download envelope, memory/storage checks, and deletion control. The first download contacts Hugging Face for public weights but sends no learner data. Inference then runs inside a local Worker. Missing WebGPU, insufficient resources, download failure, source expiry, or inference failure always returns to the deterministic follow-up; there is no hidden WASM or paid fallback. Model weights are excluded from Git, ZIP, and default Offline packs.

### Hosting and CI

Vercel is restricted to Hobby personal/non-commercial use. The project does not depend on Functions, databases, Blob, paid image optimization, or analytics. GitHub Actions uses only the standard `ubuntu-24.04` runner image in the public repository, pinned by version (never a moving `*-latest` label, so GitHub's runner-image migrations cannot change CI without a commit). No Larger runners or paid artifacts are required.

## Automated audit

Credential gates are local Node processes and do not upload source to a security SaaS:

```bash
npm run secret:audit
npm run secret:audit:history
```

The first is part of `npm run check`; the second requires full Git history in public-repository CI. Both remain inside the 0 USD boundary.

Local/release source gate:

```bash
npm run source:audit -- --strict
```

Monthly network probe and review reminder:

```text
.github/workflows/source-freshness.yml
```

The workflow runs on the first day of each month, probes official URLs, and opens or updates one maintenance issue when a source is due, stale, or unreachable. After a maintainer performs a semantic comparison and updates the registry, the next successful run closes the issue.

A successful HTTP status proves only reachability. It **does not** prove that an exam format, model price, free quota, provider terms, or privacy behavior stayed unchanged. Dates may be advanced only after human semantic review.

## Local German word matching — 2026-09-11

`local-german-word-matching-v1` is an optional learner-owned browser model, not a paid API. It downloads the pinned q8 `onnx-community/whisper-tiny` pack only after explicit consent, stores it in `dwnb-pronunciation-model-v1`, and performs short German transcription and expected-word matching in a local WebGPU Worker. There is no usage quota, payment card, server inference, paid fallback, or audio upload. Low-data mode, source staleness, insufficient device limits, or installation failure falls back to record/play/self-review. The model download still consumes the learner's bandwidth and storage and must not be described as zero-resource. Word recognition is not a phoneme, accent, fluency, CEFR, or exam score.
