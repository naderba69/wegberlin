import { readFileSync } from "node:fs";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AudioSpeedControl } from "@/components/audio-speed-control";
import {
  applyLearningPlaybackRate,
  effectiveExamPlaybackRate,
  isLearningPlaybackRate,
  LEARNING_PLAYBACK_RATES,
  LEARNING_PLAYBACK_SPEED_POLICY,
  ttsRateForPlayback,
  type LearningPlaybackRate,
} from "@/core/audio/playback-speed";

describe("P0 educational listening speed", () => {
  it("defines one bounded three-rate policy", () => {
    expect(LEARNING_PLAYBACK_SPEED_POLICY).toBe("learning-playback-speed-v1");
    expect(LEARNING_PLAYBACK_RATES).toEqual([0.75, 1, 1.15]);
    expect(LEARNING_PLAYBACK_RATES.every(isLearningPlaybackRate)).toBe(true);
    expect(isLearningPlaybackRate(0.5)).toBe(false);
    expect(isLearningPlaybackRate(1.5)).toBe(false);
  });

  it("applies the selected rate while requesting pitch preservation", () => {
    const audio = { playbackRate: 1, defaultPlaybackRate: 1, preservesPitch: false } as HTMLAudioElement;
    applyLearningPlaybackRate(audio, 0.75);
    expect(audio).toMatchObject({ playbackRate:0.75,defaultPlaybackRate:0.75,preservesPitch:true });
  });

  it("keeps browser TTS transparent and locks continuous exam rehearsal to natural speed", () => {
    expect(LEARNING_PLAYBACK_RATES.map(ttsRateForPlayback)).toEqual([0.75, 1, 1.15]);
    expect(effectiveExamPlaybackRate(0.75, false)).toBe(0.75);
    expect(effectiveExamPlaybackRate(1.15, false)).toBe(1.15);
    expect(effectiveExamPlaybackRate(0.75, true)).toBe(1);
  });

  it("renders accessible pressed states and reports a learner speed choice", () => {
    let selected: LearningPlaybackRate = 1;
    const { container } = render(createElement(AudioSpeedControl, { rate:1,onChange:(rate) => { selected = rate; },label:"سرعة الاختبار" }));
    expect(container.querySelector('[data-speed-policy="learning-playback-speed-v1"]')).toBeTruthy();
    expect(screen.getByRole("group", { name:"سرعة الاختبار" })).toBeTruthy();
    expect(screen.getByRole("button", { name:"1×" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name:"0.75×" }));
    expect(selected).toBe(0.75);
  });

  it("disables speed changes and explains the fixed rate in continuous timed mode", () => {
    const { container } = render(createElement(AudioSpeedControl, { rate:1,onChange:() => undefined,locked:true }));
    for (const button of container.querySelectorAll("button")) expect(button.disabled).toBe(true);
    expect(screen.getByText(/البروفة الزمنية المتصلة ثابتة/)).toBeTruthy();
  });

  it("is adopted by every authored listening surface while leaving learner recordings alone", () => {
    const consumers = [
      "src/components/resilient-audio-player.tsx",
      "src/components/lesson-listening-player.tsx",
      "src/components/library-audio-player.tsx",
      "src/components/targeted-listening-simulation.tsx",
      "src/components/shadowing-studio.tsx",
    ];
    for (const file of consumers) expect(readFileSync(file, "utf8"), file).toContain("AudioSpeedControl");
    const exam = readFileSync("src/components/targeted-listening-simulation.tsx", "utf8");
    expect(exam).toContain("locked={continuous}");
    expect(exam).toContain("effectiveExamPlaybackRate");
    expect(readFileSync("src/components/speaking-lab.tsx", "utf8")).not.toContain("AudioSpeedControl");
    expect(readFileSync("src/components/diagnostic-productive-sample.tsx", "utf8")).not.toContain("AudioSpeedControl");
  });
});
