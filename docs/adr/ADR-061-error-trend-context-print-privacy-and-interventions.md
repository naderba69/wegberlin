# ADR-061 — Actual error trend, learner context, print privacy, and intervention chronology

Date: 2026-09-11 — Africa/Tunis

Closes software acceptance for P2-81, P2-82, P2-83, and P2-285.

## Context

The error notebook could classify repeated errors and schedule repair, but it did not show whether the learner's actual error rate changed over time, capture the learner's statement that a known rule fails under time pressure, hide a sensitive error from print, or explain the sequence of interventions and results.

## Decision

### Actual weekly trend

`actual-attempt-weekly-error-trend-v1` calculates eight Monday–Sunday rows from dated `exerciseAttempts` only:

- all attempts in the week;
- incorrect attempts;
- distinct incorrect lesson/item pairs;
- incorrect-attempt rate with its real denominator.

The line is called decreasing only when the latest observed rate is at least five percentage points below the first observed rate. It can also be stable, increasing, or insufficient-data. No empty week receives a fabricated zero, and the direction is not a forecast or causal learning-effect claim.

### Learner-declared time pressure

`learner-declared-time-pressure-error-v1` lets the learner attach exactly one bounded tag, `knows-rule-under-time-pressure`, to an error. This is learner planning context, not a psychological/cognitive diagnosis, correctness event, or mastery evidence.

### Print-only privacy

`learner-sensitive-error-print-redaction-v1` stores `sensitiveInPrint` and a metadata timestamp. The error remains visible in the app and survives IndexedDB, DWNB, and Merge. Print CSS hides the exact error card and all timeline events tied to it; it does not delete or silently alter the local source of truth.

### Derived intervention timeline

`derived-error-intervention-timeline-v1` derives chronology from existing factual records:

- last error appearance;
- failed repair;
- successful first repair;
- scheduled delayed review;
- confirmed delayed repair;
- error-clinic attempt and result;
- personal remediation-card review.

Timeline rows never copy the wrong answer, correction, explanation, clinic answer, or free reflection. Chronological succession is explicitly not presented as proof that an intervention caused a result.

## Merge and portability

The newer `learnerMetadataUpdatedAt` wins concurrent tag/print choices while existing error occurrence, classification, repair, and resolution merge rules stay unchanged. Strict Zod requires a metadata timestamp whenever the tag or print flag is active. DWNB round-trip preserves the complete local record.

## Acceptance

- Empty history has an honest insufficient-data trend.
- Real dated attempts generate rate/denominator/unique-item rows.
- Learner tags never resolve an error or change occurrences/mastery.
- Sensitive errors and their timeline events disappear only under print media.
- Timeline output contains no answer/correction/explanation text.
- Unit tests cover trend, chronology, metadata, schema, Merge, DWNB, and print contracts.
- Desktop and mobile Playwright cover the real capture→repair→review→tag→print flow.

## Boundaries

This is software evidence only. It does not validate a psychological model, treatment effect, causal intervention, or human interpretation of a learner's error history. Printed aggregate trend rates contain no specific answer text, while exact marked records are removed.
