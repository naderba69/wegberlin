// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import { captureMasteryMutationEvents, normalizeEventDerivedMastery } from "@/core/evidence/event-derived-mastery";
import { mergeLearningStates } from "@/core/portability/merge";
import { learningStateSchema } from "@/core/portability/schema";
import { exportArchive, importArchive } from "@/core/portability/backup";
import { RESET_CLEARED_FIELDS } from "@/core/state/reset-plan";
import { fullExamMarkerKeys, isWorkflowMarkerKey, separateWorkflowMarkers, setWorkflowMarker, workflowMarkerValue, WORKFLOW_MARKERS_POLICY } from "@/core/state/workflow-markers";
import type { LearningState, MasteryEvidenceEvent } from "@/types/learning";

const legacyEvent = (key: string, operation: MasteryEvidenceEvent["operation"], createdAt: string, resultingValue?: number): MasteryEvidenceEvent => ({ id: `legacy:${key}:${operation}:${createdAt}`, policyVersion: "event-derived-mastery-v1", key, operation, value: resultingValue, resultingValue, source: "full-exam-workflow", evidenceRefs: [], evidenceBoundary: "event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit", createdAt });
const keys = fullExamMarkerKeys("x");

describe("ADR-131 workflow markers are separated from mastery evidence (م34)", () => {
  it("classifies only full-exam started/completed keys as workflow markers", () => {
    expect(WORKFLOW_MARKERS_POLICY).toBe("workflow-markers-separate-from-mastery-v1");
    expect(isWorkflowMarkerKey(keys.started)).toBe(true);
    expect(isWorkflowMarkerKey(keys.completed)).toBe(true);
    for (const key of ["a1-01", "diagnostic", "module-a1-1", "level-a1-ready", "level-a1-knowledge", "exam-target-x"]) expect(isWorkflowMarkerKey(key), key).toBe(false);
  });
  it("migrates legacy snapshot keys and legacy events, keeping a legacy delete as a tombstone", () => {
    const legacy: LearningState = { ...defaultState, updatedAt: "2026-09-12T08:00:00.000Z", mastery: { [keys.started]: 1, "a1-01": 70 }, masteryEvidenceEvents: [legacyEvent(keys.completed, "set", "2026-09-10T10:00:00.000Z", 100), legacyEvent(keys.completed, "delete", "2026-09-11T10:00:00.000Z")] };
    const next = normalizeEventDerivedMastery(legacy);
    expect(next.mastery).toEqual({ "a1-01": 70 });
    expect(next.masteryEvidenceEvents).toEqual([]);
    expect(next.workflowMarkers).toEqual({ [keys.started]: { value: 1, updatedAt: "2026-09-12T08:00:00.000Z" }, [keys.completed]: { value: null, updatedAt: "2026-09-11T10:00:00.000Z" } });
    expect(workflowMarkerValue(next, keys.started)).toBe(1);
    expect(workflowMarkerValue(next, keys.completed)).toBeUndefined();
    expect(separateWorkflowMarkers(next)).toEqual(next);
  });
  it("never turns a workflow marker into a mastery evidence event", () => {
    const next = captureMasteryMutationEvents(defaultState, { ...defaultState, mastery: { [keys.started]: 1, "exam-target-x": 80 } }, new Date("2026-09-10T09:00:00Z"));
    expect(next.masteryEvidenceEvents.map((event) => event.key)).toEqual(["exam-target-x"]);
  });
  it("lets a newer reset tombstone win a merge in either order, so an old backup cannot resurrect a marker", () => {
    const started = { ...defaultState, workflowMarkers: setWorkflowMarker({}, keys.started, 1, new Date("2026-09-10T09:00:00Z")) };
    const reset = { ...defaultState, workflowMarkers: setWorkflowMarker(started.workflowMarkers, keys.started, null, new Date("2026-09-11T09:00:00Z")) };
    expect(workflowMarkerValue(mergeLearningStates(started, reset), keys.started)).toBeUndefined();
    expect(workflowMarkerValue(mergeLearningStates(reset, started), keys.started)).toBeUndefined();
    const legacyBackup: LearningState = { ...defaultState, updatedAt: "2026-09-09T00:00:00.000Z", mastery: { [keys.started]: 1 } };
    expect(workflowMarkerValue(mergeLearningStates(reset, legacyBackup), keys.started)).toBeUndefined();
    expect(mergeLearningStates(reset, legacyBackup).mastery[keys.started]).toBeUndefined();
  });
  it("parses an older schema-v3 snapshot without the field and separates markers on archive import", async () => {
    const legacy = { ...defaultState } as Partial<LearningState>;
    delete legacy.workflowMarkers;
    expect(learningStateSchema.parse(legacy).workflowMarkers).toEqual({});
    const blob = await exportArchive({ ...defaultState, mastery: { [keys.completed]: 100, "module-a1-1": 80 } });
    const imported = await importArchive(blob);
    expect(imported.state.mastery).toEqual({ "module-a1-1": 80 });
    expect(workflowMarkerValue(imported.state, keys.completed)).toBe(100);
  });
  it("clears workflow markers with the other progress fields on reset", () => {
    expect(RESET_CLEARED_FIELDS).toContain("workflowMarkers");
  });
});
