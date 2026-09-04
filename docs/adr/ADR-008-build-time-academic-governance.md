# ADR-008 — Build-time academic schemas and traceability reports

Date: 2026-09-03  
Status: accepted

## Context

TypeScript declarations and recursive non-empty tests cannot prove that runtime-authored objects match their complete discriminated shape, that every keyed item is linked to evidence, or that every lesson objective has visible teaching, practice, and assessment surfaces. Generic answer-string scanning also creates false positives for legitimate option banks, ordering tokens, matching columns, capitalization correction, and repeated greetings.

## Decision

- Validate every published academic root and nested object through 12 strict Zod schema families during `prebuild`.
- Reject unknown keys, missing nested fields, invalid indexes, and broken task/clip/option/source references.
- Generate one item-level registry for every closed answer and productive task.
- Apply type-aware visibility policies and require explicit stable-ID exemptions for intentional repeated answer surfaces.
- Generate a lesson-scoped map for every Can-Do objective linking teaching, practice, and Mini-Test references.
- Commit readable Markdown reports and the complete machine JSON with one shared SHA-256.
- Fail `prebuild` when generated artifacts drift from the runtime content.

## Consequences

- Published content changes require `npm run content:audit:write` followed by the full quality gate.
- Structural validity and direct leakage detection become deterministic release gates.
- The generated machine report is large because it preserves all 2,584 answer rows and 336 objective maps.
- Zod cannot establish linguistic correctness, and lesson-scoped objective mapping does not replace human item-level semantic review; those limits remain explicit.
