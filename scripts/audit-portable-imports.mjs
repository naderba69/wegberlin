#!/usr/bin/env node
/**
 * Refuses any source file that imports, reads, or requires a path which only exists on the
 * machine that wrote it.
 *
 * Why this exists: on 2026-09-22 a Vercel build failed with seven `TS2307: Cannot find module
 * '/home/user/der-weg-nach-berlin/src/data/academic-lessons'` errors. Six files — five archived
 * run-log probes plus `scripts/audit-explanation-quotes.ts` — imported the sandbox's ABSOLUTE
 * path. Local `tsc --noEmit` passed every time, because on the authoring box that path resolves.
 * The tree type-checked here and could not type-check anywhere else, and nothing measured the
 * difference. tsconfig includes every .ts in the repo, so archived probes are inside the build's
 * type-check surface and a broken one fails the deploy.
 *
 * Rule: inside a module specifier or a filesystem call, no string may start with an absolute
 * machine path (/home/..., /Users/..., /root/..., C:\...). Use the @/ alias (which
 * tsconfig maps to `./src/*`, and which tsx resolves too) or a relative path.
 *
 * Usage: node scripts/audit-portable-imports.mjs [--json]
 * Exit:  0 = every path is portable · 1 = at least one machine-local path
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const asJson = process.argv.includes("--json");
// Scan root: an explicit positional argument wins, then the caller's cwd when it is clearly a
// different project tree, else the repo this script lives in. Honouring cwd lets the guard be
// exercised against a fixture tree (tests/unit/portable-imports.test.ts) instead of only itself.
const SELF_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const positional = process.argv.slice(2).find((a) => !a.startsWith("--"));
const ROOT = positional
  ? path.resolve(positional)
  : process.cwd() !== SELF_ROOT && !process.cwd().startsWith(`${SELF_ROOT}${path.sep}`)
    ? process.cwd()
    : SELF_ROOT;

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "coverage", "public", "reports",
  "test-results", "playwright-report", "__pycache__", ".venv"]);
const EXTS = new Set([".ts", ".tsx", ".mts", ".cts", ".mjs", ".cjs", ".js", ".jsx"]);

// Absolute machine paths. `/tmp` is excluded on purpose: scripts legitimately stage scratch files
// there, and it exists on every builder.
const MACHINE_PATH = /(?:\/home\/|\/Users\/|\/root\/|[A-Za-z]:\\\\)/;

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...walk(full));
    } else if (EXTS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
};

const findings = [];
let scanned = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  scanned += 1;
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    // Only flag machine paths in positions that actually resolve at build/run time — a path
    // inside a comment or a printed message is documentation, not a dependency.
    const patterns = [
      /\bfrom\s+["']([^"']+)["']/g,                    // import … from "…"
      /\bimport\s*\(\s*["']([^"']+)["']/g,             // dynamic import("…")
      /\brequire\s*\(\s*["']([^"']+)["']/g,            // require("…")
      /\b(?:readFileSync|writeFileSync|readdirSync|existsSync|statSync|createReadStream|createWriteStream|rmSync|mkdirSync|open|readFile|writeFile)\s*\(\s*["']([^"']+)["']/g,
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(line)) !== null) {
        const spec = m[1];
        if (!MACHINE_PATH.test(spec)) continue;
        // Escape hatch for deliberate literals (regression fixtures that must contain the bad
        // shape). Must be explicit and on the same line, so it can never hide a real import.
        if (/portable-imports-allow/.test(line)) continue;
        findings.push({ file: rel, line: i + 1, spec, snippet: line.trim().slice(0, 120) });
      }
    }
  });
}

if (asJson) {
  console.log(JSON.stringify({ scanned, findings }, null, 1));
} else {
  for (const f of findings) {
    console.log(`${f.file}:${f.line}  machine-local path  ${f.spec}`);
    console.log(`    ${f.snippet}`);
  }
  console.log(
    `\nportable-import audit: ${scanned} source file(s) · ${findings.length} machine-local path(s)` +
    (findings.length
      ? " ⇒ FIX: this type-checks here and nowhere else (a Vercel build already failed on exactly this)\n  use the @/* alias (tsconfig maps it to ./src/*) or a relative path"
      : " ✓"),
  );
}
process.exit(findings.length ? 1 : 0);
