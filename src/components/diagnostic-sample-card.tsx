"use client";

import { useEffect, useRef, useState } from "react";
import { CircleStop, Loader2, Mic2, PenLine, ShieldCheck, Trash2 } from "lucide-react";
import { diagnosticSampleTasks } from "@/data/diagnostic";
import { deleteMedia, loadMedia, saveMedia } from "@/core/portability/db";
import {
  canSaveSpeakingSample,
  canSaveWritingSample,
  countWords,
  latestSample,
  withSample,
  withoutSample,
} from "@/core/diagnostic/samples";
import type { CEFRLevel, DiagnosticSample, DiagnosticSampleKind } from "@/types/learning";
import { useLearning } from "./learning-provider";

const kindLabels: Record<DiagnosticSampleKind, string> = { writing: "كتابة قصيرة", speaking: "تسجيل شفهي" };

/**
 * P0-26: عينة إنتاج قصيرة ومستقلة بعد التشخيص.
 *
 * الحدود الظاهرة في الواجهة نفسها: لا درجة، ولا تصحيح، ولا أثر على المستوى المقدّر،
 * والعينة اختيارية وتُعرض بعد النتيجة لا داخل مسار الأسئلة حتى لا يُطال التشخيص.
 */
export function DiagnosticSampleCard({ level, formId }: { level: CEFRLevel; formId?: "A" | "B" }) {
  const { state, update } = useLearning();
  const [kind, setKind] = useState<DiagnosticSampleKind>("writing");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [savedAudioUrl, setSavedAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const savedUrlRef = useRef("");
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const samples = state.diagnosticSamples ?? [];
  const existing = latestSample(samples, kind);
  const savedMediaId = existing?.mediaId ?? "";
  const task = diagnosticSampleTasks[level][kind];
  const words = countWords(text);
  const writingReady = canSaveWritingSample(text, level);
  const speakingReady = canSaveSpeakingSample(duration, level);

  // التسجيل لا يُحمَّل إلا بطلب المتعلّم: لا نفتح وسائط في الخلفية، ولا ننشئ
  // روابط كائنات (object URLs) إلا عند الحاجة الفعلية للسماع.
  async function loadSavedAudio() {
    if (!existing?.mediaId) return;
    const loaded = await loadMedia(existing.mediaId).catch(() => null);
    if (!loaded) {
      setMessage("التسجيل غير متاح في هذا المتصفح الآن؛ العينة نفسها محفوظة في ملفك.");
      return;
    }
    setSavedAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      savedUrlRef.current = URL.createObjectURL(loaded);
      return savedUrlRef.current;
    });
  }

  useEffect(() => {
    setSavedAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      savedUrlRef.current = "";
      return "";
    });
  }, [savedMediaId]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setDuration(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))), 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => () => {
    if (savedUrlRef.current) URL.revokeObjectURL(savedUrlRef.current);
  }, []);

  function saveWriting() {
    if (!writingReady) return;
    const now = new Date().toISOString();
    const sample: DiagnosticSample = {
      id: `sample-writing-${crypto.randomUUID()}`,
      kind: "writing",
      level,
      promptDe: task.promptDe,
      promptAr: task.promptAr,
      text: text.trim(),
      wordCount: countWords(text),
      formId,
      createdAt: now,
    };
    update((current) => ({ ...current, diagnosticSamples: withSample(current.diagnosticSamples ?? [], sample) }));
    setMessage("حُفظت العينة الكتابية محليًا. لا تصحيح آلي ولا درجة، وهي لا تغيّر المستوى المقدّر.");
  }

  async function saveSpeaking() {
    if (!blob || !speakingReady) return;
    const mediaId = `diagnostic-sample-${crypto.randomUUID()}`;
    await saveMedia(mediaId, blob);
    const now = new Date().toISOString();
    const sample: DiagnosticSample = {
      id: `sample-speaking-${crypto.randomUUID()}`,
      kind: "speaking",
      level,
      promptDe: task.promptDe,
      promptAr: task.promptAr,
      mediaId,
      durationSeconds: duration,
      formId,
      createdAt: now,
    };
    update((current) => ({ ...current, diagnosticSamples: withSample(current.diagnosticSamples ?? [], sample) }));
    setMessage("حُفظ التسجيل محليًا على جهازك فقط. لم يُرفع ولم تُحسب درجة نطق.");
    setBlob(null);
    setDuration(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
  }

  async function removeSample() {
    if (!existing) return;
    if (existing.mediaId) await deleteMedia(existing.mediaId).catch(() => undefined);
    update((current) => ({ ...current, diagnosticSamples: withoutSample(current.diagnosticSamples ?? [], existing.id) }));
    setMessage("حُذفت العينة وتسجيلها من هذا الجهاز.");
  }

  async function startRecording() {
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setDuration(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const next = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(next);
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(next);
        });
        setDuration(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMessage("لم نتمكن من الوصول إلى الميكروفون. تحقق من إذن المتصفح، أو اكتفِ بالعينة الكتابية.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return <section className="diagnostic-sample-card" aria-label="عينة إنتاج قصيرة بعد التشخيص">
    <header>
      <div>
        <small>عينة إنتاج قصيرة · اختيارية · {level}</small>
        <h3>اترك أثرًا واحدًا من إنتاجك</h3>
      </div>
      <span className="sample-no-score"><ShieldCheck size={15} /> بلا درجة</span>
    </header>
    <p className="sample-boundary">
      التشخيص كله أسئلة اختيار من متعدد؛ هذه العينة تكمله بأثر إنتاجي واحد ترجع إليه لاحقًا.
      <b>لا يصحّحها البرنامج ولا يقيّمها ولا تغيّر المستوى المقدّر</b>، وتبقى على جهازك داخل ملفك المحلي.
    </p>
    <div className="sample-tabs" role="tablist" aria-label="نوع العينة">
      {(["writing", "speaking"] as const).map((item) => <button
        key={item}
        role="tab"
        aria-selected={kind === item}
        className={kind === item ? "active" : ""}
        onClick={() => { setKind(item); setMessage(""); }}
      >
        {item === "writing" ? <PenLine size={15} /> : <Mic2 size={15} />} {kindLabels[item]}
        {latestSample(samples, item) ? <i title="محفوظة">✓</i> : null}
      </button>)}
    </div>

    <p className="sample-prompt" lang="de" dir="ltr">{task.promptDe}</p>
    <p className="sample-prompt-ar">{task.promptAr}</p>
    <p className="sample-hint">{task.hintAr}</p>

    {kind === "writing" ? <div className="sample-writing">
      <label htmlFor="diagnostic-sample-text">اكتب هنا دون قاموس</label>
      <textarea
        id="diagnostic-sample-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={5}
        lang="de"
        dir="ltr"
        placeholder="Schreiben Sie hier …"
      />
      <div className="sample-meter">
        <span>{words} / {task.target} كلمة · الحد الأدنى للحفظ {task.minimum}</span>
        <button className="primary-button" onClick={saveWriting} disabled={!writingReady}>احفظ العينة الكتابية</button>
      </div>
    </div> : <div className="sample-speaking">
      <div className="sample-recorder">
        {recording
          ? <button className="primary-button" onClick={stopRecording}><CircleStop size={16} /> أوقف التسجيل · {duration}s</button>
          : <button className="primary-button" onClick={startRecording}><Mic2 size={16} /> ابدأ التسجيل</button>}
        <span>الهدف {task.target} ثانية · الحد الأدنى للحفظ {task.minimum} ثانية</span>
      </div>
      {recording && <p className="sample-recording-note" role="status"><Loader2 size={14} className="spin" /> جارٍ التسجيل على جهازك فقط …</p>}
      {audioUrl && <audio controls src={audioUrl} aria-label="استمع إلى تسجيلك قبل الحفظ" />}
      <div className="sample-meter">
        <span>{duration} / {task.target} ثانية</span>
        <button className="primary-button" onClick={saveSpeaking} disabled={!speakingReady}>احفظ التسجيل</button>
      </div>
    </div>}

    {existing && <article className="sample-saved">
      <div>
        <small>محفوظة {new Date(existing.createdAt).toLocaleDateString("ar")} · {kindLabels[existing.kind]}</small>
        {existing.text && <p lang="de" dir="ltr">{existing.text}</p>}
        {existing.mediaId && (savedAudioUrl
          ? <audio controls src={savedAudioUrl} aria-label="عينتك الشفهية المحفوظة" />
          : <button className="secondary-button" onClick={loadSavedAudio}>اسمع التسجيل المحفوظ</button>)}
        {existing.wordCount ? <span className="sample-count">{existing.wordCount} كلمة</span> : null}
        {existing.durationSeconds ? <span className="sample-count">{existing.durationSeconds} ثانية</span> : null}
      </div>
      <button className="tiny-danger" onClick={removeSample} aria-label="احذف العينة"><Trash2 size={14} /> احذف</button>
    </article>}

    {message && <p className="sample-message" role="status" aria-live="polite">{message}</p>}
  </section>;
}

/** عرض مختصر للعينات في صفحة الأدلة: مرجع زمني لا مؤشر أداء. */
export function DiagnosticSampleSummary() {
  const { state } = useLearning();
  const samples = state.diagnosticSamples ?? [];
  if (!samples.length) return null;
  return <ul className="sample-summary-list">
    {samples.map((sample) => <li key={sample.id}>
      <span>{kindLabels[sample.kind]}</span>
      <strong>{sample.level}</strong>
      <small>{new Date(sample.createdAt).toLocaleDateString("ar")}</small>
      <em>{sample.wordCount ? `${sample.wordCount} كلمة` : `${sample.durationSeconds ?? 0} ثانية`}</em>
    </li>)}
  </ul>;
}
