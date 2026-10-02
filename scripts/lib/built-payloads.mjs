import { readFile, stat } from "node:fs/promises";
import path from "node:path";

async function readOptional(file) {
  try { return await readFile(file); }
  catch (error) { if (error.code === "ENOENT" || error.code === "ENOTDIR") return null; throw error; }
}

function containedPath(directory, relative, label) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe built payload path for ${label}`);
  }
  const file = path.resolve(directory, relative);
  if (!file.startsWith(`${path.resolve(directory)}${path.sep}`)) throw new Error(`Unsafe built payload path for ${label}`);
  return file;
}

function routeName(route) {
  if (typeof route !== "string" || !route.startsWith("/") || route.startsWith("//") || /[\\?#\0]/u.test(route) || route.split("/").some(part => part === ".." || part === ".")) {
    throw new Error(`Unsafe Offline route: ${route}`);
  }
  return route === "/" ? "index" : route.slice(1);
}

async function firstExisting(files, root, label) {
  for (const file of files) {
    try { if ((await stat(file)).isFile()) return file; }
    catch (error) { if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error; }
  }
  throw new Error(`Missing built Offline payload for ${label}: ${files.map(file => path.relative(root, file)).join(" or ")}`);
}

/**
 * Next 16 platform adapters package static/prerender outputs before npm postbuild.
 * @vercel/next emits distDir/output/{static,functions}; the CLI may expose the
 * same Build Output API under .vercel/output. Prefer a declared v3 deployment
 * layout, never mix a missing deployed page with a stale .next/server fallback.
 */
export async function discoverBuiltPayloads(root) {
  const nextRoot = path.join(root, ".next");
  let deploymentRoot = null;
  let deploymentConfig = null;
  for (const directory of [path.join(nextRoot, "output"), path.join(root, ".vercel/output")]) {
    const bytes = await readOptional(path.join(directory, "config.json"));
    if (bytes === null) continue;
    try { deploymentConfig = JSON.parse(bytes.toString("utf8")); }
    catch { throw new Error(`Invalid Build Output API config: ${path.relative(root, directory)}/config.json`); }
    if (deploymentConfig.version !== 3) throw new Error(`Unsupported Build Output API version in ${path.relative(root, directory)}`);
    deploymentRoot = directory;
    break;
  }
  const staticRoot = deploymentRoot ? path.join(deploymentRoot, "static") : null;
  const functionsRoot = deploymentRoot ? path.join(deploymentRoot, "functions") : null;
  const nextStaticRoot = deploymentRoot ? path.join(staticRoot, "_next/static") : path.join(nextRoot, "static");

  async function routeOutputPath(route) {
    const name = routeName(route);
    if (!deploymentRoot) {
      const relative = route === "/manifest.webmanifest" || route === "/favicon.ico" ? `${name}.body` : `${name}.html`;
      return firstExisting([containedPath(path.join(nextRoot, "server/app"), relative, route)], root, route);
    }

    // The fallback path in Build Output API metadata is authoritative: it can
    // end in .html or .body and is relative to the prerender config's directory.
    const prerender = containedPath(functionsRoot, `${name}.prerender-config.json`, route);
    const bytes = await readOptional(prerender);
    if (bytes !== null) {
      let config;
      try { config = JSON.parse(bytes.toString("utf8")); }
      catch { throw new Error(`Invalid prerender config for ${route}`); }
      if (typeof config.fallback !== "string" || !config.fallback) throw new Error(`Missing built Offline payload for ${route}: prerender has no static fallback`);
      const fallback = containedPath(path.dirname(prerender), config.fallback, route);
      // Permit nested fallback paths, but never escape the deployment functions root.
      if (!fallback.startsWith(`${path.resolve(functionsRoot)}${path.sep}`)) throw new Error(`Unsafe built payload path for ${route}`);
      return firstExisting([fallback], root, route);
    }

    const overrides = deploymentConfig.overrides ?? {};
    const candidates = [];
    for (const [file, override] of Object.entries(overrides)) {
      if (typeof override?.path !== "string") continue;
      const pathname = `/${override.path.replace(/^\/+|\/+$/gu, "")}`;
      if (pathname === route) candidates.push(containedPath(staticRoot, file.replace(/^\.\//u, ""), route));
    }
    // Files copied from public are served verbatim. Static HTML can be named
    // index.html or use Vercel's html override; do not invent HTML for a route.
    if (route === "/") candidates.push(containedPath(staticRoot, "index.html", route), containedPath(staticRoot, ".html", route));
    else if (route === "/manifest.webmanifest" || route === "/favicon.ico") candidates.push(containedPath(staticRoot, name, route));
    else candidates.push(containedPath(staticRoot, `${name}.html`, route));
    return firstExisting([...new Set(candidates)], root, route);
  }

  return {
    kind: deploymentRoot ? "build-output-api-v3" : "next-server-app",
    nextRoot,
    nextStaticRoot,
    deploymentRoot,
    staticRoot,
    routeOutputPath,
    // This public file has already been copied by the adapter. Postbuild must
    // publish the freshly measured manifest into BOTH source and serving output.
    sizeManifestOutputs: [path.join(root, "public/offline-size-manifest.json"), ...(staticRoot ? [path.join(staticRoot, "offline-size-manifest.json")] : [])],
  };
}
