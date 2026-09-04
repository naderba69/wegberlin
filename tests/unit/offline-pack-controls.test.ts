// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import libraryManifest from "../../public/audio/library/manifest.json";
import lessonManifest from "../../public/audio/lessons/manifest.json";
import examManifest from "../../public/audio/exams/manifest.json";

const manifests: Array<{ assets: Array<{ path: string; bytes: number }> }> = [libraryManifest, lessonManifest, examManifest];
const workerSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("selective Offline pack controls", () => {
  it("can preview the exact optional generated-audio payload from committed manifests", () => {
    const assets = manifests.flatMap((manifest) => manifest.assets);
    expect(assets).toHaveLength(260);
    expect(assets.every((asset) => asset.path.startsWith("/audio/") && asset.bytes > 0)).toBe(true);
    expect(assets.reduce((sum, asset) => sum + asset.bytes, 0)).toBeGreaterThan(20_000_000);
  });

  it("keeps audio opt-in and records exact installed byte/audio counts", () => {
    expect(workerSource).toContain("event.data?.includeAudio === true");
    expect(workerSource).toContain("if (includeAudio)");
    expect(workerSource).toContain("audioEntryCount: stats.audioEntryCount");
    expect(workerSource).toContain("byteSize: stats.byteSize");
  });

  it("supports audio-only removal without deleting the route cache", () => {
    expect(workerSource).toContain('DWNB_OFFLINE_PACK_REMOVE_AUDIO');
    expect(workerSource).toContain('url.pathname.startsWith("/audio/")');
    expect(workerSource).toContain('includesAudio: false');
    expect(workerSource).toContain('dwnb-full-pack-v53');
  });

  it("never stores partial Range audio responses in the runtime shell cache", () => {
    expect(workerSource).toContain('response.status === 200');
    expect(workerSource).toContain('!event.request.headers.has("range")');
    expect(workerSource).toContain('dwnb-shell-v4');
  });
});
