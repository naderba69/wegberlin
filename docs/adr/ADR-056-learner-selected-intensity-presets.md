# ADR-056 — Learner-selected light, balanced, and intensive planning presets

- Status: accepted
- Date: 2026-09-10
- Scope: P2-57

## Decision

`learner-selected-intensity-presets-v1` adds three explicit planning preferences:

- Light: the current contract/profile base capped at 20 minutes, never raised from a 10-minute base;
- Balanced: exactly the latest learning-contract daily minutes, falling back to profile minutes;
- Intensive: exactly one step higher in the existing 10/20/30/45/60/90 budget ladder, capped at 90.

Balanced is the default. Intensive can never activate automatically; the learner must select it in Settings. The selected preview states both base and resulting minutes. The preference feeds Today and unconfigured future weekly days.

## Safety precedence

A real daily check-in overrides the preset. Low energy, a previous `lighter` focus, “less time,” “too hard,” and automatic load-reduction acceptance may still lower the current session. No preset deletes completed blocks, alters a learning contract, or changes correctness/mastery.

The root preference is strict-Zod validated, defaulted for old schema-v3 state, migrated with old state, selected by newest snapshot during Merge, included in DWNB, and represented in the explainable plan-change timeline after explicit selection.

## Consequence

P2-57 closes with named, usable, durable intensity choices while preserving learner control and the existing bounded session system.

## Evidence

- `src/core/coach/intensity-presets.ts`
- `src/components/planning-preferences-control.tsx`
- `src/core/coach/session-signals.ts`
- `src/core/coach/weekly-plan.ts`
- `src/core/coach/plan-change-timeline.ts`
- `src/types/learning.ts`
- `src/core/portability/schema.ts`
- `src/core/portability/merge.ts`
- `tests/unit/intensity-presets.test.ts`
