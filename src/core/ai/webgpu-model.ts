import { WEBGPU_MODEL_CACHE, WEBGPU_MODEL_META_PATH, WEBGPU_MODEL_POLICY_VERSION, WEBGPU_RUNTIME_ASSET_PATHS, webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { summarizeSourceFreshness } from "@/core/governance/source-freshness";

export type WebGPUCapabilityStatus = "supported" | "unavailable" | "insufficient-memory" | "insufficient-storage";
export type WebGPUCapability = {
  status: WebGPUCapabilityStatus;
  reasonAr: string;
  deviceMemoryGB?: number;
  maxBufferBytes?: number;
  storageAvailableBytes?: number;
};

type AdapterLike = { limits?: { maxBufferSize?: number } };
type WebGPUEnvironment = {
  secureContext: boolean;
  gpu?: { requestAdapter: () => Promise<AdapterLike | null> };
  deviceMemoryGB?: number;
  storageEstimate?: () => Promise<{ quota?: number; usage?: number }>;
};

export type WebGPUModelMetadata = {
  policyVersion: typeof WEBGPU_MODEL_POLICY_VERSION;
  modelId: string;
  modelRevision: string;
  dtype: string;
  installedAt: string;
  cacheEntries: number;
  headerByteSize: number;
  originUsageDeltaBytes?: number;
};

export type WebGPUInstallProgress = {
  phase: "runtime" | "download" | "initializing";
  percent: number;
  loadedBytes?: number;
  totalBytes?: number;
  file?: string;
};

type WorkerReply = {
  requestId: string;
  type: "progress" | "installed" | "ranked" | "error";
  progress?: WebGPUInstallProgress;
  metadata?: WebGPUModelMetadata;
  selectedIndex?: number;
  scores?: number[];
  message?: string;
};

let sharedWorker: Worker | null = null;

function browserEnvironment(): WebGPUEnvironment {
  const candidate = navigator as Navigator & { gpu?: WebGPUEnvironment["gpu"]; deviceMemory?: number };
  return {
    secureContext: window.isSecureContext,
    gpu: candidate.gpu,
    deviceMemoryGB: candidate.deviceMemory,
    storageEstimate: navigator.storage?.estimate ? () => navigator.storage.estimate() : undefined,
  };
}

export async function detectWebGPUCapability(environment?: WebGPUEnvironment): Promise<WebGPUCapability> {
  const current = environment ?? (typeof window !== "undefined" ? browserEnvironment() : { secureContext: false });
  if (!current.secureContext) return { status: "unavailable", reasonAr: "يتطلب WebGPU صفحة HTTPS أو localhost موثوقًا." };
  if (!current.gpu) return { status: "unavailable", reasonAr: "هذا المتصفح لا يعرّض WebGPU. يبقى المحرك الحتمي وOllama متاحين." };
  let adapter: AdapterLike | null;
  try { adapter = await current.gpu.requestAdapter(); }
  catch { return { status: "unavailable", reasonAr: "تعذر طلب محول WebGPU من المتصفح." }; }
  if (!adapter) return { status: "unavailable", reasonAr: "لم يمنح المتصفح محول WebGPU صالحًا لهذا الجهاز." };

  const deviceMemoryGB = current.deviceMemoryGB;
  const maxBufferBytes = adapter.limits?.maxBufferSize;
  if (typeof deviceMemoryGB === "number" && deviceMemoryGB < webGPUModelRegistry.minimumDeviceMemoryGB) {
    return { status: "insufficient-memory", reasonAr: `ذاكرة الجهاز المعلنة ${deviceMemoryGB} GB؛ نحتاج ${webGPUModelRegistry.minimumDeviceMemoryGB} GB على الأقل لتقليل خطر إغلاق الصفحة.`, deviceMemoryGB, maxBufferBytes };
  }
  if (typeof maxBufferBytes === "number" && maxBufferBytes < webGPUModelRegistry.minimumMaxBufferBytes) {
    return { status: "insufficient-memory", reasonAr: "حد WebGPU للذاكرة المؤقتة أصغر من الحد المحافظ لهذا النموذج.", deviceMemoryGB, maxBufferBytes };
  }

  let storageAvailableBytes: number | undefined;
  if (current.storageEstimate) {
    try {
      const estimate = await current.storageEstimate();
      if (typeof estimate.quota === "number" && typeof estimate.usage === "number") storageAvailableBytes = Math.max(0, estimate.quota - estimate.usage);
    } catch {
      // Storage quota is advisory; inability to estimate must not fabricate a failure.
    }
  }
  if (typeof storageAvailableBytes === "number" && storageAvailableBytes < webGPUModelRegistry.estimatedDownloadBytes) {
    return { status: "insufficient-storage", reasonAr: "المساحة التي أعلنها المتصفح أصغر من الحجم المحافظ المطلوب للتنزيل.", deviceMemoryGB, maxBufferBytes, storageAvailableBytes };
  }
  return { status: "supported", reasonAr: "WebGPU متاح والحدود المعلنة مناسبة مبدئيًا. يبقى التنزيل اختياريًا وقد يفشل حسب برنامج تشغيل الجهاز.", deviceMemoryGB, maxBufferBytes, storageAvailableBytes };
}

export function getWebGPUModelSourceDecision(now = new Date()) {
  const freshness = summarizeSourceFreshness(webGPUModelRegistry.sourceIds, now);
  const allowed = freshness.status === "fresh" || freshness.status === "due-soon";
  return {
    allowed,
    status: freshness.status,
    dueAt: freshness.dueAt,
    reasonAr: allowed
      ? `Runtime والنموذج والترخيص متحقق منها حتى ${freshness.dueAt}.`
      : "حُظر تنزيل النموذج لأن تحقق Runtime أو الأوزان أو الترخيص متقادم أو ساعة الجهاز غير صالحة.",
  };
}

export async function inspectWebGPUModelCache(cacheStorage: CacheStorage = caches): Promise<WebGPUModelMetadata | null> {
  const cache = await cacheStorage.open(WEBGPU_MODEL_CACHE);
  const response = await cache.match(WEBGPU_MODEL_META_PATH);
  if (!response) return null;
  try {
    const value = await response.json() as WebGPUModelMetadata;
    if (value.policyVersion !== WEBGPU_MODEL_POLICY_VERSION || value.modelId !== webGPUModelRegistry.modelId || value.modelRevision !== webGPUModelRegistry.modelRevision || value.dtype !== webGPUModelRegistry.dtype) return null;
    return value;
  } catch {
    return null;
  }
}

function workerInstance() {
  if (typeof Worker === "undefined") throw new Error("Web Worker غير متاح؛ لا يمكن تشغيل النموذج دون تجميد الواجهة.");
  sharedWorker ??= new Worker("/webgpu-model-worker.js", { type: "module", name: "dwnb-webgpu-model" });
  return sharedWorker;
}

function sendWorkerRequest(payload: Record<string, unknown>, options: { timeoutMs: number; onProgress?: (progress: WebGPUInstallProgress) => void }) {
  const requestId = `webgpu-${crypto.randomUUID()}`;
  const worker = workerInstance();
  return new Promise<WorkerReply>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      reject(new Error("انتهت مهلة عملية WebGPU؛ أُبقي المحرك الحتمي متاحًا."));
    }, options.timeoutMs);
    const onMessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply?.requestId !== requestId) return;
      if (reply.type === "progress" && reply.progress) {
        options.onProgress?.(reply.progress);
        return;
      }
      window.clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      if (reply.type === "error") reject(new Error(reply.message || "فشل نموذج WebGPU."));
      else resolve(reply);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ ...payload, requestId });
  });
}

async function cacheWebGPURuntimeAssets(onProgress?: (progress: WebGPUInstallProgress) => void) {
  const cache = await caches.open(WEBGPU_MODEL_CACHE);
  for (let index = 0; index < WEBGPU_RUNTIME_ASSET_PATHS.length; index += 1) {
    const path = WEBGPU_RUNTIME_ASSET_PATHS[index];
    if (!(await cache.match(path))) {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`تعذر تثبيت Runtime المحلي (${path}).`);
      await cache.put(path, response);
    }
    onProgress?.({ phase:"runtime",percent:Math.round(((index+1)/WEBGPU_RUNTIME_ASSET_PATHS.length)*100),file:path });
  }
}

async function safeStorageEstimate(): Promise<StorageEstimate | undefined> {
  if (!navigator.storage?.estimate) return undefined;
  try { return await navigator.storage.estimate(); }
  catch { return undefined; }
}

export async function installWebGPUModel(options: { onProgress?: (progress: WebGPUInstallProgress) => void; now?: Date } = {}) {
  const sourceDecision = getWebGPUModelSourceDecision(options.now);
  if (!sourceDecision.allowed) throw new Error(sourceDecision.reasonAr);
  const capability = await detectWebGPUCapability();
  if (capability.status !== "supported") throw new Error(capability.reasonAr);
  const before = await safeStorageEstimate();
  let reply: WorkerReply;
  try {
    await cacheWebGPURuntimeAssets(options.onProgress);
    reply = await sendWorkerRequest({ type: "install", registry: webGPUModelRegistry }, { timeoutMs: 15 * 60_000, onProgress: options.onProgress });
    if (reply.type !== "installed" || !reply.metadata) throw new Error("لم يُثبت عامل النموذج اكتمال التنزيل.");
  } catch (error) {
    sharedWorker?.terminate();
    sharedWorker = null;
    await caches.delete(WEBGPU_MODEL_CACHE);
    throw error;
  }
  const after = await safeStorageEstimate();
  const beforeUsage = typeof before?.usage === "number" ? before.usage : undefined;
  const afterUsage = typeof after?.usage === "number" ? after.usage : undefined;
  const originUsageDeltaBytes = typeof beforeUsage === "number" && typeof afterUsage === "number" ? Math.max(0, afterUsage - beforeUsage) : undefined;
  return { ...reply.metadata, originUsageDeltaBytes } satisfies WebGPUModelMetadata;
}

export async function rankFollowUpCandidatesWithWebGPU(sourceText: string, candidates: string[]) {
  const installed = await inspectWebGPUModelCache();
  if (!installed) throw new Error("نزّل نموذج WebGPU الاختياري من الإعدادات أولًا.");
  const cleanSource = sourceText.normalize("NFC").replace(/\s+/gu, " ").trim().slice(0, 600);
  const cleanCandidates = candidates.slice(0, 8).map((item) => item.normalize("NFC").replace(/\s+/gu, " ").trim().slice(0, 240));
  if (!cleanSource || cleanCandidates.length < 2 || cleanCandidates.some((item) => !item.endsWith("?"))) throw new Error("مرشحات سؤال WebGPU غير صالحة.");
  const reply = await sendWorkerRequest({ type: "rank", sourceText: cleanSource, candidates: cleanCandidates, registry: webGPUModelRegistry }, { timeoutMs: 90_000 });
  if (reply.type !== "ranked" || !Number.isInteger(reply.selectedIndex) || !reply.scores || reply.scores.length !== cleanCandidates.length) throw new Error("رجع نموذج WebGPU نتيجة ترتيب غير صالحة.");
  const selectedIndex = reply.selectedIndex as number;
  if (selectedIndex < 0 || selectedIndex >= cleanCandidates.length) throw new Error("اختار نموذج WebGPU مرشحًا خارج الحدود.");
  return { selectedIndex, scores: reply.scores, model: installed };
}

export async function deleteWebGPUModel(cacheStorage: CacheStorage = caches) {
  sharedWorker?.terminate();
  sharedWorker = null;
  const deletedModelCache = await cacheStorage.delete(WEBGPU_MODEL_CACHE);
  let deletedRuntimeEntries = 0;
  for (const cacheName of await cacheStorage.keys()) {
    const cache = await cacheStorage.open(cacheName);
    for (const path of WEBGPU_RUNTIME_ASSET_PATHS) if (await cache.delete(path)) deletedRuntimeEntries += 1;
  }
  return { deletedModelCache, deletedRuntimeEntries };
}

export function resetWebGPUWorkerForTests() {
  sharedWorker?.terminate();
  sharedWorker = null;
}
