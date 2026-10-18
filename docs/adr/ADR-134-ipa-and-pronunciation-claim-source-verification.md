# ADR-134: Source verification of every IPA transcription and of the 18 Arabic-learner pronunciation claims (P1-380)

- Status: accepted, 2026-10-18 (v242)
- Policy IDs: `ipa-dictionary-source-verification-v1`, `arabic-learner-pronunciation-source-check-v1`
- Evidence tier: `source-verified-agent` (ADR-116), under the owner's instruction «كل ما تحتاج بشريا ابحث ستجد مصادره». This is not an independent phonetician's review. The inventory `reviewStatus` stays `authored-review-pending`.

## Context

The open part of P1-380 included an "independent phonetics review". Much of that question can be settled with published sources: (a) are the written transcriptions correct, and (b) are the Arabic-learner difficulties we name documented? Two things cannot be settled from sources: hearing real Arabic-speaking learners, and calibrating against their recordings.

## Decision

1. **Dictionary check of all 601 distinct transcriptions.** This covers the lesson pronunciation items, the 44 contrast-pair sides, and the 36 inventory sides.
   - **Source:** `open-dict-data/ipa-dict` `data/de.txt`, from `devio-at/german-ipa-dict`, which is extracted from de.wiktionary and licensed CC BY-SA.
   - **Pinned version:** commit `43c3570e…`, SHA-256 `d36d11db…`.
   - **Script:** `scripts/verify-ipa-against-dictionary.ts`. The dictionary is not vendored.
   - **Matching:** exact match; then notational variants (tie bars, ʔ, ɐ̯/ɐ, n̩/ən, r/ʁ, ɔʏ/ɔɪ, final -ig as [ɪç] or [ɪk]); then fragments of `…` partial transcriptions; then stress, weak-form or assimilation variants.
   - **Mismatches:** 17 rows needed a recorded decision in `manualIpaDecisions`. Four are intonation arrows, which are out of scope. The rest were lookup artefacts (capital SS, English homographs, broken entries) or deliberate emphasis stress. `womit` [voˈmɪt] was confirmed on de.wiktionary.
   - **Evidence file:** `reports/pronunciation-source-verification/IPA_SOURCE_VERIFICATION_2026-10-18.csv`.
2. **Corrected transcription errors found by the check** (11 item edits; 17 with the notation fixes below):

   | Word | Was | Now |
   |---|---|---|
   | notiere | [noˈtsiːʁə] | [noˈtiːʁə] |
   | jedoch | [jɛˈdɔx] | [jeˈdɔx] |
   | also | [ˈalzoː] | [ˈalzo] |
   | Komma | [ˈkoma] | [ˈkɔma] |
   | des | [deːs] | [dɛs] |
   | ausgewertet | [ˈaʊ̯sɡəvɛʁtət] | [ˈaʊ̯sɡəˌveːɐ̯tət] |
   | allerdings (×2) | [ˈalɐdɪŋs] | [alɐˈdɪŋs] |
   | unsicher | [ʊnˈzɪçɐ] | [ˈʊnˌzɪçɐ] |
   | Telefonnummer | [teleˈfoːn…] | [teləˈfoːn…] |
   | telefoniert | [telefo…] | [teləfo…] |

   In addition, four transcriptions used the plain trill symbol r where the app's convention is ʁ (Zentrum, Prüfungszentrum, Gebührenordnung, Nachforderung), and two used deːɐ instead of deːɐ̯. These were aligned to the convention.
3. **Published sources for the 18 Arabic-learner claims.** `src/core/pronunciation/arabic-learner-claim-sources.ts` records the sources for each row:
   - Schulte-Bunert 2018 (fetched)
   - El Baghdadi 2013, ProDaZ UDE
   - Wikibooks "Arabisch: Schrift und Aussprache" (fetched)
   - HfH Interferenzen Arabisch
   - Rehman et al. 2022, LTR (an English-L2 analogy)
   - Kuzminykh 2017
   - ZIF (general DaF)

   The access mode of each source is marked as `fetched` or `search-excerpt`. Outcome:

   | Support level | Rows |
   |---|---|
   | Supported | 10 |
   | Partially supported | 3: ich vs [s], ts vs z, ɔ vs oː |
   | General DaF difficulty, not Arabic-specific | 3: the prosody rows |
   | Revised to positive transfer | 2 (below) |

   - **The two revised rows:**
     - Arabic has both ه and ء, so the h/Ø row now presents the contrast as a help.
     - Arabic has long/short a, i, u, so the vowel-length row now places the difficulty in reading length from German spelling.
   - **Sourced hint added to the r row:** Ġain is described as "Zäpfchen-r", and the Arabic tongue-tip r stays acceptable.
4. **Guard.** `tests/unit/ipa-source-verification.test.ts` fails when:
   - any transcription shown to learners is missing from the evidence CSV, so an edit must be re-verified;
   - a mismatch has no recorded decision;
   - a corrected error reappears;
   - an inventory row lacks sources.

## Consequences

- P1-380 is narrower now. The written-transcription and claim-source parts of the "phonetics review" are closed at the `source-verified-agent` tier.
- **Still open:**
  - an independent phonetician;
  - calibration on real Arabic-speaker recordings;
  - the three guided-only rows. TTS still cannot produce them faithfully in a lesson that teaches them (both r variants, final devoicing in a minimal pair, which is a homophone pair, and contrastive sentence focus).
- No pronunciation score or phonemic assessment is claimed.
