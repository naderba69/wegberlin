# ADR-010 — Progressive structured lexical grammar layer

Date: 2026-09-03 (amended 2026-09-04 for A2, B1, and B2)  
Status: accepted for the A1, A2, B1, and B2 batches; exhaustive vocabulary audit, nominal Genitiv/dative plural, and human linguistic review pending

## Context

The course teaches vocabulary in chunks, but noun gender/plural/case and verb-preposition-case relations were mainly embedded in prose and examples. Adding complete paradigms everywhere at once would create a large linguistic-review risk and could overwhelm a true beginner.

## Decision

- Add versioned per-level registries (`a1-`, `a2-`, `b1-`, `b2-lexical-grammar-v1`) rather than inferring grammar at render time.
- Author four high-priority noun anchors per lesson, plus one verb-preposition frame for each of the 24 A1 lessons and two for each of the 24 A2, 24 B1, and 12 B2 lessons.
- Store noun article, gender, plural or explicit no-usual-plural policy, Arabic meaning, and Nominativ/Akkusativ/Dativ forms.
- Allow explicit oblique singular forms for weak masculine nouns such as `der Name → den Namen` and `der Kollege → den Kollegen`.
- Store verb infinitive, preposition, governed case, reusable chunk, German example, and Arabic contrast.
- Render German first in the vocabulary stage. Keep case tables collapsed by default so beginners see article/plural before optional paradigms.
- Validate all records through strict Zod during `prebuild`, and drive the integrity rules from a per-level contract (nouns per lesson, frames per lesson) so the same gate covers every authored level instead of hard-coded A1 numbers.
- Reject a chunk that omits the preposition or the framed infinitive, an example that omits the preposition, a noun without a plural note, an article/gender mismatch, a `sourceVersion` that does not match the lesson level, and a chunk repeated inside the same level.

## A2 amendment (2026-09-04)

- `a2-lexical-grammar-v1` authors 96 noun anchors and 48 frames across 24/24 A2 lessons, each drawn from that lesson's own theory and glossary rather than a generic word list.
- Two frames per A2 lesson let the layer carry real contrasts, for example `auf einer Erstattung bestehen` (the Dativ exception after `auf`) next to `sich auf die Prüfung vorbereiten` (Akkusativ).
- Weak-masculine obliques (`der Nachbar → den/dem Nachbarn`) and no-usual-plural nouns (`Müll`, `Schlaf`, `Gepäck`, `Privatsphäre`, `Ernährung`, `Stolz`) are authored explicitly instead of derived.

## B1/B2 amendment (2026-09-04)

- `b1-lexical-grammar-v1` and `b2-lexical-grammar-v1` add 144 noun anchors and 72 frames across 36 more lessons, again drawn from each lesson's own theory and glossary.
- The frame case contract was widened from Akkusativ/Dativ to include Genitiv so the layer can carry formal B2 prepositions such as `angesichts`, `hinsichtlich`, and `trotz` instead of dodging them.
- Recurring Dativ exceptions stay explicit and teachable next to their Akkusativ twins: `beruhen auf` (Dativ) beside `sich verlassen auf` (Akkusativ), `leiden unter` beside `umsteigen auf`.

## Genitiv and Dativ Plural amendment (2026-09-04)

- `caseForms` grew from three cases to four: every noun anchor now carries a singular **Genitiv** next to Nominativ/Akkusativ/Dativ, and a separate `dativePlural` record holds the `den …` form that learners actually need after `in/mit/bei/von/zu` in the plural.
- Forms are derived by two declared helpers, `deriveGenitiveStem` and `deriveDativePlural`, with 14 hand-authored exceptions (`des Landes`, `des Buches`, `des Busses`, `des Erlebnisses`, `des Zyklus`, `des Namens` beside `des Kollegen`, …). No form is guessed silently: where the rule would be wrong, the override is written down in `GENITIVE_OVERRIDES` with the reason.
- No-plural nouns keep `dativePlural.form === null` with an explicit Arabic note instead of a fabricated plural.
- The prebuild Zod gate rejects a genitive without `des/der`, a weak noun whose genitive ignores its oblique stem, a dative plural that is not `den` + plural ending in n/s, and any mismatch between the plural policy and the dative-plural policy.

## Consequences

- A1–B2 now have 558 noun records and 262 frames across 84/84 published lessons: 336 authored noun anchors (four per lesson) plus 222 glossary-inventory nouns, and 144 authored frames (one per A1 lesson, two per A2/B1/B2 lesson) plus 118 derived from a measured valency inventory.
- The layer is visible and teachable, not documentation-only metadata.
- P0-98 and P0-99 remain partial: the reading glossaries are not the whole curriculum vocabulary, no independent human German review has happened, and both inventories are rule-based measurers rather than morphosyntactic parsers.

## Decision (2026-09-05): extend the noun layer from four anchors to every glossary noun

The same question that P0-99 answered for verbs applied to nouns: "four anchors per lesson" cannot answer "does every target noun have a record?" The layer now measures it.

1. `src/data/noun-inventory.ts` defines a **target noun** as every noun listed in a lesson's `reading.glossary` — a curated lemma list inside the lesson itself (lemma + the surface form that appears in the reading text + an Arabic meaning), not a guess extracted from prose. Measured: **280 target nouns across 81/84 lessons** (A1 85, A2 71, B1 79, B2 45); 58 were already authored anchors in their own lesson, leaving **222 gaps**.
2. `src/data/noun-inventory-seeds.ts` authors the gender and plural of the 181 nouns the layer had never seen, and declares `plural: null` for the ones that take no ordinary plural (21 lemmas). Genitive and dative plural still come from the declared morphology helpers, with one new override (`Lebenszyklus` → `des Lebenszyklus`).
3. When a target noun is already an anchor in another lesson, the inventory record **borrows that anchor's morphology** instead of authoring the word a second time (`Weg` → `des Weges`, `Zyklus` → `des Zyklus`). One morphology, many lessons. The Arabic meaning still comes from the lesson's own glossary, so the record stays tied to its context.
4. `origin: "anchor" | "inventory"` distinguishes the two kinds of record, and the vocabulary stage keeps the four anchors open in the main grid while the inventory nouns sit in a collapsed *Lesetext-Glossar* block so the beginner surface stays calm.

Validator consequences: every glossary target noun must have a record in its own lesson, no inventory record may duplicate an anchor of the same lesson, no inventory record may exist without a glossary target behind it, and no target noun may remain without morphology anywhere in the course (currently 0). The per-lesson anchor contract still requires exactly four **anchors**; the total per lesson is now measured, not fixed.

Known limits: the glossary is not the whole curriculum vocabulary; gender and plural for 181 nouns are authored from knowledge and not reviewed by a human German teacher; and borrowing an anchor's morphology propagates any error in that anchor to every lesson that reuses the word.

## Decision (2026-09-04): measure verb-preposition coverage from the lesson text instead of declaring a frame count

A fixed "one or two frames per lesson" rule cannot answer "is every verb with a prepositional complement covered?" So the layer now carries two new pieces:

1. `src/data/verb-preposition-dictionary.ts` — 214 declared valency entries (147 authored seeds + 67 imported from the already-authored frames so the inventory is not blind to them). 206 are measured; 8 adverbial/temporal patterns (`wohnen in`, `stehen auf`, `ankommen in`, `beginnen um`, `liegen an`, `hängen an`, `entscheiden angesichts`, `erklären trotz`) are declared but deliberately not measured, because measuring them would count every locative or temporal sentence as a gap.
2. `src/data/verb-preposition-coverage.ts` — reads every German string in a lesson, splits it into sentences, and marks an entry as a **target** of that lesson when the verb form and the preposition opening a real nominal complement (determiner, fused form, or a capitalized noun after `nach`) co-occur inside one sentence. Reflexive verbs require a reflexive pronoun in the same sentence; generic copula patterns require their adjective (`zuständig`, `verantwortlich`); `sich krankmelden bei` requires `krank`. Letters are matched case-insensitively but a capitalized match only counts sentence-initially, so the noun `Stelle` is not counted as the verb `stelle`.

Measured result: **141 targets across 66/84 lessons** (A1 29, A2 40, B1 45, B2 27), 23 already covered by authored frames, **118 gaps**. `src/data/lexical-grammar-derived.ts` derives a frame for each gap from the dictionary entry (`origin: "derived"`), so every measured target now has a frame in its lesson, and every derived frame is justified by a sentence the inventory can quote.

Consequences:

- The validator no longer enforces "unique chunk per level" — it enforces "unique chunk per lesson", because the same valency is legitimately a target in several lessons.
- The validator enforces three new gates: every measured target has a frame in its lesson, every derived frame has a measured target behind it, and every frame maps to a declared dictionary entry.
- Frame counts are now measured, not fixed: the prebuild counters report `verbPrepositionFrames: 262`, `derivedVerbFrames: 118`, `measuredValencyTargets: 141`, and `unjustifiedDerivedFrames: 0`.

Known limits: the inventory is a list of authored inflection forms, not a POS tagger, so a verb appearing in an unlisted form or an unlisted valency is invisible to it; adverbial readings are excluded by declaration, not by parsing; and none of this content has been reviewed by a human German teacher.
- Independent German review is still required before calling the registry final linguistic validation.
