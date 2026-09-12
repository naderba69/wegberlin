// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import libraryManifest from "../../public/audio/library/manifest.json";
import lessonManifest from "../../public/audio/lessons/manifest.json";
import examManifest from "../../public/audio/exams/manifest.json";
import routeManifest from "../../public/offline-routes.json";
import sizeManifest from "../../public/offline-size-manifest.json";

const manifests: Array<{ assets: Array<{ path: string; bytes: number }> }> = [libraryManifest, lessonManifest, examManifest];
const workerSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
const controlSource = readFileSync(resolve(process.cwd(), "src/components/offline-pack-control.tsx"), "utf8");
const sizeGeneratorSource = readFileSync(resolve(process.cwd(), "scripts/generate-offline-size-manifest.mjs"), "utf8");

describe("selective Offline pack controls", () => {
  it("can preview the exact optional generated-audio payload from committed manifests", () => {
    const assets = manifests.flatMap((manifest) => manifest.assets);
    expect(assets).toHaveLength(260);
    expect(assets.every((asset) => asset.path.startsWith("/audio/") && asset.bytes > 0)).toBe(true);
    expect(assets.reduce((sum, asset) => sum + asset.bytes, 0)).toBeGreaterThan(20_000_000);
  });

  it("commits a post-build compressed Next size for every selectable pack",()=>{
    expect(sizeManifest.format).toBe("dwnb-offline-size-manifest");
    expect(sizeManifest.version).toBe(1);
    expect(sizeManifest.compressionPolicy).toBe("gzip-level-9-estimate-v1");
    expect(sizeManifest.buildFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(sizeManifest.packs.map((pack)=>pack.id)).toEqual(routeManifest.packs.map((pack)=>pack.id));
    for(const pack of sizeManifest.packs){
      expect(pack.routeCount,pack.id).toBe(routeManifest.packs.find((item)=>item.id===pack.id)?.routeCount);
      expect(pack.totalGzipBytes,pack.id).toBeGreaterThan(100_000);
      expect(pack.totalGzipBytes,pack.id).toBeLessThan(pack.totalRawBytes);
      expect(pack.nextAssetCount,pack.id).toBeGreaterThan(0);
    }
    expect(sizeGeneratorSource).toContain("decodeURIComponent(encodedRelative)");
    expect(sizeGeneratorSource).toContain("Unsafe Next asset path in built HTML");
  });

  it("filters optional audio by level instead of attaching all 260 files to every pack",()=>{
    const levelCount=(level:string)=>libraryManifest.assets.filter((asset)=>asset.path.includes(`-${level}-`)).length+lessonManifest.assets.filter((asset)=>asset.path.includes(`/lessons/${level}-`)).length+(level==="b2"?examManifest.assets.length:0);
    expect(["a1","a2","b1","b2"].map((level)=>[level,levelCount(level)])).toEqual([["a1",40],["a2",48],["b1",48],["b2",124]]);
    expect(workerSource).toContain("audioBelongsToPack");
    expect(workerSource).toContain('packId === "b2"');
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
    expect(workerSource).toContain('dwnb-full-pack-v119');
  });

  it("ignores a stale estimate response after the learner selects another pack",()=>{
    expect(controlSource).toContain("estimateRequestId");
    expect(controlSource).toContain("reply.packId!==requestedPackId");
    expect(controlSource).toContain("setEstimate(null);setSelectedPackId(pack.id)");
  });

  it("never stores partial Range audio responses in the runtime shell cache", () => {
    expect(workerSource).toContain('response.status === 200');
    expect(workerSource).toContain('!event.request.headers.has("range")');
    expect(workerSource).toContain('dwnb-shell-v4');
  });
});
