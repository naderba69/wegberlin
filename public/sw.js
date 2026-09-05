const SHELL_CACHE = "dwnb-shell-v4";
const PACK_VERSION = "v56";
const PACK_CACHE = "dwnb-full-pack-v56";
const PACK_STAGING_CACHE = "dwnb-full-pack-staging-v56";
const LEVEL_SCOPES = ["A1", "A2", "B1", "B2"];
const PACK_SCOPES = ["full", ...LEVEL_SCOPES];
const levelPackCache = (level) => `dwnb-level-pack-${level.toLowerCase()}-${PACK_VERSION}`;
const levelStagingCache = (level) => `dwnb-level-pack-${level.toLowerCase()}-staging-${PACK_VERSION}`;
const packCacheFor = (scope) => (scope === "full" ? PACK_CACHE : levelPackCache(scope));
const stagingCacheFor = (scope) => (scope === "full" ? PACK_STAGING_CACHE : levelStagingCache(scope));
const normalizeScope = (value) => (LEVEL_SCOPES.includes(value) ? value : "full");
const PACK_META_PATH = "/__dwnb_offline_pack_meta__";
const OFFLINE_MANIFEST_PATH = "/offline-routes.json";
const AUDIO_MANIFEST_PATHS = ["/audio/library/manifest.json", "/audio/lessons/manifest.json", "/audio/exams/manifest.json"];
const OFFLINE_SIZE_PATH = "/offline-size-manifest.json";
const CORE = [
  "/today",
  "/path",
  "/review",
  "/practice",
  "/shadowing",
  "/library",
  "/search",
  "/exams",
  "/progress",
  "/settings",
  "/manifest.webmanifest",
  "/offline-routes.json",
  "/offline-size-manifest.json",
  "/icons/app-icon.svg",
];
let activePackDownload = null;

function replyTo(event, payload) {
  try {
    event.ports[0]?.postMessage(payload);
  } catch {
    // The page may close while the install continues under event.waitUntil().
  }
}

async function readScopeStatus(scope) {
  const cache = await caches.open(packCacheFor(scope));
  const response = await cache.match(PACK_META_PATH);
  if (!response) return { scope, installed: false };
  try {
    return { scope, installed: true, ...(await response.json()) };
  } catch {
    return { scope, installed: false };
  }
}

async function readPackStatus() {
  const scopes = {};
  for (const scope of PACK_SCOPES) scopes[scope] = await readScopeStatus(scope);
  const full = scopes.full;
  if (!full.installed) return { installed: false, scopes };
  return { installed: true, routeCount: full.routeCount, assetCount: full.assetCount, entryCount: full.entryCount, includesAudio: full.includesAudio, audioEntryCount: full.audioEntryCount, byteSize: full.byteSize, completedAt: full.completedAt, scopes };
}

async function mapWithConcurrency(items, concurrency, task) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

function assetsFromHtml(html, includeAudio) {
  const assets = new Set();
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const raw = match[1].replaceAll("&amp;", "&");
    try {
      const url = new URL(raw, self.location.origin);
      if (url.origin !== self.location.origin) continue;
      const isAudio = url.pathname.startsWith("/audio/");
      if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || (includeAudio && isAudio) || url.pathname === "/favicon.ico") {
        assets.add(`${url.pathname}${url.search}`);
      }
    } catch {
      // Ignore malformed and non-HTTP references from page markup.
    }
  }
  return assets;
}

async function cachePayloadStats(cache) {
  const requests = await cache.keys();
  let byteSize = 0;
  let audioEntryCount = 0;
  for (const request of requests) {
    const url = new URL(request.url);
    if (url.pathname === PACK_META_PATH) continue;
    const response = await cache.match(request);
    if (!response) continue;
    byteSize += (await response.clone().arrayBuffer()).byteLength;
    if (url.pathname.startsWith("/audio/")) audioEntryCount += 1;
  }
  return { byteSize, audioEntryCount };
}

async function estimateOptionalAudio() {
  let audioByteSize = 0;
  let audioAssetCount = 0;
  for (const path of AUDIO_MANIFEST_PATHS) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) continue;
    const manifest = await response.json();
    if (!Array.isArray(manifest.assets)) continue;
    for (const asset of manifest.assets) {
      const bytes = typeof asset.byteSize === "number" ? asset.byteSize : asset.bytes;
      if (typeof bytes === "number" && bytes >= 0) audioByteSize += bytes;
      if (typeof asset.path === "string" && asset.path.startsWith("/audio/")) audioAssetCount += 1;
    }
  }
  const routeResponse = await fetch(OFFLINE_MANIFEST_PATH, { cache: "no-store" });
  const routeManifest = routeResponse.ok ? await routeResponse.json() : null;
  const sizeResponse = await fetch(OFFLINE_SIZE_PATH, { cache: "no-store" });
  const sizeManifest = sizeResponse.ok ? await sizeResponse.json() : null;
  return {
    audioByteSize,
    audioAssetCount,
    routeCount: typeof routeManifest?.routeCount === "number" ? routeManifest.routeCount : 0,
    sizeManifest: sizeManifest?.format === "dwnb-offline-size"
      ? { generatedAt: sizeManifest.generatedAt, buildId: sizeManifest.buildId, packs: sizeManifest.packs, audio: sizeManifest.audio }
      : null,
  };
}

async function removePackAudio(scope) {
  const pack = await caches.open(packCacheFor(scope));
  const status = await readScopeStatus(scope);
  if (!status.installed) throw new Error("لا توجد حزمة مثبتة لهذا النطاق لحذف صوتها.");
  const requests = await pack.keys();
  let removedAudioCount = 0;
  for (const request of requests) {
    if (new URL(request.url).pathname.startsWith("/audio/")) {
      if (await pack.delete(request)) removedAudioCount += 1;
    }
  }
  const stats = await cachePayloadStats(pack);
  const metadata = { ...status, scope, includesAudio: false, audioEntryCount: 0, byteSize: stats.byteSize, updatedAt: new Date().toISOString() };
  delete metadata.installed;
  await pack.put(PACK_META_PATH, new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" } }));
  return { ...metadata, removedAudioCount };
}

async function downloadFullPack(event, includeAudio, requestedScope) {
  const scope = normalizeScope(requestedScope);
  const stagingName = stagingCacheFor(scope);
  await caches.delete(stagingName);
  const cleanStaging = await caches.open(stagingName);

  try {
    replyTo(event, { type: "DWNB_OFFLINE_PACK_PROGRESS", phase: "manifest", percent: 1, completed: 0, total: 0 });
    const manifestResponse = await fetch(OFFLINE_MANIFEST_PATH, { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error("تعذر تنزيل فهرس الحزمة.");
    const manifest = await manifestResponse.json();
    if (manifest.format !== "dwnb-offline-routes" || !Array.isArray(manifest.routes) || manifest.routeCount !== manifest.routes.length) {
      throw new Error("فهرس الحزمة غير صالح.");
    }
    const packDefinition = manifest.levelPacks?.[scope];
    if (!packDefinition || !Array.isArray(packDefinition.routes) || !packDefinition.routes.length) {
      throw new Error("فهرس الحزمة لا يعرف هذا النطاق.");
    }
    for (const route of packDefinition.routes) {
      if (!manifest.routes.includes(route)) throw new Error(`مسار خارج فهرس الحزمة الكامل: ${route}`);
    }

    const routes = [...new Set(packDefinition.routes)];
    const assets = new Set(["/manifest.webmanifest", "/offline-routes.json", OFFLINE_SIZE_PATH, "/icons/app-icon.svg", "/favicon.ico"]);
    let completedRoutes = 0;

    await mapWithConcurrency(routes, 4, async (route) => {
      const response = await fetch(route, { cache: "no-store", redirect: "follow" });
      if (!response.ok) throw new Error(`فشل تنزيل المسار ${route}.`);
      await cleanStaging.put(route, response.clone());
      if ((response.headers.get("content-type") || "").includes("text/html")) {
        const html = await response.text();
        for (const asset of assetsFromHtml(html, includeAudio)) assets.add(asset);
      }
      completedRoutes += 1;
      replyTo(event, {
        type: "DWNB_OFFLINE_PACK_PROGRESS",
        phase: "routes",
        percent: Math.max(2, Math.round((completedRoutes / routes.length) * 80)),
        completed: completedRoutes,
        total: routes.length,
      });
    });

    if (includeAudio) {
      for (const audioManifestPath of AUDIO_MANIFEST_PATHS) {
        const audioManifestResponse = await fetch(audioManifestPath, { cache: "no-store" });
        if (!audioManifestResponse.ok) continue;
        const audioManifest = await audioManifestResponse.json();
        assets.add(audioManifestPath);
        if (Array.isArray(audioManifest.assets)) {
          for (const asset of audioManifest.assets) {
            if (typeof asset.path === "string" && asset.path.startsWith("/audio/")) assets.add(asset.path);
          }
        }
      }
    }

    const assetList = [...assets];
    let completedAssets = 0;
    await mapWithConcurrency(assetList, 6, async (asset) => {
      const response = await fetch(asset, { cache: "no-store" });
      if (!response.ok) throw new Error(`فشل تنزيل مورد الحزمة ${asset}.`);
      await cleanStaging.put(asset, response);
      completedAssets += 1;
      replyTo(event, {
        type: "DWNB_OFFLINE_PACK_PROGRESS",
        phase: "assets",
        percent: 80 + Math.round((completedAssets / assetList.length) * 17),
        completed: completedAssets,
        total: assetList.length,
      });
    });

    replyTo(event, { type: "DWNB_OFFLINE_PACK_PROGRESS", phase: "promoting", percent: 98, completed: 0, total: 0 });
    const stats = await cachePayloadStats(cleanStaging);
    // حذف الحزمة القديمة بعد نجاح المسرح المؤقت فقط، حتى لا يفقد المستخدم حزمة عاملة عند فشل التنزيل.
    await caches.delete(packCacheFor(scope));
    const pack = await caches.open(packCacheFor(scope));
    const stagedRequests = await cleanStaging.keys();
    for (const request of stagedRequests) {
      const response = await cleanStaging.match(request);
      if (response) await pack.put(request, response);
    }

    const metadata = {
      manifestVersion: manifest.version,
      scope,
      completedAt: new Date().toISOString(),
      routeCount: routes.length,
      assetCount: assetList.length,
      entryCount: stagedRequests.length,
      includesAudio: includeAudio,
      audioEntryCount: stats.audioEntryCount,
      byteSize: stats.byteSize,
    };
    await pack.put(PACK_META_PATH, new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" } }));
    await caches.delete(stagingName);
    replyTo(event, { type: "DWNB_OFFLINE_PACK_COMPLETE", ...metadata, percent: 100 });
  } catch (error) {
    await caches.delete(stagingName);
    replyTo(event, {
      type: "DWNB_OFFLINE_PACK_ERROR",
      message: error instanceof Error ? error.message : "فشل تنزيل الحزمة الكاملة.",
    });
  }
}

self.addEventListener("install", (event) => event.waitUntil((async () => {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(CORE);
  await self.skipWaiting();
})()));

self.addEventListener("activate", (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  const keep = new Set([SHELL_CACHE, PACK_CACHE, PACK_STAGING_CACHE, ...LEVEL_SCOPES.map(levelPackCache), ...LEVEL_SCOPES.map(levelStagingCache)]);
  await Promise.all(keys
    .filter((key) => !keep.has(key) && (key.startsWith("dwnb-shell-") || key.startsWith("dwnb-full-pack-") || key.startsWith("dwnb-level-pack-")))
    .map((key) => caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type === "DWNB_OFFLINE_PACK_STATUS") {
    event.waitUntil(readPackStatus().then((status) => replyTo(event, { type: "DWNB_OFFLINE_PACK_STATUS", ...status })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_ESTIMATE") {
    event.waitUntil(estimateOptionalAudio()
      .then((estimate) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ESTIMATE", ...estimate }))
      .catch((error) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: error instanceof Error ? error.message : "تعذر حساب حجم الصوت." })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_REMOVE_AUDIO") {
    event.waitUntil(removePackAudio(normalizeScope(event.data?.scope))
      .then((result) => replyTo(event, { type: "DWNB_OFFLINE_PACK_AUDIO_REMOVED", installed: true, ...result }))
      .catch((error) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: error instanceof Error ? error.message : "تعذر حذف الصوت." })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_REMOVE") {
    const removeScope = normalizeScope(event.data?.scope);
    event.waitUntil((async () => {
      await Promise.all([caches.delete(packCacheFor(removeScope)), caches.delete(stagingCacheFor(removeScope))]);
      replyTo(event, { type: "DWNB_OFFLINE_PACK_REMOVED", scope: removeScope, ...(await readPackStatus()) });
    })());
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_DOWNLOAD") {
    if (activePackDownload) {
      replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: "تنزيل الحزمة جارٍ بالفعل." });
      return;
    }
    activePackDownload = downloadFullPack(event, event.data?.includeAudio === true, event.data?.scope).finally(() => {
      activePackDownload = null;
    });
    event.waitUntil(activePackDownload);
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      const isFullResponse = response.status === 200 && !event.request.headers.has("range");
      if (isFullResponse && new URL(event.request.url).origin === self.location.origin) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") return (await caches.match("/today")) || Response.error();
      return new Response("Offline resource unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
