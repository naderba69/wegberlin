"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw, Volume2 } from "lucide-react";
import { AudioSpeedControl } from "./audio-speed-control";
import { applyLearningPlaybackRate, ttsRateForPlayback, type LearningPlaybackRate } from "@/core/audio/playback-speed";
import { emitListeningUsage } from "@/core/listening/usage-evidence";
import type { ListeningUsageSurface } from "@/types/learning";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { useLearning } from "./learning-provider";

function durationLabel(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ResilientAudioPlayer({ src, transcriptDe, expectedDurationMs, label, listeningSurface, listeningContentId }: {
  src: string;
  transcriptDe: string;
  expectedDurationMs: number;
  label: string;
  listeningSurface: Extract<ListeningUsageSurface,"onboarding"|"diagnostic">;
  listeningContentId:string;
}) {
  const {state}=useLearning();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed" | "tts">("loading");
  const [rate, setRate] = useState<LearningPlaybackRate>(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio || audio.readyState === 0 || !Number.isFinite(audio.duration) || audio.duration <= 0) setStatus("failed");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [src]);

  function confirmMetadata() {
    const audio = audioRef.current;
    const duration = audio?.duration ?? 0;
    if (audio) applyLearningPlaybackRate(audio, rate);
    setStatus(Number.isFinite(duration) && duration > 0 ? "ready" : "failed");
  }

  function changeRate(next: LearningPlaybackRate) {
    setRate(next);
    if (audioRef.current) applyLearningPlaybackRate(audioRef.current, next);
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
    emitListeningUsage({surface:listeningSurface,contentId:listeningContentId,event:"playback",playbackSource:"browser-tts"});
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(new SpeechSynthesisUtterance(transcriptDe),state.speechPreferences,window.speechSynthesis.getVoices());
    utterance.lang = "de-DE";
    utterance.rate = ttsRateForPlayback(rate);
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
      data-listening-surface={listeningSurface}
      data-listening-content-id={listeningContentId}
      onLoadStart={() => setStatus("loading")}
      onLoadedMetadata={confirmMetadata}
      onCanPlay={confirmMetadata}
      onError={() => setStatus("failed")}
    />
    <AudioSpeedControl rate={rate} onChange={changeRate} label="سرعة مشغل الفحص والتشخيص"/>
    <div role="status" aria-live="polite"><span>{statusText}</span><div><button type="button" onClick={playBrowserTts}><Volume2 size={14}/> تشغيل صوت المتصفح البديل</button>{status === "failed" && <button type="button" onClick={retry}><RefreshCcw size={14}/> إعادة تحميل MP3</button>}</div></div>
  </div>;
}
