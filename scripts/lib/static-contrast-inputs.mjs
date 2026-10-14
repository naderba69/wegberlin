import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { discoverBuiltPayloads } from "./built-payloads.mjs";

async function walk(directory, output = []) {
  let entries;
  try { entries = await readdir(directory); }
  catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return output;
    throw error;
  }
  for (const entry of entries) {
    const file = path.join(directory, entry);
    const details = await stat(file);
    if (details.isDirectory()) await walk(file, output);
    else output.push(file);
  }
  return output;
}

function normalizePageKey(value) {
  return value.split(path.sep).join("/").replace(/\.html$/u, "").replace(/\/index$/u, "") || "index";
}

function routeFromPageKey(key) {
  return key === "index" ? "/" : `/${key}`;
}

function within(parent, child) {
  const resolvedParent = path.resolve(parent);
  const resolvedChild = path.resolve(child);
  return resolvedChild.startsWith(`${resolvedParent}${path.sep}`);
}

/**
 * Locate static HTML and CSS whether Next leaves its normal `.next/server/app`
 * output in place or a platform adapter has packaged it as Build Output API v3.
 * Dynamic function bundles are intentionally excluded: the contrast audit is a
 * static/prerendered-page guard, not a runtime rendering claim.
 */
export async function discoverStaticContrastInputs(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const built = await discoverBuiltPayloads(root);
  const pagesByKey = new Map();

  if (!built.deploymentRoot) {
    const appDirectory = path.join(built.nextRoot, "server/app");
    for (const file of await walk(appDirectory)) {
      if (!file.endsWith(".html")) continue;
      const key = normalizePageKey(path.relative(appDirectory, file));
      pagesByKey.set(key, { key, route: routeFromPageKey(key), file });
    }
  } else {
    const functionsDirectory = path.join(built.deploymentRoot, "functions");
    for (const configFile of await walk(functionsDirectory)) {
      if (!configFile.endsWith(".prerender-config.json")) continue;
      let config;
      try { config = JSON.parse(await readFile(configFile, "utf8")); }
      catch { throw new Error(`Invalid prerender config: ${path.relative(root, configFile)}`); }
      if (typeof config.fallback !== "string" || !config.fallback.toLowerCase().endsWith(".html")) continue;

      const key = normalizePageKey(path.relative(functionsDirectory, configFile).replace(/\.prerender-config\.json$/u, ""));
      const route = routeFromPageKey(key);
      const file = await built.routeOutputPath(route);
      if (!within(functionsDirectory, file)) throw new Error(`Unsafe static contrast page path for ${route}`);
      pagesByKey.set(key, { key, route, file });
    }

    // Build Output API v3 can express a static HTML route as an override rather
    // than a prerender config. Include these routes too; routeOutputPath applies
    // the adapter's validated mapping and rejects paths escaping its static root.
    let deploymentConfig;
    try { deploymentConfig = JSON.parse(await readFile(path.join(built.deploymentRoot, "config.json"), "utf8")); }
    catch { throw new Error(`Invalid Build Output API config: ${path.relative(root, built.deploymentRoot)}/config.json`); }
    for (const [asset, override] of Object.entries(deploymentConfig.overrides ?? {})) {
      if (typeof override?.path !== "string" || !asset.toLowerCase().endsWith(".html")) continue;
      const route = `/${override.path.replace(/^\/+|\/+$/gu, "")}`;
      const key = normalizePageKey(route.slice(1));
      const file = await built.routeOutputPath(route);
      pagesByKey.set(key, { key, route, file });
    }
  }

  const cssDirectory = path.join(built.nextStaticRoot, "css");
  const cssFiles = (await walk(cssDirectory)).filter((file) => file.endsWith(".css"));
  return {
    kind: built.kind,
    pages: [...pagesByKey.values()].sort((left, right) => left.key.localeCompare(right.key)),
    cssFiles: cssFiles.sort((left, right) => left.localeCompare(right)),
  };
}
