/**
 * P0-243: يقيس الحجم الحقيقي لحزمة Offline بعد البناء، لا قبله.
 *
 * يقرأ صفحات HTML المبنية مسبقًا، ويستخرج منها أصول Next الثابتة التي يخزنها عامل Offline فعلًا،
 * ثم يحسب لكل نطاق حزمة (full, A1, A2, B1, B2):
 *   - pageBytes / assetBytes: الحجم الخام الذي سيشغله Cache Storage بعد التثبيت.
 *   - transferBytes: الحجم المضغوط gzip الذي يعبر الشبكة أثناء التنزيل.
 * الصوت يُقرأ من manifests الصوت الملتزم بها لأنه مضغوط أصلًا ولا يحتاج gzip.
 *
 * يُشغّل تلقائيًا بعد `next build` عبر سكربت postbuild.
 */
import { gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextServerApp = resolve(root, ".next/server/app");
const nextStatic = resolve(root, ".next/static");
const publicDir = resolve(root, "public");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const gzipBytes = (buffer) => gzipSync(buffer, { level: 9 }).length;

const routeManifest = await readJson(resolve(publicDir, "offline-routes.json"));
const levelPacks = routeManifest.levelPacks;
if (!levelPacks) throw new Error("offline-routes.json is missing levelPacks. Run `npm run offline:manifest` first.");

const audioManifests = [
  await readJson(resolve(publicDir, "audio/library/manifest.json")),
  await readJson(resolve(publicDir, "audio/lessons/manifest.json")),
  await readJson(resolve(publicDir, "audio/exams/manifest.json")),
];
const audioAssets = audioManifests.flatMap((manifest) => manifest.assets ?? []);
const audioByteSize = audioAssets.reduce((sum, asset) => sum + (typeof asset.bytes === "number" ? asset.bytes : 0), 0);

function htmlFileForRoute(route) {
  const suffix = route === "/" ? "index" : route.replace(/^\//, "");
  return resolve(nextServerApp, `${suffix}.html`);
}

/** الأصول التي يخزنها العامل فعليًا: قطع Next الثابتة، الأيقونات، والبيان. */
function assetPathsFromHtml(html) {
  const paths = new Set();
  for (const match of html.matchAll(/\/_next\/static\/[A-Za-z0-9._\-/]+\.(?:js|css|map|woff2?|svg|png|jpg|webp|json)/g)) {
    paths.add(match[0]);
  }
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const raw = match[1].replaceAll("&amp;", "&");
    if (raw.startsWith("/icons/") || raw === "/manifest.webmanifest" || raw === "/favicon.ico") paths.add(raw);
  }
  return paths;
}

const htmlCache = new Map();
async function measureRoute(route) {
  if (htmlCache.has(route)) return htmlCache.get(route);
  let measurement = null;
  try {
    const file = htmlFileForRoute(route);
    const buffer = await readFile(file);
    measurement = { file: route, bytes: buffer.length, transferBytes: gzipBytes(buffer), assets: assetPathsFromHtml(buffer.toString("utf8")) };
  } catch {
    measurement = null;
  }
  htmlCache.set(route, measurement);
  return measurement;
}

/** أصول ينسخها Next حرفيًا من مجلد المصدر، وتُقاس من هناك لأن مخرجات البناء route ديناميكي. */
/** أصول تُولَّد عند الطلب من الكود (manifest.ts) فلا وجود لملف مبني لها؛ تُذكر صراحةً لا تُخفّى. */
const UNMEASURABLE_ASSETS = new Set(["/manifest.webmanifest"]);

const STATIC_ROUTE_SOURCES = { "/favicon.ico": "src/app/favicon.ico" };

const assetCache = new Map();
async function measureAsset(path) {
  if (assetCache.has(path)) return assetCache.get(path);
  let measurement = null;
  try {
    // favicon.ico وmanifest.webmanifest يُبنيان كـ route handlers ديناميكية،
    // لذلك يُقاس favicon من ملفه الأصلي المنسوخ حرفيًا، ويُترك الباقي كأصل غير مقاس بصراحة.
    const sourceOverride = STATIC_ROUTE_SOURCES[path];
    const file = sourceOverride
      ? resolve(root, sourceOverride)
      : path.startsWith("/_next/static/")
        ? resolve(nextStatic, path.replace("/_next/static/", ""))
        : resolve(publicDir, path.replace(/^\//, ""));
    const buffer = await readFile(file);
    measurement = { bytes: buffer.length, transferBytes: gzipBytes(buffer) };
  } catch {
    measurement = null;
  }
  assetCache.set(path, measurement);
  return measurement;
}

const packs = {};
for (const [scope, pack] of Object.entries(levelPacks)) {
  const routes = pack.routes ?? [];
  let htmlBytes = 0;
  let htmlTransferBytes = 0;
  let missingRoutes = 0;
  const assets = new Set(["/manifest.webmanifest", "/offline-routes.json", "/icons/app-icon.svg", "/favicon.ico"]);

  for (const route of routes) {
    // المسارات التي تنتهي بامتداد ملف (مثل /manifest.webmanifest) موارد لا صفحات HTML.
    if (/\.[a-z0-9]+$/i.test(route)) {
      assets.add(route);
      continue;
    }
    const measurement = await measureRoute(route);
    if (!measurement) {
      missingRoutes += 1;
      continue;
    }
    htmlBytes += measurement.bytes;
    htmlTransferBytes += measurement.transferBytes;
    for (const asset of measurement.assets) assets.add(asset);
  }

  let assetBytes = 0;
  let assetTransferBytes = 0;
  let missingAssets = 0;
  const unmeasuredAssets = [];
  for (const asset of assets) {
    const measurement = await measureAsset(asset);
    if (!measurement) {
      if (UNMEASURABLE_ASSETS.has(asset)) {
        unmeasuredAssets.push(asset);
        continue;
      }
      missingAssets += 1;
      continue;
    }
    assetBytes += measurement.bytes;
    assetTransferBytes += measurement.transferBytes;
  }
  unmeasuredAssets.sort();

  packs[scope] = {
    routeCount: routes.length,
    measuredRouteCount: routes.filter((route) => !/\.[a-z0-9]+$/i.test(route)).length - missingRoutes,
    missingRoutes,
    assetCount: assets.size - missingAssets - unmeasuredAssets.length,
    missingAssets,
    unmeasuredAssets,
    htmlBytes,
    htmlTransferBytes,
    assetBytes,
    assetTransferBytes,
    pageBytes: htmlBytes + assetBytes,
    pageTransferBytes: htmlTransferBytes + assetTransferBytes,
    pageWithAudioBytes: htmlBytes + assetBytes + audioByteSize,
    pageWithAudioTransferBytes: htmlTransferBytes + assetTransferBytes + audioByteSize,
  };
}

let buildId = "unknown";
try {
  const buildIdFile = await readFile(resolve(root, ".next/BUILD_ID"), "utf8");
  buildId = buildIdFile.trim();
} catch {
  buildId = "unknown";
}

const manifest = {
  format: "dwnb-offline-size",
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  buildId,
  compression: "gzip-level-9",
  units: "bytes",
  measurementNoteAr:
    "pageBytes يقيس ما سيشغله Cache Storage بعد التثبيت، وtransferBytes يقيس ما يعبر الشبكة مضغوطًا بـgzip. القيم مبنية من مخرجات Build الحقيقية، وهي تقدير دقيق للمسارات والأصول لا وعد بحجم جهاز المستخدم بعد استبدال قطع Next. الأصول المدرجة في unmeasuredAssets تُولَّد عند الطلب ولا يتجاوز مجموعها بضعة كيلوبايتات.",
  audio: {
    assetCount: audioAssets.length,
    byteSize: audioByteSize,
    noteAr: "ملفات MP3 مضغوطة أصلًا، لذلك حجم تخزينها وحجم نقلها متقاربان.",
  },
  packs,
};

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "offline-size-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const totalPages = Object.values(packs).reduce((sum, pack) => sum + pack.pageBytes, 0);
console.log(`Measured offline pack sizes for ${Object.keys(packs).length} scopes (${(totalPages / 1024 / 1024).toFixed(2)} MiB of pages across scopes).`);
for (const [scope, pack] of Object.entries(packs)) {
  console.log(`- ${scope}: ${pack.routeCount} routes · ${(pack.pageBytes / 1024 / 1024).toFixed(2)} MiB stored · ${(pack.pageTransferBytes / 1024 / 1024).toFixed(2)} MiB transfer${pack.missingRoutes ? ` · ${pack.missingRoutes} unmeasured` : ""}`);
}
console.log(`- audio: ${audioAssets.length} files · ${(audioByteSize / 1024 / 1024).toFixed(2)} MiB`);
