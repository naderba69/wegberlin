# ADR-048 — Writing diff, practical context registry, and training interaction metadata

Accepted 2026-09-08. Closes P1-173/185/187/200.

Writing revisions now display a word-level LCS diff between the linked sourceVersion and revised version. Additions and removals are visible and counted; the UI does not claim every change is an improvement.

The practical context registry contains 16 situated cultural communication notes and 20 form/notice/message records, balanced across A1–B2. Cultural notes cite dated internal lesson sources, remain authored-review-pending, and explicitly avoid population claims. Document training has no legal or official validity and uses fictional data.

`training-interaction-log-v1` records pause, resume, and answer-change metadata only on writing drafts and library questions. It stores no answer text, key strokes, correctness, score, or mastery; rapid duplicate events are suppressed. Records are strict Zod, IndexedDB/DWNB portable, and merged by ID.

`practical:context:audit` is fail-closed in prebuild. Independent cultural review remains pending in the final project review.
