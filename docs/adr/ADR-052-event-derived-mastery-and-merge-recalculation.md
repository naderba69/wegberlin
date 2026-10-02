# ADR-052 — Event-derived mastery and deterministic post-Merge recalculation

- Status: accepted
- Date: 2026-09-10
- Scope: P2-72, P2-237

## Decision

`event-derived-mastery-v1` treats `LearningState.mastery` as a materialized cache for all new runtime changes. The single `LearningProvider.update` boundary compares current and candidate state and records every changed key as a strict append/upsert event:

- `set` for a new measured result;
- `increment` for a delayed-review delta;
- `delete` for removing a workflow marker or obsolete key.

Each event records stable ID, key, operation, value, previous and resulting values, bounded source category, non-text evidence references, timestamp, and `event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit`. It stores no learner answer text or API secret.

After capture, import, or Merge, `recalculateMasteryFromEvidence` rematerializes event-owned keys. Merge first unions event IDs. Distinct concurrent increment events start from the event baseline and accumulate; a duplicate ID is applied once; a later set may legitimately lower an older score; a delete prevents an older workflow marker from being resurrected. This replaces previous newer-snapshot conflict handling for keys with events.

## Backward compatibility

Old schema-v3 and migrated schema-v1/v2 snapshots have no invented historical events. Their existing mastery keys remain explicit Legacy fallback. The first new mutation for a key creates an authoritative event; Progress shows event count, event-derived key count, and remaining fallback count.

The event list is strict-Zod validated, stored in IndexedDB, included in DWNB and selective progress export, normalized after import, and merged by stable ID. This does not claim psychometric calibration: events preserve evidence-derived product decisions, not an official CEFR or exam score.

## Consequences

- P2-72 closes because new mastery mutations are event-owned and rematerialized rather than existing only as final numbers.
- P2-237 closes because post-Merge values are reduced from the unioned event log, not selected by maximum or snapshot timestamp.
- Legacy fallback remains visible and honest instead of fabricating retroactive provenance.
- P2-70/287 remains next: event provenance does not yet compute separate assisted and independent performance views.

## Evidence

- `src/core/evidence/event-derived-mastery.ts`
- `src/components/learning-provider.tsx`
- `src/core/portability/schema.ts`
- `src/core/portability/merge.ts`
- `src/core/portability/backup.ts`
- `src/app/progress/page.tsx`
- `tests/unit/event-derived-mastery.test.ts`
- `tests/e2e/critical-flows.spec.ts`
