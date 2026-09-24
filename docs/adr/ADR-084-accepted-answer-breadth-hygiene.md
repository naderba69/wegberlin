# ADR-084 — Accepted-answer breadth is counted after normalization, and padding is a hard gate (v157, 2026-09-23)

Status: accepted. Extends ADR-078 (explicit accepted variants only) and re-defines the measurement that
P1-398's ceiling reads.

## Context

`P1-398` compares the share of productive exercises that accept exactly one string against a ceiling of
25%. On 2026-09-23 that share read **50.9% (197/387)** and had been reported that way since v134.

A guard was missing, and the missing guard hid a measurement defect, not a content defect. The grader
(`src/core/lesson/evaluate.ts`) normalizes both sides with `normalizeGermanText`, which lowercases
(`de-DE`) and strips `. ! ? , : ; ، „ “ " '`. A second accepted answer such as `"Wie heißt du?"` next to
`"Wie heißt du"` can therefore never be matched separately: the learner cannot type it distinctly, the
grader cannot reward it, and the exercise is **not** broader than before.

Measured on main before the fix:

| Fact | Value |
|---|---:|
| Productive exercises | 387 |
| Exercises listing more than one accepted answer | 190 |
| Exercises whose variants all collapse onto one normalized form | 141 |
| Exercises that list an unreachable variant | 146 |
| Unreachable entries in the tree | 150 |
| Honest single-string share (distinct normalized forms) | 338/387 = 87.3% |

So breadth could be bought with a capital letter or a full stop — and it had been: the published figure
understated the real situation by 36.4 points, and `reports/academic-content-audit.json` printed answers
like `Wie heißt du | Wie heißt du?` as if two forms were accepted.

## Decision

1. **Breadth is counted on distinct normalized forms.** `accepted-answer-hygiene-v1`
   (`src/core/content-validation/accepted-answer-hygiene.ts`) defines the counting unit, and both the
   lesson-quality gate and the standalone audit read it. A listing of `k` variants of which `j` collapse
   counts as `k - j` forms.
2. **Unreachable variants are a hard gate at 0** (`noOpAcceptedVariantsMax: 0`), not a style note. A
   permanently red gate is one people learn to ignore, so the tree was brought to zero in the same
   batch instead of being reported and left.
3. **The 150 unreachable entries were removed** with `scripts/purge-noop-accepted-variants.ts`, which
   keeps the first listed form and refuses any edit that would empty an array. The removal is
   grade-neutral by construction (same normalized key) and the first form is the one
   `locateErrorSpan`/`answerShape` read (`acceptedAnswers[0]`), so error spans and shapes are unchanged.
4. **The honest number is published, not repaired.** After the purge the same metric reads **87.3%**,
   i.e. much further from the 25% ceiling. It stays in the report and in the fail state of
   `lesson:quality:audit`, because a metric that improves when the data is padded is worse than a metric
   that looks bad.

## What was rejected

- **Keeping the padding and only fixing the metric.** Rejected: the data would still claim two accepted
  answers where one exists, and the next author would copy the pattern.
- **Widening the comparator** (folding `ß`/`ss`, ignoring word order) so the share falls. Rejected
  outright by ADR-078 and `tests/unit/content-integrity.test.ts:77-78`; the fix belongs in the data or in
  the definition, never in the grader.
- **Raising the ceiling or re-scoping "productive"** so the gate returns green. Rejected: the ceiling is
  an authoring target, and P1-398 stays `not-implemented` with the honest figure.
- **Exempting the 150 entries by list**, as `scripts/audit-explanation-quotes.ts` does for one reviewed
  quote. Rejected here because the exemption would have to name 146 exercises — that is not a policy.

## Consequences

- `npm run lesson:quality:audit` still exits 1, now with the honest figures: `87.3%` single-string and a
  median explanation length of 27 chars. The third possible note (`unreachable accepted variants`) is
  silent because the count is 0.
- `npm run accepted:answers` (`:write`) joins the `prebuild` chain, so a stale or padded tree fails the
  production build; the generated pair is `reports/accepted-answer-hygiene-audit.json` and
  `docs/generated/ACCEPTED_ANSWER_HYGIENE_REPORT.md`.
- `tests/unit/accepted-answer-hygiene.test.ts` locks the counting rule, the `ß`≠`ss` boundary, the
  grade-neutrality of the purge, and the tree-level invariant (no listed variant is unreachable).
- The lexical counters did **not** move (4,874 nouns / 1,257 frames): the gap engine already keyed on its
  own normalized surface, so removing a duplicate answer string changed no candidate.
- P1-398 remains open. Its evidence now carries the honest basis and the finding that authoring variants
  cannot close the ceiling (`npm run lessons:variant-worklist`: 0 derivable of 197 single-string items).
  Whether the ceiling applies to a single-word blank at all is an author/owner definition decision, and
  the open question is recorded there rather than resolved by moving the threshold.

## Not claimed

A green `accepted:answers` run means "no listed variant is unreachable"; it does not mean the exercises
accept every correct answer a learner might type, that the grader is lenient enough, or that the
exercises were reviewed by a teacher. No human review happened, and P1-398 is not closed.
