# Online source check — lexical review packet (2026-10-09)

**Status: evidence only. This is NOT a human review and NOT a closure.**

Per `P0_AUDIT.md` (closure rule, around line 139), no human-review item (P0-98, P0-99, P1-380 — 3,277 governed records) may be closed by automation. The records below are machine-assisted source checks prepared for a qualified German reviewer. No reviewer fields (`reviewDecision`, `reviewerName`, `reviewerQualification`, `reviewDate`, `reviewerNote`) were filled in `unresolved-candidates.csv`, and no P0/P1 item was closed.

Scope: the 93 `pending-human` items in `unresolved-candidates.csv` — 89 nouns and 4 verb-preposition frames, all in B2 lessons b2-21 to b2-24.

## Sources used

| Source | Access | Used for |
|---|---|---|
| Wiktionary-derived noun list, `german_nouns` 1.2.5 (PyPI wheel, WiktionaryDE, CC BY-SA 4.0) | local, `/tmp/gn/nouns.csv` (not stored in the repo) | genus lookup, 89 nouns |
| DWDS, `https://www.dwds.de/wb/<Lemma>` | fetched 2026-10-09 | headword, Wortart, genus, plural, corpus examples |
| Duden, `https://www.duden.de/rechtschreibung/<Lemma>` | fetched 2026-10-09 | returned HTTP 404 page for Audioaufnahme and Fristversäumnis — **inconclusive, not used as evidence** |

## 1. Noun check — summary (`online-source-check-nouns-2026-10-09.csv`)

Output of `check_nouns.py` (copy of `/home/user/lexical-check/noun-check.csv`):

- 73 agrees — the authored article matches the Wiktionary-derived genus (machine agreement only; not individually re-verified in DWDS here).
- 11 lemma-not-in-Wiktionary-list — checked on DWDS below.
- 5 flagged discrepancies — triaged as artifacts, not real discrepancies: Mittel (plural article "die" for "die Mittel"), Freitag and Montag (the "die" belongs to a neighbouring noun), Protokoll (same neighbouring-noun cause), Daten (plural of Datum; the lemma match "Date" is a wrong stem match). The flagged rows remain in the CSV unchanged.

## 2. The 11 lemmas missing from the Wiktionary list — DWDS results

| # | Lemma | Authored article(s) | DWDS result | Assessment |
|---|---|---|---|---|
| 1 | Audioaufnahme | die | Not in DWDS contemporary lexical sources (corpus-only). Duden 404. | **NOT CONFIRMED** by any lexicon checked. Needs a second source or human decision. |
| 2 | Nachbesserung | die | Substantiv (Femininum), Nom. Pl. Nachbesserungen | Confirmed (DWDS). Article "die" consistent. |
| 3 | Eltern | der | Substantiv, "wird nur im Plural verwendet" (plural only) | Confirmed (DWDS). "der" = genitive plural, consistent. The record should state that the lemma is plural-only. |
| 4 | Fristversäumnis | der; die | Not in DWDS contemporary sources. Machine-generated entry lists both Femininum and Neutrum. Duden 404. | **NOT CONFIRMED.** Genus is conflicting (authored "der;die"; DWDS machine data gives both f and n). Needs a human decision. |
| 5 | Gebührenbefreiung | die | Substantiv (Femininum), Nom. Pl. Gebührenbefreiungen | Confirmed (DWDS). Article "die" consistent. |
| 6 | Nachfrist | der | Substantiv (Femininum), Gen. Sg. Nachfrist, Nom. Pl. Nachfristen | Confirmed (DWDS). "der" = genitive singular, consistent. |
| 7 | Studierendensekretariats | des | Lemma "Studierendensekretariat" not in DWDS headwords. Machine-generated Neutrum only. Corpus examples in Die Zeit (2013) and SZ (1999) use "des Studierendensekretariats" / "des Studierendensekretariates". | **PARTIAL.** Neuter is supported by corpus use and the auto-generated entry, but no curated lexicon headword. Lemma normalization to "Studierendensekretariat" needs confirmation. |
| 8 | Stundung | die | Substantiv (Femininum), Nom. Pl. Stundungen | Confirmed (DWDS). |
| 9 | Versäumnis | das | Substantiv (Neutrum), Gen. Sg. Versäumnisses, Nom. Pl. Versäumnisse | Confirmed (DWDS). |
| 10 | Nachforderung | die | Substantiv (Femininum), Nom. Pl. Nachforderungen | Confirmed (DWDS). |
| 11 | Zurückstellung | die | Substantiv (Femininum), Nom. Pl. Zurückstellungen | Confirmed (DWDS). |

Tally: 8 confirmed (DWDS headword), 1 partial (Studierendensekretariat), 2 not confirmed (Audioaufnahme, Fristversäumnis).

## 3. Inflected surfaces listed as candidates (open item b)

The packet lists some inflected surfaces as candidates (Antrags, Bescheids, Attests, Kandidaten, Zahlen, Seiten, Unterlagen, Daten). Lemma normalization is not confirmed by this check. For example, Antrags → Antrag, Bescheids → Bescheid, Kandidaten → Kandidat, Zahlen → Zahl, Seiten → Seite, Unterlagen → Unterlage. These need a human decision on whether the record should carry the lemma or the surface form.

## 4. Verb-preposition frames (4 pending)

Verb frames were not in the Wiktionary noun list, so they were checked against DWDS and by reasoning.

| Candidate | Lesson | Assessment |
|---|---|---|
| sich erinnern + an | b2-21 | **Confirmed.** DWDS "erinnern" lists ⟨sich an etw., jmdn. erinnern⟩ (Bedeutung 1a) and ⟨jmdn. an etw. erinnern⟩ (Bedeutung 2). |
| bitten + zu | b2-24 | Detector false positive. "zu" marks an infinitive (bitten, zu + Infinitiv), not a preposition frame. Not checked against a dictionary. |
| einreichen + zu | b2-24 | Detector false positive. Same cause. Not checked against a dictionary. |
| konnten + zu | b2-24 | Detector false positive. Same cause. Not checked against a dictionary. |

Recommendation only: treat the three false positives as structural exclusions, and record `sich erinnern + an` as confirmed by DWDS. **No exclusion has been applied to the packet.** Applying an exclusion changes the classification, which requires a decision from the user (per the standing instruction not to reclassify without asking).

## 5. What this does NOT show

- It is not a German-language review by a qualified reviewer. No item is reviewed.
- Wiktionary and DWDS confirm lexicon presence and genus. They do not confirm the pedagogical choice of target, the frame quality, or the level assignment (P0-99 frame quality targets, P1-380 speech evaluation).
- No P0-98, P0-99, P1-380 item is closed by this file.

## 6. Open items

1. Second source or human decision for Audioaufnahme and Fristversäumnis (genus conflict).
2. Confirm lemma normalization for Studierendensekretariat, and for the inflected surfaces in section 3.
3. Decide whether the three verb false positives become structural exclusions (user decision).
4. Independent qualified German reviewer for the 3,277 governed records and the speech evaluation. Still OPEN.
