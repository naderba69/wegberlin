# ADR-119 — External comparison with Menschen public samples (P1-92) and attributed OER import (P2-357)

**Status.** Accepted, 2026-10-17 (v228).

**Delegation.** The agent decided under the owner's explicit delegation in the conversation («نفّذ ما يفيد المتعلم والصحيح»; «كل ما تحتاج بشريًا ابحث ستجد مصادره»). This was not an independent human legal review.

**Evidence tier.** `source-verified-agent` (ADR-116).

## P1-92 — similarity check against the book

**Context.** `content-near-duplicate-v1` compared the internal corpus only. P1-92 stayed partial because no external reference text could be lawfully obtained.

**Decision.**
1. **Statutory basis.** § 44b UrhG (https://www.gesetze-im-internet.de/urhg/__44b.html) allows copies of *lawfully accessible* works for text and data mining, unless the rightsholder declares a machine-readable reservation. On 2026-10-17, `https://www.hueber.de/robots.txt` carried no such reservation. The copies must be deleted when no longer needed.
2. **Tool.** `scripts/compare-external-reference-corpus.ts`, policy `external-reference-comparison-v1`, core in `src/core/content-validation/external-reference-comparison.ts`.
   - It segments every German string reachable from `src/data/*.ts`: 19,780 unique segments.
   - It compares them with an external corpus, using the internal thresholds (score ≥ 0.84, token ≥ 0.82, order ≥ 0.65) plus a shared verbatim run of 7 tokens.
   - It refuses a corpus inside the repository, and the report stores only hashes, indices and scores.
3. **Run.** The reference was the publisher's own sample PDFs on shop.hueber.de:
   - Menschen A1.1 KB, lesson 1;
   - Menschen A1 KB, Leseprobe 2 (lesson 9);
   - Menschen B1 KB, Leseprobe 1 (lesson 1).

   They were transcribed to `/tmp` (177 segments). Gaps in the book stayed gaps. The copies were deleted after the run. Pirated full copies found online were deliberately not used.
4. **Result.** 0 matches. The closest pair scores 0.4933, and it is a generic exercise rubric. Unit tests inject an exact copy, a close paraphrase and a long verbatim run; all three are detected.

**Consequences.**
- P1-92 is `implemented`. `content-originality-review-registry.ts` records the corpus, with `matchCount:0`.
- **Copyright clearance stays pending.** The coverage is 3 sample lessons, about 12 pages. A full-book comparison needs a copy the owner lawfully holds: run the same script on it, then delete the copy.

## P2-357 — import licensed OER with attribution

**Context.** The licence gate and the attribution line existed, but every register record was rejected, and no importer existed.

**Decision.**
1. **Licence versions.** The pages themselves were checked on 2026-10-17:
   - **Grimm Grammar** (home, credits, site index, topic pages) shows a CC BY 4.0 badge.
   - **Deutsch im Blick** (home page) shows the same badge.

   This settles the version that was unverified on 2026-10-08. G-FOL shows no version and quotes DWDS examples, so it stays rejected.
2. **Data and importer.**
   - `src/data/oer-register.ts` is the machine-readable register.
   - `src/core/oer/importer.ts` (`oer-attributed-reference-import-v1`) imports only gate-approved records. It rejects URLs outside the licensed source, duplicates, and items without a review record.
3. **Bounded first import.** 21 Grimm Grammar topic pages (titles taken from the official site index) are linked from the matching terms in the bilingual grammar glossary.
   - Each link carries the full attribution: author, title, source, licence and its URL, and check date.
   - No text is copied, and the links are marked as English explanations.
   - Three terms with no matching page stay unlinked.

**Consequences.**
- P2-357 is `implemented`. Importing actual text or media from OER-03 or other sources needs a separate decision per item. OER-03's videos show recorded people.

## Counts after this ADR

- P1: 133 implemented, 2 partial (331, 380).
- P2: 135 implemented, 5 partial, 2 not implemented.
