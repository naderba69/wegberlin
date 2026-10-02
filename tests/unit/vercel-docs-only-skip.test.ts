// @vitest-environment node
import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";
import{DOCS_ONLY_DEPLOYMENT_POLICY,classifyDeploymentChanges,deploymentIgnoreExitCode}from"../../scripts/vercel-ignore-docs-only.mjs";
describe("P2 Vercel documentation-only deployment skip",()=>{
 it("skips root and authored docs Markdown only",()=>{expect(DOCS_ONLY_DEPLOYMENT_POLICY).toBe("vercel-docs-only-build-skip-v1");const r=classifyDeploymentChanges(["README.md","docs/MASTER_SPEC.md","docs/adr/ADR-067-test.md"]);expect(r).toMatchObject({policyVersion:DOCS_ONLY_DEPLOYMENT_POLICY,decision:"skip",reason:"markdown-documentation-only"});expect(deploymentIgnoreExitCode(r.paths)).toBe(0)});
 it("builds for any runtime, package, public, test, workflow, or deployment change",()=>{for(const path of["src/app/page.tsx","package-lock.json","public/sw.js","tests/unit/x.test.ts",".github/workflows/ci.yml","vercel.json"]){const r=classifyDeploymentChanges(["README.md",path]);expect(r.decision,path).toBe("build");expect(deploymentIgnoreExitCode(r.paths)).toBe(1)}});
 it("builds for generated governance reports even when they are Markdown",()=>{expect(classifyDeploymentChanges(["docs/generated/LANGUAGE_BOUNDARY_REPORT.md"]).decision).toBe("build")});
 it("fails open to a build for empty or unavailable diffs",()=>{expect(classifyDeploymentChanges([])).toMatchObject({decision:"build",reason:"empty-or-unavailable-diff"});expect(deploymentIgnoreExitCode([])).toBe(1)});
 it("fails open for absolute, traversal, or backslash paths",()=>{for(const path of["/README.md","docs/../README.md","docs\\guide.md"])expect(classifyDeploymentChanges([path])).toMatchObject({decision:"build",reason:"unsafe-path"})});
 it("wires the fail-open command into Vercel without disabling main deployment",()=>{const config=JSON.parse(readFileSync("vercel.json","utf8")),source=readFileSync("scripts/vercel-ignore-docs-only.mjs","utf8");expect(config.ignoreCommand).toBe("node scripts/vercel-ignore-docs-only.mjs");expect(config.git.deploymentEnabled.main).toBe(true);expect(source).toContain("diff-unavailable-fail-open");expect(source).toContain("process.exitCode=1")});
});
