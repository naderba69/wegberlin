# Run log — accepted-answer hygiene (v157, 2026-09-23)

## Why this batch happened

P1-398's ceiling reads "productive exercises that accept exactly one string ≤ 25%". That figure had been
**50.9% (197/387)** since v134. A probe written before touching anything showed the number itself was
wrong, and that the wrongness ran in the flattering direction.

## What was measured, in order

```text
1) probe (read-only)          productive 387 · multi-variant listings 190
                             all variants collapse to one normalized form ....... 141 exercises
                             at least one unreachable variant .................. 146 exercises
                             unreachable entries ............................... 150
2) dry-run purge              acceptedAnswers arrays 387 · shrunk 146 · no-op entries removed 150 · files touched 30
3) --write purge              applied: same counts; verified after: fakeMulti 0 · padded 0 · deadEntries 0
4) lesson:quality (--write)   single-string productive items 50.9% -> 87.34%
                              unreachable accepted variants 0 (new gate)
5) lexical counters           unchanged: 4,874 nouns / 1,381 covered / 89 pending-human / 3,404 context-only
                              1,257 frames / 134 covered / 4 unclassified / 1,119 not-target
6) content:audit              root objects 4,345 · answers 2,805 closed + 384 productive · 0 failures
```

The lexical counters did not move because the gap engine already keys on its own normalized surface: a
duplicate answer string added no candidate.

## Why the removal is grade-neutral (argument, not assumption)

`evaluateExercise` → `compareAccepted` compares `normalizeGermanText(typed)` against
`normalizeGermanText(variant)`. `normalizeGermanText` lowercases with `de-DE` and strips `.!?،,:;„“"'`.
A variant that normalizes onto another listed variant therefore has an identical acceptance set to the
one that stays, so removing it cannot change any verdict. `acceptedAnswers[0]` — read by
`locateErrorSpan` and `answerShape` — is always the form kept.

Locked by `tests/unit/accepted-answer-hygiene.test.ts` (6 tests), including a test that types the dropped
punctuation variants and asserts they still pass, and that `heisst` still fails against `heißt`.

## Artifacts

| Path | Role |
|---|---|
| `src/core/content-validation/accepted-answer-hygiene.ts` | counting unit + policy (`accepted-answer-hygiene-v1`) |
| `scripts/purge-noop-accepted-variants.ts` | the removal tool (dry-run default, refuses to empty an array) |
| `scripts/generate-accepted-answer-hygiene-audit.ts` | standalone audit (`--check` default, `--write` to regenerate) |
| `reports/accepted-answer-hygiene-audit.json` | machine report + content SHA-256 |
| `docs/generated/ACCEPTED_ANSWER_HYGIENE_REPORT.md` | readable report |
| `tests/unit/accepted-answer-hygiene.test.ts` | unit + tree-level guard |
| `docs/adr/ADR-084-accepted-answer-breadth-hygiene.md` | the decision and what was rejected |

## What this batch does not claim

No human review of the 338 single-string exercises, no widening of the grader, no green gate:
`lesson:quality:audit` still exits 1 with `87.3% (max 25%)` and `median explanation length 27 (min 60)`.
P1-398 stays `not-implemented`.
