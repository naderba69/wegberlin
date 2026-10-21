# ADR-155: Complete-levels roadmap, ceilings for the whole roadmap, and the first B1 batch

- Status: accepted, 2026-10-21 (v264)
- Owner instruction: «لا يوجد هنالك حدود اريد مستويات متكاملة» (there are no limits; I want complete levels), given after the v263 report asked whether to stay under the curriculum ceiling. Standing instruction: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Ceilings: raised once, sized for the whole roadmap below. The gates stay, the 15% reserve stays.
- Evidence tier: agent-authored content, checked by measured gates, an independent WiktionaryDE check of every new noun and a full recount from the SHA-pinned Goethe PDFs. Not an independent German review, and not a signature.
- Follows: ADR-139 to ADR-154 (Goethe alignment), IDEA 407, `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. After v263 the full recount from the official Goethe-Zertifikat B1 word list (edition 2016_02, SHA-pinned) left 289 headwords absent from every lesson and 144 first taught in B2. A1 stood at 669/670, A2 at 1136/1136 (carried over, not re-parsed with the repaired parser).
2. The exam area holds Goethe-Zertifikat B2 and telc Deutsch B2 simulations only. There is no exam-format practice for A1, A2 or B1.
3. The curriculum gate (`scripts/audit-media-pack-budgets.mjs`) had 5,028 B left under its safety ceiling of 1,343,000, the JavaScript gate (`scripts/audit-js-budgets.mjs`) 31,399 B under 2,205,000. One B1 word costs about 68 B in each. The remaining B1 words alone need about 30 KB in each gate.
4. The owner answered that there are no limits and that he wants complete levels. Earlier he had already said the ceiling did not matter to him because he always uses the app online («لا يهم السقف ساستعمله اونلاين دائما», ADR-149).

## Decision

### 1. Ceiling policy

The owner removed the budget as a constraint, not the measurement. The gates keep failing the build when content grows past a recorded ceiling. Instead of a small step per batch, the hard limits are raised once, for the whole roadmap, with the 15% reserve kept:

| Gate | Hard limit before → after | Safety ceiling before → after | Room after v263 |
|---|---|---|---|
| Curriculum source gzip | 1,580,000 → 1,680,000 | 1,343,000 → 1,428,000 | about 90 KB |
| JavaScript total gzip | 2,594,118 → 2,700,000 | 2,205,000 → 2,295,000 | about 121 KB |

The single-chunk limit (750,000, safety 637,500), the audio limit and the pack limits are unchanged. Estimate for the roadmap: B1 words about 30 KB in each gate, B2 themes about 15 KB, three mock-exam sets about 25 KB. If a later phase needs more, the next ADR records the step under the same answer.

### 2. Roadmap ("complete levels")

Ordered by benefit to the learner and by how verifiable the target is:

| Phase | Content | Measure of done |
|---|---|---|
| R1 | B1: the 289 absent headwords (minus clear non-standard or regional ones), in themed batches, each lesson gaining a matching e9 | absent list near zero; every addition source-checked |
| R2 | B1: the 144 headwords first taught in B2, moved forward into a B1 lesson | firstAppearsLater B2 near zero |
| R3 | A2: re-parse with the repaired parser (the A2 PDF copy is not mirrored; source to be found) and close any hidden gaps | A2 recounted, not carried over |
| R4 | Goethe-format practice sets for A1, A2 and B1 (original texts; structure from the official model sets: A1 Hören/Lesen/Schreiben/Sprechen, A2 4 parts each in Lesen and Hören, B1 Lesen 5 parts, Hören 4, Schreiben 3, Sprechen 3) | one complete set per level |
| R5 | B2: themes of the Prüfungsziele § 4.3 without a lesson | each theme has taught vocabulary |

### 3. First batch (v264): 102 absent B1 words in four lessons

| Lesson | Theme | Words | New noun anchors |
|---|---|---|---|
| b1-08 Mietprobleme | household and repairs | 26 | 19 |
| b1-11 Mobilität | travel and transport | 27 | 24 |
| b1-19 Missverständnisse | feelings and relationships | 25 | 3 |
| b1-20 Ratschläge | body and health | 24 | 20 |

- Every word is appended as a vocabulary phrase and a review card with a German example sentence (appended only, so no stored ID moves). Five pairs carry both forms on one card (der Pfleger / die Pflegerin, der Raucher / die Raucherin, der Nichtraucher / die Nichtraucherin, der Passagier / die Passagierin, der Steward / die Stewardess), so the 102 cards cover 107 list headwords.
- All four lessons already had an e8, so each gets a second matching exercise `<lesson>-e9` with five pairs. The right side of each pair is the card gloss, and the explanation quotes the card examples verbatim, without case terms. Each e9 is aligned to the same objective as the lesson's e8.
- Seeds are appended to the ends of the existing b1-08 and b1-20 lines (ADR-142) and b1-11 and b1-19 lines (ADR-150) in `goetheCoreNounSeeds`. Because these lessons already carry older scopes, the new scope `ADR-155-goethe-b1-themes-6-noun-anchor` is keyed by lesson and lemma (`GOETHE_B1_THEMES_6_KEYS`), and the older exports exclude the new keys, so the committed CSVs of ADR-142 and ADR-150 stay exact.
- The adjectival noun der Kranke is anchored with the oblique form „Kranken“ (den Kranken, dem Kranken, die Kranken), which is exact for the definite article.
- **Deferred:** das Herz. Its accusative is „das Herz“ but its dative „dem Herzen“, and the seed format has one oblique form for both. A wrong form is worse than a missing word; it comes back when the seed supports a separate dative.
- Example sentences were written for adults living in Germany or preparing to go there (Visum, Konsulat, Wohnsitz beim Bürgeramt, Tourismus on Djerba). Factual statements were kept checkable: 112 is the emergency number, Berlin has almost four million inhabitants, the registration of a new address happens at the Bürgeramt.

### 4. Checks of the batch

- Before writing: every headword was matched against the B1 absent list (102 of 102 found), against every phrase and card head in all 96 lessons (no duplicate) and against every existing noun anchor (none).
- Every new noun was checked for gender, plural and oblique form against german_nouns 1.2.5 (WiktionaryDE). Result: 66 of 66 `confirmed-wiktionary`, saved in `reports/lexical-review-packet/source-verification-goethe-b1-themes-6-nouns-2026-10-21.csv`.
- Recount of A1 and B1 from the SHA-pinned PDFs (8860f7f0… for B1, 45fb648b… for A1): B1 appears in the lessons 2390 → 2497 of 2823 (88.5%), taught explicitly 1931 → 2038 (72.2%), absent from every lesson 289 → 182. The difference is exactly 107 headwords, the number the batch covers. A1 unchanged at 669/670.
- `tests/unit/goethe-b1-themes-6-vocabulary.test.ts` pins the words, the e9 exercises, the anchors, the scope keys, the CSV and the removal from the absent list.

## Consequences

- 182 absent B1 headwords and 144 B2-first headwords remain for R1 and R2.
- The exercise count rises by four (one e9 per lesson). The governed-record, answer-row and human-review counts rise with it; the docs and the handoff verifier are re-pinned from the regenerated reports.
- The measured results of the gates are recorded in the section below.

## Measured results

- Curriculum source gzip 1,346,098 B (+8,126; 81,902 B left under 1,428,000). JavaScript 131 chunks, 2,182,712 B (+9,111; 112,288 B left under 2,295,000). About 80 B and 89 B per word.
- Offline manifest `f083941dd7ba`: full 6,595,227 gzip (a1 2,959,060 · a2 3,081,942 · b1 3,171,363 · b2 4,584,557). Pack generation v264.
- Unit tests 1771/1771 in 259 files; build EXIT=0, contrast 323 pages / 0 failures.
- Exercises 747 → 751, governed records 3,347 → 3,351, noun anchors 2,051 → 2,117, search entries 4,727 → 4,829, similarity pairs 5,612,925, human-review rows 5,009. Lexical inventory: nouns 6,007 (covered 2,234, context 3,684), verbs 1,402 (context 1,267), pending stays 89.
- Caught by the audit before saving: the gloss „يخاطب بـdu“ glued an Arabic letter to a Latin word and became „يخاطب بصيغة du“ (phrase, card, e9); the ADR-142 and ADR-150 tests would have counted the new anchors as theirs and now exclude the ADR-155 keys. A re-read of all 102 examples after the first build replaced „Für den schnellen Zug muss man einen Zuschlag bezahlen.“ (no longer true for German trains) by „Nachts verlangen manche Taxis einen Zuschlag.“ in the card and the e9 explanation, and „Die Pille nimmt man am besten mit viel Wasser.“ (readable as the contraceptive pill) by „Diese Pillen nimmt man am besten nach dem Essen.“; the gates were re-run on the corrected content.
- Gates: GATES_PENDING
