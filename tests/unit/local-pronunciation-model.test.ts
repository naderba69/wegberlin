// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCAL_PRONUNCIATION_MODEL_CACHE, LOCAL_PRONUNCIATION_MODEL_META_PATH, localPronunciationModelRegistry } from "@/config/local-pronunciation-model-registry";
import { deleteLocalPronunciationModel, detectLocalPronunciationCapability, getLocalPronunciationSourceDecision, inspectLocalPronunciationModel } from "@/core/pronunciation/local-model";
import { germanWords, matchExpectedGermanWords, normalizeGermanWord } from "@/core/pronunciation/word-matching";
import { resampleLinear } from "@/core/pronunciation/audio-sample";
import { analyzeMicrophoneSignal, waveformEnvelope } from "@/core/pronunciation/microphone-signal";

class FakeCache {
  entries=new Map<string,Response>();
  async match(input:RequestInfo|URL){return this.entries.get(String(input))}
  async put(input:RequestInfo|URL,response:Response){this.entries.set(String(input),response)}
}
class FakeCacheStorage {
  stores=new Map<string,FakeCache>();
  async open(name:string){if(!this.stores.has(name))this.stores.set(name,new FakeCache());return this.stores.get(name)!}
  async delete(name:string){return this.stores.delete(name)}
  async keys(){return [...this.stores.keys()]}
}

describe("standard local German word-matching pack",()=>{
  it("pins one multilingual Whisper model, revision, q8 package, German task, and bounded claim",()=>{
    expect(localPronunciationModelRegistry).toMatchObject({policyVersion:"local-german-word-matching-v1",task:"automatic-speech-recognition",purpose:"local-german-expected-word-matching",modelId:"onnx-community/whisper-tiny",modelRevision:"ff4177021cc41f7db950912b73ea4fdf7d01d8e7",dtype:"q8",language:"german",sampleRateHz:16000,maximumAudioSeconds:20,maximumFeedbackItems:3,modelLicense:"Apache-2.0"});
    expect(localPronunciationModelRegistry.evaluationBoundary).toContain("no-phoneme-accent-fluency");
    expect(localPronunciationModelRegistry.sourceIds).toHaveLength(4);
  });

  it("requires secure WebGPU, memory, buffer size, and storage without downloading",async()=>{
    await expect(detectLocalPronunciationCapability({secureContext:false,gpu:{requestAdapter:async()=>({})}})).resolves.toMatchObject({status:"unavailable"});
    await expect(detectLocalPronunciationCapability({secureContext:true})).resolves.toMatchObject({status:"unavailable"});
    const gpu={requestAdapter:async()=>({limits:{maxBufferSize:268_435_456}})};
    await expect(detectLocalPronunciationCapability({secureContext:true,gpu,deviceMemoryGB:2})).resolves.toMatchObject({status:"insufficient-memory"});
    await expect(detectLocalPronunciationCapability({secureContext:true,gpu,deviceMemoryGB:8,storageEstimate:async()=>({quota:120_000_000,usage:60_000_000})})).resolves.toMatchObject({status:"insufficient-storage"});
    await expect(detectLocalPronunciationCapability({secureContext:true,gpu,deviceMemoryGB:8,storageEstimate:async()=>({quota:1_000_000_000,usage:100_000_000})})).resolves.toMatchObject({status:"supported"});
  });

  it("blocks fresh downloads after model or license source expiry",()=>{
    expect(getLocalPronunciationSourceDecision(new Date("2026-09-11T12:00:00Z"))).toMatchObject({allowed:true,status:"fresh",dueAt:"2026-10-07"});
    expect(getLocalPronunciationSourceDecision(new Date("2026-10-12T12:00:00Z"))).toMatchObject({allowed:false,status:"stale"});
  });

  it("accepts only a complete pinned cache marker and deletes only its dedicated cache",async()=>{
    const storage=new FakeCacheStorage();expect(await inspectLocalPronunciationModel(storage as unknown as CacheStorage)).toBeNull();
    const metadata={policyVersion:"local-german-word-matching-v1" as const,modelId:localPronunciationModelRegistry.modelId,modelRevision:localPronunciationModelRegistry.modelRevision,dtype:"q8",installedAt:"2026-09-11T12:00:00Z",cacheEntries:8,headerByteSize:70_000_000};
    const cache=await storage.open(LOCAL_PRONUNCIATION_MODEL_CACHE);await cache.put(LOCAL_PRONUNCIATION_MODEL_META_PATH,new Response(JSON.stringify(metadata)));
    expect(await inspectLocalPronunciationModel(storage as unknown as CacheStorage)).toEqual(metadata);
    const other=await storage.open("dwnb-shell-v4");await other.put("/today",new Response("ok"));
    expect(await deleteLocalPronunciationModel(storage as unknown as CacheStorage)).toEqual({deleted:true});
    expect(await storage.keys()).toContain("dwnb-shell-v4");
  });

  it("normalizes German orthography and ignores personal placeholder punctuation",()=>{
    expect(normalizeGermanWord("HEIẞE!")).toBe("heisse");
    expect(germanWords("Hallo! Ich heiße … Nadia.")).toEqual(["Hallo","Ich","heiße","Nadia"]);
  });

  it("matches expected words without treating extra names as errors",()=>{
    const result=matchExpectedGermanWords("Hallo, ich heiße Nadia. Wie heißt du?",["Hallo! Ich heiße …","Wie heißt du?","Wie geht es dir?"]);
    expect(result.words.find((item)=>item.normalized==="hallo")?.status).toBe("heard");
    expect(result.words.find((item)=>item.normalized==="geht")?.status).toBe("unconfirmed");
    expect(result.words.some((item)=>item.normalized==="nadia")).toBe(false);
    expect(result.feedbackAr.length).toBeLessThanOrEqual(3);
    expect(result.evaluationBoundary).toContain("no-phoneme");
  });

  it("never turns complete word recognition into a pronunciation score",()=>{
    const result=matchExpectedGermanWords("Hallo ich heiße",["Hallo! Ich heiße …"]);
    expect(result.heardCount).toBe(result.expectedCount);
    expect(result.feedbackAr.join(" ")).toContain("مطابقة الكلمات فقط");
    expect(result).not.toHaveProperty("score");
  });

  it("resamples locally with bounded linear interpolation",()=>{
    const input=new Float32Array([0,1,0,-1]);const output=resampleLinear(input,4,8);
    expect(output).toHaveLength(8);expect(output[0]).toBe(0);expect(output[2]).toBeCloseTo(1);expect(()=>resampleLinear(input,0,16000)).toThrow("معدل");
  });

  it("accepts a clear bounded microphone signal before invoking word recognition",()=>{
    const signal=analyzeMicrophoneSignal(new Float32Array(16_000).fill(.04),16_000);
    expect(signal).toMatchObject({policyVersion:"local-microphone-signal-check-v1",status:"usable",durationSeconds:1,activeFrameRatio:1});
    expect(signal.waveform).toHaveLength(48);
    expect(signal.evidenceBoundary).toContain("signal-quality-only");
  });

  it("separates quiet, silent, and clipped signals without diagnosing pronunciation or noise source",()=>{
    expect(analyzeMicrophoneSignal(new Float32Array(16_000).fill(.005),16_000).status).toBe("too-quiet");
    expect(analyzeMicrophoneSignal(new Float32Array(16_000),16_000).status).toBe("mostly-silence");
    expect(analyzeMicrophoneSignal(new Float32Array(16_000).fill(.99),16_000).status).toBe("clipping");
    expect(analyzeMicrophoneSignal(new Float32Array(16_000).fill(.005),16_000).messageAr).not.toContain("نطقك");
  });

  it("builds a bounded educational waveform envelope without retaining audio",()=>{
    expect(waveformEnvelope(new Float32Array([0,.5,-1,.25]),12)).toHaveLength(12);
    expect(waveformEnvelope(new Float32Array(),2)).toHaveLength(8);
    expect(waveformEnvelope(new Float32Array(200),200)).toHaveLength(96);
  });

  it("keeps install and inference inside a dedicated Worker and disables remote loading for transcription",()=>{
    const worker=readFileSync("public/pronunciation-model-worker.js","utf8");
    expect(worker).toContain('const MODEL_CACHE = "dwnb-pronunciation-model-v1"');
    expect(worker).toContain('device: "webgpu"');
    expect(worker).toContain("dtype: registry.dtype");
    expect(worker).toContain("allowRemoteModels = allowNetwork");
    expect(worker).toContain('if (type === "transcribe")');
    expect(worker).toContain("loadTranscriber(requestId, registry, false)");
    expect(worker).toContain("language: registry.language");
    expect(worker).not.toContain("generativelanguage.googleapis.com");
  });
});
