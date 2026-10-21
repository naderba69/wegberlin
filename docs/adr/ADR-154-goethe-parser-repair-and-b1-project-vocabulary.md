# ADR-154: Repair of the Goethe word-list parser, and project-work vocabulary for b1-24

- Status: accepted, 2026-10-21 (v263)
- Owner instruction: «واصل» after the v262 report. Standing instruction: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Ceilings: no change. The batch fits under the curriculum safety ceiling of ADR-152 (1,343,000) and the JavaScript ceiling of ADR-141 (2,205,000).
- Evidence tier: agent edit of a measuring tool and of content, checked by a line-by-line diff of the parser output, by measured gates and by a WiktionaryDE source check of every new noun. Not an independent German review, and not a signature.
- Follows: ADR-153 (full recount of A1 and B1 from the SHA-pinned PDFs), ADR-139 (parser and comparison script), IDEA 407 and `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.

## Context

1. After ADR-153 the full recount listed 327 B1 headwords as absent from every lesson. Before filling them, every absent word was checked against its line in the PDF.
2. 21 of the 327 were not real gaps but faults of `scripts/parse-goethe-wortliste.py`, which groups the words of a PDF column into lines by their vertical position. The same faults hid real headwords, four of which are absent for real (duzen, tippen, treiben, anhaben):
   - **Two headwords on one printed line.** „die Dusche, -n duzen, duzt, duzte, hat“ + „geduzt“ became one entry „die Dusche“ and one fake headword „geduzt“. The verb duzen was not in the list at all. The same happened to baden, fließen, lachen, leben, legen, nähen, singen, sollen, sparen, tippen and treiben (12 fake participles in the absent list), and to finden, landen, lernen, liefern, prüfen, sterben, fahren, sitzen, parken, senden and gewöhnen, whose participles counted as present or, for „gelandet“ and „gesendet/gesandt“, as first taught in B2.
   - **A complete verb entry after another headword.** „das Haar, -e haben, hat, hatte, hat gehabt“ was one entry, so haben was missing; likewise sein (after die Seife), tun (after das Tuch), anhaben (after ängstlich) and vorhaben (after vorgestern).
   - **Breaks and glue.** „Portemonnaie/Port-“ + „monee“ (a fake headword „monee“), „die Rezeption/Reception, -“ + „en“, „der Zeitpunkt, -“ + „e“, „sicherkälten,“ (sich erkälten), „dieWissenschaftlerin“, „der Pensionist, -en / die“ + „Pensionistin, -nen (A)“.
   - **Regional marks on the feminine line.** der Abwart, der Coiffeur and der Fleischhauer are Swiss or Austrian words, but the mark (CH) or (A) stands on the next line, at the feminine form, so the masculine entry counted as a standard word.
   - **Word-formation headwords.** „Kriminal-“, „Not-“, „un-“, „Elektro-“, „ober-“ … end in a hyphen. A whole-word match can never find them.
3. b1-24 (the closing B1 project: research question, data, result, limits, next steps) was the last B1 lesson without a vocabulary e8. Its topic, and the public book swap that learners plan in its free-production task, fit a group of absent words about project work.
4. ADR-153 found five words that the v257 rewrites had removed from every lesson: beruhigen, gelegt, ärgerlich, übrigens and der Einfluss. With the parser repaired, „gelegt“ is the verb legen again, and legen occurs in the lessons („legt“, 14 times).

## Decision

### 1. Parser repair (measurement)

`scripts/parse-goethe-wortliste.py` keeps its line grouping and gets a post-processing step `repair()`:
- A participle line that follows a verb line ending in „hat“, „ist“, „ist/hat“ or „hat/ist“ is joined to the verb. If a headword stands before the verb on the same line, it is split off first. Participles with a slash („gesendet/gesandt“), with two words („zu gewesen“, „bekannt gegeben“) or with a regional note („geparkt (D, A) → CH: parkieren“) are included.
- A headword printed before a complete verb entry is split off. Not when the head word recurs in the verb forms, because then it is one phrasal headword („bekannt geben, gibt bekannt“, „leid tun, tut leid“). „sich“ is never a head.
- A plural ending alone on a line („e“, „en“, „n“, „er“, „s“, „se“, „ne“, „nen“) is joined only to an entry that ends in „, -“.
- A hyphen break is joined only after a capitalised variant fragment („/Port-“), never after a lowercase prefix marker („früher/früher-“, „hinter/hinter-“).
- A dangling „/ die“ is joined to the next line; „sicher…,…sich“ and „die/der/das“ glued to a noun get their space back.
- A masculine entry directly followed by its regional feminine line shares the regional mark. Only masculine entries: „die Pension“ and „die Schule“, followed by regional words with the same first letters, stay standard.
- Entries ending in „-“ are marked `prefix`.

`scripts/compare-goethe-wordlists.ts` gets `PREFIX_FORMS`, used like the existing `BOUND_FORMS` and only for entries without an article:
- elektro (not elektronisch), inner, ober, vorder, mittler (only inflected forms such as „mittlere“, not „mittlerweile“), kriminal (not Kriminalität), spezial (not Spezialist), not (only listed compounds such as Notruf and Notausgang), öko (not ökonomisch), rauf.
- „un-“ counts only through a token un + a word that itself occurs (unklar / klar), never unter-, unser-, und or uns.

Every rule was checked by diffing the full A1 and B1 parse before and after. The first drafts had five misfires, all found in the diff and fixed before any count was used:
- the plural rule joined real headwords („das Abenteuer, -“ + „aber“, „der Kalender, -“ + „kalt“, A1 „dein-“ + „denn“);
- the hyphen rule joined prefix markers („früher/früher-“ + „frühstücken“);
- the reflexive rule split „sicher“ into „sich er“;
- the regional pairing marked „die Pension“ and „die Schule“;
- the line split cut „sich“ off reflexive verbs („sich bedanken“).

A sixth fault was found in the counts: „Öko-“ counted as present through „ökonomischen“ in a B2 lesson. Öko- means ökologisch, so ökonom… is excluded. A1 keeps its 691 entries and its counts (669/670, 559 taught); the first draft of the plural rule had cost it two entries.

Deliberately not changed:
- Billett and Tram carry no regional mark in the PDF text. „→ D, …“ cross-references also stand at standard words (Fahrrad, Lift, Karotte, Brieftasche), so they cannot mark a word as regional.
- A noun and a verb with the same spelling count once, as since v248 (essen / das Essen). With the verb leben now in the list, das Leben and leben count as one headword.
- ankündigen and auffordern were missing but in neither list, because they occurred only in B2 lessons and only in split form („kündigt … an“), which the first-level lookup cannot see. This gap is older than v263; both are now taught in b1-24.
- A2 cannot be re-parsed: no copy of the pinned A2 PDF (`c9ca0c96…`) was found. A2 shows 1136/1136, but verbs hidden behind their participle in the same way would not be visible there.

### 2. Project-work vocabulary in b1-24 (content)

24 words, each a vocabulary-stage phrase and a review card with a full German example sentence, most of them set in the book swap of the lesson's free-production task. Both are appended, so no stored card ID moves.
- Research and ideas: die Recherche, der Einfall, einfallen, die Anleitung.
- Preparation: ankündigen, auffordern, die Aufforderung, besorgen, anschaffen, vergrößern.
- State of things: der Zustand, ordentlich, durcheinander.
- Reach: zahlreich, weltweit, regional, populär, die Tradition.
- Time and talk: kürzlich, nochmals, übrigens.
- Evaluation: ärgerlich, beruhigen, der Einfluss.
- Examples: „Mir ist eine bessere Lösung eingefallen.“, „Viele Bücher waren noch in einem guten Zustand.“, „Das Wetter hatte einen großen Einfluss auf die Zahl der Besucher.“

One matching exercise `b1-24-e8` with five pairs (die Recherche, einfallen, der Zustand, übrigens, ärgerlich), aligned to objective 1 in `objective-item-alignment.ts`. The right side of each pair is the gloss the card teaches, and the German quoted in the explanation stands verbatim in the cards.

Grammar records: 7 nouns get lesson-scoped anchors appended at the end of `goetheCoreNounSeeds` (Recherche, Einfall, Anleitung, Aufforderung, Zustand, Tradition, Einfluss), with their own scope label `ADR-154-goethe-b1-themes-5-noun-anchor`. Source check with `scripts/verify-question-support-nouns.py` against WiktionaryDE via `german_nouns` 1.2.5: **7 of 7 confirmed**. Evidence: `reports/lexical-review-packet/source-verification-goethe-b1-themes-5-nouns-2026-10-21.csv`, guarded by `tests/unit/goethe-b1-themes-5-vocabulary.test.ts`.

No new pending review item: the lexical inventory diff before and after the batch has 21 new noun rows (7 covered by the anchors, 14 context-only words of the examples such as Beamer, Bibliothek, Website) and 7 new verb rows, all not-target. No row was removed. Pending stays 89 nouns + 1 verb.

## Audit of the batch (corrections made before commit)

- **e8 explanation.** The draft said that with einfallen the person "comes at the start of the sentence". That is not a rule („Plötzlich ist mir … eingefallen“ is also correct). It now says the person comes as mir or dir and the past tense uses ist.
- **Parser rules.** The five misfires and the Öko- false match listed above.
- **Guard.** `tests/unit/goethe-reference-report.test.ts` now also checks that no parser artifact is listed as a missing word, that the hidden verbs are real headwords, that the four regional masculine entries are excluded, and that Öko-, Elektro-, inner-, ober-, vorder- and Spezial- stay absent while Kriminal-, Not- and un- count.

## Results

| Measure | v262 (published) | v263, parser repair only | v263 with b1-24 |
|---|---|---|---|
| B1 headwords | 2,830 | 2,823 | **2,823** |
| B1 appearing up to B1 | 2,352 (83.1%) | 2,366 (83.8%) | **2,390 (84.7%)** |
| B1 taught explicitly | 1,890 (66.8%) | 1,907 (67.6%) | **1,931 (68.4%)** |
| B1 absent from every lesson | 327 | 310 | **289** |
| B1 first taught in B2 | 149 | 145 | **144** |
| A1 | 669/670, 559 taught | unchanged | **unchanged** |

- Absent 327 → 310: 21 faults left the list (12 fake participles, monee, sicherkälten, dieWissenschaftlerin, der Coiffeur, der Fleischhauer, der Pensionist, and the prefix entries Kriminal, Not and un, which now count), and 4 real verbs entered (duzen, tippen, treiben, anhaben): 327 − 21 + 4 = 310. First taught in B2 149 → 145: der Abwart, en, gelandet and gesendet/gesandt left.
- Headwords 2,830 → 2,823: 34 fake or broken entries removed (gebadet, geduzt, … monee, sicherkälten, en, e, the four regional masculine entries, das Leben merged with leben) and 27 real ones added (baden, duzen, erkälten, fahren, finden, fließen, haben, landen, leben, legen, lernen, liefern, nähen, parken, prüfen, sein, sitzen, sollen, sparen, sterben, tippen, treiben, tun, anhaben, vorhaben, Portemonnaie/Portmonee, die Wissenschaftlerin): 2,830 − 34 + 27 = 2,823.
- The batch made exactly its 24 words appear: 21 left the absent list, der Einfluss left the B2 list, and ankündigen and auffordern were the two unlisted ones. 289 + 144 = 433 = 2,823 − 2,390.
- Das Zeug is still counted falsely (ADR-152), so the real B1 figure is at most **2,389**.

| Measure | v262 | v263 |
|---|---|---|
| Noun anchors | 2,044 | **2,051** |
| Lesson exercises | 746 | **747** |
| Governed content records | 3,346 | **3,347** |
| Search entries | 4,703 | **4,727** |
| Curriculum (gzip) | 1,336,274 | **1,337,972** (5,028 B left under 1,343,000) |
| JavaScript (gzip) | 2,171,803 | **2,173,601** (31,399 B left under 2,205,000) |
| Unit tests | 1,751 in 257 files | **1,757 in 258 files** |

Gates: `npm run check` EXIT=0 (lint, typecheck, unit, handoff, dependency audit, build, browser accessibility 642/0, contrast 323 pages / 0 below minimum) and E2E 134/134 (67 desktop + 67 mobile) in the first run. Offline fingerprint `a3745bf54b40`, full pack 6,572,429 B gzip. Pack generation v263.

## Consequences

- All 24 B1 lessons now have a vocabulary e8; 70 of the 96 lessons have a Goethe matching e8.
- The remaining B1 gaps are 289 headwords absent from every lesson and 144 first taught in B2. The absent list now holds real words only (apart from the unmarked Billett and Tram), grouped by theme in `docs/GOETHE_REFERENCE_ALIGNMENT_AR.md`.
- The figures of v248–v262 stay in their documents as published. They were measured with the old parser, so they are not directly comparable with v263.
- The curriculum ceiling has room for about one more small batch; a larger one needs the same recorded decision as ADR-152.
