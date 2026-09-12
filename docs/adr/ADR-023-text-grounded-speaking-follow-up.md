# ADR-023 — Text-grounded speaking follow-up without STT claims

Date: 2026-09-06  
Status: accepted

## Context

P0-160 asks for a follow-up question that responds to the learner's answer rather than showing one fixed generic prompt. The application records audio locally but has no speech-to-text engine and no valid acoustic understanding layer. Treating the recording as understood would therefore be a false claim.

## Decision

Adopt `content-grounded-follow-up-v1` inside the existing Speaking Lab. After recording and listening back, the learner may type up to 600 characters of German summary or transcript. That learner-typed text is the only content source and is explicitly labeled `typed-transcript`.

The default path is a deterministic Offline engine in `src/core/speaking/content-follow-up.ts`. It detects bounded location, work/study, preference, time/plan, reason/opinion, or fallback content-word cues. The generated German question must retain a verifiable cue from the typed text. Empty, fewer-than-three-word, and Arabic-only submissions fail closed instead of receiving a fabricated grounded question.

When Gemini, OpenRouter Free-only, or Ollama is selected, the learner may explicitly request an optional model question. A modal previews the exact typed text and destination. No request is made before a fresh per-send confirmation. The strict response contains one German question, a short Arabic connection note, and an exact `groundingCue` copied from the approved text. Responses with extra fields or cues absent from the source are rejected. The existing 0 USD model and source-freshness guards run before `fetch`.

The audio Blob is never attached to the request. The system prompt treats the typed transcript as untrusted data and forbids claims of STT, audio analysis, pronunciation/fluency scoring, human review, or official results.

## Persistence and privacy

An optional `contentFollowUp` object is stored on the speaking attempt without increasing the LearningState schema version because the field is backward-compatible and optional. It records:

- policy and evaluation-boundary versions;
- source type `typed-transcript`;
- a maximum 180-character local excerpt and SHA-256 of the normalized full source;
- the exact grounding cue and cue category;
- German question and Arabic support;
- provider, model, and `not-required` or `explicit` consent provenance;
- generation timestamp.

DWNB export/import and deterministic speaking-attempt merge preserve the object. The immediate recording-privacy action also removes every retained typed source excerpt while preserving the hash, generated question, duration, and non-acoustic self-review.

## Acceptance

- Unit tests cover every deterministic cue family, content-token fallback, insufficient input, Arabic-only rejection, bidi-control removal, deterministic output, source hashing, cue verification, consent invariants, strict AI JSON, pre-fetch consent, network payload minimization, schema validation, DWNB round-trip, and merge preservation.
- Desktop and mobile Playwright use a fake local recorder, prove that the local question refers to `Tunesien`, prove zero model requests before the consent modal, approve the exact text once, receive a question grounded in `Berlin`, and verify persisted provider/model/consent/boundary provenance.
- The follow-up remains optional and does not block saving the original speaking evidence.

This closes P0-160 without claiming that the application understood the recording itself. At this ADR's acceptance, real STT, acoustic pronunciation scoring, and a platform-provided live partner were absent. ADR-060 later adds a separate optional local expected-word STT path; this typed follow-up still never uses it, and acoustic pronunciation scoring/live partnership remain absent.