const MODEL_CACHE = "dwnb-webgpu-model-v1";
const MODEL_META_PATH = "/__dwnb_webgpu_model_meta__";
let extractor = null;
let loadedRegistry = null;

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

async function loadExtractor(requestId, registry) {
  if (extractor && loadedRegistry?.modelRevision === registry.modelRevision) return extractor;
  reply(requestId, { type: "progress", progress: { phase: "runtime", percent: 1 } });
  const transformers = await import(registry.runtime.browserBundlePath);
  transformers.env.allowLocalModels = false;
  transformers.env.allowRemoteModels = true;
  transformers.env.useBrowserCache = false;
  transformers.env.useCustomCache = true;
  transformers.env.customCache = await customModelCache();
  transformers.env.backends.onnx.wasm.wasmPaths = "/vendor/webgpu/";
  transformers.env.backends.onnx.wasm.numThreads = 1;
  extractor = await transformers.pipeline(registry.task, registry.modelId, {
    revision: registry.modelRevision,
    device: "webgpu",
    dtype: registry.dtype,
    progress_callback: (data) => reply(requestId, { type: "progress", progress: progressFor(data) }),
  });
  loadedRegistry = registry;
  return extractor;
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

function dot(left, right) {
  let result = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) result += left[index] * right[index];
  return result;
}

self.addEventListener("message", (event) => {
  const { requestId, type, registry } = event.data ?? {};
  if (typeof requestId !== "string" || !registry) return;
  void (async () => {
    if (type === "install") {
      await loadExtractor(requestId, registry);
      reply(requestId, { type: "installed", metadata: await cacheMetadata(registry) });
      return;
    }
    if (type === "rank") {
      const pipeline = await loadExtractor(requestId, registry);
      const texts = [event.data.sourceText, ...event.data.candidates];
      const output = await pipeline(texts, { pooling: "mean", normalize: true });
      const vectors = output.tolist();
      if (!Array.isArray(vectors) || vectors.length !== texts.length) throw new Error("Embedding output shape is invalid.");
      const source = vectors[0];
      const scores = vectors.slice(1).map((vector) => Number(dot(source, vector).toFixed(6)));
      let selectedIndex = 0;
      for (let index = 1; index < scores.length; index += 1) if (scores[index] > scores[selectedIndex]) selectedIndex = index;
      reply(requestId, { type: "ranked", selectedIndex, scores });
      return;
    }
    throw new Error("Unknown WebGPU worker command.");
  })().catch((error) => reply(requestId, { type: "error", message: error instanceof Error ? error.message : "WebGPU worker failed." }));
});
