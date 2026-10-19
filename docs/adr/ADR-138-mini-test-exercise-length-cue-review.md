# ADR-138: No mini-test or exercise key is recognisable by length alone

- Status: accepted, 2026-10-19 (v246)
- Evidence tier: agent content edit, checked by measured gates. Not an independent German review, and not a signature.
- Owner delegation: «نفّذ ما يفيد المتعلم والصحيح».
- Follows: ADR-137 (reading and listening questions).

## Context

ADR-137 removed every visible length cue from reading and listening questions. A visible cue means the key is the unique longest option by at least 5 characters **and** at least 15% longer than the next option. ADR-137 left the other two kinds ratcheted at their measured counts: **88 mini-test items and 55 multiple-choice exercise items, 143 items in total**.

In these items the key is usually a full, correct German sentence that applies the lesson's rule. Most distractors were short, broken fragments such as «Tomaten ich.», «Nicht Termin.» or «Wann Wohnung frei du?». A learner can pick the only complete sentence without knowing the rule. The item then measures test-wiseness, not the grammar or the function it was written for.

Plainly lengthening the fragments was estimated at 700–900 B gzip. Only 628 B were left under the 1,275,000 B curriculum ceiling, and raising that ceiling is an owner decision.

## Decision

1. **Every one of the 143 items was rebuilt with a near-miss distractor**: an option of about the same length that reuses the key's own words. Repeated words compress well, so this costs little. Two patterns were used:
   - **Grammar items:** the same sentence with one word-order or morphology slip, so the learner has to apply the rule. Examples: a1-15-m4 «Wann ich kann die Wohnung besichtigen?» (verb position in a W-question), b1-09-e1 «…, indem schützen wir den Radweg.» (verb-final in an *indem* clause), b1-10-e1 «Statt neu kaufen, repariert sie das Gerät.» (*statt … zu*), a2-06-m1 «Können du bitte aufräumen?» (verb agreement).
   - **Function items:** a well-formed sentence that does the wrong job, so the learner has to judge the function and not the grammar. Examples: no deadline (b1-19-e6 «… ist die Datei irgendwann diese Woche fertig?»), blaming instead of describing (b1-04-e6 «… das zeigt, dass du unzuverlässig bist.»), overgeneralising (b2-09-e6 «In allen deutschen Teams …»), an ambiguous reference (b2-14-m1 «…der Termin und der Antrag. Dieser war leider unvollständig.», where both nouns are masculine), and a reversed dependency (b1-21-m5 «Teilnehmerliste startet nach Namenskarten.»).
   - Arabic-annotated keys keep Arabic distractors, and German keys keep German distractors.
2. **Five keys were shortened** where they said more than the rule needed. Each shortening also saves bytes:
   - b1-01-e6: the opening birth-year sentence was dropped.
   - b1-04-e6: «nächstes Mal» was dropped.
   - b1-19-e6: «spätestens» was dropped.
   - b2-06-e1: «zum Beispiel» was replaced by «etwa».
   - b2-04-e6: rephrased as «…, erhält die Leitung beide Optionen mit Kosten und Risiken.»

   Where the key was quoted in its `explanationAr`, the quote was updated in the same edit.
3. **Explanation integrity:**
   - A distractor quoted in its `explanationAr` was only lengthened by appending, so the quote stays a verbatim substring (for example a2-11-m1 «Buchen du mir» → «Buchen du mir ein Zimmer.»). The one exception is a2-06-m1, whose quote was rewritten together with the option.
   - Latin words named in an explanation stay present.
   - Explanation-quote exceptions are unchanged at 70, and the quote gate passes.
4. **Traps avoided while drafting:**
   - b2-24-m1 does not use «darum», because that would make the comma mandatory and create a second correct answer.
   - a2-06-e1 does not use «könnest», because it is a valid Konjunktiv I form.
   - No distractor differs from its key only in final punctuation, because the duplicate check folds punctuation.
   - b2-24-m3 does not offer «Wenn zwei Hauptsätze verbunden werden.»: a comma before *und* between two main clauses is optional, so a learner could defend it. The distractor is «Wenn und zwei einzelne Wörter verbindet.»
5. **Lexical coverage:** one draft removed the only controlled-practice use of «Alternativen» in b2-04 (`exercises[5]`), and the covered noun count fell from 1,503 to 1,502. The b2-04-e6 distractor now reads «…, beschweren wir uns und bieten keine Alternativen an.», and coverage is back to 1,503.
6. **Measured result** (`reports/lesson-quality-audit.json`):
   - Visible length cue: mini-test 88 → 0 and exercise 55 → 0. Reading and listening stay at 0.
   - Key is the unique longest: 345 → 260 items (27.6% → 20.8%). The audit's own `longestOptionIsKeyPct` went from 27.5% to 20.8%.
   - Key is the unique shortest: 63 items, unchanged. No edit made a key the shortest.
   - Answer positions are unchanged: A 319, B 302, C 305, D 324.
   - No duplicate options and no mixed-language option sets.
7. **Gates:**
   - `visibleLengthCueByKindMax` is now 0 for reading, listening, mini and exercise.
   - `longestOptionCuePctMax` went from 28 to 21.
   - `tests/unit/mcq-option-parallelism.test.ts` adds a test that no mini-test or exercise item in any lesson has a visible length cue or mixes Arabic and German options.
   - The handoff verifier pins the zero counts, the 21% ceiling and this ADR.
8. **Lexical inventory:** the new distractor words are contextual candidates only.
   - Noun candidates: 4,984 → 4,988. Verb-pair candidates: 1,303 → 1,308.
   - Covered (1,503 / 134) and pendingHuman (89 / 1) are unchanged.
9. **Budget and the generated Mini-Test mirror:**
   - `src/data/local-test-templates/*.ts` is a generated, drift-checked copy of every Mini-Test item (P2-355, ADR-123). It is not shipped to the client, but it sits in `src/data` and so counts in the curriculum source budget. Every Mini-Test edit therefore costs twice. With the mirror regenerated, the content edits came to 1,275,310 B, which is 310 B over the 1,275,000 ceiling.
   - The mirror was pretty-printed with 2-space indentation. `scripts/generate-local-test-templates.ts` now writes one lesson header and one question per line. The data is identical, `local:test:templates` still checks it byte for byte, and a review diff still shows one changed line per changed question. Indentation alone was about 3.0 KB gzip.
   - Result: curriculum gzip went from 1,274,372 to **1,272,322** of the 1,275,000 ceiling, leaving 2,678 B of headroom. The ceiling was not raised. No authored content was removed, moved or padded to get there.
   - While the budget was still tight, 34 distractors were trimmed. They were restored once headroom existed, because the longer versions keep the key from being the longest option.

## Not covered

- The 143 rewritten items are agent-written German. An independent German review of the changed options remains desirable. Reviewer cells stay empty, and no names are written.
- The 2,678 B of headroom come from a formatting change to a generated file, not from new budget. The ceiling decision stays with the owner.
- No P0/P1/P2 audit item changes state. P1-397 was already `implemented` and receives the new measurement. IDEA 397 is closed.
