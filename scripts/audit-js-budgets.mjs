import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { discoverBuiltPayloads } from "./lib/built-payloads.mjs";

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.name.endsWith(".js")) files.push(file);
  }
  return files;
}

export async function auditJavaScriptBudgets({ projectRoot = process.cwd() } = {}) {
  const layout = await discoverBuiltPayloads(projectRoot);
  const files = await walk(join(layout.nextStaticRoot, "chunks"));
  const rows = [];
  for (const file of files) {
    const bytes = await readFile(file);
    rows.push({ path: relative(projectRoot, file), rawBytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 9 }).length });
  }
  rows.sort((a, b) => b.gzipBytes - a.gzipBytes);
  const total = rows.reduce((sum, row) => sum + row.gzipBytes, 0);
  const max = rows[0]?.gzipBytes ?? 0;
  const budgets = {totalChunkGzipBytes:2500000,maxSingleChunkGzipBytes:750000};
  const safetyMarginPercent=15;
  const safetyFactor = 1 - safetyMarginPercent / 100;
  const safetyCeilings = {
    totalChunkGzipBytes: Math.floor(budgets.totalChunkGzipBytes * safetyFactor),
    maxSingleChunkGzipBytes: Math.floor(budgets.maxSingleChunkGzipBytes * safetyFactor),
  };
  const issues = [];
  if (!rows.length) issues.push("No built JavaScript chunks were found.");
  if (total > safetyCeilings.totalChunkGzipBytes) issues.push(`total ${total} > safety ceiling ${safetyCeilings.totalChunkGzipBytes}`);
  if (max > safetyCeilings.maxSingleChunkGzipBytes) issues.push(`chunk ${max} > safety ceiling ${safetyCeilings.maxSingleChunkGzipBytes}`);
  const report = {
    format: "dwnb-js-budget-report", version: "js-budget-v1", generatedAt: "2026-09-10",
    safetyMarginPercent, budgets, safetyCeilings,
    actual: { chunkCount: rows.length, totalChunkGzipBytes: total, maxSingleChunkGzipBytes: max },
    issues, largest: rows.slice(0, 20),
    boundary: "Built Next static chunk gzip envelope with a mandatory 15% reserve below hard limits; not network waterfall or device performance.",
  };
  await writeFile(join(projectRoot, "reports/js-budget-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (issues.length) throw new Error(`JavaScript budget failed: ${issues.join(", ")}`);
  console.log(`JavaScript budget passed: ${rows.length} chunks / ${total} gzip bytes / max ${max} (${layout.kind})`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await auditJavaScriptBudgets();
