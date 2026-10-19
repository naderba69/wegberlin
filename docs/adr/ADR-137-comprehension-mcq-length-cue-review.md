# ADR-137: No reading or listening key is recognisable by length alone

- Status: accepted, 2026-10-19 (v245)
- Evidence tier: agent content edit, checked by measured gates. Not an independent German review, and not a signature.
- Owner delegation: «نفّذ ما يفيد المتعلم والصحيح».

## Context

IDEA 397 / P1-397 asked for the "longest option is the key" cue to be removed from the 1,250 lesson multiple-choice items. Earlier batches (v138–v149) brought the global share from 55.2% to under the 40% ceiling, and the gate stopped there. The v245 measurement was 475 items (38.0%) in which the key is the unique longest option.

A global percentage hides what matters to a learner. A key that is longer by one or two characters is not a usable cue. A key that is 20 characters and 30% longer than every distractor can be picked without reading the text. Counted that way (key − next option ≥ 5 characters **and** key ≥ 1.15 × next option), 354 items carried a visible cue:

| Kind | Items | Visible cue before |
|---|---|---|
| Reading questions | 288 | 115 |
| Listening questions | 288 | 96 |
| Mini-test | 480 | 88 |
| Exercises | 194 | 55 |

Reading and listening questions are the comprehension items: if their key can be found by length, they measure test-wiseness instead of understanding.

## Decision

1. **All 211 reading and listening items with a visible cue were rewritten** (229 option edits):
   - In most items one distractor was lengthened. The longer distractor stays clearly false against the text, and where possible it is a plausible trap taken from the text (another time, another person, the step that came later). For example a1-17-lq2 «Sie gehen ins Konzert.» (the declined Friday plan) or a1-18-lq2 «Etwa 14 Grad» (today's value, not tomorrow's).
   - In 17 items the key itself was shortened where it said more than the question asked (for example b2-10-lq1, b2-09-lq2, a2-12-lq3). None of these keys was quoted in its `explanationAr`.
   - Every distractor quoted or listed in an `explanationAr` was left as it was or lengthened in a way that keeps the explanation true (for example a2-21-lq2 «Nur gelesene Seiten und neue Wörter», a2-03-lq3 kept «Sie schreiben ein Buch.» because the explanation names it).
   - One draft key used «auflösen», a word no earlier surface explained; the ADR-135 gate caught it and the key was reworded with «umformulieren».
2. **Measured result** (`reports/lesson-quality-audit.json`):
   - Visible cue: reading 115 → 0, listening 96 → 0, mini 88, exercise 55.
   - Key is the unique longest: 38.0% → 27.6% (475 → 345 items).
   - Key is the unique shortest: 63 items, unchanged (no edit made a key the shortest).
   - Answer positions are unchanged: A 319 / B 302 / C 305 / D 324.
   - No duplicate options; explanation-quote audit 0 misquotes, 30 invented contrast examples (unchanged); content-similarity audit 0 issues.
3. **Gates**:
   - `scripts/generate-lesson-quality-audit.ts` reports `multipleChoice.visibleLengthCue` per kind with the item list, and fails if any kind exceeds `visibleLengthCueByKindMax` = reading 0, listening 0, mini 88, exercise 55.
   - `longestOptionCuePctMax` is ratcheted from 40 to 28.
   - `tests/unit/mcq-option-parallelism.test.ts` adds a test that no reading or listening question in any lesson has a visible length cue.
4. **Lexical inventory**: the new distractor words are contextual candidates only. Nouns 4,965 → 4,984 and verb pairs 1,288 → 1,303 candidates; covered (1,503 / 134) and pendingHuman (89 / 1) are unchanged. The unit test and the handoff verifier are updated with these counts.
5. **Budget**: curriculum gzip 1,273,128 → 1,274,372 of the 1,275,000 ceiling. The ceiling was not raised.

## Not covered

- **Mini-test (88) and exercise (55) items** keep their visible cue for now, ratcheted at the measured count. Most of their distractors are short, ill-formed German fragments («Tomaten ich.», «Wo Mittwoch du?»). Lengthening them would cost bytes that the curriculum budget no longer has (628 B of headroom left), and shortening the keys would often remove the grammar point being tested. Fixing them honestly needs either a review that rewrites the distractor sets as complete but wrong sentences, or an owner decision on the curriculum ceiling.
- The distractors are agent-written German. An independent German review of the 229 changed options remains desirable. Reviewer cells stay empty; no names are written.
- No item in the P0/P1/P2 audits changes state because of this ADR; P1-397 was already `implemented` and receives the new measurement.
