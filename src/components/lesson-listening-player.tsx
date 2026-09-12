"use client";

import { useRef, useState } from "react";
import { Headphones, Play, ShieldCheck, Volume2 } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import { lessonAudioAssetByLessonId, lessonAudioManifest } from "@/data/lesson-audio-assets";
import { audioDurationLabel } from "@/data/library-audio-assets";
import { AudioSpeedControl } from "./audio-speed-control";
import { applyLearningPlaybackRate, ttsRateForPlayback, type LearningPlaybackRate } from "@/core/audio/playback-speed";
import { emitListeningUsage } from "@/core/listening/usage-evidence";

export function LessonListeningPlayer({ lesson, speechStatus, onBrowserTts, onPlaybackStart }: { lesson: FullLesson; speechStatus: string; onBrowserTts: (rate: number) => void; onPlaybackStart: () => void }) {
  const asset = lessonAudioAssetByLessonId[lesson.id];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState<LearningPlaybackRate>(1);

  function changeRate(next: LearningPlaybackRate) {
    setRate(next);
    if (audioRef.current) applyLearningPlaybackRate(audioRef.current, next);
  }

  function prepareAudio() {
    if (audioRef.current) applyLearningPlaybackRate(audioRef.current, rate);
  }

  return <div className="listening-player lesson-listening-player">
    <span><Headphones size={27}/></span>
    <small lang="de" dir="ltr">{lesson.listening.titleDe}</small>
    <h2>{lesson.listening.titleAr}</h2>
    <p>{lesson.listening.strategyAr}</p>
    {asset ? <>
      <div className="lesson-audio-status"><ShieldCheck size={14}/><span>ملف MP3 مولّد للمشروع · {audioDurationLabel(asset.durationMs)} · متحدث واحد · غير امتحاني</span></div>
      <audio ref={audioRef} controls preload="metadata" src={asset.path} aria-label={`استماع درس ${lesson.titleAr}`} data-listening-surface="lesson" data-listening-content-id={lesson.id} onLoadedMetadata={prepareAudio} onPlay={onPlaybackStart}/>
      <AudioSpeedControl rate={rate} onChange={changeRate} label="سرعة مشغل استماع الدرس"/>
      <div className="lesson-audio-actions"><button onClick={() => { onPlaybackStart(); emitListeningUsage({surface:"lesson",contentId:lesson.id,event:"playback",playbackSource:"browser-tts"}); onBrowserTts(ttsRateForPlayback(rate)); }}><Volume2 size={15}/> بديل Browser TTS</button><details><summary>المصدر وSHA-256</summary><p>{lessonAudioManifest.usageNoteAr}</p><code dir="ltr" data-bidi-scope="technical">{asset.sha256}</code></details></div>
    </> : <><AudioSpeedControl rate={rate} onChange={changeRate} label="سرعة مشغل استماع الدرس"/><button onClick={() => { onPlaybackStart(); emitListeningUsage({surface:"lesson",contentId:lesson.id,event:"playback",playbackSource:"browser-tts"}); onBrowserTts(ttsRateForPlayback(rate)); }}><Play size={18}/> تشغيل بصوت المتصفح</button></>}
    {speechStatus&&<i>{speechStatus}</i>}
  </div>;
}
