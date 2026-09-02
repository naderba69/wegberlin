"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Eye, EyeOff, Gauge, Headphones, Mic2, Save, Square, Trash2 } from "lucide-react";
import { libraryAudioAssetByItemId, libraryAudioManifest, audioDurationLabel } from "@/data/library-audio-assets";
import { listeningLibrary } from "@/data/library-registry";
import type { CEFRLevel } from "@/types/learning";
import { saveMedia } from "@/core/portability/db";
import { useLearning } from "./learning-provider";

type RecordingPhase = "idle" | "recording" | "recorded" | "saved";
const levels: Array<CEFRLevel | "all"> = ["all", "A1", "A2", "B1", "B2"];

export function ShadowingStudio() {
  const { state, update } = useLearning();
  const availableItems = listeningLibrary.filter((item) => Boolean(libraryAudioAssetByItemId[item.id]));
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const filtered = availableItems.filter((item) => level === "all" || item.level === level);
  const [selectedId, setSelectedId] = useState(availableItems[0]?.id ?? "");
  const selected = availableItems.find((item) => item.id === selectedId) ?? filtered[0];
  const asset = selected ? libraryAudioAssetByItemId[selected.id] : undefined;
  const modelAudioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [selfScore, setSelfScore] = useState(3);
  const [reflection, setReflection] = useState("");
  const [message, setMessage] = useState("");
  const attempts = selected ? state.speakingAttempts.filter((attempt) => attempt.taskId === `shadowing:${selected.id}`).length : 0;

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
  }, [recordedUrl]);

  function chooseLevel(next: CEFRLevel | "all") {
    setLevel(next);
    const first = availableItems.find((item) => next === "all" || item.level === next);
    if (first) chooseItem(first.id);
  }

  function chooseItem(id: string) {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setSelectedId(id);
    setShowTranscript(false);
    setPhase("idle");
    setRecordedBlob(null);
    setRecordedUrl("");
    setDurationSeconds(0);
    setReflection("");
    setMessage("");
  }

  function changeRate(next: number) {
    setRate(next);
    if (modelAudioRef.current) modelAudioRef.current.playbackRate = next;
  }

  async function startRecording() {
    if (!selected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
        stream.getTracks().forEach((track) => track.stop());
        setPhase("recorded");
      };
      recorderRef.current = recorder;
      recorder.start();
      setMessage("");
      setPhase("recording");
    } catch {
      setMessage("تعذر الوصول إلى الميكروفون. امنح الإذن ثم حاول مجددًا.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function saveAttempt() {
    if (!selected || !recordedBlob || phase === "saved") return;
    const mediaId = `shadowing-${crypto.randomUUID()}`;
    await saveMedia(mediaId, recordedBlob);
    const now = new Date().toISOString();
    update((current) => ({
      ...current,
      speakingAttempts: [...current.speakingAttempts, {
        id: `attempt-${crypto.randomUUID()}`,
        taskId: `shadowing:${selected.id}`,
        mediaId,
        durationSeconds,
        selfScore,
        reflection: `Shadowing ${rate}× | ${reflection}`,
        createdAt: now,
      }],
      studyHistory: [...current.studyHistory, { date: now.slice(0, 10), minutes: Math.max(1, Math.round(durationSeconds / 60)), evidenceCount: 1 }],
    }));
    setPhase("saved");
    setMessage("حُفظت محاولة التقليد الصوتي محليًا. لا توجد درجة نطق آلية.");
  }

  function discard() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl("");
    setDurationSeconds(0);
    setPhase("idle");
    setMessage("");
  }

  if (!selected || !asset) return <div className="loading-state"><p>لا توجد ملفات صوت مولّدة متاحة بعد.</p></div>;

  return <div className="wide-page shadowing-page">
    <header className="page-heading">
      <div><span className="eyebrow"><Headphones size={15} /> مختبر التقليد الصوتي</span><h1>اسمع، جزّئ، ثم <em>قلّد الإيقاع.</em></h1><p>تدريب محلي على السماع والإنتاج. قارن بنفسك بين النموذج ومحاولتك؛ لا يدّعي التطبيق قياس النطق أو الطلاقة آليًا.</p></div>
      <div className="path-summary"><strong>{libraryAudioManifest.generatedAssetCount}</strong><span>ملف MP3 متاح<br />للتقليد دون TTS</span></div>
    </header>

    <div className="shadowing-layout">
      <aside className="shadowing-picker">
        <div className="shadowing-levels">{levels.map((item) => <button key={item} className={level === item ? "active" : ""} onClick={() => chooseLevel(item)}>{item === "all" ? "الكل" : item}</button>)}</div>
        <label>اختر مادة صوتية<select value={selected.id} onChange={(event) => chooseItem(event.target.value)}>{filtered.map((item) => <option key={item.id} value={item.id}>{item.level} · {item.titleDe}</option>)}</select></label>
        <div className="shadowing-meta"><span>{selected.level}</span><div><strong lang="de" dir="ltr">{selected.titleDe}</strong><small>{selected.titleAr} · {audioDurationLabel(asset.durationMs)}</small></div></div>
        <p>{selected.strategyAr}</p>
        <small>{attempts} محاولات محفوظة لهذه المادة</small>
      </aside>

      <section className="shadowing-workspace">
        <div className="shadowing-model">
          <header><div><Headphones size={18} /><span><strong>النموذج الاصطناعي</strong><small>متحدث واحد · غير امتحاني</small></span></div><code dir="ltr">{audioDurationLabel(asset.durationMs)}</code></header>
          <audio ref={modelAudioRef} controls preload="metadata" src={asset.path} aria-label={`نموذج ${selected.titleAr}`} />
          <div className="shadowing-rates"><Gauge size={15} /><span>السرعة</span>{[0.75, 1, 1.15].map((value) => <button key={value} className={rate === value ? "active" : ""} onClick={() => changeRate(value)}>{value}×</button>)}</div>
          <button className="transcript-toggle" onClick={() => setShowTranscript((value) => !value)}>{showTranscript ? <EyeOff size={15} /> : <Eye size={15} />}{showTranscript ? "إخفاء النص" : "إظهار النص بعد المحاولة"}</button>
          {showTranscript && <article className="shadowing-transcript" lang="de" dir="ltr">{selected.transcriptDe}</article>}
        </div>

        <div className="shadowing-recorder">
          <header><Mic2 size={19} /><div><strong>محاولتك</strong><small>سجّل طرفك فقط واستمع قبل الحفظ</small></div></header>
          {phase === "idle" && <button className="primary-button" onClick={() => void startRecording()}><Mic2 size={16} /> ابدأ التسجيل</button>}
          {phase === "recording" && <button className="shadowing-stop" onClick={stopRecording}><Square size={15} /> أوقف التسجيل</button>}
          {(phase === "recorded" || phase === "saved") && <>
            <audio controls src={recordedUrl} className="audio-player" aria-label="تشغيل محاولة التقليد" />
            <div className="shadowing-duration"><span>مدة النموذج <b>{audioDurationLabel(asset.durationMs)}</b></span><span>مدة محاولتك <b>{audioDurationLabel(durationSeconds * 1000)}</b></span></div>
            <label>تقييم ذاتي من 5<div className="score-buttons">{[1, 2, 3, 4, 5].map((score) => <button key={score} className={selfScore === score ? "active" : ""} onClick={() => setSelfScore(score)}>{score}</button>)}</div></label>
            <label>ملاحظة قصيرة<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="الإيقاع، موضع التوقف، أو صوت يحتاج إعادة…" /></label>
            <div className="shadowing-actions"><button className="primary-button" disabled={phase === "saved"} onClick={() => void saveAttempt()}><Save size={15} /> {phase === "saved" ? "تم الحفظ" : "حفظ المحاولة"}</button>{phase !== "saved" && <button className="secondary-button" onClick={discard}><Trash2 size={15} /> حذف وإعادة</button>}</div>
          </>}
          {message && <div className="exam-integrity-note"><CircleAlert size={16} /><p>{message}</p></div>}
          <div className="shadowing-checks"><span><Check size={13} /> استمع بلا نص أولًا</span><span><Check size={13} /> أعد جملة قصيرة</span><span><Check size={13} /> قارن الإيقاع لا الصوت فقط</span></div>
        </div>
      </section>
    </div>
  </div>;
}
