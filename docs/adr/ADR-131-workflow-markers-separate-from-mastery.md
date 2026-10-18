# ADR-131: Workflow markers are separated from mastery evidence (م34)

- Status: accepted, 2026-10-18 (v239)
- Policy ID: `workflow-markers-separate-from-mastery-v1` (new). `event-derived-mastery-v1` is unchanged.
- Evidence tier: agent-authored engineering change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»).

## Context

Ledger row م34 said that `mastery` still mixed UI flags with mastery evidence in export and import. Measured in the source:

- `full-exam-${id}-started` (value 1) and `full-exam-${id}-completed` (value 100) are written by the full-exam rehearsal screen. They only record that the learner opened or closed a rehearsal. They say nothing about language ability.
- Because they lived in `mastery`, every change went through `captureMasteryMutationEvents`. So opening a rehearsal created a **mastery evidence event** with source `full-exam-workflow`.
- These keys also inflated `masteryDerivationSummary().legacyFallbackKeys` and the reset wizard's `masteryCount`.

The other keys named in the ledger were checked one by one:

| Key | Written by | What it is | Decision |
|---|---|---|---|
| `full-exam-*-started` / `-completed` | full-exam rehearsal screen | UI workflow state | **moved out of `mastery`** |
| `level-*-knowledge` / `-retention-verified` / `-ready` | level assessment after a 48-item form | assessment outcome derived from stored attempts (`buildLevelEvidenceGate`) | stays an assessment result |
| `module-*` | module review (score × 10) | assessment score | stays |
| `exam-target-*` | targeted exam simulations | assessment score | stays |
| `diagnostic` | diagnostic | assessment score | stays |

`level-*-ready` is a gate result rather than a raw score. It is still produced only by evaluating stored attempts, and its readers already treat it as legacy and unverified when no run exists (`legacyReadyUnverified`). Moving it would change four readers without changing what the value means.

## Decision

1. **New state field `workflowMarkers: Record<string, { value: number | null; updatedAt: string }>`**, with schema default `{}`.
   - Older schema-v3 snapshots and archives therefore parse unchanged. There is no schema version bump and no reset.
   - `value: null` is a **tombstone**. Merges keep the newest `updatedAt` per key, so resetting a rehearsal on one device is not undone by importing an older backup. Before this change the event log's `delete` events gave that protection; the tombstone keeps it.
2. **Migration at the single load and import chokepoint.** `normalizeEventDerivedMastery`, used by local load, profile switch and archive import, now calls `separateWorkflowMarkers` first. `mergeLearningStates` also calls it on both sides. The migration:
   - moves marker keys out of `mastery`;
   - drops their legacy `full-exam-workflow` events;
   - takes the value and timestamp from the newest legacy event. A legacy `delete` becomes a tombstone. A key with no event uses the snapshot value and the state's `updatedAt`.
   - It is idempotent.
3. **`captureMasteryMutationEvents` ignores marker keys**, so a stray write can never produce mastery evidence again.
4. **The full-exam screen and the exam hub** read and write markers through `workflowMarkerValue`, `setWorkflowMarker` and `fullExamMarkerKeys`. "Reset marker" writes two tombstones.
5. **Reset and partial export.** The reset plan classifies `workflowMarkers` as progress, so it is cleared with `examSessions`. Classified fields go from 68 to 69, and cleared fields from 19 to 20. Partial export puts the field next to `mastery` in the progress section.
6. The `full-exam-workflow` value stays in the event-source enum so that old archives still parse. Normalisation removes those events after parsing.

## Consequences

- `mastery` and its event log now hold assessment and lesson evidence only. A rehearsal opened but never finished no longer shows up as "mastery".
- There is no learner-visible behaviour change in the rehearsal flow. Tests cover the migration, idempotence, merges in both orders with tombstones, the legacy backup case, archive import, and reset classification.
- **Not done:** `level-*-ready` remains a stored gate result instead of being recomputed on every read. That would be a separate readability change, not part of separating UI flags from evidence.
