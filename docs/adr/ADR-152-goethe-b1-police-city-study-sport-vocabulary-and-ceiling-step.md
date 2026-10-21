# ADR-152: Goethe B1 vocabulary for police and courts, city buildings and services, study and learning, and sport, with one moderate curriculum-ceiling step

- Status: accepted, 2026-10-21 (v261)
- Owner instruction: «واصل» after the v260 report. That report said the curriculum ceiling had only 1,246 B left, and that the agent would raise it by a small step unless the owner preferred otherwise. Standing instruction: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Ceiling authority: the owner's answer of 2026-10-20 (ADR-149), «لا يهم السقف ساستعمله اونلاين دائما». The JavaScript ceiling (2,205,000, ADR-141) is not touched.
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-142, ADR-150 and ADR-151 (earlier B1 theme batches), ADR-149 (previous ceiling step), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. After ADR-151 the B1 lessons showed 2,170 of the 2,830 Goethe-Zertifikat B1 headwords, and 508 were absent from every lesson.
2. Four B1 lessons without a vocabulary e8 have a topic that matches a large group of those missing words:
   - b1-18 "Informationen prüfen": police reports and courts. Polizist, Dieb, Einbruch, Täter, Zeuge, festnehmen, Richter, Gefängnis and strafbar were all absent.
   - b1-09 "Stadtentwicklung": city buildings and services. Denkmal, Turm, Mauer, Fabrik, Feuerwehr, Notausgang and Fundbüro were absent.
   - b1-13 "Lernwege": study and learning. Fremdsprache, Dialekt, Nachhilfe, Klassenarbeit, Referat, Mensa and Professor were absent.
   - b1-22 "Ziele": sport and ambition. Sportart, Sieg, Sieger, Verlierer, Rekord, unentschieden and Mut were absent.
3. The curriculum had 1,246 B left under its 1,326,000 B safety ceiling, which is not enough for any further batch. The JavaScript total had 44,550 B left under 2,205,000.

## Decision

1. **Ceiling step.** The curriculum hard limit in `scripts/audit-media-pack-budgets.mjs` goes from 1,560,000 to **1,580,000**, so the safety ceiling goes from 1,326,000 to **1,343,000**.
   - This is the same 20,000 B step as ADR-149, and the 15% reserve and the gate itself are kept.
   - It leaves room for about two more batches of this size. `goethe-a1-core-vocabulary.test.ts` pins the new values and this ADR.
2. **80 words in four existing lessons, no new lessons.**
   - Each word gets a vocabulary-stage phrase and a review card with a full German example sentence. Both are appended, so no stored card ID moves.
   - Each lesson gets one matching exercise `b1-NN-e8` with five pairs and a unique instruction, aligned in `objective-item-alignment.ts`.
   - Where natural, the examples use the lesson's grammar.

   The words per lesson:
   - b1-18, police and courts (20; sollen / angeblich): der Polizist / die Polizistin, die Kriminalpolizei, der Dieb, der Einbruch, einbrechen, der Einbrecher / die Einbrecherin, betrügen, die Gewalt, illegal, der Täter / die Täterin, das Opfer, der Zeuge / die Zeugin, festnehmen, verhaften, der Anwalt / die Anwältin, der Richter / die Richterin, verurteilen, das Gefängnis, die Strafe, strafbar. Examples such as „Der Dieb soll durch ein offenes Fenster ins Haus gekommen sein.“ practise reporting an unconfirmed claim.
   - b1-09, city buildings and services (20; indem / dadurch, dass): der Bau, das Denkmal, die Burg, der Turm, die Mauer, historisch, das Grundstück, die Fabrik, die Industrie, das Kraftwerk, die Feuerwehr, der Notausgang, der Gehsteig, die Geschwindigkeitsbeschränkung, die Gaststätte, das Hallenbad, der Tierpark, das Fundbüro, die Eröffnung, riesig.
   - b1-13, study and learning (20; beim + nominalised verb, durch): das Alphabet, die Fremdsprache, die Zweitsprache, der Dialekt, die Nachhilfe, die Klassenarbeit, das Referat, das Seminar, die Mensa, der Professor / die Professorin, das Institut, die Forschung, der Wissenschaftler / die Wissenschaftlerin, die Theorie, theoretisch, das Lexikon, unterstreichen, die Schwierigkeit, das Diplom, befriedigend (the German school grade 3).
   - b1-22, sport and ambition (20; ohne … zu / ohne dass): die Sportart, der Sportler / die Sportlerin, der Profi, der Spieler / die Spielerin, der Sieg, siegen, der Sieger / die Siegerin, der Verlierer / die Verliererin, unentschieden, der Rekord, der Kampf, der Mut, mutig, kräftig, körperlich, tauchen, die Saison, ernsthaft, entschlossen, ideal.
3. **Grammar records.**
   - 71 article-marked nouns get lesson-scoped anchors in `lexical-grammar-b1.ts`: b1-18 19, b1-13 19, b1-09 18, b1-22 15.
   - These include the feminine form of every «der X / die Xin» phrase as its own anchor.
   - The block is appended at the end of `goetheCoreNounSeeds`, so no existing entry moves.
   - The weak masculine nouns Polizist and Zeuge carry their oblique form (den Polizisten, den Zeugen).
   - Die Forschung already had a B2 anchor (b2-06); it is now also taught in b1-13, which is normal practice (256 lemmas already have anchors in more than one lesson).
   - The anchors share `goethe-core-noun-anchors.csv` with their own scope label `ADR-152-goethe-b1-themes-3-noun-anchor`.
4. **No new pending review item.**
   - A row-by-row diff of the lexical inventory before and after the batch found 108 new noun rows: 71 covered by an anchor, and 37 context-only words from the example sentences (Kirche, Museum, Unfall, Mannschaft …).
   - There are 10 new verb rows, all not-target, and no rows were removed.
   - Pending stays 89 nouns + 1 verb.
5. **Source check.**
   - `scripts/export-question-support-nouns.ts` has a separate scope `goethe-b1-themes-3`.
   - `scripts/verify-question-support-nouns.py` checked it against WiktionaryDE via `german_nouns` 1.2.5: **71 of 71 confirmed directly**.
   - Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-themes-3-nouns-2026-10-21.csv`, guarded by `tests/unit/goethe-b1-themes-3-vocabulary.test.ts`.

## Audit of the batch (corrections made before commit)

- **Weak-noun form doubled.** The draft gave the oblique form of Polizist and Zeuge as "den Polizisten" and "den Zeugen". The code adds the article itself, so the record read „den den Polizisten“. The new guard test caught it. The seeds now hold the bare form, as for Held and Journalist in ADR-151.
- **Plural from the wrong sense.** "der Bau" is taught as the act of building («البناء (عملية البناء)»). Its plural "Bauten" belongs to the other sense (buildings), so the record now gives no plural; the source check notes this.
- **Prompts and sentences.** The four e8 instructions were checked to be unique in the whole corpus, and every example sentence matches the card format.

## Results

| Measure | v260 | v261 |
|---|---|---|
| B1 headwords appearing up to B1 | 2,170 / 2,830 (76.7%) | **2,263 / 2,830 (80.0%)** |
| B1 headwords taught explicitly (lower bound) | 1,702 (60.1%) | **1,797 (63.5%)** |
| B1 headwords absent from every lesson | 508 | **416** |
| B1 headwords first taught in B2 | 150 | **149** |
| Noun anchors | 1,914 | **1,985** |
| Lesson exercises | 738 | **742** |
| Governed content records | 3,338 | **3,342** |
| Search entries | 4,543 | **4,623** |
| Curriculum (gzip) | 1,324,754 (ceiling 1,326,000) | **1,330,848** (12,152 B left under 1,343,000) |
| JavaScript (gzip) | 2,160,450 | **2,166,322** (38,678 B left under 2,205,000) |
| Unit tests | 1,739 in 254 files | **1,743 in 255 files** |

The B1 count rises by 93 for 80 phrases. A comparison with the v260 report gives the exact breakdown:
- 89 headwords taught by the new phrases (each «der X / die Xin» phrase covers two);
- die Zeugin, which had been counted as first taught in B2;
- schießen, via „schoss das Tor“, and entschließen, via entschlossen, both met in example sentences;
- **das Zeug, which is a false match.** The matcher accepts Zeuge/Zeugen as forms of „Zeug“ (its rare plural is „Zeuge“), although the lesson means the witness. This is an inherent ambiguity of matching by lemma candidates, so it is recorded here rather than special-cased in the script.

The real B1 figure is therefore at most **2,262**. Counts come from `scripts/compare-goethe-wordlists.ts --from-report` (ADR-141), so "taught explicitly" is a lower bound. Pack generation v261.

Gates: `npm run check` EXIT=0 (lint, typecheck, unit, handoff, dependency audit, build, browser accessibility 642/0, contrast 323 pages / 0 below minimum) and E2E 134/134 (67 desktop + 67 mobile). Offline fingerprint `b2eef3ca5ffc`, full pack 6,551,637 B gzip.

## Consequences

- The four lessons have 38 vocabulary phrases instead of 18. 65 of the 96 lessons now have a Goethe matching e8.
- The remaining B1 gaps are about 416 headwords absent from every lesson, 149 of them taught first in B2. The B1 lessons still without a vocabulary e8 are b1-02, b1-04, b1-14, b1-15 and b1-24.
- The new ceiling leaves room for about two more batches of this size. After that, the next step needs the same recorded decision.
