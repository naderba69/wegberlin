const MODEL_CACHE = "dwnb-pronunciation-model-v1";
const LOCAL_MIRROR_MANIFEST_PATH = "/vendor/pronunciation/manifest.json";
const LOCAL_MIRROR_BASE_PATH = "/vendor/pronunciation";
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

let resolvedSource = null;

/**
 * يفضّل النسخة المستضافة داخل التطبيق (public/vendor/pronunciation) إن وُجدت،
 * ويسقط إلى Hugging Face فقط عند غيابها. سبب الوجود: بعض الشبكات تحجب
 * huggingface.co، وبعض المتصفحات تفشل في TLS الوسيط، فيتعطّل التعرّف الصوتي كله.
 */
async function resolveModelSource(registry) {
  if (resolvedSource && resolvedSource.revision === registry.modelRevision) return resolvedSource;
  try {
    const response = await fetch(LOCAL_MIRROR_MANIFEST_PATH, { cache: "no-store" });
    if (response.ok) {
      const manifest = await response.json();
      if (manifest?.modelId === registry.modelId && manifest?.modelRevision === registry.modelRevision) {
        const basePath = typeof manifest?.basePath === "string" ? manifest.basePath : LOCAL_MIRROR_BASE_PATH;
        resolvedSource = { kind: "local-mirror", revision: registry.modelRevision, remoteHost: new URL(basePath, self.location.origin).href.replace(/\/$/, "") };
        return resolvedSource;
      }
    }
  } catch {
    // فحص النسخة المحلية لا يفشل العملية؛ نكمل إلى المصدر الخارجي.
  }
  resolvedSource = { kind: "huggingface", revision: registry.modelRevision, remoteHost: "https://huggingface.co" };
  return resolvedSource;
}

function classifyLoadError(error) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/Service unavailable|Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed|ERR_/i.test(text)) return "MODEL_SOURCE_UNREACHABLE";
  if (/\b404\b|not found|Unauthorized|missing file/i.test(text)) return "MODEL_FILES_MISSING";
  return "MODEL_LOAD_FAILED";
}

async function loadTranscriber(requestId, registry, allowNetwork) {
  if (transcriber && loadedRevision === registry.modelRevision) return transcriber;
  reply(requestId, { type: "progress", progress: { phase: "runtime", percent: 1 } });
  const source = await resolveModelSource(registry);
  reply(requestId, { type: "progress", progress: { phase: "runtime", percent: 1, source: source.kind } });
  const transformers = await import(registry.runtime.browserBundlePath);
  transformers.env.allowLocalModels = false;
  transformers.env.allowRemoteModels = allowNetwork;
  transformers.env.remoteHost = source.remoteHost;
  // النسخة المحلية من أصل التطبيق ليست "شبكة" بالمعنى الذي يمنعه وضع البيانات المنخفضة.
  if (source.kind === "local-mirror") transformers.env.allowRemoteModels = true;
  transformers.env.useBrowserCache = false;
  transformers.env.useCustomCache = true;
  transformers.env.customCache = await customModelCache();
  transformers.env.backends.onnx.wasm.wasmPaths = "/vendor/webgpu/";
  transformers.env.backends.onnx.wasm.numThreads = 1;
  try {
    transcriber = await transformers.pipeline(registry.task, registry.modelId, {
      revision: registry.modelRevision,
      device: "webgpu",
      dtype: registry.dtype,
      progress_callback: (data) => reply(requestId, { type: "progress", progress: progressFor(data) }),
    });
  } catch (error) {
    const code = classifyLoadError(error);
    const failure = new Error(code === "MODEL_SOURCE_UNREACHABLE"
      ? `MODEL_SOURCE_UNREACHABLE: ${source.kind === "local-mirror" ? "نسخة التطبيق المحلية" : "huggingface.co"} غير قابلة للوصول.`
      : code === "MODEL_FILES_MISSING" ? "MODEL_FILES_MISSING: ملفات النموذج غير مكتملة على هذا المصدر." : `MODEL_LOAD_FAILED: ${error instanceof Error ? error.message : "unknown"}`);
    failure.code = code;
    throw failure;
  }
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
    source: resolvedSource?.kind ?? "huggingface",
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
  })().catch((error) => reply(requestId, { type: "error", code: error?.code ?? classifyLoadError(error), message: error instanceof Error ? error.message : "Local pronunciation worker failed." }));
});
