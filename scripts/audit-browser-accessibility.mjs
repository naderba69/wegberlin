#!/usr/bin/env node
// Browser-level accessibility and runtime audit of every prerendered page.
//
// Why this exists: scripts/audit-static-contrast.mjs reads declared colours and
// does not apply `opacity` inherited from parents, so it reported 0 failures
// while real pages had 2.1:1 text (e.g. `.empty{opacity:.55}`) and 4.1:1 text on
// tinted panels. This audit lets Chromium compute the colours the learner sees,
// then runs axe (WCAG 2.0/2.1/2.2 A and AA) on each page.
//
// Requirements: a running production server (`npm run build && npm run start`)
// and a Chromium that Playwright can launch. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
// to use a system Chromium. Not part of `npm run check`: it needs a browser and
// takes several minutes. Run it with `npm run a11y:browser`.
//
// Exit code 1 when any page has a serious or critical axe violation, a console
// error, or an uncaught page error, or when a page fails to load.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 412, height: 915 },
};
const requested = (process.argv.find((a) => a.startsWith("--viewport=")) || "--viewport=desktop,mobile").slice("--viewport=".length).split(",");
const CONCURRENCY = 3;
const OUT = resolve(root, "reports/browser-accessibility-audit.json");
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const IGNORED_CONSOLE = [/WebGPU/, /Failed to load resource: the server responded with a status of 404/];

function pageRoutes() {
  const manifest = JSON.parse(readFileSync(resolve(root, ".next/prerender-manifest.json"), "utf8"));
  return Object.keys(manifest.routes)
    .filter((route) => !route.startsWith("/_"))
    .filter((route) => !/\.[a-z0-9]+$/i.test(route)) // favicon.ico, manifest.webmanifest are not pages
    .sort();
}

async function auditPage(browser, route, viewportName) {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewportName], locale: "ar-TN", reducedMotion: "reduce" });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !IGNORED_CONSOLE.some((pattern) => pattern.test(message.text()))) consoleErrors.push(message.text().slice(0, 200));
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message).slice(0, 200)));
  const record = { route, viewport: viewportName, status: null, loadError: null, consoleErrors, pageErrors, violations: [], contrast: [] };
  try {
    const response = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90_000 });
    record.status = response ? response.status() : null;
    await page.waitForTimeout(400);
    const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    record.violations = result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? "minor",
      nodes: violation.nodes.length,
      help: violation.help,
      sample: (violation.nodes[0]?.html ?? "").slice(0, 160),
    }));
    // Keep the measured colour pair for every contrast failure so a fix can be checked by hand.
    const contrastResult = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    for (const violation of contrastResult.violations) {
      for (const node of violation.nodes.slice(0, 20)) {
        const data = node.any[0]?.data ?? {};
        record.contrast.push({ target: node.target.join(" "), fg: data.fgColor, bg: data.bgColor, ratio: data.contrastRatio, required: data.expectedContrastRatio });
      }
    }
  } catch (error) {
    record.loadError = String(error.message).slice(0, 300);
  } finally {
    await context.close();
  }
  return record;
}

async function main() {
  const routes = pageRoutes();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  const jobs = [];
  for (const viewport of requested) for (const route of routes) jobs.push({ route, viewport });
  const records = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      records.push(await auditPage(browser, job.route, job.viewport));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  const failing = records.filter((r) => r.loadError || r.status !== 200 || r.consoleErrors.length || r.pageErrors.length || r.violations.some((v) => v.impact === "serious" || v.impact === "critical"));
  const byRule = {};
  for (const r of records) for (const v of r.violations) {
    const key = `${v.id}:${v.impact}`;
    byRule[key] = (byRule[key] || 0) + 1;
  }
  const summary = {
    format: "dwnb-browser-accessibility-audit",
    version: "browser-accessibility-audit-v1",
    base: "production build served locally",
    viewports: requested,
    pages: routes.length,
    checks: jobs.length,
    failingChecks: failing.length,
    loadErrors: records.filter((r) => r.loadError).length,
    consoleErrorChecks: records.filter((r) => r.consoleErrors.length).length,
    pageErrorChecks: records.filter((r) => r.pageErrors.length).length,
    violationsByRule: byRule,
    failing: failing.map((r) => ({ route: r.route, viewport: r.viewport, status: r.status, loadError: r.loadError, consoleErrors: r.consoleErrors, pageErrors: r.pageErrors, serious: r.violations.filter((v) => v.impact === "serious" || v.impact === "critical") })),
    minorOrModerateViolations: records.reduce((n, r) => n + r.violations.filter((v) => v.impact !== "serious" && v.impact !== "critical").length, 0),
    contrastFailures: records.flatMap((r) => r.contrast.map((c) => ({ route: r.route, viewport: r.viewport, ...c }))).sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0)).slice(0, 200),
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(summary, null, 2) + "\n");
  console.log(`Browser accessibility audit: ${routes.length} pages × ${requested.join("+")} = ${jobs.length} checks · failing ${summary.failingChecks} · load errors ${summary.loadErrors} · console-error checks ${summary.consoleErrorChecks} · page-error checks ${summary.pageErrorChecks}`);
  console.log(`Violations by rule: ${JSON.stringify(byRule)}`);
  console.log(`Report: ${OUT}`);
  if (summary.failingChecks > 0) {
    console.error("Browser accessibility audit failed. See the report's `failing` list.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
