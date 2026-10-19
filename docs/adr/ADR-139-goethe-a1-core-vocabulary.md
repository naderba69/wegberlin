# ADR-139: Teach the missing Goethe-Zertifikat A1 core vocabulary inside the A1 lessons

- Status: accepted, 2026-10-19 (v248)
- Owner decision: the owner answered «نعم» when asked whether to raise the curriculum ceiling so the A1 gaps can be filled.
- Owner delegation for the content itself: «نفّذ ما يفيد المتعلم والصحيح».
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: IDEA 407 and the v247 Goethe reference alignment (`docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`).

## Context

The v247 alignment compared the 96 lessons with the official Goethe word lists. The A1 lessons used only 450 of the 670 A1 headwords (67%) and taught 345 (52%) explicitly. 98 A1 words were absent from every lesson. Examples: Flughafen, Taxi, Kleidung, Briefmarke, verheiratet, most colours, Herbst, Frühling, Norden, Osten, Westen, hundert and tausend. Another 121 A1 words first appeared in A2 or later, such as wissen, nichts, Koffer, Haltestelle, Zeitung and Brief.

The Goethe A1 theme «Dienstleistungen» (post, bank, police) was not covered at all.

The curriculum source budget had 2,678 B left under its 1,275,000 B safety ceiling. Raising that ceiling is an owner decision.

## Decision

1. **Budget.** The curriculum hard limit goes from 1,500,000 to **1,540,000** B gzip. With the unchanged mandatory 15% reserve, the safety ceiling goes from 1,275,000 to **1,309,000** B.
   - No other limit changes. The JS budget of 2,125,000 is not relaxed, and neither are the audio or pack limits.
   - The raise is the smallest one that fits the A1 package with a working margin. Later packages (A2, B1 and B2 themes, A1/A2/B1 mock exams) need a new owner decision if they do not fit.
2. **No new lessons.** The words are added to the existing A1 lesson whose theme they belong to. A new lesson would break the 24-lessons-per-level structure, the lesson audio, the offline packs and the end-to-end flows. Examples:
   - a1-02: the four directions.
   - a1-03: hundert, tausend, Million, Postleitzahl, Vorwahl.
   - a1-04: verheiratet, ledig, family.
   - a1-09: the twelve months.
   - a1-11: the eight colours and Kleidung.
   - a1-13: Herd, Kühlschrank.
   - a1-18: the four seasons.
   - a1-19: Taxi, Haltestelle, einsteigen and aussteigen.
   - a1-21: airport and hotel words.
   - a1-24: post, bank and police.
3. **Taught before practised.** Every word is placed on three surfaces:
   - **A vocabulary-stage phrase** (`{de, ar}`): 235 new phrases. The learner therefore meets the word in the lesson itself and runs it through the existing four-skill cycle.
   - **A review card** with a short example sentence: 245 new cards, appended so no stored card ID moves.
   - **One matching exercise** (German word to Arabic meaning) per lesson: 23 exercises with IDs `a1-NN-e8`, appended after every existing exercise. Each one is aligned in `objective-item-alignment.ts`. Where the words do not serve an authored objective, the exercise is marked explicitly unaligned (`[]`) instead of being forced onto an objective.
4. **Grammar records.** Every article-marked noun on the new phrases and cards gets a lesson-scoped noun anchor with gender, plural and case forms: **144 anchors**, `a1GoetheCoreNounEntries`.
   - They are numbered after every existing entry of their lesson, so no stored ID moves.
   - They keep the original P0-98 review scope (1,297 anchors) unchanged and get their own unsigned worksheet, `reports/lexical-review-packet/goethe-core-noun-anchors.csv`.
   - A1 `pendingHuman` stays **0**.
5. **Source check.** All 144 anchors were compared with WiktionaryDE through `german_nouns` 1.2.5, using the extended `scripts/verify-question-support-nouns.py`.
   - The verifier now checks a Pluraletantum by its plural paradigm.
   - **144 of 144 are confirmed**: 142 by gender and case forms, and 2 plural-only nouns (Leute, Pommes).
   - The evidence is in `reports/lexical-review-packet/source-verification-goethe-core-nouns-2026-10-19.csv`. It is guarded by `tests/unit/goethe-a1-core-vocabulary.test.ts`.
6. **Content rules kept.**
   - Months use the pan-Arab MSA names only (يناير … ديسمبر), as `arabic-msa-clarity` requires.
   - No Arabic prefix is glued to a Latin word.
   - The explanations name no case term outside a case contract.
   - Pork-based Schinken and alcoholic drinks are glossed honestly («لحم مقدد (غالبًا من الخنزير)») and practised with refusals (Ich esse keinen Schinken / Ich trinke kein Bier).
   - The listening transcripts, and so the lesson audio, are untouched.

## Results

| Measure | Before | After |
|---|---|---|
| A1 headwords appearing in A1 lessons | 450 / 670 (67.2%) | **662 / 670 (98.8%)** |
| A1 headwords taught explicitly in A1 | 345 (51.5%) | **555 (82.8%)** |
| A1 headwords missing at A1 | 220 | **8** |
| A1 Wortgruppen covered | 59.1% | **72.5%** |
| A2 headwords appearing up to A2 (cumulative) | 70.6% | 78.3% |
| B1 headwords appearing up to B1 (cumulative) | 56.0% | 59.5% |
| Noun anchors | 1,402 | 1,546 |
| Lesson exercises | 677 | 700 |
| Governed content records | 3,277 | 3,300 |
| Curriculum source gzip | 1,272,322 | **1,287,127** of 1,309,000 |

Of the 8 words still counted as missing, 5 are taught in a form the matcher does not link to the stem: alle, jeden Tag, das Lieblingsessen, meistens, Viele Grüße. Two are genuinely absent:

- `tot`: gestorben is taught for the form context.
- `der Bogen`: the exam answer sheet.

## Consequences

- Each A1 lesson now has 18–30 vocabulary phrases instead of 12–16. That matches the roughly 650-word A1 load spread over 24 lessons, but makes the vocabulary stage longer.
- Pinned counters moved with the content and were regenerated, not hand-edited:
  - governed records 3,300 and similarity pairs 5,443,350
  - answer-integrity rows 2,828
  - search entries 4,027
  - schema root objects 4,594
  - lexical target-gap counters: +144 covered anchors, +13 noun and +6 verb-pair contextual candidates
- `tests/unit/goethe-a1-core-vocabulary.test.ts` guards several things:
  - the A1 word groups: months, seasons, directions, colours, hundert, tausend, Million
  - that every anchor is taught on its lesson's surfaces
  - the source evidence for each anchor
  - teach-before-practise in the 23 matching exercises
  - the budget decision
- Open after this ADR (IDEA 407): the missing A2, B1 and B2 themes and the A1/A2/B1 mock exams.
