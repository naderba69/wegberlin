// @vitest-environment node
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { evidenceFreshness, EVIDENCE_FRESHNESS_POLICY } from "@/core/evidence/freshness";
import { buildEvidenceReport } from "@/core/evidence/report";
import { appendSupportUsageEvent, createSupportUsageEvent, summarizeSupportUsage, SUPPORT_USAGE_BOUNDARY } from "@/core/evidence/support-usage";
import { exportArchive, importArchive } from "@/core/portability/backup";
import { defaultState } from "@/core/portability/db";
import { mergeLearningStates } from "@/core/portability/merge";
import { learningStateSchema } from "@/core/portability/schema";

const hint = createSupportUsageEvent({ kind:"hint", surface:"lesson", contentId:"a1-01-e1", lessonId:"a1-01", supportLevel:1, afterCommit:false }, new Date("2026-09-07T08:00:00Z"), "support-hint");
const transcript = createSupportUsageEvent({ kind:"listening-transcript", surface:"lesson", contentId:"a1-01:listening", lessonId:"a1-01", afterCommit:true }, new Date("2026-09-07T08:05:00Z"), "support-transcript");

describe("support-use provenance and evidence freshness", () => {
  it("creates an explicit support event without correctness or mastery fields", () => {
    expect(hint).toMatchObject({ policyVersion:"support-usage-v1", supportLevel:1, afterCommit:false, evidenceBoundary:SUPPORT_USAGE_BOUNDARY });
    expect(hint).not.toHaveProperty("correct");
    expect(hint).not.toHaveProperty("masteryDelta");
  });

  it("deduplicates event ids while preserving separate real support actions", () => {
    const once = appendSupportUsageEvent([], hint);
    expect(appendSupportUsageEvent(once, hint)).toEqual(once);
    expect(appendSupportUsageEvent(once, transcript)).toHaveLength(2);
  });

  it("summarizes support categories and post-commit context without a penalty", () => {
    const summary = summarizeSupportUsage([hint, transcript]);
    expect(summary).toMatchObject({ total:2, distinctContent:2, hints:1, transcripts:1, afterCommit:1, evidenceBoundary:SUPPORT_USAGE_BOUNDARY });
    expect(summary.latestAt).toBe(transcript.createdAt);
  });

  it("defaults old schema-v3 state to an empty support log", () => {
    const older: Record<string, unknown> = { ...defaultState };
    delete older.supportUsageEvents;
    expect(learningStateSchema.parse(older).supportUsageEvents).toEqual([]);
  });

  it("merges support provenance by id without changing mastery", () => {
    const current = { ...defaultState, supportUsageEvents:[hint], updatedAt:"2026-09-07T08:00:00Z" };
    const incoming = { ...defaultState, supportUsageEvents:[hint, transcript], updatedAt:"2026-09-07T09:00:00Z" };
    const merged = mergeLearningStates(current, incoming);
    expect(merged.supportUsageEvents.map((event) => event.id).sort()).toEqual(["support-hint", "support-transcript"]);
    expect(merged.mastery).toEqual(defaultState.mastery);
  });

  it("round-trips support use in DWNB without inventing learning evidence", async () => {
    const archive = await exportArchive({ ...defaultState, supportUsageEvents:[hint, transcript] }, { includeMedia:false });
    const imported = await importArchive(archive);
    expect(imported.state.supportUsageEvents).toEqual([hint, transcript]);
    expect(imported.state.exerciseAttempts).toEqual([]);
  });

  it("applies versioned 30/90/180-day confidence bands", () => {
    const now = new Date("2026-09-07T12:00:00Z");
    expect(evidenceFreshness("2026-08-20T12:00:00Z", "high", now)).toMatchObject({ policyVersion:EVIDENCE_FRESHNESS_POLICY, band:"fresh", factor:1, adjustedConfidence:"high" });
    expect(evidenceFreshness("2026-07-29T12:00:00Z", "high", now)).toMatchObject({ band:"recent", factor:0.85, adjustedConfidence:"medium" });
    expect(evidenceFreshness("2026-05-01T12:00:00Z", "high", now)).toMatchObject({ band:"aging", factor:0.65, adjustedConfidence:"low" });
    expect(evidenceFreshness("2025-01-01T12:00:00Z", "high", now)).toMatchObject({ band:"stale", factor:0.4, adjustedConfidence:"low" });
  });

  it("lowers report confidence for old evidence without deleting attempts or changing its score", () => {
    const attempts = academicLessonList.flatMap((lesson) => lesson.reading.questions.slice(0, 1).map((question) => ({
      id:`old-${question.id}`, lessonId:lesson.id, exerciseId:question.id, answer:question.options[question.correctIndex], correct:true, createdAt:"2025-01-01T10:00:00Z",
    }))).slice(0, 15);
    const state = { ...defaultState, exerciseAttempts:attempts };
    const reading = buildEvidenceReport(state, new Date("2026-09-07T12:00:00Z")).skills.find((skill) => skill.key === "reading")!;
    expect(reading).toMatchObject({ score:100, baseConfidence:"high", confidence:"low", freshness:{ band:"stale", factor:0.4 } });
    expect(state.exerciseAttempts).toHaveLength(15);
    expect(state.mastery).toEqual(defaultState.mastery);
  });
});
