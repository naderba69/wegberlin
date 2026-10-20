# ADR-147: Audit all theory blocks and common mistakes, and show mistake text in its real language

- Status: accepted, 2026-10-20 (v256)
- Owner instruction: «واصل» after v255, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Evidence tier: agent audit (a full manual reading of every theory block and every common mistake, plus automatic scans), checked by measured gates. Not an independent German review, and not a signature.
- Follows: ADR-146, which audited reading and listening questions. This batch audits the rule layer: 272 theory blocks (explanation, contrast with Arabic, formula, examples, memory trick) and 392 common mistakes (wrong line, correct line, reason, trick) in 96 lessons. No block, example or mistake was added, removed or reordered, so card IDs (`…-example-B-N`, `…-error-card-N`) and stored review history stay valid. Theory examples are read by device speech, not recorded audio, and no `transcriptDe` changed.

## Findings and fixes

1. **50 corrections in 33 lessons** (A1 10 · A2 11 · B1 8 · B2 21), found by reading every item:
   - **German that was wrong or unclear:** a2-12 «Der Flug ist spät» → «Der Flug hat Verspätung»; a2-19 «fünf Tage» → «fünf Tage lang»; b1-18 «Der Kurs soll die Prüfung garantieren» → «… den Prüfungserfolg garantieren»; b2-14-t1 began with a broken fragment «die Bearbeitungszeit.» and now reads «Die Bearbeitungszeit beträgt vier Wochen.»; b2-18-t2 had an example without the structure it teaches and now shows «zum Abschluss bringen»; b1-19-mk3 needed quotation marks to be readable («Ich habe „bis Freitag“ als „Freitagabend“ verstanden.»).
   - **Mistakes that did not show the mistake:** a2-15-mk3 changed two things at once, so the correct line now differs only by the real error («nach dem Essen»); b1-10-mk3 showed «wegzuwerfen = zu wegwerfen» and now contrasts «statt das Gerät zu wegwerfen» with «statt das Gerät wegzuwerfen»; a2-18-mk2 had mixed Arabic and German in a German line and is now the German sentence «Ich finde es praktisch.»; two b2-22-mk3 sentences now start with a capital letter.
   - **Arabic glosses that only repeated the German:** b2-15-t1 (two), b2-14-t3 and b2-16-t3 now explain the error and give the correct form.
   - **Arabic grammar and wording:** missing «في / يوم» before times and days (a1-09, a2-22, a2-23), «كانت لديهم مشكلة», «تتوقف الطابعة», «أبلغوا عن تركيز أقل», «أداة النكرة» (was «النكران»), «مكان الميلاد», MSA «منذ زمن» (was «من زمان»), the English word «baseline» → «خط بداية», a doubled gloss in b2-19-t4, a2-11-t3 (polite indirect questions still end with «?»; the trick now speaks of the question order), a2-09-mk2 (the reason contradicted the correct line).
   - **Typography:** German quoted with «…» inside German examples (b2-14-t1, b2-15-t2) → „…“; Arabic quoted with „…“ inside Arabic (b2-21-t1, b2-21-t4) → «…»; a markdown «*يبدو*» in b2-16-t2 that would show its asterisks.
   - **Consistency:** «الإعلامية» → «المعلوماتية» (house term since ADR-146) in b1-01-t3 and in two Arabic translations (a1-06 listening, b1-01 reading; the German text is unchanged).
2. **Mistake text shown in the wrong language.** 129 wrong/correct fields (mostly B1/B2 strategy mistakes such as «ثم… ثم… ثم…» or «أختار لأنه أفضل فقط») are Arabic or start in Arabic, but the lesson's mistakes section, the memory map, the search results and the review cards always marked them `lang="de" dir="ltr"`. A screen reader would read them with a German voice, and the line ran left to right. On review cards the back of every mistake card (the correct German line) was marked Arabic and right-to-left. All four places now use the house classifier `fragmentLanguageAttributes`, and the one-line summary «wrong → correct» points its arrow along the reading direction (`mistakeLine`, «←» when the line starts in Arabic). The language/Bidi audit now requires the classifier in these files too (11 adaptive consumers instead of 7).
3. **Kept on purpose.** Eight mistakes whose wrong and correct lines differ only by capitalisation or a comma (they teach exactly that); intentional fragments in formulas and mistake lines; the asterisk that marks an ungrammatical form (b2-23-t2 «*die Prüfung gebühr Ordnung»); a1-03-mk3 «الأولى», a2-02-t1 «Dann hat der Besitzer angerufen», a2-24-t1 «Entweder Mara bucht …» (valid word order).

## Permanent guard

`tests/unit/theory-mistake-guard.test.ts` runs over all 272 theory blocks and 392 mistakes:

- every theory example has an Arabic gloss (numbers and times may stay as digits), and the gloss does not just repeat the German sentence;
- German examples and German mistake lines use „…“, not «…»;
- no markdown emphasis, and no „…“ around Arabic, in any theory or mistake text;
- the wrong and correct lines of a mistake are never identical.

A planted-error test proves each rule fails on the removed defects and passes on the kept forms. `tests/unit/language-boundary.test.ts` now also checks that the four mistake renderers use the classifier and that the arrow follows the reading direction.

## Results

| Measure | Before | After |
|---|---|---|
| Theory blocks / common mistakes read | — | **272 of 272 / 392 of 392** |
| Corrections | — | **50** in 33 lessons (+2 Arabic translations for one term) |
| Mistake fields shown with the wrong language | 129 (+ the back of every mistake card) | **0** |
| Unit tests | 1,700 in 248 files | **1,707 in 249 files** (0 failed) |
| Browser audit / E2E | 642/0 · 67/67 desktop · 67/67 mobile | **642/0 · 67/67 desktop · 67/67 mobile** |
| Curriculum gzip (ceiling 1,309,000) | 1,307,248 | **1,307,311** (+63; 1,689 B left) |
| Client JS total (ceiling 2,205,000) | 2,140,719 | **2,141,691** (+972: the classifier in four more routes) |
| Contextual candidates (nouns · verb pairs) | 5,400 / 3,466 · 1,335 / 1,200 | **5,399 / 3,465 · 1,334 / 1,199** (pending 89 + 1 unchanged) |
| German-tagged JSX elements (language audit) | 458 | **454** (four fixed tags became adaptive) |

## Consequences

- A theory example that only repeats its German, a German example with «…», or a mistake line shown in the wrong language now fails `npm run check`.
- Whether a rule explanation is correct still needs reading; it stays a required step of every content batch.
- No ceiling was raised. The open IDEA 407 items still wait for the owner's decision on the curriculum ceiling.
- Next audit batches, in order: writing, speaking, mediation, lesson entry, discovery and pronunciation.
