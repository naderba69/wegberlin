"use client";

import { useRef, useState } from "react";
import { Headphones, Play, ShieldCheck, Volume2 } from "lucide-react";
import type { ListeningLibraryItem } from "@/types/library";
import { audioDurationLabel, libraryAudioAssetByItemId, libraryAudioManifest } from "@/data/library-audio-assets";
import { AudioSpeedControl } from "./audio-speed-control";
import { applyLearningPlaybackRate, ttsRateForPlayback, type LearningPlaybackRate } from "@/core/audio/playback-speed";
import { emitListeningUsage } from "@/core/listening/usage-evidence";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { useLearning } from "./learning-provider";

export function LibraryAudioPlayer({ item }: { item: ListeningLibraryItem }) {
  const {state}=useLearning();
  const asset = libraryAudioAssetByItemId[item.id];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState<LearningPlaybackRate>(1);

  function changeRate(next: LearningPlaybackRate) {
    setRate(next);
    if (audioRef.current) applyLearningPlaybackRate(audioRef.current, next);
  }

  function browserSpeech() {
    if (!("speechSynthesis" in window)) return;
    emitListeningUsage({surface:"library",contentId:item.id,event:"playback",playbackSource:"browser-tts"});
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(new SpeechSynthesisUtterance(item.transcriptDe),state.speechPreferences,window.speechSynthesis.getVoices());
    utterance.lang = "de-DE";
    utterance.rate = ttsRateForPlayback(rate);
    window.speechSynthesis.speak(utterance);
  }

  if (!asset) {
    return <div className="library-listen">
      <button onClick={browserSpeech}><Play size={17} /> تشغيل بصوت المتصفح</button>
      <span>{item.strategyAr}</span>
      <AudioSpeedControl rate={rate} onChange={changeRate} label={`سرعة ${item.titleAr}`}/>
    </div>;
  }

  return <div className="library-generated-audio">
    <header>
      <span><Headphones size={18} /></span>
      <div><strong>ملف صوت اصطناعي مولّد للمشروع</strong><small>{audioDurationLabel(asset.durationMs)} · متحدث واحد · {asset.language}</small></div>
      <i>ليس صوت امتحان</i>
    </header>
    <audio ref={audioRef} controls preload="metadata" src={asset.path} aria-label={`تشغيل ${item.titleAr}`} data-listening-surface="library" data-listening-content-id={item.id} onLoadedMetadata={() => audioRef.current && applyLearningPlaybackRate(audioRef.current, rate)}/>
    <AudioSpeedControl rate={rate} onChange={changeRate} label={`سرعة ${item.titleAr}`}/>
    <p>{item.strategyAr}</p>
    <footer>
      <button onClick={browserSpeech}><Volume2 size={14} /> بديل Browser TTS</button>
      <details><summary><ShieldCheck size={13} /> مصدر وحقوق الاستخدام</summary><p>{libraryAudioManifest.usageNoteAr}</p><p>{libraryAudioManifest.spokenNormalizationNoteAr}</p><code dir="ltr" data-bidi-scope="technical">SHA-256: {asset.sha256}</code></details>
    </footer>
  </div>;
}
