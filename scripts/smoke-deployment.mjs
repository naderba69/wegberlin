/**
 * Post-deployment smoke: live HTTPS routes and security headers on one explicit origin.
 *
 * A Vercel deployment URL can sit behind Vercel Authentication. That is an *unverified* run, never a
 * passed one and never an application failure, so the three outcomes are reported separately: a real
 * failure exits 1 with per-route reasons, an authentication-blocked run exits 1 naming the root cause
 * and the remedy. Nothing here bypasses or weakens protection.
 */

export const SMOKE_ROUTES = ["/today", "/path", "/library", "/exams", "/settings", "/privacy", "/offline"];
export const SMOKE_VERSION = "post-deployment-smoke-v2";
export const ORIGIN_PATTERN = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/;

const IDENTITY_PATTERN = /الطريق إلى برلين|Der Weg nach Berlin/;
const AUTH_HOSTS = ["vercel.sso.site", "vercel.com", "accounts.google.com"];

export function normalizeOrigin(value) {
  const base = String(value ?? "").replace(/\/+$/, "");
  if (!ORIGIN_PATTERN.test(base)) return null;
  return base;
}

/** Classifies one probe. `blocked-by-auth` is neither a pass nor a language/app failure. */
export function classifySmokeResponse({ status, location = "", body = "", headers = {} }) {
  const issues = [];
  if (status === 401 || status === 403) return { outcome: "blocked-by-auth", issues: [`HTTP ${status} authentication challenge`] };
  if (status >= 300 && status < 400) {
    const target = String(location ?? "");
    const external = AUTH_HOSTS.some((host) => target.includes(host)) || /\/(login|sso|authenticate)\b/iu.test(target);
    if (external) return { outcome: "blocked-by-auth", issues: [`redirected to an identity provider (${target || "no location"})`] };
    if (!target) return { outcome: "failure", issues: [`HTTP ${status} redirect without a location`] };
    return { outcome: "retry", issues: [], location: target };
  }
  if (status < 200 || status >= 300) return { outcome: "failure", issues: [`HTTP ${status}`] };
  const text = String(body ?? "");
  if (!IDENTITY_PATTERN.test(text)) issues.push("app identity missing");
  if (!String(headers?.["content-security-policy"] ?? "").includes("frame-ancestors 'none'")) issues.push("CSP missing");
  if (headers?.["x-content-type-options"] !== "nosniff") issues.push("nosniff missing");
  return { outcome: issues.length ? "failure" : "passed", issues };
}

export function summarizeSmoke({ origin, routes, results, now = new Date().toISOString() }) {
  const passed = results.filter((item) => item.outcome === "passed");
  const blocked = results.filter((item) => item.outcome === "blocked-by-auth");
  const failed = results.filter((item) => item.outcome === "failure");
  const issues = results.flatMap((item) => item.issues.map((issue) => `${item.route}: ${issue}`));
  return {
    format: "dwnb-post-deployment-smoke",
    version: SMOKE_VERSION,
    checkedAt: now,
    origin,
    routeCount: routes.length,
    passedCount: passed.length,
    blockedCount: blocked.length,
    failedCount: failed.length,
    issues,
    status: failed.length ? "failed" : blocked.length ? "blocked-by-auth" : passed.length === routes.length ? "passed" : "incomplete",
    boundary: "Live deployed HTTPS route and security-header smoke only; not a replacement for browser E2E, accessibility, or human review.",
  };
}

async function probe(url, redirectPolicy) {
  const response = await fetch(url, { redirect: redirectPolicy, signal: AbortSignal.timeout(15_000) });
  const headers = Object.fromEntries(response.headers.entries());
  const body = response.status >= 200 && response.status < 300 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location") ?? "", body, headers };
}

async function probeRoute(base, route) {
  let url = `${base}${route}`;
  for (let hop = 0; hop < 3; hop += 1) {
    const probeResult = await probe(url, "manual");
    const verdict = classifySmokeResponse(probeResult);
    if (verdict.outcome !== "retry") return verdict;
    const next = verdict.location.startsWith("http") ? verdict.location : `${new URL(url).origin}${verdict.location}`;
    if (!next.startsWith(base)) return { outcome: "blocked-by-auth", issues: [`left the smoke origin for ${next}`] };
    url = next;
  }
  return { outcome: "failure", issues: ["too many same-origin redirects"] };
}

async function main() {
  const base = normalizeOrigin(process.env.DEPLOYMENT_URL ?? process.argv[2] ?? "");
  if (!base) throw new Error("DEPLOYMENT_URL must be an explicit HTTPS origin.");
  const results = [];
  for (const route of SMOKE_ROUTES) {
    try {
      results.push({ route, ...(await probeRoute(base, route)) });
    } catch (error) {
      results.push({ route, outcome: "failure", issues: [error instanceof Error ? error.message : "request failed"] });
    }
  }
  const report = summarizeSmoke({ origin: base, routes: SMOKE_ROUTES, results });
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "failed") throw new Error(`Deployment smoke failed with ${report.failedCount} failing route(s).`);
  if (report.status === "blocked-by-auth") {
    throw new Error(`Deployment smoke could not verify the app: ${report.blockedCount}/${report.routeCount} routes are behind Vercel Authentication on ${base}. Point DEPLOYMENT_URL at the public production alias (or set DEPLOYMENT_SMOKE_PRODUCTION_URL) instead of the deployment-specific URL. Protection was not bypassed.`);
  }
  if (report.status !== "passed") throw new Error(`Deployment smoke incomplete: ${report.passedCount}/${report.routeCount} routes verified.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^\.\/+/, ""))) await main();
