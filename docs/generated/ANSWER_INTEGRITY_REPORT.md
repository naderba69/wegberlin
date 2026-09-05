# Unified Answer Integrity and Leakage Report

Generated: 2026-09-04  
Version: `academic-governance-v1`  
Content SHA-256: `a96d975c85c3ac11f312f515edd8e5ed0eebf4d9fda1e0a4a9b341d0c6344b4d`

## Result

`PASS` — every one of **2584 closed-answer items** is linked to its answer and evidence reference. **348 productive tasks** are separately recorded as no-single-answer or model-after-commit contracts.

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
| lesson-controlled | 588 |
| lesson-listening | 252 |
| lesson-mini-test | 420 |
| lesson-reading | 252 |
| library-listening | 160 |
| library-reading | 160 |
| **Total** | **2584** |

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
