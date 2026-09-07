import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_STUDY_SPEED,
  STUDY_SPEEDS,
  STUDY_SPEED_STORAGE_KEY,
  applyStudySpeed,
  clampStudySpeed,
  getStudySpeed,
  setStudySpeed,
  studySpeedLabel,
  subscribeStudySpeed,
  ttsRateFor,
} from "@/core/audio/study-speed";

describe("P0-135: controlled study speeds are one shared, clamped setting", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setStudySpeed(DEFAULT_STUDY_SPEED);
  });

  it("offers exactly the three declared speeds and nothing else", () => {
    expect(STUDY_SPEEDS).toEqual([0.75, 1, 1.15]);
    expect(studySpeedLabel(0.75)).toBe("0.75×");
    expect(studySpeedLabel(1)).toBe("1×");
    expect(studySpeedLabel(1.15)).toBe("1.15×");
  });

  it("rejects arbitrary rates and falls back to the exam speed, not to the nearest", () => {
    // 0.5 و2 ليستا من القيم المعلنة: تغيير الإيقاع أداة فهم لا لعب في التشغيل.
    for (const value of [0.5, 2, 1.07, 0, -1, Number.NaN, "1.15", null, undefined, {}]) {
      expect(clampStudySpeed(value)).toBe(1);
    }
    for (const value of STUDY_SPEEDS) expect(clampStudySpeed(value)).toBe(value);
  });

  it("persists the choice and notifies every subscriber once", () => {
    const seen: number[] = [];
    const unsubscribe = subscribeStudySpeed(() => seen.push(getStudySpeed()));
    setStudySpeed(0.75);
    expect(window.localStorage.getItem(STUDY_SPEED_STORAGE_KEY)).toBe("0.75");
    expect(seen).toEqual([0.75]);
    setStudySpeed(0.75); // لا إشعار بلا تغيير
    expect(seen).toEqual([0.75]);
    unsubscribe();
    setStudySpeed(1.15);
    expect(seen).toEqual([0.75]);
    expect(getStudySpeed()).toBe(1.15);
  });

  it("applies the rate to the audio element and reports whether it stuck", () => {
    const audio = document.createElement("audio");
    expect(applyStudySpeed(audio, 0.75)).toBe(true);
    expect(audio.playbackRate).toBe(0.75);
    // defaultPlaybackRate يُثبَّت لأن بعض المتصفحات تُعيد المعدّل عند تغيّر المصدر.
    expect(audio.defaultPlaybackRate).toBe(0.75);
    expect(applyStudySpeed(null, 1.15)).toBe(false);
  });

  it("composes the browser speech rate inside the safe range", () => {
    expect(ttsRateFor(0.92, 1)).toBeCloseTo(0.92, 3);
    expect(ttsRateFor(0.92, 0.75)).toBeCloseTo(0.69, 3);
    expect(ttsRateFor(0.92, 1.15)).toBeCloseTo(1.058, 3);
    expect(ttsRateFor(0.1, 0.75)).toBeGreaterThanOrEqual(0.1);
    expect(ttsRateFor(10, 1.15)).toBeLessThanOrEqual(10);
  });
});
