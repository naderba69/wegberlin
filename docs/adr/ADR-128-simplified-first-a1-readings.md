# ADR-128: Simplify the first A1 reading texts around their evidence sentences (P2-401)

- Status: accepted, 2026-10-18 (v236)
- Policy IDs: unchanged (`lemmatized-lexical-load-v2`, `reading-anchored-noun-visibility-v1`, `reading-evidence-authored-v1`)
- Evidence tier: agent-authored content under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not a human review** of the German or of suitability.

## Context

After ADR-127 the reading median was 22.6%. Four A1 texts were still above 45% unknown content-word types. All four come early in the course, where the learner knows least:

| Lesson | Load |
| --- | --- |
| a1-01 | 53.7% |
| a1-04 | 46.3% |
| a1-03 | 46.2% |
| a1-05 | 45.8% |

The next two were close behind: a1-06 at 43.1% and a1-09 at 39.5%. Most of their unknown words were in sentences that no question uses, for example «Er ist neunzehn Jahre alt und studiert», «Sie plant technische Projekte», «David bringt seine Grammatiknotizen mit». Adding more cards would not fix that. ADR-127 recorded that these texts need rewriting.

## Decision

1. **The six texts are rewritten around their evidence sentences.**
   - Every sentence that the authored evidence locators (`reading-evidence-authored-v1`) or a question explanation quotes stays verbatim. The 18 questions, their options, their explanations and the locators are therefore untouched.
   - Every glossary surface form still occurs in its text, so the glossary is unchanged.
   - Sentences that carried only untaught detail are removed or reworded with words the lesson teaches. Examples: «Er arbeitet als Verkäufer in einem Supermarkt»; «Kenji hat am Dienstag einen Termin».
   - Where the lesson's own phrases fit, they are used in short exchanges. Examples: «Wie geht es dir?» – «Danke, gut.» in a1-01; «Stimmt das?» – «Ja, das stimmt.» in a1-05.
   - The Arabic text for each reading (`textAr`) is rewritten to match.
2. **Two very frequent words are taught before the first reading.** The a1-01 cards gain «sagen – er sagt, sie sagt» and «dann». Both are used in the first texts and were untaught.
3. **A measurement fix:** «Adel», a person name in a1-06, is added to the proper-name list.
4. **The ratchet is tightened again**, and gains a ceiling for the heaviest text:
   - reading median ≤ 22%;
   - no text above 45%;
   - the heaviest text ≤ 42%.

## Result

| Lesson | Before | After | Words before → after |
| --- | --- | --- | --- |
| a1-01 | 53.7% | 30.6% | 92 → 79 |
| a1-03 | 46.2% | 34.2% | 92 → 93 |
| a1-04 | 46.3% | 34.4% | 94 → 78 |
| a1-05 | 45.8% | 36.8% | 95 → 91 |
| a1-06 | 43.1% | 20.0% | 98 → 81 |
| a1-09 | 39.5% | 27.5% | 97 → 97 |

| Measure | Before (ADR-127) | After |
| --- | --- | --- |
| Reading median | 22.6% | **22.0%** |
| A1 median | 28.9% | 27.5% |
| A2 / B1 / B2 medians | unchanged | 19.6 / 20.8 / 23.1 |
| Texts above 45% | 4 | **0** |
| Heaviest text | 53.7% | 41.3% (a2-16) |

- The lexical-target gap loses 10 contextual noun candidates and 3 contextual verb candidates that only the removed sentences contained. Covered and pending-human counts are unchanged: 1,385 / 89 nouns and 134 / 1 frames.
- The 1,297 noun anchors and 134 frames are unchanged.

## Consequences

- The first texts are shorter and recycle the lesson's phrases. Every question is still answered by the same verbatim sentence.
- Some story detail is gone: Karim's age and studies, Hatem's hotel, Monastir, the grandfather. No question or exercise used it.
- The heaviest texts are now a2-16 (41.3%) and a1-02 (40.9%). Most unknown words in a1-02 are glossed beside the text, and a2-16 is a level-appropriate notice text. Both stay under the new ceiling and are left as they are.
- The answer-integrity audit picks evidence for its report with a lexical selector. For a1-04-rq3 it pointed to the wrong sentence before this change and still does. The learner is shown the authored locator, which is correct. This is recorded, not hidden.
- **P2-401 stays `partial`** for the human parts only: a human voice for the long inputs, and an independent review of suitability and rights.
