# ADR-144: Audit the remaining B1 and B2 vocabulary and guard all 96 lessons

- Status: accepted, 2026-10-20 (v253)
- Owner instruction: «واصل» after v252, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Evidence tier: agent audit (automatic guard plus a full manual reading), checked by measured gates. Not an independent German review, and not a signature.
- Follows: ADR-143 (v252), which audited the 53 lessons that received Goethe words.

## Context

ADR-143 guarded only the 53 lessons that had received Goethe vocabulary. The other 43 lessons (19 in B1, all 24 in B2) had never been checked for the same problems. When the guard was run over them as a measurement, it reported 65 problems. A manual reading of their 451 cards (191 B1, 260 B2) found further weak examples that the guard could not see.

## Findings and fixes

1. **59 meanings aligned.** The same German had one Arabic meaning on the vocabulary page and another on its card. Each pair now uses the more accurate of the two, identical on both surfaces. Real errors among them:
   - b1-04 «eine Frist vereinbaren» was «يتفق على موعد» on the page; a Frist is a deadline, so both surfaces now read «يتفق على مهلة».
   - b2-07 «offenlegen» was «ينشر» (publish); it now reads «يكشف» (disclose).
   - b2-12 «den Aufgabenvertrag sichern» was the opaque «يثبت عقد المهمة»; it now carries the card's explanation.
2. **18 b2-19 phrases now translated.** The modal-particle lesson glossed every phrase with a description of its tone only (for example «Kommen Sie doch vorbei!» → «دعوة ملطّفة لا أمر»), so the learner never saw what the sentence means. Each now reads translation first, tone in brackets: «تفضّل بزيارتنا! (دعوة ملطّفة لا أمر)». German `!` and `?` are now mirrored.
3. **46 card examples rewritten:**
   - **One wrong example:** b1-05 «eine Beobachtung» had «Die Nachricht kam am Freitag.». It is now «Meine Beobachtung: Die Nachricht kam erst am Freitag.»
   - **19 unfinished examples ending in «…»** were completed into full sentences across A1–B2, for example «Unter Berücksichtigung der Kosten …» → «Unter Berücksichtigung der Kosten verschieben wir den Start.», and «Worauf konzentrieren wir uns? Darauf …» → «… Darauf, die Wartezeit zu senken.».
   - **Examples that did not contain their own word** now contain it: «war gegangen», «hatte gemacht», «eine Abhängigkeit», «Belege sammeln», «ein Falsifikationskriterium», «Verteilungseffekte messen», «den Arbeitsauftrag entschlüsseln», «Benachrichtigungen deaktivieren».
   - **Fragments, unnatural German or a bare pronoun** were fixed: «Ich protokolliere meine Nutzung eine Woche lang.», «Der Film ist empfehlenswert für …», and five b2-15 sentences such as «Die Priorität heißt nicht Rechtschreibung.» → «Die Priorität ist der Inhalt, nicht die Rechtschreibung.».
   - **Guillemets:** b2-14 used Swiss/French «…» in German examples; they are now German „…“.
4. **Kept on purpose.** The sentence templates «Meine Telefonnummer ist …» in the independent-transfer tasks are fill-in frames for the learner, not card examples. Metalinguistic B2 examples (b2-16, b2-20) that are complete and correct stay as written.

No card was added, removed or reordered, so every stored card ID and review history stays valid.

## Permanent guard, widened

`tests/unit/goethe-additions-quality-guard.test.ts` now runs over all **96** lessons and adds two rules: a card example must end as a full sentence (`.`, `!` or `?`, not «…»), and German examples use „…“, not «…». A planted-error run (an example cut back to «…», one «…» quotation) failed with both messages.

## Results

| Measure | Before | After |
|---|---|---|
| Lessons under the guard | 53 | **96** |
| Guard problems in the 43 newly guarded lessons | 65 | **0** |
| Card examples ending in «…» (whole course) | 19 | **0** |
| Noun target-gap candidates (contextual) | 5,393 / 3,459 | **5,401 / 3,467** nouns, verb pairs 1,335 / 1,200 → **1,338 / 1,203** (completed sentences carry new context words; pending stays 89 + 1) |
| Curriculum gzip (ceiling 1,309,000) | 1,306,607 | **1,307,086** (+479; 1,914 B left) |
| Client JS total (ceiling 2,205,000) | 2,139,956 | **2,140,456** (+500) |
| Unit tests | 1,695 in 246 files | **1,695 in 246 files** (0 failed) |
| Browser audit / E2E | 642/0 · 67/67 ×2 | **642/0** · **67/67** desktop; mobile 66/67 (the browser closed itself before one test started; that test alone then passed 1/1) · 0 #418 |

## Consequences

- Every lesson, old or new, is now under the same mechanical guard; a new batch cannot add an unfinished example, a second meaning for the same word, or a lost `!`/`?` without failing `npm run check`.
- Manual reading remains a required step of every content batch, recorded in that batch's ADR.
- No ceiling was raised. The open IDEA 407 items still wait for the owner's decision on the curriculum ceiling.
