# ADR-010 — Progressive structured lexical grammar layer

Date: 2026-09-03  
Status: accepted for A1 batch; broader coverage pending

## Context

The course teaches vocabulary in chunks, but noun gender/plural/case and verb-preposition-case relations were mainly embedded in prose and examples. Adding complete paradigms everywhere at once would create a large linguistic-review risk and could overwhelm a true beginner.

## Decision

- Add a versioned `a1-lexical-grammar-v1` registry rather than inferring grammar at render time.
- Author four high-priority noun anchors and one verb-preposition frame for each of the 24 A1 lessons.
- Store noun article, gender, plural or explicit no-usual-plural policy, Arabic meaning, and Nominativ/Akkusativ/Dativ forms.
- Allow explicit oblique singular forms for weak masculine nouns such as `der Name → den Namen` and `der Kollege → den Kollegen`.
- Store verb infinitive, preposition, governed case, reusable chunk, German example, and Arabic contrast.
- Render German first in the vocabulary stage. Keep case tables collapsed by default so beginners see article/plural before optional paradigms.
- Validate all records through strict Zod during `prebuild` and keep exact level/lesson counters.

## Consequences

- A1 now has 96 noun anchors and 24 frames across 24/24 lessons.
- The layer is visible and teachable, not documentation-only metadata.
- P0-98 and P0-99 remain partial: four anchors and one frame per A1 lesson are not every target noun/frame, and A2–B2 still need authored batches.
- Independent German review is still required before calling the registry final linguistic validation.
