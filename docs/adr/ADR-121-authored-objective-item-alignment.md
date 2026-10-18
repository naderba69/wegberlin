# ADR-121 — Authored objective↔item alignment replaces lesson-scoped structural coverage (P2-400)

- Status: accepted — 2026-10-18 (v230)
- Evidence tier: agent semantic alignment under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **It is not an independent human German review.** P2-400 stays `partial` until the gaps this alignment uncovered are closed in the content.

## Context

`buildObjectiveCoverageReport()` linked every objective to every surface of its lesson. Teaching meant entry, vocabulary, discovery and all theory blocks. Practice meant all exercises, all reading and listening questions, writing, speaking, mediation and the error clinic. Assessment meant all Mini-Test items. So all 389 objectives were "covered" by construction, and every row said `pending-independent-item-alignment`. The report proved that the surfaces existed. It did not prove that any of them taught, practised or tested a given objective.

## Decision

1. `src/data/objective-item-alignment.ts` holds one entry per lesson (96). Each entry maps every surface to the 1-based objective indices it serves:
   - entry
   - vocabulary (`phrases`)
   - optional discovery
   - each theory block, exercise, reading question and listening question
   - writing, speaking and mediation
   - each Mini-Test item

   `[]` marks a surface as deliberately unaligned: comprehension-only, or off-objective. Each link was decided by reading the objective together with the item text (prompt, key, options and theory examples). For suspected teaching gaps, the agent also read the full vocabulary list, the discovery examples and the theory explanations.
2. `objective-coverage.ts` now derives `taughtIn`, `practicedIn` and `assessedIn` per objective from these links. Rows carry:
   - `mappingBasis: "authored-item-alignment"`
   - `semanticReviewStatus: "agent-authored-under-owner-delegation"`
   - `missing[]`
   
   The error clinic is no longer counted as practice for every objective, because it is not an authored item.
3. `ok` means **alignment integrity**: every required surface is accounted for, every index is valid, and no key is unknown. A gap is a learning finding, not an integrity failure. Gaps are therefore listed (`gaps`, `gapsByDimension`, `unalignedSurfaces`) and not hidden. `tests/unit/objective-item-alignment.test.ts` pins the exact gap ledger as a ratchet: closing a gap must shrink the ledger in the same change, and a new gap fails the test.

## Result (v230)

- 3,266 objective links. 335/389 objectives have at least one teaching, one practice and one Mini-Test link.
- **54 gaps:**
  - All 54 are not assessed by the Mini-Test.
  - 5 of them are also not taught: a1-15 O4 (pros and cons), a1-24 O4 (protecting data), a2-04 O4, a2-10 O4 and b1-12 O4 (presenting a project proposal).
  - 1 is also not practised: a1-14 O2.
- By level: A1 11, A2 21, B1 13, B2 9.
- The typical pattern: five Mini-Test items concentrate on the grammar objective, and the communicative objective (usually O1 or O4) gets no item.
- **67 unaligned surfaces:**
  - 61 practice items, mostly reading and listening comprehension questions.
  - 5 Mini-Test items that test content outside the lesson's objectives: a2-06-m3, a2-14-m5, a2-19-m3, a2-24-m3 and b2-15-m3.
  - 1 theory block: a2-06-t3.

## Consequences

- The coverage report no longer claims 389/389. It shows 335/389 with a gap ledger. `docs/generated/OBJECTIVE_COVERAGE_REPORT.md` and `reports/academic-content-audit.json` (`gapLedger`, `unalignedSurfaces`) are the evidence.
- Next content step: retarget off-objective or duplicate Mini-Test items to unassessed objectives, keeping their IDs, and add the five missing teaching points. Then flip P2-400 to `implemented`. (Done in v231: ADR-122.)
- Boundary: the alignment is the agent's judgement under delegation. A German-teaching reviewer may disagree with individual links. The data file is the single place to change them, and the tests re-derive everything.
