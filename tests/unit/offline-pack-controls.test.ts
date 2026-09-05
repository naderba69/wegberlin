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
    expect(workerSource).toContain('dwnb-full-pack-v60');
  });

  it("never stores partial Range audio responses in the runtime shell cache", () => {
    expect(workerSource).toContain('response.status === 200');
    expect(workerSource).toContain('!event.request.headers.has("range")');
    expect(workerSource).toContain('dwnb-shell-v4');
  });
});

describe("per-level Offline pack scopes", () => {
  it("derives one cache per level from a single shared pack version", () => {
    expect(workerSource).toContain("const PACK_VERSION = \"v60\";");
    expect(workerSource).toContain("const PACK_CACHE = \"dwnb-full-pack-v60\";");
    expect(workerSource).toContain("const levelPackCache = (level) => `dwnb-level-pack-${level.toLowerCase()}-${PACK_VERSION}`;");
    expect(workerSource).toContain("const LEVEL_SCOPES = [\"A1\", \"A2\", \"B1\", \"B2\"];");
    expect(workerSource).toContain("const normalizeScope = (value) => (LEVEL_SCOPES.includes(value) ? value : \"full\");");
  });

  it("downloads, removes, and strips audio per requested scope", () => {
    expect(workerSource).toContain("downloadFullPack(event, event.data?.includeAudio === true, event.data?.scope)");
    expect(workerSource).toContain("const removeScope = normalizeScope(event.data?.scope);");
    expect(workerSource).toContain("removePackAudio(normalizeScope(event.data?.scope))");
    expect(workerSource).toContain("manifest.levelPacks?.[scope]");
    expect(workerSource).toContain("throw new Error(`مسار خارج فهرس الحزمة الكامل: ${route}`)");
  });

  it("cleans stale full and level pack caches but never touches the shell cache", () => {
    expect(workerSource).toContain('key.startsWith("dwnb-level-pack-")');
    expect(workerSource).toContain("...LEVEL_SCOPES.map(levelPackCache), ...LEVEL_SCOPES.map(levelStagingCache)");
    expect(workerSource).toContain("!keep.has(key)");
    expect(workerSource).toContain('const SHELL_CACHE = "dwnb-shell-v4";');
  });

  it("serves the post-build size manifest to the settings UI for an honest pre-download preview", () => {
    expect(workerSource).toContain('const OFFLINE_SIZE_PATH = "/offline-size-manifest.json";');
    expect(workerSource).toContain('sizeManifest?.format === "dwnb-offline-size"');
    expect(workerSource).toContain('"/offline-size-manifest.json",');
  });
});
