// Dependency vulnerability gate (npm audit, network required).
// Rules:
//  1. Production dependencies: zero high or critical findings. Any finding fails.
//  2. Development-only findings: allowed ONLY for the accepted set below.
//     Anything new (another advisory, another package, or a new development path) fails.
// Accepted development-only risk (decision recorded in AUDIT_FIX_RESULTS_2026-10-10_AR.md §19.2):
//   braces GHSA-vfj7-8cjw-p6xm (stack exhaustion via deeply nested glob patterns, no fixed version),
//   reached only through eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces.
//   It runs only on the developer's machine against this repository's own glob patterns.
import { execFileSync } from "node:child_process";

const ACCEPTED_DEV_ADVISORIES = new Set(["GHSA-vfj7-8cjw-p6xm"]);
const ACCEPTED_DEV_PACKAGES = new Set(["braces", "micromatch", "fast-glob"]);
// Carrier packages: they have no advisory of their own and only pass the accepted chain upward.
const CARRIER_PACKAGES = new Set(["eslint-config-next", "@next/eslint-plugin-next"]);

function auditJson(extra) {
  try {
    return JSON.parse(execFileSync("npm", ["audit", "--json", ...extra], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    // npm audit exits non-zero when findings exist; the JSON is still on stdout.
    if (error.stdout) return JSON.parse(String(error.stdout));
    throw error;
  }
}

const prod = auditJson(["--omit=dev"]);
const all = auditJson([]);

const prodBad = Object.entries(prod.vulnerabilities ?? {}).filter(([, v]) => v.severity === "high" || v.severity === "critical");
const devOnly = Object.entries(all.vulnerabilities ?? {}).filter(([name]) => !prod.vulnerabilities?.[name]);

const unexpected = [];
const acceptedHits = new Set();
for (const [name, v] of devOnly) {
  const via = v.via ?? [];
  const advisories = via.filter((x) => typeof x === "object");
  const advisoryIds = advisories.map((x) => (x.url ?? "").split("/").pop());
  const carrierOnly = advisories.length === 0 && via.every((x) => typeof x === "string" && (CARRIER_PACKAGES.has(x) || ACCEPTED_DEV_PACKAGES.has(x)));
  const leafOk = advisories.length > 0 && ACCEPTED_DEV_PACKAGES.has(name) && advisoryIds.every((id) => ACCEPTED_DEV_ADVISORIES.has(id));
  if (leafOk) advisoryIds.forEach((id) => acceptedHits.add(id));
  else if (!(carrierOnly && (CARRIER_PACKAGES.has(name) || ACCEPTED_DEV_PACKAGES.has(name)))) {
    unexpected.push(`${name} (${v.severity}) advisories: ${advisoryIds.join(", ") || "none"}`);
  }
}
if (devOnly.length > 0 && acceptedHits.size === 0) unexpected.push("development findings exist but none matches the accepted advisory");

const failures = [];
if (prodBad.length) failures.push(`production high/critical: ${prodBad.map(([n]) => n).join(", ")}`);
if (unexpected.length) failures.push(`unaccepted development findings: ${unexpected.join("; ")}`);

if (failures.length) {
  console.error("Dependency audit failed:\n- " + failures.join("\n- "));
  process.exitCode = 1;
} else {
  const prodTotal = prod.metadata?.vulnerabilities?.total ?? 0;
  console.log(`Dependency audit passed: production ${prodTotal} findings · development-only ${devOnly.length} accepted (${[...ACCEPTED_DEV_PACKAGES].join(", ")}) · no high/critical in production.`);
}
