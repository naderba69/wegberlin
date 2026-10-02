# ADR-050 — No-blame time evidence, readiness ranges, narrow CSP, and DWNB deprecation

- Status: accepted
- Date: 2026-09-09
- Scope: P1-282, P1-284, P1-318, P1-365

## Decision

### Weekly time

`weekly-planned-actual-no-blame-v1` compares the elapsed plan through the local current day with the minutes recorded by completed learning activities in the same week. It exposes the signed difference and a 15%/10-minute flexibility band. Wording is factual: no laziness, failure, debt, penalty, or automatic mastery consequence is inferred. Recorded minutes remain activity estimates, not surveillance-grade timing.

### Readiness window

`evidence-velocity-readiness-range-v1` computes a provider-scoped training gap from each Goethe or telc module, then uses unique recent evidence-producing study days over at most 28 days. Fewer than three evidence days or a window shorter than seven days returns `insufficient-data`. Otherwise the UI displays a conservative week range with explicit assumptions. It never emits a calendar pass date, official score, guarantee, or cross-provider average.

### CSP and headers

`vercel-csp-headers-v1` centralizes production headers in `src/config/security-headers.ts`. CSP denies objects and frames; allows only same-origin application resources, local Blob/data use needed by the product, exact Gemini/OpenRouter/Hugging Face delivery origins, and loopback Ollama origins. There is no global wildcard or generic `unsafe-eval`.

Two exceptions remain explicit and audited: Next.js hydration and bounded React inline styles need `unsafe-inline`; the opt-in pinned ONNX/WebGPU support module needs `wasm-unsafe-eval`. `security:audit` fails when directives, allowlists, exceptions, headers, or the generated report drift.

### DWNB lifecycle

`dwnb-deprecation-policy-v1` publishes an import/export matrix for v1/v2/v3. v1 was announced deprecated on 2026-09-09 and remains importable through 2027-03-31, a notice longer than 180 days. Import displays a migration warning and asks the learner to re-export as v2 or v3. v2 and v3 are current and guaranteed support at least through 2027-09-30. Unknown or expired versions fail explicitly before local state mutation.

Old learning-state schema v1/v2 payloads are migrated through the same tested schema-v3 migration before strict validation. Format compatibility does not claim semantic equivalence or archive integrity; checksum, encryption, schema validation, preview, and atomic commit remain separate gates.

## Consequences and boundaries

- More recorded time does not create mastery; less recorded time does not create punishment.
- The forecast is a planning range, not a promise of exam success.
- LAN-hosted Ollama addresses are intentionally excluded from CSP v1; only browser loopback is accepted.
- CSP source endpoints may require a reviewed update if the pinned model host changes its exact delivery infrastructure.
- v1 support expires only after the documented window, with an actionable non-silent error.

## Evidence

- `src/core/coach/weekly-plan.ts`
- `src/core/exams/readiness.ts`
- `src/config/security-headers.ts`
- `scripts/audit-security-headers.ts`
- `src/core/portability/deprecation.ts`
- `src/core/portability/backup.ts`
- `tests/unit/planning-readiness-security-deprecation.test.ts`
