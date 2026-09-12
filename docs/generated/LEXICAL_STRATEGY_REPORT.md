# Lexical Strategy and Module Recycling Audit

Generated: 2026-09-08  
Version: `lexical-strategy-audit-v1`  
Content SHA-256: `b2914929be2c03852ade73a29cad90b872dd350fe97f76881d87aeeaa12e28e8`

## Result

`PASS` — 32 authored word families with 128 linked members, 32 register examples, 24 bounded Arabic-learner confusion records, and 30/30 deterministic module-review plans passed strict validation.

| Level | Word families | Register examples | Confusion records |
|---|---:|---:|---:|
| A1 | 8 | 8 | 6 |
| A2 | 8 | 8 | 6 |
| B1 | 8 | 8 | 6 |
| B2 | 8 | 8 | 6 |
| **Total** | **32** | **32** | **24** |

## Register taxonomy

| Register | Examples |
|---|---:|
| formal | 8 |
| neutral | 8 |
| colloquial | 8 |
| professional | 8 |

Formal, neutral, colloquial, and professional are context functions, not a quality ladder. Every colloquial example carries an explicit relationship/regional boundary. Professional wording is not automatically formal.

## Module recycling

Every module review contains exactly ten unique questions. A1.1 stays at 0% because no prior material exists; later A1 modules use 20%, A2/B1 use 30%, and B2 uses 40%. Every non-baseline plan contains both vocabulary retrieval and grammar retrieval from an earlier module.

| Module | Current | Recycled | Recycled ratio | Recycled kinds |
|---|---:|---:|---:|---|
| A1.1 | 10 | 0 | 0% | first-module-baseline |
| A1.2 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.3 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.4 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.5 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.6 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.7 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A1.8 | 8 | 2 | 20% | vocabulary-retrieval + grammar-retrieval |
| A2.1 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.2 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.3 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.4 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.5 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.6 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.7 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| A2.8 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.1 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.2 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.3 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.4 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.5 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.6 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.7 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B1.8 | 7 | 3 | 30% | vocabulary-retrieval + grammar-retrieval |
| B2.1 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |
| B2.2 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |
| B2.3 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |
| B2.4 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |
| B2.5 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |
| B2.6 | 6 | 4 | 40% | vocabulary-retrieval + grammar-retrieval |

Boundary: `review-composition-ratio-no-automatic-mastery-or-cefr`. The ratio composes review questions; it is not itself mastery, CEFR evidence, or a reason to mark a lesson complete.

## Arabic-learner boundary

Confusion-source counts: arabic-transfer=6 · english-mediation=17 · french-mediation=1 · near-german-form=0. Every record has `notUniversal: true`: Arabic transfer and English/French mediation are possible risk sources, never a diagnosis of every Arabic speaker.

Registry boundary: `authored-navigation-support-no-automatic-derivation-register-rule-or-arabic-speaker-diagnosis`.

## Build gates

- strict Zod rejects unknown fields and incomplete records;
- every internal lesson reference exists at the same level;
- exactly 8 families, 8 register examples, and 6 confusion records exist per level;
- each level owns two examples for each of the four register categories;
- every colloquial example explains regional/relationship variability;
- all 30 module plans own ten unique questions and the exact versioned ratio;
- recycled sources must precede the current module and include vocabulary plus grammar;
- learner-visible registry copy may not leak internal lesson IDs.
