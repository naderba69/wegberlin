"use client";

import { useRef, useState } from "react";
import { Bot, CheckCircle2, Download, FileArchive, HardDrive, KeyRound, MicOff, Pencil, RotateCcw, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useLearning } from "./learning-provider";
import { exportArchive, importArchive, type ImportedArchive } from "@/core/portability/backup";
import { applyImportMode, namespaceImportedProfile, previewImport, type ImportMode } from "@/core/portability/merge";
import { testAIConnection } from "@/core/ai/client";
import { commitImportedStateAtomic, deleteMedia, loadRestorePoint } from "@/core/portability/db";
import type { AIProvider } from "@/types/learning";
import { OfflinePackControl } from "./offline-pack-control";
import { AccessibleDialog } from "./accessible-dialog";

type PrivacyAction = "recordings" | "tutor-history";

export function SettingsView() {
  const { state, update, adoptCommittedState, profiles, activeProfileId, switchProfile, renameProfile, deleteProfile } = useLearning();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [pendingImport, setPendingImport] = useState<ImportedArchive | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [privacyAction, setPrivacyAction] = useState<PrivacyAction | null>(null);
  const [key, setKey] = useState(() => typeof window !== "undefined" ? (sessionStorage.getItem("dwnb-ai-key") ?? "") : "");
  const provider = state.aiSettings.provider;
  const model = state.aiSettings.model;
  const importPreview = pendingImport ? previewImport(state, pendingImport.state, pendingImport.media.length) : null;
  const linkedMediaIds = [...new Set([
    ...state.speakingAttempts.flatMap((attempt) => attempt.mediaId ? [attempt.mediaId] : []),
    ...Object.values(state.examSessions).flatMap((session) => Object.values(session.taskDrafts).flatMap((draft) => typeof draft.payload.mediaId === "string" ? [draft.payload.mediaId] : [])),
  ])];

  async function download() {
    const blob = await exportArchive(state, { includeMedia, passphrase: backupPassphrase || undefined });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `der-weg-backup-${new Date().toISOString().slice(0, 10)}.dwnb`;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1000);
    setMessage(`تم إنشاء نسخة سليمة${backupPassphrase ? " ومشفرة" : ""}${includeMedia ? " مع التسجيلات المتاحة" : " دون تسجيلات"}. لا تحتوي على مفاتيح API.`);
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      const imported = await importArchive(file, backupPassphrase || undefined);
      setPendingImport(imported);
      setMessage("تم التحقق من النسخة. راجع الملخص واختر الدمج أو الاستبدال قبل التنفيذ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر استيراد النسخة.");
    }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setBusy(true);
    try {
      const restorePoint = await exportArchive(state, { includeMedia: true });
      if (importMode === "new-profile") {
        const id = `profile-${crypto.randomUUID()}`;
        const isolated = namespaceImportedProfile(pendingImport.state, pendingImport.media, id);
        const nextState = { ...isolated.state, updatedAt: new Date().toISOString() };
        await commitImportedStateAtomic({ state: nextState, targetProfileId: id, media: isolated.media, restorePoint, currentState: state });
        await adoptCommittedState(nextState, id);
        setMessage(`تم إنشاء ملف شخصي مستقل واستعادة ${isolated.media.length} تسجيلات داخل معاملة واحدة. حُفظت نقطة استعادة، ولا يمكن أن تظهر حالة نصف مستوردة.`);
      } else {
        const nextState = { ...applyImportMode(state, pendingImport.state, importMode), updatedAt: new Date().toISOString() };
        await commitImportedStateAtomic({ state: nextState, targetProfileId: activeProfileId, media: pendingImport.media, restorePoint });
        await adoptCommittedState(nextState, activeProfileId);
        setMessage(`تم ${importMode === "merge" ? "دمج" : "استبدال"} الحالة و${pendingImport.media.length} تسجيلات ذريًا. حُفظت نقطة الاستعادة داخل المعاملة نفسها.`);
      }
      setPendingImport(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "فشل تنفيذ الاستيراد الذري؛ لم تُعتمد حالة جزئية.");
    } finally {
      setBusy(false);
    }
  }

  async function restoreLatest() {
    setBusy(true);
    try {
      const point = await loadRestorePoint();
      if (!point) { setMessage("لا توجد نقطة استعادة محفوظة قبل استيراد سابق."); return; }
      const imported = await importArchive(point);
      const currentSnapshot = await exportArchive(state, { includeMedia: true });
      const nextState = { ...imported.state, updatedAt: new Date().toISOString() };
      await commitImportedStateAtomic({ state: nextState, targetProfileId: activeProfileId, media: imported.media, restorePoint: currentSnapshot });
      await adoptCommittedState(nextState, activeProfileId);
      setPendingImport(null);
      setMessage(`تم تبديل الحالة ونقطة الرجوع و${imported.media.length} تسجيلات ذريًا؛ أصبحت الحالة المستبدلة نقطة الرجوع الجديدة.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "فشلت الاستعادة الذرية؛ لم تتغير الحالة الحالية.");
    } finally {
      setBusy(false);
    }
  }

  function setProvider(value: AIProvider) {
    const defaultModel = value === "gemini" ? "gemini-2.5-flash" : value === "openrouter" ? "openrouter/free" : value === "local" ? "qwen2.5:3b" : "";
    update((current) => ({ ...current, aiSettings: { ...current.aiSettings, provider: value, model: defaultModel } }));
  }
  function setModel(value: string) { update((current) => ({ ...current, aiSettings: { ...current.aiSettings, model: value } })); }
  function setSecret(value: string) {
    setKey(value);
    if (value) sessionStorage.setItem("dwnb-ai-key", value);
    else sessionStorage.removeItem("dwnb-ai-key");
  }
  async function test() {
    setBusy(true);
    setMessage("");
    try { setMessage(await testAIConnection({ provider, model, key })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "فشل الاختبار."); }
    finally { setBusy(false); }
  }
  async function renameLocal(id: string, currentName: string) {
    const name = window.prompt("الاسم الجديد للملف", currentName);
    if (name === null) return;
    try { await renameProfile(id, name); setMessage("تم تحديث اسم الملف الشخصي."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذرت إعادة التسمية."); }
  }
  async function deleteLocal(id: string, name: string) {
    if (!window.confirm(`حذف الملف «${name}» ووسائطه المعزولة؟ لا يمكن التراجع.`)) return;
    try { await deleteProfile(id); setMessage("تم حذف الملف الشخصي ووسائطه المعزولة."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذر حذف الملف."); }
  }

  async function confirmPrivacyAction() {
    if (privacyAction === "recordings") {
      setBusy(true);
      try {
        await Promise.all(linkedMediaIds.map((id) => deleteMedia(id)));
        update((current) => ({
          ...current,
          speakingAttempts: current.speakingAttempts.map((attempt) => ({ ...attempt, mediaId: undefined })),
          examSessions: Object.fromEntries(Object.entries(current.examSessions).map(([id, session]) => [id, {
            ...session,
            taskDrafts: Object.fromEntries(Object.entries(session.taskDrafts).filter(([, draft]) => typeof draft.payload.mediaId !== "string")),
          }])),
        }));
        setMessage(`حُذفت فورًا ${linkedMediaIds.length} تسجيلات مرتبطة بالملف النشط. بقيت المدد والتقييمات الذاتية دون ملف صوتي.`);
      } finally {
        setBusy(false);
      }
    } else if (privacyAction === "tutor-history") {
      const count = state.tutorInteractions.length;
      update((current) => ({ ...current, tutorInteractions: [] }));
      setMessage(`حُذف فورًا سجل المرشد المحلي وعدد عناصره ${count}. لم يتغير تقدم الدروس.`);
    }
    setPrivacyAction(null);
  }

  return <div className="settings-page">
    <header className="page-heading"><div><span className="eyebrow"><ShieldCheck size={15} /> بياناتك ملكك</span><h1>الإعدادات <em>والنسخ المحلي</em></h1><p>تقدمك في IndexedDB. مفتاح AI أو عنوان Ollama يبقى في Session Storage ويُستبعد من النسخ الاحتياطية.</p></div></header>
    {message && <div className="success-banner" role="status" aria-live="polite"><CheckCircle2 size={18} />{message}</div>}
    <div className="settings-grid">
      <section className="settings-card">
        <div className="settings-title"><span><HardDrive size={20} /></span><div><h2>الحفظ والنسخة الاحتياطية</h2><p>ملف محمول قابل للتحقق بـSHA-256.</p></div></div>
        <div className="profile-switcher"><strong>الملفات المحلية</strong>{profiles.map((profile) => <div className={profile.id === activeProfileId ? "profile-row active" : "profile-row"} key={profile.id}><button className="profile-open" disabled={profile.id === activeProfileId || busy} onClick={() => void switchProfile(profile.id)}><span>{profile.name}</span><small>{profile.targetExam} · {profile.id === activeProfileId ? "نشط" : "فتح"}</small></button><button aria-label={`إعادة تسمية ${profile.name}`} onClick={() => void renameLocal(profile.id, profile.name)}><Pencil size={13} /></button><button aria-label={`حذف ${profile.name}`} disabled={profile.id === activeProfileId} onClick={() => void deleteLocal(profile.id, profile.name)}><Trash2 size={13} /></button></div>)}</div>
        <div className="storage-meter"><div><span>بيانات التعلم</span><strong>محلية فقط</strong></div><i><b style={{ width: "12%" }} /></i><small>التسجيلات الصوتية محفوظة في Media Store منفصل.</small></div>
        <label className="backup-media-option"><input type="checkbox" checked={includeMedia} onChange={(event) => setIncludeMedia(event.target.checked)} /><span>تضمين التسجيلات الصوتية في ملف النسخة</span></label>
        <label>عبارة مرور اختيارية<input dir="ltr" type="password" value={backupPassphrase} onChange={(event) => setBackupPassphrase(event.target.value)} placeholder="8 أحرف على الأقل — لا تُحفظ" /></label>
        <div className="settings-actions"><button onClick={() => void download()} className="primary-button"><Download size={17} /> تصدير .dwnb</button><button onClick={() => fileRef.current?.click()} className="secondary-button"><Upload size={17} /> استيراد نسخة</button><button onClick={() => void restoreLatest()} disabled={busy} className="secondary-button"><RotateCcw size={17} /> استعادة ما قبل آخر استيراد</button><input ref={fileRef} hidden type="file" accept=".dwnb" onChange={(event) => void upload(event.target.files?.[0])} /></div>
        <div className="privacy-note"><FileArchive size={17} /><p>يشمل التقدم والخطة والأخطاء والكتابة وسجل المرشد المنظم، ويمكن تضمين التسجيلات وتشفير الحمولة بـAES-GCM. عبارة المرور ومفتاح API مستبعدان دائمًا.</p></div>
        {pendingImport && importPreview && <div className="import-preview"><strong>معاينة النسخة قبل التنفيذ</strong><small>{pendingImport.encrypted ? "مشفرة" : "غير مشفرة"} · DWNB v{pendingImport.formatVersion} · الملف: {importPreview.profileName}</small><div><span>دروس جديدة <b>{importPreview.newLessons}</b></span><span>محاولات <b>{importPreview.newExercises}</b></span><span>كتابات <b>{importPreview.newWriting}</b></span><span>وساطة <b>{importPreview.newMediation}</b></span><span>محادثات <b>{importPreview.newSpeaking}</b></span><span>تسجيلات <b>{importPreview.media}</b></span></div><div className="import-mode"><button className={importMode === "merge" ? "active" : ""} onClick={() => setImportMode("merge")}><b>دمج</b><small>اتحاد الأدلة، الأحدث للقيم المتعارضة</small></button><button className={importMode === "replace" ? "active danger" : "danger"} onClick={() => setImportMode("replace")}><b>استبدال</b><small>استبدال حالة التعلم بالكامل</small></button><button className={importMode === "new-profile" ? "active" : ""} onClick={() => setImportMode("new-profile")}><b>ملف جديد</b><small>استيراد مستقل مع عزل التسجيلات</small></button></div><footer><button className="secondary-button" onClick={() => setPendingImport(null)}>إلغاء</button><button className="primary-button" disabled={busy} onClick={() => void confirmImport()}>تأكيد {importMode === "merge" ? "الدمج" : importMode === "replace" ? "الاستبدال" : "إنشاء الملف"}</button></footer></div>}
      </section>

      <section className="settings-card">
        <div className="settings-title"><span><Bot size={20} /></span><div><h2>المعلم الذكي الاختياري</h2><p>المعلم المحلي والمنهج يعملان من دونه.</p></div></div>
        <label>المزوّد<select value={provider} onChange={(event) => setProvider(event.target.value as AIProvider)}><option value="disabled">معطّل — الوضع المحلي المدمج</option><option value="gemini">Gemini BYOK</option><option value="openrouter">OpenRouter Free-only</option><option value="local">Local / Ollama</option></select></label>
        {provider !== "disabled" && <>{provider === "local" ? <><label>عنوان Ollama المحلي<input dir="ltr" value={key} onChange={(event) => setSecret(event.target.value)} placeholder="http://localhost:11434" /></label><label>اسم النموذج المحلي<input dir="ltr" value={model} onChange={(event) => setModel(event.target.value)} placeholder="qwen2.5:3b" /></label></> : <><label>النموذج<input dir="ltr" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model ID" /></label><label>مفتاح API<div className="secret-input"><KeyRound size={17} /><input dir="ltr" type="password" value={key} onChange={(event) => setSecret(event.target.value)} placeholder="المفتاح يبقى في هذه الجلسة" /></div></label></>}</>}
        <button className="secondary-button" onClick={() => void test()} disabled={provider === "disabled" || busy}>{busy ? "جاري الاختبار…" : "اختبار اتصال دون إرسال محتوى"}</button>
        <div className="privacy-note"><ShieldCheck size={17} /><p>يسأل المرشد موافقتك قبل كل نص يُرسل إلى Gemini أو OpenRouter أو Ollama. OpenRouter يقبل فقط `openrouter/free` أو معرّفًا ينتهي بـ`:free`، ولا يوجد Paid fallback.</p></div>
      </section>

      <section className="settings-card privacy-control-card">
        <div className="settings-title"><span><ShieldCheck size={20} /></span><div><h2>الحذف والخصوصية الفورية</h2><p>احذف كل فئة دون حذف تقدم الدروس بالكامل.</p></div></div>
        <div className="privacy-delete-list">
          <article><div><strong>ملفات التسجيل المرتبطة</strong><small>{linkedMediaIds.length} ملفًا · يبقى سجل المدة بلا صوت</small></div><button disabled={linkedMediaIds.length === 0 || busy} onClick={() => setPrivacyAction("recordings")}><MicOff size={15} /> حذف التسجيلات</button></article>
          <article><div><strong>سجل المرشد وتقييماته</strong><small>{state.tutorInteractions.length} تفاعلًا منظمًا محفوظًا محليًا</small></div><button disabled={state.tutorInteractions.length === 0 || busy} onClick={() => setPrivacyAction("tutor-history")}><Trash2 size={15} /> حذف سجل المعلم</button></article>
          <article><div><strong>المفتاح أو عنوان Ollama المؤقت</strong><small>{key ? "موجود في Session Storage الآن" : "لا توجد قيمة مخزنة في الجلسة"}</small></div><button disabled={!key} onClick={() => { setSecret(""); setMessage("حُذف المفتاح أو العنوان فورًا من Session Storage."); }}><KeyRound size={15} /> حذف المفتاح الآن</button></article>
        </div>
      </section>

      <OfflinePackControl />
    </div>

    {privacyAction && <AccessibleDialog labelledBy="privacy-confirm-title" describedBy="privacy-confirm-description" onClose={() => setPrivacyAction(null)}><span><Trash2 size={24} /></span><h2 id="privacy-confirm-title">{privacyAction === "recordings" ? "حذف التسجيلات الصوتية الآن؟" : "حذف سجل المرشد الآن؟"}</h2><p id="privacy-confirm-description">{privacyAction === "recordings" ? `سيُحذف ${linkedMediaIds.length} ملفًا صوتيًا مرتبطًا بالملف النشط من IndexedDB. ستبقى مدة المحاولة والتقييم الذاتي دون رابط صوتي.` : `سيُحذف ${state.tutorInteractions.length} سؤالًا وجوابًا مع بيانات المزود والنموذج. لن يتغير تقدم الدروس أو دفتر الأخطاء.`}</p><div><button className="secondary-button" onClick={() => setPrivacyAction(null)}>إلغاء</button><button className="danger-button" onClick={() => void confirmPrivacyAction()}>{privacyAction === "recordings" ? "نعم، احذف التسجيلات" : "نعم، احذف سجل المرشد"}</button></div></AccessibleDialog>}
  </div>;
}
