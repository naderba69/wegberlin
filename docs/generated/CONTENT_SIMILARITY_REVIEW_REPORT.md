# Internal Similarity and Independent Review-State Audit

Generated: 2026-09-07  
Version: `content-similarity-review-audit-v1`  
Content SHA-256: `9b0e34489aee98128edb52d24cac2202d08b23f44721e23147570c0a3972fd5b`

## Result

`PASS` — 2932 closed/productive content objects were compared across 4,296,846 deterministic pairs. Unexempt internal near-duplicates: **0**.

- Suspicious pairs above threshold: 10
- Same-context teach→practice→assessment exemptions: 10
- Explicit independently reviewed exemptions: 0
- External authorized reference corpora: 0
- Copyright clearance: `pending-authorized-corpus-and-independent-review`

## Separate per-object review states

| Dimension | Objects | Automated pass / human pending | Independently reviewed |
|---|---:|---:|---:|
| german | 2932 | 2932 | 0 |
| arabic | 2932 | 2932 | 0 |
| cefr | 2932 | 2932 | 0 |
| copyright | 2932 | 2932 | 0 |

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

P1-293 closes only when the complete internal corpus has zero unexempt near-duplicate issues. P1-295 tracks four independent states per content object even when human review is pending. P1-92 remains partial while external authorized comparison and independent copyright review are absent.
