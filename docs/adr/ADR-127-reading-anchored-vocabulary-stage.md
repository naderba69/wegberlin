# ADR-127: Show the reading's own noun anchors before the reading, and meet the 25% reading-load median (P2-401)

- Status: accepted, 2026-10-18 (v235)
- Policy IDs: `lemmatized-lexical-load-v2`, `reading-anchored-noun-visibility-v1` (the lemmatizer stays `german-curriculum-lemmatizer-v1` with one added rule)
- Evidence tier: an agent-authored content and measurement change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not a human review** of voice, suitability or rights.

## Context

ADR-126 measured reading load on lemma candidates. It found a median of 28.9% unknown content-word types, against a pedagogical target of 25%. Looking at the remaining unknown words lesson by lesson showed three distinct causes:

1. **Untaught high-frequency words in A1.** The numbers 2–9 and 11–12, the weekdays, heute, jetzt, oft, manchmal, nur, immer and dort appear in the first readings. No phrase or card taught them first.
2. **Question-critical words.** Some readings ask about a word that no earlier stage teaches. Examples: nimmt (a1-10), Fahrrad fahren (a1-17), Atemnot (a1-23), mehrmals (a2-18), schüchtern (a2-23), verteidigte (b1-05) and manipuliert (b2-21).
3. **Hidden anchors.** Every lesson's lexical-grammar registry documents more noun anchors than the four the vocabulary stage shows. The rest sat behind a closed «Weitere Zielnomen» disclosure, even when the same lesson's reading text uses them, so the learner first met these nouns inside the text. Across the curriculum, 549 such anchors in 92 lessons occur in their own lesson's reading.

There were also two definition faults in the measurement:

- Irregular forms of stop-listed verbs (wurde, hast, konnte, möchte) counted as content words.
- The vocabulary stage was not counted as support at all, although it comes before the reading.

## Decision

1. **Measurement definitions (v2).**
   - An irregular form counts as a function word only through an explicit dictionary entry onto the lemma of a stop word. Rule guesses never count, so kannte (kennen) is not swallowed by kann.
   - Support now includes what the vocabulary stage shows openly: the first four noun anchors (lemma and plural) and every verb-preposition frame infinitive.
   - Participle I forms used as adjectives or nouns (wartende, entstehenden) map to the infinitive.
2. **Thirty pre-reading flashcards.** They are appended at the end of each lesson's card list, so existing card IDs stay stable:
   - 17 cards teach the A1 core words: Frau/Herr, heute, jetzt, the numbers, nur, oft, manchmal, am Wochenende, the parts of the day, the weekdays, immer and dort.
   - 13 cards pre-teach question-critical words in a1-10, a1-15, a1-17, a1-18, a1-19, a1-23, a2-18, a2-23, b1-05, b2-04, b2-08, b2-10 and b2-21.

   No card front pairs an article with a noun, so no new pending-human lexical target is created. The lexical-target gap counts are unchanged.
3. **The vocabulary stage shows the reading's own anchors** (`src/core/lesson/vocabulary-stage.ts`).
   - Anchors after the first four that occur in the lesson's reading text appear openly under «ستقابلها في نص القراءة». They form a compact list: article and noun, Arabic meaning, plural, and a «nur Plural» badge where it applies. Each row opens to show the case forms.
   - Only anchors that the reading does not use stay in the closed disclosure.
   - Occurrence means an exact folded match on the lemma, the plural, the dative plural or a case form, optionally with a genitive -s/-es. A substring never counts, so «Stuhlkreis» does not match Stuhl.
   - The panel and the audit call the same function, so the audit counts exactly what the learner sees. The registry is not edited, and the 1,297 nouns and 134 frames are unchanged.
4. **The ratchet is tightened to the measured state:**
   - reading median ≤ 23%;
   - at most 4 reading texts above 45%;
   - every long input ≤ 32%, unchanged.

## Result: each effect separately

| Step | Median | A1 | A2 | B1 | B2 | Texts > 45% | Texts ≤ 25% | Highest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADR-126 committed (v1) | 28.9 | 45.1 | 28.2 | 28.0 | 27.0 | 13 | 33 | 73.3 |
| + function-word definition (v2) | 29.9 | 46.0 | 29.0 | 27.5 | 27.3 | 15 | 30 | 75.0 |
| + first four anchors and frames as support | 28.6 | 44.0 | 27.5 | 24.7 | 25.6 | 10 | 34 | 70.5 |
| + 30 pre-reading cards | 25.5 | 37.8 | 25.0 | 24.7 | 24.4 | 6 | 46 | 65.9 |
| + reading anchors shown openly | **22.6** | 28.9 | 19.6 | 20.8 | 23.1 | **4** | 60 | 53.7 |

- The visible-anchor step alone, without the new cards, would give 24.1. Cards and visibility each contribute about three points.
- The function-word correction *raised* the figure. It is kept because it is the correct definition.
- Long inputs: median 19.1%, highest 31.7% (b1-D).

## Consequences

- **The 25% reading-load median is met (22.6%).** The ratchet now forbids any regression from it.
- **A1 remains the heaviest level** (median 28.9%). Four texts are still above 45%: a1-01 (53.7), a1-04 (46.3), a1-03 (46.2) and a1-05 (45.8). These first readings need rewriting, not more cards. That is the next content task, and it is recorded rather than hidden.
- **Trade-off:** a few lessons now show a long pre-reading list. b2-09 has 27 rows. The list is compact and separated from the four core anchors, but some learners may find it long. A later batch could shorten such readings.
- The figure is curricular exposure, never proof that a learner knows a word. The lemmatizer still errs high, never low.
- **P2-401 stays `partial`** for the human parts only: a human voice for the long inputs, and an independent review of suitability and rights.
