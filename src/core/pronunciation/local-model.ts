import {
  LOCAL_PRONUNCIATION_MODEL_CACHE,
  LOCAL_PRONUNCIATION_MODEL_META_PATH,
  LOCAL_PRONUNCIATION_MODEL_POLICY,
  LOCAL_PRONUNCIATION_RUNTIME_ASSETS,
  localPronunciationModelRegistry,
} from "@/config/local-pronunciation-model-registry";
import { summarizeSourceFreshness } from "@/core/governance/source-freshness";

export type LocalPronunciationCapability = {
  status: "supported" | "unavailable" | "insufficient-memory" | "insufficient-storage";
  reasonAr: string;
  deviceMemoryGB?: number;
  maxBufferBytes?: number;
  storageAvailableBytes?: number;
};

export type LocalPronunciationModelMetadata = {
  policyVersion: typeof LOCAL_PRONUNCIATION_MODEL_POLICY;
  modelId: string;
  modelRevision: string;
  dtype: string;
  installedAt: string;
  cacheEntries: number;
  headerByteSize: number;
  originUsageDeltaBytes?: number;
};

export type LocalPronunciationProgress = {
  phase: "runtime" | "download" | "initializing";
  percent: number;
  loadedBytes?: number;
  totalBytes?: number;
  file?: string;
};

type AdapterLike = { limits?: { maxBufferSize?: number } };
type CapabilityEnvironment = {
  secureContext: boolean;
  gpu?: { requestAdapter: () => Promise<AdapterLike | null> };
  deviceMemoryGB?: number;
  storageEstimate?: () => Promise<{ quota?: number; usage?: number }>;
};
type WorkerReply = {
  requestId: string;
  type: "progress" | "installed" | "transcribed" | "error";
  progress?: LocalPronunciationProgress;
  metadata?: LocalPronunciationModelMetadata;
  transcript?: string;
  message?: string;
};

let sharedWorker: Worker | null = null;

function browserEnvironment(): CapabilityEnvironment {
  const candidate = navigator as Navigator & { gpu?: CapabilityEnvironment["gpu"]; deviceMemory?: number };
  return {
    secureContext: window.isSecureContext,
    gpu: candidate.gpu,
    deviceMemoryGB: candidate.deviceMemory,
    storageEstimate: navigator.storage?.estimate ? () => navigator.storage.estimate() : undefined,
  };
}

export async function detectLocalPronunciationCapability(environment?: CapabilityEnvironment): Promise<LocalPronunciationCapability> {
  const current = environment ?? (typeof window !== "undefined" ? browserEnvironment() : { secureContext: false });
  if (!current.secureContext) return { status: "unavailable", reasonAr: "تحتاج مطابقة الكلمات إلى HTTPS أو localhost موثوق." };
  if (!current.gpu) return { status: "unavailable", reasonAr: "لا يوفّر هذا المتصفح WebGPU؛ يبقى الاستماع والتسجيل والمقارنة الذاتية متاحًا." };
  let adapter: AdapterLike | null;
  try { adapter = await current.gpu.requestAdapter(); }
  catch { return { status: "unavailable", reasonAr: "تعذر طلب محول WebGPU من المتصفح." }; }
  if (!adapter) return { status: "unavailable", reasonAr: "لم يمنح المتصفح محول WebGPU صالحًا." };
  const deviceMemoryGB = current.deviceMemoryGB;
  const maxBufferBytes = adapter.limits?.maxBufferSize;
  if (typeof deviceMemoryGB === "number" && deviceMemoryGB < localPronunciationModelRegistry.minimumDeviceMemoryGB) return { status:"insufficient-memory",reasonAr:`ذاكرة الجهاز المعلنة ${deviceMemoryGB} GB؛ تحتاج الحزمة ${localPronunciationModelRegistry.minimumDeviceMemoryGB} GB على الأقل مبدئيًا.`,deviceMemoryGB,maxBufferBytes };
  if (typeof maxBufferBytes === "number" && maxBufferBytes < localPronunciationModelRegistry.minimumMaxBufferBytes) return { status:"insufficient-memory",reasonAr:"حد WebGPU المؤقت أصغر من الحد المحافظ لحزمة الصوت.",deviceMemoryGB,maxBufferBytes };
  let storageAvailableBytes: number | undefined;
  if (current.storageEstimate) {
    try {
      const estimate = await current.storageEstimate();
      if (typeof estimate.quota === "number" && typeof estimate.usage === "number") storageAvailableBytes = Math.max(0, estimate.quota - estimate.usage);
    } catch { /* Storage estimation is advisory. */ }
  }
  if (typeof storageAvailableBytes === "number" && storageAvailableBytes < localPronunciationModelRegistry.estimatedDownloadBytes) return { status:"insufficient-storage",reasonAr:"المساحة التي أعلنها المتصفح لا تكفي لحزمة مطابقة الكلمات.",deviceMemoryGB,maxBufferBytes,storageAvailableBytes };
  return { status:"supported",reasonAr:"الجهاز مناسب مبدئيًا. يبقى الأداء الفعلي بحاجة إلى تجربة على جهازك، ولا يبدأ أي تنزيل تلقائي.",deviceMemoryGB,maxBufferBytes,storageAvailableBytes };
}

export function getLocalPronunciationSourceDecision(now = new Date()) {
  const freshness = summarizeSourceFreshness(localPronunciationModelRegistry.sourceIds, now);
  const allowed = freshness.status === "fresh" || freshness.status === "due-soon";
  return {
    allowed,
    status: freshness.status,
    dueAt: freshness.dueAt,
    reasonAr: allowed ? `Runtime ونموذج Whisper وترخيصهما متحقق منها حتى ${freshness.dueAt}.` : "حُظر تنزيل حزمة النطق لأن تحقق Runtime أو النموذج أو الترخيص متقادم.",
  };
}

export async function inspectLocalPronunciationModel(cacheStorage: CacheStorage = caches): Promise<LocalPronunciationModelMetadata | null> {
  const cache = await cacheStorage.open(LOCAL_PRONUNCIATION_MODEL_CACHE);
  const response = await cache.match(LOCAL_PRONUNCIATION_MODEL_META_PATH);
  if (!response) return null;
  try {
    const value = await response.json() as LocalPronunciationModelMetadata;
    if (value.policyVersion !== LOCAL_PRONUNCIATION_MODEL_POLICY || value.modelId !== localPronunciationModelRegistry.modelId || value.modelRevision !== localPronunciationModelRegistry.modelRevision || value.dtype !== localPronunciationModelRegistry.dtype) return null;
    return value;
  } catch { return null; }
}

function workerInstance() {
  if (typeof Worker === "undefined") throw new Error("Web Worker غير متاح؛ لن نشغل التعرف الصوتي على الواجهة الرئيسية.");
  sharedWorker ??= new Worker(localPronunciationModelRegistry.runtime.workerPath, { type:"module",name:"dwnb-pronunciation-model" });
  return sharedWorker;
}

function sendWorkerRequest(payload:Record<string,unknown>,options:{timeoutMs:number;onProgress?:(progress:LocalPronunciationProgress)=>void;transfer?:Transferable[]}) {
  const requestId=`pronunciation-${crypto.randomUUID()}`;
  const worker=workerInstance();
  return new Promise<WorkerReply>((resolve,reject)=>{
    const timeout=window.setTimeout(()=>{worker.removeEventListener("message",onMessage);reject(new Error("انتهت مهلة العملية المحلية؛ لم تُحسب نتيجة نطق."));},options.timeoutMs);
    const onMessage=(event:MessageEvent<WorkerReply>)=>{const reply=event.data;if(reply?.requestId!==requestId)return;if(reply.type==="progress"&&reply.progress){options.onProgress?.(reply.progress);return}window.clearTimeout(timeout);worker.removeEventListener("message",onMessage);if(reply.type==="error")reject(new Error(reply.message||"فشل نموذج مطابقة الكلمات."));else resolve(reply)};
    worker.addEventListener("message",onMessage);
    worker.postMessage({...payload,requestId},options.transfer??[]);
  });
}

async function cacheRuntimeAssets(onProgress?:(progress:LocalPronunciationProgress)=>void) {
  const cache=await caches.open(LOCAL_PRONUNCIATION_MODEL_CACHE);
  for(let index=0;index<LOCAL_PRONUNCIATION_RUNTIME_ASSETS.length;index+=1){const path=LOCAL_PRONUNCIATION_RUNTIME_ASSETS[index];if(!(await cache.match(path))){const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw new Error(`تعذر تثبيت Runtime المحلي (${path}).`);await cache.put(path,response)}onProgress?.({phase:"runtime",percent:Math.round(((index+1)/LOCAL_PRONUNCIATION_RUNTIME_ASSETS.length)*100),file:path})}
}

async function safeStorageEstimate(){if(!navigator.storage?.estimate)return undefined;try{return await navigator.storage.estimate()}catch{return undefined}}

export async function installLocalPronunciationModel(options:{onProgress?:(progress:LocalPronunciationProgress)=>void;now?:Date}={}) {
  const sourceDecision=getLocalPronunciationSourceDecision(options.now);if(!sourceDecision.allowed)throw new Error(sourceDecision.reasonAr);
  const capability=await detectLocalPronunciationCapability();if(capability.status!=="supported")throw new Error(capability.reasonAr);
  const before=await safeStorageEstimate();let reply:WorkerReply;
  try{await cacheRuntimeAssets(options.onProgress);reply=await sendWorkerRequest({type:"install",registry:localPronunciationModelRegistry},{timeoutMs:15*60_000,onProgress:options.onProgress});if(reply.type!=="installed"||!reply.metadata)throw new Error("لم يثبت العامل اكتمال تنزيل حزمة الصوت.")}catch(error){sharedWorker?.terminate();sharedWorker=null;await caches.delete(LOCAL_PRONUNCIATION_MODEL_CACHE);throw error}
  const after=await safeStorageEstimate();const beforeUsage=typeof before?.usage==="number"?before.usage:undefined;const afterUsage=typeof after?.usage==="number"?after.usage:undefined;const originUsageDeltaBytes=typeof beforeUsage==="number"&&typeof afterUsage==="number"?Math.max(0,afterUsage-beforeUsage):undefined;
  return {...reply.metadata,originUsageDeltaBytes} satisfies LocalPronunciationModelMetadata;
}

export async function transcribeGermanLocally(audio:Float32Array) {
  const installed=await inspectLocalPronunciationModel();if(!installed)throw new Error("نزّل حزمة مطابقة الكلمات المحلية من الإعدادات أولًا.");
  const minimum=Math.floor(localPronunciationModelRegistry.minimumAudioSeconds*localPronunciationModelRegistry.sampleRateHz);const maximum=localPronunciationModelRegistry.maximumAudioSeconds*localPronunciationModelRegistry.sampleRateHz;
  if(audio.length<minimum)throw new Error("العينة قصيرة جدًا للتحليل المحلي.");if(audio.length>maximum)throw new Error(`العينة أطول من ${localPronunciationModelRegistry.maximumAudioSeconds} ثانية.`);if(audio.some((value)=>!Number.isFinite(value)||Math.abs(value)>1.01))throw new Error("العينة الصوتية غير صالحة.");
  const transferAudio=audio.slice();const reply=await sendWorkerRequest({type:"transcribe",audio:transferAudio,registry:localPronunciationModelRegistry},{timeoutMs:2*60_000,transfer:[transferAudio.buffer]});
  if(reply.type!=="transcribed"||typeof reply.transcript!=="string")throw new Error("لم يرجع النموذج نصًا محليًا صالحًا.");
  return {transcript:reply.transcript,model:installed};
}

export async function deleteLocalPronunciationModel(cacheStorage:CacheStorage=caches){sharedWorker?.terminate();sharedWorker=null;return{deleted:await cacheStorage.delete(LOCAL_PRONUNCIATION_MODEL_CACHE)}}
export function resetLocalPronunciationWorkerForTests(){sharedWorker?.terminate();sharedWorker=null}
