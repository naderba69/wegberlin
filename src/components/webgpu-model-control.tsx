"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Download, Gauge, HardDrive, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { WEBGPU_MODEL_POLICY_VERSION } from "@/config/webgpu-model-registry";
import { deleteWebGPUModel, detectWebGPUCapability, getWebGPUModelSourceDecision, inspectWebGPUModelCache, installWebGPUModel, type WebGPUCapability, type WebGPUInstallProgress, type WebGPUModelMetadata } from "@/core/ai/webgpu-model";
import { StatusAnnouncement } from "./status-announcement";
import { useLearning } from "./learning-provider";

function byteLabel(bytes?: number) {
  if (typeof bytes !== "number" || bytes <= 0) return "غير متاح";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const capabilityLabel: Record<WebGPUCapability["status"], string> = {
  supported: "مدعوم مبدئيًا",
  unavailable: "غير متاح",
  "insufficient-memory": "ذاكرة غير كافية",
  "insufficient-storage": "مساحة غير كافية",
};

export function WebGPUModelControl() {
  const {state}=useLearning();
  const lowDataMode=state.dataUsagePreferences.lowDataMode;
  const [capability, setCapability] = useState<WebGPUCapability | null>(null);
  const [metadata, setMetadata] = useState<WebGPUModelMetadata | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<WebGPUInstallProgress | null>(null);
  const [message, setMessage] = useState("");
  const sourceDecision = getWebGPUModelSourceDecision();

  useEffect(() => {
    let active = true;
    void Promise.all([detectWebGPUCapability(), inspectWebGPUModelCache()]).then(([nextCapability, nextMetadata]) => {
      if (!active) return;
      setCapability(nextCapability);
      setMetadata(nextMetadata);
    }).catch(() => { if (active) setCapability({ status:"unavailable",reasonAr:"تعذر فحص WebGPU أو Cache Storage." }); });
    return () => { active = false; };
  }, []);

  async function install() {
    if (!confirmed || capability?.status !== "supported" || lowDataMode) return;
    setBusy(true);
    setMessage("");
    try {
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
      const installed = await installWebGPUModel({ onProgress:setProgress });
      setMetadata(installed);
      setProgress(null);
      setMessage("اكتمل تنزيل النموذج وتهيئته داخل Web Worker. يمكن الآن استعماله لترتيب أسئلة المتابعة محليًا.");
    } catch (error) {
      setProgress(null);
      setMessage(error instanceof Error ? `${error.message} بقي المحرك الحتمي متاحًا.` : "فشل نموذج WebGPU؛ بقي المحرك الحتمي متاحًا.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("حذف نموذج WebGPU وملفات Runtime المخزنة محليًا؟ لن يتغير تقدم الدروس.")) return;
    setBusy(true);
    try {
      const result = await deleteWebGPUModel();
      setMetadata(null);
      setConfirmed(false);
      setProgress(null);
      setMessage(`حُذف Cache النموذج${result.deletedRuntimeEntries ? ` و${result.deletedRuntimeEntries} ملفات Runtime` : ""}. بقي تقدمك والمحرك الحتمي.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حذف النموذج المحلي.");
    } finally {
      setBusy(false);
    }
  }

  const progressPercent = progress?.percent ?? 0;
  const storedBytes = metadata?.originUsageDeltaBytes || metadata?.headerByteSize;

  return <section className="settings-card webgpu-model-card" data-webgpu-policy={WEBGPU_MODEL_POLICY_VERSION}>
    <div className="settings-title"><span><BrainCircuit size={20} /></span><div><h2>نموذج اختياري داخل المتصفح</h2><p>ترتيب دلالي محلي لأسئلة المتابعة عبر WebGPU، وليس معلمًا أو مصحح نطق.</p></div></div>

    <div className="webgpu-model-status">
      <span className={metadata ? "ready" : capability?.status === "supported" ? "supported" : "unavailable"}>{metadata ? <CheckCircle2 size={18} /> : capability?.status === "supported" ? <Gauge size={18} /> : <TriangleAlert size={18} />}</span>
      <div><small>حالة القدرة</small><strong>{metadata ? "النموذج مثبت" : capability ? capabilityLabel[capability.status] : "جاري الفحص…"}</strong><p>{metadata ? `إصدار ${metadata.modelRevision.slice(0, 8)} · ${metadata.dtype} · ${metadata.cacheEntries} ملفات Cache` : capability?.reasonAr ?? "نطلب محول GPU ونفحص الذاكرة والمساحة دون تنزيل."}</p></div>
    </div>

    <div className="webgpu-model-facts">
      <div><HardDrive size={16} /><span><small>قبل التنزيل</small><strong>نحو 130–150 MB</strong><em>الأوزان الكمية المعلنة 118 MB، ويضاف Tokenizer وRuntime.</em></span></div>
      <div><ShieldCheck size={16} /><span><small>الترخيص والمصدر</small><strong>Apache-2.0 · متحقق حتى {sourceDecision.dueAt}</strong><em>Runtime 4.2.0 وأوزان ONNX مثبّتة الإصدار؛ التقادم يمنع تنزيلًا جديدًا.</em></span></div>
      <div><BrainCircuit size={16} /><span><small>المهمة المحدودة</small><strong>384-dimensional similarity</strong><em>يرتب أسئلة مؤلفة مسبقًا؛ لا يولد درجة CEFR ولا يفهم الصوت.</em></span></div>
    </div>

    {lowDataMode&&!metadata&&<p className="webgpu-boundary">وضع البيانات المنخفضة مفعّل: تنزيل 130–150 MB محظور حتى توقفه صراحة من الإعدادات.</p>}
    {!metadata && <label className="webgpu-download-consent"><input type="checkbox" checked={confirmed} disabled={busy || capability?.status !== "supported" || !sourceDecision.allowed || lowDataMode} onChange={(event) => setConfirmed(event.target.checked)} /><span><b>أوافق على تنزيل النموذج مرة واحدة</b><small>التنزيل يطلب ملفات الأوزان من Hugging Face، ثم يحفظها في Cache Storage مخصص. لا يُرسل تقدمك أو تسجيلاتك.</small></span></label>}

    {progress && <div className="webgpu-progress"><div><span>{progress.phase === "runtime" ? "تحميل Runtime المحلي" : progress.phase === "initializing" ? "تهيئة جلسة WebGPU" : `تنزيل ${progress.file ?? "ملفات النموذج"}`}</span><strong>{progressPercent}%</strong></div><i role="progressbar" aria-label="تقدم تنزيل نموذج WebGPU" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><b style={{width:`${progressPercent}%`}} /></i>{progress.totalBytes ? <small>{byteLabel(progress.loadedBytes)} / {byteLabel(progress.totalBytes)}</small> : null}</div>}

    {metadata && <div className="webgpu-installed-size"><Download size={15} /><span><small>المساحة بعد التثبيت</small><strong>{byteLabel(storedBytes)}{metadata.originUsageDeltaBytes ? " زيادة Origin مقاسة" : metadata.headerByteSize ? " من ترويسات Cache" : " — يحددها المتصفح"}</strong></span></div>}

    {message && <StatusAnnouncement message={message} channel="webgpu-model" className="compact" icon={<ShieldCheck size={15} />} />}

    <div className="settings-actions">
      {!metadata && <button className="primary-button" disabled={busy || !confirmed || capability?.status !== "supported" || !sourceDecision.allowed || lowDataMode} onClick={() => void install()}><Download size={16} />{busy ? "جاري التنزيل والتهيئة…" : "نزّل وشغّل عبر WebGPU"}</button>}
      {metadata && <button className="secondary-button" disabled={busy} onClick={() => void remove()}><Trash2 size={16} /> حذف النموذج المحلي</button>}
      <a className="secondary-button" href="https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2" target="_blank" rel="noreferrer">بطاقة النموذج</a>
    </div>

    <p className="webgpu-boundary">لا تنزيل تلقائي ولا WASM fallback صامت. عند غياب WebGPU أو فشل الذاكرة/المساحة يبقى السؤال الحتمي المحلي وOllama متاحين. النموذج لا يدخل ZIP بأوزانه ولا حزمة Offline الأساسية.</p>
  </section>;
}
