# ADR-018 — Meaning and semantic role before case form

Date: 2026-09-05  
Status: accepted; independent linguistic review deferred to final project review

## Context

Many lessons already explained case through meaning, but no global contract proved that all explicit Nominativ/Akkusativ/Dativ/Genitiv teaching signals entered practice through semantic role before article, pronoun, or adjective endings. A learner could therefore experience individual form-focused exercises as isolated morphology even when nearby prose was sound.

## Decision

Adopt `meaning-first-case-v1` and render one German-first panel before theory in every identified case-teaching lesson:

```text
Bedeutung verstehen → Rolle bestimmen → Form prüfen
```

Each contract must contain:

- a semantic question that does not name a case, article, pronoun, or ending;
- at least two role choices;
- the governed/target cases;
- a later explicit form rule;
- valid lesson-owned theory, controlled-practice, and Mini-Test IDs;
- the fixed sequence `meaning → role → form`.

The registry currently owns 19 lessons across A1–B2:

```text
A1: 6
A2: 4
B1: 4
B2: 3
```

It maps 23 theory blocks, 57 controlled exercises, and 44 Mini-Test items. An independent detector finds 19 theory, 28 controlled, and 20 assessment objects that explicitly name a German case; every discovered ID belongs to a contract.

`case:audit` runs during `prebuild` and checks generated JSON/Markdown reports for drift. It fails on an unowned explicit case signal, an unknown cross-reference, a missing teaching/practice/assessment layer, a duplicated lesson/ID, form terminology in the semantic-first question, or a changed sequence.

## Consequences and boundary

P0-112 is closed structurally and in the learner-facing sequence. Automation proves coverage, order, and references; it does not certify that every Arabic explanation is the best possible pedagogical wording. Per the product owner's instruction, independent German/Arabic and physical manual review remains deferred to the final whole-project review and is not falsely counted here.
