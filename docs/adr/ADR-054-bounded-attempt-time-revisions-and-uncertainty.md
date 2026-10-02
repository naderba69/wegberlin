# ADR-054 — Bounded attempt time, committed revisions, and learner-attributed uncertainty

- Status: accepted
- Date: 2026-09-10
- Scope: P2-33, P2-34

## Decision

`bounded-attempt-process-v1` extends lesson ExerciseAttempt evidence with optional process metadata:

- response time begins at the first answer, confidence, uncertainty, or hint interaction;
- time while the document is hidden is subtracted;
- persisted time is capped at 30 minutes;
- `answerChangeCount` counts only a changed committed choice for the same MCQ/question/matching field;
- text inputs start timing but individual keystrokes and intermediate text are never logged;
- the learner may optionally choose German-first `knowledge-recall`, `guess`, or `instruction-unclear` before checking.

The metadata travels with the existing final attempt through strict Zod, IndexedDB, DWNB, and Merge. `summarizeAttemptProcess` reports attempt/timing counts, median response time, committed revisions, direct pre-commit-supported attempts, and the three uncertainty kinds. It copies no answer text.

## Boundaries

Timing and revisions are process context, not evidence of intelligence, effort, or CEFR. `instruction-unclear` asks the product to review task wording before interpreting a wrong answer as missing knowledge. Guess dominance requests another independent sample. Neither changes correctness or mastery, and selecting no uncertainty remains valid.

The 100-change and 30-minute bounds reject malformed imports. Browser visibility handling is best-effort page timing, not surveillance or an invigilation clock.

## Consequences

P2-33 closes with bounded per-attempt time, committed answer revision count, and existing direct hint provenance. P2-34 closes with explicit learner-attributed knowledge/guess/instruction categories without cognitive diagnosis.

## Evidence

- `src/components/exercise-card.tsx`
- `src/core/evidence/attempt-process.ts`
- `src/types/learning.ts`
- `src/core/portability/schema.ts`
- `src/app/progress/page.tsx`
- `tests/unit/attempt-process.test.tsx`
- `tests/e2e/critical-flows.spec.ts`
