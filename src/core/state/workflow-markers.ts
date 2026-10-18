import type { LearningState, MasteryEvidenceEvent, WorkflowMarker } from "@/types/learning";

/**
 * ADR-131 (م34): full-exam "started"/"completed" markers are UI workflow state, not learning
 * evidence. They used to live in `mastery` and produced `full-exam-workflow` mastery events.
 * They now live in `workflowMarkers` with a timestamp; a reset writes a tombstone (`value: null`)
 * so an older backup cannot resurrect a marker during merge.
 */
export const WORKFLOW_MARKERS_POLICY = "workflow-markers-separate-from-mastery-v1" as const;
const WORKFLOW_MARKER_KEY = /^full-exam-.+-(started|completed)$/u;

export function isWorkflowMarkerKey(key: string): boolean {
  return WORKFLOW_MARKER_KEY.test(key);
}

export function fullExamMarkerKeys(simulationId: string) {
  return { started: `full-exam-${simulationId}-started`, completed: `full-exam-${simulationId}-completed` };
}

export function workflowMarkerValue(state: Pick<LearningState, "workflowMarkers">, key: string): number | undefined {
  const marker = state.workflowMarkers?.[key];
  return marker && marker.value !== null ? marker.value : undefined;
}

export function setWorkflowMarker(markers: Record<string, WorkflowMarker>, key: string, value: number | null, now = new Date()): Record<string, WorkflowMarker> {
  return { ...markers, [key]: { value, updatedAt: now.toISOString() } };
}

/** Latest timestamp wins per key; a tombstone is a real, newer state. */
export function mergeWorkflowMarkers(left: Record<string, WorkflowMarker> = {}, right: Record<string, WorkflowMarker> = {}): Record<string, WorkflowMarker> {
  const result: Record<string, WorkflowMarker> = { ...left };
  for (const [key, marker] of Object.entries(right)) {
    const current = result[key];
    if (!current || Date.parse(marker.updatedAt) > Date.parse(current.updatedAt)) result[key] = marker;
  }
  return result;
}

/**
 * Moves legacy marker keys out of `mastery` and drops their mastery events. The latest legacy
 * event (set or delete) decides the migrated marker and its timestamp; a key with no event uses
 * the snapshot value and the state's `updatedAt`. Idempotent.
 */
export function separateWorkflowMarkers(state: LearningState): LearningState {
  const legacyKeys = Object.keys(state.mastery).filter(isWorkflowMarkerKey);
  const legacyEvents = state.masteryEvidenceEvents.filter((event) => isWorkflowMarkerKey(event.key));
  if (!legacyKeys.length && !legacyEvents.length) return state.workflowMarkers ? state : { ...state, workflowMarkers: {} };
  const migrated: Record<string, WorkflowMarker> = {};
  const latestByKey = new Map<string, MasteryEvidenceEvent>();
  for (const event of legacyEvents) {
    const previous = latestByKey.get(event.key);
    if (!previous || Date.parse(event.createdAt) >= Date.parse(previous.createdAt)) latestByKey.set(event.key, event);
  }
  for (const [key, event] of latestByKey) migrated[key] = { value: event.operation === "delete" ? null : (event.resultingValue ?? state.mastery[key] ?? null), updatedAt: event.createdAt };
  for (const key of legacyKeys) if (!migrated[key]) migrated[key] = { value: state.mastery[key], updatedAt: state.updatedAt };
  const mastery = Object.fromEntries(Object.entries(state.mastery).filter(([key]) => !isWorkflowMarkerKey(key)));
  return {
    ...state,
    mastery,
    masteryEvidenceEvents: state.masteryEvidenceEvents.filter((event) => !isWorkflowMarkerKey(event.key)),
    workflowMarkers: mergeWorkflowMarkers(migrated, state.workflowMarkers ?? {}),
  };
}
