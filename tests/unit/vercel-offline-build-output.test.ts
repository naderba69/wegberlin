// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { generateOfflineSizeManifest } from "../../scripts/generate-offline-size-manifest.mjs";
import { auditJavaScriptBudgets } from "../../scripts/audit-js-budgets.mjs";
import { discoverBuiltPayloads } from "../../scripts/lib/built-payloads.mjs";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const html = Buffer.from(`<html>${"<p>Original static learning content</p>".repeat(40)}<script src="/_next/static/chunks/app/lernen/%5BlessonId%5D/page.js"></script><link href="/_next/static/css/styles.css" rel="stylesheet"></html>`);
const script = Buffer.from("window.lessonReady = true;\n".repeat(80));
const css = Buffer.from("body{color:#163a36}\n".repeat(30));
const icon = Buffer.from([0, 0, 1, 0, 2, 3, 4, 5, 6]);
const webmanifest = Buffer.from(JSON.stringify({ name: "Der Weg nach Berlin" }));
const routes = { version: 2, packs: [{ id: "a1", label: "A1", routeCount: 3, routes: ["/", "/lernen/a1-01", "/manifest.webmanifest"] }, { id: "full", label: "Full", routeCount: 3, routes: ["/", "/lernen/a1-01", "/manifest.webmanifest"] }] };

async function put(root: string, name: string, bytes: string | Buffer) {
  const file = path.join(root, name); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, bytes); return file;
}
async function fixture(kind: "local" | "adapter" | "cli" = "local") {
  const root = await mkdtemp(path.join(tmpdir(), "dwnb-build-output-")); temporary.push(root);
  await mkdir(path.join(root, "reports"));
  await put(root, "public/offline-routes.json", JSON.stringify(routes));
  await put(root, "public/icons/app-icon.svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
  const prefix = kind === "adapter" ? ".next/output" : ".vercel/output";
  const statics = kind === "local" ? ".next/static" : `${prefix}/static/_next/static`;
  await put(root, `${statics}/chunks/app/lernen/[lessonId]/page.js`, script);
  await put(root, `${statics}/css/styles.css`, css);
  if (kind === "local") {
    await put(root, ".next/server/app/index.html", html);
    await put(root, ".next/server/app/lernen/a1-01.html", html);
    await put(root, ".next/server/app/manifest.webmanifest.body", webmanifest);
    await put(root, ".next/server/app/favicon.ico.body", icon);
  } else {
    await put(root, `${prefix}/config.json`, JSON.stringify({ version: 3, overrides: {} }));
    for (const [name, extension, bytes] of [["index", "html", html], ["lernen/a1-01", "html", html], ["manifest.webmanifest", "body", webmanifest], ["favicon.ico", "body", icon]] as const) {
      await put(root, `${prefix}/functions/${name}.prerender-config.json`, JSON.stringify({ fallback: `${path.basename(name)}.prerender-fallback.${extension}` }));
      await put(root, `${prefix}/functions/${name}.prerender-fallback.${extension}`, bytes);
    }
    await put(root, `${prefix}/static/offline-routes.json`, JSON.stringify(routes));
    await put(root, `${prefix}/static/icons/app-icon.svg`, "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
    await put(root, `${prefix}/static/offline-size-manifest.json`, JSON.stringify({ stale: true }));
  }
  return { root, prefix, statics };
}

describe("postbuild Offline measurement after a Vercel Next adapter", () => {
  it("preserves the normal Next server/app build and exact gzip accounting", async () => {
    const { root } = await fixture(); const result = await generateOfflineSizeManifest({ projectRoot: root });
    expect(result.packs[0].routeRawBytes).toBe(html.length * 2 + webmanifest.length);
    expect(result.packs[0].routeGzipBytes).toBe(gzipSync(html, { level: 9 }).length * 2 + gzipSync(webmanifest, { level: 9 }).length);
    expect(result.packs[0].nextAssetCount).toBe(2);
    expect(result.packs[0].nextAssetRawBytes).toBe(script.length + css.length);
    expect(JSON.parse(await readFile(path.join(root, "public/offline-size-manifest.json"), "utf8"))).toEqual(result);
  });
  it("reads actual .next/output prerender fallbacks when server/app/index.html does not exist", async () => {
    const { root } = await fixture("adapter"); const result = await generateOfflineSizeManifest({ projectRoot: root });
    expect(result.packs[0].routeRawBytes).toBe(html.length * 2 + webmanifest.length);
    expect(result.packs[0].nextAssetCount).toBe(2);
    await expect(readFile(path.join(root, ".next/server/app/index.html"))).rejects.toThrow();
  });
  it("publishes the new size manifest into the adapter's serving output, not just public/", async () => {
    const { root, prefix } = await fixture("adapter"); const result = await generateOfflineSizeManifest({ projectRoot: root });
    const source = await readFile(path.join(root, "public/offline-size-manifest.json"), "utf8");
    expect(await readFile(path.join(root, prefix, "static/offline-size-manifest.json"), "utf8")).toBe(source);
    expect(JSON.parse(source).buildFingerprint).toBe(result.buildFingerprint);
    expect(source).not.toContain('"stale"');
  });
  it("supports the CLI's .vercel/output Build Output API location", async () => {
    const { root, prefix } = await fixture("cli"); const result = await generateOfflineSizeManifest({ projectRoot: root });
    expect(JSON.parse(await readFile(path.join(root, prefix, "static/offline-size-manifest.json"), "utf8"))).toEqual(result);
  });
  it("produces the same size/fingerprint for identical bytes in local and packaged layouts", async () => {
    const local = await fixture(); const packaged = await fixture("adapter");
    expect(await generateOfflineSizeManifest({ projectRoot: packaged.root })).toEqual(await generateOfflineSizeManifest({ projectRoot: local.root }));
  });
  it("handles static HTML overrides as well as binary metadata and favicon fallbacks", async () => {
    const { root, prefix } = await fixture("adapter");
    await rm(path.join(root, prefix, "functions/index.prerender-config.json"));
    await rm(path.join(root, prefix, "functions/lernen/a1-01.prerender-config.json"));
    await put(root, `${prefix}/config.json`, JSON.stringify({ version: 3, overrides: { ".html": { path: "/" }, "lernen/a1-01.html": { path: "lernen/a1-01" } } }));
    await put(root, `${prefix}/static/.html`, html); await put(root, `${prefix}/static/lernen/a1-01.html`, html);
    const result = await generateOfflineSizeManifest({ projectRoot: root }); expect(result.packs[0].routeRawBytes).toBe(html.length * 2 + webmanifest.length);
  });
  it("fails on a missing deployed page instead of measuring a stale local HTML fallback", async () => {
    const { root, prefix } = await fixture("adapter"); await rm(path.join(root, prefix, "functions/index.prerender-fallback.html"));
    await put(root, ".next/server/app/index.html", html);
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("Missing built Offline payload for /");
    expect(JSON.parse(await readFile(path.join(root, prefix, "static/offline-size-manifest.json"), "utf8"))).toEqual({ stale: true });
  });
  it("fails on a missing Next asset even when the old local asset is present", async () => {
    const { root, statics } = await fixture("adapter"); await rm(path.join(root, statics, "chunks/app/lernen/[lessonId]/page.js"));
    await put(root, ".next/static/chunks/app/lernen/[lessonId]/page.js", script);
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("Missing built Offline payload for /_next/static/");
  });
  it("rejects asset traversal and malformed percent encoding", async () => {
    const { root } = await fixture();
    await put(root, ".next/server/app/index.html", '<script src="/_next/static/%2e%2e/private.js"></script>');
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("Unsafe Next asset path in built HTML");
    await put(root, ".next/server/app/index.html", '<script src="/_next/static/%ZZ.js"></script>');
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("Invalid encoded Next asset path");
  });
  it("rejects a prerender fallback escaping the output directory", async () => {
    const { root, prefix } = await fixture("adapter"); await put(root, `${prefix}/functions/index.prerender-config.json`, JSON.stringify({ fallback: "../../private.html" }));
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("Unsafe built payload path");
  });
  it("does not treat invalid output config or a dynamic fallback as a static offline page", async () => {
    const { root, prefix } = await fixture("adapter"); await put(root, `${prefix}/config.json`, "{");
    await expect(discoverBuiltPayloads(root)).rejects.toThrow("Invalid Build Output API config");
    await put(root, `${prefix}/config.json`, JSON.stringify({ version: 3 }));
    await put(root, `${prefix}/functions/index.prerender-config.json`, JSON.stringify({ fallback: null }));
    await expect(generateOfflineSizeManifest({ projectRoot: root })).rejects.toThrow("prerender has no static fallback");
  });
  it("keeps JavaScript budget measurements and the 15% reserve identical after packaging", async () => {
    const local = await fixture(); const packaged = await fixture("adapter");
    const a = await auditJavaScriptBudgets({ projectRoot: local.root }); const b = await auditJavaScriptBudgets({ projectRoot: packaged.root });
    expect(b.actual).toEqual(a.actual); expect(b.safetyMarginPercent).toBe(15);
    expect(b.safetyCeilings).toEqual({ totalChunkGzipBytes: 2125000, maxSingleChunkGzipBytes: 637500 });
    expect(b.largest[0].path).toContain(".next/output/static/_next/static/chunks/");
  });
  it("fails rather than calling an empty deployed JS directory a passing zero-byte budget", async () => {
    const { root, statics } = await fixture("adapter"); await rm(path.join(root, statics, "chunks/app/lernen/[lessonId]/page.js"));
    await expect(auditJavaScriptBudgets({ projectRoot: root })).rejects.toThrow("No built JavaScript chunks");
  });
});
