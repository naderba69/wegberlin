# ADR-010 — Progressive structured lexical grammar layer

Date: 2026-09-03  
Status: accepted for A1–B2 anchor batches; exhaustive audit pending

## Context

The course teaches vocabulary in chunks, but noun gender/plural/case and verb-preposition-case relations were mainly embedded in prose and examples. Adding complete paradigms everywhere at once would create a large linguistic-review risk and could overwhelm a true beginner.

## Decision

- Add a versioned `a1-lexical-grammar-v1`, `a2-lexical-grammar-v1`, `b1-lexical-grammar-v1`, and `b2-lexical-grammar-v1` registries rather than inferring grammar at render time.
- Author four high-priority noun anchors and one verb-preposition frame for each of the 84 A1–B2 lessons.
- Store noun article, grammatical class, plural or explicit no-usual-plural policy, Arabic meaning, and Nominativ/Akkusativ/Dativ forms. `plural-only` owns die/die/den forms and never invents singular gender.
- Allow explicit oblique singular forms for weak masculine nouns such as `der Name → den Namen` and `der Kollege → den Kollegen`.
- Store verb infinitive, preposition, governed case, reusable chunk, German example, and Arabic contrast.
- Render German first in the vocabulary stage. Keep case tables collapsed by default so beginners see article/plural before optional paradigms.
- Validate all records through strict Zod during `prebuild` and keep exact level/lesson counters.

## Consequences

- A1–B2 established a 336-noun/84-frame baseline across 84/84 lessons; six noun batches and two frame batches expand the registries to 1,044 nouns and 104 frames. Nouns are A1/A2/B1/B2 = 272/269/135/48; frames are 25/30/31/18. A1 and A2 have zero pending machine noun targets.
- The layer is visible and teachable, not documentation-only metadata.
- P0-98 and P0-99 remain partial: the gap inventory now proves the fixed baseline is not exhaustive, and reviewed batches must extend coverage without inventing grammar.
- The second noun batch adds 28 A1-04..06 targets for family, contact data, professions, and workplaces. `die Eltern`, `die Kontaktdaten`, and `die Übungsdaten` verify the plural-only path.
- The third noun batch adds 40 A1-07..12 targets for schedules, food, quantities, shopping, and restaurants. It verifies count plurals, mass/no-usual-plural meanings, and `Apfel → Äpfel` alias coverage.
- The fourth noun batch adds 40 A1-13..18 records for housing, furniture, rent, hobbies, and weather. Optional `plural.dativeForm` makes `Stühle → Stühlen` explicit and searchable without creating a second lemma.
- The fifth noun batch adds 58 A1-19..24 records for transport, directions, body/health, and forms. `Auge → Augen`, `Tablette → Tabletten`, and `das Deutsch` close the remaining A1 target rows without plural lemmas.
- The sixth maximum batch adds all 173 A2 targets. Base lemmas such as `Anforderung`, `Name`, `Unterrichtsstunde`, and `Woche` own their authored plural/oblique surfaces; A2 pending becomes zero.
- The current seven-frame batch covers payment means, door location, medication with water, spaced learning, grouping criteria, speaking notes, and impact-based prioritization. Six extracted candidates remain for independent accept/exclude review.
- Independent German review is still required before calling the registry final linguistic validation.
