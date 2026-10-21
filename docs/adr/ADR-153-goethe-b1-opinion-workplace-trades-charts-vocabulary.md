# ADR-153: Goethe B1 vocabulary for opinions and attitudes, people and places at work, trades and qualifications, and shapes and charts

- Status: accepted, 2026-10-21 (v262)
- Owner instruction: «واصل» after the v261 report. Standing instruction: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Ceilings: no change. The batch fits under the curriculum safety ceiling set by ADR-152 (1,343,000) and under the JavaScript ceiling of ADR-141 (2,205,000).
- Evidence tier: agent content edit, checked by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-142, ADR-150, ADR-151 and ADR-152 (earlier B1 theme batches), ADR-141 (incremental counting, corrected here), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

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
- **Two example sentences.** „In der Wirklichkeit sieht das oft anders aus.“ became the idiomatic „In Wirklichkeit sieht das oft anders aus.“ „Als Ingenieur muss er seinen Abschluss anerkennen lassen.“ overstated the rule (not every engineer is obliged to), so it became „Als Ingenieur möchte er seinen Abschluss anerkennen lassen.“; it still practises lassen.
- **One explanation.** The b1-15 e8 explanation called die Störung «عطل قصير» (a short fault). Nothing in the word means short, so it now says «عطل أو انقطاع».
- **Old omission fixed.** The README description of the lexical review packet did not name the ADR-152 evidence file (`source-verification-goethe-b1-themes-3-nouns-2026-10-21.csv`). It now names it, together with the new ADR-153 file.
- **False-match check.** As ADR-152 found das Zeug, every headword that the batch made appear was compared with the batch text. All 93 are real: 88 are phrase headwords or their «der X / die Xin» partners, sich irren, sich an etwas gewöhnen and sich erkundigen are phrases themselves, and der Stern and locker occur in b1-15 example sentences („Ein Stern ist auf dieser Folie das Symbol für wichtige Punkte.“, „Der Beamer funktioniert nicht, weil der Stecker locker ist.“). Die Zeile moved from "first taught in B2" to B1, because it now occurs in b1-15.
- **Prompts and sentences.** The four e8 instructions were checked to be unique in the whole corpus, every example sentence matches the card format, and no Arabic text breaks the Arabic/Latin spacing rule.

## Counting fix: full recount of A1 and B1

Since ADR-141 (v250) the Goethe figures were updated with `--from-report`, because goethe.de is blocked here. That mode re-checks only the headwords the committed report lists as missing. While checking this batch, a second run on the same text raised "taught explicitly" from 1,891 to 1,894, which exposed two faults:

1. **Repeated counting.** das Trinkgeld (noun anchor in a1-12), leiden (verb frame in a1-22) and verzichten (verb frame in b1-10) are taught in the registry but appear in no lesson string. They therefore stay in the missing lists, and every run added them to "taught explicitly" again. Since v250 this added up to 3 per run.
2. **Removals not seen.** The mode cannot notice a word that later edits remove. beruhigen, ärgerlich and übrigens (a2 module 1), gelegt (a2 module 3) and der Einfluss (b1 module 5, now only in the compound „Einflussfaktoren“) left the lessons in the v257 rewrite, but stayed counted as present.

The fix:
- **Source files.** Copies of the official A1 and B1 Wortlisten were found on GitHub (`NgarumaVTC/swahili`, `greatmusicians/Goethe_B1_Wortliste`). Their SHA-256 are exactly the ones pinned in `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md` (`45fb648b…`, `8860f7f0…`), so they are byte-identical to the editions used before. No copy of the pinned A2 edition was found; the two A2 copies tried have other hashes and were not used.
- **Method check.** On a worktree of v248 (the last full run), the v248 script with these files reproduced every A1 and B1 figure of the v248 report exactly (B1: 2,830 headwords, 1,685 appearing, 1,217 taught).
- **Recount.** `compare-goethe-wordlists.ts` gained `--levels A1,B1`, which recounts the listed levels from the PDFs and copies the others unchanged (recorded in `partialFullRun`). A1 came out unchanged (669/670, 559 taught). A2 is carried over (1136/1136, none missing).
- **Script fix.** A full run now records the words counted as taught while absent (`explicitWhileAbsentList`). The incremental mode counts a row only if it appears now and was not counted by the full run, so two runs in a row give identical figures (checked).
- **Guard.** `tests/unit/goethe-reference-report.test.ts` checks the report's internal consistency, the registry-only words, the script fix and the recount figures.
- **Copyright.** The PDFs and parsed lists lived outside the repository and were deleted after the run. Only counts and missing lemmas are committed (§ 44b UrhG), as before.

The published figures of v250–v261 stay in their documents as they were. They are slightly high for the two reasons above.

## Results

| Measure | v261 (incremental, published) | v262 (full recount) |
|---|---|---|
| B1 headwords appearing up to B1 | 2,263 / 2,830 (80.0%) | **2,352 / 2,830 (83.1%)** |
| B1 headwords taught explicitly | 1,797 (63.5%) | **1,890 (66.8%)** |
| B1 headwords absent from every lesson | 416 | **327** |
| B1 headwords first taught in B2 | 149 | **149** |
| Noun anchors | 1,985 | **2,044** |
| Lesson exercises | 742 | **746** |
| Governed content records | 3,342 | **3,346** |
| Search entries | 4,623 | **4,703** |
| Curriculum (gzip) | 1,330,848 | **1,336,274** (6,726 B left under 1,343,000) |
| JavaScript (gzip) | 2,166,322 | **2,171,803** (33,197 B left under 2,205,000) |
| Unit tests | 1,743 in 255 files | **1,751 in 257 files** |

The batch made 94 B1 headwords appear: 93 that were absent from every lesson, and die Zeile, which had first appeared in B2. The full recount also removes the five words lost in v257 and the repeated counts, so the two columns are not a plain difference. Das Zeug is still counted falsely (ADR-152), so the real B1 figure is at most **2,351**. Pack generation v262.

Gates: __GATES__ Offline fingerprint `76996068cb18`, full pack 6,567,788 B gzip.

## Consequences

- The four lessons have 38 vocabulary phrases instead of 18. 69 of the 96 lessons now have a Goethe matching e8; among the B1 lessons only b1-24 has none.
- The remaining B1 gaps are 327 headwords absent from every lesson (including the five lost in v257), plus 149 taught first in B2.
- The curriculum ceiling leaves room for about one more batch of this size. After that, the next step needs the same recorded decision.
