# Unified Answer Integrity and Leakage Report

Definition date: 2026-09-05 (audit spec, not the run date; the content fingerprint below is authoritative)  
Version: `academic-governance-v1`  
Content SHA-256: `a4e0b0a20d8f58032b5b186a2eb4aa7c07bf9eed34d396ab2d350fdaabad59ec`

## Result

`PASS` — every one of **2805 closed-answer items** is linked to its answer and evidence reference. **384 productive tasks** are separately recorded as no-single-answer or model-after-commit contracts.

```text
Unapproved direct prompt leaks: 0
Explicit type-aware exemptions: 3
Missing answer/evidence links: 0
Duplicate audit IDs: 0
```

| Scope | Closed-answer items |
|---|---:|
| diagnostic | 32 |
| exam | 720 |
| lesson-controlled | 677 |
| lesson-listening | 288 |
| lesson-mini-test | 480 |
| lesson-reading | 288 |
| library-listening | 160 |
| library-reading | 160 |
| **Total** | **2805** |

## Visibility policies

- `authorized-option-bank`: options are intentionally visible; the keyed choice must not be repeated as an unapproved answer in the stem.
- `hidden-target`: fill/correction target remains hidden until commitment.
- `authorized-token-bank`: word-order tokens are intentionally visible, but the final sequence is not presented as a solved sentence.
- `authorized-pair-bank`: both columns are intentionally visible for matching; the relationship is what is assessed.
- Productive writing/speaking/mediation has no fabricated single correct answer. Models/comparisons marked `model-after-commit` are delayed.

## Explicit reviewed exemptions

| Item | Detected repeated surface | Why this is not an answer-key leak |
|---|---|---|
| `a1-01-m4` | guten abend | A greeting can be answered by repeating the same greeting; the prompt is a communicative stimulus, not a displayed answ… |
| `a2-16-e4` | die stadt eröffnet einen park | The neutral first clause is intentionally retained while the learner removes the following unsupported opinion; this is… |
| `diag-a-a1-vocabulary` | guten morgen | Repeating Guten Morgen is an authentic response to the greeting used as the diagnostic stimulus. |

The complete item-by-item question → answer → evidence registry is stored in `reports/academic-content-audit.json`. Evidence excerpts chosen from long texts are deterministic navigation aids and do not replace human semantic review.
