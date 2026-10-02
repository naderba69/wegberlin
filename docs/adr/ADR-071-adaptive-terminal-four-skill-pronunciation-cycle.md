# ADR-071 — Adaptive terminal four-skill and spaced pronunciation cycle

- **Status:** accepted and implemented
- **Date:** 2026-09-12
- **Scope:** A1–B2 lesson vocabulary, local word confirmation, SM-2 review, responsive reflow

## Context

The vocabulary cycle used an in-memory modulo index, accepted a substring as writing evidence, marked listening at click time, and marked speaking through self-report. Completing the final phrase returned the learner to the first phrase. The same dense two-column layout did not recompose reliably under large text on narrow screens.

## Decision

1. `adaptive-four-skill-cycle-v2` derives a writing goal from CEFR level, phrase length, and whether the target is already a complete sentence.
2. Writing requires an ordered token-boundary match and enough context; a raw substring is insufficient.
3. Listening becomes complete only after browser speech emits a successful start/end event.
4. Speaking uses transient microphone audio, local signal validation, local Whisper transcription, and ordered expected-word alignment. Repeated words stay repeated and reordering cannot complete a phrase.
5. The result is strictly **word confirmation**. It does not claim phoneme, accent, fluency, grammatical free-speech, CEFR, or official exam scoring.
6. A successful phrase is persisted through a stable exercise-attempt ID in IndexedDB. The first unfinished phrase is restored after reload.
7. Completion is terminal. There is no modulo reset; the lesson advances from Vocabulary stage 2 to Discover stage 3.
8. Selected lesson phrase cards become SM-2 pronunciation cards. Failure or technical deferral does not receive success credit, and deferred work remains due.
9. Review labels resolve to learner-facing lesson titles. Internal task, pattern, and lesson IDs remain state keys rather than educational copy.
10. The component uses single-column reflow, container queries, wrapped actions, visible mobile route context, and no educational-text ellipsis. Automated coverage includes 320×568, 360×800, and 768×1024 across compact/default/large text.

## Persistence and Merge

Phrase completion reuses the existing stable `ExerciseAttempt` event collection, so IndexedDB, DWNB export/import, and ID-based Merge preserve it without a schema migration. Failed word-matching attempts may be retained as process evidence but do not complete the phrase.

## Zero-cost and privacy boundary

- Audio remains transient and is not added to the Media store.
- Inference uses the explicitly installed local model package.
- No paid or network speech fallback exists.
- A missing model, unsupported device, bad signal, or denied microphone is a technical non-verification, never a fabricated pronunciation failure or success.

## Validation

- 870/870 unit and integrity tests.
- 80/80 production browser tests: 40 desktop and 40 mobile.
- Terminal 14/N restoration and Vocabulary→Discover navigation are covered in Playwright.
- Responsive checks inspect document overflow, off-screen educational text, element clipping, and topbar sibling overlap across the required viewport/font-scale matrix.
- Independent German phonetics, physical-device, and assistive-technology review remains pending and is not closed by automation.
