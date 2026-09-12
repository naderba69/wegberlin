import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import {
  SECURITY_HEADERS_POLICY_VERSION,
  contentSecurityPolicyDirectives,
  securityHeaderExceptions,
  securityHeaders,
  serializeContentSecurityPolicy,
} from "../src/config/security-headers";

const REPORT_PATH="reports/security-headers-audit.json";
const issues:string[]=[];
const directives=Object.fromEntries(Object.entries(contentSecurityPolicyDirectives).map(([key,values])=>[key,[...values]]));
const requiredDirectives=["default-src","base-uri","object-src","frame-src","frame-ancestors","form-action","script-src","script-src-attr","style-src","img-src","font-src","media-src","worker-src","manifest-src","connect-src"];
for(const directive of requiredDirectives)if(!directives[directive]?.length)issues.push(`Missing CSP directive ${directive}.`);
for(const [directive,values] of Object.entries(directives)){
  const stringValues=values as string[];
  if(stringValues.includes("*"))issues.push(`${directive} contains a global wildcard.`);
  if(stringValues.includes("https:")||stringValues.includes("http:"))issues.push(`${directive} permits an entire network scheme.`);
}
if((directives["script-src"] as readonly string[]|undefined)?.includes("'unsafe-eval'"))issues.push("Generic unsafe-eval is forbidden.");
if(!directives["script-src"]?.includes("'wasm-unsafe-eval'"))issues.push("Pinned browser model WASM compilation is not declared.");
if(!directives["object-src"]?.includes("'none'")||!directives["frame-ancestors"]?.includes("'none'"))issues.push("Object or framing denial is incomplete.");
const requiredConnections=["'self'","https://generativelanguage.googleapis.com","https://openrouter.ai","https://huggingface.co","https://cdn-lfs.huggingface.co","https://cdn-lfs-us-1.huggingface.co","https://cas-bridge.xethub.hf.co","http://localhost:*","https://localhost:*","http://127.0.0.1:*","https://127.0.0.1:*","http://[::1]:*","https://[::1]:*"];
if(JSON.stringify(directives["connect-src"])!==JSON.stringify(requiredConnections))issues.push("connect-src differs from the audited AI/WebGPU/local-Ollama allowlist.");
for(const exception of securityHeaderExceptions)for(const directive of exception.directives)if(!directives[directive]?.includes(exception.token))issues.push(`Documented exception ${exception.token} is absent from ${directive}.`);
const headerMap=Object.fromEntries(securityHeaders.map((header)=>[header.key,header.value]));
for(const key of ["Content-Security-Policy","X-Content-Type-Options","Referrer-Policy","Permissions-Policy","X-Frame-Options","Cross-Origin-Opener-Policy","X-DWNB-Security-Policy"])if(!headerMap[key])issues.push(`Missing HTTP security header ${key}.`);
if(headerMap["Content-Security-Policy"]!==serializeContentSecurityPolicy())issues.push("Serialized CSP header drifted from its directive registry.");
if(headerMap["X-DWNB-Security-Policy"]!==SECURITY_HEADERS_POLICY_VERSION)issues.push("Security policy marker drifted.");
const policySha256=createHash("sha256").update(JSON.stringify({directives,headers:securityHeaders,exceptions:securityHeaderExceptions})).digest("hex");
const report={format:"dwnb-security-headers-audit",version:"security-headers-audit-v1",policyVersion:SECURITY_HEADERS_POLICY_VERSION,ok:issues.length===0,policySha256,directiveCount:Object.keys(directives).length,headerCount:securityHeaders.length,externalConnectOrigins:requiredConnections.filter((value)=>value.startsWith("https://")&&!value.includes("localhost")&&!value.includes("127.0.0.1")&&!value.includes("[::1]")),localOllamaOrigins:requiredConnections.filter((value)=>value.includes("localhost")||value.includes("127.0.0.1")||value.includes("[::1]")),documentedExceptions:securityHeaderExceptions.map((item)=>({token:item.token,directives:[...item.directives],reason:item.reason})),globalWildcardTokens:0,genericUnsafeEval:false,issues};
const serialized=`${JSON.stringify(report,null,2)}\n`;
if(process.argv.includes("--write"))writeFileSync(REPORT_PATH,serialized);
else{
  let current="";try{current=readFileSync(REPORT_PATH,"utf8")}catch{issues.push(`${REPORT_PATH} is missing.`)}
  if(current&&current!==serialized)throw new Error("Security headers audit artifact is stale; run npm run security:audit:write.");
}
if(issues.length)throw new Error(`Security headers audit failed:\n- ${issues.join("\n- ")}`);
console.log(`Security headers audit PASS: ${report.directiveCount} CSP directives, ${report.headerCount} headers, no global wildcard, SHA-256 ${policySha256}.`);
