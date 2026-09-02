"use client";

import { Headphones, Play, ShieldCheck, Volume2 } from "lucide-react";
import type { ListeningLibraryItem } from "@/types/library";
import { audioDurationLabel, libraryAudioAssetByItemId, libraryAudioManifest } from "@/data/library-audio-assets";

export function LibraryAudioPlayer({ item }: { item: ListeningLibraryItem }) {
  const asset = libraryAudioAssetByItemId[item.id];

  function browserSpeech() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.transcriptDe);
    utterance.lang = "de-DE";
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  if (!asset) {
    return <div className="library-listen">
      <button onClick={browserSpeech}><Play size={17} /> تشغيل بصوت المتصفح</button>
      <span>{item.strategyAr}</span>
    </div>;
  }

  return <div className="library-generated-audio">
    <header>
      <span><Headphones size={18} /></span>
      <div><strong>ملف صوت اصطناعي مولّد للمشروع</strong><small>{audioDurationLabel(asset.durationMs)} · متحدث واحد · {asset.language}</small></div>
      <i>ليس صوت امتحان</i>
    </header>
    <audio controls preload="metadata" src={asset.path} aria-label={`تشغيل ${item.titleAr}`} />
    <p>{item.strategyAr}</p>
    <footer>
      <button onClick={browserSpeech}><Volume2 size={14} /> بديل Browser TTS</button>
      <details><summary><ShieldCheck size={13} /> مصدر وحقوق الاستخدام</summary><p>{libraryAudioManifest.usageNoteAr}</p><p>{libraryAudioManifest.spokenNormalizationNoteAr}</p><code dir="ltr">SHA-256: {asset.sha256}</code></details>
    </footer>
  </div>;
}
