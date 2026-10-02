# ADR-028 — Writing speed is device-planning evidence only

Date: 2026-09-07  
Status: accepted

## Context

P1-18 requires reading and writing speed on the learner's device to calibrate session length. Free writing would mix keyboard familiarity with German quality, and presenting that speed as language ability would be invalid. The absolute-beginner flow must also remain protected from early writing demands.

## Decision

Adopt `writing-device-benchmark-v1` only inside the real Writing Lab after its existing lesson-stage gate.

- A short original German copy sentence is selected by level and stays hidden until explicit Start.
- The timer uses `performance.now()` while the page remains visible. Hiding the page cancels without evidence.
- Paste is blocked because it does not measure keyboard input.
- Finishing before five seconds is rejected.
- Copy similarity is a device-measurement integrity check, not German correction. Speed is stored only at 90% or higher similarity and at least 80% of target length.
- Qualified values are capped at 100 WPM and 600 characters/minute and map to a bounded 5/8/10/12-minute writing recommendation.
- A qualified result splits the existing practice/production pool into a calibrated writing block. Total Today time does not increase, and mastery, correctness, writing feedback, and level gates are untouched.
- Attempts can be rerun or deleted and remain separate from `writingSubmissions`.

The optional records are backward-compatible in LearningState schema v3 and round-trip through DWNB and deterministic merge.

## Acceptance

Unit tests cover all level prompts, normalization and copy similarity, timing bounds, qualification, omission of unqualified WPM/CPM, capped bands, latest-qualified selection, exact Today totals, untouched mastery, schema defaults, DWNB, and merge. Desktop and mobile Playwright run the real five-second UI flow inside the unlocked A1 Writing Lab, verify persisted planning-only provenance, and scan the component with axe.

Together with ADR-027 reading calibration, this closes the compound P1-18 without claiming writing quality, CEFR, or an exam score.