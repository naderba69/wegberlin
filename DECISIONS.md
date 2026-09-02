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
