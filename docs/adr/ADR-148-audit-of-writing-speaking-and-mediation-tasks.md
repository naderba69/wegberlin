# ADR-148: Audit all writing, speaking and mediation tasks, and stop the writing analyser from misreading correct German

- Status: accepted, 2026-10-20 (v257)
- Owner instruction: «واصل» after v256, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Evidence tier: agent audit (a full manual reading of every production task, model text and Arabic support, plus automatic scans), checked by measured gates. Not an independent German review, and not a signature.
- Follows: ADR-147, which audited theory blocks and common mistakes. This batch audits the production layer of all 96 lessons: writing (title, German and Arabic prompt, checklist, model text), speaking (prompt, useful phrases, success criteria) and mediation (scenario, German source, task, suggested Arabic answer). No task was added or removed, and no `transcriptDe` or recorded audio changed.

## Findings and fixes

1. **164 field corrections in 91 lessons** (A1 19 · A2 24 · B1 24 · B2 24): 83 model texts, 48 suggested mediation answers, 15 prompts (German and Arabic), 5 German mediation sources, 3 checklists and 10 other fields.
2. **Padding after the closing.** The most common defect: in most A1–B1 models and in b2-05 … b2-08, sentences had been appended after the closing line or the final decision ("Viele Grüße", then three more sentences). The model texts were reordered so the closing comes last. Sentences that only repeated earlier ones were deleted, and new sentences were written only where the word range or the checklist needed them.
3. **Contradictions and wrong statements inside models**, for example:
   - b2-19: «I cannot prove receipt» next to «there is a receipt stamp», and «the deadline expired» right after «the deadline ends».
   - b2-22: a rule «spell out every abbreviation» while the text itself wrote «Az.».
   - b2-24: «salutation and closing stand on their own lines» in a text with neither.
   - b2-18: a fourth light-verb phrase («zur Verfügung stellen») in a task that asks for exactly three.
   - b2-17: the obligated party named twice where the task says «exactly once».
   - b2-14: the justification was asked «in two sentences» and given in one, and the applicant claimed to check the authority's processing time.
   - b2-10: the Monday deadline, the late-application exception and the responsible office were each stated twice, and one own explanation was not marked as the writer's own.
   - b2-16: the model ended with a vague sentence, although its checklist asks it to end with a verifiable step.
4. **Prompts and their models now agree:**
   - every writing prompt states one explicit «N–M Wörter» range (four A1 prompts had none);
   - the Arabic prompt repeats the same range with a singular noun after numbers ≥ 11;
   - every model lies inside its range;
   - b2-20's German prompt now states the two-connector condition that only the Arabic prompt had.
5. **Arabic:** «تكوين» (Tunisian for a training course) → «دورة تدريبية»; plural after numbers («كلمات» → «كلمة»); dual and agreement slips («توضحان» → «توضح», «تركيبتين» → «تركيبين», «تسمّى» → «تسمّي»); «موقتًا» → «مؤقتًا»; incomplete or telegraphic suggested answers rewritten as full sentences; a b2-20 answer wrapped in quotation marks.
6. **Typography:** German production text used «…» or straight '…' in b2-11, b2-14, b2-15, b2-16, b2-17 and b2-18; all now use „…“, with ‚…‘ for a quote inside a quote. b2-23's closing formula ended with a period.

## The writing analyser misread correct German

To check the models, every model was run through the app's own writing analyser (`analyzeWriting`) with the exact settings the writing lab uses. Nine models failed. Seven of them (a1-03, a1-09, a1-22, a2-11, b1-02, b2-18, b2-24) failed only because of analyser bugs, and a1-05 had one analyser error besides a real gap. These bugs hit learners in the same way:

- **Capital-letter pattern:** sentences were split at every period, so «am 12. Mai», «vom 12. bis 15. Juli», «am 9. und am 12. April», an e-mail address or «z. B.» produced «a sentence starts with a lowercase letter». The new shared `splitGermanSentences` keeps day numbers before a month or a lowercase word, common abbreviations and periods inside a word together. The analyser and the error detector now use the same splitter.
- **Conjugation pattern:** «Sie kommen» (the pains, plural) and «Es kommen viele Leute» were reported as «er/sie/es + infinitive». Only «er» is unambiguous, so the pattern now checks «er» only, and none of the ich/du/er patterns fires on an infinitive before a modal verb («dass er kommen kann»).
- **Perfect pattern:** «Ich habe mit zwei Personen gesprochen, die beide Wege schon gegangen sind» produced the wrong correction «Ich bin … gesprochen». The pattern no longer crosses a comma into another clause.
- **Coherence:** «denn», «dann», «oder», «sondern», «trotzdem», «deswegen» and «darum» now count as connectors.
- **Greeting rule:** a task now asks for greeting and closing only when it is a whole message, e-mail or letter. «Briefabsatz» and «für künftige Briefe» no longer count. The rule lives in one shared function `writingTaskNeedsGreeting`.

The real model gaps were fixed in the content: a1-05 had a repeated birthday sentence and no closing, and a1-07 had no connector at all. Separately, the reordering had removed a2-15's only article-marked plural «die Tabletten»; it was restored in the package instruction, so the covered lexical count stays 1,845.

## Permanent guard

`tests/unit/production-task-guard.test.ts` (17 tests) runs over all 96 lessons:

- every writing prompt has one «N–M Wörter» range;
- the Arabic prompt repeats the same range and does not use «كلمات» after numbers ≥ 11;
- every model lies inside its range;
- every model passes the app's writing analyser with the writing lab's settings;
- nothing follows a closing formula except a signature, and the closing formula does not end with a period;
- no model repeats a sentence;
- German production text has no «…» or straight '…';
- every Arabic support field contains Arabic.

Planted-error tests prove that the rules catch the removed defects and accept the kept forms (apostrophes as in «geht's», a two-word signature). Nine correct sentences, among them dates, an e-mail address, «Sie kommen» and «dass er kommen kann», must produce no error pattern. `writing-repair-claim-boundary` still detects the seven real learner errors it pinned before.

## Results

| Measure | Before | After |
|---|---|---|
| Production tasks read | — | **96 of 96 lessons** (writing, speaking, mediation) |
| Field corrections | — | **164** in 91 lessons |
| Writing prompts without a word range | 4 | **0** |
| Models failing the app's own analyser | 9 | **0** |
| Unit tests | 1,707 in 249 files | **1,724 in 250 files** (0 failed) |
| Browser audit / E2E | 642/0 · 67/67 desktop · 67/67 mobile | **642/0 · 67/67 desktop · 67/67 mobile** (the known flaky `webgpu-runtime-resolution:24` failed once on desktop and passed alone) |
| Curriculum gzip (ceiling 1,309,000) | 1,307,311 | **1,307,930** (+619; 1,070 B left) |
| Client JS total (ceiling 2,205,000) | 2,141,691 | **2,143,425** (+1,734: the shared sentence splitter) |
| Contextual candidates (nouns · verb pairs) | 5,399 / 3,465 · 1,334 / 1,199 | **5,389 / 3,455 · 1,339 / 1,204** (covered 1,845 + 134, pending 89 + 1 unchanged) |
| Explanation quote exceptions | 70 | **69** (b1-01 «damals» now appears in the lesson's German) |

## Consequences

- Padding after a closing, a model outside its range, a prompt without a range, German «…» in production text, or a model that the app's own analyser marks as wrong now fails `npm run check`.
- Learners writing dates, e-mail addresses, «Sie kommen» or a relative clause with «gegangen sind» no longer get false error feedback or a wrong correction.
- Whether a model really fulfils every checklist item still needs reading; it stays a required step of every content batch.
- No ceiling was raised. 1,070 B of curriculum space are left, and the open IDEA 407 items still wait for the owner's decision on the ceiling.
- Next audit batches, in order: lesson entry, discovery and pronunciation.
