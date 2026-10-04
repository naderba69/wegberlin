// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { WEBGPU_MODEL_CACHE, WEBGPU_MODEL_META_PATH, WEBGPU_RUNTIME_ASSET_PATHS, webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { createSpeakingContentFollowUpEvidence, generateContentFollowUpCandidates } from "@/core/speaking/content-follow-up";
import { deleteWebGPUModel, detectWebGPUCapability, getWebGPUModelSourceDecision, inspectWebGPUModelCache } from "@/core/ai/webgpu-model";
import { dueSoonAt, earliestDueDay, staleAt } from "../helpers/source-verification-clock";

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: RequestInfo | URL) { return this.entries.get(String(input)); }
  async put(input: RequestInfo | URL, response: Response) { this.entries.set(String(input), response); }
  async delete(input: RequestInfo | URL) { return this.entries.delete(String(input)); }
}
class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) { if (!this.stores.has(name)) this.stores.set(name, new FakeCache()); return this.stores.get(name)!; }
  async delete(name: string) { return this.stores.delete(name); }
  async keys() { return [...this.stores.keys()]; }
}

const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const unpack = (asset: { packedPath:string; packedBytes:number; packedSha256:string; sourceBytes:number; sourceSha256:string }) => {
  const packed=readFileSync(asset.packedPath);expect(packed).toHaveLength(asset.packedBytes);expect(createHash("sha256").update(packed).digest("hex")).toBe(asset.packedSha256);
  const encoded=gunzipSync(packed),source=Buffer.allocUnsafe(encoded.length);for(let index=0;index<encoded.length;index+=1)source[index]=encoded[index]^0xA5;
  expect(source).toHaveLength(asset.sourceBytes);expect(createHash("sha256").update(source).digest("hex")).toBe(asset.sourceSha256);return source;
};

describe("P0 optional in-browser WebGPU model", () => {
  it("pins the audited multilingual model, quantization, revision, size, and licenses", () => {
    expect(webGPUModelRegistry).toMatchObject({ policyVersion:"browser-webgpu-model-v1",task:"feature-extraction",purpose:"rank-content-grounded-follow-up-candidates",modelId:"Xenova/paraphrase-multilingual-MiniLM-L12-v2",modelRevision:"2c4055b12046f11709e9df2c122e59ffbdc2f900",dtype:"q8",modelLicense:"Apache-2.0",outputDimensions:384,maxSequenceTokens:128,quantizedWeightBytes:118_000_000,minimumDeviceMemoryGB:4 });
    expect(webGPUModelRegistry.sourceIds).toHaveLength(5);
  });

  it("verifies every materialized browser runtime file against its pinned SHA-256", () => {
    expect(hash("public/vendor/webgpu/transformers.web.min.js")).toBe(webGPUModelRegistry.runtime.browserBundleSha256);
    expect(hash("public/vendor/webgpu/ort.webgpu.bundle.min.mjs")).toBe(webGPUModelRegistry.runtime.onnxRuntimeBundleSha256);
    expect(hash("public/vendor/webgpu/ort-wasm-simd-threaded.jsep.mjs")).toBe(webGPUModelRegistry.runtime.wasmModuleSha256);
    expect(hash("public/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm")).toBe(webGPUModelRegistry.runtime.wasmBinarySha256);
    expect(readFileSync("public/vendor/webgpu/TRANSFORMERS_JS_LICENSE.txt","utf8")).toContain("Apache License");
    expect(readFileSync("public/vendor/webgpu/ONNXRUNTIME_LICENSE.txt","utf8")).toContain("MIT License");
  });

  it("verifies upstream bytes, the two pinned ESM rewrites, and the separately packed ONNX WebGPU module",()=>{
    const manifest=JSON.parse(readFileSync("vendor-assets/webgpu/manifest.json","utf8"));
    expect(manifest).toMatchObject({format:"dwnb-packed-vendor-runtime",version:2,algorithm:"xor-0xa5-then-gzip",packageVersion:"4.2.0",license:"Apache-2.0",onnxRuntimeDependency:{package:"onnxruntime-web",version:webGPUModelRegistry.runtime.onnxRuntimeVersion,declaredBy:"@huggingface/transformers@4.2.0"}});
    const upstream=unpack(manifest);let output=upstream.toString("utf8");
    expect(manifest.moduleSpecifierRewrites).toEqual([
      {specifier:"onnxruntime-common",replacement:"/vendor/webgpu/ort.webgpu.bundle.min.mjs",expectedOccurrences:1},
      {specifier:"onnxruntime-web/webgpu",replacement:"/vendor/webgpu/ort.webgpu.bundle.min.mjs",expectedOccurrences:1},
    ]);
    for(const rewrite of manifest.moduleSpecifierRewrites){const from=`from"${rewrite.specifier}"`,to=`from"${rewrite.replacement}"`;expect(output.split(from).length-1).toBe(rewrite.expectedOccurrences);output=output.replaceAll(from,to)}
    const materialized=Buffer.from(output);expect(materialized).toHaveLength(manifest.materializedBytes);expect(createHash("sha256").update(materialized).digest("hex")).toBe(manifest.materializedSha256);expect(materialized.equals(readFileSync(manifest.sourcePath))).toBe(true);
    expect(manifest.companionAssets).toHaveLength(1);const ort=manifest.companionAssets[0];expect(ort).toMatchObject({package:"onnxruntime-web",packageVersion:webGPUModelRegistry.runtime.onnxRuntimeVersion,packageSubpath:"./webgpu",license:"MIT",packageTarballSha1:"453f29768836322a6b8b6d1d730a8426b6582ae2"});
    expect(ort.packageTarballIntegrity).toBe("sha512-MD6Ss4GSpQBo6zqoJzyT9LRbKYs7x/JVN23FT24EcEvlqF4VuzPOeH6X38orZPKHQDbprn7K+SBpu0/mj2CQiw==");expect(unpack(ort).equals(readFileSync(ort.sourcePath))).toBe(true);
    expect(webGPUModelRegistry.runtime.browserBundleSourceSha256).toBe(manifest.sourceSha256);expect(webGPUModelRegistry.runtime.browserBundleSha256).toBe(manifest.materializedSha256);
    expect(readFileSync(".gitignore","utf8")).toContain("/public/vendor/webgpu/transformers.web.min.js");expect(readFileSync(".gitignore","utf8")).toContain("/public/vendor/webgpu/ort.webgpu.bundle.min.mjs");
    expect(JSON.parse(readFileSync("package.json","utf8")).scripts.prepare).toContain("vendor:materialize");
  });

  it("requires a secure context and a real WebGPU adapter", async () => {
    await expect(detectWebGPUCapability({ secureContext:false,gpu:{requestAdapter:async()=>({})} })).resolves.toMatchObject({status:"unavailable"});
    await expect(detectWebGPUCapability({ secureContext:true })).resolves.toMatchObject({status:"unavailable"});
    await expect(detectWebGPUCapability({ secureContext:true,gpu:{requestAdapter:async()=>null} })).resolves.toMatchObject({status:"unavailable"});
  });

  it("fails closed on low declared memory, buffer limits, or browser quota", async () => {
    const gpu={requestAdapter:async()=>({limits:{maxBufferSize:268_435_456}})};
    await expect(detectWebGPUCapability({secureContext:true,gpu,deviceMemoryGB:2})).resolves.toMatchObject({status:"insufficient-memory"});
    await expect(detectWebGPUCapability({secureContext:true,gpu:{requestAdapter:async()=>({limits:{maxBufferSize:64_000_000}})},deviceMemoryGB:8})).resolves.toMatchObject({status:"insufficient-memory"});
    await expect(detectWebGPUCapability({secureContext:true,gpu,deviceMemoryGB:8,storageEstimate:async()=>({quota:200_000_000,usage:100_000_000})})).resolves.toMatchObject({status:"insufficient-storage"});
  });

  it("accepts a capable device while keeping the result explicitly provisional", async () => {
    const result=await detectWebGPUCapability({secureContext:true,gpu:{requestAdapter:async()=>({limits:{maxBufferSize:268_435_456}})},deviceMemoryGB:8,storageEstimate:async()=>({quota:1_000_000_000,usage:100_000_000})});
    expect(result).toMatchObject({status:"supported",deviceMemoryGB:8,maxBufferBytes:268_435_456,storageAvailableBytes:900_000_000});
    expect(result.reasonAr).toContain("مبدئيًا");
  });

  it("blocks a new model download when runtime/model/license sources expire", () => {
    const ids=webGPUModelRegistry.sourceIds;
    expect(getWebGPUModelSourceDecision(dueSoonAt(ids))).toMatchObject({allowed:true,status:"due-soon",dueAt:earliestDueDay(ids)});
    expect(getWebGPUModelSourceDecision(staleAt(ids))).toMatchObject({allowed:false,status:"stale"});
  });

  it("recognizes only a complete version-matched cache marker", async () => {
    const storage=new FakeCacheStorage();
    expect(await inspectWebGPUModelCache(storage as unknown as CacheStorage)).toBeNull();
    const cache=await storage.open(WEBGPU_MODEL_CACHE);
    const metadata={policyVersion:"browser-webgpu-model-v1" as const,modelId:webGPUModelRegistry.modelId,modelRevision:webGPUModelRegistry.modelRevision,dtype:webGPUModelRegistry.dtype,installedAt:"2026-09-07T12:00:00Z",cacheEntries:7,headerByteSize:130_000_000};
    await cache.put(WEBGPU_MODEL_META_PATH,new Response(JSON.stringify(metadata)));
    expect(await inspectWebGPUModelCache(storage as unknown as CacheStorage)).toEqual(metadata);
    await cache.put(WEBGPU_MODEL_META_PATH,new Response(JSON.stringify({...metadata,modelRevision:"floating-main"})));
    expect(await inspectWebGPUModelCache(storage as unknown as CacheStorage)).toBeNull();
  });

  it("deletes the model cache and separately cached same-origin runtime assets", async () => {
    const storage=new FakeCacheStorage();
    const model=await storage.open(WEBGPU_MODEL_CACHE);await model.put("weight",new Response("x"));
    const shell=await storage.open("dwnb-shell-v4");await shell.put("/vendor/webgpu/transformers.web.min.js",new Response("runtime"));await shell.put(webGPUModelRegistry.runtime.onnxRuntimeBundlePath,new Response("onnx-runtime"));
    const result=await deleteWebGPUModel(storage as unknown as CacheStorage);
    expect(result).toEqual({deletedModelCache:true,deletedRuntimeEntries:2});
    expect(await storage.keys()).not.toContain(WEBGPU_MODEL_CACHE);
  });

  it("offers several authored grounded candidates and accepts local WebGPU provenance without per-inference network consent", async () => {
    const generated=generateContentFollowUpCandidates("Ich komme aus Tunesien und wohne in Berlin.","A1");
    expect(generated.status).toBe("ready");
    if(generated.status!=="ready")throw new Error("expected candidates");
    expect(generated.drafts).toHaveLength(4);
    expect(generated.drafts.every((draft)=>draft.questionDe.endsWith("?")&&draft.sourceCue==="Tunesien")).toBe(true);
    const selected=generated.drafts[2];
    const evidence=await createSpeakingContentFollowUpEvidence({sourceText:"Ich komme aus Tunesien und wohne in Berlin.",...selected,provider:"browser-webgpu",model:webGPUModelRegistry.modelId,consent:"not-required"});
    expect(evidence).toMatchObject({provider:"browser-webgpu",consent:"not-required",source:"typed-transcript"});
  });

  it("keeps both model paths on the same local ORT ESM module and an explicit WebGPU Worker with no silent WASM fallback", () => {
    const worker=readFileSync("public/webgpu-model-worker.js","utf8");
    const pronunciationWorker=readFileSync("public/pronunciation-model-worker.js","utf8");
    expect(WEBGPU_RUNTIME_ASSET_PATHS).toContain(webGPUModelRegistry.runtime.onnxRuntimeBundlePath);
    expect(worker).toContain('device: "webgpu"');expect(worker).toContain("dtype: registry.dtype");expect(worker).toContain("useCustomCache = true");expect(worker).toContain('const MODEL_CACHE = "dwnb-webgpu-model-v1"');expect(worker).not.toContain('device: "wasm"');
    expect(pronunciationWorker).toContain("const transformers = await import(registry.runtime.browserBundlePath)");expect(pronunciationWorker).toContain('device: "webgpu"');expect(pronunciationWorker).not.toContain('device: "wasm"');
  });
});
