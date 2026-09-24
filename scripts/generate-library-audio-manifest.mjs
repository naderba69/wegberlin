import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = [
  "lib-l-a1-01", "lib-l-a1-02",
  "lib-l-a2-01", "lib-l-a2-02", "lib-l-a2-03",
  "lib-l-b1-01", "lib-l-b1-02", "lib-l-b1-03",
  "lib-l-b2-01", "lib-l-b2-02",
  "lib-l-a1-03", "lib-l-a1-04",
  "lib-l-a2-04", "lib-l-a2-05", "lib-l-a2-06",
  "lib-l-b1-04", "lib-l-b1-05", "lib-l-b1-06",
  "lib-l-b2-03", "lib-l-b2-04",
  "lib-l-a1-05", "lib-l-a1-06",
  "lib-l-a2-07", "lib-l-a2-08", "lib-l-a2-09",
  "lib-l-b1-07", "lib-l-b1-08", "lib-l-b1-09",
  "lib-l-b2-05", "lib-l-b2-06",
  "lib-l-a1-07", "lib-l-a1-08",
  "lib-l-a2-10", "lib-l-a2-11", "lib-l-a2-12",
  "lib-l-b1-10", "lib-l-b1-11", "lib-l-b1-12",
  "lib-l-b2-07", "lib-l-b2-08",
  "lib-l-a1-09", "lib-l-a1-10",
  "lib-l-a2-13", "lib-l-a2-14", "lib-l-a2-15",
  "lib-l-b1-13", "lib-l-b1-14", "lib-l-b1-15",
  "lib-l-b2-09", "lib-l-b2-10",
  "lib-l-a1-11", "lib-l-a1-12",
  "lib-l-a2-16", "lib-l-a2-17", "lib-l-a2-18",
  "lib-l-b1-16", "lib-l-b1-17", "lib-l-b1-18",
  "lib-l-b2-11", "lib-l-b2-12",
  "lib-l-a1-13", "lib-l-a1-14",
  "lib-l-a2-19", "lib-l-a2-20", "lib-l-a2-21",
  "lib-l-b1-19", "lib-l-b1-20", "lib-l-b1-21",
  "lib-l-b2-13", "lib-l-b2-14",
  "lib-l-a1-15", "lib-l-a1-16",
  "lib-l-a2-22", "lib-l-a2-23", "lib-l-a2-24",
  "lib-l-b1-22", "lib-l-b1-23", "lib-l-b1-24",
  "lib-l-b2-15", "lib-l-b2-16",
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
for (const itemId of ids) {
  const relativePath = `/audio/library/${itemId}.mp3`;
  const absolutePath = resolve(root, `public${relativePath}`);
  const bytes = await readFile(absolutePath);
  assets.push({
    itemId,
    path: relativePath,
    format: "audio/mpeg",
    language: "de-DE",
    durationMs: mp3DurationMs(bytes),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    speakerCount: 1,
    voiceProfile: "german-educational-feminine-01",
    synthesisProvider: "Arena.ai speech synthesis",
    generatedAt: "2026-08-30",
    sourceContent: "original-project-transcript",
    rightsStatus: "generated-for-project-review-required",
    examGrade: false,
  });
}

const manifest = {
  format: "dwnb-library-audio",
  version: 1,
  generatedAssetCount: assets.length,
  humanRecordedAssetCount: 0,
  spokenNormalizationNoteAr: "قد تُكتب الأرقام والكميات بصيغة منطوقة قبل التوليد لتحسين النطق، دون تغيير المعلومة التعليمية المقصودة.",
  usageNoteAr: "صوت اصطناعي مولد خصيصًا من نصوص المشروع الأصلية، وليس تسجيلًا بشريًا أو صوت امتحان رسمي. لا يحتوي على صوت منسوخ من مواد Goethe أو telc أو Hueber. يجب مراجعة شروط استخدام مزود التوليد قبل أي توزيع تجاري.",
  assets,
};
await writeFile(resolve(root, "public/audio/library/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated metadata for ${assets.length} library audio assets.`);
