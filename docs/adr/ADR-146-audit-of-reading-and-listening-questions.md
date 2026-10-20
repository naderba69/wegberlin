# ADR-146: Audit all reading and listening questions, and stop explanations from naming options by position

- Status: accepted, 2026-10-20 (v255)
- Owner instruction: «واصل» after v254, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Evidence tier: agent audit (a full manual reading of every question next to its text or transcript, plus automatic scans), checked by measured gates. Not an independent German review, and not a signature.
- Follows: ADR-145, which audited exercises and mini-tests. This batch audits the comprehension layer: 288 reading and 288 listening questions in 96 lessons. No question, text or transcript was added, removed or reordered, and no `transcriptDe` was changed, so recorded audio, stored IDs and results all stay valid.

## Findings and fixes

1. **24 reading/listening questions corrected** after reading each one against its text or transcript (`textDe` / `transcriptDe`). Real errors among them:
   - Explanations that contradicted the text: a1-15-lq2 called breakfast «inbegriffen» where the speaker says it is «nicht dabei»; a1-22-lq1 named the arm where the patient has stomach pain; a1-09-lq2 added a time («10:30») the speaker never says; a2-09-lq2 claimed the caller gave the length of the illness; a2-11-rq2 called a covered service «free»; a2-17-lq3 said an appointment was cancelled when it was moved; a2-22-lq3 turned a suggested drink into a condition; a2-14-rq2/lq3 mixed up who (doctor or manager) does what.
   - a1-03-lq3 explained a phone number in a way German speakers do not read it; it now says the prefix is read digit by digit and the rest in pairs («dreiundzwanzig, achtundvierzig, neunzig»).
   - Options: three b2-08-rq2 distractors talked about things the text never mentions and were replaced with plausible readings of the same text (the option-length rule still holds); one b2-17-rq1 distractor meant the same as the key and became «Weil die Sätze Fehler in der Pflichtform enthielten.».
   - Arabic: wrong word or form fixed (الإعلامية → المعلوماتية, اللمبة → المصباح, يُروي → يروي, الدولية → الرسمية, القياسة/السقوط → القياس/الإلغاء, the gender of «تراس»); the month name آب became أغسطس (house style); «آمال» became «أمل», the name the course uses everywhere else.
2. **Options are shuffled, so position words mislead.** Reading, listening and mini-test questions, and multiple-choice exercises, show their options in a seeded shuffled order (`src/core/lesson/shuffle.ts`). A scan of 1,250 option items found explanations that still said «الخيار الثاني», «الجملة الأخيرة» or walked the options as «الأولى… الثانية…». In 15 items (b2-19-rq1 and 14 mini-test/exercise items) this pointed at an option that may appear elsewhere on the learner's screen. Each now names the option by its content, with a verbatim quote or a short description (for example «وجملة الشكر لا تطلب شيئًا»).
3. **Kept on purpose.** Position words that refer to the text, not to options, stay: «في الجملة الثانية» of a transcript (b2-14-lq1, b2-18), «الموقع الثاني» in the sentence, «الخيار الثاني» in a2 pronunciation notes that compare two named sounds, and «من الجملة الأولى» meaning the first sentence of the learner's own talk (b1-12-m5, b2-11-m3).

## Permanent guard

`tests/unit/option-position-reference-guard.test.ts` runs over every reading, listening and mini-test question and every multiple-choice exercise:

- an explanation must not name an option by position («الخيار/الجواب/الإجابة/البديل» + ordinal);
- in mini-tests and multiple-choice exercises, whose options are whole sentences, it must not say «الجملة/العبارة الثانية… الأخيرة» or walk the options as «الأولى… الثانية…»;
- a check confirms the options really are shuffled, so the rule stays tied to how the app behaves.

A planted-error test proves each rule fails on a bad explanation and passes on the kept text references.

## Results

| Measure | Before | After |
|---|---|---|
| Reading/listening questions read against their text | — | **576 of 576** |
| Questions corrected | — | **24** (22 explanations, 2 with new options) |
| Explanations naming a shuffled option by position | 15 | **0** |
| Unit tests | 1,697 in 247 files | **1,700 in 248 files** (0 failed) |
| Browser audit / E2E | 642/0 · 67/67 desktop · 67/67 mobile | **642/0** · **67/67** desktop · **67/67** mobile · 0 #418 |
| Curriculum gzip (ceiling 1,309,000) | 1,307,170 | **1,307,248** (+78; 1,752 B left) |
| Client JS total (ceiling 2,205,000) | 2,140,647 | **2,140,719** (+72) |
| Contextual candidates (nouns · verb pairs) | 5,401 / 3,467 · 1,334 / 1,199 | **5,400 / 3,466 · 1,335 / 1,200** (pending 89 + 1 unchanged) |

## Consequences

- A future explanation cannot point to a shuffled option by its place without failing `npm run check`.
- Agreement between an explanation and its text still needs reading; it stays a required step of every content batch.
- No ceiling was raised. The open IDEA 407 items still wait for the owner's decision on the curriculum ceiling.
- Next audit batches, in order: theory and common mistakes; then writing, speaking, mediation, lesson entry, discovery and pronunciation.
