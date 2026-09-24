import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedClips = [
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `goethe-h1-clip-${index + 1}`,
    clipId: `goethe-h1-clip-${index + 1}`,
    taskId: "goethe-b2-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `telc-h3-clip-${index + 1}`,
    clipId: `telc-h3-clip-${index + 1}`,
    taskId: "telc-b2-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
  })),
  {
    fileId: "telc-h1-news",
    clipId: "telc-h1-news",
    taskId: "telc-b2-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
  },
  ...Array.from({ length: 2 }, (_, index) => ({
    fileId: `goethe-h2-museum-interview-seg-${index + 1}`,
    clipId: "goethe-h2-museum-interview",
    taskId: "goethe-b2-listening-02",
    provider: "goethe-b2",
    segmentIndex: index + 1,
    segmentCount: 2,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    fileId: `goethe-h3-garden-discussion-seg-${index + 1}`,
    clipId: "goethe-h3-garden-discussion",
    taskId: "goethe-b2-listening-03",
    provider: "goethe-b2",
    segmentIndex: index + 1,
    segmentCount: 2,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    fileId: `telc-h2-mobility-dialogue-seg-${index + 1}`,
    clipId: "telc-h2-mobility-dialogue",
    taskId: "telc-b2-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: index + 1,
    segmentCount: 2,
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    fileId: `goethe-h4-wayfinding-lecture-seg-${index + 1}`,
    clipId: "goethe-h4-wayfinding-lecture",
    taskId: "goethe-b2-listening-04",
    provider: "goethe-b2",
    segmentIndex: index + 1,
    segmentCount: 3,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `g2-h1-${index + 1}`,
    clipId: `g2-h1-${index + 1}`,
    taskId: "goethe-b2-full-02-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "g2-h2",
    clipId: "g2-h2",
    taskId: "goethe-b2-full-02-listening-02",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "g2-h3",
    clipId: "g2-h3",
    taskId: "goethe-b2-full-02-listening-03",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 2 }, (_, index) => ({
    fileId: `g2-h4-seg-${index + 1}`,
    clipId: "g2-h4",
    taskId: "goethe-b2-full-02-listening-04",
    provider: "goethe-b2",
    segmentIndex: index + 1,
    segmentCount: 2,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "t2-h1",
    clipId: "t2-h1",
    taskId: "telc-b2-full-02-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t2-h2",
    clipId: "t2-h2",
    taskId: "telc-b2-full-02-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `t2-h3-${index + 1}`,
    clipId: `t2-h3-${index + 1}`,
    taskId: "telc-b2-full-02-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "g3-h2",
    clipId: "g3-h2",
    taskId: "goethe-b2-full-03-listening-02",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "g3-h3",
    clipId: "g3-h3",
    taskId: "goethe-b2-full-03-listening-03",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "g3-h4",
    clipId: "g3-h4",
    taskId: "goethe-b2-full-03-listening-04",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t3-h1",
    clipId: "t3-h1",
    taskId: "telc-b2-full-03-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t3-h2",
    clipId: "t3-h2",
    taskId: "telc-b2-full-03-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `t3-h3-${index + 1}`,
    clipId: `t3-h3-${index + 1}`,
    taskId: "telc-b2-full-03-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `g3-h1-${index + 1}`,
    clipId: `g3-h1-${index + 1}`,
    taskId: "goethe-b2-full-03-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `g4-h1-${index + 1}`,
    clipId: `g4-h1-${index + 1}`,
    taskId: "goethe-b2-full-04-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...["g4-h2", "g4-h3", "g4-h4"].map((clipId, index) => ({
    fileId: clipId,
    clipId,
    taskId: `goethe-b2-full-04-listening-0${index + 2}`,
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "t4-h1",
    clipId: "t4-h1",
    taskId: "telc-b2-full-04-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t4-h2",
    clipId: "t4-h2",
    taskId: "telc-b2-full-04-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `t4-h3-${index + 1}`,
    clipId: `t4-h3-${index + 1}`,
    taskId: "telc-b2-full-04-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...["g5-h2", "g5-h3", "g5-h4"].map((clipId, index) => ({
    fileId: clipId,
    clipId,
    taskId: `goethe-b2-full-05-listening-0${index + 2}`,
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "t5-h1",
    clipId: "t5-h1",
    taskId: "telc-b2-full-05-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t5-h2",
    clipId: "t5-h2",
    taskId: "telc-b2-full-05-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `t5-h3-${index + 1}`,
    clipId: `t5-h3-${index + 1}`,
    taskId: "telc-b2-full-05-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `g5-h1-${index + 1}`,
    clipId: `g5-h1-${index + 1}`,
    taskId: "goethe-b2-full-05-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `g6-h1-${index + 1}`,
    clipId: `g6-h1-${index + 1}`,
    taskId: "goethe-b2-full-06-listening-01",
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  ...["g6-h2", "g6-h3", "g6-h4"].map((clipId, index) => ({
    fileId: clipId,
    clipId,
    taskId: `goethe-b2-full-06-listening-0${index + 2}`,
    provider: "goethe-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
  {
    fileId: "t6-h1",
    clipId: "t6-h1",
    taskId: "telc-b2-full-06-listening-01",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  {
    fileId: "t6-h2",
    clipId: "t6-h2",
    taskId: "telc-b2-full-06-listening-02",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    fileId: `t6-h3-${index + 1}`,
    clipId: `t6-h3-${index + 1}`,
    taskId: "telc-b2-full-06-listening-03",
    provider: "telc-deutsch-b2",
    segmentIndex: 1,
    segmentCount: 1,
    generatedAt: "2026-08-31",
  })),
];

const inventorySources = [
  { path: "src/data/exam-listening-simulations.ts", scope: "targeted" },
  ...["02", "03", "04", "05", "06"].map((batch) => ({
    path: `src/data/full-exam-${batch}-tasks.ts`,
    scope: "full-simulation",
  })),
];

function mp3DurationMs(bytes) {
  let offset = 0;
  if (bytes.subarray(0, 3).toString("ascii") === "ID3" && bytes.length >= 10) {
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    offset = 10 + size;
  }
  const bitratesMpeg1Layer3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const bitratesMpeg2Layer3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const sampleRates = [44100, 48000, 32000];
  let samples = 0;
  let sampleRate = 0;
  let frames = 0;
  while (offset + 4 <= bytes.length) {
    const header = bytes.readUInt32BE(offset);
    if ((header & 0xffe00000) !== (0xffe00000 | 0)) {
      offset += 1;
      continue;
    }
    const version = (header >>> 19) & 3;
    const layer = (header >>> 17) & 3;
    const bitrateIndex = (header >>> 12) & 15;
    const sampleRateIndex = (header >>> 10) & 3;
    const padding = (header >>> 9) & 1;
    if (version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      offset += 1;
      continue;
    }
    const mpeg1 = version === 3;
    const bitrate = (mpeg1 ? bitratesMpeg1Layer3 : bitratesMpeg2Layer3)[bitrateIndex];
    sampleRate = sampleRates[sampleRateIndex] / (version === 2 ? 2 : version === 0 ? 4 : 1);
    const length = Math.floor((mpeg1 ? 144000 : 72000) * bitrate / sampleRate) + padding;
    if (length <= 4 || offset + length > bytes.length) break;
    samples += mpeg1 ? 1152 : 576;
    frames += 1;
    offset += length;
  }
  if (!frames || !sampleRate) throw new Error("Could not parse MP3 duration.");
  return Math.round(samples / sampleRate * 1000);
}

async function discoverListeningTaskInventory() {
  const inventory = [];
  for (const source of inventorySources) {
    const code = await readFile(resolve(root, source.path), "utf8");
    const blocks = code.match(/kind\s*:\s*"listening"[\s\S]*?(?=\bitems\s*:)/g) ?? [];
    for (const block of blocks) {
      const taskId = block.match(/\bid\s*:\s*"([^"]+)"/)?.[1];
      const provider = block.match(/\bprovider\s*:\s*"([^"]+)"/)?.[1];
      const clipsSource = block.match(/\bclips\s*:\s*\[([\s\S]*)/)?.[1] ?? "";
      const clipIds = [...clipsSource.matchAll(/\bid\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
      if (!taskId || !provider || clipIds.length === 0) {
        throw new Error(`Could not discover a complete listening task in ${source.path}.`);
      }
      inventory.push({ taskId, provider, scope: source.scope, clipIds });
    }
  }

  const taskIds = new Set(inventory.map((task) => task.taskId));
  const clipIds = inventory.flatMap((task) => task.clipIds);
  if (inventory.length !== 42 || taskIds.size !== 42) {
    throw new Error(`Expected 42 unique listening tasks, found ${inventory.length}/${taskIds.size}.`);
  }
  if (new Set(clipIds).size !== clipIds.length) {
    throw new Error("Listening clip IDs must remain globally unique.");
  }
  return inventory;
}

const taskInventory = await discoverListeningTaskInventory();
const taskById = new Map(taskInventory.map((task) => [task.taskId, task]));
const assets = [];
for (const clip of generatedClips) {
  const task = taskById.get(clip.taskId);
  if (!task || task.provider !== clip.provider || !task.clipIds.includes(clip.clipId)) {
    throw new Error(`Generated asset ${clip.fileId} is not owned by ${clip.taskId}/${clip.provider}.`);
  }
  const path = `/audio/exams/${clip.fileId}.mp3`;
  const bytes = await readFile(resolve(root, `public${path}`));
  assets.push({
    ...clip,
    path,
    format: "audio/mpeg",
    language: "de-DE",
    durationMs: mp3DurationMs(bytes),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    speakerCount: 1,
    voiceProfile: "german-educational-feminine-01",
    synthesisProvider: "Arena.ai speech synthesis",
    generatedAt: clip.generatedAt ?? "2026-08-30",
    sourceContent: "original-exam-practice-transcript",
    rightsStatus: "generated-for-project-review-required",
    examGrade: false,
  });
}

const assetsByClipId = new Map();
for (const asset of assets) {
  const parts = assetsByClipId.get(asset.clipId) ?? [];
  parts.push(asset);
  assetsByClipId.set(asset.clipId, parts);
}
const completeClipIds = new Set();
const partialClipIds = new Set();
for (const [clipId, unorderedParts] of assetsByClipId) {
  const parts = unorderedParts.toSorted((left, right) => left.segmentIndex - right.segmentIndex);
  const complete = parts.every((part, index) => part.segmentIndex === index + 1 && part.segmentCount === parts.length);
  (complete ? completeClipIds : partialClipIds).add(clipId);
}

const taskCoverage = taskInventory.map((task) => {
  const coveredClipIds = task.clipIds.filter((clipId) => completeClipIds.has(clipId));
  const partialTaskClipIds = task.clipIds.filter((clipId) => partialClipIds.has(clipId));
  const missingClipIds = task.clipIds.filter((clipId) => !completeClipIds.has(clipId));
  return {
    taskId: task.taskId,
    provider: task.provider,
    scope: task.scope,
    requiredClipCount: task.clipIds.length,
    coveredClipCount: coveredClipIds.length,
    partialClipCount: partialTaskClipIds.length,
    missingClipIds,
    status: coveredClipIds.length === task.clipIds.length ? "complete" : coveredClipIds.length > 0 || partialTaskClipIds.length > 0 ? "partial" : "missing",
  };
});

const completeTasks = taskCoverage.filter((task) => task.status === "complete");
const manifest = {
  format: "dwnb-exam-audio",
  version: 2,
  generatedAssetCount: assets.length,
  coveredClipCount: completeClipIds.size,
  partiallyCoveredClipCount: partialClipIds.size,
  totalLogicalClipCount: taskInventory.reduce((sum, task) => sum + task.clipIds.length, 0),
  fullyCoveredTaskCount: completeTasks.length,
  completeTargetedTaskCount: completeTasks.filter((task) => task.scope === "targeted").length,
  completeFullSimulationTaskCount: completeTasks.filter((task) => task.scope === "full-simulation").length,
  partiallyCoveredTaskCount: taskCoverage.filter((task) => task.status === "partial").length,
  totalListeningTaskCount: taskCoverage.length,
  totalTargetedListeningTaskCount: taskCoverage.filter((task) => task.scope === "targeted").length,
  totalFullSimulationListeningTaskCount: taskCoverage.filter((task) => task.scope === "full-simulation").length,
  humanRecordedAssetCount: 0,
  usageNoteAr: "صوت اصطناعي أحادي المتحدث مولد من نصوص تدريب امتحانية أصلية. ليس صوت Goethe أو telc الرسمي، ولا تسجيلًا بشريًا متعدد المتحدثين، ويحتاج مراجعة حقوق وجودة قبل التوزيع التجاري.",
  taskCoverage,
  assets,
};
await writeFile(resolve(root, "public/audio/exams/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated metadata for ${assets.length} physical files, ${completeClipIds.size} complete logical clips, and ${completeTasks.length}/${taskCoverage.length} complete listening tasks.`);
