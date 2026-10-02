import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { gunzipSync } from "node:zlib";

const manifestPath = "vendor-assets/webgpu/manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.format !== "dwnb-packed-vendor-runtime" || manifest.version !== 1 || manifest.algorithm !== "xor-0xa5-then-gzip") throw new Error("Packed WebGPU vendor manifest is invalid.");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const packed = await readFile(manifest.packedPath);
if (packed.length !== manifest.packedBytes || sha256(packed) !== manifest.packedSha256) throw new Error("Packed WebGPU vendor payload checksum failed.");
const encoded = gunzipSync(packed);
const source = Buffer.allocUnsafe(encoded.length);
for (let index = 0; index < encoded.length; index += 1) source[index] = encoded[index] ^ 0xA5;
if (source.length !== manifest.sourceBytes || sha256(source) !== manifest.sourceSha256) throw new Error("Materialized WebGPU vendor runtime checksum failed.");
await mkdir(dirname(manifest.sourcePath), { recursive: true });
await writeFile(manifest.sourcePath, source);
console.log(`Materialized audited WebGPU vendor runtime: ${source.length} bytes / ${manifest.sourceSha256.slice(0, 12)}.`);
