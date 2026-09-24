import { Gauge } from "lucide-react";
import { LEARNING_PLAYBACK_RATES, LEARNING_PLAYBACK_SPEED_POLICY, type LearningPlaybackRate } from "@/core/audio/playback-speed";

export function AudioSpeedControl({ rate, onChange, locked = false, label = "سرعة الاستماع التعليمية" }: {
  rate: LearningPlaybackRate;
  onChange: (rate: LearningPlaybackRate) => void;
  locked?: boolean;
  label?: string;
}) {
  return <div className={`audio-speed-control${locked ? " locked" : ""}`} data-speed-policy={LEARNING_PLAYBACK_SPEED_POLICY} data-playback-rate={rate}>
    <Gauge size={15} aria-hidden="true"/>
    <span>سرعة الاستماع</span>
    <div role="group" aria-label={label}>{LEARNING_PLAYBACK_RATES.map((value) => <button type="button" key={value} aria-pressed={rate === value} className={rate === value ? "active" : ""} disabled={locked} onClick={() => onChange(value)}>{value}×</button>)}</div>
    {locked && <small>البروفة الزمنية المتصلة ثابتة على السرعة الطبيعية.</small>}
  </div>;
}
