"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Database, Download, RefreshCcw, Trash2, WifiOff } from "lucide-react";

type PackMetadata = {
  installed: boolean;
  completedAt?: string;
  routeCount?: number;
  assetCount?: number;
  entryCount?: number;
  includesAudio?: boolean;
  audioEntryCount?: number;
  byteSize?: number;
};

type PackEstimate = {
  audioByteSize: number;
  audioAssetCount: number;
  routeCount: number;
};

type PackProgress = {
  phase: "manifest" | "routes" | "assets" | "promoting";
  percent: number;
  completed: number;
  total: number;
};

type WorkerReply = PackMetadata & Partial<PackProgress> & Partial<PackEstimate> & {
  type: string;
  message?: string;
  removedAudioCount?: number;
};

const phaseLabels: Record<PackProgress["phase"], string> = {
  manifest: "التحقق من فهرس المسارات",
  routes: "تنزيل صفحات الدروس والامتحانات",
  assets: "تنزيل ملفات التشغيل والتنسيق",
  promoting: "تثبيت النسخة المكتملة بأمان",
};

function byteLabel(bytes?: number | null) {
  if (typeof bytes !== "number") return "غير معروف بعد";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function offlineWorker() {
  if (!("serviceWorker" in navigator)) throw new Error("هذا المتصفح لا يدعم Service Worker.");
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error("عامل Offline غير جاهز بعد. أعد تحميل الصفحة وحاول مجددًا.");
  return worker;
}

async function sendWorkerCommand(type: string, onProgress?: (progress: PackProgress) => void, payload: Record<string, unknown> = {}): Promise<WorkerReply> {
  const worker = await offlineWorker();
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const longOperation = type === "DWNB_OFFLINE_PACK_DOWNLOAD" || type === "DWNB_OFFLINE_PACK_REMOVE_AUDIO";
    const timeout = window.setTimeout(() => reject(new Error("انتهت مهلة اتصال الحزمة المحلية.")), longOperation ? 15 * 60_000 : 15_000);
    channel.port1.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.type === "DWNB_OFFLINE_PACK_PROGRESS" && reply.phase && typeof reply.percent === "number") {
        onProgress?.({ phase: reply.phase, percent: reply.percent, completed: reply.completed ?? 0, total: reply.total ?? 0 });
        return;
      }
      if (reply.type === "DWNB_OFFLINE_PACK_ERROR") {
        window.clearTimeout(timeout);
        reject(new Error(reply.message || "فشل تنزيل الحزمة."));
        return;
      }
      window.clearTimeout(timeout);
      resolve(reply);
    };
    worker.postMessage({ type, ...payload }, [channel.port2]);
  });
}

export function OfflinePackControl() {
  const [metadata, setMetadata] = useState<PackMetadata>({ installed: false });
  const [progress, setProgress] = useState<PackProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("جاري التحقق من الحزمة المحلية…");
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<PackEstimate | null>(null);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [available, setAvailable] = useState(true);

  const refreshStorage = useCallback(async () => {
    if (!navigator.storage?.estimate) return;
    const estimate = await navigator.storage.estimate();
    setStorageUsage(typeof estimate.usage === "number" ? estimate.usage : null);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const reply = await sendWorkerCommand("DWNB_OFFLINE_PACK_STATUS");
      const next = {
        installed: Boolean(reply.installed),
        completedAt: reply.completedAt,
        routeCount: reply.routeCount,
        assetCount: reply.assetCount,
        entryCount: reply.entryCount,
        includesAudio: reply.includesAudio,
        audioEntryCount: reply.audioEntryCount,
        byteSize: reply.byteSize,
      };
      setMetadata(next);
      if (next.installed) setIncludeAudio(Boolean(next.includesAudio));
      setAvailable(true);
      setMessage(next.installed ? next.includesAudio ? "حزمة الصفحات والصوت مثبتة على هذا المتصفح." : "حزمة الصفحات مثبتة دون الصوت الاختياري." : "لم تُنزّل حزمة الدراسة بعد.");
      await refreshStorage();
    } catch (error) {
      setAvailable(false);
      setMessage(process.env.NODE_ENV === "development" ? "يظهر تنزيل الحزمة بعد Production build أو النشر." : error instanceof Error ? error.message : "تعذر قراءة حالة الحزمة.");
    }
  }, [refreshStorage]);

  const refreshEstimate = useCallback(async () => {
    try {
      const reply = await sendWorkerCommand("DWNB_OFFLINE_PACK_ESTIMATE");
      if (typeof reply.audioByteSize === "number" && typeof reply.audioAssetCount === "number" && typeof reply.routeCount === "number") {
        setEstimate({ audioByteSize: reply.audioByteSize, audioAssetCount: reply.audioAssetCount, routeCount: reply.routeCount });
      }
    } catch {
      setEstimate(null);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void refreshStatus(); void refreshEstimate(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [refreshEstimate, refreshStatus]);

  async function downloadPack() {
    setBusy(true);
    setProgress({ phase: "manifest", percent: 1, completed: 0, total: 0 });
    setMessage("بدأ تنزيل الحزمة. اترك هذه الصفحة مفتوحة لرؤية التقدم.");
    try {
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
      const reply = await sendWorkerCommand("DWNB_OFFLINE_PACK_DOWNLOAD", setProgress, { includeAudio });
      setMetadata({
        installed: true,
        completedAt: reply.completedAt,
        routeCount: reply.routeCount,
        assetCount: reply.assetCount,
        entryCount: reply.entryCount,
        includesAudio: reply.includesAudio,
        audioEntryCount: reply.audioEntryCount,
        byteSize: reply.byteSize,
      });
      setProgress(null);
      setMessage(includeAudio ? "اكتمل تثبيت الصفحات والصوت الاختياري." : "اكتملت حزمة الصفحات دون تنزيل الصوت الاختياري.");
      await refreshStorage();
    } catch (error) {
      setProgress(null);
      setMessage(error instanceof Error ? error.message : "فشل تنزيل الحزمة الكاملة.");
    } finally {
      setBusy(false);
    }
  }

  async function removePack() {
    if (!window.confirm("حذف حزمة المحتوى دون حذف تقدمك أو تسجيلاتك؟")) return;
    setBusy(true);
    try {
      await sendWorkerCommand("DWNB_OFFLINE_PACK_REMOVE");
      setMetadata({ installed: false });
      setProgress(null);
      setMessage("حُذفت حزمة المحتوى. لم يُحذف التقدم أو ملفات DWNB.");
      await refreshStorage();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حذف الحزمة.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAudioOnly() {
    if (!window.confirm("حذف الصوت المولّد من حزمة Offline مع إبقاء الصفحات والتقدم والتسجيلات الشخصية؟")) return;
    setBusy(true);
    try {
      const reply = await sendWorkerCommand("DWNB_OFFLINE_PACK_REMOVE_AUDIO");
      setMetadata((current) => ({ ...current, installed: true, includesAudio: false, audioEntryCount: 0, byteSize: reply.byteSize }));
      setIncludeAudio(false);
      setMessage(`حُذف ${reply.removedAudioCount ?? 0} موردًا صوتيًا من الحزمة. بقيت الصفحات والتقدم والتسجيلات الشخصية.`);
      await refreshStorage();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حذف صوت الحزمة.");
    } finally {
      setBusy(false);
    }
  }

  const installedDate = metadata.completedAt
    ? new Intl.DateTimeFormat("ar-TN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(metadata.completedAt))
    : null;

  return <section className="settings-card offline-pack-card">
    <div className="settings-title">
      <span>{metadata.installed ? <CheckCircle2 size={20} /> : <WifiOff size={20} />}</span>
      <div>
        <h2>حزمة الدراسة دون إنترنت</h2>
        <p>تنزيل اختياري كامل؛ لا يفرض استهلاك الشبكة على المتعلم.</p>
      </div>
    </div>

    <div className={metadata.installed ? "offline-pack-status installed" : "offline-pack-status"} aria-live="polite">
      <Database size={18} />
      <div>
        <strong>{message}</strong>
        {metadata.installed && <small>
          {metadata.routeCount ?? 0} مسارًا · {metadata.assetCount ?? 0} موردًا · {byteLabel(metadata.byteSize)}
          {metadata.includesAudio ? ` · ${metadata.audioEntryCount ?? 0} مورد صوت` : " · دون صوت"}
          {installedDate ? ` · ${installedDate}` : ""}
        </small>}
      </div>
    </div>

    <p className="offline-pack-copy">
      تشمل الحزمة 84 درسًا، 30 وحدة، أربع بوابات، المكتبة، و150 مهمة امتحان مع لوحات المحاكاة. لا تشمل مفتاح AI ولا التسجيلات الشخصية، ولا تدّعي وجود صوت امتحاني حقيقي.
    </p>

    <div className="pack-size-preview">
      <div><small>قبل التنزيل</small><strong>{estimate?.routeCount ?? 298} مسارًا أساسيًا</strong><span>يقيس المتصفح حجم الصفحات وملفات التشغيل بدقة بعد تثبيتها.</span></div>
      <label><input type="checkbox" checked={includeAudio} disabled={busy} onChange={(event) => setIncludeAudio(event.target.checked)} /><span><b>تضمين الصوت المولّد اختياريًا</b><small>{estimate ? `${estimate.audioAssetCount} ملفًا · ${byteLabel(estimate.audioByteSize)} معروفة من البيانات` : "جاري حساب حجم الصوت من البيانات…"}</small></span></label>
      {metadata.installed && <div><small>الحجم المثبت الفعلي</small><strong>{byteLabel(metadata.byteSize)}</strong><span>{metadata.includesAudio ? `${metadata.audioEntryCount ?? 0} موردًا صوتيًا مثبتًا` : "الصفحات مثبتة دون الصوت"}</span></div>}
    </div>

    {progress && <div className="offline-pack-progress">
      <div><span>{phaseLabels[progress.phase]}</span><strong>{progress.percent}%</strong></div>
      <i role="progressbar" aria-label="تقدم تنزيل حزمة الدراسة" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><b style={{ width: `${progress.percent}%` }} /></i>
      {progress.total > 0 && <small>{progress.completed} من {progress.total}</small>}
    </div>}

    <div className="settings-actions">
      <button className="primary-button" disabled={!available || busy} onClick={() => void downloadPack()}>
        {metadata.installed ? <RefreshCcw size={17} /> : <Download size={17} />}
        {busy ? "جاري العمل…" : metadata.installed ? (includeAudio ? "تحديث وإضافة الصوت" : "تحديث حزمة الصفحات") : (includeAudio ? "تنزيل الصفحات والصوت" : "تنزيل حزمة الصفحات")}
      </button>
      {metadata.installed && metadata.includesAudio && <button className="secondary-button" disabled={busy} onClick={() => void removeAudioOnly()}><Trash2 size={17} /> حذف صوت الحزمة فقط</button>}
      {metadata.installed && <button className="secondary-button" disabled={busy} onClick={() => void removePack()}><Trash2 size={17} /> حذف الحزمة</button>}
    </div>

    <small className="offline-storage-note">
      {storageUsage === null ? "المساحة الدقيقة يحددها المتصفح." : `استخدام هذا الموقع حاليًا: ${(storageUsage / 1024 / 1024).toFixed(1)} MB.`}
      {" "}تقدمك محفوظ منفصلًا في IndexedDB.
    </small>
  </section>;
}
