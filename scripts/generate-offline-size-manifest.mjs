import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { readFile, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverBuiltPayloads } from "./lib/built-payloads.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function compressedBytes(bytes) {
  return gzipSync(bytes, { level: 9 }).byteLength;
}

async function readRequired(file, label, projectRoot) {
  try { return await readFile(file); }
  catch { throw new Error(`Missing built Offline payload for ${label}: ${path.relative(projectRoot, file)}`); }
}

function nextAssetOutputPath(asset, staticRoot) {
  const encodedRelative = asset.slice("/_next/static/".length);
  let relative;
  try { relative = decodeURIComponent(encodedRelative); }
  catch { throw new Error(`Invalid encoded Next asset path in built HTML: ${asset}`); }
  const file = path.resolve(staticRoot, relative);
  if (relative.includes("\\") || !file.startsWith(`${path.resolve(staticRoot)}${path.sep}`)) throw new Error(`Unsafe Next asset path in built HTML: ${asset}`);
  return file;
}

async function publishManifest(file, serialized) {
  const temporary = `${file}.dwnb-tmp-${process.pid}`;
  try { await writeFile(temporary, serialized); await rename(temporary, file); }
  finally { await rm(temporary, { force: true }); }
}

export async function generateOfflineSizeManifest({ projectRoot = root } = {}) {
  const routeManifest = JSON.parse(await readFile(path.join(projectRoot, "public/offline-routes.json"), "utf8"));
  if (routeManifest.version !== 2 || !Array.isArray(routeManifest.packs)) throw new Error("Offline route manifest v2 is required before size generation.");
  const layout = await discoverBuiltPayloads(projectRoot);

  async function packSize(pack) {
    const assetPaths = new Set();
    let routeRawBytes = 0;
    let routeGzipBytes = 0;
    for (const route of pack.routes) {
      const bytes = await readRequired(await layout.routeOutputPath(route), route, projectRoot);
      routeRawBytes += bytes.byteLength;
      routeGzipBytes += compressedBytes(bytes);
      const html = bytes.toString("utf8");
      for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"'?]+)(?:\?[^"']*)?["']/g)) assetPaths.add(match[1]);
    }

    let assetRawBytes = 0;
    let assetGzipBytes = 0;
    const assets = [];
    for (const asset of [...assetPaths].sort()) {
      const bytes = await readRequired(nextAssetOutputPath(asset, layout.nextStaticRoot), asset, projectRoot);
      const gzipBytes = compressedBytes(bytes);
      assetRawBytes += bytes.byteLength;
      assetGzipBytes += gzipBytes;
      assets.push({ path: asset, rawBytes: bytes.byteLength, gzipBytes });
    }

    const servingPublic = layout.staticRoot ?? path.join(projectRoot, "public");
    const supportPaths = [
      { file: path.join(servingPublic, "offline-routes.json"), label: "public/offline-routes.json" },
      { file: path.join(servingPublic, "icons/app-icon.svg"), label: "public/icons/app-icon.svg" },
      { file: await layout.routeOutputPath("/favicon.ico"), label: "/favicon.ico" },
    ];
    let supportRawBytes = 0;
    let supportGzipBytes = 0;
    for (const support of supportPaths) {
      const bytes = await readRequired(support.file, support.label, projectRoot);
      supportRawBytes += bytes.byteLength;
      supportGzipBytes += compressedBytes(bytes);
    }

    return {
      id: pack.id,
      label: pack.label,
      routeCount: pack.routeCount,
      routeRawBytes,
      routeGzipBytes,
      nextAssetCount: assets.length,
      nextAssetRawBytes: assetRawBytes,
      nextAssetGzipBytes: assetGzipBytes,
      supportRawBytes,
      supportGzipBytes,
      totalRawBytes: routeRawBytes + assetRawBytes + supportRawBytes,
      totalGzipBytes: routeGzipBytes + assetGzipBytes + supportGzipBytes,
      assets,
    };
  }

  const packs = [];
  for (const pack of routeManifest.packs) packs.push(await packSize(pack));
  const fingerprintSource = packs.map((pack) => [pack.id, pack.routeCount, pack.totalRawBytes, pack.totalGzipBytes, pack.assets.map((asset) => [asset.path, asset.rawBytes, asset.gzipBytes])]);
  const buildFingerprint = createHash("sha256").update(JSON.stringify(fingerprintSource)).digest("hex");
  const manifest = {
    format: "dwnb-offline-size-manifest",
    version: 1,
    generatedAt: "2026-09-05",
    compressionPolicy: "gzip-level-9-estimate-v1",
    buildFingerprint,
    boundary: "Precomputed deterministic gzip bytes for built route HTML, discovered Next static assets, and core support files. CDN Brotli/headers and the size manifest response itself may differ. Optional audio bytes are reported separately from committed audio manifests.",
    packs,
  };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  // Vercel's onBuildComplete has already copied public/. Publish the new bytes
  // into its actual static serving output too, rather than deploy a stale copy.
  for (const destination of layout.sizeManifestOutputs) await publishManifest(destination, serialized);
  console.log(`Generated Offline size manifest ${buildFingerprint.slice(0, 12)} (${layout.kind}; ${packs.map((pack) => `${pack.id}:${pack.totalGzipBytes}`).join(", ")}).`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generateOfflineSizeManifest();
