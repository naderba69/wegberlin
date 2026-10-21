# ADR-153: Goethe B1 vocabulary for opinions and attitudes, people and places at work, trades and qualifications, and shapes and charts

- Status: accepted, 2026-10-21 (v262)
- Owner instruction: «واصل» after the v261 report. Standing instruction: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Ceilings: no change. The batch fits under the curriculum safety ceiling set by ADR-152 (1,343,000) and under the JavaScript ceiling of ADR-141 (2,205,000).
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-142, ADR-150, ADR-151 and ADR-152 (earlier B1 theme batches), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. After ADR-152 the B1 lessons showed 2,263 of the 2,830 Goethe-Zertifikat B1 headwords (at most 2,262 real, because das Zeug is a false match), and 416 were absent from every lesson.
2. Four of the five B1 lessons without a vocabulary e8 have a topic that matches a large group of those missing words:
   - b1-02 "Entscheidungen": opinions, doubt and attitude. Überzeugung, Gewissen, Wirklichkeit, sich irren, sowieso, meinetwegen, beinahe and mittlerweile were all absent.
   - b1-04 "Teamarbeit": people and places at work. Arbeiter, Unternehmer, Sekretär, Händler, Konkurrenz, entlassen, Vorschrift, Lift and Klimaanlage were absent.
   - b1-14 "Weiterbildung": trades, experts and qualifications. Lehrling, Meister, Fachmann, Experte, Architekt, Ingenieur, Übersetzer, Fotograf and Urkunde were absent.
   - b1-15 "Präsentieren": shapes and charts on slides. Abbildung, Symbol, Kreis, senkrecht, waagerecht, Broschüre and Stecker were absent.
3. The fifth lesson, b1-24 (the closing project), is left for a later batch.
4. The curriculum had 12,152 B left under its 1,343,000 B safety ceiling, and the JavaScript total had 38,678 B left under 2,205,000. A batch of this size needs about 6 KB.

## Decision

1. **80 words in four existing lessons, no new lessons.**
   - Each word gets a vocabulary-stage phrase and a review card with a full German example sentence. Both are appended, so no stored card ID moves.
   - Each lesson gets one matching exercise `b1-NN-e8` with five pairs and a unique instruction, aligned in `objective-item-alignment.ts`.
   - Where natural, the examples use the lesson's grammar: 3 examples in b1-02 use würde / wäre / hätte, 7 in b1-04 use the Passiv, and 4 in b1-14 use lassen.

   The words per lesson:
   - b1-02, opinions, doubt and attitude (20): die Überzeugung, überreden, das Gewissen, die Aussicht, die Wirklichkeit, die Krise, sich an etwas gewöhnen, sich irren, wetten, vergeblich, sinnlos, sowieso, meinetwegen, zumindest, beinahe, mittlerweile, seltsam, verrückt, unglaublich, heimlich. Example: „Ich hätte mich beinahe für die falsche Wohnung entschieden.“
   - b1-04, people and places at work (20; Passiv): der Arbeiter / die Arbeiterin, der Unternehmer / die Unternehmerin, der Sekretär / die Sekretärin, der Direktor / die Direktorin, der Betreuer / die Betreuerin, der Händler / die Händlerin, der Käufer / die Käuferin, die Konkurrenz, entlassen, die Entlassung, die Vorschrift, der Stempel, die Etage, der Lift, der Korridor, die Klimaanlage, miteinander, voneinander, kaputtgehen, abmachen. Example: „Die Termine werden von der Sekretärin koordiniert.“
   - b1-14, trades, experts and qualifications (20; lassen): die Karriere, der Lehrling, der Meister / die Meisterin, der Fachmann / die Fachfrau, der Experte / die Expertin, der Spezialist / die Spezialistin, der Architekt / die Architektin, der Ingenieur / die Ingenieurin, der Übersetzer / die Übersetzerin, der Fotograf / die Fotografin, die Urkunde, die Technologie, kreativ, speziell, realisieren, die Intelligenz, der Nachwuchs, die Erziehung, erziehen, sich erkundigen. Example: „Die Zeugnisse lasse ich von einer vereidigten Übersetzerin übersetzen.“
   - b1-15, shapes and charts on slides (20): die Abbildung, das Symbol, die Summe, statistisch, der Kreis, eckig, flach, spitz, schmal, die Breite, parallel, senkrecht, waagerecht, quer, folgend, sogenannt, die Broschüre, der Katalog, die Störung, der Stecker.
2. **Grammar records.**
   - 59 article-marked nouns get lesson-scoped anchors in `lexical-grammar-b1.ts`: b1-14 23, b1-04 22, b1-15 9, b1-02 5.
   - These include the feminine form of every «der X / die Xin» phrase as its own anchor.
   - The block is appended at the end of `goetheCoreNounSeeds`, so no existing entry moves. None of the 59 lemmas had an anchor in another lesson before.
   - The weak masculine nouns Experte, Spezialist, Architekt and Fotograf carry their bare oblique form (Experten, Spezialisten, Architekten, Fotografen). The code adds the article, so the guard test checks for „den Experten“ and not „den den Experten“.
   - Der Fachmann carries its irregular plural die Fachleute.
   - Nouns taught only in one sense or without a usual plural have no plural: die Konkurrenz, die Intelligenz, der Nachwuchs, die Erziehung.
   - The anchors share `goethe-core-noun-anchors.csv` with their own scope label `ADR-153-goethe-b1-themes-4-noun-anchor`.
3. **No new pending review item.**
   - A row-by-row diff of the lexical inventory before and after the batch found 92 new noun rows: 60 covered by an anchor, and 32 context-only words from the example sentences (Firma, Krise in b1-04, Tabelle, Zeile …).
   - The 60 covered rows include „Spezialisten“, which occurs as its own form in an example sentence and is covered by the Spezialist anchor.
   - There are 8 new verb rows, all not-target, and no rows were removed. Pending stays 89 nouns + 1 verb.
4. **Source check.**
   - `scripts/export-question-support-nouns.ts` has a separate scope `goethe-b1-themes-4`.
   - `scripts/verify-question-support-nouns.py` checked it against WiktionaryDE via `german_nouns` 1.2.5: **59 of 59 confirmed directly**.
   - A second, independent check before the batch was applied compared gender, plural and the full oblique form of each weak noun against the same source: 0 differences.
   - Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-themes-4-nouns-2026-10-21.csv`, guarded by `tests/unit/goethe-b1-themes-4-vocabulary.test.ts`.

## Audit of the batch (corrections made before commit)

- **Gloss of mittlerweile.** The draft gloss «مع مرور الوقت / الآن» was replaced by «الآن (بعد مرور وقت)», because the word means "by now", not "over time".
- **Old omission fixed.** The README description of the lexical review packet did not name the ADR-152 evidence file (`source-verification-goethe-b1-themes-3-nouns-2026-10-21.csv`). It now names it, together with the new ADR-153 file.
- **False-match check.** As ADR-152 found das Zeug, every headword that left the absent list was compared with the batch text. All 93 are real: 88 are phrase headwords or their «der X / die Xin» partners, sich irren, sich an etwas gewöhnen and sich erkundigen are phrases themselves, and der Stern and locker occur in b1-15 example sentences („Ein Stern ist auf dieser Folie das Symbol für wichtige Punkte.“, „Der Beamer funktioniert nicht, weil der Stecker locker ist.“). Die Zeile moved from "first taught in B2" to B1, because it now occurs in b1-15.
- **Prompts and sentences.** The four e8 instructions were checked to be unique in the whole corpus, every example sentence matches the card format, and no Arabic text breaks the Arabic/Latin spacing rule.

## Results

| Measure | v261 | v262 |
|---|---|---|
| B1 headwords appearing up to B1 | 2,263 / 2,830 (80.0%) | **2,357 / 2,830 (83.3%)** |
| B1 headwords taught explicitly (lower bound) | 1,797 (63.5%) | **1,891 (66.8%)** |
| B1 headwords absent from every lesson | 416 | **323** |
| B1 headwords first taught in B2 | 149 | **148** |
| Noun anchors | 1,985 | **2,044** |
| Lesson exercises | 742 | **746** |
| Governed content records | 3,342 | **3,346** |
| Search entries | 4,623 | **__SEARCH__** |
| Curriculum (gzip) | 1,330,848 | **__CURR__** (__CURRLEFT__ B left under 1,343,000) |
| JavaScript (gzip) | 2,166,322 | **__JS__** (__JSLEFT__ B left under 2,205,000) |
| Unit tests | 1,743 in 255 files | **__UNIT__** |

The B1 count rises by 94 for 80 phrases: 93 headwords left the absent list, and die Zeile moved down from B2. Das Zeug is still counted falsely (ADR-152), so the real B1 figure is at most **2,356**. Counts come from `scripts/compare-goethe-wordlists.ts --from-report` (ADR-141), so "taught explicitly" is a lower bound. Pack generation v262.

Gates: __GATES__ Offline fingerprint __FP__, full pack __FULL__ B gzip.

## Consequences

- The four lessons have 38 vocabulary phrases instead of 18. 69 of the 96 lessons now have a Goethe matching e8; among the B1 lessons only b1-24 has none.
- The remaining B1 gaps are 323 headwords absent from every lesson, plus 148 taught first in B2.
- The curriculum ceiling leaves room for about one more batch of this size. After that, the next step needs the same recorded decision.
