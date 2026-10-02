# ADR-042 — Honest primary writing tutor with consented Gemini doubt review

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `hybrid-writing-review-v1`, `writing-review-v1`
- Owner decision: the product should be the primary honest self-study teacher; Gemini may be consulted when local review remains uncertain.

## Context

The owner requested a complete corrector and a replacement for a teacher. A literal guarantee would be technically and pedagogically false: deterministic patterns have false negatives, a language model can invent or miss issues, and neither can provide official exam assessment or reliable acoustic pronunciation judgment.

The accepted product goal is therefore stronger but honest: the platform is the learner's primary self-study teacher. It performs local structured checks, explains proven patterns, creates repair exercises, and guides revision. When meaning, idiomaticity, register, or argument quality remains uncertain, the learner may explicitly ask Gemini BYOK for a second advisory review.

## Decision

### 1. Local review remains primary

The Writing Lab labels the local workflow `primary-honest-self-study-tutor`. It combines task planning, self-check, five dimensions, seven high-confidence deterministic error patterns, delayed repair exercises, revision provenance, and explicit residual uncertainty.

The local boundary always states:

- absence of a matched pattern does not prove an error-free text;
- meaning/context, idiomaticity, and argument/task nuance may remain uncertain;
- the result is not an official teacher or CEFR assessment.

The platform remains fully usable without AI.

### 2. Gemini only on explicit doubt request

The optional remote path is restricted to Gemini BYOK and the existing verified free-model allowlist. Disabled, OpenRouter, and Ollama do not silently receive Writing text through this path. No request occurs automatically or merely because a local pattern is uncertain.

The learner presses `Ask Gemini when uncertain`, sees the exact source version, text length, destination, and a bounded excerpt, then grants one independent consent. Retry requires opening consent again. Existing source-freshness, model allowlist, 0 USD, and session-only key guards run before fetch.

### 3. Strict minimized contract

The network payload contains only:

```text
source=learner-writing
text=<approved reviewed version, max 3000 characters>
```

The system context contains task ID, level, bounded task prompt, and local pattern IDs. It does not contain profile, mastery, diagnostics, other writing, audio, answer keys, or the API key.

Gemini must return strict JSON with:

- Arabic summary;
- up to eight issues;
- category;
- exact excerpt copied from the approved text;
- Arabic explanation;
- one German suggestion;
- medium/high confidence;
- up to five unresolved questions.

Every issue is rejected unless its excerpt exists verbatim after local normalization. Extra fields such as an official score fail the schema. The prompt forbids official score, CEFR grade, exam result, legal claim, teacher-replacement claim, answer key, and mastery change.

### 4. Persisted advisory provenance

A saved review stores the source submission/version/task, SHA-256 of the approved text, Gemini/model/prompt version, explicit consent, bounded issues, unresolved questions, and:

```text
advisory-writing-review-no-official-score-or-mastery
```

It stores no key. DWNB and merge preserve it. Deleting Writing data also deletes dependent repair attempts and Gemini reviews. A review can also be deleted from its source-version panel.

### 5. Provider capability correction

ADR-036's original “Writing AI not connected” statement is superseded only for Gemini: Gemini now supports advisory Writing review on explicit doubt. Disabled remains the local primary checker, while OpenRouter, Ollama, and Browser WebGPU remain not connected to this Writing-review path.

## Acceptance evidence

Automated tests verify consent-before-fetch, Gemini-only rejection, strict shape, verbatim excerpts, minimized payload, source/model/cost guards, one request, no key/score/mastery fields, SHA-256 provenance, schema/DWNB/merge, provider-matrix accuracy, local-first UI, consent dialog, browser mocked Gemini review, persistence, and privacy deletion on Desktop and Mobile.

## Consequences and limits

- The product can be the learner's primary day-to-day self-study teacher and correction workflow.
- It still cannot honestly promise a complete corrector or guaranteed replacement for a qualified human in every semantic, pragmatic, legal, phonetic, or official-assessment case.
- Gemini output is advisory and can be wrong. Medium confidence and unresolved fields are first-class, not hidden failures.
- Network review depends on the learner's Gemini key, free-tier availability, fresh source verification, and per-send consent.
- No human review is claimed until the final independent review round occurs.
