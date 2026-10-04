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
    expect(assets).toHaveLength(272);
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

  it("filters optional audio by level instead of attaching all 272 files to every pack",()=>{
    const levelCount=(level:string)=>libraryManifest.assets.filter((asset)=>asset.path.includes(`-${level}-`)).length+lessonManifest.assets.filter((asset)=>asset.path.includes(`/lessons/${level}-`)).length+(level==="b2"?examManifest.assets.length:0);
    expect(["a1","a2","b1","b2"].map((level)=>[level,levelCount(level)])).toEqual([["a1",40],["a2",48],["b1",48],["b2",136]]);
    expect(workerSource).toContain("audioBelongsToPack");
    expect(workerSource).toContain('packId === "b2"');
  });

  it("keeps audio opt-in and records exact installed byte/audio counts", () => {
    expect(workerSource).toContain("event.data?.includeAudio === true");
    expect(workerSource).toContain("if (includeAudio)");
    expect(workerSource).toContain("audioEntryCount: state.stats.audioEntryCount");
    expect(workerSource).toContain("byteSize: state.stats.byteSize");
    expect(workerSource).toContain("stats,");
  });

  it("supports audio-only removal without deleting the route cache", () => {
    expect(workerSource).toContain('DWNB_OFFLINE_PACK_REMOVE_AUDIO');
    expect(workerSource).toContain('url.pathname.startsWith("/audio/")');
    expect(workerSource).toContain('includesAudio: false');
    expect(workerSource).toContain('dwnb-full-pack-v180');
  });

  it("ignores a stale estimate response after the learner selects another pack",()=>{
    expect(controlSource).toContain("estimateRequestId");
    expect(controlSource).toContain("reply.packId!==requestedPackId");
    expect(controlSource).toContain("setEstimate(null);setSelectedPackId(pack.id)");
  });

  // ADR-087 (v179) + ADR-095 (v184): كل تنزيلات الحزمة عبر حدٍّ زمني، والترقية صارت دفعاتٍ تقودها
  // الصفحة رسالةً رسالة بدل حدثٍ واحد طويل (رُصد تجمّده نهائيًا عند ~650 مدخلًا مع مهلةٍ لا تُطلق).
  it("bounds every pack fetch and drives promotion in page-issued chunks instead of one long event", () => {
    expect(workerSource).toContain('const PACK_FETCH_POLICY = "bounded-pack-fetch-v1";');
    expect(workerSource).toContain("const PACK_FETCH_TIMEOUT_MS = 30_000;");
    expect(workerSource).toContain("const PACK_FETCH_ATTEMPTS = 3;");
    expect(workerSource).toContain("{ cause: lastError }");
    expect(workerSource).toContain("failure.policy = PACK_FETCH_POLICY;");
    const packBody = workerSource.slice(
      workerSource.indexOf("async function downloadSelectedPack"),
      workerSource.indexOf('self.addEventListener("install"'),
    );
    expect(packBody.length).toBeGreaterThan(2_000);
    expect(packBody).not.toContain("await fetch(");
    expect(packBody.match(/boundedFetch\(/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(workerSource).toContain("const PACK_PROMOTION_CHUNK_SIZE = 25;");
    expect(workerSource).toContain("const PACK_PROMOTION_CONCURRENCY = 5;");
    expect(workerSource).toContain("const PACK_PROMOTION_OP_TIMEOUT_MS = 15_000;");
    expect(workerSource).toContain("const PACK_PROMOTION_ENTRY_ATTEMPTS = 2;");
    expect(workerSource).toContain("withDeadline(source.match(request), PACK_PROMOTION_OP_TIMEOUT_MS");
    expect(workerSource).toContain("withDeadline(target.put(request, response.clone()), PACK_PROMOTION_OP_TIMEOUT_MS");
    expect(workerSource).toContain("mapWithConcurrency(requests, PACK_PROMOTION_CONCURRENCY");
    expect(workerSource).toContain("percent: Math.round(98 + Math.min(1, promoted / stagedRequests.length))");
    expect(workerSource).toContain('phase: "promoting"');
    expect(workerSource).toContain('replyTo(event, { type: "DWNB_OFFLINE_PACK_COMPLETE", ...metadata, percent: 100 })');
    for (const type of ["DWNB_OFFLINE_PACK_PROMOTE_BEGIN", "DWNB_OFFLINE_PACK_PROMOTE_PREVIOUS_CHUNK", "DWNB_OFFLINE_PACK_PROMOTE_ROTATE", "DWNB_OFFLINE_PACK_PROMOTE_CHUNK", "DWNB_OFFLINE_PACK_PROMOTE_FINISH"]) {
      expect(workerSource).toContain(`type === "${type}"`);
    }
    expect(controlSource).toContain("async function promoteStagedPack(");
    expect(controlSource).toContain("async function copyPackChunk(");
    expect(controlSource).toContain("resolveOnProgress: true");
    expect(controlSource).toContain("for (let attempt = 1; attempt <= 3; attempt += 1)");
  });

  it("retries the same promotion chunk instead of restarting the copy, and never claims completion with missing entries", () => {
    expect(workerSource).toContain("if (await target.match(request)) { skipped += 1; return; }");
    expect(workerSource).toContain('const packed = undefined;'.replace('const packed = undefined;', 'const missing = stagedRequests.filter((request) => !liveUrls.has(request.url)).length;'));
    expect(workerSource).toContain("لم تكتمل نسخة الحزمة");
    expect(workerSource).toContain("أعد المحاولة؛ التنزيل محفوظ ولن يُعاد.");
    expect(controlSource).toContain('sendWorkerCommand(type, onProgress, { cursor }, { timeoutMs: 45_000, resolveOnProgress: true })');
    expect(controlSource).toContain("const reply = await promoteStagedPack(setProgress);");
  });

  // v179: مراقب العامل يموت مع العامل، فالموت الصامت يُلتقط في الصفحة الحيّة (رُصد عند «650 من 698»).
  it("turns a silent pack-progress stall into a visible retryable failure in the live page", () => {
    expect(controlSource).toContain("const PACK_PROGRESS_SILENCE_MS = 150_000;");
    expect(controlSource).toContain("const PACK_PROGRESS_SILENCE_MESSAGE =");
    expect(controlSource).toContain('if (type !== "DWNB_OFFLINE_PACK_DOWNLOAD") return;');
    expect(controlSource).toContain("armSilence();");
    expect(controlSource.match(/armSilence\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(controlSource).toContain("reject(new Error(PACK_PROGRESS_SILENCE_MESSAGE));");
    expect(controlSource).toContain("15 * 60_000");
    expect(controlSource).toContain("أعد المحاولة لإكمال التثبيت.");
  });

  it("never stores partial Range audio responses in the runtime shell cache", () => {
    expect(workerSource).toContain('response.status === 200');
    expect(workerSource).toContain('!event.request.headers.has("range")');
    expect(workerSource).toContain('dwnb-shell-v4');
  });
});
