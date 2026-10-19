# ADR-135: Question-critical reading support — no reading question may depend on a never-explained word

- Status: accepted, 2026-10-19 (v243)
- Policy ID: `question-critical-reading-support-v1` (measured by `measureQuestionCriticalSupport` in `src/core/content-validation/lexical-load.ts`)
- Authority: the owner's delegation «نفذ ما يفيد المتعلم و الصحيح». The 105 new noun anchors and 42 glossary entries were written by the agent. They are `authored-review-pending` and are not an independent German review.
- Relates to: ADR-126 (lemmatized lexical load), ADR-127 (reading-anchored vocabulary stage), ADR-128 (simplified A1 readings), IDEA_BACKLOG 402.

## Context

The reading-load tail (IDEA 402) was measured as a percentage of unknown word types in each text. That percentage does not say whether an unknown word actually blocks the learner. We measured something narrower and more useful. We took every reading word that:

1. also occurs in a question prompt or in the keyed answer;
2. is not supported by any earlier lesson, nor by the current lesson's phrases, cards or vocabulary-stage anchors (the same prior-sequence support as `measureReadingLoad`);
3. is not in the reading's own glossary.

Before this change, **151** such words were spread over 75 lessons. Four of them were proper names. Examples:

- a1-05 asks "Welcher Fehler steht auf Mariams Karte?" with the key "32 statt 22", and nothing ever explained *statt*.
- a1-12 keys "Gemüsesuppe ohne Sahne".
- b1-02 turns on *Vertrag*.

In each case the learner had to answer from a form that no surface of the course had explained. The Arabic text translation exists, but it hides the German word the learner must recognise.

## Decision

1. **Measurement.** `measureQuestionCriticalSupport` reports these words per lesson. The lesson-quality audit enforces the ceiling `readingQuestionCriticalUnsupportedMax: 0` and writes `reading.lemmatized.questionCritical` to `reports/lesson-quality-audit.json`. The test `tests/unit/question-critical-support.test.ts` guards the corpus at 0 and checks the definition on probes.
2. **How each word was supported.** The choice depended on the word class:
   - **Nouns: 105 lesson-scoped noun anchors**, giving article, gender, plural, case forms and Arabic meaning. They live in `questionSupportNounSeeds` in each `src/data/lexical-grammar-*.ts` file. Because they occur in the reading, the vocabulary stage shows them openly under «ستقابلها في نص القراءة» before the text.
     - Per level: A1 19, A2 17, B1 32, B2 37.
     - Their IDs are numbered after every existing entry of the lesson, so no stored ID moves.
     - An uppercase glossary lemma alone would have created a `pending-human` noun target.
   - **Verbs, adjectives, adverbs and determiners: 42 glossary entries** beside the text, such as *statt*, *helfen*, *findet*, *regelmäßig*, *zunächst*, *automatisch*, *beide* and *versäumt*. *Süd* in "Ausgang Süd" is glossed as جنوب with lemma *Süden*. A `der Süden` anchor covers that uppercase lemma. We did not create the misleading anchor ~~der Süd~~.
   - **Proper names: 4 added to `curriculum-proper-names.ts`.** These are *Alexanderplatz* (a square), *Hafenblick* (the fictional hotel name in "Hotel Hafenblick"), *Goethe* (the person the institute is named after) and *telc* (an institution). Under ADR-126 they are not vocabulary to learn.
3. **Review scope.** The original P0-98 review scope stays exactly 1,297 anchors and 89 pending candidates. It is asserted through `originalP098NounEntries`. The 105 new anchors get their own unsigned worksheet, `reports/lexical-review-packet/question-support-noun-anchors.csv`, with scope `ADR-135-question-support-noun-anchor` and blank signature columns.
4. **Ratchet.** The measured reading load was tightened again. The median fell from 22.0% to 20.3%, and the heaviest text from 41.3% to 38.6% (now a1-02). The ceilings are now median ≤ 21 and max ≤ 39, with over-45 kept at 0. This drop comes from words the learner now really sees before or beside the text. We did not add anything to the stop list.

## What was not done

- **No stop-list padding.** Determiners such as *beide* and *dieselbe* were glossed, not added to `CURRICULUM_STOP_WORDS`.
- **No answer-option shortcut.** Questions were not rewritten to avoid the words. The texts and items are unchanged.
- **Out of scope:** unknown words that only the text uses and no question needs. That covers about 1,100 types, mostly transparent compounds and B2 vocabulary. They remain the reading's normal challenge, together with the Arabic translation.

## Consequences

- Lexical target-gap counts changed:
  - anchors 1,297 → 1,402;
  - covered candidates 1,385 → 1,503;
  - context-only candidates 3,450 → 3,373;
  - candidates in total 4,924 → 4,965;
  - `pendingHuman` stays 89 (all B2, unchanged).
- Search index entries rose from 3,750 to 3,792.
- Curriculum source gzip rose by about 3 KB and stays below the 1,275,000 ceiling, which was not raised.
- IDEA_BACKLOG 402 is closed. Its premise, that the tail needed noun anchors through a documented decision, is answered by this narrower, learner-relevant criterion. Anything further would be padding.
- The new anchors and glossary entries need the same independent German check as every authored anchor. Their worksheet exists for that check and is unsigned.
