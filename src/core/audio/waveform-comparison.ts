import { waveformEnvelope } from "@/core/pronunciation/microphone-signal";

export const EDUCATIONAL_WAVEFORM_COMPARISON_POLICY =
  "neutral-self-waveform-comparison-v1" as const;
export const EDUCATIONAL_WAVEFORM_BAR_COUNT = 48;
export const EDUCATIONAL_WAVEFORM_MAX_AUDIO_SECONDS = 60;
export const EDUCATIONAL_WAVEFORM_MAX_COMPRESSED_BYTES = 4_000_000;

export function isEducationalWaveformCompressedFileWithinLimit(byteSize: number): boolean {
  return Number.isSafeInteger(byteSize) && byteSize > 0 && byteSize <= EDUCATIONAL_WAVEFORM_MAX_COMPRESSED_BYTES;
}

export type EducationalWaveformTrace = {
  durationSeconds: number;
  envelope: number[];
  scale: "independent-peak-normalization";
};

export type EducationalWaveformComparison = {
  policyVersion: typeof EDUCATIONAL_WAVEFORM_COMPARISON_POLICY;
  reference: EducationalWaveformTrace;
  learner: EducationalWaveformTrace;
  evidenceBoundary: "visual-amplitude-envelope-only-no-time-alignment-similarity-pronunciation-or-quality-score";
};

export function extractAudioBufferWaveformInput(
  buffer: Pick<AudioBuffer, "duration" | "length" | "numberOfChannels" | "getChannelData">,
): { samples: Float32Array; sampleRate: number } {
  if (
    !Number.isFinite(buffer.duration) ||
    buffer.duration <= 0 ||
    buffer.length <= 0 ||
    buffer.numberOfChannels <= 0
  ) {
    throw new Error("تعذر قراءة مدة المقطع الصوتي.");
  }
  if (buffer.duration > EDUCATIONAL_WAVEFORM_MAX_AUDIO_SECONDS) {
    throw new Error(`اعرض مقطعًا لا يتجاوز ${EDUCATIONAL_WAVEFORM_MAX_AUDIO_SECONDS} ثانية.`);
  }

  const peaks = new Float32Array(EDUCATIONAL_WAVEFORM_BAR_COUNT);
  for (let bar = 0; bar < EDUCATIONAL_WAVEFORM_BAR_COUNT; bar += 1) {
    const start = Math.floor((bar * buffer.length) / EDUCATIONAL_WAVEFORM_BAR_COUNT);
    const end = Math.max(
      start + 1,
      Math.floor(((bar + 1) * buffer.length) / EDUCATIONAL_WAVEFORM_BAR_COUNT),
    );
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      for (let index = start; index < Math.min(buffer.length, end); index += 1) {
        const value = channelData[index];
        if (Number.isFinite(value)) peak = Math.max(peak, Math.abs(value));
      }
    }
    peaks[bar] = peak;
  }
  return {
    samples: peaks,
    sampleRate: EDUCATIONAL_WAVEFORM_BAR_COUNT / buffer.duration,
  };
}

function buildTrace(samples: Float32Array, sampleRate: number): EducationalWaveformTrace {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length === 0) {
    throw new Error("عينة الصوت غير صالحة لعرض الموجة.");
  }
  const duration = samples.length / sampleRate;
  if (duration > EDUCATIONAL_WAVEFORM_MAX_AUDIO_SECONDS) {
    throw new Error(`اعرض مقطعًا لا يتجاوز ${EDUCATIONAL_WAVEFORM_MAX_AUDIO_SECONDS} ثانية.`);
  }

  const rawEnvelope = waveformEnvelope(samples, EDUCATIONAL_WAVEFORM_BAR_COUNT);
  const peak = Math.max(...rawEnvelope);
  const envelope = peak > 0
    ? rawEnvelope.map((value) => Number((value / peak).toFixed(4)))
    : rawEnvelope;

  return {
    durationSeconds: Number(duration.toFixed(1)),
    envelope,
    scale: "independent-peak-normalization",
  };
}

/**
 * Builds two unaligned amplitude outlines for private self-reflection only.
 * Each clip is scaled to its own peak so microphone gain is never compared.
 */
export function buildEducationalWaveformComparison(input: {
  reference: { samples: Float32Array; sampleRate: number };
  learner: { samples: Float32Array; sampleRate: number };
}): EducationalWaveformComparison {
  return {
    policyVersion: EDUCATIONAL_WAVEFORM_COMPARISON_POLICY,
    reference: buildTrace(input.reference.samples, input.reference.sampleRate),
    learner: buildTrace(input.learner.samples, input.learner.sampleRate),
    evidenceBoundary:
      "visual-amplitude-envelope-only-no-time-alignment-similarity-pronunciation-or-quality-score",
  };
}
