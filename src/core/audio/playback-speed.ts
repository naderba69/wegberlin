export const LEARNING_PLAYBACK_SPEED_POLICY = "learning-playback-speed-v1" as const;
export const LEARNING_PLAYBACK_RATES = [0.75, 1, 1.15] as const;
export type LearningPlaybackRate = (typeof LEARNING_PLAYBACK_RATES)[number];

export function isLearningPlaybackRate(value: number): value is LearningPlaybackRate {
  return LEARNING_PLAYBACK_RATES.includes(value as LearningPlaybackRate);
}

export function applyLearningPlaybackRate(audio: HTMLAudioElement, rate: LearningPlaybackRate) {
  audio.preservesPitch = true;
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
}

export function ttsRateForPlayback(rate: LearningPlaybackRate): number {
  return rate;
}

export function effectiveExamPlaybackRate(selected: LearningPlaybackRate, continuousTimed: boolean): LearningPlaybackRate {
  return continuousTimed ? 1 : selected;
}
