# ADR-120 — Authored reading-evidence locators (P0-124) and opt-in anonymous response contribution (P2-350)

- Status: accepted — 2026-10-17 (v229)
- Evidence tier: agent semantic review under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). For P2-350 the tier is `source-verified-agent` (GDPR Recital 26; Art. 29 WP Opinion 05/2014). **Neither part is an independent human German review or a data-protection officer's opinion. Reviewer fields stay empty.**

## Context

**P0-124.** After a learner commits a reading answer, the app shows "where the evidence is". Until now `reading-evidence-grounded-v1` picked that sentence by lexical overlap between the correct option, the question and each sentence. The audit row asked for authored evidence positions per question, "so that lexical matching does not choose a sentence that is formally right but semantically weak". 246 of the 288 reading explanations also cited the lexical sentence ("ارجع إلى «…»") with the internal marker `FEEDBACK_DISCLOSURE_MARKER` ("موضع الرجوع آلي ويحتاج مراجعة دلالية مستقلة").

**P2-350.** The local calibration panel (`anonymous-item-calibration-v1`) already read a two-column `itemId,correct` CSV. The remaining gap was "opt-in collection of anonymous data, which needs a human decision and a privacy review". The app has no server, and adding one would break ZERO_COST and the local-first contract.

## Decision

### P0-124: authored locators

1. `src/data/reading-evidence-locators.ts` (`reading-evidence-authored-v1`) gives every one of the **288** reading questions in 96 lessons a locator `{ relation, quotes[] }`.
   - Each quote is a **verbatim span** of `lesson.reading.textDe`. Tests enforce exactly one occurrence, in text order.
   - It was chosen by reading the question, all four options and the whole text.
2. The relations are:
   - `direct`: 113
   - `paraphrase`: 80
   - `combined`: 86. Two or three spans, such as referent plus fact, plan plus reason, or one condition per option.
   - `computed`: 6. For example, *acht Uhr* ↔ 8:00.
   - `inference`: 2. b2-20-rq2 is a word-order rule shown by the example sentence. b2-21-r3 shows that correct indirect speech can still carry a false attribution.
   - `exclusion`: 1. a2-08-rq1: the absent task is proven by the complete task list.
3. Compared with the lexical selector, **192** were kept, **72** were completed (the lexical sentence held only part of the evidence) and **24** were replaced (wrong or missing sentence). Examples:
   - a1-01-rq2 quoted Omar's polite question instead of "Sie ist die Lehrerin."
   - a1-15-rq2 had no evidence at all.
   - a2-21-rq1 quoted the four-week test instead of the four weekdays.
   - b1-19-rq2 quoted Ben's misunderstanding instead of the clarification.
   - b2-18-rq3 quoted the opening instead of "zweimal sei die Fügung amtlich, dreimal werde sie Füllstoff."
4. `selectReadingEvidence` returns the authored locator first.
   - The lexical selector stays only as a fallback for questions without a locator, or when a span no longer occurs in an edited text.
   - The UI shows every span as its own `<q>` with a relation-specific Arabic label. These labels contain no Latin tokens.
5. The 246 explanation citations now quote exactly the authored spans, so the internal marker was removed from all of them. The rule "marker on every mechanical reference" still holds, and the number of mechanical references is now 0. `lesson-teaching-contract.test.ts` enforces equality with the locators.
6. Full table: `reports/reading-evidence-review/READING_EVIDENCE_REVIEW_2026-10-17.csv` (288 rows: id, prompt, correct option, relation, authored spans, former lexical sentence, change).

### P2-350: opt-in contribution without a server

1. "Collection" means the learner deliberately downloads `anonymous-answers.csv` from the settings panel and hands it to a teacher. The teacher pools many files in the same panel, which now accepts multiple files.
2. The export is off by default. The button stays disabled until the learner ticks a consent text that lists what is excluded.
3. Data minimisation (`anonymous-response-export-v1`):
   - only `itemId,correct`;
   - only the **first attempt** per item;
   - item IDs restricted to `[A-Za-z0-9._-]`;
   - rows shuffled with `crypto.getRandomValues`;
   - no answer text, time, confidence, profile, device or lesson progress;
   - nothing is sent automatically.
4. Because one learner contributes at most one row per item, the existing 30-response floor means **at least 30 distinct learners per reported item**. This is aggregation / k-anonymity in the sense of Art. 29 WP Opinion 05/2014 §3.2.1.
5. The results still never change an item, score, level or gate.

## Sources (P2-350, checked 2026-10-17)

- GDPR Recital 26 (https://gdpr-info.eu/recitals/no-26/):
  - The principles do not apply to anonymous information, "including for statistical or research purposes".
  - Identifiability is judged by "all the means reasonably likely to be used, such as singling out".
- Article 29 Working Party, Opinion 05/2014 on Anonymisation Techniques, WP216 (https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf):
  - It names three risks: singling out, linkability and inference.
  - Aggregation / k-anonymity prevents singling out within groups of k, but "does not prevent any type of inference attack".

## Limits stated in the product, not hidden

- A teacher who receives a single file directly knows who sent it. Such a file is minimised, not anonymous. Anonymity in the Recital-26 sense arises only after pooling with the sender association discarded.
- An item that every pooled learner got right, or every pooled learner got wrong, reveals each learner's answer. This is the inference risk that k-anonymity does not remove. Both limits are shown to the learner beside the consent box.
- The reading locators are an agent's semantic judgement under delegation. An independent German reviewer may still disagree on individual spans. The CSV makes every decision checkable.
- P1-380 is not touched by this ADR. Calibration on real Arabic learner recordings cannot be replaced by sources.

## Consequences

- P0 = **121/124 implemented, 3 partial** (135, 255, 301).
- P2 = **136/142 implemented, 4 partial** (264, 371, 400, 401), **2 not implemented** (359, 360).
- Next ADR number: ADR-121.
