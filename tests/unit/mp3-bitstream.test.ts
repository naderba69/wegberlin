// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import libraryManifest from "../../public/audio/library/manifest.json";
import lessonManifest from "../../public/audio/lessons/manifest.json";
import examManifest from "../../public/audio/exams/manifest.json";

const mpeg1Layer3Rates = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
const mpeg2Layer3Rates = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];

function id3End(bytes: Buffer) {
  if (bytes.subarray(0, 3).toString("ascii") !== "ID3") return 0;
  return 10 + ((bytes[6] & 0x7f) << 21) + ((bytes[7] & 0x7f) << 14) + ((bytes[8] & 0x7f) << 7) + (bytes[9] & 0x7f);
}

function inspectMp3(bytes: Buffer) {
  let offset = id3End(bytes);
  let frames = 0;
  let durationSeconds = 0;
  let payloadVariation = 0;
  while (offset + 4 <= bytes.length) {
    const a = bytes[offset], b = bytes[offset + 1], c = bytes[offset + 2];
    if (a !== 0xff || (b & 0xe0) !== 0xe0 || (b & 0x06) !== 0x02) { offset += 1; continue; }
    const versionBits = (b >> 3) & 0x03;
    if (versionBits === 1) { offset += 1; continue; }
    const mpeg1 = versionBits === 3;
    const divisor = mpeg1 ? 1 : versionBits === 2 ? 2 : 4;
    const bitrateIndex = (c >> 4) & 0x0f;
    const sampleIndex = (c >> 2) & 0x03;
    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) { offset += 1; continue; }
    const bitrate = (mpeg1 ? mpeg1Layer3Rates : mpeg2Layer3Rates)[bitrateIndex] * 1000;
    const sampleRate = [44100, 48000, 32000][sampleIndex] / divisor;
    const padding = (c >> 1) & 1;
    const frameLength = Math.floor((mpeg1 ? 144 : 72) * bitrate / sampleRate) + padding;
    if (frameLength < 24 || offset + frameLength > bytes.length) break;
    const payload = bytes.subarray(offset + 4, offset + frameLength);
    payloadVariation += payload.reduce((sum, value) => sum + (value !== 0 && value !== 255 ? 1 : 0), 0);
    frames += 1;
    durationSeconds += (mpeg1 ? 1152 : 576) / sampleRate;
    offset += frameLength;
  }
  return { frames, durationSeconds, payloadVariation };
}

const manifests = [libraryManifest, lessonManifest, examManifest] as unknown as Array<{ assets: Array<{ path: string; durationMs: number; bytes: number }> }>;
const allAssets = manifests.flatMap((manifest) => manifest.assets);

describe("physical MP3 bitstream validity", () => {
  it("finds a playable MPEG Layer III frame chain in all 260 generated files", () => {
    expect(allAssets).toHaveLength(260);
    for (const asset of allAssets) {
      const bytes = readFileSync(resolve(process.cwd(), `public${asset.path}`));
      const inspected = inspectMp3(bytes);
      expect(bytes.length, asset.path).toBe(asset.bytes);
      expect(inspected.frames, asset.path).toBeGreaterThan(20);
      expect(inspected.durationSeconds, asset.path).toBeGreaterThan(2);
      expect(inspected.payloadVariation, asset.path).toBeGreaterThan(inspected.frames);
    }
  });

  it("keeps parsed stream duration close to every manifest duration", () => {
    for (const asset of allAssets) {
      const inspected = inspectMp3(readFileSync(resolve(process.cwd(), `public${asset.path}`)));
      expect(Math.abs(inspected.durationSeconds * 1000 - asset.durationMs), asset.path).toBeLessThan(1200);
    }
  });

  it("validates every diagnostic listening file as nonempty audio", () => {
    const diagnosticIds = ["lib-l-a1-01","lib-l-a1-02","lib-l-a2-01","lib-l-a2-02","lib-l-b1-01","lib-l-b1-02","lib-l-b2-01","lib-l-b2-02"];
    for (const itemId of diagnosticIds) {
      const asset = libraryManifest.assets.find((item) => item.itemId === itemId)!;
      const inspected = inspectMp3(readFileSync(resolve(process.cwd(), `public${asset.path}`)));
      expect(inspected.frames, itemId).toBeGreaterThan(100);
      expect(inspected.durationSeconds, itemId).toBeGreaterThan(10);
    }
  });
});
