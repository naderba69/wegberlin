import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DOCS_ONLY_DEPLOYMENT_POLICY="vercel-docs-only-build-skip-v1";
const ROOT_MARKDOWN=/^[^/]+\.md$/iu;
const DOCS_MARKDOWN=/^docs\/.+\.md$/iu;
const GENERATED_DOCS_PREFIX="docs/generated/";

export function classifyDeploymentChanges(paths){
 const normalized=[...new Set(paths.map(value=>String(value).trim()).filter(Boolean))];
 if(!normalized.length)return{policyVersion:DOCS_ONLY_DEPLOYMENT_POLICY,decision:"build",reason:"empty-or-unavailable-diff",paths:[]};
 if(normalized.some(path=>path.includes("\\")||path.includes("..")||path.startsWith("/")))return{policyVersion:DOCS_ONLY_DEPLOYMENT_POLICY,decision:"build",reason:"unsafe-path",paths:normalized};
 const docsOnly=normalized.every(path=>ROOT_MARKDOWN.test(path)||(DOCS_MARKDOWN.test(path)&&!path.startsWith(GENERATED_DOCS_PREFIX)));
 return{policyVersion:DOCS_ONLY_DEPLOYMENT_POLICY,decision:docsOnly?"skip":"build",reason:docsOnly?"markdown-documentation-only":"runtime-build-or-generated-governance-change",paths:normalized};
}

function changedPaths(){
 const current=process.env.VERCEL_GIT_COMMIT_SHA?.trim(),previous=process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();
 const args=current&&previous?["diff","--name-only",previous,current,"--"]:["diff","--name-only","HEAD^","HEAD","--"];
 return execFileSync("git",args,{encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:10_000}).split(/\r?\n/u);
}

export function deploymentIgnoreExitCode(paths){return classifyDeploymentChanges(paths).decision==="skip"?0:1}

function main(){
 try{const result=classifyDeploymentChanges(changedPaths());console.log(`[${result.policyVersion}] ${result.decision}: ${result.reason}; files=${result.paths.length}`);process.exitCode=result.decision==="skip"?0:1}
 catch(error){console.log(`[${DOCS_ONLY_DEPLOYMENT_POLICY}] build: diff-unavailable-fail-open; ${error instanceof Error?error.message:"unknown error"}`);process.exitCode=1}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main();
