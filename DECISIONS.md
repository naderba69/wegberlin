# Architecture Decisions

## ADR-001 — Local-first learner state
IndexedDB is the canonical durable store. Vercel hosts the application but never stores learner progress.

## ADR-002 — Guidance-first home
Returning learners land on `/today`. The curriculum path is secondary and does not grant mastery through browsing.

## ADR-003 — Zero mandatory cost
Core course features work without AI. Gemini/OpenRouter Free-only are optional BYOK enhancements; Ollama-compatible local chat is implemented, and an in-browser WebGPU model remains future work.

## ADR-004 — Portable learner ownership
The app exports/imports a versioned `.dwnb` archive. API secrets are never exported.

## ADR-005 — Honest curriculum status
Only academically populated lessons are marked `published`; mapped but unwritten lessons are `planned`.

## ADR-006 — Audited continuation handoff
`PROFESSIONAL_CONTINUATION_PROMPT_AR.md` is the pasteable recovery prompt, but it cannot override the code or source-of-truth documents. `npm run handoff:check` must fail when backlog counts, P0 status, audio/Offline counters, framework versions, cache version, or documented test counters drift.

## ADR-007 — Monthly source freshness and fail-closed remote AI
Official exam formats, AI free-tier rules, Vercel Hobby terms, and GitHub Actions billing are registered with stable IDs and a 30-day human-review clock. `npm run check` fails on stale records, a monthly workflow opens a maintenance Issue, and unverified/stale remote AI is blocked before `fetch` while local learning remains available. HTTP reachability is never treated as semantic verification. See `docs/adr/ADR-007-source-freshness-and-zero-cost-guard.md`.

## ADR-008 — Build-time academic governance
Ten strict Zod families validate every runtime academic root and nested object during `prebuild`. A type-aware answer registry links every closed item to its answer and evidence, productive work remains no-single-answer, and every lesson objective receives a teaching→practice→assessment map. Markdown and machine reports share one SHA-256 and stale artifacts fail the build. Structural automation is not represented as human linguistic review. See `docs/adr/ADR-008-build-time-academic-governance.md`.

## ADR-009 — Novelty-weighted mastery and zoned review days
Initial lesson mastery weights unseen transfer above guided practice and counts only the latest same-item retry at 0.25, preventing click inflation. SM-2 v2 adds intervals in an injected IANA local calendar before converting to UTC, records the calendar policy/timezone, and preserves legacy v1 records. Stable item-ID novelty and local-day scheduling are deterministic but not psychometric calibration or retroactive timezone migration. See `docs/adr/ADR-009-novelty-weighting-and-zoned-review-days.md`.

## ADR-010 — Progressive structured lexical grammar
Versioned A1, A2, B1, and B2 registries author four noun anchors per lesson plus one verb-preposition-case frame per A1 lesson and two per A2/B1/B2 lesson, render them German-first with optional collapsed case tables, and validate every record during `prebuild` through a level-driven contract that also allows Genitiv prepositions. This is a staged linguistic layer: A1–B2 now hold 336 nouns/144 frames across 84/84 published lessons, while exhaustive target-vocabulary coverage, the nominal Genitiv form, dative plural, and human German review remain partial. See `docs/adr/ADR-010-progressive-lexical-grammar-layer.md`.
