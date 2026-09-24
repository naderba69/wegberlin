# ADR-036 — Linked Tutor commands and an honest provider capability matrix

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `tutor-follow-up-command-v1`, `ai-provider-capability-matrix-v1`
- Closes: P1-210, P1-222, P1-224

## Context

The Tutor already returned a strict hint-first answer and required consent for every network-backed question. It did not offer the learner the three direct follow-up commands requested by P1-210, and Settings split provider information across configuration, cost, privacy, and WebGPU cards. Provider success mocks were also uneven: failure resilience was broad, but every supported Tutor/Speaking success path was not represented as one explicit matrix.

A command must remain attached to the immediately preceding answer and current lesson. It must not become a shortcut to a stored exercise answer. An approved parent question cannot authorize another network send. The settings UI must not invent a live quota value that Gemini, OpenRouter, Ollama, or WebGPU cannot expose through one trustworthy contract.

## Decision

### 1. Linked commands

The Tutor exposes German-first labels with Arabic support:

- `Einfacher · اشرح أبسط` → `simpler`
- `Noch ein Beispiel · مثال آخر` → `another-example`
- `Auf Arabisch · بالعربية` → `arabic`

Each command uses `TutorCommandSource`: the previous interaction ID, visible question/command label, and strict four-field Tutor answer. The current lesson ID, level, and objective constrain the continuation. Active error rows and an active exercise answer key are not sent with a command.

Every persisted command row contains:

- `command`
- `parentInteractionId`
- `commandPolicyVersion=tutor-follow-up-command-v1`
- provider, model, prompt version, and consent provenance
- `evidenceBoundary=support-only-no-answer-key-no-mastery-or-correctness`

The Zod portability schema rejects partial command provenance while continuing to accept legacy `tutor-v2` rows. DWNB and deterministic ID-based merge preserve the new fields. No API key, mastery value, correctness result, or active answer key is added to the record.

### 2. Local and network behavior

`disabled` executes all three commands deterministically as `local-rules-command-v1`, without `fetch` or consent. The local transformations simplify one sentence, provide a separately authored example, or foreground the Arabic explanation. They explicitly avoid solving the previous micro-exercise.

Gemini, OpenRouter Free-only, and Local/Ollama receive one strict JSON command payload after a new explicit consent. Consent granted for the parent question is not reusable. The command prompt forbids solving the previous micro-exercise, exposing a stored key, changing exam rules, claiming human assessment, or moving beyond B2.

Pre-fetch zero-cost, model, source-freshness, key, and endpoint guards remain hard failures. A network/runtime failure after the one approved request falls back to `local-rules-command-v1` with `ai-resilient-fallback-v1` provenance. Retry is manual and requires another consent. There is no second automatic or paid request.

### 3. Unified provider capability matrix

Settings renders five rows under `ai-provider-capability-matrix-v1`:

1. disabled/local rules
2. Gemini BYOK
3. OpenRouter Free-only
4. Local/Ollama
5. Browser WebGPU

Every row shows the model, setup/capability state, per-feature support, network and consent boundary, privacy, quota wording, exact 0 USD boundary, source freshness/due date, and fallback. The feature columns are Tutor, Tutor commands, typed-text Speaking follow-up, and writing AI.

At this ADR's original acceptance, Writing AI was not connected. ADR-042 now supersedes that row for Gemini only: the deterministic Writing workflow remains primary, while Gemini can provide a consented advisory doubt review. OpenRouter, Ollama, disabled-as-remote, and Browser WebGPU remain not connected to that remote Writing path. Browser WebGPU is still limited to ranking authored typed-text follow-up candidates; it is not a Tutor, generator, STT system, or pronunciation scorer.

`liveQuotaAvailable` is always false. Remote rows explain that the app cannot read a trustworthy live remaining-quota number. Gemini lists only the verified Flash/Flash-Lite models. OpenRouter lists only `openrouter/free` or IDs ending in `:free`. Ollama and WebGPU expose device/setup limits instead of a fabricated API allowance.

### 4. Mock acceptance matrix

CI unit tests now exercise successful mocked contracts for:

- Tutor question: disabled, Gemini, OpenRouter, Ollama
- linked Tutor command: disabled, Gemini, OpenRouter, Ollama
- typed-text Speaking follow-up: deterministic disabled, Gemini, OpenRouter, Ollama
- Browser WebGPU: mocked Worker ranking, its only connected inference feature

The tests also cover independent command consent, minimized command payload keys, absence of interaction ID/key/mastery/correctness payload fields, 429 command fallback, command schema completeness, capability/source blocking, and no live-quota claim. Existing failure tests retain the Gemini/OpenRouter/Ollama × 429/network/timeout/malformed matrix.

## Consequences and limits

- The learner can refine the latest answer without rewriting a new question.
- Commands are support evidence only and cannot change lesson completion, mastery, correctness, CEFR level, or exam readiness.
- A model can still generate a pedagogically weak explanation; strict shape and prohibitions are not human academic review.
- The provider board reports policy capability and configured/session setup, not a guaranteed live service state.
- WebGPU mock success in CI is not evidence of installation, performance, memory, thermal behavior, or accessibility on a physical GPU/device.
- No writing-provider path is claimed until it has its own minimized payload, consent, strict output contract, UI, and mocks.
