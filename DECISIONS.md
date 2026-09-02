# Architecture Decisions

## ADR-001 — Local-first learner state
IndexedDB is the canonical durable store. Vercel hosts the application but never stores learner progress.

## ADR-002 — Guidance-first home
Returning learners land on `/today`. The curriculum path is secondary and does not grant mastery through browsing.

## ADR-003 — Zero mandatory cost
Core course features work without AI. Gemini/OpenRouter are optional BYOK enhancements; local AI remains a future adapter.

## ADR-004 — Portable learner ownership
The app exports/imports a versioned `.dwnb` archive. API secrets are never exported.

## ADR-005 — Honest curriculum status
Only academically populated lessons are marked `published`; mapped but unwritten lessons are `planned`.
