# ADR-025 — Derived learner journey state machine

Date: 2026-09-07  
Status: accepted

## Context

The product is Guidance-first, but a learner also needs to understand where they are in the overall journey. P1-5 asks for explicit transitions between diagnosis, foundation, growth, consolidation, and exam readiness. A manually editable phase would drift from evidence or reward browsing.

## Decision

Adopt `journey-state-machine-v1` as a derived, non-durable view over the existing local evidence:

```text
Orientierung → Grundlage → Aufbau → Festigung → Prüfungsreife
```

- Orientation ends after onboarding plus either an experienced-learner diagnostic decision or an explicit absolute-beginner start.
- Foundation covers A1 and A2 lesson completion plus their internal evidence gates.
- Growth covers B1 and B2 curriculum completion, with the B1 gate still enforced.
- Consolidation begins after all 84 lessons and remains until the internal B2 evidence gate.
- Exam readiness begins only after that B2 gate and remains provider-scoped to Goethe or telc module evidence.

Every state exposes a percentage, reason, next transition condition, and an explicit boundary that this is not an official CEFR judgment or exam guarantee. The five-step strip appears on `/today`; the current phase has `aria-current="step"`, and the phase percentage uses a semantic progressbar.

## Acceptance

Unit tests cover all five states, the absolute-beginner bypass, evidence-derived percentages, lesson/gate transitions, and provider-scoped exam readiness. Desktop and mobile Playwright verify that an absolute beginner sees five phases, starts in foundation, and receives the non-official evidence boundary.

The phase is never persisted directly and cannot be advanced by `/path` browsing. This closes P1-5 without creating a second source of truth.