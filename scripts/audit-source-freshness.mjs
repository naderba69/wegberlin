import { readFile } from "node:fs/promises";

const registryPath = new URL("../src/config/source-verification-registry.json", import.meta.url);
const DAY_MS = 86_400_000;
const args = new Set(process.argv.slice(2));
const asOfArg = process.argv.slice(2).find((value) => value.startsWith("--as-of="));
const defaultAsOf = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const asOf = asOfArg ? asOfArg.slice("--as-of=".length) : defaultAsOf;
const failOnDue = args.has("--fail-on=due");
const strict = args.has("--strict") || failOnDue;
const probe = args.has("--probe");

function fail(message) {
  throw new Error(`Source freshness audit failed: ${message}`);
}

function day(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`invalid date ${JSON.stringify(value)}`);
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) fail(`unparseable date ${JSON.stringify(value)}`);
  return timestamp;
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
if (registry.schemaVersion !== 1 || registry.policyVersion !== "source-freshness-v1") fail("unsupported registry policy");
if (registry.calendarTimeZone !== "Africa/Tunis") fail("unexpected policy calendar timezone");
if (!Number.isInteger(registry.warningBeforeExpiryDays) || registry.warningBeforeExpiryDays < 1) fail("invalid warning window");
if (!Array.isArray(registry.records) || registry.records.length === 0) fail("registry has no records");

const requiredStrings = ["id", "category", "service", "organization", "title", "url", "lastVerifiedAt", "verificationMode", "observedState", "claimAr", "staleAction"];
const ids = new Set();
const checks = [];
for (const record of registry.records) {
  for (const field of requiredStrings) if (typeof record[field] !== "string" || record[field].trim() === "") fail(`${record.id || "record"}.${field} is empty`);
  if (ids.has(record.id)) fail(`duplicate ID ${record.id}`);
  ids.add(record.id);
  if (!record.url.startsWith("https://")) fail(`${record.id} is not HTTPS`);
  if (record.verificationMode !== "manual-semantic-review") fail(`${record.id} must require manual semantic review`);
  if (!Number.isInteger(record.maxAgeDays) || record.maxAgeDays < 1 || record.maxAgeDays > 366) fail(`${record.id} has invalid maxAgeDays`);

  const ageDays = Math.floor((day(asOf) - day(record.lastVerifiedAt)) / DAY_MS);
  const daysUntilDue = record.maxAgeDays - ageDays;
  const dueAt = new Date(day(record.lastVerifiedAt) + record.maxAgeDays * DAY_MS).toISOString().slice(0, 10);
  const status = ageDays < 0 ? "CLOCK_ERROR" : ageDays > record.maxAgeDays ? "STALE" : daysUntilDue <= registry.warningBeforeExpiryDays ? "DUE_SOON" : "FRESH";
  checks.push({ record, ageDays, daysUntilDue, dueAt, status });
}

if (probe) {
  for (const check of checks) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const headers = { "user-agent": "Der-Weg-nach-Berlin-source-audit/1.0" };
      if (/\.(?:pdf|zip)(?:$|\?)/i.test(check.record.url)) headers.range = "bytes=0-2047";
      const response = await fetch(check.record.url, {
        redirect: "follow",
        signal: controller.signal,
        headers,
      });
      const manual403 = response.status === 403 && check.record.probePolicy === "manual-on-403";
      check.probe = manual403 ? "HTTP 403 (official anti-bot response; manual check required)" : response.ok || response.status === 206 ? `HTTP ${response.status}` : `HTTP ${response.status} FAILED`;
      if (!(response.ok || response.status === 206 || manual403)) check.probeFailed = true;
      await response.body?.cancel();
    } catch (error) {
      check.probe = `FAILED ${error instanceof Error ? error.message : String(error)}`;
      check.probeFailed = true;
    } finally {
      clearTimeout(timer);
    }
  }
}

console.log(`Source freshness audit (${registry.policyVersion}) as of ${asOf}:`);
for (const check of checks) {
  console.log(`- ${check.status.padEnd(11)} ${check.record.id} · verified ${check.record.lastVerifiedAt} · due ${check.dueAt}${check.probe ? ` · ${check.probe}` : ""}`);
}
const counts = checks.reduce((result, check) => {
  result[check.status] = (result[check.status] ?? 0) + 1;
  return result;
}, {});
console.log(`Summary: ${checks.length} records · fresh ${counts.FRESH ?? 0} · due soon ${counts.DUE_SOON ?? 0} · stale ${counts.STALE ?? 0} · clock errors ${counts.CLOCK_ERROR ?? 0}`);
console.log("Boundary: HTTP reachability never proves that an exam format, quota, price, or terms stayed semantically unchanged; a human review remains required.");

const hasStale = checks.some((check) => check.status === "STALE" || check.status === "CLOCK_ERROR");
const hasDue = checks.some((check) => check.status === "DUE_SOON");
const hasProbeFailure = checks.some((check) => check.probeFailed);
if ((strict && hasStale) || (failOnDue && hasDue) || hasProbeFailure) process.exitCode = 1;
