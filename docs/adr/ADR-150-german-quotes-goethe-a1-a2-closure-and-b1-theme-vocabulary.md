# ADR-150: German quotation marks, Goethe A1/A2 closure, and the missing Goethe B1 theme vocabulary

- Status: accepted, 2026-10-21 (v259)
- Owner instruction: «واصل» after the v258 report, under the standing instruction «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق» and the delegation «نفّذ ما يفيد المتعلم والصحيح». No ceiling was raised in this batch.
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-139 (A1), ADR-141 (A2), ADR-142 (B1 food and perception), ADR-149 (which left the German «…» in b2-module6 reading and listening texts as the next item), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. **Quotation marks.** ADR-149 replaced «…» with „…“ in the audited German fields but stated that the reading and listening texts of b2-module6 and other German strings still used the Arabic guillemets. German typography uses „…“; «…» is reserved for Arabic text in this app.
2. **A1/A2.** The Goethe comparison reported A1 662/670 and A2 1130/1136. A check of the eight A1 and six A2 "missing" headwords showed that most were measurement false negatives: inflected or bound forms (all-/jed-/Lieblings-/Geburts-/Einzel-, da(r)- compounds) and an umlaut plural the lemmatizer did not know (Grüße → Gruß). Three were real gaps: der Bogen (form), tot and die meisten.
3. **B1.** After ADR-142 the B1 lessons showed 1,931 of the 2,830 B1 headwords. Six B1 lessons had a matching theme but lacked its everyday headwords: family and life stages (b1-01), accidents and emergencies (b1-03), work and applications (b1-06), nature and weather (b1-07), traffic (b1-11), bank and post (b1-19). Words such as Kindheit, Rente, Notruf, Notaufnahme, Pflaster, Lohn, Gewerkschaft, Küste, Nebel, Ernte, Stau, Vorfahrt, Strafzettel, Bargeld and Briefumschlag were absent from every lesson.
4. After v258 the curriculum had 16,153 B left under its 1,326,000 B ceiling and the JavaScript total 59,573 B under 2,205,000. The batch was sized to stay under both.

## Decision

1. **German quotes.** 35 German fields with 50 «…» pairs became „…“ (b2-14/16/17 texts, 28 nursing-layer fields, one `labelDe` in the language-history enrichment). Two Arabic explanations and two authored reading-evidence locators that quote those texts verbatim were updated with them, so every quote still occurs exactly once in its text. The permanent guard `tests/unit/german-quote-typography-guard.test.ts` scans German fields in the source, the built lesson data, and the `quotes` arrays of `reading-evidence-locators.ts`; it was tried with planted errors. The nursing layer is covered by the source scan, not imported, because only declared importers may load it.
2. **A1/A2 measurement.** `scripts/compare-goethe-wordlists.ts` gained `BOUND_FORMS` (documented in its JSDoc) for all-/jed- endings, Lieblings-/Geburts-/Einzel- compounds and dar- compounds, and `Grüße Gruß` joined the irregular plurals of `german-lemma-dictionary.ts`. The three real gaps are now taught in the A1 reading texts: „einen Bogen … den Bogen ausfüllen“ (a1-03), „Ihr Großvater ist leider schon tot.“ (a1-04), „Die meisten Leute im Kurs …“ (a1-19).
3. **B1 theme batch: 124 words, no new lessons.** Each word gets a vocabulary-stage phrase and a review card with a full example sentence (appended, so no stored card ID moves), and each of the six lessons gets one matching exercise `b1-NN-e8` (five pairs), aligned in `objective-item-alignment.ts`. Where natural the examples reuse the lesson's grammar.
   - b1-01 (21, Präteritum): family and life stages, including Kindheit, Heimweh, Rente, Abschied, Ehepaar, Enkel/Enkelin, Cousin/Cousine, Neffe, Schwiegermutter, geschieden, pensioniert.
   - b1-03 (21, nachdem): accidents and emergencies, including Verletzung, Notruf (112 is free across the EU), Notaufnahme, Pflaster, verschreiben, Krankenpfleger/-in.
   - b1-06 (20): work, including Vorstellungsgespräch, Arbeitserlaubnis, halbtags, Lohn, Gewerkschaft, Lehre, Aushilfe, Praktikant/-in.
   - b1-07 (21, während, je … desto): nature and weather, including Tal, Küste, Nebel, Ernte, Vorort, Ufer, mild.
   - b1-11 (22, dadurch dass): traffic, including Stau, tanken, Vorfahrt, überholen, Strafzettel, Einbahnstraße, Fahrbahn, Fußgänger/-in.
   - b1-19 (19, double meanings): bank and post, including Geld abheben / den Hörer abheben, Bargeld, Briefumschlag, umsonst (free / in vain) next to gratis, Geldautomat, Mobilbox.
4. **Grammar records.** 117 article-marked nouns get lesson-scoped anchors in `lexical-grammar-b1.ts`: 106 from the batch, the 10 feminine forms of the slash phrases («der Enkel / die Enkelin» …) each with its own anchor, and Schwiegermutter. The block is appended at the end of `goetheCoreNounSeeds`, so no existing entry moves. Weak masculine nouns carry their oblique form (den Neffen, den Praktikanten, den Geldautomaten). They share the `goethe-core-noun-anchors.csv` worksheet with their own scope `ADR-150-goethe-b1-themes-noun-anchor`; outside the original P0-98 scope (1,297).
5. **No new pending review item.** A row-by-row diff of the lexical inventory before and after the batch: 169 new noun rows, all covered by an anchor (117) or contextual-not-target (52); 12 new verb rows, all not-target; none removed. Pending stays 89 nouns + 1 verb. The first draft left the ten feminine forms pending; they were anchored before commit.
6. **Source check.** `scripts/export-question-support-nouns.ts` has a separate scope `goethe-b1-themes` (the ADR-142 scope `goethe-b1-core` is now limited to its own five lessons), checked by `scripts/verify-question-support-nouns.py` against WiktionaryDE via `german_nouns` 1.2.5: **117 of 117 confirmed** (114 directly, 3 via the compound head: Fortbildung, Versichertenkarte, Mobilbox). Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-themes-nouns-2026-10-21.csv`, guarded by `tests/unit/goethe-b1-themes-vocabulary.test.ts`.
7. **B1 bound forms.** Haupt-, Doppel-, Schwieger-, Speise- and irgend- appear in the B1 list as bound prefixes; they were added to `BOUND_FORMS` only where the lessons already contain such a compound (Schwieger- after «die Schwiegermutter» was taught). Elektro-, Kriminal-, Spezial-, Öko-, inner-, ober-, vorder- and mittler- do not occur in any lesson up to B1 and stay counted as missing.

## Audit of the batch (corrections made before commit)

- The flashcard appender produced `]]])` in six lines; caught by `tsc`, fixed.
- The b1-07 matching exercise repeated the prompt of a2-11-e8 word for word and was flagged as an internal near-duplicate; it now has its own prompt («طابق كلمة الريف والمناخ بمعناها:»).
- «das Erlebnis» was glossed «تجربة مَعيشة لا تُنسى»; an Erlebnis is not necessarily unforgettable, so the gloss is now «تجربة مَعيشة» in the phrase, the card and the anchor.
- The ADR-150 anchors were at first labelled with the ADR-142 scope in the review worksheet; they now carry their own scope, and the worksheet README names all four Goethe verification files (the B1 file of ADR-142 had been missing from it).
- Converting the b2-14/b2-17 quotes broke two explanation quotes and two reading-evidence locators (the quote-exception count rose from 69 to 71 and two locators fell back to the lexical selector); all four were updated, and the guard now covers the locators.

## Gates found during this batch

- **Development dependency advisory.** Three high advisories in `launch-editor` inside vite 8.2.0–8.2.3 (GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm) were published after v258 and failed `npm run check`. They concern opening files in an editor from the development server on Windows and do not reach the deployed app. A fixed version exists, so they were not added to the accepted set of `scripts/audit-dependencies.mjs` (which is reserved for findings without a fix); vite is raised to 8.3.5 through `overrides` in `package.json`. Because `package.json` and the lockfile are inputs of the content build ID, the route HTML sizes changed by a few bytes per page and the Offline fingerprint moved to `9afd336bdc9c`; JavaScript and curriculum sizes did not change.
- **Browser tests that pin counts** were updated after checking each cause: search entries 4,339 → 4,463 (+124 words), governed records 3328 → 3334, b1-01 additional target nouns 4 → 25 (the 21 new anchors), and a1-04 reading nouns 7 → 8 / additional 13 → 12 because der Großvater now occurs in the reading (the test now also checks that it is shown there).

## Results

| Measure | Before (v258) | After |
|---|---|---|
| A1 headwords appearing up to A1 | 662 / 670 | **669 / 670** (1 entry cannot be identified while goethe.de is unreachable) |
| A2 headwords appearing up to A2 | 1,130 / 1,136 | **1,136 / 1,136** |
| B1 headwords appearing up to B1 | 1,931 / 2,830 (68.2%) | **2,076 (73.4%)** |
| B1 headwords taught explicitly up to B1 | ≥ 1,467 (51.8%) | **≥ 1,606 (56.7%)** |
| B1 headwords absent from every lesson | 739 | **600** |
| Noun anchors | 1,733 | **1,850** |
| Noun candidates / covered / contextual / pending | 5,389 / 1,845 / 3,455 / 89 | **5,561 / 1,963 / 3,509 / 89** |
| Lesson exercises | 728 | **734** |
| Governed content records | 3,328 | **3,334** |
| Search entries | 4,339 | **4,463** |
| Explanation-quote exceptions | 69 | **69** |
| Client JS total (gzip, ceiling 2,205,000) | 2,145,427 | **2,154,585** (+9,158) |
| Curriculum gzip (ceiling 1,326,000) | 1,309,847 | **1,318,935** (+9,088; 7,065 B left) |
| Unit tests | 1,727 in 251 files | **1,735 in 253 files** |

The B1 "before" row is the v258 report; the A1/A2 measurement fixes alone raise B1 to 1,935 (68.4%), and the batch adds the rest. Counts come from `scripts/compare-goethe-wordlists.ts --from-report` (ADR-141), so "taught explicitly" is a lower bound. Pack generation v259.

## Consequences

- The six lessons have 37–40 vocabulary phrases instead of 18; the other B1 lessons are unchanged.
- The curriculum ceiling has 7,065 B left. The remaining B1 gaps (about 750 headwords, 152 of them taught first in B2), the B2 themes and the A1/A2/B1 mock exams will need another owner decision on the curriculum ceiling, or will have to be smaller than this batch.
