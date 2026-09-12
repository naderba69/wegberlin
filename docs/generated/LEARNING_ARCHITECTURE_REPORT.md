# Grammar Progression and Comprehension Taxonomy Audit

Generated: 2026-09-08  
Version: `learning-architecture-audit-v1`  
Content SHA-256: `8c8cc300bf0376c5c4942cf0b1f09abb850d5eae4f64339a1ede1d3543f4132b`

## Result

`PASS` — 24 canonical grammar nodes with 31 prerequisite edges, 24/24 controlled mappings, 24/24 productive mappings, and 504 item-level reading/listening taxonomy rows passed strict validation.

## Grammar progression

Exactly six canonical rule nodes per A1/A2/B1/B2 are linked to real theory, at least two controlled exercises, and one lesson-owned writing/speaking/mediation task. Every node contains an introduced-now layer, a common limit, deferred complexity, two or more boundaries, and at least one common exception. The prerequisite graph is acyclic and every parent precedes its child.

| Level | Rule | Prerequisites | Controlled | Free production | Boundaries | Exceptions |
|---|---|---:|---:|---|---:|---:|
| A1 | Finites Verb im Präsens | 0 | 2 | speaking | 2 | 1 |
| A1 | Woher, wo und wohin | 1 | 2 | speaking | 2 | 1 |
| A1 | Possessivartikel und Genus | 1 | 2 | writing | 2 | 1 |
| A1 | Trennbare Verben und Satzklammer | 1 | 2 | speaking | 2 | 1 |
| A1 | Modalverb und Infinitiv | 2 | 2 | speaking | 2 | 1 |
| A1 | Wo? mit Dativ | 1 | 2 | mediation | 2 | 1 |
| A2 | Perfekt und Satzklammer | 2 | 2 | writing | 2 | 1 |
| A2 | Als bei einmaligen Vergangenheitsrahmen | 1 | 2 | writing | 2 | 1 |
| A2 | Dativ bei Person und Hilfe | 2 | 2 | speaking | 2 | 1 |
| A2 | Obwohl und Nebensatz | 1 | 2 | speaking | 2 | 1 |
| A2 | Dass-Satz als Inhalt | 1 | 2 | writing | 2 | 1 |
| A2 | Komparativ mit als | 1 | 2 | speaking | 2 | 1 |
| B1 | Plusquamperfekt | 2 | 2 | writing | 2 | 1 |
| B1 | Vorgangspassiv im Präsens | 1 | 2 | speaking | 2 | 1 |
| B1 | Relativpronomen nach Funktion | 2 | 2 | writing | 2 | 1 |
| B1 | Indem als Mittel | 1 | 2 | mediation | 2 | 1 |
| B1 | Statt und ohne zu | 1 | 2 | writing | 2 | 1 |
| B1 | Sollen und angeblich als Distanz | 1 | 2 | mediation | 2 | 1 |
| B2 | Konzessive Argumentation | 1 | 2 | writing | 2 | 1 |
| B2 | Formelle Präpositionalstrukturen | 2 | 2 | writing | 2 | 1 |
| B2 | Korrelation und Kausalität | 1 | 2 | speaking | 2 | 1 |
| B2 | Nominalstil, Aktiv und Passiv | 1 | 2 | mediation | 2 | 1 |
| B2 | Indirekte Rede und Konjunktiv I | 2 | 2 | writing | 2 | 1 |
| B2 | Partizipialattribute | 2 | 2 | mediation | 2 | 1 |

Boundary: `canonical-rule-map-and-semantic-controlled-to-production-links-no-automatic-mastery-or-cefr`. The graph is curriculum navigation, not an official CEFR sequence, and browsing it creates no mastery.

## Comprehension question taxonomy

Every one of 252 reading and 252 listening questions has exactly one function label. The first listening question in all 84 lessons inherits the existing authored gist-stage contract; other rows use explicit semantic signals, with specific fact questions defaulting to detail.

| Level | Total | Gist | Detail | Stance | Inference | Structure | Detail share |
|---|---:|---:|---:|---:|---:|---:|---:|
| A1 | 144 | 24 | 99 | 5 | 15 | 1 | 69% |
| A2 | 144 | 24 | 91 | 4 | 22 | 3 | 63% |
| B1 | 144 | 24 | 89 | 9 | 19 | 3 | 62% |
| B2 | 72 | 12 | 36 | 8 | 13 | 3 | 50% |
| **Total** | **504** | **84** | **315** | **26** | **69** | **10** | — |

Balance gates require all five functions in every level, keep details at or below 72%, and keep gist between 12% and 30%. Labels guide strategy only and never change correctness, score, mastery, or CEFR.

Boundary: `deterministic-item-function-taxonomy-not-independent-human-semantic-review-or-score`. This deterministic item-function audit is not represented as independent human semantic review; final wording/classification review remains part of the whole-project expert round.

## Build gates

- strict Zod rejects unknown or incomplete grammar/taxonomy records;
- lesson/theory/exercise/productive references must resolve exactly;
- every productive prompt must be the actual lesson-owned task;
- prerequisite cycles, forward edges, and missing parents fail;
- all 24 rules must contain progressive limits and explicit exceptions;
- all 504 source questions must be covered once;
- provenance must preserve lesson, level, and reading/listening surface;
- every level must meet the published function-balance envelope.
