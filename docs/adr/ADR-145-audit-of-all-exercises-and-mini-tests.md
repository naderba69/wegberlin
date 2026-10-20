# ADR-145: Audit all exercises and mini-tests and guard them

- Status: accepted, 2026-10-20 (v254)
- Owner instruction: «واصل» after v253, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Evidence tier: agent audit (a full manual reading of every multiple-choice item plus automatic scans), checked by measured gates. Not an independent German review, and not a signature.
- Follows: ADR-143 and ADR-144, which audited the vocabulary cards. This batch audits the practice layer: 728 exercises and 480 mini-test items in 96 lessons. No item was added, removed or reordered, so every stored exercise ID and result stays valid.

## Findings and fixes

1. **44 word-ordering tasks gave the answer away.** The exercise card shows the word chips in data order (it does not shuffle them). In 44 of the 96 word-ordering tasks the chips already read as an accepted answer, so the learner only had to copy them. 42 were found by the scan; the new guard found two more (b1-04-e3 matched the *second* accepted answer; a1-03-e3 had two chips and accepted both orders, so it trained nothing). Each now shows the same words in a non-answer order; a1-03-e3 became the four-word phrase the lesson itself uses, «Bitte noch einmal, langsamer.».
2. **77 items corrected** (72 explanations, 5 options, 2 prompts) after reading every item next to its options. Real errors among them:
   - Wrong German in the explanation: a1-07-m1/m3 gave the official time of 10:30 as «zehn Uhr zwanzig»; it is «zehn Uhr dreißig», and 09:45 is «neun Uhr fünfundvierzig». b2-23-m2 claimed a Fugen-s in «Studien + s + Beratung»; Studienberatung has none, so the example is now «Prüfung + s + Amt». b2-14-m2/m3 listed «sodann» as a result connector; that block was removed.
   - Explanations that did not match their options: b2-19-e7 called the three wrong letters «conversation particles»; b2-20-m1 quoted «desto voller», which is not an option; b2-17-e7 and b2-15-e7 described other options than the ones shown; b2-18-e7 counted «six words» for a nine-word answer.
   - Misleading or incomplete rules: b2-14-e1 now says why «dieses/es» cannot refer to «der Antrag» (they are neuter); b1-13-e1 now names the real fault of «beim zu Lesen» and covers «beim gelesen»; b2-23-m4 now shows the two readings of a Genitiv with a clean example («die Kontrolle des Mieters»).
   - Typos: «أنهُتَ» → «أنهيتَ» (two lessons), «التناز» → «التنازل», and «و» detached from the next Arabic word in seven places.
3. **Distractors:** a stray «zu» was removed from three b2-12 options; a2-19-e6 and b2-02-m5 options were tidied. The option-length rule (the key is never the only longest or shortest option) still passes.
4. **b2-21-e1** repeated its German sentence inside the Arabic prompt, so the learner saw it twice; the repeat was removed.
5. **Kept on purpose.** «و» before a Latin word with a space («، و Tschüs») is the house style for Arabic next to German and stays. Correct but generic explanations were not rewritten.

## Permanent guard

`tests/unit/exercise-explanation-guard.test.ts` runs over all 728 exercises and 480 mini-test items:

- word-ordering chips must not already read as any accepted answer, must build the first accepted answer, and must be unique (the card keys each chip by its word);
- an error-correction sentence submitted unchanged must not be accepted by the real evaluator (`evaluateExercise`);
- «و» must not stand detached before an Arabic word in prompts and explanations.

A planted-error test proves each rule fails on a bad item and passes on a good one.

## Results

| Measure | Before | After |
|---|---|---|
| Word-ordering tasks whose chips showed the answer | 44 | **0** |
| Explanations, options or prompts corrected after reading | — | **77 items** |
| Unit tests | 1,695 in 246 files | **1,697 in 247 files** (0 failed) |
| Browser audit / E2E | 642/0 · 67/67 desktop, 66/67 + 1/1 mobile | **642/0** · **67/67** desktop · **67/67** mobile · 0 #418 |
| Curriculum gzip (ceiling 1,309,000) | 1,307,086 | **1,307,170** (+84; 1,830 B left) |
| Client JS total (ceiling 2,205,000) | 2,140,456 | **2,140,647** (+191) |
| Contextual verb-pair candidates | 1,338 / 1,203 | **1,334 / 1,199** (nouns unchanged 5,401 / 3,467; pending 89 + 1 unchanged) |

## Consequences

- A future exercise cannot give its answer away through chip order, accept an unchanged wrong sentence, or carry a detached «و» without failing `npm run check`.
- Explanation accuracy against the options still needs reading; it stays a required step of every content batch.
- No ceiling was raised. The open IDEA 407 items still wait for the owner's decision on the curriculum ceiling.
