# ADR-010 — Progressive structured lexical grammar layer

Date: 2026-09-03  
Status: accepted for the A1 and A2 batches; B1–B2 coverage and human linguistic review pending

## Context

The course teaches vocabulary in chunks, but noun gender/plural/case and verb-preposition-case relations were mainly embedded in prose and examples. Adding complete paradigms everywhere at once would create a large linguistic-review risk and could overwhelm a true beginner.

## Decision

- Add versioned `a1-lexical-grammar-v1` and `a2-lexical-grammar-v1` registries rather than inferring grammar at render time.
- Author four high-priority noun anchors per lesson, plus one verb-preposition frame for each of the 24 A1 lessons and two for each of the 24 A2 lessons.
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

## Consequences

- A1 + A2 now have 192 noun anchors and 72 frames across 48/48 lessons.
- The layer is visible and teachable, not documentation-only metadata.
- P0-98 and P0-99 remain partial: four anchors plus one or two frames per lesson are not every target noun/frame, B1–B2 still need authored batches, and no human German review has happened.
- Independent German review is still required before calling the registry final linguistic validation.
