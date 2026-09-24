#!/usr/bin/env node
/**
 * Generation-state probe (2026-09-22).
 *
 * Why this exists: a sandbox snapshot revert has hit this tree NINE times, and it is always
 * PARTIAL — some files come back at an older generation while others keep the current one.
 * A partial revert is invisible to the eye and to `git status` (this is not a git repo): the
 * app still builds, the docs still read correctly, and only a measurement disagrees.
 *
 * This script measures the tree against the generation the repo claims, and prints exactly
 * which surface drifted plus the command that repairs it. It NEVER writes anything.
 *
 * Surfaces measured:
 *   1. pack literal in public/sw.js vs the six other files that pin it
 *   2. explanation payloads in docs/run-logs/a2-explanations-payloads/ vs the live lessons
 *   3. cue/parallelism batches in docs/run-logs/ vs the live options arrays
 *   4. Sync batch: vNNN markers in the 13 standing documents vs the pack literal
 *   5. run-log directories referenced by the index vs what exists
 *   6. node_modules + swap (both vanish on revert and both cost a whole turn to re-diagnose)
 *
 * Usage: node scripts/verify-generation-state.mjs [--json]
 * Exit: 0 = no drift, 1 = drift found (the report lists the repair commands).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const asJson = process.argv.includes("--json");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => existsSync(path.join(ROOT, rel));
const findings = [];
const note = (surface, ok, detail, repair = null) => findings.push({ surface, ok, detail, repair });

// ─────────────────────────── 1. pack literal consistency ───────────────────────────
const PIN_FILES = [
  "tests/unit/offline-pack-controls.test.ts",
  "tests/unit/offline-recovery-partial-export.test.ts",
  "tests/unit/today-offline-readiness.test.ts",
  "tests/unit/offline-curriculum-rollback.test.ts",
  "tests/e2e/critical-flows.spec.ts",
  "scripts/verify-continuation-handoff.mjs",
];
const sw = read("public/sw.js");
const active = sw.match(/PACK_CACHE = "(dwnb-full-pack-v\d+)"/)?.[1] ?? null;
const staging = sw.match(/PACK_STAGING_CACHE = "(dwnb-full-pack-staging-v\d+)"/)?.[1] ?? null;
const previous = sw.match(/PACK_PREVIOUS_CACHE = "(dwnb-full-pack-previous-v\d+)"/)?.[1] ?? null;
const gen = active?.match(/v(\d+)$/)?.[1] ?? null;
const stale = [];
for (const rel of PIN_FILES) {
  if (!exists(rel)) { stale.push(`${rel}: MISSING`); continue; }
  const text = read(rel);
  const olderActive = [...text.matchAll(/dwnb-full-pack-v(\d+)(?![-\w])/g)].map((m) => m[1]).filter((v) => v !== gen);
  const olderSide = [...text.matchAll(/dwnb-full-pack-(?:staging|previous)-v(\d+)/g)]
    .map((m) => m[1])
    .filter((v) => v !== String(Number(gen) - 1));
  if (olderActive.length || olderSide.length) {
    stale.push(`${rel}: active v[${[...new Set(olderActive)]}] staging/previous v[${[...new Set(olderSide)]}]`);
  }
}
note("pack literals", stale.length === 0,
  stale.length ? `sw.js is ${active} / ${staging} / ${previous} but: ${stale.join(" · ")}` : `${active} · ${staging} · ${previous} consistent across 7 files`,
  stale.length ? `python3 scripts/bump-pack-generation.py --from v${Number(gen) - 1} --to v${gen} --write   # or hand-fix the listed files` : null);

// ─────────────── 2. explanation payloads vs live lessons (a2e1..a2eN) ───────────────
const payloadDir = "docs/run-logs/a2-explanations-payloads";
const lessonCache = new Map();
const lessonFiles = exists("src/data")
  ? readdirSync(path.join(ROOT, "src/data")).filter((f) => /^lessons-.*\.ts$/.test(f)).map((f) => `src/data/${f}`)
  : [];
for (const rel of lessonFiles) lessonCache.set(rel, read(rel));
const liveExplanation = (id) => {
  for (const [, text] of lessonCache) {
    const i = text.indexOf(`id:"${id}"`) >= 0 ? text.indexOf(`id:"${id}"`) : text.indexOf(`id: "${id}"`);
    if (i < 0) continue;
    const m = /explanationAr:\s*"((?:[^"\\]|\\.)*)"/.exec(text.slice(i, i + 3000));
    if (!m) return null;
    try { return JSON.parse(`"${m[1]}"`); } catch { return null; }
  }
  return null;
};
if (exists(payloadDir)) {
  // A later payload supersedes an earlier one for the same id (a2e5-fix1 rewrites an a2e5 item),
  // so replay order decides the expected text: batch number first, then fix number.
  const order = (f) => {
    const m = /a2e(\d+)(?:-fix(\d+))?\.json$/.exec(f);
    return m ? Number(m[1]) * 100 + Number(m[2] ?? 0) : Number.MAX_SAFE_INTEGER;
  };
  const payloads = readdirSync(path.join(ROOT, payloadDir))
    .filter((f) => /^a2e\d+(-fix\d+)?\.json$/.test(f))
    .sort((a, b) => order(a) - order(b));
  const authoritative = new Map(); // id -> { want, file }
  for (const file of payloads) {
    for (const [id, value] of Object.entries(JSON.parse(read(`${payloadDir}/${file}`)))) {
      authoritative.set(id, { want: typeof value === "string" ? value : value.explanationAr, file });
    }
  }
  const missBy = new Map();
  let applied = 0;
  for (const [id, { want, file }] of authoritative) {
    if (liveExplanation(id) === want) applied += 1;
    else missBy.set(file, (missBy.get(file) ?? 0) + 1);
  }
  const pending = [...missBy].map(([f, n]) => `${f} (${n})`);
  const superseded = payloads.length
    ? payloads.reduce((n, f) => n + Object.keys(JSON.parse(read(`${payloadDir}/${f}`))).length, 0) - authoritative.size
    : 0;
  note("explanation payloads", pending.length === 0,
    `${applied}/${authoritative.size} distinct items byte-identical in src/data` +
    `${superseded ? ` (${superseded} superseded by a later fix payload)` : ""}` +
    `${pending.length ? ` · pending: ${pending.join(", ")}` : ""}`,
    pending.length ? `for p in $(ls ${payloadDir}/a2e*.json | sort -t e -k3 -V); do python3 scripts/apply-explanation-batch.py --level a2 --payload "$p"; done` : null);
} else {
  note("explanation payloads", false, `${payloadDir} is missing entirely`, "restore the payload directory from a run-log copy");
}

// ─────────────── 3. cue/parallelism batches vs live options arrays ───────────────
const cueBatches = [];
const runLogRoot = path.join(ROOT, "docs/run-logs");
if (existsSync(runLogRoot)) {
  for (const dir of readdirSync(runLogRoot)) {
    if (!/cue-parallelism/.test(dir)) continue;
    const full = path.join(runLogRoot, dir);
    if (!statSync(full).isDirectory()) continue;
    for (const f of readdirSync(full)) if (f.endsWith("-batch.json")) cueBatches.push(`docs/run-logs/${dir}/${f}`);
  }
}
const liveOptions = (id) => {
  for (const [, text] of lessonCache) {
    let i = text.indexOf(`id:"${id}"`);
    if (i < 0) i = text.indexOf(`id: "${id}"`);
    if (i < 0) continue;
    const a = text.indexOf("options:", i);
    if (a < 0) return null;
    const open = text.indexOf("[", a);
    let depth = 0, quoted = false, esc = false, end = -1;
    for (let p = open; p < text.length; p += 1) {
      const ch = text[p];
      if (quoted) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') quoted = false; continue; }
      if (ch === '"') quoted = true;
      else if (ch === "[") depth += 1;
      else if (ch === "]") { depth -= 1; if (!depth) { end = p; break; } }
    }
    if (end < 0) return null;
    return [...text.slice(open + 1, end).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => {
      try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
    });
  }
  return null;
};
let cueItems = 0, cueApplied = 0;
const cuePending = [];
for (const rel of cueBatches.sort()) {
  const data = JSON.parse(read(rel));
  let miss = 0;
  for (const items of Object.values(data)) {
    for (const [id, opts] of Object.entries(items)) {
      if (!Array.isArray(opts) || opts.length !== 4) continue;
      cueItems += 1;
      const live = liveOptions(id);
      if (live && live.length === 4 && live.every((o, k) => o === opts[k])) cueApplied += 1; else miss += 1;
    }
  }
  if (miss) cuePending.push(`${path.basename(rel)} (${miss})`);
}
note("cue/parallelism batches", cuePending.length === 0,
  `${cueApplied}/${cueItems} items match the shipped batches${cuePending.length ? ` · pending: ${cuePending.join(", ")}` : ""}`,
  cuePending.length ? `for f in docs/run-logs/*cue-parallelism*/*-batch.json; do python3 scripts/parallelise-options.py --batch "$f" --write; done` : null);

// ─────────────── 4. Sync batch markers in the 13 standing documents ───────────────
const DOC_SYNC_FILES = ["AGENTS.md", "PROFESSIONAL_CONTINUATION_PROMPT_AR.md", "PROJECT_STATUS.md", "P0_AUDIT.md",
  "P1_AUDIT.md", "P2_AUDIT.md", "IDEA_BACKLOG.md", "DECISIONS.md", "ZERO_COST.md", "docs/MASTER_SPEC.md",
  "docs/CONTENT_COMPLETENESS_AUDIT.md", "docs/AUDIO_PRODUCTION_BACKLOG.md", "docs/SOURCE_FRESHNESS.md"];
const docDrift = [];
for (const rel of DOC_SYNC_FILES) {
  if (!exists(rel)) { docDrift.push(`${rel}: MISSING`); continue; }
  const head = read(rel).split("\n").slice(0, 12).join("\n");
  const marker = head.match(/Sync batch: v(\d+)/);
  if (!marker) docDrift.push(`${rel}: no marker`);
  else if (marker[1] !== gen) docDrift.push(`${rel}: v${marker[1]}`);
}
note("doc sync markers", docDrift.length === 0,
  docDrift.length ? `pack is v${gen} but: ${docDrift.join(" · ")}` : `13/13 documents on Sync batch: v${gen}`,
  docDrift.length ? "edit the first 12 lines of each listed document (ADR-079)" : null);

// ─────────────── 5. run-log directories referenced by the index ───────────────
if (exists("docs/run-logs/README.md")) {
  const index = read("docs/run-logs/README.md");
  const listed = [...index.matchAll(/^\| `([^`]+)` \| (\d+) \|/gm)].map((m) => ({ dir: m[1], n: Number(m[2]) }));
  const onDisk = readdirSync(runLogRoot).filter((d) => statSync(path.join(runLogRoot, d)).isDirectory());
  const missing = listed.filter((row) => !onDisk.includes(row.dir)).map((r) => r.dir);
  const unlisted = onDisk.filter((d) => !listed.some((r) => r.dir === d));
  const totalOnDisk = onDisk.reduce((sum, d) => {
    const walk = (p) => readdirSync(p, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? walk(path.join(p, e.name)) : 1), 0);
    return sum + walk(path.join(runLogRoot, d));
  }, 0);
  const claimed = index.match(/العدد الإجمالي: \*\*(\d+)\*\* مجلد سجلّات، و\*\*(\d+)\*\* ملفًا/);
  const countOk = claimed && Number(claimed[1]) === onDisk.length && Number(claimed[2]) === totalOnDisk;
  note("run-log index", missing.length === 0 && unlisted.length === 0 && countOk,
    `${onDisk.length} dirs / ${totalOnDisk} files on disk; index claims ${claimed ? `${claimed[1]}/${claimed[2]}` : "nothing"}` +
    `${missing.length ? ` · listed-but-gone: ${missing.join(", ")}` : ""}${unlisted.length ? ` · on-disk-but-unlisted: ${unlisted.join(", ")}` : ""}`,
    missing.length || unlisted.length || !countOk ? "regenerate docs/run-logs/README.md BY COUNTING (never by prose)" : null);
}

// ─────────────── 6. environment: node_modules + swap ───────────────
const hasModules = exists("node_modules") && readdirSync(path.join(ROOT, "node_modules")).length > 50;
note("node_modules", hasModules, hasModules ? "present" : "missing or empty (a revert wipes it)", hasModules ? null : "npm ci --no-audit");
let swapKb = 0;
try { swapKb = Number(/SwapTotal:\s+(\d+)/.exec(readFileSync("/proc/meminfo", "utf8"))?.[1] ?? 0); } catch { /* ignore */ }
note("swap", swapKb > 0, swapKb > 0 ? `${Math.round(swapKb / 1024)} MB active` : "0 MB — `next build` will hang at \"Running TypeScript\" on this box",
  swapKb > 0 ? null : "sudo -n fallocate -l 2G ~/.swapfile && sudo -n chmod 600 ~/.swapfile && sudo -n mkswap ~/.swapfile && sudo -n swapon ~/.swapfile");

// ─────────────────────────────── report ───────────────────────────────
const drift = findings.filter((f) => !f.ok);
if (asJson) {
  console.log(JSON.stringify({ generation: gen, active, staging, previous, findings, drift: drift.length }, null, 1));
} else {
  console.log(`generation state probe — pack ${active ?? "?"} (staging ${staging ?? "?"} / previous ${previous ?? "?"})\n`);
  for (const f of findings) console.log(`${f.ok ? "  ok  " : " DRIFT"}  ${f.surface.padEnd(24)} ${f.detail}`);
  if (drift.length) {
    console.log(`\n${drift.length} surface(s) drifted — repair in this order:`);
    drift.forEach((f, i) => f.repair && console.log(`  ${i + 1}. ${f.repair}`));
    console.log("\nthen re-measure: npm run lesson:quality && npx vitest run tests/unit && npm run handoff:check");
  } else {
    console.log("\nno drift: the tree matches every shipped payload and every pinned literal.");
  }
}
process.exit(drift.length ? 1 : 0);
