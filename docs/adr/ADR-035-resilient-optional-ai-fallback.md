# ADR-035 — One-attempt optional-AI failure classification and deterministic fallback

- Status: Accepted
- Date: 2026-09-07
- Policy: `ai-resilient-fallback-v1`
- Closes: P1-223, P1-330

## Decision

Every Gemini, OpenRouter Free-only, and Ollama content request uses an AbortController with a 12-second default timeout. Runtime failures are classified as `rate-limit`, `timeout`, `network`, `http`, or `malformed`. Configuration, consent, source-freshness, missing-key, invalid-endpoint, and paid-model violations still fail before fetch and are never hidden by fallback.

After one consented network attempt fails, Tutor returns the existing deterministic local rule answer and speaking follow-up returns the existing transcript-grounded local question. No second network request occurs. `AIFallbackEvidence` records attempted provider/model, failure kind/status, exactly one network attempt, local fallback provider/model, timestamp, and `retryRequiresNewConsent=true`. Keys remain session-only and are never persisted.

Tutor renders the structured local result with a failure notice. A retry button opens the normal consent dialog again; it cannot fetch before renewed consent. Speaking displays the same bounded notice and its existing provider button likewise requires a fresh consent cycle.

Fallback provenance is optional in TutorInteraction and SpeakingContentFollowUpEvidence, Zod/DWNB/Merge compatible, and does not create correctness, mastery, STT, or a claim that the remote provider answered.

## Acceptance

A 12-case matrix covers Gemini/OpenRouter/Ollama × 429/network/timeout/malformed. Additional tests cover HTTP 503, successful OpenRouter Free-only JSON, transcript-grounded speaking fallback, fresh-consent retry, and persisted schema provenance. Desktop/mobile Playwright intercepts one OpenRouter 429, verifies exactly one request, local structured output, visible reason, persisted attempt evidence, and no retry request before a second consent.

## Boundaries

Fallback cannot make an unknown local tutor rule authoritative. Timeout does not prove provider outage. Retry is always manual. Connection-test failures do not silently claim a working fallback connection. No paid fallback exists.
