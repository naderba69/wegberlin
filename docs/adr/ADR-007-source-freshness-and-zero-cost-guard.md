# ADR-007 — Versioned source freshness and fail-closed remote AI

Date: 2026-09-03  
Status: accepted

## Context

Exam formats and external free tiers can change without a code change. A working URL or successful API request does not prove that stored timing, scoring, pricing, quota, or privacy claims remain current. The project has a hard 0 USD invariant and must not silently continue remote inference on stale assumptions.

## Decision

- Maintain one versioned JSON registry of official exam, AI, hosting, and CI sources.
- Require human semantic verification every 30 days; show `due-soon` during the final seven days.
- Include a strict freshness audit in `npm run check`.
- Run a monthly GitHub workflow that probes reachability and opens/updates a maintenance Issue.
- Treat HTTP reachability only as an alarm signal, never semantic validation.
- Compute exam-profile freshness in the Exam Hub.
- Fail closed before remote AI `fetch` when the model is not in the verified free boundary or the relevant source is stale.
- Keep Disabled/local Ollama and all authored learning available regardless of external status.

## Consequences

- Releases require routine source maintenance rather than silently carrying old claims.
- Remote AI may become temporarily unavailable after 30 days even while the provider still works; this is intentional under the zero-cost policy.
- The Goethe HTML overview's anti-bot 403 requires a documented manual check, while its official PDFs remain probeable.
- Advancing a date without comparing meaning violates the policy.
