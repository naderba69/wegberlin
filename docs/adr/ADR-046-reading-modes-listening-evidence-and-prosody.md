# ADR-046 — Separate reading modes, hypothesis-first unknown words, unified listening evidence, and prosody progression

- Status: accepted
- Date: 2026-09-08
- Policies: `easy-vs-exam-reading-v1`, `unknown-word-and-compound-strategy-v1`, `unified-listening-usage-evidence-v1`, `prosody-rhythm-progression-v1`, `study-modes-audit-v1`
- Closes: P1-127, P1-128, P1-137, P1-138

## Decision

Library reading now has explicit Easy and Exam modes. Easy exposes an authored-meaning unknown-word strategy and summary; Exam exposes only text and questions. Answer keys are mode-scoped in UI state, so an Easy answer is not carried into Exam. Mode selection creates no mastery.

Unknown-word practice asks for a word-function hypothesis, context inspection, and compound splitting only when both parts belong to a conservative known-parts inventory. Meaning is revealed only from the authored word-family registry; no semantic guess is generated. Current deterministic coverage is 63/80 reading items: A1/A2/B1/B2 = 8/20/20/15.

A global capture contract records listening playback and transcript reveals across onboarding, diagnostic, lesson, library, Shadowing, guided exam, and continuous exam. Each event stores surface/content, MP3 or Browser TTS source, play ordinal, elapsed seconds from first playback when available, and whether transcript reveal followed answer commitment. It never stores comprehension correctness, pronunciation, or mastery.

Prosody progression contains 16 authored steps: four per level, covering word stress, sentence focus, rhythm, and hesitation/repair. It appears in lesson pronunciation and Shadowing and uses Browser TTS only as a synthetic model. It cannot listen to the learner or score pronunciation/fluency.

## Persistence

`ListeningUsageEvent` is strict Zod with a schema-v3 default, IndexedDB source of truth, DWNB round-trip, ID union merge, and no score fields.

## Governance

`study:modes:audit` runs in prebuild and verifies 80 reading items, 63 authored-meaning challenges, 16 prosody steps, four functions per level, and honest boundaries. Component instrumentation is checked by unit/handoff tests. Automated checks do not replace human acoustic or pedagogical review.
