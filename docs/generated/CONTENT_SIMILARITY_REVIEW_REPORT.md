# Internal Similarity and Independent Review-State Audit

Generated: 2026-09-07  
Version: `content-similarity-review-audit-v1`  
Content SHA-256: `6a9b6293819065a45ccfc2d47b7efd8f7fad0e55cb510c62bb74e9fd461d07ef`

## Result

`PASS` — 3328 closed/productive content objects were compared across 5,536,128 deterministic pairs. Unexempt internal near-duplicates: **0**.

- Suspicious pairs above threshold: 10
- Same-context teach→practice→assessment exemptions: 10
- Explicit independently reviewed exemptions: 0
- External reference corpora compared (lawful basis recorded, ADR-119): 1
- Copyright clearance: `pending-authorized-corpus-and-independent-review`

## Separate per-object review states

| Dimension | Objects | Automated pass / human pending | Independently reviewed |
|---|---:|---:|---:|
| german | 3328 | 3328 | 0 |
| arabic | 3328 | 3328 | 0 |
| cefr | 3328 | 3328 | 0 |
| copyright | 3328 | 3328 | 0 |

Every object has separate `german`, `arabic`, `cefr`, and `copyright` state objects in the machine report. An automated structural pass is never rendered as independent review.

## Similarity pairs retained for audit

| Left | Right | Score | Status | Reason |
|---|---|---:|---|---|
| `telc-b2-reading-01-q1` | `telc-b2-reading-01-q2` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q1` | `telc-b2-reading-01-q3` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q1` | `telc-b2-reading-01-q4` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q1` | `telc-b2-reading-01-q5` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q2` | `telc-b2-reading-01-q3` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q2` | `telc-b2-reading-01-q4` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q2` | `telc-b2-reading-01-q5` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q3` | `telc-b2-reading-01-q4` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q3` | `telc-b2-reading-01-q5` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |
| `telc-b2-reading-01-q4` | `telc-b2-reading-01-q5` | 0.841 | exempt-same-context | same authored context: deliberate teach→practice→assessment recycling |

## Boundaries

Deterministic normalized token/bigram similarity scans the internal project corpus only. It is a lexical-semantic proxy, not embedding equivalence, plagiarism detection, copyright clearance, or comparison with Menschen/Hueber/official exam source text.

P1-293 closes only when the complete internal corpus has zero unexempt near-duplicate issues. P1-295 tracks four independent states per content object even when human review is pending. P1-92 is implemented by the external-reference-comparison-v1 tool and its recorded run on lawful public Menschen samples (0 matches, ADR-119); that covers sample pages only and is not copyright clearance, which stays pending a full-book comparison and an independent rights review.
