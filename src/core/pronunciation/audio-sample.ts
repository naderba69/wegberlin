import { localPronunciationModelRegistry } from "@/config/local-pronunciation-model-registry";

export function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) throw new Error("معدل عينة الصوت غير صالح.");
  if (input.length === 0 || fromRate === toRate) return input.slice();
  const outputLength = Math.max(1, Math.round(input.length * toRate / fromRate));
  const output = new Float32Array(outputLength);
  const ratio = fromRate / toRate;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.min(input.length - 1, Math.floor(position));
    const right = Math.min(input.length - 1, left + 1);
    const fraction = position - left;
    output[index] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const output = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    for (let index = 0; index < output.length; index += 1) output[index] += source[index] / buffer.numberOfChannels;
  }
  return output;
}

export async function decodeRecordingToLocalSample(blob: Blob): Promise<Float32Array> {
  if (!blob.size) throw new Error("التسجيل فارغ؛ سجّل العبارة مرة أخرى.");
  const Context = window.AudioContext;
  if (!Context) throw new Error("هذا المتصفح لا يستطيع فك التسجيل محليًا للتحليل.");
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const seconds = decoded.length / decoded.sampleRate;
    if (seconds < localPronunciationModelRegistry.minimumAudioSeconds) throw new Error("التسجيل قصير جدًا للتحليل المحلي.");
    if (seconds > localPronunciationModelRegistry.maximumAudioSeconds) throw new Error(`حلّل مقطعًا لا يتجاوز ${localPronunciationModelRegistry.maximumAudioSeconds} ثانية.`);
    return resampleLinear(mixToMono(decoded), decoded.sampleRate, localPronunciationModelRegistry.sampleRateHz);
  } catch (error) {
    if (error instanceof Error && /التسجيل|حلّل|معدل/u.test(error.message)) throw error;
    throw new Error("تعذر فك صيغة التسجيل محليًا. جرّب تسجيلًا جديدًا أو متصفحًا آخر.");
  } finally {
    await context.close().catch(() => undefined);
  }
}
