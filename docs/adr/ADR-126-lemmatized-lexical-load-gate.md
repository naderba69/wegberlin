# ADR-126 — Lemmatized lexical load for reading texts and long inputs (P2-401)

- Status: accepted — 2026-10-18 (v234)
- Policy IDs: `lemmatized-lexical-load-v1`, `german-curriculum-lemmatizer-v1`, `curriculum-proper-names-v1`
- Evidence tier: agent-authored measurement under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). Grammar labels for the ten new glossary headwords were checked against de.wiktionary on 2026-10-18. **This is not a human review of voice, pacing, suitability or rights.**

## Context

P2-401 asks for realistic listening length and a *controlled* lexical load. Before this batch the curriculum measured reading load as "share of content words not supported by earlier lessons" (`prior-sequence-support-v3`). The figure was reported but not thresholded, because the measurement itself was known to be wrong in four ways:

1. **No lemmas.** A suffix stemmer cannot unify strong verbs (spricht/sprechen, ging/gehen, verstanden/verstehen) or umlaut plurals (Satz/Sätze, Buch/Bücher). Every such form counted as a new word.
2. **Proper names counted as vocabulary.** Speaker and town names (Amira, Lindenau, Okafor) made texts look harder than they are.
3. **The stop list was never folded.** The text is folded (ü→ue), the stop list was not, so für, über, außerhalb, möchten and müssen never matched it and always counted as unknown content words.
4. **Accents split words.** The legacy fold turned é into a space (Café → "caf"), so Sprachcafés became two tokens.

The 16 long inputs (`graded-long-input-v1`, 113–473 words) had no lexical-load measurement at all.

## Decision

1. **A curriculum lemmatizer** (`src/core/german/lemmatizer.ts`). For each folded word it proposes lemma candidates:
   - rule candidates for regular inflection;
   - explicit hits in an irregular dictionary;
   - compound tails (Arbeitsplätze → Arbeitsplatz, anrief → anrufen);
   - inseparable participles without ge- (verstanden → verstehen, bekommen).

   Matching uses the exact candidates plus the legacy surface stem. Stemming the candidates was tried and rejected, because short stems collided ("schl…").
2. **An explicit irregular dictionary** (`src/data/german-lemma-dictionary.ts`), with 2,044 form→lemma pairs:
   - 111 strong and mixed verbs expanded from their principal parts;
   - 50 forms of sein, haben, werden, the modals and Konjunktiv II;
   - 88 umlaut and Latin plurals;
   - 32 irregular comparison forms;
   - the plurals already recorded in the lexical grammar registry.

   Multi-word entries throw at build time, so a typo cannot silently widen the dictionary.
3. **A proper-name list** (`src/data/curriculum-proper-names.ts`) with 64 people and 11 places that occur in the curriculum. Country and language names are deliberately excluded, because they are vocabulary a learner must learn. A test requires every named speaker in the long inputs to be on the list.
4. **The measurement** (`src/core/content-validation/lexical-load.ts`) works on distinct content-word types, folds the stop list like the text, and counts names apart. Support is defined differently for the two kinds of text:
   - reading uses the same prior-sequence support as v3;
   - long inputs use every lesson at or below their level, plus the glossary shown beside the input.
5. **A ratchet gate** in `scripts/generate-lesson-quality-audit.ts`. The values were measured on 2026-10-18:
   - lemmatized reading median ≤ 29%;
   - at most 13 reading texts above 45%;
   - every long input ≤ 32%.

   The legacy fields stay in the report unchanged, so the comparison remains auditable.
6. **Content repair where the load was highest.** The five long inputs above 25% each got two new glossary headwords: words needed to answer the input's own questions, each with an Arabic meaning and a source-checked grammar label:
   - b1-D: Schulhof, Schatten;
   - b1-C: Spielplatz, Fragebogen;
   - a1-D: trocken, Erdbeere;
   - b2-C: Lehrkraft, heimlich;
   - a2-D: Bremse, Helm.

   This takes the glossary from 64 to 74 headwords, and the verified labels from 63 to 73.

## Result

| Measure | Legacy (v3 stemmer) | Lemmatized (v1) |
| --- | --- | --- |
| Reading median | 40% | **28.9%** |
| A1 / A2 / B1 / B2 medians | 52.8 / 36.8 / 40.8 / 39.4 | 45.1 / 28.2 / 28.0 / 27.0 |
| Reading texts above 45% | 29 | 13 |
| Highest reading text | 80% | 73.3% |
| Proper names excluded | 0 | 139 |
| Long inputs: median / highest | not measured | 20% / 31.3% (b1-D) |

## Consequences

- **The pedagogical target is still a 25% median, and it is not met.** A1 texts remain the heaviest. Their remaining unknowns are mostly genuinely untaught words (heute, dann, vier, Dienstag) rather than measurement artefacts. The ratchet only forbids regression; lowering the median requires rewriting texts or teaching the words earlier.
- The lemmatizer is not a full morphological analyser. A missed form counts as unknown, so the figure still errs high, never low.
- P2-401 stays `partial`. A human voice for the long inputs and an independent review of suitability and rights are human work that this batch does not claim.
