# ADR-122 — The 54 objective gaps are closed in the content, not by re-tagging (P2-400)

- Status: accepted — 2026-10-18 (v231)
- Evidence tier: agent-authored content and alignment under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **It is not an independent human German review.** P2-400 becomes `implemented` because its acceptance criterion — every objective is linked to an item that teaches it, one that practises it and one that assesses it, derived from authored item-level links — is now met and pinned by a test. Independent reviewer agreement on individual links stays a separate, human question.

## Context

ADR-121 (v230) replaced lesson-scoped structural coverage with authored objective↔item links. It found 335/389 objectives covered and left a pinned ledger of 54 gaps:

- All 54 had no Mini-Test item.
- 5 also had no teaching point: a1-15 O4, a1-24 O4, a2-04 O4, a2-10 O4 and b1-12 O4.
- 1 also had no practice item: a1-14 O2.

The usual pattern was five Mini-Test items on the grammar objective and none on the communicative objective.

Re-tagging existing items to the missing objectives would have made the numbers green without changing what learners do. That option was rejected.

## Decision

1. **54 Mini-Test items rewritten (IDs kept).** Each replacement item targets exactly one missing objective. The item it replaces was chosen in this order:
   - the 5 deliberately unaligned items (a2-06-m3, a2-14-m5, a2-19-m3, a2-24-m3, b2-15-m3);
   - otherwise, an item whose objective is still assessed by at least one other Mini-Test item in the same lesson.

   No objective lost its last assessment.

   Each new item follows these rules:
   - It has 4 options.
   - The key is never the uniquely longest option.
   - Keys are spread across positions A–D.
   - The prompt does not leak the key.
   - The Arabic explanation quotes the German key, says why each distractor is wrong, and ends with a self-check question (فحص ذاتي).

   Communicative objectives are tested as communicative choices, for example:
   - which note passes on a phone message completely;
   - which sentence states an interest and a limit;
   - which summary does not spoil the ending.

   They are not tested as grammar drills.
2. **5 teaching points added.** The `explanationAr` of an existing theory block was extended for each one:
   - a1-15-t1: pros and cons with aber;
   - a1-24-t1: invented data in practice forms;
   - a2-04-t3: structure of a short note to neighbours;
   - a2-10-t3: justifying a travel decision with weil or deshalb;
   - b1-12-t1: five-sentence project proposal.

   The examples were not touched, so no audio or manifest changed.
3. **1 practice item retargeted.** a1-14-e3 now asks the learner to order the words of a real place question (Wo liegt der Schlüssel). The case-free explanation keeps the meaning-first case audit clean.
4. **Explanation quotes.** Every German «…» quote in the new explanations appears verbatim in the same lesson's German content. Illustrative German that does not appear there is written without quote marks. The quote-exception ledger went from 73 to 70 entries, and no new unreviewed entry was added.

5. **Case-teaching contracts kept honest.** Eight replaced items had been listed as case assessments in `src/data/case-teaching-registry.ts`: a1-12-m5, a1-14-m1, a2-04-m1, a2-07-m2, a2-23-m2, a2-23-m3, b1-08-m1 and b2-04-m3. Their new versions test communicative objectives, not case, so they were removed from `assessmentIds`. Every contract still keeps at least one Mini-Test item that tests case. Assessment references went from 44 to 36, and the case-signal items found in assessments went from 25 to 21.
6. **Parallel options in the parallelised lessons.** In b1-05, b2-07, b2-11 and b2-19 the new items meet the existing option-parallelism rule: the key is neither the unique longest nor the unique shortest option, and option lengths differ by at most 25 characters.

## Result (v231)

- 389/389 objectives have at least one teaching, one practice and one Mini-Test link. 0 gaps.
- `tests/unit/objective-item-alignment.test.ts` pins an empty gap ledger, so any new gap fails.
- 62 unaligned surfaces remain: 61 comprehension-only practice questions and the theory block a2-06-t3. All 5 off-objective Mini-Test items were replaced.
- MCQ cues improved:
  - The longest-option-is-key share went from 39.2% to 38%.
  - Lessons without position D went from 3 to 2.
  - Key positions are now A 319, B 302, C 305, D 324.

## Consequences

- P2-400 → `implemented`. P2 is now 137 implemented, 3 partial (264, 371, 401) and 2 not implemented (359, 360).
- Boundary: the items and links are the agent's work under delegation. A German-teaching reviewer may disagree with individual choices. `src/data/objective-item-alignment.ts` and the lesson module files are the single places to change them, and the tests re-derive coverage.
