import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";describe("P2 post-deployment smoke workflow",()=>{it("runs only against an explicit deployed HTTPS origin and checks critical routes and headers",()=>{const script=readFileSync("scripts/smoke-deployment.mjs","utf8"),workflow=readFileSync("deployment/deployment-smoke.yml","utf8"),upload=readFileSync("TERMUX_REPLACE_REPO.sh","utf8");for(const route of["/today","/path","/library","/exams","/settings","/privacy","/offline"])expect(script).toContain(`\"${route}\"`);expect(script).toContain("content-security-policy");expect(script).toContain("x-content-type-options");expect(script).toContain("explicit HTTPS origin");expect(workflow).toContain("deployment_status");expect(workflow).toContain("workflow_dispatch");expect(workflow).toContain("github.event.deployment.environment == 'Production'");expect(workflow).toContain("github.event.deployment_status.state == 'success'");expect(readFileSync(".github/workflows/deployment-smoke.yml","utf8")).toBe(workflow);expect(workflow).toContain("environment_url");expect(workflow).toContain("vars.DEPLOYMENT_SMOKE_PRODUCTION_URL");expect(workflow).toContain("status=blocked-by-auth");expect(workflow).toContain("node scripts/smoke-deployment.mjs");expect(upload).toContain("for workflow in deployment/deployment-smoke.yml deployment/release-candidate.yml deployment/release.yml; do");expect(upload).toContain('cp "$workflow" ".github/workflows/$(basename "$workflow")"')})});

type SmokeModule = typeof import("../../scripts/smoke-deployment.mjs");
const smoke: Promise<SmokeModule> = import("../../scripts/smoke-deployment.mjs");
const goodHeaders = { "content-security-policy": "default-src 'self'; frame-ancestors 'none'", "x-content-type-options": "nosniff" };

describe("smoke outcome classification", () => {
  it("treats an authentication challenge as unverified, never as an app failure and never as a pass", async () => {
    const m = await smoke;
    expect(m.classifySmokeResponse({ status: 401, location: "", body: "", headers: {} }).outcome).toBe("blocked-by-auth");
    expect(m.classifySmokeResponse({ status: 403, location: "", body: "", headers: {} }).outcome).toBe("blocked-by-auth");
    expect(m.classifySmokeResponse({ status: 308, location: "https://vercel.com/login", body: "", headers: {} }).outcome).toBe("blocked-by-auth");
    const report = m.summarizeSmoke({ origin: "https://d.projects.vercel.app", routes: m.SMOKE_ROUTES, results: m.SMOKE_ROUTES.map((route) => ({ route, outcome: "blocked-by-auth" as const, issues: ["HTTP 401 authentication challenge"] })) });
    expect(report.status).toBe("blocked-by-auth");
    expect(report.passedCount).toBe(0);
    expect(report.failedCount).toBe(0);
  });

  it("fails on a real server error or missing header and passes only on all seven routes", async () => {
    const m = await smoke;
    expect(m.classifySmokeResponse({ status: 500, location: "", body: "", headers: goodHeaders }).outcome).toBe("failure");
    expect(m.classifySmokeResponse({ status: 200, body: "hello", headers: goodHeaders }).issues).toContain("app identity missing");
    expect(m.classifySmokeResponse({ status: 200, body: "Der Weg nach Berlin", headers: {} }).issues).toEqual(["CSP missing", "nosniff missing"]);
    const results = m.SMOKE_ROUTES.map((route) => ({ route, ...m.classifySmokeResponse({ status: 200, body: "الطريق إلى برلين", headers: goodHeaders }) }));
    expect(m.summarizeSmoke({ origin: "https://wegberlin.vercel.app", routes: m.SMOKE_ROUTES, results }).status).toBe("passed");
    expect(m.summarizeSmoke({ origin: "https://x", routes: m.SMOKE_ROUTES, results: results.slice(0, 6) }).status).toBe("incomplete");
  });

  it("follows only same-origin redirects and demands an explicit HTTPS origin", async () => {
    const m = await smoke;
    expect(m.classifySmokeResponse({ status: 308, location: "/today/", body: "", headers: {} }).outcome).toBe("retry");
    expect(m.normalizeOrigin("https://a.vercel.app/")).toBe("https://a.vercel.app");
    expect(m.normalizeOrigin("http://a.vercel.app")).toBeNull();
    expect(m.normalizeOrigin("https://a.vercel.app/evil/path")).toBeNull();
  });
});
