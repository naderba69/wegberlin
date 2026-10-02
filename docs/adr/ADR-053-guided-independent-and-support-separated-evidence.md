# ADR-053 — Guided, independent, and pre-commit-support evidence separation

- Status: accepted
- Date: 2026-09-10
- Scope: P2-70, P2-287

## Decision

`guided-independent-support-separation-v1` derives a process comparison from existing local lesson attempts and support events. The authored registry classifies controlled exercises as `guided` and reading, listening, and Mini-Test items as `transfer`. Only the latest attempt for each lesson/item pair enters the comparison.

Support is attributed narrowly. An attempt becomes `assisted` only when a direct support event for the same item exists before the attempt and has `afterCommit=false`. A translation, transcript, or model opened after commitment does not retroactively contaminate the answer. Help on another item also does not spread to unrelated evidence.

Progress displays six factual buckets: all guided, all transfer, all independent, all assisted, transfer-independent, and transfer-assisted. Each contains attempted/correct/accuracy, and a bounded recommendation requests a fresh independent transfer sample when supported transfer dominates. The derived rows include attempt IDs, item IDs, modes, correctness, and support event IDs, but never copy the learner answer.

## Boundaries

- This is a closed-answer process comparison, not a cognitive diagnosis.
- Productive writing and speaking are excluded because the platform cannot assign valid automated language-quality success.
- Separation changes neither correctness nor mastery and does not punish support use.
- Missing support events mean “no recorded direct pre-commit support,” not proof that the learner used no outside help.

## Consequences

P2-70 closes because guided and independent-transfer results are distinct. P2-287 closes because direct pre-commit-assisted performance is separately counted and post-commit support cannot contaminate it.

## Evidence

- `src/core/evidence/assistance-separation.ts`
- `src/core/evidence/report.ts`
- `src/app/progress/page.tsx`
- `tests/unit/assistance-separation.test.ts`
- `tests/e2e/critical-flows.spec.ts`
