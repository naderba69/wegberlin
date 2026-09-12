# ADR-044 — Calculated module recycling and bounded lexical-strategy registries

- Status: accepted
- Date: 2026-09-08
- Policies: `module-recycling-ratio-v1`, `lexical-strategy-registry-v1`, `lexical-strategy-audit-v1`
- Closes product cycles: P1-91, P1-101, P1-102, P1-103

## Context

SM-2 and module reviews could surface old material, but there was no auditable ratio per module. The course contained many derivations, register distinctions, and Arabic-learning contrasts, but no standalone browsable contracts. Automatically stemming German, calling every related word a derivation, presenting “formal” as always better, or diagnosing every Arabic speaker would be inaccurate.

## Decision

### Module recycling

Every module review is built from exactly ten unique questions. A1.1 has an explicit 0% baseline because no previously taught material exists. Later A1 reviews contain 20% recycled questions, A2 and B1 contain 30%, and B2 contains 40%. Every non-baseline plan contains both:

- vocabulary retrieval generated from an actually published earlier phrase; and
- a grammar/structure Mini-Test item from an earlier module.

The remaining questions are selected round-robin from the current module. Source lessons must precede the reviewed module. The UI identifies old/current provenance and displays the calculated ratio. It renders the German prompt before Arabic support.

Boundary: `review-composition-ratio-no-automatic-mastery-or-cefr`. The ratio itself never marks a lesson complete and never creates mastery; actual submitted review answers retain the existing review behavior.

### Word families

A strict authored registry contains 32 families, eight per level, with 128 explicit members. Each member names its word class and relation as `base`, `derivation`, `compound`, or `semantic-relative`. This prevents a semantic neighbor from being advertised as morphology and prevents automatic gender/plural invention. Each family includes a German example, Arabic meaning, relation note, caution, and one or more same-level lesson references.

### Register taxonomy

A strict registry contains 32 examples, eight per level and exactly two per level for each category:

- `formal`;
- `neutral`;
- `colloquial`;
- `professional`.

Register is a contextual function, not a quality ladder. Professional is not automatically formal. Every colloquial example must state relationship/regional variability and cannot be presented as a rule for all German speakers.

### Confusions for Arabic learners

A strict registry contains 24 records, six per level. Records distinguish Arabic transfer from English or French mediation and pair the risky association with a German contrast and a retrieval strategy. Every record stores `notUniversal: true`; the UI explicitly says that a possible confusion is not a diagnosis of every Arabic-speaking learner.

### Browsing surface

The local bilingual Search page includes a German-first strategy explorer with level filters and four tabs: word families, register, confusions, and module recycling. Internal content IDs remain provenance only and are not rendered to learners.

## Build governance

`lexical:strategy:audit` runs during `prebuild`, emits a machine report and a readable report, and fails on stale artifacts or:

- unknown strict-Zod fields;
- missing/wrong-level lesson references;
- count or level-balance drift;
- missing colloquial boundaries;
- non-unique registry IDs;
- an invalid module ratio, count, source order, or vocabulary/grammar mix;
- learner-visible internal lesson IDs.

Current audited baseline: 32 families / 128 members / 32 register examples / 24 confusion records / 30 module plans / 0 issues.

## Rejected alternatives

- Automatic stemming or inferred German derivations.
- Invented article, plural, or word-family membership.
- Treating semantically related forms as direct derivations.
- Labeling colloquial German as one nationwide fixed standard.
- Treating professional language as necessarily more formal or better.
- Saying that all Arabic speakers make the listed errors.
- Counting random repeated questions and calling that calculated recycling.
- Giving the recycling percentage direct mastery or CEFR meaning.

## Verification

Unit tests cover strict rejection, exact A1–B2 balance, all four register categories, colloquial boundaries, `notUniversal`, all 30 review plans, 0/20/30/40 ratios, prior-module ownership, vocabulary+grammar mixing, first-module honesty, German-first order, explorer rendering, and absence of learner-visible internal item IDs. Desktop and Mobile Playwright cover all four explorer tabs and a real A2 review with 3 recycled plus 7 current questions.
