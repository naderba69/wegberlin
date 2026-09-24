# ADR-031 — Confidence-aware error intervention and confirmed-error SRS

- Status: Accepted
- Date: 2026-09-07
- Policies: `error-pattern-classification-v1`, `confirmed-error-srs-v1`
- Closes: P1-77, P1-78, P1-79, P1-80

## Context

The notebook already captured curriculum errors, opened a clinic after three occurrences, required an initial correction plus a delayed successful recall, and retained resolved history. It did not distinguish a one-off slip from a repeated pattern, did not know when a learner was highly confident in a wrong answer, did not route repeated treatment failures back to the teaching source, and did not turn a genuinely confirmed repair into a personal review card.

## Decision

### Optional pre-check confidence

Every controlled exercise and lesson reading/listening/Mini-Test item offers an optional German-first confidence choice before `Prüfen`:

```text
Unsicher
Ziemlich sicher
Sehr sicher
```

The selected `low | medium | high` value is stored on the immutable exercise attempt. A wrong high-confidence answer increments `highConfidenceWrongCount`; it never changes whether the answer is correct.

### Pattern signal

`error-pattern-classification-v1` derives one transparent planning label:

- `possible-slip`: one occurrence, no high-confidence wrong answer, no failed repair.
- `emerging-pattern`: two occurrences or one failed repair.
- `misconception-risk`: three occurrences, any high-confidence wrong answer, or two failed repairs.

“Misconception risk” is a prioritization signal, not a cognitive diagnosis. The notebook sorts active errors by high-confidence, classification, failed repair, recurrence, and recency. Progress exposes high-confidence error risk and routes the next action to it after existing due-review/due-retest safeguards.

### Prerequisite return

A wrong remediation answer increments `failedRepairCount` without incrementing the original occurrence or recording success. After two failures, the notebook links to the source lesson and sets its Rule stage (`stageIndex = 4`) before navigation. The route uses the captured `sourceLessonId` and `sourceExerciseId`; it does not guess an unrelated previous lesson.

### Confirmed personal SRS

`confirmed-error-srs-v1` creates a personal card only when the existing two-stage repair contract has set both `resolved=true` and `confirmedAt`. Equivalent normalized `wrong → correct` pairs produce one deterministic card, using the lexicographically stable source error ID.

The review queue includes that card even if no general lesson-card set is eligible. Review events are scoped as `personal-error-remediation`. Initial and delayed grades remain auditable and scheduled by SM-2, but `masteryDelta` is always zero and these cards are excluded from lesson retention counts. This prevents a repaired duplicate from inflating lesson mastery.

## Portability

Attempt confidence, source IDs, classification policy, high-confidence count, failed-repair count/time, and review evidence scope are optional schema-v3 fields for backward compatibility. DWNB preserves them. Merge keeps monotonic counters and the strongest classification while retaining the latest event content.

## Automated acceptance

Unit tests cover all classification thresholds, high-confidence capture, stable error upsert, two-failure prerequisite routing, delayed-confirmation eligibility, normalized card deduplication, queue inclusion, zero-mastery initial/delayed review, retention exclusion, Merge, old schema records, and DWNB. Desktop and mobile Playwright exercise the complete route from a high-confidence wrong answer through two failed repairs, Rule return, initial and delayed successful correction, personal SRS appearance, and a zero-mastery review event.

## Boundaries

Confidence is self-report, not calibration. Repetition and failed repair do not prove a durable misconception. The source Rule stage is a deterministic teaching return, not an adaptive diagnosis. Personal error cards support practice but cannot by themselves prove CEFR level, official exam readiness, or permanent retention.
