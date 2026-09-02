"use client";

import { Headphones, Play, ShieldCheck, Volume2 } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import { lessonAudioAssetByLessonId, lessonAudioManifest } from "@/data/lesson-audio-assets";
import { audioDurationLabel } from "@/data/library-audio-assets";

export function LessonListeningPlayer({ lesson, speechStatus, onBrowserTts }: { lesson: FullLesson; speechStatus: string; onBrowserTts: () => void }) {
  const asset = lessonAudioAssetByLessonId[lesson.id];
  return <div className="listening-player lesson-listening-player">
    <span><Headphones size={27}/></span>
    <small lang="de" dir="ltr">{lesson.listening.titleDe}</small>
    <h2>{lesson.listening.titleAr}</h2>
    <p>{lesson.listening.strategyAr}</p>
    {asset ? <>
      <div className="lesson-audio-status"><ShieldCheck size={14}/><span>ملف MP3 مولّد للمشروع · {audioDurationLabel(asset.durationMs)} · متحدث واحد · غير امتحاني</span></div>
      <audio controls preload="metadata" src={asset.path} aria-label={`استماع درس ${lesson.titleAr}`}/>
      <div className="lesson-audio-actions"><button onClick={onBrowserTts}><Volume2 size={15}/> بديل Browser TTS</button><details><summary>المصدر وSHA-256</summary><p>{lessonAudioManifest.usageNoteAr}</p><code dir="ltr">{asset.sha256}</code></details></div>
    </> : <button onClick={onBrowserTts}><Play size={18}/> تشغيل بصوت المتصفح</button>}
    {speechStatus&&<i>{speechStatus}</i>}
  </div>;
}
