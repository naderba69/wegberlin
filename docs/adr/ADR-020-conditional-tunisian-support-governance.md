# ADR-020 — Conditional Tunisian support with explicit review state

Date: 2026-09-05  
Status: accepted for authored implementation; independent Tunisian/MSA review deferred to the final whole-project review

## Context

Onboarding already stored `arabicSupport="tunisian-supported"`, but the choice did not materially change lesson content. P0-373 requires Modern Standard Arabic to remain the reference while offering short optional Tunisian explanations. P0-376 requires differences between MSA/dialect use to be explained only when they can change how the learner understands a German structure.

A global word-for-word translation layer would be noisy and risky. Tunisian usage varies by region, age, and speaker, and a dialect approximation must never be presented as a new German rule or as independently reviewed merely because it passed a schema test.

## Decision

Adopt `tunisian-support-v1` plus the generated `tunisian-support-audit-v1` gate.

Each governed note owns:

- one published A1–B2 lesson and one real theory block;
- a concise MSA bridge;
- a separate short Tunisian approximation;
- the transfer/comprehension risk caused by the difference;
- one German anchor that remains the actual learning target;
- visibility restricted to `tunisian-supported` mode;
- an explicit review state and, only after real independent review, reviewer/date evidence.

The first registry contains 17 notes across 17 lessons:

```text
A1: 6
A2: 5
B1: 4
B2: 2
Total: 17
Contrast categories: 15
```

The panel renders only in the rule stage of a registered lesson when the learner selected Tunisian support. MSA remains the reference. MSA-only and minimal-Arabic modes receive no Tunisian panel. Tunisian fragments use `lang="ar-TN" dir="rtl"`; German anchors keep `lang="de" dir="ltr"`.

## Automated acceptance

`npm run tunisian:audit` runs during `prebuild` and fails when:

- a note or theory reference is duplicated or unknown;
- level ownership is wrong;
- MSA/Tunisian/risk text lacks Arabic script or the two explanation fields duplicate each other;
- a note is visible outside `tunisian-supported`;
- any CEFR level has fewer than two meaningful notes;
- a note claims independent review without reviewer/date evidence;
- a pending note carries contradictory review evidence;
- generated JSON/Markdown artifacts drift.

Unit tests cover conditional selection, rendering, language boundaries, valid references, and honest review status. Production Playwright starts from onboarding, persists the selected mode, enters A1-01, and verifies the Tunisian panel and `ar-TN`/German direction boundaries.

## Consequences and boundary

The option now changes real lesson content and makes high-risk MSA/Tunisian differences explicit without replacing the German target. All 17 notes are currently `authored-review-pending`: automated checks prove structure, conditional delivery, and honest labels, not Tunisian linguistic correctness or representativeness.

P0-373 and P0-376 therefore remain partial until an independent Tunisian/MSA reviewer checks every note, resolves regional wording concerns, and records reviewer/date evidence in the registry. The product owner asked to group that real linguistic review with the final whole-project review.
