# ADR-149: Audit lesson entry, header, discovery and pronunciation in all 96 lessons

- Status: accepted, 2026-10-20 (v258)
- Owner instruction: «واصل» after v257, under the standing instruction of 2026-10-20 «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق».
- Ceiling decision: the corrections pushed the curriculum source 847 B over the safety ceiling (1,309,847 of 1,309,000). The owner was asked and answered on 2026-10-20: «لا يهم السقف ساستعمله اونلاين دائما». The curriculum hard limit was raised 1,540,000 → **1,560,000** B gzip. The 15% reserve is unchanged, so the safety ceiling is now **1,326,000** (16,153 B left). The JS ceiling (2,205,000) is unchanged.
- Evidence tier: agent audit (a full manual reading of every lesson header, entry scene and dialogue, discovery block and pronunciation block, plus automatic scans), checked by measured gates. IPA changes were re-verified against the pinned dictionary. This is not an independent German or phonetics review, and not a signature.
- Follows: ADR-148, which audited the production tasks. This batch audits what opens each lesson: the header (Arabic title and description, objectives in German and Arabic), the entry (scene, title and dialogue), discovery (instruction, examples and questions) and pronunciation (title, focus, explanation, items and trick). No lesson, dialogue line or item was added or removed (IDs are index-based), and no `transcriptDe` or recorded audio changed.

## Findings and fixes

1. **343 field corrections in 78 lessons** (A1 48 fields in 15 lessons · A2 40 in 17 · B1 109 in 22 · B2 146 in 24):
   - 240 Arabic glosses of pronunciation items;
   - 21 Arabic dialogue lines;
   - 16 discovery examples;
   - 12 pronunciation explanations, 5 focus lines and 4 tricks;
   - 10 German items and 9 transcriptions;
   - 6 Arabic objectives, 6 scenes and 4 German dialogue lines;
   - 3 German objectives, 3 discovery questions, 2 entry titles, 1 discovery instruction and 1 pronunciation title.
2. **Truncated glosses.** This was the most common defect. Many pronunciation glosses were one or two words that did not say what the German phrase means, for example «إضافة» for „DARÜBER HINAUS …“, «يستنتج» for „Daraus lässt sich ABLEITEN …“ and «أصحح: 12%» for „Ich KORRIGIERE mich: ZWÖLF Prozent.“. They are now full meanings. When the German item is an open frame ending in «…», the Arabic gloss mirrors the «…» (22 further items in A2–B2 lacked it). Passive glosses carry the vowel marks that show the passive («تُعَدّ الخطة», «يُقاس الأثر»).
3. **Glosses that were only sound notes.** In b2-17 … b2-24 most items gave only a phonetic note («النبر على Kennt …») and no meaning. Each item now starts with its meaning, followed by the note.
4. **Wrong or misleading pronunciation statements:**
   - b2-14 presented «DAdurch» as the normal stress. The neutral stress is daDURCH, and DA is stressed only for emphasis, which is what the recorded manual IPA decision already said. The explanation now says this and quotes the item verbatim.
   - b2-20's focus named the ich-Laut, but the content is the Ach-Laut [x] in „auch“/„noch“. b2-19 wrote „das ach-Laut“, but Laut is masculine: „der Ach-Laut“. b2-19 also used the meaningless notation «[nuːɐ̯ˈ]».
   - b2-16 used the wrong terms «المساند/المسند» for the auxiliary verb, and contradicted itself about a pause before „ob“.
   - b2-03 wrote „rollenBASIERT“, while its own IPA (and the compound rule) puts the main stress on ROLLEN. It is now „ROLLENbasiert“.
   - b2-21 and b2-22 promised a glottal stop or an «-en» ending that no item showed. Three German focus lines had a comma before „und“, and one had «Fugen-laute».
   - A1 items now show what their explanation teaches. a1-03 asks the learner to tell U from Ü and O from Ö, but U and O were missing; they replace A and I. a1-11 and a1-22 got pf words that fit the lesson (Pfand, Pflaume, Pfirsich; Köpfe) in place of words outside the theme or without the sound.
5. **Scene and dialogue consistency:**
   - b2-23's scene called the speaker Amir «أمين»;
   - b2-22's scene described the speaker «Chefin» (female) as «رئيسه» (male);
   - b2-11's scene did not say whose text Mara reviews;
   - several Arabic dialogue lines did not translate their German line, for example b2-01 dropped «nachweislich», b2-09 Nadia's line misread the German, and b2-07's «يعتمد» → «تُعتمَد» and «الحضور السابعة» → «الحضور في السابعة مساءً».
6. **Discovery questions that the examples cannot answer.** b2-05 asked about «Mittelwert/Verteilung», and b2-23 asked about «Prüfungsgebührenordnung»; neither appears in its examples. Both now ask about something the examples show.
7. **Arabic:**
   - «أصيغ» → «أصوغ»;
   - b2-09 «الصفات المبنية بالمشاركة», a literal calque of Partizip, now names اسم الفاعل/اسم المفعول;
   - «بثلاث مقاطع» → «بثلاثة مقاطع»;
   - «للنصف» → «إلى النصف»;
   - formal «Sie» is rendered with the polite plural («نقطتكم», «فهمتكم»).
8. **Typography:** German dialogue lines, discovery examples and one objective in b2-14 … b2-17 used «…». All now use „…“. The reading and listening texts of b2-module6 still use «…» in German. They are outside this batch's scope, and the listening texts are tied to recordings, so they are recorded as the next typography item.

## IPA re-verification

The changed items were checked against the pinned dictionary `open-dict-data/ipa-dict` `data/de.txt` at commit `43c3570e…`. The downloaded file's SHA-256 matched the pinned `d36d11db…` exactly. U, O, Ö, E, Pfand, Pflaume, Pfirsich and Köpfe are exact dictionary matches. ROLLENbasiert keeps its dictionary verdict. The CSV `IPA_SOURCE_VERIFICATION_2026-10-18.csv` was regenerated, and the generated `curriculum-phoneme-reference.generated.ts` was rebuilt with `npm run phoneme:lexicon:generate`. That command is not part of the `:write` scripts, so it must run whenever a single-word pronunciation item changes.

## Permanent guard

`tests/unit/entry-discovery-pronunciation-guard.test.ts` runs over all 96 lessons:

- German-only fields (objectives, dialogue, discovery examples, pronunciation focus and items) use „…“, never «…»;
- a pronunciation gloss mirrors an open German frame: if the German item contains «…», so does the Arabic gloss;
- every gloss is Arabic (or a number) and never repeats the German;
- a character that the Arabic scene names must speak in the dialogue;
- a German focus line has no comma before „und“;
- a focus that names the ich-Laut or the Ach-Laut has an item showing [ç] or [x].

A planted-error test proves that each rule catches the defect it was written for, among them «أمين» for Amir, «إضافة» for „DARÜBER HINAUS …“ and «Fugenlaute, und Pausen».

## Results

| Measure | Before | After |
|---|---|---|
| Lessons read (header, entry, discovery, pronunciation) | — | **96 of 96** |
| Field corrections | — | **343** in 78 lessons |
| Open German frames without «…» in the Arabic gloss | 22 | **0** |
| German «…» in the audited German fields | 20 fields | **0** |
| Unit tests | 1,724 in 250 files | **1,727 in 251 files** (0 failed) |
| Curriculum gzip | 1,307,930 (ceiling 1,309,000) | **1,309,847** (ceiling **1,326,000**; 16,153 B left) |
| Client JS total (ceiling 2,205,000) | 2,143,425 | **2,145,427** |
| Lexical coverage (nouns) | covered 1,845 · pending 89 · contextual 3,455 | **unchanged** (row-by-row diff against `6b1e083`) |
| Explanation quote exceptions | 69 | **69** |

## Consequences

- A truncated gloss for an open German frame, German «…» in the audited fields, a scene naming a character who does not speak, or a focus line that names a sound no item shows now fails `npm run check`.
- Whether a gloss is idiomatic Arabic still needs reading. It stays a required step of every content batch.
- The ceiling raise leaves room for the next audit batches and for the open Goethe vocabulary items (IDEA 407) that had waited for the ceiling decision.
- Next items, in order: German «…» in the reading and listening texts of b2-module6 (the listening part needs a decision about recordings), then the open IDEA 407 vocabulary.
