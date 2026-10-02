# ADR-027 — Reading speed requires comprehension

Date: 2026-09-07  
Status: accepted

## Context

A raw timer rewards skimming and can mislabel a learner or device. P1-126 requires optional speed measurement while preserving comprehension; the reading half of P1-18 may adjust session length but must not become CEFR, mastery, or exam evidence.

## Decision

Adopt `reading-comprehension-benchmark-v1` on Today for learners who have diagnostic or completed-lesson context.

- The text is selected from the original level-matched reading library and remains hidden until an explicit Start action.
- Timing uses `performance.now()` only while the document remains visible. Hiding the page cancels the run and stores nothing.
- Finishing before five seconds is rejected as an accidental click.
- The text is hidden before two comprehension questions appear.
- Both answers must be correct before WPM or a reading-time recommendation is stored. A failed attempt stores comprehension/duration only and omits WPM.
- WPM is capped at 400 and maps to a bounded 5/6/8/10-minute recommendation.
- A qualified result splits the existing lesson budget into lesson + calibrated reading blocks; total Today minutes do not increase, and mastery/correctness remain untouched.
- The learner can rerun or delete all benchmark attempts.

The optional records are backward-compatible in LearningState schema v3 and round-trip through DWNB and deterministic merge.

## Acceptance

Unit tests cover all four levels, German word counting, timing bounds, 2/2 qualification, omission of unqualified WPM, bounded recommendations, latest-qualified selection, unchanged mastery, exact Today total, schema defaults, DWNB, and merge. Desktop and mobile Playwright run a visible five-second benchmark, answer both authored questions, verify a calibrated reading block, and inspect the stored no-CEFR/no-mastery boundary.

This closes P1-126. Reading speed alone did not satisfy compound P1-18; the remaining writing-device half is now completed separately by ADR-028.