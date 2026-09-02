import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = [
  ...Array.from({ length: 24 }, (_, index) => `a1-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 24 }, (_, index) => `a2-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 24 }, (_, index) => `b1-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 12 }, (_, index) => `b2-${String(index + 1).padStart(2, "0")}`),
];

function mp3DurationMs(bytes) {
  let offset = 0;
  if (bytes.subarray(0, 3).toString("ascii") === "ID3" && bytes.length >= 10) {
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    offset = 10 + size;
  }
  const mpeg1Bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const mpeg2Bitrates = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const baseSampleRates = [44100, 48000, 32000];
  let samples = 0;
  let sampleRate = 0;
  let frames = 0;
  while (offset + 4 <= bytes.length) {
    const header = bytes.readUInt32BE(offset);
    if ((header & 0xffe00000) !== (0xffe00000 | 0)) { offset += 1; continue; }
    const versionBits = (header >>> 19) & 0b11;
    const layerBits = (header >>> 17) & 0b11;
    const bitrateIndex = (header >>> 12) & 0b1111;
    const sampleRateIndex = (header >>> 10) & 0b11;
    const padding = (header >>> 9) & 1;
    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) { offset += 1; continue; }
    const isMpeg1 = versionBits === 3;
    const bitrate = (isMpeg1 ? mpeg1Bitrates : mpeg2Bitrates)[bitrateIndex];
    sampleRate = baseSampleRates[sampleRateIndex] / (versionBits === 2 ? 2 : versionBits === 0 ? 4 : 1);
    const frameLength = Math.floor((isMpeg1 ? 144000 : 72000) * bitrate / sampleRate) + padding;
    if (frameLength <= 4 || offset + frameLength > bytes.length) break;
    samples += isMpeg1 ? 1152 : 576;
    frames += 1;
    offset += frameLength;
  }
  if (!frames || !sampleRate) throw new Error("Could not parse MP3 duration.");
  return Math.round(samples / sampleRate * 1000);
}

const assets = [];
for (const lessonId of ids) {
  const path = `/audio/lessons/${lessonId}.mp3`;
  const bytes = await readFile(resolve(root, `public${path}`));
  assets.push({
    lessonId,
    path,
    format: "audio/mpeg",
    language: "de-DE",
    durationMs: mp3DurationMs(bytes),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    speakerCount: 1,
    voiceProfile: "german-educational-feminine-01",
    synthesisProvider: "Arena.ai speech synthesis",
    generatedAt: "2026-08-30",
    sourceContent: "original-lesson-listening-transcript",
    rightsStatus: "generated-for-project-review-required",
    examGrade: false,
  });
}

const manifest = {
  format: "dwnb-lesson-audio",
  version: 1,
  generatedAssetCount: assets.length,
  totalLessonCount: 84,
  humanRecordedAssetCount: 0,
  usageNoteAr: "صوت اصطناعي أحادي المتحدث مولد من نصوص الدروس الأصلية. ليس تسجيلًا بشريًا أو امتحانيًا، ويحتاج مراجعة ناطق ألماني وشروط التوزيع قبل استعمال تجاري.",
  assets,
};
await writeFile(resolve(root, "public/audio/lessons/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated metadata for ${assets.length} lesson audio assets.`);
