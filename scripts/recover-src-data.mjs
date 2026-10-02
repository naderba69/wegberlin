#!/usr/bin/env node
/**
 * src/data recovery + backup driver (2026-09-21).
 *
 * Why this exists: the authored drill/curriculum data (`src/data/exercises/**`,
 * `src/data/curriculum/**`, `src/data/micro-drills/**`, …) is the product, and on 2026-09-21 two
 * separate losses happened:
 *  - the remote never received it (a clean clone of `main` @368d6e8 tracks 79 `src/data` files and
 *    0 under the drill directories);
 *  - a sandbox snapshot revert removed it from the working tree while `src/data/*.ts` stayed.
 * Either loss silently yields a repo that looks deployable and is empty. This script finds any
 * complete copy that still exists on the machine, restores it, and keeps a compressed mirror in
 * `scratch/` so a future revert is survivable.
 *
 * Usage:
 *   node scripts/recover-src-data.mjs probe            # report only
 *   node scripts/recover-src-data.mjs restore [--from <zip|dir>] [--apply]
 *   node scripts/recover-src-data.mjs backup           # write scratch/src-data-backup.tar.gz
 *   node scripts/recover-src-data.mjs verify           # tree + archive + mirror agree
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const DATA = path.join(ROOT, "src", "data");
const MIRROR = path.join(ROOT, "scratch", "src-data-backup.tar.gz");
const REQUIRED_DIRS = ["src/data/exercises", "src/data/curriculum", "src/data/micro-drills"];
// Measured minima for a generation that is fit to deliver (the v155 tree held 1,202 src/data files).
const MIN_FILES = { "src/data/exercises": 900, "src/data/curriculum": 30, "src/data/micro-drills": 10 };
const SEARCH_ROOTS = [
  process.env.HOME,
  path.join(process.env.HOME ?? "", "storage", "downloads"),
  path.join(process.env.HOME ?? "", "Downloads"),
  path.dirname(ROOT),
].filter((v, i, a) => v && a.indexOf(v) === i);

const say = (m) => console.log(m);
const die = (m) => { console.error(`recovery refused: ${m}`); process.exit(1); };
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, ...opts }).trim();
const MISSING = -1;
const show = (n) => (n === MISSING ? "missing" : String(n));
const countFiles = (dir) => {
  if (!existsSync(dir)) return MISSING;
  return sh("find", [dir, "-type", "f"]).split("\n").filter(Boolean).length;
};
const census = (base, prefix = "") =>
  Object.fromEntries(
    REQUIRED_DIRS.map((rel) => {
      return [rel, countFiles(prefix ? path.join(base, prefix, rel) : path.join(base, rel))];
    }),
  );
const fit = (c) => REQUIRED_DIRS.every((rel) => c[rel] >= MIN_FILES[rel]);
// `tar -t` lists directory members too; only real files count as data.
const tarDataEntries = (file) =>
  sh("tar", ["-tzf", file]).split("\n").filter((l) => l && !l.endsWith("/") && /src\/data\/(exercises|curriculum|micro-drills)\//.test(l));
const fp = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);

const listCandidates = () => {
  const found = [];
  for (const root of SEARCH_ROOTS) {
    if (!existsSync(root)) continue;
    let entries = [];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (/\.zip$/i.test(name)) found.push({ kind: "zip", path: path.join(root, name) });
      else if (statSync(path.join(root, name), { throwIfNoEntry: false })?.isDirectory() && /^(der-weg-nach-berlin|wegberlin.*upload|.*stage.*)$/i.test(name)) {
        found.push({ kind: "dir", path: path.join(root, name) });
      }
    }
  }
  return found;
};

const measure = (cand) => {
  if (cand.kind === "dir") {
    // Either <dir>/src/data or <dir>/der-weg-nach-berlin/src/data
    const direct = census(cand.path);
    if (REQUIRED_DIRS.some((rel) => direct[rel] >= 0)) return { counts: direct, prefix: "" };
    return { counts: census(cand.path, "der-weg-nach-berlin"), prefix: "der-weg-nach-berlin" };
  }
  const listing = sh("unzip", ["-Z1", cand.path]);
  const names = listing.split("\n").filter(Boolean);
  const counts = {};
  for (const rel of REQUIRED_DIRS) {
    counts[rel] = names.filter((n) => !n.endsWith("/") && n.includes(`${rel}/`)).length;
  }
  const prefix = names.some((n) => n.startsWith("src/data/")) ? "" : names.find((n) => /\/src\/data\//.test(n))?.split("/src/data/")[0] ?? "";
  return { counts, prefix, members: names.length };
};

const mode = process.argv[2];
if (!mode) die("usage: node scripts/recover-src-data.mjs <probe|restore|backup|verify> [flags]");

const current = census(ROOT);
say(`tree src/data: total ${countFiles(DATA)} file(s) · ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}=${show(current[r])}`).join(" · ")}`);
say(`fitness (minimum for a deliverable generation): ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}>=${MIN_FILES[r]}`).join(" · ")}`);
say(`tree is ${fit(current) ? "COMPLETE" : "INCOMPLETE"}`);

if (mode === "probe") {
  const cands = listCandidates();
  if (!cands.length) say("candidates: none found in " + SEARCH_ROOTS.join(", "));
  for (const c of cands) {
    let m;
    try {
      m = measure(c);
    } catch {
      say(`  ${c.path} → unreadable`);
      continue;
    }
    say(`  ${c.path} → ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}=${show(m.counts[r])}`).join(" · ")}${m.members ? ` · members ${m.members}` : ""} · ${fit(m.counts) ? "COMPLETE ✓" : "incomplete"}`);
  }
  if (existsSync(MIRROR)) {
    const n = tarDataEntries(MIRROR).length;
    say(`mirror: ${MIRROR} · ${statSync(MIRROR).size} bytes · ${n} data entries inside`);
  } else say(`mirror: none (run: node scripts/recover-src-data.mjs backup)`);
  process.exit(0);
}

if (mode === "backup") {
  if (!fit(current)) die(`refusing to snapshot an incomplete tree (${REQUIRED_DIRS.map((r) => `${r}=${show(current[r])}`).join(" · ")}) — that would record the loss as a backup`);
  mkdirSync(path.dirname(MIRROR), { recursive: true });
  rmSync(MIRROR, { force: true });
  sh("tar", ["-czf", MIRROR, "-C", ROOT, "src/data"]);
  const n = tarDataEntries(MIRROR).length;
  writeFileSync(`${MIRROR}.sha256`, `${fp(sh("sha256sum", [MIRROR]).split(" ")[0])}\n`);
  say(`mirror written: ${MIRROR} · ${statSync(MIRROR).size} bytes · ${n} data entries · sha12 ${readFileSync(`${MIRROR}.sha256`, "utf8").trim()}`);
  process.exit(0);
}

if (mode === "verify") {
  if (!fit(current)) die(`tree incomplete: ${REQUIRED_DIRS.map((r) => `${r}=${show(current[r])}`).join(" · ")}`);
  if (!existsSync(MIRROR)) die(`no mirror to compare against: ${MIRROR}`);
  const mirrorCount = tarDataEntries(MIRROR).length;
  const treeCount = REQUIRED_DIRS.reduce((a, r) => a + current[r], 0);
  if (mirrorCount !== treeCount) die(`mirror holds ${mirrorCount} data files, the tree holds ${treeCount} — restore or re-backup`);
  say(`verify: tree ${treeCount} data files == mirror ${mirrorCount} · src/data total ${countFiles(DATA)}`);
  say("next: npm run case:audit && npm run archive:delivery");
  process.exit(0);
}

if (mode === "restore") {
  const fromIdx = process.argv.indexOf("--from");
  const apply = process.argv.includes("--apply");
  const cands = fromIdx > -1 ? [{ kind: process.argv[fromIdx + 1].endsWith(".zip") ? "zip" : "dir", path: process.argv[fromIdx + 1] }] : listCandidates();
  const scored = cands
    .map((c) => {
      try {
        return { ...c, ...measure(c) };
      } catch {
        return { ...c, counts: {}, error: true };
      }
    })
    .filter((c) => !c.error && fit(c.counts))
    .sort((a, b) => b.counts["src/data/exercises"] - a.counts["src/data/exercises"]);
  if (!scored.length) die("no candidate holds a complete src/data — restore the project copy that has it (or push the flat archive from a complete machine)");
  const best = scored[0];
  say(`best candidate: ${best.path} (${best.kind}) · ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}=${best.counts[r]}`).join(" · ")}`);
  const stage = path.join(ROOT, "scratch", "restore-stage");
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  if (best.kind === "zip") sh("unzip", ["-q", best.path, "-d", stage]);
  // Copy the *contents* of a candidate directory so the staged layout mirrors the ZIP case.
  else execFileSync("cp", ["-a", `${best.path}/.`, `${stage}/`], { stdio: "ignore" });
  const base = best.prefix ? path.join(stage, best.prefix) : stage;
  const srcRoot = path.join(base, "src", "data");
  if (!existsSync(srcRoot)) die(`staged tree has no src/data at ${srcRoot}`);
  const staged = census(base);
  say(`staged data: ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}=${show(staged[r])}`).join(" · ")}`);
  if (!fit(staged)) die(`staged copy is still incomplete — refusing to overwrite the tree`);
  if (!apply) {
    say("dry run only — pass --apply to write into src/data (it never deletes: only copies in what is missing)");
    rmSync(stage, { recursive: true, force: true });
    process.exit(0);
  }
  const stagedRoot = base;
  for (const rel of REQUIRED_DIRS) {
    const from = path.join(stagedRoot, rel);
    const to = path.join(ROOT, rel);
    mkdirSync(to, { recursive: true });
    // Never delete: only the missing files are copied in, existing ones are overwritten in place.
    execFileSync("cp", ["-a", `${from}/.`, `${to}/`], { stdio: "inherit" });
  }
  rmSync(stage, { recursive: true, force: true });
  const after = census(ROOT);
  say(`after restore: ${REQUIRED_DIRS.map((r) => `${r.split("/").pop()}=${show(after[r])}`).join(" · ")} · src/data total ${countFiles(DATA)}`);
  if (!fit(after)) die(`tree still incomplete after restore (${REQUIRED_DIRS.map((r) => `${r}=${show(after[r])}`).join(" · ")})`);
  say("restored — run: node scripts/recover-src-data.mjs backup && npm run case:audit && npm run archive:delivery");
  process.exit(0);
}

die(`unknown mode: ${mode}`);
