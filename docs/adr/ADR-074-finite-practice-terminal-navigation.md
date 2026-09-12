# ADR-074 — Finite practice has terminal navigation, not silent modulo loops

- **Status:** accepted and implemented
- **Date:** 2026-09-12
- **Scope:** Dictation, branching conversations, collocation networks, contextual appropriateness, quick practice routing

## Context

Several finite practice surfaces labeled their action “next” but used modulo arithmetic. The last authored item silently returned to the first item, making a completed set look endless. The five-minute coach could also follow a stale aggregate review counter even when no eligible card existed.

## Decision

1. Finite practice surfaces must not use modulo for learner-visible forward navigation.
2. Dictation, branching scenarios, and collocation networks advance to the next item, then the next CEFR level. The last B2 item returns to Today or the Practice hub.
3. Context-appropriateness ends in an explicit summary. Restart is a separate learner choice.
4. Retry remains available for deliberate repair and never disguises itself as forward progress.
5. Five-minute practice derives review routing from `buildDueReviewQueue`. A stale materialized `dueReviews` number cannot create an empty Review detour.
6. An empty state starts with `dueReviews=0`.
7. Learner-facing labels resolve provider, lesson, and content context to human names; technical IDs remain persistence/export metadata.

## Boundary

These changes prove deterministic terminal navigation and evidence-consistent routing. They do not prove that every exercise is pedagogically optimal or independently reviewed. Human curriculum review remains pending.
