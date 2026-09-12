# Lexical Target → Anchor Gap Report

Generated: 2026-09-05  
Version: `lexical-target-gap-v1`  
Content SHA-256: `8ff50e524d4dffb6f8d321742d850196c2019fa92327237d1156c12d2ad2e640`

## Honest result

`REVIEW REQUIRED` — this first machine inventory compares explicit authored lexical-target signals with the current **1044 noun anchors** and **104 verb-preposition-case frames** across **84/84 lessons**. It found **0 noun candidates** and **0 unclassified verb-frame candidates**. It also records **6 explicit structural frame exclusions**, all still pending independent German confirmation before P0-99 can close.

The audit does **not** create grammatical facts. A pending noun row must receive a verified record or independent exclusion. A structural frame exclusion can remove a false-positive detector row from the unclassified queue, but its `authored-review-pending` state remains visible until final review.

| Level | Noun signals | Covered | Pending human | Context only | Verb signals | Covered | Pending human | Context only |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A1 | 532 | 289 | 0 | 243 | 101 | 25 | 0 | 76 |
| A2 | 830 | 291 | 0 | 539 | 190 | 30 | 0 | 160 |
| B1 | 1047 | 324 | 0 | 723 | 259 | 31 | 0 | 228 |
| B2 | 810 | 202 | 0 | 608 | 267 | 18 | 0 | 249 |
| **Total** | **3219** | **1106** | **0** | **2113** | **817** | **104** | **0** | **713** |

## Classification contract

- **covered:** an exact lesson-scoped anchor alias exists. Registry rows are always included, so all 1044 noun records and 104 frame records are auditable.
- **pending-human:** an uncovered candidate appears on a vocabulary phrase, flashcard front, or uppercase reading-glossary lemma.
- **not-target:** either a signal appears only in contextual teaching/assessment surfaces, or a versioned explicit exclusion identifies a false-positive frame detector row. Exclusions retain their reason and pending-independent-review state.
- German sentence-initial capitalization alone is never treated as noun evidence.
- The frame detector records only visible infinitive + preposition evidence. It does not infer a missing case or pretend that every nearby preposition is governed.

Boundary: Target means an existing anchor, an uppercase reading-glossary lemma, or an article-marked noun / infinitive-preposition pair on an authored vocabulary phrase or flashcard front. Theory, texts, mistakes, and task surfaces are scanned as context-only signals. Sentence-initial capitalization alone is never used. Uncovered targets remain pending-human unless an explicit versioned structural exclusion identifies a locative/condition adjunct, separable particle, or purpose clause. Exclusions remain authored-review-pending and do not replace independent German review; the audit never invents gender, plural, governed case, or a lexical record.

## Pending noun decisions (0)

| Stable row | Level | Lesson | Candidate | Target evidence |
|---|---|---|---|---|


## Pending verb/preposition decisions (0)

| Stable row | Level | Lesson | Infinitive candidate | Prep. | Observed case evidence | Target evidence |
|---|---|---|---|---|---|---|
| — | — | — | — | — | No unclassified verb-frame candidates |

## Explicit structural frame exclusions (6)

| Decision | Lesson | Detected pair | Reason | Authored explanation | Review status |
|---|---|---|---|---|---|
| `a1-21-umsteigen-in-frame-exclusion` | `a1-21` | umsteigen + in | `locative-adjunct` | في in Hannover يحدد حرف الجر مكان تبديل القطار؛ ليس حرفًا يحكمه الفعل umsteigen في كل استعمال. | `authored-review-pending` |
| `b1-15-liegen-vor-frame-exclusion` | `b1-15` | liegen + vor | `separable-particle` | vor هنا جزء منفصل من الفعل vorliegen، وليس حرف جر يكوّن إطار liegen + vor. | `authored-review-pending` |
| `b1-22-nachsteuern-bei-frame-exclusion` | `b1-22` | nachsteuern + bei | `condition-adjunct` | bei Bedarf ظرف شرط بمعنى عند الحاجة؛ يمكن حذف الظرف ويبقى الفعل nachsteuern كاملًا. | `authored-review-pending` |
| `b1-23-liegen-vor-frame-exclusion` | `b1-23` | liegen + vor | `separable-particle` | vor في liegen … vor هو بادئة الفعل المنفصل vorliegen، لا حرف جر مستقل. | `authored-review-pending` |
| `b2-01-reichen-aus-frame-exclusion` | `b2-01` | reichen + aus | `separable-particle` | aus جزء الفعل المنفصل ausreichen في Die Daten reichen nicht aus؛ لا يمثل إطار reichen + aus. | `authored-review-pending` |
| `b2-01-reichen-um-frame-exclusion` | `b2-01` | reichen + um | `purpose-clause` | um يفتتح جملة الغاية um … zu ولا تحكمه صيغة ausreichen السابقة. | `authored-review-pending` |

All 6 exclusions remain `authored-review-pending`; zero unclassified rows does not mean independent German review is complete.

The complete covered/pending/context inventory, every source path, matched anchor ID, and exclusion decision are stored under `lexicalTargetGaps` in `reports/academic-content-audit.json`.
