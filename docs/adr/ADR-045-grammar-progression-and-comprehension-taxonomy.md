# ADR-045 — Canonical grammar progression, controlled-to-production links, and comprehension taxonomy

- Status: accepted
- Date: 2026-09-08
- Policies: `grammar-progression-map-v1`, `comprehension-question-taxonomy-v1`, `learning-architecture-audit-v1`
- Closes product cycles: P1-113, P1-114, P1-115, P1-125

## Context

Individual lessons already contained explanations, contrasts, exercises, writing, speaking, mediation, and question banks. They did not provide a visible prerequisite graph, a bounded canonical definition of “important rules,” an item-level contract proving controlled-to-free transfer, or a comprehension-function audit. Simply linking every lesson linearly would invent prerequisites; calling every question a “detail” or assigning categories by position would also be misleading.

## Decision

### Canonical grammar scope

The versioned map defines 24 canonical rule nodes, six per A1/A2/B1/B2. This is an explicit high-value scope, not a claim that every sentence in 84 lessons is a prerequisite node. Each node owns:

- a real lesson and theory reference;
- at least two controlled exercise references;
- exactly one real writing, speaking, or mediation task;
- an authored semantic-alignment explanation;
- “introduced now,” “common limit,” and “deferred” layers;
- at least two rule boundaries and one common exception;
- zero or more prerequisites.

The 31 prerequisite edges are acyclic, point only backward, and appear visibly on `/path`. The map displays titles rather than internal IDs. Browsing creates no evidence, mastery, or CEFR decision. The sequence is the course’s teaching architecture, not an official CEFR grammar specification.

### Lesson rule surface

Mapped lessons display `Grenzen und Transfer` in the Rule stage. The panel shows progressive scope, boundaries, exceptions, the controlled-practice count, the actual German-first productive prompt, Arabic support, and the semantic reason the transfer tests the same rule. It does not mark controlled or productive work complete.

### Comprehension taxonomy

Every one of 252 reading and 252 listening questions receives exactly one item-level function label:

- `gist` / Hauptaussage;
- `detail` / Detail;
- `stance` / Haltung;
- `inference` / Schlussfolgern;
- `structure` / Textaufbau.

The first listening question in all 84 lessons inherits the existing three-pass authored gist-stage contract. Other questions use versioned semantic text signals; explicit who/what/where/when facts without a stronger signal default to detail. The audit requires all five functions in every level, detail at or below 72%, and gist between 12% and 30%. The UI now renders the German question before Arabic support and displays the strategy label.

Boundary: labels guide reading/listening strategy and never alter correctness, score, mastery, CEFR, or lesson completion. Deterministic classification is not described as independent human semantic review; expert item review remains part of the final whole-project round.

## Build governance

`learning:architecture:audit` runs in `prebuild`, writes machine/readable reports, and fails on:

- unknown strict-Zod fields;
- missing theory, controlled, or productive references;
- a productive prompt that differs from the lesson-owned task;
- prerequisite cycles, missing parents, or forward edges;
- missing progressive limits, boundaries, or exceptions;
- missing/duplicate question taxonomy rows;
- lesson, level, or surface provenance mismatch;
- a level outside the published function-balance envelope.

Current baseline: 24 grammar nodes / 31 prerequisite edges / 24 controlled mappings / 24 productive mappings / 504 question rows / 0 issues.

## Rejected alternatives

- Treating the previous lesson as a grammatical prerequisite automatically.
- Calling all theory blocks canonical prerequisites.
- Claiming that structural stage co-existence proves semantic transfer.
- Creating a new free-production prompt instead of referencing the real lesson task.
- Forcing a rare category onto a question solely to equalize counts.
- Letting function labels modify question correctness or mastery.
- Describing deterministic classification as human semantic validation.

## Verification

Unit tests cover strict schemas, 24/6-per-level balance, acyclic backward edges, exact lesson/theory/exercise/task references, progressive boundaries, 504 unique question rows, all five functions per level, published balance limits, 84 listening-gist contracts, German-first rendering, and absence of visible exercise IDs in the rule panel. Desktop and Mobile Playwright cover the 24-node map, a real Rule-stage transfer panel, reading/listening taxonomy badges, and German-before-Arabic question order.
