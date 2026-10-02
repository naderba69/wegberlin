# ADR-012 — Deterministic lexical target-gap inventory

- Status: Accepted
- Date: 2026-09-04
- Version: `lexical-target-gap-v1`

## Context

The course already had 336 noun anchors and 84 verb-preposition-case frames across all 84 A1–B2 lessons. Four nouns and one frame per lesson provided a usable teaching surface, but those fixed counts did not establish that all authored target vocabulary was covered. Closing P0-98/P0-99 from anchor presence alone would therefore be false.

A broad scan of every capitalized German token would also be unsafe: sentence-initial capitalization creates false noun signals, and software cannot reliably invent a noun's gender/plural or decide whether a nearby preposition is governed by a verb.

## Decision

1. `src/core/content-validation/lexical-target-gap.ts` builds a deterministic lesson-scoped inventory.
2. Existing registry entries are always represented as covered baseline rows.
3. Authored target signals are limited to:
   - uppercase lemmas in a lesson reading glossary;
   - article-marked nouns on vocabulary phrases or flashcard fronts;
   - visible infinitive + preposition pairs on those same target surfaces.
4. Theory examples, dialogues, reading/listening texts, mistakes, and authored exercise/test surfaces are scanned only as contextual signals. Context-only rows are retained in machine output but are not silently promoted to target vocabulary.
5. Sentence-initial capitalization alone is never noun evidence.
6. Every row receives a stable ID, lesson/level, evidence paths, matched anchor IDs, and one explicit status:
   - `covered`;
   - `pending-human`;
   - `not-target` for context-only signals under this policy.
7. The detector may record visible case morphology as evidence, including `unknown` or `ambiguous`; it never creates a grammatical record or infers a missing gender, plural, governed case, or pedagogical priority.
8. The complete inventory is stored under `lexicalTargetGaps` in `reports/academic-content-audit.json`; the review queue is rendered in `docs/generated/LEXICAL_TARGET_GAP_REPORT.md`. Both are regenerated and drift-checked by `content:audit` during `prebuild`.
9. Nonzero `pending-human` is an honest review queue, not a build failure. P0-98/P0-99 remain partial until reviewed additions/exclusions reduce the accepted queue to the documented closure threshold.

## Current v1 result

```text
Lessons scanned: 84/84
Noun signals: 3,219
Noun covered: 730
Noun pending human: 360
Noun context only: 2,128

Verb/preposition signals: 817
Verb frames covered: 104
Verb frames pending human: 0
Verb not target: 713 (including 6 explicit exclusions)
```

The covered noun-signal count can exceed the 685 registry records because inflected/plural and contextual surfaces may resolve to one anchor. Six noun batches add 349 records through all A2 lessons. The sixth adds all 173 A2 targets and resolves seven additional base-lemma signal rows; A1 and A2 pending are zero.

## Consequences

- The project now has a reproducible answer to “what did the audit inspect?” instead of relying on a fixed per-lesson quota.
- Human reviewers can work from stable rows and source paths, and future content changes make the committed report stale until regenerated.
- False confidence is reduced: a machine candidate is not automatically treated as a lexical fact.
- Two frame batches have added 20 reliable target chunks above the 84-frame baseline: the prior 13 and a second 7 split A1 +1, A2 +3, B1 +2, B2 +1. A2 now has zero pending frame candidates. The six remaining rows include apparent spatial, separable-particle, adjunct, and purpose-clause detections; they stay pending instead of receiving automatic exclusions. The 360-noun B1–B2 backlog and six explicit frame exclusions still require independent German review. The versioned exclusions distinguish one locative adjunct, two `vorliegen` particle detections, one `bei Bedarf` condition adjunct, one `ausreichen` particle, and one `um … zu` purpose clause; all remain `authored-review-pending`.
