"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw, Volume2 } from "lucide-react";
import { StudySpeedControl, useStudySpeed } from "./study-audio";
import { applyStudySpeed, ttsRateFor } from "@/core/audio/study-speed";

function durationLabel(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ResilientAudioPlayer({ src, transcriptDe, expectedDurationMs, label }: {
  src: string;
  transcriptDe: string;
  expectedDurationMs: number;
  label: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // P0-135: سرعة الاستماع مصدرها واحد في كل المشغلات.
  const studySpeed = useStudySpeed();
  const [status, setStatus] = useState<"loading" | "ready" | "failed" | "tts">("loading");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio || audio.readyState === 0 || !Number.isFinite(audio.duration) || audio.duration <= 0) setStatus("failed");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [src]);

  function confirmMetadata() {
    applyStudySpeed(audioRef.current, studySpeed);
    const duration = audioRef.current?.duration ?? 0;
    setStatus(Number.isFinite(duration) && duration > 0 ? "ready" : "failed");
  }

  function retry() {
    setStatus("loading");
    audioRef.current?.load();
  }

  function playBrowserTts() {
    if (!("speechSynthesis" in window)) {
      setStatus("failed");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transcriptDe);
    utterance.lang = "de-DE";
    utterance.rate = ttsRateFor(0.9, studySpeed);
    utterance.onstart = () => setStatus("tts");
    utterance.onend = () => setStatus(audioRef.current && audioRef.current.readyState > 0 ? "ready" : "failed");
    window.speechSynthesis.speak(utterance);
  }

  const statusText = status === "ready"
    ? `MP3 جاهز · المدة المتوقعة ${durationLabel(expectedDurationMs)}`
    : status === "tts"
      ? "يعمل الآن صوت المتصفح البديل."
      : status === "failed"
        ? "تعذر تحميل MP3 على هذا الجهاز؛ استخدم صوت المتصفح البديل ولا تتوقف."
        : `جاري فحص MP3 · المدة المتوقعة ${durationLabel(expectedDurationMs)}`;

  return <div className={`resilient-audio ${status}`} data-audio-status={status}>
    <audio
      ref={audioRef}
      controls
      preload="auto"
      src={src}
      aria-label={label}
      onLoadStart={() => setStatus("loading")}
      onLoadedMetadata={confirmMetadata}
      onCanPlay={confirmMetadata}
      onPlay={() => applyStudySpeed(audioRef.current, studySpeed)}
      onError={() => setStatus("failed")}
    />
    <StudySpeedControl idPrefix={label} />
    <div role="status" aria-live="polite"><span>{statusText}</span><div><button type="button" onClick={playBrowserTts}><Volume2 size={14}/> تشغيل صوت المتصفح البديل</button>{status === "failed" && <button type="button" onClick={retry}><RefreshCcw size={14}/> إعادة تحميل MP3</button>}</div></div>
  </div>;
}
