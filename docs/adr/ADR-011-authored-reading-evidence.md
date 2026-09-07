# ADR-011: authored evidence positions for reading questions

Date: 2026-09-05 · Status: accepted (partial — no human German review yet)

## Context

P0-124 asks that a reading answer show the sentence in the text that justifies it. The
shipped implementation chose that sentence by **lexical matching**: score every sentence by
how many content words it shares with the correct option (×3) and with the prompt (×1), and
take the best score. That is cheap and never empty, but it optimises for surface overlap, not
for being the place where the answer is actually established. A sentence can win because it
mentions the option's noun while the sentence that states the fact scores lower.

Anything that "picks the most similar sentence" has this failure mode. The fix is not a
better scoring function — it is an authored position per question.

## Decision

1. `src/data/reading-evidence.ts` — a table of **252 rows**, one per published reading
   question: `[questionId, sentenceIndex, whyAr, relation?]`. `sentenceIndex` is an index into
   the lesson's own reading text under the shared splitter
   `splitGermanSentences` (`/(?<=[.!?])\s+|\n+/`), so the position is stable and testable.
   `whyAr` is a short Arabic justification of why that sentence is the evidence.
2. `src/data/reading-evidence-index.ts` resolves each index into a verbatim quote and measures
   coverage (`readingQuestions`, `authoredReadingEvidence`, `inferenceReadingEvidence`,
   `readingQuestionsWithoutEvidence`, `unverifiedReadingEvidence`).
3. `relation: "inference"` (23 rows) declares the cases where no content word can be shared:
   numbers written out in words (`um acht Uhr` vs the option `08:00`) and options that
   paraphrase the sentence with synonyms (`Regen und Wind` vs `regnen und windig`). Declaring
   them keeps the remaining 229 rows under a strict lexical contract instead of loosening the
   rule for everything.
4. `readingEvidenceMap` returns the authored position (`origin: "authored"`) and falls back to
   the old matcher (`origin: "auto"`) only for a question with no authored row. The validator
   forbids that state in a published lesson, so the fallback is a safety net, not a code path
   learners hit.
5. The panel renders the quote plus its Arabic justification and labels the fallback explicitly
   as an unreviewed lexical match if it ever appears.

Validator consequences: every published reading question must have an authored position; the
resolved quote must be a verbatim sentence of that lesson's reading text; every row needs an
Arabic justification; and a `direct` row must share a content word with the prompt or the
correct option.

## Consequences

- The evidence shown to learners is now a claim someone made about the text, and that claim is
  checked: verbatim presence, and lexical relatedness unless declared otherwise.
- Measured difference: the authored position disagrees with the old lexical matcher in **46 of
  252 questions**. Those 46 are the concrete size of the problem this ADR closes.
- Cost: the table is content. Adding or renumbering sentences in a reading text can invalidate
  an index, and the validator will say so at build time rather than silently showing the wrong
  sentence.

## Known limits

- The positions are authored by reading each text; they are **not** reviewed by a German
  teacher, and a wrong-but-plausible position still passes every automated check.
- 23 rows rest on a declared inference; the declaration documents the relation, it does not
  prove it.
- Sentence splitting is punctuation-based: German dialogue with `„…“` can split inside a
  quotation, so an index may point at a fragment. The quote is always verbatim, so the
  displayed evidence is never corrupted — only sometimes shorter than a full sentence.
