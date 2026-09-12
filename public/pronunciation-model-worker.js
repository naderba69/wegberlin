const MODEL_CACHE = "dwnb-pronunciation-model-v1";
const MODEL_META_PATH = "/__dwnb_pronunciation_model_meta__";
let transcriber = null;
let loadedRevision = null;

function reply(requestId, payload) {
  self.postMessage({ requestId, ...payload });
}

async function customModelCache() {
  const cache = await caches.open(MODEL_CACHE);
  return {
    match: (request) => cache.match(request),
    put: (request, response) => cache.put(request, response),
  };
}

function progressFor(data) {
  const loadedBytes = typeof data?.loaded === "number" ? data.loaded : undefined;
  const totalBytes = typeof data?.total === "number" ? data.total : undefined;
  const percent = typeof data?.progress === "number"
    ? Math.max(0, Math.min(99, Math.round(data.progress)))
    : loadedBytes !== undefined && totalBytes ? Math.max(0, Math.min(99, Math.round((loadedBytes / totalBytes) * 100))) : 1;
  return { phase: data?.status === "initiate" ? "initializing" : "download", percent, loadedBytes, totalBytes, file: typeof data?.file === "string" ? data.file : undefined };
}

async function loadTranscriber(requestId, registry, allowNetwork) {
  if (transcriber && loadedRevision === registry.modelRevision) return transcriber;
  reply(requestId, { type: "progress", progress: { phase: "runtime", percent: 1 } });
  const transformers = await import(registry.runtime.browserBundlePath);
  transformers.env.allowLocalModels = false;
  transformers.env.allowRemoteModels = allowNetwork;
  transformers.env.useBrowserCache = false;
  transformers.env.useCustomCache = true;
  transformers.env.customCache = await customModelCache();
  transformers.env.backends.onnx.wasm.wasmPaths = "/vendor/webgpu/";
  transformers.env.backends.onnx.wasm.numThreads = 1;
  transcriber = await transformers.pipeline(registry.task, registry.modelId, {
    revision: registry.modelRevision,
    device: "webgpu",
    dtype: registry.dtype,
    progress_callback: (data) => reply(requestId, { type: "progress", progress: progressFor(data) }),
  });
  loadedRevision = registry.modelRevision;
  return transcriber;
}

async function cacheMetadata(registry) {
  const cache = await caches.open(MODEL_CACHE);
  const requests = await cache.keys();
  let headerByteSize = 0;
  for (const request of requests) {
    const response = await cache.match(request);
    const length = Number(response?.headers.get("content-length"));
    if (Number.isFinite(length) && length > 0) headerByteSize += length;
  }
  const metadata = {
    policyVersion: registry.policyVersion,
    modelId: registry.modelId,
    modelRevision: registry.modelRevision,
    dtype: registry.dtype,
    installedAt: new Date().toISOString(),
    cacheEntries: requests.length,
    headerByteSize,
  };
  await cache.put(MODEL_META_PATH, new Response(JSON.stringify(metadata), { headers: { "content-type": "application/json" } }));
  return metadata;
}

self.addEventListener("message", (event) => {
  const { requestId, type, registry } = event.data ?? {};
  if (typeof requestId !== "string" || !registry) return;
  void (async () => {
    if (type === "install") {
      await loadTranscriber(requestId, registry, true);
      reply(requestId, { type: "installed", metadata: await cacheMetadata(registry) });
      return;
    }
    if (type === "transcribe") {
      if (!(event.data.audio instanceof Float32Array)) throw new Error("Expected a local Float32Array audio sample.");
      const pipeline = await loadTranscriber(requestId, registry, false);
      const output = await pipeline(event.data.audio, {
        language: registry.language,
        task: registry.taskMode,
        return_timestamps: false,
      });
      const text = Array.isArray(output) ? output.map((item) => item?.text ?? "").join(" ") : output?.text;
      if (typeof text !== "string") throw new Error("Local ASR returned no transcript.");
      reply(requestId, { type: "transcribed", transcript: text.normalize("NFC").replace(/\s+/gu, " ").trim() });
      return;
    }
    throw new Error("Unknown pronunciation worker command.");
  })().catch((error) => reply(requestId, { type: "error", message: error instanceof Error ? error.message : "Local pronunciation worker failed." }));
});
