import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { libraryAudioManifest } from "@/data/library-audio-assets";
import { listeningLibrary } from "@/data/library-registry";

describe("generated library audio assets", () => {
  it("publishes a transparent complete 80-item synthetic library without claiming human or exam audio", () => {
    expect(libraryAudioManifest.format).toBe("dwnb-library-audio");
    expect(libraryAudioManifest.version).toBe(1);
    expect(libraryAudioManifest.generatedAssetCount).toBe(80);
    expect(libraryAudioManifest.humanRecordedAssetCount).toBe(0);
    expect(libraryAudioManifest.assets).toHaveLength(80);
    expect(libraryAudioManifest.usageNoteAr).toContain("ليس تسجيلًا بشريًا");
    expect(libraryAudioManifest.spokenNormalizationNoteAr).toContain("الأرقام");
  });

  it("maps unique files only to published original listening scripts across A1-B2", () => {
    const listeningById = new Map(listeningLibrary.map((item) => [item.id, item]));
    const assetIds = new Set(libraryAudioManifest.assets.map((asset) => asset.itemId));
    expect(assetIds.size).toBe(80);
    expect(assetIds).toEqual(new Set(listeningLibrary.map((item) => item.id)));
    for (const asset of libraryAudioManifest.assets) {
      expect(listeningById.get(asset.itemId)?.originalContent).toBe(true);
      expect(asset.sourceContent).toBe("original-project-transcript");
      expect(asset.examGrade).toBe(false);
      expect(asset.speakerCount).toBe(1);
    }
    const levels = libraryAudioManifest.assets.map((asset) => listeningById.get(asset.itemId)?.level);
    expect(levels.filter((level) => level === "A1")).toHaveLength(16);
    expect(levels.filter((level) => level === "A2")).toHaveLength(24);
    expect(levels.filter((level) => level === "B1")).toHaveLength(24);
    expect(levels.filter((level) => level === "B2")).toHaveLength(16);
  });

  it("verifies every committed MP3 byte length and SHA-256 checksum", () => {
    for (const asset of libraryAudioManifest.assets) {
      const bytes = readFileSync(join(process.cwd(), "public", asset.path));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(bytes.subarray(0, 3).toString("ascii")).toBe("ID3");
    }
  });

  it("records plausible measured durations and explicit generation provenance", () => {
    for (const asset of libraryAudioManifest.assets) {
      expect(asset.durationMs).toBeGreaterThan(5_000);
      expect(asset.durationMs).toBeLessThan(60_000);
      expect(asset.synthesisProvider).toBe("Arena.ai speech synthesis");
      expect(asset.rightsStatus).toBe("generated-for-project-review-required");
      expect(asset.generatedAt).toBe("2026-08-30");
    }
  });
});
