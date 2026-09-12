# ADR-055 — Explainable local plan-change timeline

- Status: accepted
- Date: 2026-09-10
- Scope: P2-48

## Decision

`explainable-plan-change-timeline-v1` derives one compact Today timeline from existing durable planning records rather than creating a second mutable log. It includes only decisions that can explain a plan change:

- a check-in whose available time differs from the profile or whose low energy caps load;
- immediate less-time/too-easy/too-hard/load-suggestion adaptations;
- an equivalent mission alternative selected by the learner;
- an accepted or declined automatic load-reduction offer;
- the learner's structured next-focus choice;
- learning-contract revisions after the first contract.

Each row has a stable derived ID, date/time, simple Arabic title/reason, optional before/after minutes, and `derived-planning-history-no-answer-reflection-text-mastery-or-penalty`. Rows are newest-first and the UI collapses the most recent twelve by default.

## Privacy and honesty

The timeline never copies exercise answers, free reflection text, API data, or correctness. It does not infer laziness, ability, or motivation. No entry is manufactured when there is no qualifying change, and selecting an alternative does not mark the original complete. Deleting or replacing the underlying planning state naturally removes the derived row.

## Consequence

P2-48 closes because the learner can see why the plan changed in simple Arabic across all existing plan-change sources without a second source of truth.

## Evidence

- `src/core/coach/plan-change-timeline.ts`
- `src/components/plan-change-timeline.tsx`
- `src/components/coach-dashboard.tsx`
- `tests/unit/plan-change-timeline.test.ts`
- `tests/e2e/critical-flows.spec.ts`
