# ADR-141: Teach the missing Goethe-Zertifikat A2 vocabulary inside the A2 lessons, with an owner-approved JS ceiling

- Status: accepted, 2026-10-19 (v250)
- Owner decision: asked how to handle the JavaScript ceiling, the owner chose the option «ارفعه 80 KB» (raise it by 80 KB, enough for the A2 words, then the missing B1 themes and the first mock exams; a curriculum-ceiling raise would be asked separately if needed).
- Owner delegation for the content itself: «نفّذ ما يفيد المتعلم والصحيح».
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-139 (A1 package), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

After v248/v249 the A2 lessons used 889 of the 1,136 Goethe A2 headwords up to A2 (78.3%) and taught 715 (62.9%) explicitly. 247 A2 headwords were missing at A2: 184 absent from every lesson (Hose, Hemd, Wald, Fluss, Gewitter, Pizza, Radio, Theater, singen, Tennis …) and 63 first used only in B1 or B2 (Unfall, Vertrag, Zeugnis, damals, hoffen …). The Goethe A2 themes environment, clothing and leisure were not covered.

The content itself fits the curriculum ceiling (1,309,000 B, about 21,900 B left). But the lessons ship inside the client JavaScript, and the JavaScript total had only 3,436 B left under its 2,125,000 B safety ceiling. A v250 experiment showed that moving shared modules into one common chunk saves about 41 KB in total but adds about 100 KB to every page's first load, so the ceiling, not the chunking, was the honest lever. Raising it is an owner decision.

## Decision

1. **Budget.** The JavaScript total hard limit goes from 2,500,000 to **2,594,118** B gzip. With the unchanged mandatory 15% reserve, the total safety ceiling goes from 2,125,000 to **2,205,000** B (+80,000).
   - Unchanged: the 750,000 B single-chunk limit (ceiling 637,500), the curriculum limit (ceiling 1,309,000), audio and pack limits.
   - ADR-049 carries an amendment note; its original numbers stay as history.
2. **No new lessons.** The words are added to the existing A2 lesson whose theme they belong to, as in ADR-139. Examples:
   - a2-04 (neighbours): Brille, Gesicht, Katze, Vogel, Stockwerk, Rentner, sympathisch, drüben.
   - a2-10 (travel planning): Fahrplan, Stadtplan, Hauptstadt, Insel, Strand, Schiff, Schloss, Ermäßigung.
   - a2-11 (accommodation and weather): Landschaft, Wald, Fluss, Zelt, Gewitter, neblig, nass, drinnen.
   - a2-12 (complaints): sich beschweren, Qualität, Hose, eng, Reinigung, Rest.
   - a2-13 (healthy living): Gesundheit, Nudeln, Bohne, Orange, Zitrone, Schokolade, Pizza, Wurst, Rind, Schwein, schädlich.
   - a2-14 (sick note): Grippe, wehtun, Zahn, Krankenkasse, Sprechstunde.
   - a2-16 (news): Sendung, Radio, Fernseher, Zeitschrift, Krimi, Plakat.
   - a2-22 (festivals): the clothing set (Anzug, Hemd, Bluse, Rock, Jeans, Pullover, Mantel, Mütze, Stiefel, Mode, ein Paar Schuhe).
   - a2-23 (engagement): Mannschaft, Sportplatz, Tennis, Basketball, Pferd, Club, singen, Instrument, Klavier, Natur.
   - a2-24 (deciding together): Theater, Festival, Zirkus, Ausstellung, Einkaufszentrum, Kaufhaus, Flohmarkt.
3. **Taught before practised.** Every word is placed on three surfaces:
   - **A vocabulary-stage phrase** (`{de, ar}`): 240 new phrases.
   - **A review card** with a short example sentence: 240 new cards, appended so no stored card ID moves.
   - **One matching exercise** (German word to Arabic meaning) in 23 lessons, IDs `a2-NN-e8`, appended after every existing exercise and aligned in `objective-item-alignment.ts`. a2-20 gets only two words (Stipendium, Wettbewerb) and no exercise.
4. **Grammar records.** Every article-marked noun gets a lesson-scoped anchor with gender, plural and case forms: **144 anchors**, `a2GoetheCoreNounEntries`, numbered after every existing entry of their lesson. They stay outside the original P0-98 scope (1,297), share the `goethe-core-noun-anchors.csv` worksheet with their own scope label `ADR-141-goethe-a2-core-noun-anchor`, and A2 `pendingHuman` stays **0**.
5. **Source check.** All 144 anchors were compared with WiktionaryDE through `german_nouns` 1.2.5 (`scripts/export-question-support-nouns.ts … goethe-a2-core` and `scripts/verify-question-support-nouns.py`): **144 of 144 confirmed** by gender, case forms and plural. Evidence: `reports/lexical-review-packet/source-verification-goethe-a2-core-nouns-2026-10-19.csv`, guarded by `tests/unit/goethe-a2-core-vocabulary.test.ts`.
6. **Content rules kept.**
   - The matching explanations name no case term, so no new case contract is needed (`meaning-first-case` stays at zero gaps).
   - Pork is glossed honestly and practised as a refusal: «Ich esse kein Fleisch vom Schwein», «Ich esse keine Wurst mit Schweinefleisch».
   - No Arabic prefix is glued to a Latin word; listening transcripts, and so the lesson audio, are untouched.
7. **Measurement without the PDFs.** The Goethe PDFs are not reachable from this sandbox. `scripts/compare-goethe-wordlists.ts --from-report` re-checks only the headwords the committed report lists as missing, with the same matcher, and adds the newly present ones to the committed counts. "Taught explicitly" is therefore a lower bound; headword totals, `anywhereInAppAnyLevelPct` and `wortgruppenCoveredPct` are carried over and the report says so in `incremental`.

## Results

| Measure | Before | After |
|---|---|---|
| A2 headwords appearing up to A2 | 889 / 1,136 (78.3%) | **1,130 (99.5%)** |
| A2 headwords taught explicitly up to A2 | 715 (62.9%) | **≥ 955 (84.1%)** |
| A2 headwords missing at A2 | 247 | **6** |
| B1 headwords appearing up to B1 (side effect) | 1,685 / 2,830 (59.5%) | **1,857 (65.6%)** |
| Noun anchors | 1,546 | 1,690 |
| Lesson exercises | 700 | 723 |
| Governed content records | 3,300 | 3,323 |
| Client JS total (gzip, ceiling 2,205,000) | 2,121,564 | **2,135,587** (+14,023) |
| Curriculum gzip (ceiling 1,309,000) | 1,287,127 | **1,301,956** (+14,829) |
| Unit tests | 1,680 in 243 files | **1,685 in 244 files** |

The six still counted as missing are word parts the matcher cannot link (`all`, `Geburts`, `Lieblings`, `dar`, `einzel`) and `tot`, left out on purpose.

## Consequences

- Each A2 lesson now has 20–36 vocabulary phrases instead of 18. The vocabulary stage is longer, in line with the roughly 1,100-word A2 load.
- Pinned counters moved with the content and were regenerated, not hand-edited: governed records 3,323 and similarity pairs 5,519,503, answer-integrity rows 2,851, search entries 4,267, schema root objects 4,738, lexical target gaps (+148 covered, +24 noun and +12 verb-pair contextual candidates, pending unchanged).
- Still open under IDEA 407: the A2 services and senses themes, the weak B1 themes (food, perception), the missing B2 themes, and the A1/A2/B1 mock exams. The new JS ceiling leaves room for some of them; any curriculum-ceiling raise needs a new owner decision.
