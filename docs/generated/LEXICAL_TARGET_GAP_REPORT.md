# Lexical Target → Anchor Gap Report

Definition date: 2026-09-05 (audit spec, not the run date; the content fingerprint below is authoritative)  
Version: `lexical-target-gap-v1`  
Content SHA-256: `a4e0b0a20d8f58032b5b186a2eb4aa7c07bf9eed34d396ab2d350fdaabad59ec`

## Honest result

`REVIEW REQUIRED` — this first machine inventory compares explicit authored lexical-target signals with the current **1297 noun anchors** and **134 verb-preposition-case frames** across **96/84 lessons**. It found **89 noun candidates** and **4 unclassified verb-frame candidates**. It also records **8 explicit structural frame exclusions**, all still pending independent German confirmation before P0-99 can close.

The audit does **not** create grammatical facts. A pending noun row must receive a verified record or independent exclusion. A structural frame exclusion can remove a false-positive detector row from the unclassified queue, but its `authored-review-pending` state remains visible until final review.

| Level | Noun signals | Covered | Pending human | Context only | Verb signals | Covered | Pending human | Context only |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A1 | 570 | 298 | 0 | 272 | 106 | 25 | 0 | 81 |
| A2 | 883 | 292 | 0 | 591 | 204 | 30 | 0 | 174 |
| B1 | 1222 | 338 | 0 | 884 | 318 | 31 | 0 | 287 |
| B2 | 2199 | 453 | 89 | 1657 | 629 | 48 | 4 | 577 |
| **Total** | **4874** | **1381** | **89** | **3404** | **1257** | **134** | **4** | **1119** |

## Classification contract

- **covered:** an exact lesson-scoped anchor alias exists. Registry rows are always included, so all 1297 noun records and 134 frame records are auditable.
- **pending-human:** an uncovered candidate appears on a vocabulary phrase, flashcard front, or uppercase reading-glossary lemma.
- **not-target:** either a signal appears only in contextual teaching/assessment surfaces, or a versioned explicit exclusion identifies a false-positive frame detector row. Exclusions retain their reason and pending-independent-review state.
- German sentence-initial capitalization alone is never treated as noun evidence.
- The frame detector records only visible infinitive + preposition evidence. It does not infer a missing case or pretend that every nearby preposition is governed.

Boundary: Target means an existing anchor, an uppercase reading-glossary lemma, or an article-marked noun / infinitive-preposition pair on an authored vocabulary phrase or flashcard front. Theory, texts, mistakes, and task surfaces are scanned as context-only signals. Sentence-initial capitalization alone is never used. Uncovered targets remain pending-human unless an explicit versioned structural exclusion identifies a locative/condition adjunct, separable particle, or purpose clause. Exclusions remain authored-review-pending and do not replace independent German review; the audit never invents gender, plural, governed case, or a lexical record.

## Pending noun decisions (89)

| Stable row | Level | Lesson | Candidate | Target evidence |
|---|---|---|---|---|
| `lex-n-b2-21-451f798a` | B2 | `b2-21` | Audioaufnahme | `flashcards[11].frontDe`: die Audioaufnahme |
| `lex-n-b2-21-80a88f01` | B2 | `b2-21` | Beschluss | `phrases[3].de`: Laut Protokoll sei der Beschluss vertagt worden. |
| `lex-n-b2-21-0d90863e` | B2 | `b2-21` | Datum | `phrases[13].de`: Die Zeugin sagte aus, sie könne sich an das Datum nicht erinnern. |
| `lex-n-b2-21-a338dcae` | B2 | `b2-21` | Dokument | `phrases[8].de`: Nach eigener Aussage habe er das Dokument erst am Abend erhalten. |
| `lex-n-b2-21-af8eb990` | B2 | `b2-21` | Entwurf | `phrases[9].de`: Die Verwaltung dementierte, dass ein Entwurf vorliege. |
| `lex-n-b2-21-a50c40f2` | B2 | `b2-21` | Firma | `phrases[11].de`: Nach Angaben der Firma sei die Prüfung verschoben worden. |
| `lex-n-b2-21-f0101dc4` | B2 | `b2-21` | Formulierung | `flashcards[5].frontDe`: die Formulierung |
| `lex-n-b2-21-ae02258d` | B2 | `b2-21` | Frist | `phrases[4].de`: Man wies darauf hin, dass die Frist abgelaufen sei. |
| `lex-n-b2-21-9ee5d8b4` | B2 | `b2-21` | Korrektur | `flashcards[1].frontDe`: die beanstandete Korrektur |
| `lex-n-b2-21-0070fe04` | B2 | `b2-21` | Lage | `phrases[0].de`: Die Sprecherin erklärte, die Lage sei angespannt. |
| `lex-n-b2-21-0b8faa5f` | B2 | `b2-21` | Maßnahme | `phrases[6].de`: Der Bericht legt nahe, die Maßnahme wirke kaum. |
| `lex-n-b2-21-aee92de8` | B2 | `b2-21` | Mittel | `phrases[14].de`: In der Vorlage heißt es, die Mittel reichen bis März. |
| `lex-n-b2-21-ba42a369` | B2 | `b2-21` | Prüfung | `phrases[11].de`: Nach Angaben der Firma sei die Prüfung verschoben worden.<br>`phrases[16].de`: Vorbehaltlich der Prüfung bleibe der Text vorläufig. |
| `lex-n-b2-21-4ec1300b` | B2 | `b2-21` | Quelle | `phrases[17].de`: Wer wörtlich zitiert, setzt Anführungszeichen; wer paraphrasiert, nen… |
| `lex-n-b2-21-d8eece64` | B2 | `b2-21` | Text | `phrases[16].de`: Vorbehaltlich der Prüfung bleibe der Text vorläufig. |
| `lex-n-b2-21-014d9cf1` | B2 | `b2-21` | Vorlage | `phrases[14].de`: In der Vorlage heißt es, die Mittel reichen bis März. |
| `lex-n-b2-21-5db5e099` | B2 | `b2-21` | Zahlen | `phrases[1].de`: Er behauptete, er kenne die Zahlen nicht. |
| `lex-n-b2-22-01fe6fed` | B2 | `b2-22` | Antrag | `phrases[0].de`: der gestempelte Antrag |
| `lex-n-b2-22-f550c86d` | B2 | `b2-22` | Attribut | `flashcards[1].frontDe`: das engere Attribut |
| `lex-n-b2-22-9c301c2e` | B2 | `b2-22` | Begründung | `phrases[7].de`: die nicht nachvollziehbare Begründung |
| `lex-n-b2-22-241d586c` | B2 | `b2-22` | Behörde | `phrases[2].de`: der von der Behörde geprüfte Bescheid |
| `lex-n-b2-22-0e913452` | B2 | `b2-22` | Berücksichtigung | `phrases[6].de`: ein unter Berücksichtigung der Lage getroffener Beschluss |
| `lex-n-b2-22-7b4682df` | B2 | `b2-22` | Beschlusslage | `phrases[8].de`: der an die Beschlusslage angrenzende Hinweis |
| `lex-n-b2-22-ecea19c1` | B2 | `b2-22` | Fall | `phrases[4].de`: der zu prüfende Fall |
| `lex-n-b2-22-b6aa3172` | B2 | `b2-22` | Freitag | `phrases[14].de`: die bis Freitag zu liefernde Stellungnahme |
| `lex-n-b2-22-c1d330ac` | B2 | `b2-22` | Frist | `phrases[10].de`: ein die Frist wahrender Einspruch<br>`phrases[5].de`: die derzeit geltende Frist |
| `lex-n-b2-22-0745839f` | B2 | `b2-22` | Lage | `phrases[6].de`: ein unter Berücksichtigung der Lage getroffener Beschluss |
| `lex-n-b2-22-32c52d12` | B2 | `b2-22` | Montag | `phrases[3].de`: die am Montag eingegangene Beschwerde |
| `lex-n-b2-22-e5088bd6` | B2 | `b2-22` | Nachbesserung | `phrases[16].de`: die mehrfach angemahnte Nachbesserung |
| `lex-n-b2-22-24afbd68` | B2 | `b2-22` | Protokoll | `phrases[12].de`: die im Protokoll genannte Person |
| `lex-n-b2-22-281f435c` | B2 | `b2-22` | Prüfung | `phrases[11].de`: das für die Prüfung vorgesehene Verfahren |
| `lex-n-b2-22-9cb15937` | B2 | `b2-22` | Relativsatz | `phrases[17].de`: statt vieler Attribute: ein Relativsatz mit klarem Subjekt. |
| `lex-n-b2-22-94ff724a` | B2 | `b2-22` | Rückmeldung | `phrases[1].de`: die fehlende Rückmeldung |
| `lex-n-b2-22-65af7197` | B2 | `b2-22` | Sachverhalt | `phrases[15].de`: ein den Sachverhalt klärendes Gespräch |
| `lex-n-b2-22-10412086` | B2 | `b2-22` | Seiten | `phrases[9].de`: die von allen Seiten geteilte Einschätzung |
| `lex-n-b2-22-6d78bdc4` | B2 | `b2-22` | Vermerk | `flashcards[5].frontDe`: der Vermerk |
| `lex-n-b2-22-40224550` | B2 | `b2-22` | Verstoß | `phrases[13].de`: ein kaum zu übersehender Verstoß |
| `lex-n-b2-23-8bf63695` | B2 | `b2-23` | Ablehnung | `phrases[15].de`: ein Einspruch gegen die Ablehnung |
| `lex-n-b2-23-b14ddf94` | B2 | `b2-23` | Antrag | `phrases[1].de`: der Antrag auf Erlass der Nachforderung |
| `lex-n-b2-23-049778a5` | B2 | `b2-23` | Antrags | `phrases[14].de`: die Bearbeitungsdauer des Antrags |
| `lex-n-b2-23-5e3702d4` | B2 | `b2-23` | Arbeitsgruppe | `phrases[11].de`: die Auswertung der Daten durch die Arbeitsgruppe |
| `lex-n-b2-23-7ff91a71` | B2 | `b2-23` | Attests | `phrases[16].de`: die Vorlage eines ärztlichen Attests |
| `lex-n-b2-23-20459862` | B2 | `b2-23` | Auswertung | `phrases[11].de`: die Auswertung der Daten durch die Arbeitsgruppe |
| `lex-n-b2-23-d8bc3eef` | B2 | `b2-23` | Bearbeitungsdauer | `phrases[14].de`: die Bearbeitungsdauer des Antrags |
| `lex-n-b2-23-21b7b975` | B2 | `b2-23` | Bescheids | `phrases[7].de`: die Zustellung des Bescheids per Einschreiben |
| `lex-n-b2-23-41929dc9` | B2 | `b2-23` | Daten | `phrases[11].de`: die Auswertung der Daten durch die Arbeitsgruppe |
| `lex-n-b2-23-903fe721` | B2 | `b2-23` | Einrichtung | `phrases[4].de`: die Versäumnis seitens der Einrichtung |
| `lex-n-b2-23-a84c0992` | B2 | `b2-23` | Einspruch | `phrases[15].de`: ein Einspruch gegen die Ablehnung |
| `lex-n-b2-23-428bbbb7` | B2 | `b2-23` | Einverständnis | `phrases[3].de`: das Einverständnis der Eltern |
| `lex-n-b2-23-a0fe65ff` | B2 | `b2-23` | Eltern | `phrases[3].de`: das Einverständnis der Eltern |
| `lex-n-b2-23-3116f769` | B2 | `b2-23` | Fristversäumnis | `flashcards[4].frontDe`: die Fristversäumnis<br>`phrases[6].de`: der Hinweis auf die Fristversäumnis |
| `lex-n-b2-23-85eac1d1` | B2 | `b2-23` | Gebühr | `flashcards[8].frontDe`: der Erlass der Gebühr |
| `lex-n-b2-23-43c8d837` | B2 | `b2-23` | Gebührenbefreiung | `phrases[8].de`: die Gebührenbefreiung für Härtefälle |
| `lex-n-b2-23-9a6995c0` | B2 | `b2-23` | Hinweis | `phrases[6].de`: der Hinweis auf die Fristversäumnis |
| `lex-n-b2-23-97886831` | B2 | `b2-23` | Hochschule | `phrases[0].de`: die Gebührenordnung der Hochschule |
| `lex-n-b2-23-26d277a0` | B2 | `b2-23` | Kandidaten | `phrases[2].de`: die Prüfung des Kandidaten |
| `lex-n-b2-23-84211e29` | B2 | `b2-23` | Nachfrist | `phrases[5].de`: die Verlängerung der Nachfrist um zwei Wochen |
| `lex-n-b2-23-97de7ad8` | B2 | `b2-23` | Niederschlagung | `flashcards[2].frontDe`: die Niederschlagung |
| `lex-n-b2-23-48f72433` | B2 | `b2-23` | Prüfung | `phrases[2].de`: die Prüfung des Kandidaten |
| `lex-n-b2-23-dc9e387d` | B2 | `b2-23` | Rückmeldung | `phrases[9].de`: die Rückmeldung des Studierendensekretariats |
| `lex-n-b2-23-f0cc5641` | B2 | `b2-23` | Satzung | `phrases[13].de`: die in der Satzung genannte Frist |
| `lex-n-b2-23-c0cc5d1c` | B2 | `b2-23` | Schreiben | `phrases[10].de`: ein Schreiben ohne Betreffzeile |
| `lex-n-b2-23-26a98d7d` | B2 | `b2-23` | Studierendensekretariats | `phrases[9].de`: die Rückmeldung des Studierendensekretariats |
| `lex-n-b2-23-9e728169` | B2 | `b2-23` | Stundung | `flashcards[1].frontDe`: die Stundung |
| `lex-n-b2-23-f897595c` | B2 | `b2-23` | Verhältnis | `phrases[12].de`: das Verhältnis von Aufwand und Ertrag |
| `lex-n-b2-23-51e9b216` | B2 | `b2-23` | Verlängerung | `phrases[5].de`: die Verlängerung der Nachfrist um zwei Wochen |
| `lex-n-b2-23-f4d4ba7b` | B2 | `b2-23` | Versäumnis | `phrases[4].de`: die Versäumnis seitens der Einrichtung |
| `lex-n-b2-23-9b02ad13` | B2 | `b2-23` | Vorlage | `phrases[16].de`: die Vorlage eines ärztlichen Attests |
| `lex-n-b2-23-2aeb1bf1` | B2 | `b2-23` | Wort | `phrases[17].de`: ein Wort, drei Glieder: Grundwort, Bestimmungswort, Fuge. |
| `lex-n-b2-23-29730a0a` | B2 | `b2-23` | Zustellung | `phrases[7].de`: die Zustellung des Bescheids per Einschreiben |
| `lex-n-b2-24-38b41a6e` | B2 | `b2-24` | Anlage | `phrases[13].de`: Zu prüfen sind: die Unterschrift, das Datum, die Anlage. |
| `lex-n-b2-24-1f4613cf` | B2 | `b2-24` | Antrag | `phrases[11].de`: Deshalb haben wir den Antrag ergänzt.<br>`phrases[8].de`: Die Frist endete am Montag; ein Antrag ging nicht ein. |
| `lex-n-b2-24-240220ea` | B2 | `b2-24` | Behörde | `phrases[5].de`: Der Bescheid, den die Behörde erlassen hatte, wurde aufgehoben. |
| `lex-n-b2-24-82a32b67` | B2 | `b2-24` | Bescheid | `phrases[1].de`: Wir bitten darum, den Bescheid zu überprüfen.<br>`phrases[4].de`: Statt den Bescheid zu akzeptieren, legte er Einspruch ein. |
| `lex-n-b2-24-8a7de254` | B2 | `b2-24` | Bestätigung | `phrases[10].de`: Wir brauchen eine Bestätigung, und zwar bis Freitag. |
| `lex-n-b2-24-28eb970d` | B2 | `b2-24` | Datum | `phrases[13].de`: Zu prüfen sind: die Unterschrift, das Datum, die Anlage. |
| `lex-n-b2-24-5ef9edc2` | B2 | `b2-24` | Doppelpunkt | `flashcards[6].frontDe`: der Doppelpunkt |
| `lex-n-b2-24-ed37224e` | B2 | `b2-24` | Formular | `phrases[14].de`: Bitte füllen Sie das Formular aus und senden Sie es zurück. |
| `lex-n-b2-24-22caa17a` | B2 | `b2-24` | Frist | `phrases[0].de`: Bitte senden Sie uns die Unterlagen, bevor die Frist endet.<br>`phrases[3].de`: Ohne die Frist zu versäumen, konnten wir einreichen. |
| `lex-n-b2-24-2d89f742` | B2 | `b2-24` | Gebühr | `phrases[16].de`: Klären Sie, ob die Gebühr entfällt, und teilen Sie das mit. |
| `lex-n-b2-24-4348ebaf` | B2 | `b2-24` | Kommission | `phrases[6].de`: Herr Weber, der Vertreter der Kommission, stimmte zu. |
| `lex-n-b2-24-6094b60a` | B2 | `b2-24` | Nachforderung | `flashcards[7].frontDe`: die Nachforderung<br>`phrases[2].de`: Er versucht, die Nachforderung zu vermeiden. |
| `lex-n-b2-24-a4c1cbc0` | B2 | `b2-24` | Pause | `phrases[7].de`: Die Prüfung war lang, die Pause kurz. |
| `lex-n-b2-24-1039a431` | B2 | `b2-24` | Schreiben | `phrases[17].de`: Prüfe nach dem Schreiben: Kommas, Verben, Klammern. |
| `lex-n-b2-24-bef2f26b` | B2 | `b2-24` | Unterlagen | `phrases[0].de`: Bitte senden Sie uns die Unterlagen, bevor die Frist endet. |
| `lex-n-b2-24-9be6c179` | B2 | `b2-24` | Unterschrift | `phrases[13].de`: Zu prüfen sind: die Unterschrift, das Datum, die Anlage. |
| `lex-n-b2-24-385151f6` | B2 | `b2-24` | Vermerk | `phrases[15].de`: Wir bitten Sie, uns den Vermerk zuzusenden. |
| `lex-n-b2-24-04c42c8f` | B2 | `b2-24` | Vertreter | `phrases[6].de`: Herr Weber, der Vertreter der Kommission, stimmte zu. |
| `lex-n-b2-24-3080e951` | B2 | `b2-24` | Zurückstellung | `flashcards[8].frontDe`: die Zurückstellung |

## Pending verb/preposition decisions (4)

| Stable row | Level | Lesson | Infinitive candidate | Prep. | Observed case evidence | Target evidence |
|---|---|---|---|---|---|---|
| `lex-v-b2-21-f2fa1775` | B2 | `b2-21` | sich erinnern | an | accusative | `phrases[13].de`: Die Zeugin sagte aus, sie könne sich an das Datum nicht erinnern. |
| `lex-v-b2-24-6e1439bd` | B2 | `b2-24` | bitten | zu | accusative, ambiguous, unknown | `phrases[1].de`: Wir bitten darum, den Bescheid zu überprüfen. |
| `lex-v-b2-24-5f033ff3` | B2 | `b2-24` | einreichen | zu | unknown | `phrases[3].de`: Ohne die Frist zu versäumen, konnten wir einreichen. |
| `lex-v-b2-24-97864110` | B2 | `b2-24` | konnten | zu | unknown | `phrases[3].de`: Ohne die Frist zu versäumen, konnten wir einreichen. |

## Explicit structural frame exclusions (8)

| Decision | Lesson | Detected pair | Reason | Authored explanation | Review status |
|---|---|---|---|---|---|
| `a1-21-umsteigen-in-frame-exclusion` | `a1-21` | umsteigen + in | `locative-adjunct` | في in Hannover يحدد حرف الجر مكان تبديل القطار؛ ليس حرفًا يحكمه الفعل umsteigen في كل استعمال. | `authored-review-pending` |
| `b1-15-liegen-vor-frame-exclusion` | `b1-15` | liegen + vor | `separable-particle` | vor هنا جزء منفصل من الفعل vorliegen، وليس حرف جر يكوّن إطار liegen + vor. | `authored-review-pending` |
| `b1-22-nachsteuern-bei-frame-exclusion` | `b1-22` | nachsteuern + bei | `condition-adjunct` | bei Bedarf ظرف شرط بمعنى عند الحاجة؛ يمكن حذف الظرف ويبقى الفعل nachsteuern كاملًا. | `authored-review-pending` |
| `b1-23-liegen-vor-frame-exclusion` | `b1-23` | liegen + vor | `separable-particle` | vor في liegen … vor هو بادئة الفعل المنفصل vorliegen، لا حرف جر مستقل. | `authored-review-pending` |
| `b2-01-reichen-aus-frame-exclusion` | `b2-01` | reichen + aus | `separable-particle` | aus جزء الفعل المنفصل ausreichen في Die Daten reichen nicht aus؛ لا يمثل إطار reichen + aus. | `authored-review-pending` |
| `b2-01-reichen-um-frame-exclusion` | `b2-01` | reichen + um | `purpose-clause` | um يفتتح جملة الغاية um … zu ولا تحكمه صيغة ausreichen السابقة. | `authored-review-pending` |
| `b2-18-ziehen-in-frame-exclusion` | `b2-18` | ziehen + in | `locative-adjunct` | في «in Betracht ziehen» ليس in حرف جر يحكمه الفعل: التركيب يجري بأفعال خفيفة أخرى: «in Betracht zie… | `authored-review-pending` |
| `b2-18-kommen-in-frame-exclusion` | `b2-18` | kommen + in | `locative-adjunct` | في «in Frage kommen» العبارة ظرفية ثابتة مثل «in Betracht»: الفعل يتبدّل («etwas in Frage stellen» … | `authored-review-pending` |

All 8 exclusions remain `authored-review-pending`; zero unclassified rows does not mean independent German review is complete.

The complete covered/pending/context inventory, every source path, matched anchor ID, and exclusion decision are stored under `lexicalTargetGaps` in `reports/academic-content-audit.json`.
