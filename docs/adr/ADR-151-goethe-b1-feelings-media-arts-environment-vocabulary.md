# ADR-151: Goethe B1 vocabulary for feelings, media, arts and literature, and environment and community

- Status: accepted, 2026-10-21 (v260)
- Owner instruction: «واصل» after the v259 report, under the standing instruction «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق» and the delegation «نفّذ ما يفيد المتعلم والصحيح». No ceiling was raised in this batch.
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-142 (B1 food and perception), ADR-150 (six further B1 themes), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. After ADR-150 the B1 lessons showed 2,076 of the 2,830 Goethe-Zertifikat B1 headwords; 600 were absent from every lesson.
2. Four B1 lessons had a matching topic but lacked its everyday headwords:
   - b1-05: feelings and conflict.
   - b1-16: press, broadcasting and computers.
   - b1-17: stage, art and literature.
   - b1-21: environment and community.

   Words such as peinlich, wütend, verzeihen, Geduld, Reportage, Sender, abonnieren, Festplatte, Bühne, Orchester, Gedicht, Märchen, Umwelt, entsorgen, Müllabfuhr and Integration were absent from every lesson. All of them belong to the Goethe B1 themes Persönliche Beziehungen, Freizeit (Medien, Kultur) and Umwelt.
3. After v259 the curriculum had 7,065 B left under its 1,326,000 B ceiling, and the JavaScript total had 50,415 B left under 2,205,000. The batch was sized to stay under both.

## Decision

1. **80 words in four existing lessons, no new lessons.**
   - Each word gets a vocabulary-stage phrase and a review card with a full German example sentence. Both are appended, so no stored card ID moves.
   - Each lesson gets one matching exercise `b1-NN-e8` with five pairs and a unique instruction, aligned in `objective-item-alignment.ts`.
   - Each of the four lessons now has 38 vocabulary phrases.

   The words per lesson:
   - b1-05, feelings and conflict (20): peinlich, wütend, enttäuschen / die Enttäuschung, verzeihen / Verzeihung!, die Geduld, der Respekt, tolerant, schreien, sich weigern, sich bemühen / die Mühe, vernünftig, frech, ängstlich, erschrecken, sich wundern, zweifeln, die Wahrheit.
   - b1-16, media and computers (20): die Reportage, der Reporter / die Reporterin, der Journalist / die Journalistin, der Sender, die Serie, das Magazin, der Verlag, die Ausgabe, abonnieren / das Abonnement, die Neuigkeit, die Annonce, die Reklame, der Monitor, der Rechner, die Festplatte, das Netzwerk, virtuell, die Statistik, gucken.
   - b1-17, stage, art and literature (20): die Bühne, der Auftritt, aufführen, die Oper, das Orchester, das Ballett, der Schauspieler / die Schauspielerin, der Sänger / die Sängerin, der Künstler / die Künstlerin, der Maler / die Malerin, die Zeichnung, die Galerie, das Gedicht, das Märchen, die Erzählung, der Schriftsteller / die Schriftstellerin, der Held / die Heldin, die Fantasie, der Humor, gespannt.
   - b1-21, environment and community (20): die Umwelt, der Umweltschutz, die Umweltverschmutzung, verschmutzen, entsorgen, die Müllabfuhr, der Abfalleimer, das Plastik, giftig, die Gemeinschaft, die Versammlung, protestieren / der Protest, die Bevölkerung, der Politiker / die Politikerin, politisch, die Integration, interkulturell, der Sozialarbeiter / die Sozialarbeiterin, gleichberechtigt.
2. **Grammar records.**
   - 64 article-marked nouns get lesson-scoped anchors in `lexical-grammar-b1.ts`, recording article, plural and case forms: b1-17 24, b1-16 19, b1-21 15, b1-05 6.
   - These include the feminine form of every «der X / die Xin» phrase as its own anchor.
   - The block is appended at the end of `goetheCoreNounSeeds`, so no existing entry moves.
   - The two weak masculine nouns carry their oblique form: den Helden, den Journalisten.
   - The anchors share the `goethe-core-noun-anchors.csv` worksheet with their own scope label `ADR-151-goethe-b1-themes-2-noun-anchor`.
3. **No new pending review item.**
   - A row-by-row diff of the lexical inventory before and after the batch found 106 new noun rows.
   - Covered nouns rose by 65 and context-only nouns by 41. One existing row, die Schauspielerin, moved from context-only to covered.
   - There are 9 new verb rows, all not-target, and no rows were removed.
   - Pending stays 89 nouns + 1 verb.
4. **Source check.**
   - `scripts/export-question-support-nouns.ts` has a separate scope `goethe-b1-themes-2`.
   - `scripts/verify-question-support-nouns.py` checked it against WiktionaryDE via `german_nouns` 1.2.5: **64 of 64 confirmed directly**. The ADR-150 scope still exports its own 117.
   - Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-themes-2-nouns-2026-10-21.csv`, guarded by `tests/unit/goethe-b1-themes-2-vocabulary.test.ts`. The test checks four things: phrase, card and example for each theme sample; the 64 anchors outside the P0-98 scope; the weak oblique forms; and that each e8 pairs only words taught in that lesson.

## Audit of the batch (corrections made before commit)

- **Wrong file.** The draft placed b1-21 in `lessons-b1-module6.ts`; it lives in `lessons-b1-module7.ts`. This was corrected in the data before applying.
- **Case term without a case contract.** The explanation of `b1-05-e8` said that verzeihen takes the person "in Dativ". `case:audit:write` and `meaning-first-case.test.ts` rejected it: only exercises with a case-teaching contract may use case terms. The explanation now says the person comes as mir or dir, as in „Kannst du mir verzeihen, dass ich so spät komme?“.
- **Quote not verbatim.** The same explanation first quoted „Kannst du mir verzeihen.“, which is not the card sentence; it now quotes the card example in full.
- **Two glosses that overclaimed.**
  - «die Reportage» was glossed «التحقيق الصحفي المصوَّر». A Reportage is neither necessarily investigative nor illustrated, so the gloss is now «التقرير الميداني (الريبورتاج)».
  - «die Erzählung» was glossed «القصة القصيرة», which is a Kurzgeschichte. The gloss is now «القصة / الحكاية».
  - Both glosses were corrected in the phrase, the card and the anchor.
- **Explanation that overclaimed.** `b1-21-e8` said a Versammlung is a meeting where many people «decide together». Not every Versammlung decides anything, so it now gives examples: a meeting of the neighbourhood residents or of an association's members.
- **Prompts and pins.** The four e8 instructions were checked to be unique. Every pinned counter that moved was traced to its cause before being updated:
  - exercises 734 → 738;
  - governed records 3,334 → 3,338;
  - noun anchors 1,850 → 1,914;
  - search entries 4,463 → 4,543 (+80 words);
  - similarity pairs 5,556,111 → 5,569,453;
  - review-packet rows 4,992 → 4,996 and cells 21,637 → 21,653;
  - b1-05 anchors 13 → 19.
- Explanation-quote exceptions stay at 69.

## Results

| Measure | v259 | v260 |
|---|---|---|
| B1 headwords appearing up to B1 | 2,076 / 2,830 (73.4%) | **2,170 / 2,830 (76.7%)** |
| B1 headwords taught explicitly (lower bound) | 1,606 (56.7%) | **1,702 (60.1%)** |
| B1 headwords absent from every lesson | 600 | **508** |
| B1 headwords first taught in B2 | 152 | **150** |
| Noun anchors | 1,850 | **1,914** |
| Lesson exercises | 734 | **738** |
| Governed content records | 3,334 | **3,338** |
| Search entries | 4,463 | **4,543** |
| Curriculum (gzip) | 1,318,935 | **1,324,754** (1,246 B left under 1,326,000) |
| JavaScript (gzip) | 2,154,585 | **2,160,450** (44,550 B left under 2,205,000) |
| Unit tests | 1,735 in 253 files | **1,739 in 254 files** |

Gates: `npm run check` EXIT=0 (lint, typecheck, unit, handoff, dependency audit, build, browser accessibility 642/0, contrast 323 pages / 0 below minimum) and E2E 134/134 (67 desktop + 67 mobile). Offline fingerprint `92f908132e1d`, full pack 6,535,217 B gzip.

Counts come from `scripts/compare-goethe-wordlists.ts --from-report` (ADR-141), so "taught explicitly" is a lower bound. Pack generation v260.

## Consequences

- The four lessons have 38 vocabulary phrases instead of 18; the other B1 lessons are unchanged.
- **The curriculum ceiling is now practically full (1,246 B left).** The remaining B1 gaps need another owner decision on the curriculum ceiling. The owner said on 2026-10-20 that the ceiling does not matter because the app is always used online, but the agent keeps the gate and raises it only in recorded steps. The remaining gaps are:
  - about 508 headwords absent from every lesson, 150 of them taught first in B2;
  - the bound forms Elektro-, Kriminal-, Spezial-, Öko-, inner-, ober-, vorder- and mittler-.

  The B2 themes and the A1/A2/B1 mock exams need the same decision.
