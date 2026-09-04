# Zero-Cost Contract

Last verified: 2026-09-03  
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
| Vercel Hobby | No for learning; deployment target only | Personal, non-commercial Hobby use | Quotas pause features when exhausted in most cases | Local PWA/static-host escape path | Local PWA |
| GitHub Actions | No for learning; CI target only | Standard runners in a public repository | Larger runners are forbidden | Run the same commands locally | Local `npm run check` + Playwright |

## Official zero-cost sources

- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini limits: https://ai.google.dev/gemini-api/docs/rate-limits
- OpenRouter free variants: https://openrouter.ai/docs/guides/routing/model-variants/free
- OpenRouter free router: https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground
- OpenRouter limits: https://openrouter.ai/docs/api-reference/limits
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions

## Important provider boundaries

### Gemini

The pricing page also contains paid tiers and paid capabilities. The app therefore allowlists only the two text models above, does not send Grounding/Search/Maps/image/TTS requests, and never falls back to another Gemini SKU. The learner must use a Free Tier project without enabled billing; the browser cannot independently inspect the Google Cloud billing relationship of an API key. If that status is uncertain, use Disabled or Ollama mode.

### OpenRouter

The app checks the model identifier before `fetch`. A generic or paid ID is rejected even if the learner has credits. The free router or `:free` suffix can still be unavailable or rate-limited; that is handled as loss of an optional accelerator, not a reason to purchase credit.

### Hosting and CI

Vercel is restricted to Hobby personal/non-commercial use. The project does not depend on Functions, databases, Blob, paid image optimization, or analytics. GitHub Actions uses only `ubuntu-latest` standard runners in the public repository. No Larger runners or paid artifacts are required.

## Automated audit

Local/release gate:

```bash
npm run source:audit -- --strict
```

Monthly network probe and review reminder:

```text
.github/workflows/source-freshness.yml
```

The workflow runs on the first day of each month, probes official URLs, and opens or updates one maintenance issue when a source is due, stale, or unreachable. After a maintainer performs a semantic comparison and updates the registry, the next successful run closes the issue.

A successful HTTP status proves only reachability. It **does not** prove that an exam format, model price, free quota, provider terms, or privacy behavior stayed unchanged. Dates may be advanced only after human semantic review.
