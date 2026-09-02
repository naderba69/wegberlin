import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { examAudioManifest } from "@/data/exam-audio-assets";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";

describe("generated exam-practice audio", () => {
  it("publishes an exhaustive 42-task coverage audit without overstating full-simulation audio", () => {
    expect(examAudioManifest.format).toBe("dwnb-exam-audio");
    expect(examAudioManifest.version).toBe(2);
    expect(examAudioManifest.generatedAssetCount).toBe(96);
    expect(examAudioManifest.coveredClipCount).toBe(90);
    expect(examAudioManifest.partiallyCoveredClipCount).toBe(0);
    expect(examAudioManifest.totalLogicalClipCount).toBe(90);
    expect(examAudioManifest.fullyCoveredTaskCount).toBe(42);
    expect(examAudioManifest.completeTargetedTaskCount).toBe(7);
    expect(examAudioManifest.completeFullSimulationTaskCount).toBe(35);
    expect(examAudioManifest.partiallyCoveredTaskCount).toBe(0);
    expect(examAudioManifest.totalListeningTaskCount).toBe(42);
    expect(examAudioManifest.totalTargetedListeningTaskCount).toBe(7);
    expect(examAudioManifest.totalFullSimulationListeningTaskCount).toBe(35);
    expect(examAudioManifest.humanRecordedAssetCount).toBe(0);
    expect(examAudioManifest.usageNoteAr).toContain("ليس صوت Goethe أو telc الرسمي");
  });

  it("keeps manifest coverage synchronized with every published listening task and clip", () => {
    const tasks = allPublishedExamTasks.filter((task) => task.kind === "listening");
    expect(tasks).toHaveLength(42);
    expect(examAudioManifest.taskCoverage).toHaveLength(42);
    expect(new Set(examAudioManifest.taskCoverage.map((coverage) => coverage.taskId)).size).toBe(42);

    for (const coverage of examAudioManifest.taskCoverage) {
      const task = tasks.find((item) => item.id === coverage.taskId);
      expect(task?.provider).toBe(coverage.provider);
      expect(task?.clips).toHaveLength(coverage.requiredClipCount);
      expect(task?.audioStatus).toBe(coverage.status === "complete" ? "generated-file-with-browser-tts-fallback" : "browser-tts-only");
      expect(coverage.coveredClipCount + coverage.missingClipIds.length).toBe(coverage.requiredClipCount);
      expect(coverage.missingClipIds.every((clipId) => task?.clips.some((clip) => clip.id === clipId))).toBe(true);
      if (coverage.status === "complete") {
        expect(coverage.missingClipIds).toHaveLength(0);
        expect(coverage.coveredClipCount).toBe(coverage.requiredClipCount);
      }
    }

    expect(examAudioManifest.taskCoverage.filter((coverage) => coverage.scope === "targeted")).toHaveLength(7);
    expect(examAudioManifest.taskCoverage.filter((coverage) => coverage.scope === "full-simulation")).toHaveLength(35);
    expect(examAudioManifest.taskCoverage.filter((coverage) => coverage.status === "complete")).toHaveLength(examAudioManifest.fullyCoveredTaskCount);
  });

  it("marks every Full 02–06 listening task complete only after all physical clips exist", () => {
    for (const batch of ["full-02-listening", "full-03-listening", "full-04-listening", "full-05-listening", "full-06-listening"]) {
      const coverage = examAudioManifest.taskCoverage.filter((item) => item.taskId.includes(batch));
      expect(coverage).toHaveLength(7);
      expect(coverage.every((item) => item.status === "complete")).toBe(true);
      expect(coverage.every((item) => item.missingClipIds.length === 0)).toBe(true);
    }
    expect(examAudioManifest.taskCoverage.every((coverage) => coverage.status === "complete")).toBe(true);
  });

  it("maps every asset to its provider-owned original listening clip", () => {
    const tasks = allPublishedExamTasks.filter((task) => task.kind === "listening");
    for (const asset of examAudioManifest.assets) {
      const task = tasks.find((item) => item.id === asset.taskId);
      expect(task?.provider).toBe(asset.provider);
      expect(task?.clips.some((clip) => clip.id === asset.clipId)).toBe(true);
      expect(asset.sourceContent).toBe("original-exam-practice-transcript");
      expect(asset.examGrade).toBe(false);
    }
  });

  it("keeps segmented clips complete, ordered, and provider-separated", () => {
    expect(new Set(examAudioManifest.assets.map((asset) => asset.fileId)).size).toBe(96);
    expect(new Set(examAudioManifest.assets.map((asset) => asset.clipId)).size).toBe(90);
    expect(examAudioManifest.assets.filter((asset) => asset.provider === "goethe-b2")).toHaveLength(53);
    expect(examAudioManifest.assets.filter((asset) => asset.provider === "telc-deutsch-b2")).toHaveLength(43);
    for (const clipId of new Set(examAudioManifest.assets.map((asset) => asset.clipId))) {
      const parts = examAudioManifest.assets
        .filter((asset) => asset.clipId === clipId)
        .sort((left, right) => left.segmentIndex - right.segmentIndex);
      expect(parts.map((part) => part.segmentIndex)).toEqual(Array.from({ length: parts.length }, (_, index) => index + 1));
      expect(parts.every((part) => part.segmentCount === parts.length)).toBe(true);
    }
  });

  it("verifies committed MP3 size duration and SHA-256", () => {
    for (const asset of examAudioManifest.assets) {
      const bytes = readFileSync(join(process.cwd(), "public", asset.path));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(asset.durationMs).toBeGreaterThan(1_500);
      expect(asset.speakerCount).toBe(1);
      expect(asset.rightsStatus).toBe("generated-for-project-review-required");
    }
  });
});
