const SHELL_CACHE = "dwnb-shell-v4";
const PACK_CACHE = "dwnb-full-pack-v119";
const PACK_STAGING_CACHE = "dwnb-full-pack-staging-v119";
const PACK_PREVIOUS_CACHE = "dwnb-full-pack-previous-v119";
const PACK_META_PATH = "/__dwnb_offline_pack_meta__";
// GENERATED from src/config/curriculum-version.json — do not edit this line manually.
const CURRICULUM_VERSION = "dwnb-a1-b2-2026.09-v1";
const PACK_CHECKPOINT_PATH = "/__dwnb_offline_pack_checkpoint__";
const OFFLINE_MANIFEST_PATH = "/offline-routes.json";
const OFFLINE_SIZE_MANIFEST_PATH = "/offline-size-manifest.json";
const AUDIO_MANIFEST_PATHS = ["/audio/library/manifest.json", "/audio/lessons/manifest.json", "/audio/exams/manifest.json"];
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
  "/offline",
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

async function readPackStatus() {
  const [cache,previous] = await Promise.all([caches.open(PACK_CACHE),caches.open(PACK_PREVIOUS_CACHE)]);
  const [response,previousResponse] = await Promise.all([cache.match(PACK_META_PATH),previous.match(PACK_META_PATH)]);
  if (!response) return { installed: false,rollbackAvailable:Boolean(previousResponse) };
  try {
    return { installed: true, ...(await response.json()),rollbackAvailable:Boolean(previousResponse) };
  } catch {
    return { installed: false,rollbackAvailable:Boolean(previousResponse) };
  }
}

function safeLocalPaths(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && value.length <= 500))];
}

async function checkTodayReadiness(routes, audioAssets) {
  const requiredRoutes = safeLocalPaths(routes);
  const requiredAudioAssets = safeLocalPaths(audioAssets).filter((path) => path.startsWith("/audio/"));
  const [shell, pack] = await Promise.all([caches.open(SHELL_CACHE), caches.open(PACK_CACHE)]);
  const isAvailable = async (path) => Boolean((await pack.match(path)) || (await shell.match(path)));
  const missingRoutes = [];
  const missingAudioAssets = [];
  for (const route of requiredRoutes) if (!(await isAvailable(route))) missingRoutes.push(route);
  for (const asset of requiredAudioAssets) if (!(await isAvailable(asset))) missingAudioAssets.push(asset);
  return { policyVersion: "today-session-offline-readiness-v1", missingRoutes, missingAudioAssets, checkedAt: new Date().toISOString() };
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
  const measured=new Array(requests.length).fill(null);
  await mapWithConcurrency(requests,12,async(request,index)=>{
    const url = new URL(request.url);
    if (url.pathname === PACK_META_PATH) return;
    const response = await cache.match(request);
    if (!response) return;
    const headerBytes=Number(response.headers.get("content-length"));
    const byteSize=Number.isFinite(headerBytes)&&headerBytes>0?headerBytes:(await response.clone().arrayBuffer()).byteLength;
    measured[index]={byteSize,audioEntryCount:url.pathname.startsWith("/audio/")?1:0};
  });
  return measured.filter(Boolean).reduce((total,item)=>({byteSize:total.byteSize+item.byteSize,audioEntryCount:total.audioEntryCount+item.audioEntryCount}),{byteSize:0,audioEntryCount:0});
}

function selectPack(manifest, packId) {
  if (manifest?.format !== "dwnb-offline-routes" || manifest.version !== 2 || !Array.isArray(manifest.packs)) throw new Error("فهرس حزم المستويات غير صالح.");
  const pack = manifest.packs.find((item) => item.id === packId);
  if (!pack || !Array.isArray(pack.routes) || pack.routeCount !== pack.routes.length) throw new Error("حزمة المستوى المطلوبة غير معروفة.");
  return pack;
}

function audioBelongsToPack(asset, manifestPath, packId) {
  if (packId === "full") return true;
  if (manifestPath.includes("/exams/")) return packId === "b2";
  const ownerId = typeof asset.lessonId === "string" ? asset.lessonId : typeof asset.itemId === "string" ? asset.itemId : "";
  return ownerId.includes(`-${packId}-`) || ownerId.startsWith(`${packId}-`);
}

async function estimatePack(packId = "full", audioFormat = "mp3") {
  const [routeResponse, sizeResponse] = await Promise.all([
    fetch(OFFLINE_MANIFEST_PATH, { cache: "no-store" }),
    fetch(OFFLINE_SIZE_MANIFEST_PATH, { cache: "no-store" }),
  ]);
  if (!routeResponse.ok || !sizeResponse.ok) throw new Error("تعذر قراءة بيان الحجم قبل التنزيل.");
  const routeManifest = await routeResponse.json();
  const sizeManifest = await sizeResponse.json();
  const pack = selectPack(routeManifest, packId);
  const size = Array.isArray(sizeManifest.packs) ? sizeManifest.packs.find((item) => item.id === pack.id) : null;
  if (sizeManifest.format !== "dwnb-offline-size-manifest" || sizeManifest.version !== 1 || !size || size.routeCount !== pack.routeCount) throw new Error("بيان الحجم لا يطابق حزمة المستوى.");

  let audioByteSize = 0;
  let audioAssetCount = 0;
  for (const manifestPath of AUDIO_MANIFEST_PATHS) {
    const response = await fetch(manifestPath, { cache: "no-store" });
    if (!response.ok) continue;
    const manifest = await response.json();
    if (!Array.isArray(manifest.assets)) continue;
    for (const asset of manifest.assets.filter((item) => audioBelongsToPack(item, manifestPath, pack.id))) {
      const mp3Bytes = typeof asset.byteSize === "number" ? asset.byteSize : asset.bytes;
      const bytes=audioFormat==="opus"&&typeof asset.opusBytes==="number"?asset.opusBytes:mp3Bytes;
      if (typeof bytes === "number" && bytes >= 0) audioByteSize += bytes;
      if (typeof asset.path === "string" && asset.path.startsWith("/audio/")) audioAssetCount += 1;
    }
  }
  return {
    packId: pack.id,
    packLabel: pack.label,
    routeCount: pack.routeCount,
    compressedPageByteSize: size.totalGzipBytes,
    rawPageByteSize: size.totalRawBytes,
    nextAssetCount: size.nextAssetCount,
    sizeManifestFingerprint: sizeManifest.buildFingerprint,
    compressionPolicy: sizeManifest.compressionPolicy,
    audioByteSize,
    audioAssetCount,
    audioFormat:audioFormat==="opus"?"opus":"mp3",
  };
}

async function removePackAudio() {
  const pack = await caches.open(PACK_CACHE);
  const status = await readPackStatus();
  if (!status.installed) throw new Error("لا توجد حزمة مثبتة لحذف صوتها.");
  const requests = await pack.keys();
  let removedAudioCount = 0;
  for (const request of requests) {
    if (new URL(request.url).pathname.startsWith("/audio/")) {
      if (await pack.delete(request)) removedAudioCount += 1;
    }
  }
  const stats = await cachePayloadStats(pack);
  const metadata = { ...status, includesAudio: false, audioEntryCount: 0, byteSize: stats.byteSize, updatedAt: new Date().toISOString() };
  delete metadata.installed;
  await pack.put(PACK_META_PATH, new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" } }));
  return { ...metadata, removedAudioCount };
}

async function responseSha256(response) { const bytes=await response.clone().arrayBuffer(); const hash=await crypto.subtle.digest("SHA-256",bytes); return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function readCheckpoint(cache){const response=await cache.match(PACK_CHECKPOINT_PATH);try{return response?await response.json():null}catch{return null}}
async function saveCheckpoint(cache,checkpoint){await cache.put(PACK_CHECKPOINT_PATH,new Response(JSON.stringify(checkpoint),{headers:{"Content-Type":"application/json"}}))}
async function putWithCheckpoint(cache,path,response,checkpoint){const digest=await responseSha256(response);await cache.put(path,response);checkpoint.sha256[path]=digest;await saveCheckpoint(cache,checkpoint)}
async function validCheckpointEntry(cache,path,checkpoint){const response=await cache.match(path);return Boolean(response&&checkpoint.sha256[path]&&(await responseSha256(response))===checkpoint.sha256[path])}

async function replaceCacheFrom(sourceName,targetName){const source=await caches.open(sourceName);const requests=await source.keys();await caches.delete(targetName);const target=await caches.open(targetName);await mapWithConcurrency(requests,12,async(request)=>{const response=await source.match(request);if(response)await target.put(request,response)});return requests.length;}
async function rollbackToPreviousPack(){const previous=await caches.open(PACK_PREVIOUS_CACHE);const previousMeta=await previous.match(PACK_META_PATH);if(!previousMeta)throw new Error("لا توجد حزمة منهج سابقة سليمة للرجوع إليها.");await replaceCacheFrom(PACK_CACHE,PACK_STAGING_CACHE);await replaceCacheFrom(PACK_PREVIOUS_CACHE,PACK_CACHE);await replaceCacheFrom(PACK_STAGING_CACHE,PACK_PREVIOUS_CACHE);await caches.delete(PACK_STAGING_CACHE);const pack=await caches.open(PACK_CACHE);const metadata=await (await pack.match(PACK_META_PATH)).json();const rolled={...metadata,rollbackPolicyVersion:"previous-complete-curriculum-pack-rollback-v1",rolledBackAt:new Date().toISOString()};await pack.put(PACK_META_PATH,new Response(JSON.stringify(rolled),{headers:{"Content-Type":"application/json"}}));return{...rolled,rollbackAvailable:true};}

async function downloadSelectedPack(event, includeAudio, packId = "full", audioFormat = "mp3") {
  let cleanStaging = await caches.open(PACK_STAGING_CACHE);
  let checkpoint=await readCheckpoint(cleanStaging);
  if(!checkpoint||checkpoint.packId!==packId||checkpoint.includeAudio!==includeAudio||checkpoint.audioFormat!==audioFormat){await caches.delete(PACK_STAGING_CACHE);cleanStaging=await caches.open(PACK_STAGING_CACHE);checkpoint={version:1,packId,includeAudio,audioFormat,sha256:{},updatedAt:new Date().toISOString()};await saveCheckpoint(cleanStaging,checkpoint)}

  try {
    replyTo(event, { type: "DWNB_OFFLINE_PACK_PROGRESS", phase: "manifest", percent: 1, completed: 0, total: 0 });
    const manifestResponse = await fetch(OFFLINE_MANIFEST_PATH, { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error("تعذر تنزيل فهرس الحزمة.");
    const manifest = await manifestResponse.json();
    const selectedPack = selectPack(manifest, packId);
    const routes = [...new Set(selectedPack.routes)];
    const assets = new Set(["/manifest.webmanifest", "/offline-routes.json", "/offline-size-manifest.json", "/icons/app-icon.svg", "/favicon.ico"]);
    const audioSourceByCachePath=new Map();
    let completedRoutes = 0;

    await mapWithConcurrency(routes, 4, async (route) => {
      let response;
      if(await validCheckpointEntry(cleanStaging,route,checkpoint)) response=await cleanStaging.match(route);
      else { response = await fetch(route, { cache: "no-store", redirect: "follow" }); if (!response.ok) throw new Error(`فشل تنزيل المسار ${route}.`); await putWithCheckpoint(cleanStaging,route,response.clone(),checkpoint); }
      if ((response.headers.get("content-type") || "").includes("text/html")) {
        const html = await response.clone().text();
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
          for (const asset of audioManifest.assets.filter((item) => audioBelongsToPack(item, audioManifestPath, selectedPack.id))) {
            if (typeof asset.path === "string" && asset.path.startsWith("/audio/")) {assets.add(asset.path);if(audioFormat==="opus"&&typeof asset.opusPath==="string"&&asset.opusPath.startsWith("/audio/"))audioSourceByCachePath.set(asset.path,asset.opusPath);}
          }
        }
      }
    }

    const assetList = [...assets];
    let completedAssets = 0;
    await mapWithConcurrency(assetList, 6, async (asset) => {
      if(!(await validCheckpointEntry(cleanStaging,asset,checkpoint))){const source=audioSourceByCachePath.get(asset)??asset;const response = await fetch(source, { cache: "no-store" });if (!response.ok) throw new Error(`فشل تنزيل مورد الحزمة ${source}.`);await putWithCheckpoint(cleanStaging,asset,response,checkpoint);}
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
    await cleanStaging.delete(PACK_CHECKPOINT_PATH);
    const stats = await cachePayloadStats(cleanStaging);
    const currentPack=await caches.open(PACK_CACHE);const currentMetadata=await currentPack.match(PACK_META_PATH);if(currentMetadata)await replaceCacheFrom(PACK_CACHE,PACK_PREVIOUS_CACHE);
    await caches.delete(PACK_CACHE);
    const pack = await caches.open(PACK_CACHE);
    const stagedRequests = await cleanStaging.keys();
    await mapWithConcurrency(stagedRequests,12,async(request)=>{
      const response = await cleanStaging.match(request);
      if (response) await pack.put(request, response);
    });

    const sizeEstimate = await estimatePack(selectedPack.id,audioFormat);
    const metadata = {
      manifestVersion: manifest.version,
      curriculumVersion: CURRICULUM_VERSION,
      completedAt: new Date().toISOString(),
      packId: selectedPack.id,
      packLabel: selectedPack.label,
      routeCount: routes.length,
      compressedPageByteSize: sizeEstimate.compressedPageByteSize,
      sizeManifestFingerprint: sizeEstimate.sizeManifestFingerprint,
      assetCount: assetList.length,
      entryCount: stagedRequests.length,
      includesAudio: includeAudio,
      audioFormat:includeAudio?(audioFormat==="opus"?"opus":"mp3"):"none",
      audioEntryCount: stats.audioEntryCount,
      byteSize: stats.byteSize,
    };
    await pack.put(PACK_META_PATH, new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" } }));
    await caches.delete(PACK_STAGING_CACHE);
    replyTo(event, { type: "DWNB_OFFLINE_PACK_COMPLETE", ...metadata, percent: 100 });
  } catch (error) {
    checkpoint.updatedAt=new Date().toISOString();await saveCheckpoint(cleanStaging,checkpoint);
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
  await Promise.all(keys
    .filter((key) => (key.startsWith("dwnb-shell-") && key !== SHELL_CACHE) || (key.startsWith("dwnb-full-pack-") && key !== PACK_CACHE && key !== PACK_STAGING_CACHE && key !== PACK_PREVIOUS_CACHE))
    .map((key) => caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type === "DWNB_TODAY_READINESS_CHECK") {
    event.waitUntil(checkTodayReadiness(event.data?.routes, event.data?.audioAssets)
      .then((result) => replyTo(event, { type: "DWNB_TODAY_READINESS_RESULT", ...result }))
      .catch((error) => replyTo(event, { type: "DWNB_TODAY_READINESS_ERROR", message: error instanceof Error ? error.message : "تعذر فحص موارد جلسة اليوم." })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_STATUS") {
    event.waitUntil(readPackStatus().then((status) => replyTo(event, { type: "DWNB_OFFLINE_PACK_STATUS", ...status })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_ESTIMATE") {
    event.waitUntil(estimatePack(event.data?.packId || "full",event.data?.audioFormat || "mp3")
      .then((estimate) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ESTIMATE", ...estimate }))
      .catch((error) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: error instanceof Error ? error.message : "تعذر حساب حجم الصوت." })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_REMOVE_AUDIO") {
    event.waitUntil(removePackAudio()
      .then((result) => replyTo(event, { type: "DWNB_OFFLINE_PACK_AUDIO_REMOVED", installed: true, ...result }))
      .catch((error) => replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: error instanceof Error ? error.message : "تعذر حذف الصوت." })));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_ROLLBACK") {
    event.waitUntil(rollbackToPreviousPack()
      .then((result)=>replyTo(event,{type:"DWNB_OFFLINE_PACK_ROLLED_BACK",installed:true,...result}))
      .catch((error)=>replyTo(event,{type:"DWNB_OFFLINE_PACK_ERROR",message:error instanceof Error?error.message:"تعذر الرجوع إلى الحزمة السابقة."})));
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_REMOVE") {
    event.waitUntil((async () => {
      await Promise.all([caches.delete(PACK_CACHE), caches.delete(PACK_STAGING_CACHE), caches.delete(PACK_PREVIOUS_CACHE)]);
      replyTo(event, { type: "DWNB_OFFLINE_PACK_REMOVED" });
    })());
    return;
  }
  if (type === "DWNB_OFFLINE_PACK_DOWNLOAD") {
    if (activePackDownload) {
      replyTo(event, { type: "DWNB_OFFLINE_PACK_ERROR", message: "تنزيل الحزمة جارٍ بالفعل." });
      return;
    }
    activePackDownload = downloadSelectedPack(event, event.data?.includeAudio === true, event.data?.packId || "full",event.data?.audioFormat || "mp3").finally(() => {
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
      if (event.request.mode === "navigate") return (await caches.match("/offline")) || (await caches.match("/today")) || Response.error();
      return new Response("Offline resource unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
