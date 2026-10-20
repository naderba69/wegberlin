# ADR-143: Audit every Goethe vocabulary addition and guard it with a permanent test

- Status: accepted, 2026-10-20 (v252)
- Owner instruction (2026-10-20): «واصل الانتاج كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». Continue production, but process and audit every addition. The owner wants error-free work with no slips, planned, organised and reliable.
- Evidence tier: agent audit (automatic checks plus a full manual reading), checked by measured gates. Not an independent German review, and not a signature.
- Audits: ADR-139 (A1, v248), ADR-141 (A2, v250), ADR-142 (B1, v251).

## Context

v248, v250 and v251 added 556 review cards (A1 244, A2 240, B1 72), with the same number of vocabulary phrases, 331 noun anchors and 51 matching exercises `<lesson>-e8`. Each batch passed its gates, but the gates check structure (schema, answers, budgets, browser flows). They do not check whether an Arabic meaning is accurate, whether an example sentence is natural German, or whether the same word is glossed the same way on its page and on its card.

## Method

1. **Extraction.** The 556 added cards were diffed against each batch's base commit (ef6ed20 for A1, 503ac9b for A2, 02a28f9 for B1).
2. **Automatic checks (scratch script, Python with `pyspellchecker` de and `german_nouns` 1.2.5).** These covered German spelling, whether the example contains the target word, capital letters on nouns, the article against the anchor, the noun anchor against its surface form, Arabic `!`/`?` mirroring, and matching pair against taught gloss. The results were 70 flags, all reviewed by hand. The false-positive classes were:
   - names, E-Book, T-Shirt, Bio, «wegzuwerfen» and the imperative «Schieb»;
   - separable or inflected verbs in examples;
   - «chatten» capitalised at the start of a sentence;
   - the dative «an der Reihe»;
   - plural surfaces (Papiere, Fundsachen, Nudeln, Süßigkeiten);
   - matching pairs that use one half of an «X / Y» gloss.
3. **Manual reading.** All 556 example sentences, Arabic meanings and the 51 matching explanations were read for:
   - German grammar (verb position, case, agreement, tense) and naturalness;
   - the accuracy of the Arabic meaning;
   - consistency with the rest of the lesson.

   The noun anchors' `meaningAr` was compared with the taught phrase. The 15 differences are only the article «ال» or diacritics.
4. **Permanent guard.** `tests/unit/goethe-additions-quality-guard.test.ts` covers all 53 lessons that received words (every A1 and A2 lesson plus b1-08/10/12/20/23). It covers both the old and the new content in those lessons, and checks that:
   - every card example is a full sentence (capital start, final punctuation; a letter closing is the one exception);
   - no front repeats inside a lesson;
   - a card's Arabic is identical to the vocabulary-stage Arabic of the same German;
   - every matching pair uses the meaning the lesson taught;
   - German `!`/`?` is mirrored in the Arabic;
   - no Arabic letter is glued to a Latin letter.

   It collects every problem into one list, so a failure shows all of them at once. A planted-error run (duplicate card, changed card gloss, removed `!`) failed with all three messages.

## Findings and fixes

**In the v248–v251 additions (8 real errors):**

| Lesson | Problem | Fix |
|---|---|---|
| a1-08 | v248 appended a second «jeden Tag» card (card 23) | Card 23 now teaches «Deutsch lernen» (a phrase of the lesson without a card); its example «Ich lerne jeden Tag Deutsch.» already fits. The card count and every card ID stay unchanged, so stored review progress is safe. |
| a1-09 | «Auf Wiederhören!» → «إلى اللقاء (في الهاتف)» lost the «!» | «إلى اللقاء! (في الهاتف)» on phrase and card |
| a2-02 | «nirgends» → «في أي مكان (مع النفي)» suggested that a negation must be added, against the lesson's own explanation | «لا في أي مكان» on phrase, card and matching pair |
| a2-09 | Example «Hier ist Frau Klein am Apparat.» and the explanation «Hier ist … am Apparat» are not idiomatic on the phone | Example «Wer ist am Apparat, bitte?»; the explanation now teaches «Wer ist am Apparat?» and the lesson's own «Hier spricht …» |
| a2-19 | Example «Ich rechne meine Lernzeit pro Woche.» is unnatural without «aus» | «Ich rechne: Fünf mal zwanzig Minuten sind hundert Minuten.» |
| a1-12-e8 | Quoted question «Wo ist die Toilette, bitte.» ended with a full stop | «…, bitte?» |
| a1-22-e8 | «weh tun» while A2 teaches «wehtun» | «wehtun» (one spelling across the course) |
| a2-22-e8 / a2-23-e8 | «ein Paar Schuhe تعني حذاءين معًا» is ambiguous; «وnach austragen …» reads as the German preposition «nach» | «زوجًا واحدًا من الأحذية، أي فردتين»; «ومع austragen نذكر ما نوزّعه: Ich trage Zeitungen aus.» |

**In older content of the same lessons (found by the guard, 72 meanings aligned):**

- **Card and phrase disagreed.** The same German had a different Arabic meaning on its vocabulary page and on its card (for example «Damit bin ich einverstanden.» had three glosses in three lessons). Each pair now uses the more accurate of the two glosses, identical on both surfaces.
- **Real meaning errors among them:**
  - «zu früh» was glossed «مبكر جدًا» and «zu spät» «متأخر جدًا» ("very"). zu means "more than needed", not sehr. They are now «مبكر أكثر من اللازم» and «متأخر (بعد الموعد)».
  - «Gute Besserung!», «Herzlichen Glückwunsch!» and «Alles Gute zum Geburtstag!» lacked the «!» in a2-14/a2-22.
  - The b1-08 phrases «الفني الذي… مفعول» and «الشركة التي… Dativ» were truncated; they now carry the card's full note.

**Left as is, on purpose:**

- «Herzlichen Glückwunsch!» is «مبروك! / كل عام وأنت بخير!» in a1-17 (birthday) and «تهانينا القلبية!» in a2-22 (occasions). Both are correct for their lesson.
- «التلفزي» is the course's existing spelling (4 uses).
- «Fragen Sie bei der Auskunft.» is acceptable German.

## Results

| Measure | Before | After |
|---|---|---|
| Real errors in the 556 additions | 8 found | **0 open** |
| Older meanings aligned in the same lessons | — | **72** |
| Unit tests | 1,689 in 245 files | __UNIT__ |
| Noun target-gap candidates (contextual) | 5,394 / 3,460 | **5,393 / 3,459** («Lernzeit» left the a2-19 example) |
| Curriculum gzip (ceiling 1,309,000) | 1,306,762 | __CURRICULUM__ |
| Client JS total (ceiling 2,205,000) | 2,140,111 | __JS__ |
| Browser audit / E2E | 642/0 · 67/67 ×2 | __E2E__ |

## Consequences

- Every future content addition must pass `goethe-additions-quality-guard.test.ts`. When a lesson gets a package, its id is added to the guarded set. The manual reading (grammar, naturalness, accuracy of the Arabic) stays a required step of every batch, recorded in that batch's ADR.
- No ceiling was raised. The open IDEA 407 items still wait for the owner's decision on the curriculum ceiling.
