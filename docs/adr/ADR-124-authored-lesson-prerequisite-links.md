# ADR-124 — Authored lesson prerequisite links answer «على ماذا يبني الدرس؟»

- Status: accepted — 2026-10-18 (v232)
- Policy ID: `authored-lesson-prerequisite-links-v1`
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent human review.**

## Context

The lesson teaching contract (`lesson-teaching-contract-v1`) asks eight questions of every lesson. Question 2, «على ماذا يبني الدرس؟», was the only soft question with a numbered gap. 73 of 96 lessons had no authored grammar node with a parent in the grammar progression map (24 nodes, P1-114). For those lessons the contract fell back to curriculum order («الاستنتاج من ترتيب المنهج فقط»), which says nothing about *which* earlier explanation the learner needs.

Adding 72 more nodes to the visual map would overload it, and many of these lessons are communicative rather than grammar-centred.

## Decision

1. **A separate, flat registry.** `src/data/lesson-prerequisite-links.ts` maps each of the 72 uncovered lessons to 1–2 earlier theory blocks (136 links in total). Each link has an Arabic reason that names the specific dependency. Examples:
   - a1-19 (transport with mit) → a1-14-t1 (Dativ for fixed places) and a1-10-t1 (Akkusativ endings);
   - b2-21 (Konjunktiv I) → b2-08-t2 (indirect speech in media criticism) and b1-18-t1 (sollen as distance);
   - b1-01 (Präteritum in biographies) → a2-02-t3 (war/hatte) and a2-01-t1 (Perfekt), across the level boundary.
2. **Checked rules** (`validateLessonPrerequisiteLinks`, with tests):
   - the theory block exists and belongs to an earlier lesson in curriculum order;
   - 1–2 links per lesson, with no duplicates;
   - the reason is plain Arabic with no Latin letters, between 40 and 160 characters. Learner-facing Arabic stays free of mixed-script tokens, and the German theory title is rendered separately with `lang="de" dir="ltr"`.
3. **Contract.** `lessonTeachingContract` accepts an authored lesson link as a valid answer (`authored-lesson-link`). Authored grammar nodes with parents still take precedence.
4. **Learner surface.** In the rule stage, `LessonPrerequisitePanel` lists «يبني هذا الدرس على». Each entry shows the earlier block's Arabic and German titles, links to that lesson, and gives the reason. The panel states that this is a teaching pointer, not a mastery condition or a lock. Nothing is gated, and no learner state changes.
5. **Ceiling ratchet.** `lessonsWithoutAuthoredPrerequisiteLink` goes from 73 to **1**. The one remaining lesson is a1-01, the first lesson of the curriculum, which has nothing before it; it keeps its founding grammar node.

## Consequences

- All 96 lessons now answer the eight contract questions with no open gap.
- The grammar progression map is unchanged (24 nodes and 31 relations, P1-114).
- Boundary: each link is a pedagogical judgement made by the agent under delegation. A German-teaching reviewer may prefer other dependencies, and `src/data/lesson-prerequisite-links.ts` is the single place to change them. The validator only enforces structure and direction; it cannot prove that a dependency is the best one.
