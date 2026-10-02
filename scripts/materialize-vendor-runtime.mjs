import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { gunzipSync } from "node:zlib";

const manifestPath = "vendor-assets/webgpu/manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.format !== "dwnb-packed-vendor-runtime" || manifest.version !== 2 || manifest.algorithm !== "xor-0xa5-then-gzip") throw new Error("Packed WebGPU vendor manifest is invalid.");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

function rewritePinnedModuleSpecifiers(source, rewrites) {
  let text = source.toString("utf8");
  for (const rewrite of rewrites ?? []) {
    if (typeof rewrite.specifier !== "string" || typeof rewrite.replacement !== "string" || !Number.isInteger(rewrite.expectedOccurrences) || rewrite.expectedOccurrences < 1) throw new Error("WebGPU module rewrite policy is invalid.");
    const pattern = new RegExp(`(\\bfrom\\s*)(["'])${escapeRegExp(rewrite.specifier)}\\2`, "gu");
    let occurrences = 0;
    text = text.replace(pattern, (_match, prefix, quote) => {
      occurrences += 1;
      return `${prefix}${quote}${rewrite.replacement}${quote}`;
    });
    if (occurrences !== rewrite.expectedOccurrences) throw new Error(`Expected ${rewrite.expectedOccurrences} pinned import(s) for ${rewrite.specifier}; found ${occurrences}.`);
  }
  for (const rewrite of rewrites ?? []) {
    const remaining = new RegExp(`\\bfrom\\s*(["'])${escapeRegExp(rewrite.specifier)}\\1`, "u");
    if (remaining.test(text)) throw new Error(`Unresolved browser ESM package specifier remains: ${rewrite.specifier}.`);
  }
  return Buffer.from(text);
}

async function materializeAsset(asset, label) {
  if (typeof asset.sourcePath !== "string" || typeof asset.packedPath !== "string") throw new Error(`Packed WebGPU ${label} paths are invalid.`);
  const packed = await readFile(asset.packedPath);
  if (packed.length !== asset.packedBytes || sha256(packed) !== asset.packedSha256) throw new Error(`Packed WebGPU ${label} checksum failed.`);
  const encoded = gunzipSync(packed);
  const source = Buffer.allocUnsafe(encoded.length);
  for (let index = 0; index < encoded.length; index += 1) source[index] = encoded[index] ^ 0xA5;
  if (source.length !== asset.sourceBytes || sha256(source) !== asset.sourceSha256) throw new Error(`Upstream WebGPU ${label} source checksum failed.`);
  const output = rewritePinnedModuleSpecifiers(source, asset.moduleSpecifierRewrites);
  if (output.length !== asset.materializedBytes || sha256(output) !== asset.materializedSha256) throw new Error(`Materialized WebGPU ${label} checksum failed.`);
  await mkdir(dirname(asset.sourcePath), { recursive: true });
  await writeFile(asset.sourcePath, output);
  console.log(`Materialized audited WebGPU ${label}: ${output.length} bytes / ${asset.materializedSha256.slice(0, 12)}.`);
}

await materializeAsset(manifest, "Transformers.js browser runtime");
if (!Array.isArray(manifest.companionAssets) || manifest.companionAssets.length !== 1) throw new Error("Pinned WebGPU runtime companion manifest is invalid.");
for (const companion of manifest.companionAssets) await materializeAsset(companion, `${companion.package}@${companion.packageVersion} WebGPU runtime`);
