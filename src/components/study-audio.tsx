"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Gauge } from "lucide-react";
import { DEFAULT_STUDY_SPEED, STUDY_SPEEDS, applyStudySpeed, getStudySpeed, setStudySpeed, subscribeStudySpeed, studySpeedLabel } from "@/core/audio/study-speed";

/**
 * P0-135: مشغّل استماع واحد يُستخدم في كل الأسطح، وحيد المصدر للسرعة.
 * - `playbackRate` يُثبَّت عند تحميل البيانات وعند كل تشغيل: بعض المتصفحات
 *   تُعيده إلى 1 عند تغيّر المصدر.
 * - الخيار محفوظ على الجهاز ومشترك بين المشغلات: اختيار واحد لا يُعاد في كل درس.
 */

export function useStudySpeed() {
  return useSyncExternalStore(subscribeStudySpeed, getStudySpeed, () => DEFAULT_STUDY_SPEED);
}

export function StudySpeedControl({ idPrefix }: { idPrefix: string }) {
  const speed = useStudySpeed();
  return (
    <div className="study-speed" role="group" aria-label="سرعة الاستماع">
      <span>
        <Gauge size={14} /> السرعة
      </span>
      {STUDY_SPEEDS.map((value) => (
        <button
          key={value}
          type="button"
          id={`${idPrefix}-speed-${String(value).replace(".", "-")}`}
          data-speed={value}
          className={speed === value ? "active" : ""}
          aria-pressed={speed === value}
          onClick={() => setStudySpeed(value)}
        >
          {studySpeedLabel(value)}
        </button>
      ))}
      <small>1× هي سرعة الامتحان</small>
    </div>
  );
}

/** بديل `<audio controls>` في أسطح الاستماع: نفس العنصر + تحكّم بالسرعة. */
export function StudyAudio({
  src,
  label,
  idPrefix,
  preload = "metadata",
  onEnded,
}: {
  src: string;
  label: string;
  idPrefix: string;
  preload?: "metadata" | "auto" | "none";
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const speed = useStudySpeed();

  const apply = useCallback(() => {
    applyStudySpeed(audioRef.current, speed);
  }, [speed]);

  useEffect(apply, [apply]);

  return (
    <div className="study-audio" data-study-speed={speed}>
      <audio
        ref={audioRef}
        controls
        preload={preload}
        src={src}
        aria-label={label}
        onLoadedMetadata={apply}
        onPlay={apply}
        onRateChange={(event) => {
          // إن أعاد المتصفح المعدّل إلى 1 من تلقاء نفسه نُعيد إثبات اختيار المتعلّم.
          const element = event.currentTarget;
          if (element.playbackRate !== speed) applyStudySpeed(element, speed);
        }}
        onEnded={onEnded}
      />
      <StudySpeedControl idPrefix={idPrefix} />
    </div>
  );
}
