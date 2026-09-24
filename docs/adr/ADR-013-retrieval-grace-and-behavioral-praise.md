# ADR-013 — Pre-SRS retrieval, visible grace, and behavioral praise

Date: 2026-09-05  
Status: accepted

## Context

Three P0 gaps remained in the daily guidance loop:

1. before the first eligible SRS card, review minutes were redistributed into explanation or production instead of preserving retrieval;
2. missed-day recovery did not visibly grant a grace day, and the evidence streak reset on a single gap;
3. encouragement was authored independently across surfaces and could fall back to generic applause instead of naming observable learning behavior.

## Decision

### `pre-srs-retrieval-warmup-v1`

- Every ordinary post-diagnostic session keeps its allocated retrieval minutes.
- When `buildDueReviewQueue` has no eligible card, the review block becomes an interactive three-item warm-up built deterministically from the current target lesson.
- The learner sees a German-first instruction, an Arabic cue, delayed German reveal, and honest “remembered / repeat” choices.
- Completing the warm-up stores only the date-scoped mission block. It does not create an SRS card, exercise correctness, mastery, or retention evidence.
- A true absolute beginner's first zero-exposure session remains check-in → lesson → reflection. After reaching the vocabulary stage or recording an attempt, returning zero-path sessions add the warm-up without diagnosis or independent writing pressure.

### `weekly-grace-v1`

- The weekly plan marks the most recent missed study day as one explicit `grace` day.
- A grace day creates no study evidence and no recovery debt. Additional missed days still use the existing one-slot bounded recovery policy.
- Evidence continuity may bridge one missing calendar day only when actual study exists on both sides. Today remains open and never consumes grace before the day ends.
- Reports expose real studied-day count, calendar span, grace date, and policy version rather than pretending the grace day was studied.

### `behavioral-praise-v1`

- One central dictionary owns messages for session completion, warm-up completion, initial/delayed review, writing revision, speaking self-review, exam submission, and return after grace.
- Today, Review, Writing, Speaking, and exam submission surfaces call that dictionary.
- Tests reject generic applause words and require every message to name an observable action such as retrieving before reveal, revising, listening back, submitting, or returning.

## Consequences

- P0-38, P0-266, and P0-267 now have product paths plus unit and production-browser acceptance evidence.
- The three policies remain local-only and zero-cost.
- Grace protects continuity, not evidence: it cannot raise mastery, skill scores, or completion.
- Behavioral praise describes what happened but does not certify quality, CEFR level, pronunciation, or official exam performance.
