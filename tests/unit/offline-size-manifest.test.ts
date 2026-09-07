// @vitest-environment node
import { describe, expect, it } from "vitest";
import offlineRoutes from "../../public/offline-routes.json";
import sizeManifest from "../../public/offline-size-manifest.json";
import libraryManifest from "../../public/audio/library/manifest.json";
import lessonManifest from "../../public/audio/lessons/manifest.json";
import examManifest from "../../public/audio/exams/manifest.json";

const packs = sizeManifest.packs as unknown as Record<string, {
  routeCount: number;
  measuredRouteCount: number;
  missingRoutes: number;
  assetCount: number;
  missingAssets: number;
  unmeasuredAssets: string[];
  htmlBytes: number;
  htmlTransferBytes: number;
  assetBytes: number;
  assetTransferBytes: number;
  pageBytes: number;
  pageTransferBytes: number;
  pageWithAudioBytes: number;
}>;

describe("post-build Offline pack size manifest", () => {
  it("is generated from a real build with one measurement per pack scope", () => {
    expect(sizeManifest.format).toBe("dwnb-offline-size");
    expect(sizeManifest.version).toBe(1);
    expect(sizeManifest.buildId).not.toBe("unknown");
    expect(sizeManifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sizeManifest.compression).toBe("gzip-level-9");
    expect(Object.keys(packs).sort()).toEqual(["A1", "A2", "B1", "B2", "full"]);
  });

  it("matches the route counts of the offline route manifest exactly", () => {
    for (const [scope, pack] of Object.entries(packs)) {
      const definition = (offlineRoutes.levelPacks as unknown as Record<string, { routeCount: number }>)[scope];
      expect(pack.routeCount, scope).toBe(definition.routeCount);
      expect(pack.missingRoutes, scope).toBe(0);
      expect(pack.measuredRouteCount, scope).toBe(definition.routeCount - 1);
    }
    expect(packs.full.routeCount).toBe(298);
    expect(packs.A1.routeCount).toBe(51);
    expect(packs.B2.routeCount).toBe(199);
  });

  it("reports both stored bytes and gzip transfer bytes for every scope", () => {
    for (const [scope, pack] of Object.entries(packs)) {
      expect(pack.htmlBytes, scope).toBeGreaterThan(0);
      expect(pack.assetBytes, scope).toBeGreaterThan(0);
      expect(pack.pageBytes, scope).toBe(pack.htmlBytes + pack.assetBytes);
      expect(pack.pageTransferBytes, scope).toBe(pack.htmlTransferBytes + pack.assetTransferBytes);
      expect(pack.pageTransferBytes, scope).toBeLessThan(pack.pageBytes);
      expect(pack.assetCount, scope).toBeGreaterThan(3);
    }
    // حزمة المستوى الواحد يجب أن تكون أخفف فعليًا من الحزمة الكاملة، وإلا لم يكن للتقسيم قيمة.
    expect(packs.A1.pageBytes).toBeLessThan(packs.full.pageBytes * 0.6);
    expect(packs.B2.pageBytes).toBeLessThan(packs.full.pageBytes);
  });

  it("adds the committed generated-audio payload on top of the page payload", () => {
    const audioAssets = [libraryManifest, lessonManifest, examManifest].flatMap((manifest) => manifest.assets as Array<{ bytes: number }>);
    const audioBytes = audioAssets.reduce((sum, asset) => sum + asset.bytes, 0);
    expect(audioAssets).toHaveLength(260);
    expect(sizeManifest.audio.assetCount).toBe(260);
    expect(sizeManifest.audio.byteSize).toBe(audioBytes);
    // favicon يُقاس من ملفه الأصلي لأنه route ديناميكي، والبيان يبقى مصرَّحًا به كأصل غير مقاس.
    for (const [scope, pack] of Object.entries(packs)) {
      expect(pack.missingRoutes, scope).toBe(0);
      expect(pack.missingAssets, scope).toBe(0);
      expect(pack.unmeasuredAssets, scope).toEqual(["/manifest.webmanifest"]);
      expect(pack.measuredRouteCount, scope).toBe(pack.routeCount - 1);
    }
    for (const [scope, pack] of Object.entries(packs)) {
      expect(pack.pageWithAudioBytes, scope).toBe(pack.pageBytes + audioBytes);
    }
  });
});
