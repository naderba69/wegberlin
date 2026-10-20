# ADR-142: Teach the missing Goethe-Zertifikat B1 food and perception vocabulary inside existing B1 lessons

- Status: accepted, 2026-10-20 (v251)
- Owner instruction: «واصل» after v250, under the standing delegation «نفّذ ما يفيد المتعلم والصحيح». The owner had approved the JavaScript ceiling of ADR-141 for "the A2 words, then the missing B1 themes (food, perception), then the first mock exams". No ceiling was raised for this batch.
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-139 (A1), ADR-141 (A2), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

Two of the fourteen official Goethe B1 themes had no lesson at all: food (Verpflegung) and perception/movement (Wahrnehmung/Motorik). The B1 word list headwords for them (Mahlzeit, Ernährung, satt, hungrig, lecker, roh, Mehl, Gewürz, stinken, feucht, spüren, blind, taub, rennen, springen, klettern …) were absent from every lesson. Overall the B1 lessons showed 1,857 of the 2,830 B1 headwords (65.6%) and taught at least 1,386 (49.0%).

After v250 the curriculum budget had 7,044 B left under its 1,309,000 B ceiling, and the JavaScript total had 69,413 B left under 2,205,000. A full B1 completion (about 900 headwords) does not fit the curriculum ceiling. This batch therefore takes only the two absent themes, sized to stay under the ceiling with a margin.

## Decision

1. **No new lessons, no budget change.** 72 words are added to the five existing B1 lessons whose topic fits:
   - b1-10 (consumption): food shopping — Nahrungsmittel, Bio-Produkte, haltbar, Tüte, Schachtel, Sonderangebot, Mehl, Honig, Marmelade, Sahne, Essig, Gewürz, Karotte, Aprikose, Pflaume, Pilz, Müsli.
   - b1-12 (an initiative): a shared neighbourhood meal — Mahlzeit, zubereiten, Buffet, Nachspeise, Dessert, Geschmack, lecker, genießen, Schüssel, Kanne, roh, Imbiss.
   - b1-20 (advice): food, body and movement — achten, Ernährung, Diät, Vitamin, satt, hungrig, durstig, abnehmen, zunehmen, Gymnastik, Muskel, Knie, Schulter, schwitzen, rennen, springen, klettern, frieren.
   - b1-08 (rental problems): what one senses in a flat — stinken, feucht, heizen, Kälte, Hitze, Fleck, Staub, Schmutz, spüren, klopfen, merkwürdig, Steckdose.
   - b1-23 (technology): operating devices and access for blind and deaf users — blind, taub, Taste, Tastatur, Lautsprecher, Fernbedienung, Bedienungsanleitung, einschalten, drehen, schieben, Kabel, Batterie, aufladen.
2. **Taught before practised.** As in ADR-139/141, every word gets a vocabulary-stage phrase and a review card with an example sentence (appended, so no stored card ID moves), and each of the five lessons gets one matching exercise `b1-NN-e8`, aligned in `objective-item-alignment.ts`. Where natural, the examples reuse the lesson's own grammar: statt … zu / ohne … zu (b1-10), falls (b1-12), Konjunktiv II advice (b1-20), relative clauses (b1-08), da-compounds (b1-23).
3. **Grammar records.** 43 article-marked nouns get lesson-scoped anchors (`b1GoetheCoreNounEntries`), numbered after every existing entry of their lesson, in the shared `goethe-core-noun-anchors.csv` worksheet with their own scope `ADR-142-goethe-b1-core-noun-anchor`; outside the original P0-98 scope (1,297).
4. **No new pending review item.** A first draft taught «auf etwas achten» as a phrase, which the lexical gap audit counts as a new verb-preposition target waiting for review. The phrase is taught as «achten» with the Arabic note that auf follows; the example keeps «auf den Schlaf achten». Pending stays 89 nouns + 1 verb.
5. **Source check.** `scripts/export-question-support-nouns.ts … goethe-b1-core` and `scripts/verify-question-support-nouns.py` (new optional date argument): **43 of 43 confirmed** against WiktionaryDE via `german_nouns` 1.2.5. Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-core-nouns-2026-10-20.csv`, guarded by `tests/unit/goethe-b1-core-vocabulary.test.ts`.

## Results

| Measure | Before | After |
|---|---|---|
| B1 headwords appearing up to B1 | 1,857 / 2,830 (65.6%) | **1,931 (68.2%)** |
| B1 headwords taught explicitly up to B1 | ≥ 1,386 (49.0%) | **≥ 1,461 (51.6%)** |
| B1 headwords absent from every lesson | 813 | **740** |
| Noun anchors | 1,690 | 1,733 |
| Lesson exercises | 723 | 728 |
| Governed content records | 3,323 | 3,328 |
| Client JS total (gzip, ceiling 2,205,000) | 2,135,587 | **2,140,111** (+4,524) |
| Curriculum gzip (ceiling 1,309,000) | 1,301,956 | **1,306,762** (+4,806) |
| Unit tests | 1,685 in 244 files | **1,689 in 245 files** |
| Browser audit / E2E | 642/0 · 67/67 ×2 | **642/0 · 67/67 ×2** |

Counts come from `scripts/compare-goethe-wordlists.ts --from-report` (ADR-141), so "taught explicitly" is a lower bound.

## Consequences

- The five lessons have 30–36 vocabulary phrases instead of 18; the other 19 B1 lessons are unchanged.
- The curriculum ceiling now has 2,238 B left. The remaining B1 gaps (services, travel, health, work: about 900 headwords), the B2 themes and the A1/A2/B1 mock exams need a new owner decision on the curriculum ceiling.
