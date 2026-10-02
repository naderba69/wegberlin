import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextRoot = path.join(root, ".next");
const routeManifest = JSON.parse(await readFile(path.join(root, "public/offline-routes.json"), "utf8"));
if (routeManifest.version !== 2 || !Array.isArray(routeManifest.packs)) throw new Error("Offline route manifest v2 is required before size generation.");

function routeOutputPath(route) {
  if (route === "/manifest.webmanifest") return path.join(nextRoot, "server/app/manifest.webmanifest.body");
  if (route === "/") return path.join(nextRoot, "server/app/index.html");
  return path.join(nextRoot, "server/app", `${route.slice(1)}.html`);
}

function compressedBytes(bytes) {
  return gzipSync(bytes, { level: 9 }).byteLength;
}

async function readRequired(file, label) {
  try { return await readFile(file); }
  catch { throw new Error(`Missing built Offline payload for ${label}: ${path.relative(root, file)}`); }
}

function nextAssetOutputPath(asset) {
  const encodedRelative = asset.slice("/_next/static/".length);
  let relative;
  try { relative = decodeURIComponent(encodedRelative); }
  catch { throw new Error(`Invalid encoded Next asset path in built HTML: ${asset}`); }
  const file = path.resolve(nextRoot, "static", relative);
  const staticRoot = path.resolve(nextRoot, "static");
  if (!file.startsWith(`${staticRoot}${path.sep}`)) throw new Error(`Unsafe Next asset path in built HTML: ${asset}`);
  return file;
}

async function packSize(pack) {
  const assetPaths = new Set();
  let routeRawBytes = 0;
  let routeGzipBytes = 0;
  for (const route of pack.routes) {
    const bytes = await readRequired(routeOutputPath(route), route);
    routeRawBytes += bytes.byteLength;
    routeGzipBytes += compressedBytes(bytes);
    const html = bytes.toString("utf8");
    for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"'?]+)(?:\?[^"']*)?["']/g)) assetPaths.add(match[1]);
  }

  let assetRawBytes = 0;
  let assetGzipBytes = 0;
  const assets = [];
  for (const asset of [...assetPaths].sort()) {
    const bytes = await readRequired(nextAssetOutputPath(asset), asset);
    const gzipBytes = compressedBytes(bytes);
    assetRawBytes += bytes.byteLength;
    assetGzipBytes += gzipBytes;
    assets.push({ path: asset, rawBytes: bytes.byteLength, gzipBytes });
  }

  const supportPaths = [
    { file: path.join(root, "public/offline-routes.json"), label: "public/offline-routes.json" },
    { file: path.join(root, "public/icons/app-icon.svg"), label: "public/icons/app-icon.svg" },
    { file: path.join(nextRoot, "server/app/favicon.ico.body"), label: ".next/server/app/favicon.ico.body" },
  ];
  let supportRawBytes = 0;
  let supportGzipBytes = 0;
  for (const support of supportPaths) {
    const bytes = await readRequired(support.file, support.label);
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
await writeFile(path.join(root, "public/offline-size-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated Offline size manifest ${buildFingerprint.slice(0, 12)} (${packs.map((pack) => `${pack.id}:${pack.totalGzipBytes}`).join(", ")}).`);
